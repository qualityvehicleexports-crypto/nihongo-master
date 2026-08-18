import { all, run } from "../db";
import { newId } from "../ids";
import type { LevelCode } from "../content/seedData";
import { MOCK_EXAM_READING_LISTENING } from "../content/mockExamData";
import { localizeQuizQuestions } from "./content";
import type { LanguageCode } from "../i18n/languages";

// ---------------------------------------------------------------------------
// Mock exams ("模擬試験") — 5 selectable editions (第1回〜第5回) per level,
// structured to mirror the *official* JLPT scoring sections and pass marks
// (see https://www.jlpt.jp/e/guideline/results.html):
//
//   N5/N4: 言語知識・読解 (vocab+grammar+reading combined, 0-120) + 聴解 (0-60)
//   N3/N2/N1: 言語知識(文字語彙文法) (0-60) + 読解 (0-60) + 聴解 (0-60)
//
// Every section has its own pass minimum, AND the total must clear the
// level's pass mark — failing any single section fails the whole exam, same
// as the real thing.
//
// Reading/listening content is hand-authored per edition (src/lib/content/
// mockExamData.ts, no source list to generate from). Vocabulary/grammar
// questions are generated the first time a level's mock exam is touched, by
// sampling from the SAME vocab_items/grammar_items tables the regular
// practice-quiz dynamic pool draws from (see dynamicQuiz.ts) — no new
// content needed for those two categories. Generated rows are persisted into
// quiz_questions tagged with mock_exam_edition so every later request for
// that edition is a stable, cheap SELECT.
//
// IMPORTANT: mock exam attempts are recorded into their own mock_exam_attempts
// table, never into quiz_attempts. The pass-probability prediction here is
// based ONLY on the mock exam's own score — it is deliberately NOT blended
// with regular practice-quiz history, and does not read or write anything
// touched by the trend-based pace.passProbabilityPercent in src/lib/ai.ts.
// ---------------------------------------------------------------------------

export interface MockExamSectionConfig {
  key: string;
  categories: string[];
  maxScore: number;
  minPassScore: number;
}

export interface MockExamLevelConfig {
  vocabularyCount: number;
  grammarCount: number;
  readingCount: number;
  listeningCount: number;
  sections: MockExamSectionConfig[];
  totalMax: number;
  totalPassMark: number;
}

const KNOWLEDGE_READING_SECTION = (maxScore: number, minPassScore: number): MockExamSectionConfig => ({
  key: "knowledge_reading",
  categories: ["vocabulary", "grammar", "reading"],
  maxScore,
  minPassScore,
});
const KNOWLEDGE_SECTION: MockExamSectionConfig = {
  key: "knowledge",
  categories: ["vocabulary", "grammar"],
  maxScore: 60,
  minPassScore: 19,
};
const READING_SECTION: MockExamSectionConfig = {
  key: "reading",
  categories: ["reading"],
  maxScore: 60,
  minPassScore: 19,
};
const LISTENING_SECTION_60: MockExamSectionConfig = {
  key: "listening",
  categories: ["listening"],
  maxScore: 60,
  minPassScore: 19,
};

export const MOCK_EXAM_CONFIG: Record<LevelCode, MockExamLevelConfig> = {
  N5: {
    vocabularyCount: 6,
    grammarCount: 4,
    readingCount: 4,
    listeningCount: 7,
    sections: [KNOWLEDGE_READING_SECTION(120, 38), LISTENING_SECTION_60],
    totalMax: 180,
    totalPassMark: 80,
  },
  N4: {
    vocabularyCount: 7,
    grammarCount: 5,
    readingCount: 5,
    listeningCount: 7,
    sections: [KNOWLEDGE_READING_SECTION(120, 38), LISTENING_SECTION_60],
    totalMax: 180,
    totalPassMark: 90,
  },
  N3: {
    vocabularyCount: 8,
    grammarCount: 6,
    readingCount: 6,
    listeningCount: 7,
    sections: [KNOWLEDGE_SECTION, READING_SECTION, LISTENING_SECTION_60],
    totalMax: 180,
    totalPassMark: 95,
  },
  N2: {
    vocabularyCount: 9,
    grammarCount: 7,
    readingCount: 7,
    listeningCount: 8,
    sections: [KNOWLEDGE_SECTION, READING_SECTION, LISTENING_SECTION_60],
    totalMax: 180,
    totalPassMark: 90,
  },
  N1: {
    vocabularyCount: 10,
    grammarCount: 8,
    readingCount: 8,
    listeningCount: 9,
    sections: [KNOWLEDGE_SECTION, READING_SECTION, LISTENING_SECTION_60],
    totalMax: 180,
    totalPassMark: 100,
  },
};

