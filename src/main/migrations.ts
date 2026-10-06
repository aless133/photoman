import type Database from 'better-sqlite3';

// Entry 0 upgrades version 0 to 1, entry 1 will upgrade 1 to 2, etc.
const migrations: string[] = [
  `
    CREATE TABLE IF NOT EXISTS setting (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    DROP TABLE IF EXISTS files;
    CREATE TABLE files (
      id INTEGER PRIMARY KEY,
      path TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      date TEXT,
      taken_at INTEGER,
      missing INTEGER DEFAULT 0
    );
    CREATE INDEX idx_name_size ON files(name, size);
  `,
];

export function migrateSchema(db: Database.Database): void {
  const version = db.pragma('user_version', { simple: true }) as number;
  if (version > migrations.length) {
    throw new Error(`Версия базы ${version} новее поддерживаемой ${migrations.length}.`);
  }
  for (let index = version; index < migrations.length; index++) {
    db.transaction(() => {
      db.exec(migrations[index]);
      db.pragma(`user_version = ${index + 1}`);
    })();
  }
}
