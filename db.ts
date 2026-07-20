import { all, run } from "../db";
import { newId } from "../ids";

export interface AttemptInput {
  learnerId: string;
  questionId: string;
  levelId: string;
  category: string;
  isCorrect: boolean;
}

export async function recordAttempt(input: AttemptInput): Promise<void> {
  await run(
    `INSERT INTO quiz_attempts (id, learner_id, question_id, level_id, category, is_correct)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId("att"), input.learnerId, input.questionId, input.levelId, input.category, input.isCorrect ? 1 : 0],
  );
}

export interface AttemptRow {
  id: string;
  learner_id: string;
  question_id: string;
  level_id: string;
  category: string;
  is_correct: number;
  answered_at: string;
}

export async function listAttempts(learnerId: string): Promise<AttemptRow[]> {
  return all<AttemptRow>("SELECT * FROM quiz_attempts WHERE learner_id = ? ORDER BY answered_at ASC", [learnerId]);
}
