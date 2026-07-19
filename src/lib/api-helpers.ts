import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { getAccountById, type Account } from "./repo/accounts";
import { getLearner } from "./repo/learners";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAccount(): Promise<Account> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "ログインが必要です。");
  const account = await getAccountById(session.accountId);
  if (!account) throw new ApiError(401, "アカウントが見つかりません。");
  return account;
}

export async function requireOwnedLearner(learnerId: string, accountId: string) {
  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== accountId) {
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