export const MOCK_EXAM_EDITIONS = [1, 2, 3, 4, 5];

function isLevelCode(value: string): value is LevelCode {
  return value in MOCK_EXAM_CONFIG;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistractors<T>(pool: T[], exclude: T, count: number): T[] {
  const candidates = pool.filter((item) => item !== exclude);
  shuffleInPlace(candidates);
  return candidates.slice(0, count);
}

// Assigns `perEdition` distinct items to each requested edition, drawing from
// a shuffled copy of `pool` without replacement for as long as the pool
// allows — once exhausted it reshuffles and continues, so a small pool (e.g.
// N1's ~35 grammar patterns against 5 editions x 8/edition = 40 needed) still
// produces valid, duplicate-free-*within-an-edition* sets, at the cost of
// some repeats *across* editions. That trade-off is fine here: different
// mock exam editions overlapping on some core vocabulary/grammar is how real
// JLPT past exams behave too.
function pickForEditions<T>(pool: T[], perEdition: number, editions: number[]): Map<number, T[]> {
  const result = new Map<number, T[]>();
  let available = shuffleInPlace([...pool]);
  for (const edition of editions) {
    if (available.length < perEdition) {
      available = shuffleInPlace([...pool]);
    }
    result.set(edition, available.splice(0, perEdition));
  }
  return result;
}

async function ensureMockExamQuestions(levelId: string): Promise<void> {
  if (!isLevelCode(levelId)) return;
  const config = MOCK_EXAM_CONFIG[levelId];

  const editionCounts = await all<{ mock_exam_edition: number; cnt: number }>(
    `SELECT mock_exam_edition, COUNT(*) as cnt FROM quiz_questions
     WHERE level_id = ? AND mock_exam_edition IS NOT NULL
     GROUP BY mock_exam_edition`,
    [levelId],
  );
  const existingEditions = new Set(editionCounts.map((r) => r.mock_exam_edition));
  const missingEditions = MOCK_EXAM_EDITIONS.filter((e) => !existingEditions.has(e));
  if (missingEditions.length === 0) return;

  const [vocabItems, grammarItems] = await Promise.all([
    all<{ term: string; meaning_en: string }>("SELECT term, meaning_en FROM vocab_items WHERE level_id = ?", [
      levelId,
    ]),
    all<{ pattern: string; meaning_en: string; example_sentence: string }>(
      "SELECT pattern, meaning_en, example_sentence FROM grammar_items WHERE level_id = ?",
      [levelId],
    ),
  ]);
  // Not enough seed data to build 4-choice questions — leave this level's
  // mock exam without vocab/grammar sections rather than crashing; the
  // reading/listening rows still get inserted below.
  const canBuildVocab = vocabItems.length >= 4;
  const canBuildGrammar = grammarItems.length >= 4;

  const vocabAssignment = canBuildVocab
    ? pickForEditions(vocabItems, config.vocabularyCount, missingEditions)
    : new Map<number, { term: string; meaning_en: string }[]>();
  const grammarAssignment = canBuildGrammar
    ? pickForEditions(grammarItems, config.grammarCount, missingEditions)
    : new Map<number, { pattern: string; meaning_en: string; example_sentence: string }[]>();

  // Choices store the underlying term/pattern strings (not pre-baked English
  // meaning text) — see the matching comment in dynamicQuiz.ts. This lets
  // content.ts's localizeQuizQuestions() resolve the displayed choice text
  // into whichever ui_language the learner taking this mock exam has.
  const vocabTermPool = vocabItems.map((v) => v.term);
  const grammarPatternPool = grammarItems.map((g) => g.pattern);
  const readingListening = MOCK_EXAM_READING_LISTENING[levelId] ?? [];

  for (const edition of missingEditions) {
    for (const v of vocabAssignment.get(edition) ?? []) {
      const distractors = pickDistractors(vocabTermPool, v.term, 3);
      if (distractors.length < 3) continue;
      const choices = shuffleInPlace([v.term, ...distractors]);
      const correctIndex = choices.indexOf(v.term);
      await run(
        `INSERT INTO quiz_questions (id, level_id, category, prompt, choices_json, correct_index, explanation, mock_exam_edition)
         VALUES (?, ?, 'vocabulary', ?, ?, ?, ?, ?)`,
        [
          newId("mq"),
          levelId,
          `「${v.term}」の意味はどれですか。`,
          JSON.stringify(choices),
          correctIndex,
          `「${v.term}」= ${v.meaning_en}。`,
          edition,
        ],
      );
    }

    for (const g of grammarAssignment.get(edition) ?? []) {
      const distractors = pickDistractors(grammarPatternPool, g.pattern, 3);
      if (distractors.length < 3) continue;
      const choices = shuffleInPlace([g.pattern, ...distractors]);
      const correctIndex = choices.indexOf(g.pattern);
      // See the matching comment in dynamicQuiz.ts's ensureDynamicGrammarQuestions —
      // a bare particle/pattern means nothing without an example sentence for context.
      const prompt = g.example_sentence
        ? `「${g.pattern}」の意味はどれですか。\n例文：${g.example_sentence}`
        : `「${g.pattern}」の意味はどれですか。`;
      await run(
        `INSERT INTO quiz_questions (id, level_id, category, prompt, choices_json, correct_index, explanation, mock_exam_edition)
         VALUES (?, ?, 'grammar', ?, ?, ?, ?, ?)`,
        [newId("mq"), levelId, prompt, JSON.stringify(choices), correctIndex, `「${g.pattern}」= ${g.meaning_en}。`, edition],
      );
    }

    for (const q of readingListening.filter((r) => r.edition === edition)) {
      await run(
        `INSERT INTO quiz_questions (id, level_id, category, prompt, choices_json, correct_index, explanation, mock_exam_edition)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId("mq"),
          levelId,
          q.category,
          q.prompt,
          JSON.stringify(q.choices),
          q.correctIndex,
          q.explanation,
          edition,
        ],
      );
    }
  }
}

export interface MockExamQuestion {
  id: string;
  levelId: string;
  category: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizQuestionRow {
  id: string;
  level_id: string;
  category: string;
  prompt: string;
  choices_json: string;
  correct_index: number;
  explanation: string;
}

const CATEGORY_ORDER = ["vocabulary", "grammar", "reading", "listening"];

/** Ensures this edition's questions exist, then returns them in JLPT-like
 * section order. `uiLanguage` localizes the vocabulary/grammar sections'
 * answer choices into the requesting learner's language (see
 * content.ts's localizeQuizQuestions) — reading/listening stay Japanese, as
 * intended for those sections. */
export async function getMockExamQuestions(
  levelId: string,
  edition: number,
  uiLanguage?: LanguageCode | string | null,
): Promise<MockExamQuestion[]> {
  await ensureMockExamQuestions(levelId);
  const rows = await all<QuizQuestionRow>(
    "SELECT * FROM quiz_questions WHERE level_id = ? AND mock_exam_edition = ?",
    [levelId, edition],
  );
  const questions = rows
    .map((r) => ({
      id: r.id,
      levelId: r.level_id,
      category: r.category,
      prompt: r.prompt,
      choices: JSON.parse(r.choices_json) as string[],
      correctIndex: r.correct_index,
      explanation: r.explanation,
    }))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  return localizeQuizQuestions(questions, uiLanguage);
}

export interface MockExamSectionResult {
  key: string;
  categories: string[];
  rawCorrect: number;
  rawTotal: number;
  scaledScore: number;
  maxScore: number;
  minPassScore: number;
  passed: boolean;
}

export interface MockExamScoreResult {
  sections: MockExamSectionResult[];
  totalScaled: number;
  totalMax: number;
  totalPassMark: number;
  passed: boolean;
  passProbabilityPercent: number;
}

/**
 * Scales each section's raw-correct/raw-total ratio linearly onto the
 * official 60- or 120-point range. This is a deliberate approximation: the
 * real JLPT uses IRT-based scaled scoring (item difficulty affects points,
 * not just correct/incorrect count), which this app has no way to replicate
 * without real calibration data. Presented to the learner with that caveat
 * in the UI rather than silently implying exam-grade precision.
 *
 * Pass probability is a smooth (not just binary pass/fail) percentage: it
 * looks at how far the WEAKEST constraint (the overall total, or any single
 * section) sits above or below its required minimum, as a fraction of that
 * constraint's max score, and maps that margin through a logistic curve
 * centered on the pass line. Clamped to [2, 98] — a single mock exam is
 * never treated as 100% certain either way.
 */
export function scoreMockExam(
  levelId: string,
  answers: { category: string; isCorrect: boolean }[],
): MockExamScoreResult {
  const config = isLevelCode(levelId) ? MOCK_EXAM_CONFIG[levelId] : MOCK_EXAM_CONFIG.N5;

  const sections: MockExamSectionResult[] = config.sections.map((sec) => {
    const relevant = answers.filter((a) => sec.categories.includes(a.category));
    const rawTotal = relevant.length;
    const rawCorrect = relevant.filter((a) => a.isCorrect).length;
    const scaledScore = rawTotal > 0 ? Math.round((rawCorrect / rawTotal) * sec.maxScore) : 0;
    return {
      key: sec.key,
      categories: sec.categories,
      rawCorrect,
      rawTotal,
      scaledScore,
      maxScore: sec.maxScore,
      minPassScore: sec.minPassScore,
      passed: scaledScore >= sec.minPassScore,
    };
  });

  const totalScaled = sections.reduce((sum, s) => sum + s.scaledScore, 0);
  const passed = totalScaled >= config.totalPassMark && sections.every((s) => s.passed);

  const totalMargin = (totalScaled - config.totalPassMark) / config.totalMax;
  const sectionMargins = sections.map((s) => (s.scaledScore - s.minPassScore) / s.maxScore);
  const worstMargin = Math.min(totalMargin, ...sectionMargins);
  const STEEPNESS = 10;
  const probability = 1 / (1 + Math.exp(-STEEPNESS * worstMargin));
  const passProbabilityPercent = Math.min(98, Math.max(2, Math.round(probability * 100)));

  return {
    sections,
    totalScaled,
    totalMax: config.totalMax,
    totalPassMark: config.totalPassMark,
    passed,
    passProbabilityPercent,
  };
}

export interface MockExamAttemptRow {
  id: string;
  learner_id: string;
  level_id: string;
  edition: number;
  section_scores_json: string;
  total_scaled: number;
  total_max: number;
  passed: number;
  pass_probability_percent: number;
  taken_at: string;
}

export async function recordMockExamAttempt(input: {
  learnerId: string;
  levelId: string;
  edition: number;
  score: MockExamScoreResult;
}): Promise<void> {
  await run(
    `INSERT INTO mock_exam_attempts
       (id, learner_id, level_id, edition, section_scores_json, total_scaled, total_max, passed, pass_probability_percent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId("mock"),
      input.learnerId,
      input.levelId,
      input.edition,
      JSON.stringify(input.score.sections),
      input.score.totalScaled,
      input.score.totalMax,
      input.score.passed ? 1 : 0,
      input.score.passProbabilityPercent,
    ],
  );
}

export async function listMockExamAttempts(learnerId: string, levelId: string): Promise<MockExamAttemptRow[]> {
  return all<MockExamAttemptRow>(
    "SELECT * FROM mock_exam_attempts WHERE learner_id = ? AND level_id = ? ORDER BY taken_at ASC",
    [learnerId, levelId],
  );
}

/** Latest attempt per edition (1-5), for the level page's edition status cards. */
export async function getLatestMockExamAttempts(
  learnerId: string,
  levelId: string,
): Promise<Map<number, MockExamAttemptRow>> {
  const rows = await listMockExamAttempts(learnerId, levelId);
  const map = new Map<number, MockExamAttemptRow>();
  for (const row of rows) {
    map.set(row.edition, row); // rows are ASC by taken_at, so the last write per edition wins = latest
  }
  return map;
}
