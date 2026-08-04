import { all } from "../db";
import type { LanguageCode } from "../i18n/languages";
import { ensureDynamicVocabQuestions, ensureDynamicGrammarQuestions } from "./dynamicQuiz";

export interface Level {
  id: string;
  name_ja: string;
  name_en: string;
  sort_order: number;
}

export interface VocabItem {
  id: string;
  level_id: string;
  term: string;
  reading: string;
  meaning_ja: string;
  meaning_en: string;
  example_sentence: string;
  meanings_json: string;
}

export interface GrammarItem {
  id: string;
  level_id: string;
  pattern: string;
  meaning_en: string;
  example_sentence: string;
  meanings_json: string;
}

/**
 * Picks the meaning to display to a learner: their own ui_language if a
 * translation exists in meanings_json, otherwise the English meaning_en
 * fallback (always present) — never a raw untranslated blob.
 */
export function localizedMeaning(
  item: { meaning_en: string; meanings_json: string },
  uiLanguage: LanguageCode | string | null | undefined,
): string {
  if (!uiLanguage || uiLanguage === "en" || uiLanguage === "ja") return item.meaning_en;
  try {
    const meanings = JSON.parse(item.meanings_json || "{}") as Record<string, string>;
    return meanings[uiLanguage] || item.meaning_en;
  } catch {
    return item.meaning_en;
  }
}

