import { all, run } from "./db";
import { newId } from "./ids";
import { CONTENT, LEVELS } from "./content/seedData";
import { vocabMeaningsJson, grammarMeaningsJson } from "./content/translations";

/** Idempotent: only inserts content the first time the DB is created. */
export async function ensureSeeded(): Promise<void> {
  const existing = await all<{ c: number }>("SELECT COUNT(*) as c FROM levels");
  if ((existing[0]?.c ?? 0) > 0) return;

  for (const level of LEVELS) {
    await run("INSERT INTO levels (id, name_ja, name_en, sort_order) VALUES (?, ?, ?, ?)", [
      level.id,
      level.nameJa,
      level.nameEn,
      level.sortOrder,
    ]);

    const content = CONTENT[level.id];

    for (const v of content.vocab) {
      await run(
        `INSERT INTO vocab_items (id, level_id, term, reading, meaning_ja, meaning_en, example_sentence, meanings_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId("voc"), level.id, v.term, v.reading, v.meaningJa, v.meaningEn, v.example, vocabMeaningsJson(v.term)],
      );
    }

    for (const g of content.grammar) {
      await run(
        `INSERT INTO grammar_items (id, level_id, pattern, meaning_en, example_sentence, meanings_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId("gra"), level.id, g.pattern, g.meaningEn, g.example, grammarMeaningsJson(g.pattern)],
      );
    }

    for (const q of content.questions) {
      await run(
        `INSERT INTO quiz_questions (id, level_id, category, prompt, choices_json, correct_index, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId("q"), level.id, q.category, q.prompt, JSON.stringify(q.choices), q.correctIndex, q.explanation],
      );
    }
  }
}

/**
 * Fills in meanings_json for any vocab/grammar row still stuck at the column's
 * default '{}' — i.e. rows that were inserted before the i18n translations
 * existed (a live deployment seeded before this feature shipped). Matches by
 * the row's own term/pattern text against the generated translations map, so
 * it's safe to call on every startup: rows that already have translations are
 * left untouched, and rows with no matching entry are simply skipped.
 */
export async function backfillMeaningsTranslations(): Promise<void> {
  const emptyVocab = await all<{ id: string; term: string }>(
    "SELECT id, term FROM vocab_items WHERE meanings_json = '{}'",
  );
  for (const row of emptyVocab) {
    const json = vocabMeaningsJson(row.term);
    if (json !== "{}") {
      await run("UPDATE vocab_items SET meanings_json = ? WHERE id = ?", [json, row.id]);
    }
  }

  const emptyGrammar = await all<{ id: string; pattern: string }>(
    "SELECT id, pattern FROM grammar_items WHERE meanings_json = '{}'",
  );
  for (const row of emptyGrammar) {
    const json = grammarMeaningsJson(row.pattern);
    if (json !== "{}") {
      await run("UPDATE grammar_items SET meanings_json = ? WHERE id = ?", [json, row.id]);
    }
  }
}