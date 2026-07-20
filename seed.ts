import { accuracyByCategory, accuracyByLevel, dailyActivity, overallStats } from "./repo/progress";
import { getLearner } from "./repo/learners";
import { listLevels, listGrammar, listVocab, type Level } from "./repo/content";
import { all, get, run } from "./db";
import { getDictionary, t, type Dictionary } from "./i18n";
import { languageMeta } from "./i18n/languages";

// ---------------------------------------------------------------------------
// AI progress-analysis engine.
//
// Three pieces, per the product spec:
//   1. weak-point visualization   -> categoryStats / levelStats below
//   2. pace & pass-probability    -> predictPace()
//   3. next-content recommendation-> recommendNextSteps()
//
// The numeric analysis (accuracy, trend, pace maths) is always rule-based —
// deterministic and cheap, and it's what actually powers the charts. On top
// of that, generateNarrative() optionally calls the Anthropic API to turn the
// numbers into a short, personalized written summary. If ANTHROPIC_API_KEY is
// not set (e.g. in this sandbox) it falls back to a template-based Japanese
// narrative built from the same numbers, so the feature always works end to
// end — set the key in production to upgrade the copy quality.
// ---------------------------------------------------------------------------

function categoryLabel(dict: Dictionary, category: string): string {
  const labels: Record<string, string> = {
    vocabulary: dict.category.vocabulary,
    grammar: dict.category.grammar,
    listening: dict.category.listening,
    reading: dict.category.reading,
  };
  return labels[category] ?? category;
}

export interface Analytics {
  learnerId: string;
  currentLevel: string;
  targetLevel: string;
  overall: Awaited<ReturnType<typeof overallStats>>;
  categoryStats: Awaited<ReturnType<typeof accuracyByCategory>>;
  levelStats: Awaited<ReturnType<typeof accuracyByLevel>>;
  dailyTrend: Awaited<ReturnType<typeof dailyActivity>>;
  weakestCategory: string | null;
  strongestCategory: string | null;
  readyForNextLevel: boolean;
  pace: PacePrediction;
  recommendations: Recommendation[];
  narrative: string;
  generatedAt: string;
}

export interface PacePrediction {
  confidence: "low" | "medium" | "high";
  passProbabilityPercent: number | null;
  estimatedWeeksToTarget: number | null;
  levelsRemaining: number;
  note: string;
}

export interface Recommendation {
  type: "quiz" | "vocab_review" | "grammar_review" | "level_up";
  title: string;
  description: string;
  levelId: string;
  category?: string;
}

function levelSortOrder(levels: Level[], code: string): number {
  return levels.find((l) => l.id === code)?.sort_order ?? 1;
}

function predictPace(
  dict: Dictionary,
  levels: Level[],
  currentLevel: string,
  targetLevel: string,
  overall: Analytics["overall"],
): PacePrediction {
  const currentOrder = levelSortOrder(levels, currentLevel);
  const targetOrder = levelSortOrder(levels, targetLevel);
  const levelsRemaining = Math.max(0, targetOrder - currentOrder);

  if (overall.totalAttempts < 10) {
    return {
      confidence: "low",
      passProbabilityPercent: null,
      estimatedWeeksToTarget: null,
      levelsRemaining,
      note: dict.pace.needMoreData,
    };
  }

  const accuracyScore = overall.accuracy; // 0..1
  const volumeScore = Math.min(1, overall.totalAttempts / 200);
  const consistencyScore = Math.min(1, overall.activeDays / 30);

  const passProbability = Math.round(
    (accuracyScore * 0.6 + volumeScore * 0.25 + consistencyScore * 0.15) * 100,
  );
  const clampedProbability = Math.min(97, Math.max(5, passProbability));

  const weeksPerLevel = Math.min(26, Math.max(6, 20 - accuracyScore * 8 - consistencyScore * 6));
  const estimatedWeeks = levelsRemaining > 0 ? Math.round(levelsRemaining * weeksPerLevel) : 0;

  const confidence: PacePrediction["confidence"] =
    overall.totalAttempts >= 60 && overall.activeDays >= 10 ? "high" : "medium";

  const confidenceLabels: Record<PacePrediction["confidence"], string> = {
    low: dict.pace.confidenceLow,
    medium: dict.pace.confidenceMedium,
    high: dict.pace.confidenceHigh,
  };

  return {
    confidence,
    passProbabilityPercent: clampedProbability,
    estimatedWeeksToTarget: estimatedWeeks,
    levelsRemaining,
    note:
      levelsRemaining === 0
        ? dict.pace.levelReached
        : t(dict.pace.note, { confidence: confidenceLabels[confidence] }),
  };
}