export interface QuizQuestionRow {
  id: string;
  level_id: string;
  category: string;
  prompt: string;
  choices_json: string;
  correct_index: number;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  levelId: string;
  category: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export async function listLevels(): Promise<Level[]> {
  return all<Level>("SELECT * FROM levels ORDER BY sort_order ASC");
}

export async function listVocab(levelId: string): Promise<VocabItem[]> {
  return all<VocabItem>("SELECT * FROM vocab_items WHERE level_id = ?", [levelId]);
}

export async function listGrammar(levelId: string): Promise<GrammarItem[]> {
  return all<GrammarItem>("SELECT * FROM grammar_items WHERE level_id = ?", [levelId]);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Localizing "meaning recognition" quiz questions (vocabulary/grammar
// category, "「X」の意味はどれですか。" style — the prompt asks for the
// MEANING of a Japanese term, so the answer choices are translations and
// must show in the learner's own ui_language, not always English).
//
// The question bank stores these choices as the underlying vocab TERM /
// grammar PATTERN strings (e.g. ["食べる","忙しい","走る","寝る"]), never as
// pre-baked meaning text — the same stored row is shared by every learner
// regardless of language, so the actual display text has to be resolved at
// read time against that learner's ui_language via localizedMeaning().
//
// A row only gets localized if BOTH (a) its prompt matches the
// meaning-recognition template exactly, and (b) every one of its choices is
// a term/pattern that still exists for that level. Any row that fails either
// check — a grammar fill-in-the-blank question, a kanji-recognition
// question, or a not-yet-migrated legacy row whose choices are still raw
// English meaning text — is left completely untouched and displays exactly
// as stored. That second condition also doubles as the legacy-format
// detector: old rows (pre-dating this localization pass) have English
// meaning strings as choices, which never match a term/pattern, so they
// safely no-op here instead of being mangled.
// ---------------------------------------------------------------------------

const MEANING_QUESTION_SUFFIX = "」の意味はどれですか。";

function extractMeaningQuestionTerm(prompt: string): string | null {
  if (!prompt.startsWith("「") || !prompt.endsWith(MEANING_QUESTION_SUFFIX)) return null;
  const closingIndex = prompt.indexOf("」");
  if (closingIndex <= 1) return null;
  return prompt.slice(1, closingIndex);
}

interface TermMeaning {
  meaning_en: string;
  meanings_json: string;
}

async function buildTermLookups(
  questions: QuizQuestion[],
): Promise<{ vocab: Map<string, Map<string, TermMeaning>>; grammar: Map<string, Map<string, TermMeaning>> }> {
  const vocabLevels = new Set(questions.filter((q) => q.category === "vocabulary").map((q) => q.levelId));
  const grammarLevels = new Set(questions.filter((q) => q.category === "grammar").map((q) => q.levelId));

  const vocab = new Map<string, Map<string, TermMeaning>>();
  const grammar = new Map<string, Map<string, TermMeaning>>();

  await Promise.all([
    ...[...vocabLevels].map(async (levelId) => {
      const rows = await all<{ term: string; meaning_en: string; meanings_json: string }>(
        "SELECT term, meaning_en, meanings_json FROM vocab_items WHERE level_id = ?",
        [levelId],
      );
      vocab.set(levelId, new Map(rows.map((r) => [r.term, r])));
    }),
    ...[...grammarLevels].map(async (levelId) => {
      const rows = await all<{ pattern: string; meaning_en: string; meanings_json: string }>(
        "SELECT pattern, meaning_en, meanings_json FROM grammar_items WHERE level_id = ?",
        [levelId],
      );
      grammar.set(levelId, new Map(rows.map((r) => [r.pattern, r])));
    }),
  ]);

  return { vocab, grammar };
}

/** Resolves vocabulary/grammar "meaning recognition" questions' choices and
 * explanation into the given learner's ui_language. Reading/listening
 * questions, grammar fill-in-the-blank questions, and any question this
 * pass can't confidently identify as a meaning-recognition question are
 * returned unchanged. */
export async function localizeQuizQuestions(
  questions: QuizQuestion[],
  uiLanguage: LanguageCode | string | null | undefined,
): Promise<QuizQuestion[]> {
  const { vocab, grammar } = await buildTermLookups(questions);

  return questions.map((q) => {
    if (q.category !== "vocabulary" && q.category !== "grammar") return q;
    const term = extractMeaningQuestionTerm(q.prompt);
    if (!term) return q;
    const lookup = q.category === "vocabulary" ? vocab.get(q.levelId) : grammar.get(q.levelId);
    const targetMeaning = lookup?.get(term);
    if (!lookup || !targetMeaning) return q;
    if (!q.choices.every((c) => lookup.has(c))) return q; // legacy row — choices aren't term/pattern strings

    const localizedChoices = q.choices.map((c) => localizedMeaning(lookup.get(c)!, uiLanguage));
    return {
      ...q,
      choices: localizedChoices,
      explanation: `${term} = ${localizedMeaning(targetMeaning, uiLanguage)}`,
    };
  });
}

export async function getQuizSet(
  levelId: string,
  category?: string,
  limit = 10,
  uiLanguage?: LanguageCode | string | null,
): Promise<QuizQuestion[]> {
  // Lazily backfill vocabulary/grammar questions from the full vocab/grammar
  // lists (~150-160 terms / ~30-35 patterns per level) the first time each
  // level is quizzed, so repeat quizzes draw from a much bigger pool instead
  // of cycling the same ~10 hand-authored questions. Idempotent — after the
  // first call for a level these are no-ops (everything already covered).
  // Listening/reading have no source list to generate from, so they're left
  // to the static hand-authored bank.
  await Promise.all([
    !category || category === "vocabulary" ? ensureDynamicVocabQuestions(levelId) : Promise.resolve(),
    !category || category === "grammar" ? ensureDynamicGrammarQuestions(levelId) : Promise.resolve(),
  ]);

  // AND mock_exam_edition IS NULL — rows generated for a mock exam (see
  // repo/mockExam.ts) are tagged with an edition number and must never leak
  // into a regular practice quiz draw.
  const rows = category
    ? await all<QuizQuestionRow>(
        "SELECT * FROM quiz_questions WHERE level_id = ? AND category = ? AND mock_exam_edition IS NULL",
        [levelId, category],
      )
    : await all<QuizQuestionRow>("SELECT * FROM quiz_questions WHERE level_id = ? AND mock_exam_edition IS NULL", [
        levelId,
      ]);

  const questions = shuffle(rows)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      levelId: r.level_id,
      category: r.category,
      prompt: r.prompt,
      choices: JSON.parse(r.choices_json) as string[],
      correctIndex: r.correct_index,
      explanation: r.explanation,
    }));

  return localizeQuizQuestions(questions, uiLanguage);
}

export async function getQuestionById(
  id: string,
  uiLanguage?: LanguageCode | string | null,
): Promise<QuizQuestion | undefined> {
  const rows = await all<QuizQuestionRow>("SELECT * FROM quiz_questions WHERE id = ?", [id]);
  const r = rows[0];
  if (!r) return undefined;
  const question: QuizQuestion = {
    id: r.id,
    levelId: r.level_id,
    category: r.category,
    prompt: r.prompt,
    choices: JSON.parse(r.choices_json) as string[],
    correctIndex: r.correct_index,
    explanation: r.explanation,
  };
  const [localized] = await localizeQuizQuestions([question], uiLanguage);
  return localized;
}
