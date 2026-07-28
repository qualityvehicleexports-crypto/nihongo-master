import { NextResponse } from "next/server";
import { canAccessLearner, getSession, type SessionPayload } from "./auth";
import { getAccountById, type Account } from "./repo/accounts";
import { getLearner, type Learner } from "./repo/learners";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Any logged-in principal — owner or learner. For endpoints that need
 * "someone is signed in" but nothing learner- or owner-specific (e.g.
 * fetching quiz questions, which aren't scoped to a particular learner). */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "ログインが必要です。");
  return session;
}

/** Owner-only. Rejects a learner session with 403 rather than 401, since the
 * caller IS authenticated — they just aren't allowed to manage learners,
 * billing, etc. Used for account/learner-management and billing routes. */
export async function requireAccount(): Promise<Account> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "ログインが必要です。");
  if (session.role !== "owner") {
    throw new ApiError(403, "この操作には所有者アカウントでのログインが必要です。");
  }
  const account = await getAccountById(session.accountId);
  if (!account) throw new ApiError(401, "アカウントが見つかりません。");
  return account;
}

/** Owner-only ownership check — the learner must belong to this specific
 * account. Pair with requireAccount() for actions only the owner may take on
 * a learner (delete, issue/reissue login credentials). For endpoints a
 * learner may also call on their own data, use requireLearnerAccess()
 * instead. */
export async function requireOwnedLearner(learnerId: string, accountId: string): Promise<Learner> {
  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== accountId) {
    throw new ApiError(404, "学習者プロフィールが見つかりません。");
  }
  return learner;
}

/** Owner-or-self access to one learner's data. An owner session may reach
 * any learner under its own account (so the school/owner can keep seeing
 * everyone's progress); a learner session may only reach itself — this is
 * what keeps the 20 learners under one owner from seeing each other's
 * learning content. Used by quiz/mock-exam submission, progress, AI
 * insights, study-time tracking, and self-service profile updates. */
export async function requireLearnerAccess(learnerId: string): Promise<Learner> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "ログインが必要です。");
  const learner = await getLearner(learnerId);
  if (!learner || !canAccessLearner(session, learner)) {
    throw new ApiError(404, "学習者プロフィールが見つかりません。");
  }
  return learner;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
}
