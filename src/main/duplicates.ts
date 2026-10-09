import { getDb } from './db';
import { DuplicateGroup, DuplicateMode, FilePlacement } from '../types';

export function findDuplicates(mode: DuplicateMode): DuplicateGroup[] {
  if (mode !== 'name' && mode !== 'name-size') throw new Error('Неизвестный режим поиска дубликатов.');
  const bySize = mode === 'name-size';
  const rows = getDb().prepare(`
    WITH duplicates AS (
      SELECT name${bySize ? ', size' : ''}
      FROM files WHERE missing = 0
      GROUP BY name${bySize ? ', size' : ''} HAVING COUNT(*) > 1
    )
    SELECT f.id, f.name, f.path, f.size, f.placement FROM files f
    JOIN duplicates d ON f.name = d.name${bySize ? ' AND f.size = d.size' : ''}
    WHERE f.missing = 0
    ORDER BY f.name, ${bySize ? 'f.size,' : ''}
      f.placement DESC,
      f.size, f.path
  `).all() as { id: number; name: string; path: string; size: number; placement: FilePlacement }[];
  const groups: DuplicateGroup[] = [];
  for (const row of rows) {
    let group = groups[groups.length - 1];
    if (!group || group.name !== row.name || (bySize && group.size !== row.size)) {
      group = { name: row.name, size: bySize ? row.size : null, files: [] };
      groups.push(group);
    }
    group.files.push({ id: row.id, path: row.path, size: row.size, placement: row.placement });
  }
  return groups;
}
