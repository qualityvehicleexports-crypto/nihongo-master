import { all, get, run } from "../db";
import { newId } from "../ids";
import { getAccountById } from "./accounts";
import { isLanguageCode } from "../i18n/languages";
import { hashPassword } from "../auth";

export interface Learner {
  id: string;
  account_id: string;
  display_name: string;
  avatar_color: string;
  current_level_code: string;
  target_level_code: string;
  target_exam_date: string | null;
  ui_language: string;
  login_id: string | null;
  password_hash: string | null;
  created_at: string;
}

/** Learner shape safe to send to the client: never include password_hash.
 * Every place that serializes a Learner into a page prop or a JSON response
 * must go through this — see src/app/dashboard/page.tsx and
 * src/app/api/learners/*.ts. */
export type PublicLearner = Omit<Learner, "password_hash">;

export function toPublicLearner(learner: Learner): PublicLearner {
  const { password_hash: _passwordHash, ...rest } = learner;
  return rest;
}

const AVATAR_COLORS = [
  "#2a78d6", // blue
  "#008300", // green
  "#e87ba4", // magenta
  "#eda100", // yellow
  "#1baf7a", // aqua
  "#eb6834", // orange
  "#4a3aa7", // violet
  "#e34948", // red
];

export async function listLearners(accountId: string): Promise<Learner[]> {
  return all<Learner>("SELECT * FROM learners WHERE account_id = ? ORDER BY created_at ASC", [accountId]);
}

export async function countLearners(accountId: string): Promise<number> {
  const row = await get<{ c: number }>("SELECT COUNT(*) as c FROM learners WHERE account_id = ?", [accountId]);
  return row?.c ?? 0;
}

export class LearnerCapReachedError extends Error {
  constructor(max: number) {
    super(`This account's plan allows up to ${max} learner profiles.`);
    this.name = "LearnerCapReachedError";
  }
}

export async function createLearner(
  accountId: string,
  displayName: string,
  targetLevelCode = "N1",
  uiLanguage = "ja",
): Promise<Learner> {
  const account = await getAccountById(accountId);
  if (!account) throw new Error("Account not found");

  const current = await countLearners(accountId);
  if (current >= account.max_learners) {
    throw new LearnerCapReachedError(account.max_learners);
  }

  const id = newId("lrn");
  const avatarColor = AVATAR_COLORS[current % AVATAR_COLORS.length];
  const language = isLanguageCode(uiLanguage) ? uiLanguage : "ja";
  await run(
    `INSERT INTO learners (id, account_id, display_name, avatar_color, current_level_code, target_level_code, ui_language)
     VALUES (?, ?, ?, ?, 'N5', ?, ?)`,
    [id, accountId, displayName.trim(), avatarColor, targetLevelCode, language],
  );
  const learner = await get<Learner>("SELECT * FROM learners WHERE id = ?", [id]);
  if (!learner) throw new Error("Failed to create learner");
  return learner;
}

export async function getLearner(id: string): Promise<Learner | undefined> {
  return get<Learner>("SELECT * FROM learners WHERE id = ?", [id]);
}

export async function deleteLearner(id: string): Promise<void> {
  await run("DELETE FROM learners WHERE id = ?", [id]);
}

export async function updateLearnerLevel(id: string, levelCode: string): Promise<void> {
  await run("UPDATE learners SET current_level_code = ? WHERE id = ?", [levelCode, id]);
}

export async function updateLearnerTarget(id: string, targetLevelCode: string, targetExamDate: string | null): Promise<void> {
  await run("UPDATE learners SET target_level_code = ?, target_exam_date = ? WHERE id = ?", [
    targetLevelCode,
    targetExamDate,
    id,
  ]);
}

export async function updateLearnerLanguage(id: string, uiLanguage: string): Promise<void> {
  const language = isLanguageCode(uiLanguage) ? uiLanguage : "ja";
  await run("UPDATE learners SET ui_language = ? WHERE id = ?", [language, id]);
}

/** login_id is unique across the whole learners table (not just within one
 * account), since the shared login screen (POST /api/auth/login) looks a
 * candidate identifier up with no account context yet — it tries
 * accounts.email first, then falls back to this. */
export async function getLearnerByLoginId(loginId: string): Promise<Learner | undefined> {
  return get<Learner>("SELECT * FROM learners WHERE login_id = ?", [loginId.trim()]);
}

export class LoginIdTakenError extends Error {
  constructor(loginId: string) {
    super(`Login ID "${loginId}" is already in use.`);
    this.name = "LoginIdTakenError";
  }
}

/** Owner-issued sign-in credentials for a learner (see POST
 * /api/learners/[id]/credentials). Overwrites any previously-issued
 * credentials for this learner, so it doubles as "reissue" — the caller is
 * responsible for confirming that's intended (e.g. a lost-password reset). */
export async function issueLearnerCredentials(
  id: string,
  loginId: string,
  plaintextPassword: string,
): Promise<void> {
  const trimmedLoginId = loginId.trim();
  const existing = await getLearnerByLoginId(trimmedLoginId);
  if (existing && existing.id !== id) {
    throw new LoginIdTakenError(trimmedLoginId);
  }
  const passwordHash = await hashPassword(plaintextPassword);
  await run("UPDATE learners SET login_id = ?, password_hash = ? WHERE id = ?", [
    trimmedLoginId,
    passwordHash,
    id,
  ]);
}

/** Suggest a free login_id by appending an incrementing two-digit suffix to
 * `base` (e.g. "school" -> "school01", "school02", ...) until one isn't
 * already taken. Purely a UI convenience — the owner can still edit the
 * suggestion before it's saved, and issueLearnerCredentials() re-checks
 * uniqueness regardless. */
export async function suggestLoginId(base: string): Promise<string> {
  const slug = base.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  for (let i = 1; i <= 999; i++) {
    const candidate = `${slug}${String(i).padStart(2, "0")}`;
    if (!(await getLearnerByLoginId(candidate))) return candidate;
  }
  // Astronomically unlikely (would mean 999 collisions on one slug), but
  // keep the function total rather than possibly returning undefined.
  return `${slug}${Date.now().toString(36)}`;
}
