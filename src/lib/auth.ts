import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me-in-production";
const SESSION_COOKIE = "nm_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Two kinds of principal can hold a session: the account owner (e.g. a
// school administrator, logging in with the account's email) and an
// individual learner (logging in with a login_id issued by the owner — see
// src/lib/repo/learners.ts). Both carry accountId so account-scoped lookups
// work the same way regardless of who's signed in, but only an "owner"
// session may manage learners (create/delete/issue credentials) or billing —
// see requireAccount() in api-helpers.ts. A "learner" session is confined to
// its own learnerId; it can never enumerate or read another learner's data,
// which is what keeps the 20 learners under one owner from seeing each
// other's progress.
export type SessionPayload =
  | { role: "owner"; accountId: string; email: string }
  | { role: "learner"; learnerId: string; accountId: string; loginId: string };

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
    // Sessions signed before the owner/learner split (no `role` field) are
    // no longer valid shapes — treat them as logged-out rather than letting
    // them fall through as an unintended owner session.
    if (payload?.role !== "owner" && payload?.role !== "learner") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Can this session read/act on the given learner's data? Owners may access
 * any learner under their own account; a learner session may only access
 * itself. Used both by page-level guards and by requireLearnerAccess() in
 * api-helpers.ts, so the two never drift apart. */
export function canAccessLearner(
  session: SessionPayload,
  learner: { id: string; account_id: string },
): boolean {
  if (session.role === "owner") return learner.account_id === session.accountId;
  return session.learnerId === learner.id;
}

/** Set the session cookie on the response (call from a Route Handler). */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Read + verify the current session from the request cookies (server components / route handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