async function recommendNextSteps(
  dict: Dictionary,
  learnerId: string,
  currentLevel: string,
  categoryStats: Analytics["categoryStats"],
  readyForNextLevel: boolean,
  levels: Level[],
): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];

  const meaningfulStats = categoryStats.filter((c) => c.total >= 3);
  const weakest = [...meaningfulStats].sort((a, b) => a.accuracy - b.accuracy)[0];

  if (weakest) {
    recs.push({
      type: "quiz",
      title: t(dict.recommendations.reviewWeakestTitle, { category: categoryLabel(dict, weakest.category) }),
      description: t(dict.recommendations.reviewWeakestDescription, { pct: Math.round(weakest.accuracy * 100) }),
      levelId: currentLevel,
      category: weakest.category,
    });
  } else {
    recs.push({
      type: "quiz",
      title: t(dict.recommendations.tryComprehensiveTitle, { level: currentLevel }),
      description: dict.recommendations.tryComprehensiveDescription,
      levelId: currentLevel,
    });
  }

  const vocab = await listVocab(currentLevel);
  if (vocab.length > 0) {
    recs.push({
      type: "vocab_review",
      title: t(dict.recommendations.vocabReviewTitle, { level: currentLevel }),
      description: t(dict.recommendations.vocabReviewDescription, { count: vocab.length }),
      levelId: currentLevel,
    });
  }

  const grammar = await listGrammar(currentLevel);
  if (grammar.length > 0) {
    recs.push({
      type: "grammar_review",
      title: t(dict.recommendations.grammarReviewTitle, { level: currentLevel }),
      description: t(dict.recommendations.grammarReviewDescription, { count: grammar.length }),
      levelId: currentLevel,
    });
  }

  if (readyForNextLevel) {
    const currentOrder = levelSortOrder(levels, currentLevel);
    const next = levels.find((l) => l.sort_order === currentOrder + 1);
    if (next) {
      recs.push({
        type: "level_up",
        title: t(dict.recommendations.levelUpTitle, { level: next.id }),
        description: t(dict.recommendations.levelUpDescription, { current: currentLevel, level: next.id }),
        levelId: next.id,
      });
    }
  }

  return recs;
}

function buildTemplateNarrative(
  dict: Dictionary,
  a: {
    overall: Analytics["overall"];
    weakestCategory: string | null;
    strongestCategory: string | null;
    pace: PacePrediction;
    currentLevel: string;
    targetLevel: string;
  },
): string {
  const acc = Math.round(a.overall.accuracy * 100);
  const lines: string[] = [];

  if (a.overall.totalAttempts === 0) {
    return dict.narrative.noAttempts;
  }

  lines.push(t(dict.narrative.summary, { total: a.overall.totalAttempts, acc, days: a.overall.activeDays }));

  if (a.weakestCategory) {
    lines.push(t(dict.narrative.weakest, { category: categoryLabel(dict, a.weakestCategory) }));
  }
  if (a.strongestCategory && a.strongestCategory !== a.weakestCategory) {
    lines.push(t(dict.narrative.strongest, { category: categoryLabel(dict, a.strongestCategory) }));
  }

  if (a.pace.passProbabilityPercent !== null) {
    lines.push(
      t(dict.narrative.paceKnown, {
        target: a.targetLevel,
        weeks: a.pace.estimatedWeeksToTarget ?? 0,
        pct: a.pace.passProbabilityPercent,
      }),
    );
  } else {
    lines.push(dict.narrative.paceUnknown);
  }

  return lines.join(" ");
}

