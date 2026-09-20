import Database from 'better-sqlite3';
import { getDbPath } from './config';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id        INTEGER PRIMARY KEY,
      path      TEXT UNIQUE NOT NULL,
      name      TEXT NOT NULL,
      size      INTEGER NOT NULL,
      mtime     INTEGER NOT NULL,
      taken_at  INTEGER,
      missing   INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_name_size ON files(name, size);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}