import path from 'path';
import type Database from 'better-sqlite3';
import { getDb } from './db';
import { getLibDir } from './settings';
import { DuplicateFile, DuplicateFolder, FilePlacement } from '../types';

type Row = DuplicateFile & { name: string; hasBetter: number };
type Folder = { path: string; files: Row[]; children: Folder[]; total: number; covered: number };

export function findDuplicateFolders(db: Database.Database = getDb(), library = getLibDir()): DuplicateFolder[] {
  if (!library || !path.isAbsolute(library)) return [];
  const root = path.resolve(library);
  const folders = new Map<string, Folder>();
  const getFolder = (directory: string): Folder => {
    let folder = folders.get(directory);
    if (!folder) {
      folder = { path: directory, files: [], children: [], total: 0, covered: 0 };
      folders.set(directory, folder);
      if (directory !== root) getFolder(path.dirname(directory)).children.push(folder);
    }
    return folder;
  };
  const rootFolder = getFolder(root);
  const rows = db.prepare(`
    SELECT f.id, f.name, f.path, f.size, f.placement,
      f.placement < 2 AND EXISTS (SELECT 1 FROM files c WHERE c.missing = 0 AND c.name = f.name
        AND c.size = f.size AND c.placement > f.placement) AS hasBetter
    FROM files f WHERE f.missing = 0
  `).iterate() as Iterable<Row>;
  for (const row of rows) {
    const relative = path.relative(root, row.path);
    if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) continue;
    getFolder(path.dirname(path.resolve(root, relative))).files.push(row);
  }
  const count = (folder: Folder): void => {
    folder.total = folder.files.length;
    folder.covered = folder.files.filter(file => file.placement < FilePlacement.Canonical && file.hasBetter).length;
    for (const child of folder.children) {
      count(child);
      folder.total += child.total;
      folder.covered += child.covered;
    }
  };
  count(rootFolder);
  const copies = db.prepare(`SELECT id, path, size, placement FROM files
    WHERE missing = 0 AND name = ? AND size = ? AND placement > ?
    ORDER BY placement DESC, path`);
  const collect = (folder: Folder): Row[] => folder.files.concat(...folder.children.map(collect));
  const result: DuplicateFolder[] = [];
  const visit = (folder: Folder): void => {
    if (folder.path !== root && folder.total > 0 && folder.covered === folder.total) {
      result.push({ path: folder.path, files: collect(folder).map(file => ({
        name: file.name,
        source: { id: file.id, path: file.path, size: file.size, placement: file.placement },
        copies: copies.all(file.name, file.size, file.placement) as DuplicateFile[],
      })).sort((a, b) => a.source.path.localeCompare(b.source.path)) });
      return;
    }
    for (const child of folder.children) visit(child);
  };
  visit(rootFolder);
  return result.sort((a, b) => a.path.localeCompare(b.path));
}
