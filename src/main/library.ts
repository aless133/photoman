import { promises as fs } from 'fs';
import path from 'path';
import { getDb } from './db';
import { getLibDir } from './settings';
import { getFileDate } from './library-date';
import { readMetadataDate } from './library-metadata';
import { app } from 'electron';
import { ExifTool } from 'exiftool-vendored';
import { getFilePlacement } from './library-placement';
import { FilePlacement, LibraryProgress } from '../types';

export async function updateLibrary(onProgress: (progress: LibraryProgress) => void = () => undefined): Promise<number> {
  let processed = 0;
  let total: number | null = null;
  let metadataTool: ExifTool | undefined;
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
    const insert = db.prepare('INSERT INTO files (path, name, size, date, placement) VALUES (?, ?, ?, ?, ?)');
    const batch: { path: string; name: string; size: number; date: string | null; placement: FilePlacement }[] = [];
    const writeBatch = db.transaction(() => {
      for (const file of batch) insert.run(file.path, file.name, file.size, file.date, file.placement);
    });
    let lastNotification = Date.now();
    for (const entry of entries) {
      const filename = path.join(entry.parentPath, entry.name);
      const stat = await fs.stat(filename);
      let date = getFileDate(entry.name);
      if (!date) {
        metadataTool ??= new ExifTool(app.isPackaged ? {
          exiftoolPath: path.join(process.resourcesPath,
            `exiftool-vendored.${process.platform === 'win32' ? 'exe' : 'pl'}`,
            'bin', process.platform === 'win32' ? 'exiftool.exe' : 'exiftool'),
        } : {});
        date = await readMetadataDate(metadataTool, filename);
      }
      batch.push({ path: filename, name: entry.name, size: stat.size, date,
        placement: getFilePlacement(filename, directory) });
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
  } finally {
    await metadataTool?.end();
  }
}

