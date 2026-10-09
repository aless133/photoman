import { getDb } from './db';
import type Database from 'better-sqlite3';
import { DuplicateGroup, DuplicateMode, FilePlacement } from '../types';

const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.ogg', '.ogv', '.mpeg', '.mpg', '.mts', '.m2ts', '.3gp', '.wmv'];

export function findDuplicates(mode: DuplicateMode, db: Database.Database = getDb()): DuplicateGroup[] {
  if (mode !== 'name' && mode !== 'name-size' && mode !== 'video-size') throw new Error('Неизвестный режим поиска дубликатов.');
  const videoSize = mode === 'video-size';
  const bySize = mode !== 'name';
  const keys = videoSize ? 'size' : `name${bySize ? ', size' : ''}`;
  const rows = db.prepare(`
    WITH eligible AS (
      SELECT id, name, path, size, placement FROM files WHERE missing = 0
      ${videoSize ? `AND (${videoExtensions.map(ext => `substr(lower(name), -${ext.length}) = '${ext}'`).join(' OR ')})` : ''}
    ), duplicates AS (
      SELECT ${keys} FROM eligible
      GROUP BY ${keys} HAVING ${videoSize ? 'COUNT(DISTINCT name)' : 'COUNT(*)'} > 1
    )
    SELECT f.id, f.name, f.path, f.size, f.placement FROM eligible f
    JOIN duplicates d ON ${videoSize ? 'f.size = d.size' : `f.name = d.name${bySize ? ' AND f.size = d.size' : ''}`}
    ORDER BY ${videoSize ? 'f.size,' : `f.name, ${bySize ? 'f.size,' : ''}`}
      f.placement DESC,
      f.size, f.path
  `).all() as { id: number; name: string; path: string; size: number; placement: FilePlacement }[];
  const groups: DuplicateGroup[] = [];
  for (const row of rows) {
    let group = groups[groups.length - 1];
    if (!group || (!videoSize && group.name !== row.name) || (bySize && group.size !== row.size)) {
      group = { name: videoSize ? 'Видеофайлы одинакового размера' : row.name, size: bySize ? row.size : null, files: [] };
      groups.push(group);
    }
    group.files.push({ id: row.id, path: row.path, size: row.size, placement: row.placement });
  }
  return groups;
}