async function generateNarrativeWithClaude(promptContext: string, uiLanguage: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const language = languageMeta(uiLanguage).englishName;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
        max_tokens: 300,
        system:
          `You are an AI coach inside a Japanese-language-learning app. Read the student's ` +
          `learning data (JSON) and write 3-4 warm, specific sentences of encouragement and a ` +
          `concrete next step, entirely in ${language}. Don't just restate the numbers — give ` +
          `them meaning. Respond only in ${language}, with no other language mixed in.`,
        messages: [{ role: "user", content: promptContext }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text;
    return text?.trim() ?? null;
  } catch {
    return null;
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000; // recompute at most every 5 minutes per learner

export async function getAnalytics(learnerId: string, opts: { forceRefresh?: boolean } = {}): Promise<Analytics> {
  const learner = await getLearner(learnerId);
  if (!learner) throw new Error("Learner not found");
  const dict = getDictionary(learner.ui_language);

  if (!opts.forceRefresh) {
    const cached = await get<{ generated_at: string; payload_json: string }>(
      "SELECT generated_at, payload_json FROM ai_insight_cache WHERE learner_id = ?",
      [learnerId],
    );
    if (cached && Date.now() - new Date(cached.generated_at).getTime() < CACHE_TTL_MS) {
      const parsed = JSON.parse(cached.payload_json) as Analytics & { language?: string };
      // A cached payload from before a learner switched languages (or from
      // before this field existed) would otherwise serve narrative text in
      // the wrong language for up to CACHE_TTL_MS — recompute instead.
      if (parsed.language === learner.ui_language) return parsed;
    }
  }

  const levels = await listLevels();
  const [overall, categoryStats, levelStats, dailyTrend] = await Promise.all([
    overallStats(learnerId),
    accuracyByCategory(learnerId),
    accuracyByLevel(learnerId),
    dailyActivity(learnerId, 30),
  ]);

  const meaningfulCategories = categoryStats.filter((c) => c.total >= 3);
  const sorted = [...meaningfulCategories].sort((a, b) => a.accuracy - b.accuracy);
  const weakestCategory = sorted[0]?.category ?? null;
  const strongestCategory = sorted[sorted.length - 1]?.category ?? null;

  const currentLevelStat = levelStats.find((l) => l.levelId === learner.current_level_code);
  const readyForNextLevel = Boolean(
    currentLevelStat && currentLevelStat.total >= 15 && currentLevelStat.accuracy >= 0.8,
  );

  const pace = predictPace(dict, levels, learner.current_level_code, learner.target_level_code, overall);
  const recommendations = await recommendNextSteps(
    dict,
    learnerId,
    learner.current_level_code,
    categoryStats,
    readyForNextLevel,
    levels,
  );

  const templateNarrative = buildTemplateNarrative(dict, {
    overall,
    weakestCategory,
    strongestCategory,
    pace,
    currentLevel: learner.current_level_code,
    targetLevel: learner.target_level_code,
  });

  const claudeNarrative = await generateNarrativeWithClaude(
    JSON.stringify({
      learnerName: learner.display_name,
      currentLevel: learner.current_level_code,
      targetLevel: learner.target_level_code,
      overall,
      categoryStats,
      pace,
    }),
    learner.ui_language,
  );

  const analytics: Analytics & { language: string } = {
    learnerId,
    currentLevel: learner.current_level_code,
    targetLevel: learner.target_level_code,
    overall,
    categoryStats,
    levelStats,
    dailyTrend,
    weakestCategory,
    strongestCategory,
    readyForNextLevel,
    pace,
    recommendations,
    narrative: claudeNarrative ?? templateNarrative,
    generatedAt: new Date().toISOString(),
    language: learner.ui_language,
  };

  await run(
    `INSERT INTO ai_insight_cache (learner_id, generated_at, payload_json) VALUES (?, ?, ?)
     ON CONFLICT(learner_id) DO UPDATE SET generated_at = excluded.generated_at, payload_json = excluded.payload_json`,
    [learnerId, analytics.generatedAt, JSON.stringify(analytics)],
  );

  return analytics;
}

/**
 * Drop the cached analytics for a learner. Call this right after new quiz
 * attempts are recorded so the next dashboard/analytics view recomputes
 * fresh numbers instead of serving a stale pre-quiz snapshot for up to
 * CACHE_TTL_MS. Cheap: it's a single-row delete, not a recompute.
 */
export async function invalidateAnalyticsCache(learnerId: string): Promise<void> {
  await run("DELETE FROM ai_insight_cache WHERE learner_id = ?", [learnerId]);
}

// Re-export for API routes that only need raw counts (e.g. billing/admin views).
export async function countTotalAttemptsAcrossAccount(accountId: string): Promise<number> {
  const row = await all<{ c: number }>(
    `SELECT COUNT(*) as c FROM quiz_attempts qa
     JOIN learners l ON l.id = qa.learner_id
     WHERE l.account_id = ?`,
    [accountId],
  );
  return row[0]?.c ?? 0;
}
