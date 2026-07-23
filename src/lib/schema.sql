-- Nihongo Master schema (SQLite via sql.js for local/dev use).
-- For production, port this 1:1 to Postgres (see prisma/schema.prisma) and swap
-- src/lib/db.ts for a real Postgres client — the repository layer in
-- src/lib/repo/*.ts is the only place that touches SQL, so the swap is isolated.

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'family_20',
  max_learners INTEGER NOT NULL DEFAULT 20,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trialing', -- trialing | active | past_due | canceled
  trial_ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS learners (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#2a78d6',
  current_level_code TEXT NOT NULL DEFAULT 'N5',
  target_level_code TEXT NOT NULL DEFAULT 'N1',
  target_exam_date TEXT,
  -- ISO 639-1/639-3-ish code for the learner's own UI + meaning language.
  -- One of: ja, en, vi, id, tl, my, zh, ne, km, mn, th, si. See src/lib/i18n/languages.ts.
  ui_language TEXT NOT NULL DEFAULT 'ja',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS levels (
  id TEXT PRIMARY KEY,       -- 'N5' .. 'N1'
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL -- 1 = N5 (beginner) .. 5 = N1 (advanced)
);

CREATE TABLE IF NOT EXISTS vocab_items (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  term TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning_ja TEXT NOT NULL,
  meaning_en TEXT NOT NULL,
  example_sentence TEXT,
  -- JSON map of language code -> translated meaning, e.g. {"vi": "...", "id": "..."}.
  -- meaning_en above stays as the English fallback/reference column.
  meanings_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS grammar_items (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  pattern TEXT NOT NULL,
  meaning_en TEXT NOT NULL,
  example_sentence TEXT NOT NULL,
  meanings_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  category TEXT NOT NULL, -- vocabulary | grammar | listening | reading
  prompt TEXT NOT NULL,
  choices_json TEXT NOT NULL, -- JSON array of strings
  correct_index INTEGER NOT NULL,
  explanation TEXT
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id),
  level_id TEXT NOT NULL,
  category TEXT NOT NULL,
  is_correct INTEGER NOT NULL, -- 0 | 1
  answered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_insight_cache (
  learner_id TEXT PRIMARY KEY REFERENCES learners(id) ON DELETE CASCADE,
  generated_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

-- Active study-time tracking. Each row is one heartbeat/flush from the
-- client-side StudyTimeTracker component (see src/components/StudyTimeTracker.tsx),
-- not a full "login session" — a single visit to a level page or quiz page
-- produces one or more rows as the tracker periodically reports accumulated
-- active seconds. duration_seconds excludes time the tab was hidden/blurred.
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'quiz' | 'browse' (vocab/grammar list review)
  level_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_learners_account ON learners(account_id);
CREATE INDEX IF NOT EXISTS idx_attempts_learner ON quiz_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_questions_level ON quiz_questions(level_id, category);
CREATE INDEX IF NOT EXISTS idx_vocab_level ON vocab_items(level_id);
CREATE INDEX IF NOT EXISTS idx_grammar_level ON grammar_items(level_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON study_sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_ended ON study_sessions(learner_id, ended_at);