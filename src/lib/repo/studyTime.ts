import { all, run } from "../db";
import { newId } from "../ids";

export type ActivityType = "quiz" | "browse";

// Sanity bounds for a single heartbeat/flush from StudyTimeTracker. Anything
// shorter than this is almost certainly a stray unmount and not real study
// time; anything longer suggests a stale tab (e.g. laptop sleep) rather than
// continuous active study, so it's capped instead of discarded outright.
const MIN_RECORDABLE_SECONDS = 3;
const MAX_SINGLE_REPORT_SECONDS = 30 * 60;

export async function recordStudySession(
  learnerId: string,
  activityType: ActivityType,
  levelId: string,
  durationSeconds: number,
): Promise<void> {
  if (!Number.isFinite(durationSeconds) || durationSeconds < MIN_RECORDABLE_SECONDS) return;
  const capped = Math.min(Math.round(durationSeconds), MAX_SINGLE_REPORT_SECONDS);

  await run(
    `INSERT INTO study_sessions (id, learner_id, activity_type, level_id, duration_seconds, started_at, ended_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', ?), datetime('now'))`,
    [newId("sess"), learnerId, activityType, levelId, capped, `-${capped} seconds`],
  );
}

export interface StudyTimeTotals {
  totalSeconds: number;
  quizSeconds: number;
  browseSeconds: number;
}

export async function studyTimeTotals(learnerId: string): Promise<StudyTimeTotals> {
  const rows = await all<{ activity_type: string; total: number }>(
    `SELECT activity_type, SUM(duration_seconds) as total FROM study_sessions WHERE learner_id = ? GROUP BY activity_type`,
    [learnerId],
  );
  let quizSeconds = 0;
  let browseSeconds = 0;
  for (const r of rows) {
    if (r.activity_type === "quiz") quizSeconds = r.total ?? 0;
    if (r.activity_type === "browse") browseSeconds = r.total ?? 0;
  }
  return { totalSeconds: quizSeconds + browseSeconds, quizSeconds, browseSeconds };
}

export interface DailyMinutes {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export async function dailyStudyMinutes(learnerId: string, days = 30): Promise<DailyMinutes[]> {
  const rows = await all<{ date: string; seconds: number }>(
    `SELECT substr(ended_at, 1, 10) as date, SUM(duration_seconds) as seconds
     FROM study_sessions
     WHERE learner_id = ? AND date(ended_at) >= date('now', ?)
     GROUP BY date
     ORDER BY date ASC`,
    [learnerId, `-${days} days`],
  );
  return rows.map((r) => ({ date: r.date, minutes: Math.round((r.seconds ?? 0) / 60) }));
}

async function secondsSince(learnerId: string, sinceModifier: string): Promise<number> {
  const row = await all<{ total: number }>(
    `SELECT SUM(duration_seconds) as total FROM study_sessions WHERE learner_id = ? AND date(ended_at) >= date('now', ?)`,
    [learnerId, sinceModifier],
  );
  return row[0]?.total ?? 0;
}

export async function minutesToday(learnerId: string): Promise<number> {
  return Math.round((await secondsSince(learnerId, "0 days")) / 60);
}

export async function minutesThisWeek(learnerId: string): Promise<number> {
  return Math.round((await secondsSince(learnerId, "-6 days")) / 60);
}

export async function lastActiveAt(learnerId: string): Promise<string | null> {
  const fromSessions = await all<{ last: string | null }>(
    "SELECT MAX(ended_at) as last FROM study_sessions WHERE learner_id = ?",
    [learnerId],
  );
  const fromAttempts = await all<{ last: string | null }>(
    "SELECT MAX(answered_at) as last FROM quiz_attempts WHERE learner_id = ?",
    [learnerId],
  );
  const candidates = [fromSessions[0]?.last, fromAttempts[0]?.last].filter(Boolean) as string[];
  if (candidates.length === 0) return null;
  return candidates.sort().at(-1) ?? null;
}

/**
 * Consecutive-day streak, counting a day as "active" if the learner either
 * logged any study_sessions time or answered any quiz on that date. Counts
 * back from today (or yesterday, if nothing happened yet today) so a
 * still-in-progress day doesn't reset the streak to 0 before the learner has
 * had a chance to study.
 */
export async function currentStreakDays(learnerId: string): Promise<number> {
  const rows = await all<{ date: string }>(
    `SELECT date FROM (
       SELECT substr(ended_at, 1, 10) as date FROM study_sessions WHERE learner_id = ?
       UNION
       SELECT substr(answered_at, 1, 10) as date FROM quiz_attempts WHERE learner_id = ?
     )
     ORDER BY date DESC`,
    [learnerId, learnerId],
  );
  const activeDates = new Set(rows.map((r) => r.date));
  if (activeDates.size === 0) return 0;

  const today = new Date();
  const toKey = (d: Date) => d.toISOString().slice(0, 10);

  let cursor = new Date(today);
  if (!activeDates.has(toKey(cursor))) {
    // Nothing logged yet today — start counting from yesterday instead so an
    // ongoing streak isn't reported as broken before the day is even over.
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDates.has(toKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDates.has(toKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}