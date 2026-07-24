import { all, run } from "../db";
import { newId } from "../ids";

// ---------------------------------------------------------------------------
// The static quiz_questions bank (authored in src/lib/content/seedData.ts)
// only has 10 questions per category per level. With that few, shuffle()
// just reorders the same fixed set — every quiz attempt shows the same
// questions, only rearranged, which learners notice quickly.
//
// Meanwhile vocab_items and grammar_items already hold ~150-160 terms and
// ~30-35 patterns per level (far more than the quiz bank uses). This module
// turns each of those into a "meaning recognition" quiz question the first
// time a level is quizzed, and persists it into quiz_questions so it behaves
// exactly like a hand-authored question from then on: getQuizSet() draws
// from the enlarged pool via its existing shuffle+limit logic, weakItemsForLearner's
// 「...」-quote matching resolves it to a specific term/pattern like any
// other, and quiz submission/grading needs no changes at all.
//
// Listening/reading questions stay static — there is no source list to
// generate short dialogues/passages from, so those still draw from the
// hand-authored 10-per-level bank.
// ---------------------------------------------------------------------------

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

function extractQuoted(text: string): string[] {
  return [...text.matchAll(/「([^」]*)」/g)].map((m) => m[1]);
}

export async function ensureDynamicVocabQuestions(levelId: string): Promise<void> {
  const [vocabItems, existingRows] = await Promise.all([
    all<{ term: string; meaning_en: string }>("SELECT term, meaning_en FROM vocab_items WHERE level_id = ?", [
      levelId,
    ]),
    all<{ prompt: string }>("SELECT prompt FROM quiz_questions WHERE level_id = ? AND category = 'vocabulary'", [
      levelId,
    ]),
  ]);

  // Need at least 4 distinct terms to build a 4-choice question at all.
  if (vocabItems.length < 4) return;

  const covered = new Set<string>();
  const termSet = new Set(vocabItems.map((v) => v.term));
  for (const row of existingRows) {
    for (const q of extractQuoted(row.prompt)) {
      if (termSet.has(q)) covered.add(q);
    }
  }

  const meaningPool = vocabItems.map((v) => v.meaning_en);
  const missing = vocabItems.filter((v) => !covered.has(v.term));
  if (missing.length === 0) return;

  for (const v of missing) {
    const distractors = pickDistractors(meaningPool, v.meaning_en, 3);
    if (distractors.length < 3) continue; // defensive: not enough variety to build 4 choices
    const choices = shuffleInPlace([v.meaning_en, ...distractors]);
    const correctIndex = choices.indexOf(v.meaning_en);
    await run(
      `INSERT INTO quiz_questions (id, level_id, category, prompt, choices_json, correct_index, explanation)
       VALUES (?, ?, 'vocabulary', ?, ?, ?, ?)`,
      [
        newId("q"),
        levelId,
        `「${v.term}」の意味はどれですか。`,
        JSON.stringify(choices),
        correctIndex,
        `「${v.term}」= ${v.meaning_en}。`,
      ],
    );
  }
}

export async function ensureDynamicGrammarQuestions(levelId: string): Promise<void> {
  const [grammarItems, existingRows] = await Promise.all([
    all<{ pattern: string; meaning_en: string }>("SELECT pattern, meaning_en FROM grammar_items WHERE level_id = ?", [
      levelId,
    ]),
    all<{ prompt: string; choices_json: string; correct_index: number }>(
      "SELECT prompt, choices_json, correct_index FROM quiz_questions WHERE level_id = ? AND category = 'grammar'",
      [levelId],
    ),
  ]);

  if (grammarItems.length < 4) return;

  const patternSet = new Set(grammarItems.map((g) => g.pattern));
  const covered = new Set<string>();
  for (const row of existingRows) {
    for (const q of extractQuoted(row.prompt)) {
      if (patternSet.has(q)) covered.add(q);
    }
    try {
      const choices = JSON.parse(row.choices_json) as string[];
      const correctChoice = choices[row.correct_index];
      if (correctChoice && patternSet.has(correctChoice)) covered.add(correctChoice);
    } catch {
      // ignore malformed rows
    }
  }

  const meaningPool = grammarItems.map((g) => g.meaning_en);
  const missing = grammarItems.filter((g) => !covered.has(g.pattern));
  if (missing.length === 0) return;

  for (const g of missing) {
    const distractors = pickDistractors(meaningPool, g.meaning_en, 3);
    if (distractors.length < 3) continue;
    const choices = shuffleInPlace([g.meaning_en, ...distractors]);
    const correctIndex = choices.indexOf(g.meaning_en);
    await run(
      `INSERT INTO quiz_questions (id, level_id, category, prompt, choices_json, correct_index, explanation)
       VALUES (?, ?, 'grammar', ?, ?, ?, ?)`,
      [
        newId("q"),
        levelId,
        `「${g.pattern}」の意味はどれですか。`,
        JSON.stringify(choices),
        correctIndex,
        `「${g.pattern}」= ${g.meaning_en}。`,
      ],
    );
  }
}