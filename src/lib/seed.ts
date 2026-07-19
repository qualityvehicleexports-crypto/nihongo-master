import { all, run } from "./db";
import { newId } from "./ids";
import { CONTENT, LEVELS } from "./content/seedData";

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
        `INSERT INTO vocab_items (id, level_id, term, reading, meaning_ja, meaning_en, example_sentence)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId("voc"), level.id, v.term, v.reading, v.meaningJa, v.meaningEn, v.example],
      );
    }

    for (const g of content.grammar) {
      await run(
        `INSERT INTO grammar_items (id, level_id, pattern, meaning_en, example_sentence)
         VALUES (?, ?, ?, ?, ?)`,
        [newId("gra"), level.id, g.pattern, g.meaningEn, g.example],
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
