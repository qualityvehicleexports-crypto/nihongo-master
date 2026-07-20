import { all, get, run } from "../db";
import { newId } from "../ids";
import { getAccountById } from "./accounts";
import { isLanguageCode } from "../i18n/languages";

export interface Learner {
  id: string;
  account_id: string;
  display_name: string;
  avatar_color: string;
  current_level_code: string;
  target_level_code: string;
  target_exam_date: string | null;
  ui_language: string;
  created_at: string;
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
