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

  const sql = await getSql();
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new sql.Database(buffer);
  } else {
    db = new sql.Database();
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.run(schema);
  persist();

  const { ensureSeeded } = await import("./seed");
  await ensureSeeded();
  persist();

  return db;
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
