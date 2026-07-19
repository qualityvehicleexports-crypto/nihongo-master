import { all } from "../db";

export interface CategoryStat {
  category: string;
  total: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface LevelStat {
  levelId: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  attempts: number;
  correct: number;
  accuracy: number;
}

export async function accuracyByCategory(learnerId: string): Promise<CategoryStat[]> {
  const rows = await all<{ category: string; total: number; correct: number }>(
    `SELECT category, COUNT(*) as total, SUM(is_correct) as correct
     FROM quiz_attempts WHERE learner_id = ? GROUP BY category`,
    [learnerId],
  );
  return rows.map((r) => ({
    category: r.category,
    total: r.total,
    correct: r.correct,
    accuracy: r.total > 0 ? r.correct / r.total : 0,
  }));
}

export async function accuracyByLevel(learnerId: string): Promise<LevelStat[]> {
  const rows = await all<{ level_id: string; total: number; correct: number }>(
    `SELECT level_id, COUNT(*) as total, SUM(is_correct) as correct
     FROM quiz_attempts WHERE learner_id = ? GROUP BY level_id`,
    [learnerId],
  );
  return rows.map((r) => ({
    levelId: r.level_id,
    total: r.total,
    correct: r.correct,
    accuracy: r.total > 0 ? r.correct / r.total : 0,
  }));
}

export async function dailyActivity(learnerId: string, days = 30): Promise<DailyStat[]> {
  const rows = await all<{ date: string; attempts: number; correct: number }>(
    `SELECT substr(answered_at, 1, 10) as date, COUNT(*) as attempts, SUM(is_correct) as correct
     FROM quiz_attempts
     WHERE learner_id = ? AND date(answered_at) >= date('now', ?)
     GROUP BY date
     ORDER BY date ASC`,
    [learnerId, `-${days} days`],
  );
  return rows.map((r) => ({
    date: r.date,
    attempts: r.attempts,
    correct: r.correct,
    accuracy: r.attempts > 0 ? r.correct / r.attempts : 0,
  }));
}

export interface OverallStats {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  activeDays: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
}

export async function overallStats(learnerId: string): Promise<OverallStats> {
  const row = await all<{
    total: number;
    correct: number;
    active_days: number;
    first_at: string | null;
    last_at: string | null;
  }>(
    `SELECT COUNT(*) as total, SUM(is_correct) as correct,
            COUNT(DISTINCT substr(answered_at,1,10)) as active_days,
            MIN(answered_at) as first_at, MAX(answered_at) as last_at
     FROM quiz_attempts WHERE learner_id = ?`,
    [learnerId],
  );
  const r = row[0];
  const total = r?.total ?? 0;
  const correct = r?.correct ?? 0;
  return {
    totalAttempts: total,
    totalCorrect: correct,
    accuracy: total > 0 ? correct / total : 0,
    activeDays: r?.active_days ?? 0,
    firstAttemptAt: r?.first_at ?? null,
    lastAttemptAt: r?.last_at ?? null,
  };
}
