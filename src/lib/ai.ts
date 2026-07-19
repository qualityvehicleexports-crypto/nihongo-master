import { accuracyByCategory, accuracyByLevel, dailyActivity, overallStats } from "./repo/progress";
import { getLearner } from "./repo/learners";
import { listLevels, listGrammar, listVocab, type Level } from "./repo/content";
import { all, get, run } from "./db";

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

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "語彙 (Vocabulary)",
  grammar: "文法 (Grammar)",
  listening: "聴解 (Listening)",
  reading: "読解 (Reading)",
};

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
      note: "問題演習の記録がまだ少ないため、予測にはあと数回のクイズが必要です。",
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

  return {
    confidence,
    passProbabilityPercent: clampedProbability,
    estimatedWeeksToTarget: estimatedWeeks,
    levelsRemaining,
    note:
      levelsRemaining === 0
        ? "目標レベルに到達済みです。維持のための復習を続けましょう。"
        : `現在のペースで学習を続けた場合の目安です（信頼度: ${confidence}）。`,
  };
}

async function recommendNextSteps(
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
      title: `${CATEGORY_LABELS[weakest.category] ?? weakest.category} を重点的に復習`,
      description: `直近の正答率は${Math.round(weakest.accuracy * 100)}%です。同じカテゴリーの問題をもう一度解いて定着させましょう。`,
      levelId: currentLevel,
      category: weakest.category,
    });
  } else {
    recs.push({
      type: "quiz",
      title: `${currentLevel} の総合クイズに挑戦`,
      description: "まずは全カテゴリーのクイズを解いて、現在の実力を測りましょう。",
      levelId: currentLevel,
    });
  }

  const vocab = await listVocab(currentLevel);
  if (vocab.length > 0) {
    recs.push({
      type: "vocab_review",
      title: `${currentLevel} の語彙リストを復習`,
      description: `${vocab.length}語のうち、まだ自信がない単語を中心に見直しましょう。`,
      levelId: currentLevel,
    });
  }

  const grammar = await listGrammar(currentLevel);
  if (grammar.length > 0) {
    recs.push({
      type: "grammar_review",
      title: `${currentLevel} の文法パターンを復習`,
      description: `${grammar.length}個の文型を例文と一緒に確認しましょう。`,
      levelId: currentLevel,
    });
  }

  if (readyForNextLevel) {
    const currentOrder = levelSortOrder(levels, currentLevel);
    const next = levels.find((l) => l.sort_order === currentOrder + 1);
    if (next) {
      recs.push({
        type: "level_up",
        title: `${next.id} に進む準備ができています`,
        description: `${currentLevel} の正答率が安定しています。${next.id} のクイズも試してみましょう。`,
        levelId: next.id,
      });
    }
  }

  return recs;
}

function buildTemplateNarrative(a: {
  overall: Analytics["overall"];
  weakestCategory: string | null;
  strongestCategory: string | null;
  pace: PacePrediction;
  currentLevel: string;
  targetLevel: string;
}): string {
  const acc = Math.round(a.overall.accuracy * 100);
  const lines: string[] = [];

  if (a.overall.totalAttempts === 0) {
    return "まだクイズの記録がありません。まずはレベルを選んでクイズに挑戦してみましょう。AIが弱点と学習ペースを分析します。";
  }

  lines.push(
    `これまでに${a.overall.totalAttempts}問に取り組み、正答率は${acc}%です（学習日数: ${a.overall.activeDays}日）。`,
  );

  if (a.weakestCategory) {
    lines.push(`特に${CATEGORY_LABELS[a.weakestCategory] ?? a.weakestCategory}の正答率が低めなので、重点的に復習するのがおすすめです。`);
  }
  if (a.strongestCategory && a.strongestCategory !== a.weakestCategory) {
    lines.push(`${CATEGORY_LABELS[a.strongestCategory] ?? a.strongestCategory}は好調です。この調子を維持しましょう。`);
  }

  if (a.pace.passProbabilityPercent !== null) {
    lines.push(
      `現在のペースでは、${a.targetLevel}到達まで目安で約${a.pace.estimatedWeeksToTarget}週間、合格可能性は約${a.pace.passProbabilityPercent}%と推定されます。`,
    );
  } else {
    lines.push("学習ペースの予測には、もう少しクイズの記録が必要です。");
  }

  return lines.join(" ");
}

async function generateNarrativeWithClaude(promptContext: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

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
          "あなたは日本語学習アプリのAIコーチです。生徒の学習データ(JSON)を読み、3〜4文の日本語で、温かく具体的な励ましと次の一歩を提案してください。数値を並べるだけでなく、意味づけをしてください。",
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
  if (!opts.forceRefresh) {
    const cached = await get<{ generated_at: string; payload_json: string }>(
      "SELECT generated_at, payload_json FROM ai_insight_cache WHERE learner_id = ?",
      [learnerId],
    );
    if (cached && Date.now() - new Date(cached.generated_at).getTime() < CACHE_TTL_MS) {
      return JSON.parse(cached.payload_json) as Analytics;
    }
  }

  const learner = await getLearner(learnerId);
  if (!learner) throw new Error("Learner not found");

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

  const pace = predictPace(levels, learner.current_level_code, learner.target_level_code, overall);
  const recommendations = await recommendNextSteps(
    learnerId,
    learner.current_level_code,
    categoryStats,
    readyForNextLevel,
    levels,
  );

  const templateNarrative = buildTemplateNarrative({
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
  );

  const analytics: Analytics = {
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
  };

  await run(
    `INSERT INTO ai_insight_cache (learner_id, generated_at, payload_json) VALUES (?, ?, ?)
     ON CONFLICT(learner_id) DO UPDATE SET generated_at = excluded.generated_at, payload_json = excluded.payload_json`,
    [learnerId, analytics.generatedAt, JSON.stringify(analytics)],
  );

  return analytics;
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
