import path from "node:path";
import fs from "node:fs";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

// --------------------------------------------------------------------------
// Local/dev data layer, built on sql.js (pure WASM SQLite — no native binary,
// no network fetch at install time). It is intentionally isolated behind the
// `query` / `exec` helpers below: everything in src/lib/repo/*.ts talks to
// the database only through this file, so swapping to a hosted Postgres
// instance in production (see prisma/schema.prisma for the equivalent DDL)
// touches only this module, not the route handlers or business logic.
// --------------------------------------------------------------------------

// DATA_DIR can be overridden via env var so a mounted volume on a host like
// Railway/Render can be pointed at directly (e.g. DATA_DIR=/data), instead of
// relying on guessing the build tool's working directory at runtime.
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "src", "lib", "schema.sql");

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let dirty = false;
// Caches the in-flight initialization Promise itself (not just the resolved
// `db`), so concurrent early requests on a cold start all await the same
// init instead of racing into ensureSeeded() together. Without this, two
// requests can both see `db === null`, both see an empty `levels` table, and
// both try to INSERT the same seed rows — the second insert then dies with
// "UNIQUE constraint failed: levels.id". This bites hardest right after a
// fresh deploy (empty/ephemeral DB file) when several requests land at once.
let initPromise: Promise<Database> | null = null;

async function getSql(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
    });
  }
  return SQL;
}

export async function getDb(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const sql = await getSql();
    fs.mkdirSync(DATA_DIR, { recursive: true });

    let database: Database;
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      database = new sql.Database(buffer);
    } else {
      database = new sql.Database();
    }
    db = database;

    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    database.run(schema);
    runMigrations(database);
    persist();

    const { ensureSeeded, backfillMeaningsTranslations } = await import("./seed");
    await ensureSeeded();
    // Existing deployments (e.g. the live Railway DB) already had their vocab_items/
    // grammar_items rows inserted before meanings_json existed, so ensureSeeded()'s
    // "only seed an empty DB" guard skips them. Backfill separately, idempotently.
    await backfillMeaningsTranslations();
    persist();

    return database;
  })();

  try {
    return await initPromise;
  } catch (err) {
    // Initialization failed — clear so a later request can retry from scratch
    // instead of every future call permanently rejecting on this same promise.
    initPromise = null;
    db = null;
    throw err;
  }
}

// CREATE TABLE IF NOT EXISTS in schema.sql only helps brand-new databases —
// it does nothing for columns added to a table that already exists on disk
// (e.g. a live deployment with real signups). Each entry here is a single
// idempotent ALTER TABLE; "duplicate column" failures are expected on every
// run after the first and are swallowed on purpose.
function runMigrations(database: Database) {
  const statements = [
    "ALTER TABLE learners ADD COLUMN ui_language TEXT NOT NULL DEFAULT 'ja'",
    "ALTER TABLE vocab_items ADD COLUMN meanings_json TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE grammar_items ADD COLUMN meanings_json TEXT NOT NULL DEFAULT '{}'",
  ];
  for (const stmt of statements) {
    try {
      database.run(stmt);
    } catch {
      // Column already exists — already migrated, nothing to do.
    }
  }
}

/** Write the in-memory database back to disk. Cheap enough for prototype-scale data. */
export function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  dirty = false;
}

function markDirty() {
  dirty = true;
  // Fire-and-forget persist on next tick so bursts of writes coalesce into one flush.
  queueMicrotask(() => {
    if (dirty) persist();
  });
}

export async function run(sqlText: string, params: unknown[] = []): Promise<void> {
  const database = await getDb();
  database.run(sqlText, params as never);
  markDirty();
}

export async function all<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = [],
): Promise<T[]> {
  const database = await getDb();
  const stmt = database.prepare(sqlText);
  stmt.bind(params as never);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export async function get<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await all<T>(sqlText, params);
  return rows[0];
}