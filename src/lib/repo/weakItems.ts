import { all } from "../db";

// ---------------------------------------------------------------------------
// Weak-item detection: which specific vocab terms / grammar patterns has a
// learner actually gotten wrong, not just "vocabulary accuracy is 62%".
//
// quiz_questions has no vocab_item_id / grammar_item_id foreign key — the
// question bank was authored as static text before this feature existed, so
// there is nothing to join on directly. Instead this recovers the tested
// term/pattern from the question text itself:
//   1. Japanese text quoted in 「...」 inside the prompt (how most vocabulary
//      questions and a few grammar questions present the target item).
//   2. Failing that, the correct-answer choice text — checked as-is, and
//      (for grammar) with a leading "〜" added, since grammar choices are
//      often bare patterns like "にもかかわらず" for "〜にもかかわらず".
//
// This resolves every vocabulary question but only some grammar questions —
// several early grammar questions test plain conjugation ("勉強します" vs.
// "勉強たいです") rather than a named 〜pattern, and those simply don't
// attribute to a specific pattern. That's fine: they still count toward the
// category-level accuracy stats elsewhere: they just don't surface here.
// ---------------------------------------------------------------------------

export interface WeakItem {
  key: string; // term or pattern, exactly as in vocab_items.term / grammar_items.pattern
  reading: string | null; // vocab only
  meaningEn: string;
  levelId: string;
  missCount: number;
  attemptCount: number;
}

export interface WeakItems {
  vocab: WeakItem[];
  grammar: WeakItem[];
}

interface IncorrectAttemptRow {
  category: string;
  level_id: string;
  prompt: string;
  choices_json: string;
  correct_index: number;
}

function extractQuoted(text: string): string[] {
  const matches = [...text.matchAll(/「([^」]*)」/g)];
  return matches.map((m) => m[1]);
}

/** Every vocab term at this level the learner has ever answered incorrectly
 * at least once, as a Set of `vocab_items.term` strings — used by the level
 * page to mark words in the reference vocab list for easy review, so a
 * learner doesn't have to remember which words tripped them up in past
 * quizzes. Unlike weakItemsForLearner() this isn't limited to the top N
 * misses and only resolves vocabulary (not grammar), since it backs a
 * simple "needs review" badge rather than a ranked weak-points summary. */
export async function getMissedVocabTerms(learnerId: string, levelId: string): Promise<Set<string>> {
  const [incorrectRows, vocabItems] = await Promise.all([
    all<{ prompt: string; choices_json: string; correct_index: number }>(
      `SELECT qq.prompt, qq.choices_json, qq.correct_index
       FROM quiz_attempts qa JOIN quiz_questions qq ON qq.id = qa.question_id
       WHERE qa.learner_id = ? AND qa.is_correct = 0 AND qq.category = 'vocabulary' AND qq.level_id = ?`,
      [learnerId, levelId],
    ),
    all<{ term: string }>("SELECT term FROM vocab_items WHERE level_id = ?", [levelId]),
  ]);

  const vocabTerms = new Set(vocabItems.map((v) => v.term));
  const missed = new Set<string>();
  for (const row of incorrectRows) {
    let matched = false;
    for (const q of extractQuoted(row.prompt)) {
      if (vocabTerms.has(q)) {
        missed.add(q);
        matched = true;
      }
    }
    if (matched) continue;
    let choices: string[] = [];
    try {
      choices = JSON.parse(row.choices_json) as string[];
    } catch {
      // fall through with empty choices
    }
    const correctChoice = choices[row.correct_index];
    if (correctChoice && vocabTerms.has(correctChoice)) missed.add(correctChoice);
  }
  return missed;
}

