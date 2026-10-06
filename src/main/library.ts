import { promises as fs } from 'fs';
import path from 'path';
import { getDb } from './db';
import { getLibDir } from './settings';
import { getFileDate } from './library-date';

export type LibraryFile = { path: string; name: string; size: number; date: string | null };

async function scanLibrary(directory: string): Promise<LibraryFile[]> {
  if (!directory || !path.isAbsolute(directory)) {
    throw new Error('Укажите полный путь к каталогу библиотеки в настройках.');
  }
  const entries = await fs.readdir(directory, { recursive: true, withFileTypes: true });
  const files: LibraryFile[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filename = path.join(entry.parentPath, entry.name);
    const stat = await fs.stat(filename);
    files.push({ path: filename, name: entry.name, size: stat.size, date: getFileDate(entry.name) });
  }
  return files;
}

export async function updateLibrary(): Promise<number> {
  const db = getDb();
  db.prepare('DELETE FROM files').run();
  const files = await scanLibrary(getLibDir());
  const insert = db.prepare('INSERT INTO files (path, name, size, date) VALUES (?, ?, ?, ?)');
  // Batch inserts in a transaction to avoid committing each file separately.
  db.transaction(() => {
    for (const file of files) insert.run(file.path, file.name, file.size, file.date);
  })();
  return files.length;
}
