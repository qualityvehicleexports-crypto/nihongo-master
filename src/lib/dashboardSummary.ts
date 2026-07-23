import { overallStats } from "./repo/progress";
import { currentStreakDays, lastActiveAt, minutesThisWeek, minutesToday, studyTimeTotals } from "./repo/studyTime";

// Lightweight per-learner summary for the account-owner-facing "who's
// studying?" screen (src/app/dashboard/page.tsx + LearnerGrid). Deliberately
// does NOT go through getAnalytics()/generateNarrativeWithClaude() — that
// pipeline calls the Anthropic API and is meant for one learner's own
// analytics page, not for rendering a card per learner on every dashboard
// load (which could mean up to 20 Claude calls per page view on a
// full-family_20 account).
export interface LearnerSummaryCard {
  learnerId: string;
  totalMinutes: number;
  minutesToday: number;
  minutesThisWeek: number;
  streakDays: number;
  lastActiveAt: string | null;
  overallAccuracy: number | null; // null = no quiz attempts yet
  totalAttempts: number;
}

export async function getLearnerSummaryCard(learnerId: string): Promise<LearnerSummaryCard> {
  const [overall, timeTotals, todayMinutes, weekMinutes, streakDays, lastActive] = await Promise.all([
    overallStats(learnerId),
    studyTimeTotals(learnerId),
    minutesToday(learnerId),
    minutesThisWeek(learnerId),
    currentStreakDays(learnerId),
    lastActiveAt(learnerId),
  ]);

  return {
    learnerId,
    totalMinutes: Math.round(timeTotals.totalSeconds / 60),
    minutesToday: todayMinutes,
    minutesThisWeek: weekMinutes,
    streakDays,
    lastActiveAt: lastActive,
    overallAccuracy: overall.totalAttempts > 0 ? overall.accuracy : null,
    totalAttempts: overall.totalAttempts,
  };
}

export async function getLearnerSummaryCards(learnerIds: string[]): Promise<Record<string, LearnerSummaryCard>> {
  const cards = await Promise.all(learnerIds.map((id) => getLearnerSummaryCard(id)));
  const map: Record<string, LearnerSummaryCard> = {};
  for (const card of cards) map[card.learnerId] = card;
  return map;
}