export async function weakItemsForLearner(learnerId: string, limit = 5): Promise<WeakItems> {
  const [incorrectVocabRows, incorrectGrammarRows, vocabItems, grammarItems, attemptedVocabRows, attemptedGrammarRows] =
    await Promise.all([
      all<IncorrectAttemptRow>(
        `SELECT qq.category, qq.level_id, qq.prompt, qq.choices_json, qq.correct_index
         FROM quiz_attempts qa JOIN quiz_questions qq ON qq.id = qa.question_id
         WHERE qa.learner_id = ? AND qa.is_correct = 0 AND qq.category = 'vocabulary'`,
        [learnerId],
      ),
      all<IncorrectAttemptRow>(
        `SELECT qq.category, qq.level_id, qq.prompt, qq.choices_json, qq.correct_index
         FROM quiz_attempts qa JOIN quiz_questions qq ON qq.id = qa.question_id
         WHERE qa.learner_id = ? AND qa.is_correct = 0 AND qq.category = 'grammar'`,
        [learnerId],
      ),
      all<{ term: string; reading: string; meaning_en: string; level_id: string }>(
        "SELECT term, reading, meaning_en, level_id FROM vocab_items",
      ),
      all<{ pattern: string; meaning_en: string; level_id: string }>(
        "SELECT pattern, meaning_en, level_id FROM grammar_items",
      ),
      all<IncorrectAttemptRow>(
        `SELECT qq.category, qq.level_id, qq.prompt, qq.choices_json, qq.correct_index
         FROM quiz_attempts qa JOIN quiz_questions qq ON qq.id = qa.question_id
         WHERE qa.learner_id = ? AND qq.category = 'vocabulary'`,
        [learnerId],
      ),
      all<IncorrectAttemptRow>(
        `SELECT qq.category, qq.level_id, qq.prompt, qq.choices_json, qq.correct_index
         FROM quiz_attempts qa JOIN quiz_questions qq ON qq.id = qa.question_id
         WHERE qa.learner_id = ? AND qq.category = 'grammar'`,
        [learnerId],
      ),
    ]);

  const vocabByTerm = new Map(vocabItems.map((v) => [v.term, v]));
  const grammarByPattern = new Map(grammarItems.map((g) => [g.pattern, g]));

  function resolveVocabTerm(row: IncorrectAttemptRow): string | null {
    let choices: string[] = [];
    try {
      choices = JSON.parse(row.choices_json) as string[];
    } catch {
      // fall through with empty choices
    }
    for (const q of extractQuoted(row.prompt)) {
      if (vocabByTerm.has(q)) return q;
    }
    const correctChoice = choices[row.correct_index];
    if (correctChoice && vocabByTerm.has(correctChoice)) return correctChoice;
    return null;
  }

  function resolveGrammarPattern(row: IncorrectAttemptRow): string | null {
    let choices: string[] = [];
    try {
      choices = JSON.parse(row.choices_json) as string[];
    } catch {
      // fall through with empty choices
    }
    for (const q of extractQuoted(row.prompt)) {
      if (grammarByPattern.has(q)) return q;
      if (grammarByPattern.has(`〜${q}`)) return `〜${q}`;
    }
    const correctChoice = choices[row.correct_index];
    if (correctChoice) {
      if (grammarByPattern.has(correctChoice)) return correctChoice;
      if (grammarByPattern.has(`〜${correctChoice}`)) return `〜${correctChoice}`;
    }
    return null;
  }

  function tally(
    incorrectRows: IncorrectAttemptRow[],
    allRows: IncorrectAttemptRow[],
    resolve: (row: IncorrectAttemptRow) => string | null,
  ): Map<string, { misses: number; attempts: number }> {
    const counts = new Map<string, { misses: number; attempts: number }>();
    for (const row of allRows) {
      const key = resolve(row);
      if (!key) continue;
      if (!counts.has(key)) counts.set(key, { misses: 0, attempts: 0 });
      counts.get(key)!.attempts += 1;
    }
    for (const row of incorrectRows) {
      const key = resolve(row);
      if (!key) continue;
      if (!counts.has(key)) counts.set(key, { misses: 0, attempts: 0 });
      counts.get(key)!.misses += 1;
    }
    return counts;
  }

  const vocabCounts = tally(incorrectVocabRows, attemptedVocabRows, resolveVocabTerm);
  const grammarCounts = tally(incorrectGrammarRows, attemptedGrammarRows, resolveGrammarPattern);

  const vocab: WeakItem[] = [...vocabCounts.entries()]
    .filter(([, c]) => c.misses > 0)
    .sort((a, b) => b[1].misses - a[1].misses)
    .slice(0, limit)
    .map(([term, c]) => {
      const item = vocabByTerm.get(term);
      return {
        key: term,
        reading: item?.reading ?? null,
        meaningEn: item?.meaning_en ?? "",
        levelId: item?.level_id ?? "",
        missCount: c.misses,
        attemptCount: c.attempts,
      };
    });

  const grammar: WeakItem[] = [...grammarCounts.entries()]
    .filter(([, c]) => c.misses > 0)
    .sort((a, b) => b[1].misses - a[1].misses)
    .slice(0, limit)
    .map(([pattern, c]) => {
      const item = grammarByPattern.get(pattern);
      return {
        key: pattern,
        reading: null,
        meaningEn: item?.meaning_en ?? "",
        levelId: item?.level_id ?? "",
        missCount: c.misses,
        attemptCount: c.attempts,
      };
    });

  return { vocab, grammar };
}
