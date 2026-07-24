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

export async function getQuizSet(levelId: string, category?: string, limit = 10): Promise<QuizQuestion[]> {
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

  const rows = category
    ? await all<QuizQuestionRow>("SELECT * FROM quiz_questions WHERE level_id = ? AND category = ?", [levelId, category])
    : await all<QuizQuestionRow>("SELECT * FROM quiz_questions WHERE level_id = ?", [levelId]);

  return shuffle(rows)
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
}

export async function getQuestionById(id: string): Promise<QuizQuestion | undefined> {
  const rows = await all<QuizQuestionRow>("SELECT * FROM quiz_questions WHERE id = ?", [id]);
  const r = rows[0];
  if (!r) return undefined;
  return {
    id: r.id,
    levelId: r.level_id,
    category: r.category,
    prompt: r.prompt,
    choices: JSON.parse(r.choices_json) as string[],
    correctIndex: r.correct_index,
    explanation: r.explanation,
  };
}