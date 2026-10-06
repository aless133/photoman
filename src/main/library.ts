import { promises as fs } from 'fs';
import path from 'path';
import { getDb } from './db';
import { getLibDir } from './settings';
import { getFileDate } from './library-date';
import { LibraryProgress } from '../types';

export async function updateLibrary(onProgress: (progress: LibraryProgress) => void = () => undefined): Promise<number> {
  let processed = 0;
  let total: number | null = null;
  onProgress({ phase: 'scanning', processed, total });
  try {
    const db = getDb();
    db.prepare('DELETE FROM files').run();
    const directory = getLibDir();
    if (!directory || !path.isAbsolute(directory)) {
      throw new Error('Укажите полный путь к каталогу библиотеки в настройках.');
    }
    const entries = (await fs.readdir(directory, { recursive: true, withFileTypes: true }))
      .filter(entry => entry.isFile());
    total = entries.length;
    onProgress({ phase: 'indexing', processed, total });
    const insert = db.prepare('INSERT INTO files (path, name, size, date) VALUES (?, ?, ?, ?)');
    const batch: { path: string; name: string; size: number; date: string | null }[] = [];
    const writeBatch = db.transaction(() => {
      for (const file of batch) insert.run(file.path, file.name, file.size, file.date);
    });
    let lastNotification = Date.now();
    for (const entry of entries) {
      const filename = path.join(entry.parentPath, entry.name);
      const stat = await fs.stat(filename);
      batch.push({ path: filename, name: entry.name, size: stat.size, date: getFileDate(entry.name) });
      if (batch.length >= 200 || Date.now() - lastNotification >= 100 || processed + batch.length === total) {
        writeBatch();
        processed += batch.length;
        batch.length = 0;
        onProgress({ phase: 'indexing', processed, total });
        lastNotification = Date.now();
        await new Promise<void>(resolve => setImmediate(resolve));
      }
    }
    onProgress({ phase: 'done', processed, total });
    return processed;
  } catch (error) {
    onProgress({ phase: 'error', processed, total, error: String(error) });
    throw error;
  }
}
