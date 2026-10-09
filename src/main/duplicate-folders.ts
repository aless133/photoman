import path from 'path';
import type Database from 'better-sqlite3';
import { getDb } from './db';
import { getLibDir } from './settings';
import { DuplicateFile, DuplicateFolder, FilePlacement } from '../types';

type Row = DuplicateFile & { name: string };
type Folder = { path: string; files: Row[]; children: Folder[]; allFiles: Row[]; counts: Map<string, number> };
const fileKey = (file: Row) => JSON.stringify([file.name, file.size]);
const inside = (directory: string, filename: string): boolean => {
  const relative = path.relative(directory, filename);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

export function findDuplicateFolders(db: Database.Database = getDb(), library = getLibDir()): DuplicateFolder[] {
  if (!library || !path.isAbsolute(library)) return [];
  const root = path.resolve(library);
  const folders = new Map<string, Folder>();
  const getFolder = (directory: string): Folder => {
    let folder = folders.get(directory);
    if (!folder) {
      folder = { path: directory, files: [], children: [], allFiles: [], counts: new Map() };
      folders.set(directory, folder);
      if (directory !== root) getFolder(path.dirname(directory)).children.push(folder);
    }
    return folder;
  };
  const rootFolder = getFolder(root);
  const filesByKey = new Map<string, Row[]>();
  const rows = db.prepare('SELECT id, name, path, size, placement FROM files WHERE missing = 0').iterate() as Iterable<Row>;
  for (const row of rows) {
    const key = fileKey(row);
    const copies = filesByKey.get(key) ?? [];
    copies.push(row);
    filesByKey.set(key, copies);
    if (inside(root, row.path)) getFolder(path.dirname(path.resolve(row.path))).files.push(row);
  }

  // Only compare candidates sharing the source folder's rarest signature.
  const foldersByKey = new Map<string, Folder[]>();
  const collect = (folder: Folder): void => {
    folder.allFiles = [...folder.files];
    for (const child of folder.children) {
      collect(child);
      for (const file of child.allFiles) folder.allFiles.push(file);
    }
    for (const file of folder.allFiles) {
      const key = fileKey(file);
      folder.counts.set(key, (folder.counts.get(key) ?? 0) + 1);
    }
    if (folder.path === root) return;
    for (const key of folder.counts.keys()) {
      const candidates = foldersByKey.get(key) ?? [];
      candidates.push(folder);
      foldersByKey.set(key, candidates);
    }
  };
  collect(rootFolder);

  const result: DuplicateFolder[] = [];
  const grouped = new Set<Folder>();
  const pending = [rootFolder];
  const visit = (folder: Folder): void => {
    if (grouped.has(folder)) return;
    if (folder.path !== root && folder.allFiles.length > 0) {
      let candidates: Folder[] | undefined;
      for (const key of folder.counts.keys()) {
        const matches = foldersByKey.get(key) ?? [];
        if (!candidates || matches.length < candidates.length) candidates = matches;
      }
      const containing = (candidates ?? []).filter(candidate =>
        !inside(folder.path, candidate.path) && !inside(candidate.path, folder.path)
        && candidate.allFiles.length >= folder.allFiles.length
        && [...folder.counts].every(([key, count]) => (candidate.counts.get(key) ?? 0) >= count));
      const larger = containing.filter(candidate => candidate.allFiles.length > folder.allFiles.length);
      // Prefer the specific containing folder over its enclosing year/event.
      const mainFolders = larger.filter(candidate => !larger.some(other =>
        other !== candidate && inside(candidate.path, other.path)));
      const equal = containing.filter(candidate => candidate.allFiles.length === folder.allFiles.length);
      const identical = equal.filter(candidate => !equal.some(other =>
        other !== candidate && inside(candidate.path, other.path)));
      const betterCopies = (file: Row): Row[] => (filesByKey.get(fileKey(file)) ?? []).filter(copy =>
        copy.placement > file.placement && !inside(folder.path, copy.path));
      const covered = folder.allFiles.every(file => file.placement < FilePlacement.Canonical && betterCopies(file).length > 0);
      if (mainFolders.length || identical.length || covered) {
        const copyFolders = [...mainFolders, ...identical];
        result.push({
          path: folder.path,
          mainFolders: mainFolders.map(main => ({ path: main.path, extraFiles: main.allFiles.length - folder.allFiles.length }))
            .sort((a, b) => a.path.localeCompare(b.path)),
          identicalFolders: identical.map(copy => copy.path).sort((a, b) => a.localeCompare(b)),
          files: folder.allFiles.map(file => {
            const copies = copyFolders.length
              ? (filesByKey.get(fileKey(file)) ?? []).filter(copy => copyFolders.some(main => inside(main.path, copy.path)))
              : betterCopies(file);
            return {
              name: file.name,
              source: { id: file.id, path: file.path, size: file.size, placement: file.placement },
              copies: copies.map(copy => ({ id: copy.id, path: copy.path, size: copy.size, placement: copy.placement }))
                .sort((a, b) => b.placement - a.placement || a.path.localeCompare(b.path)),
            };
          }).sort((a, b) => a.source.path.localeCompare(b.source.path)),
        });
        // Equal folders form one group; do not repeat other members or subfolders.
        equal.forEach(copy => grouped.add(copy));
        return;
      }
    }
    pending.push(...folder.children.sort((a, b) => a.path.localeCompare(b.path)));
  };
  // Process parents across the whole tree before their descendants, so a
  // matching leaf cannot hide a complete sibling folder's main-folder relation.
  for (const folder of pending) visit(folder);
  return result.sort((a, b) => a.path.localeCompare(b.path));
}
