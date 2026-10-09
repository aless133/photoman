import path from 'path';
import type Database from 'better-sqlite3';
import { getDb } from './db';
import { getLibDir } from './settings';
import { DuplicateFile, DuplicateFolder, FilePlacement } from '../types';

type Row = DuplicateFile & { name: string };
type Folder = { path: string; files: Row[]; counts: Map<string, number> };
const fileKey = (file: Row) => JSON.stringify([file.name, file.size]);

export function findDuplicateFolders(db: Database.Database = getDb(), library = getLibDir()): DuplicateFolder[] {
  if (!library || !path.isAbsolute(library)) return [];
  const root = path.resolve(library);
  const folders = new Map<string, Folder>();
  const getFolder = (directory: string): Folder => {
    let folder = folders.get(directory);
    if (!folder) {
      folder = { path: directory, files: [], counts: new Map() };
      folders.set(directory, folder);
    }
    return folder;
  };
  const rows = db.prepare('SELECT id, name, path, size, placement FROM files WHERE missing = 0').iterate() as Iterable<Row>;
  for (const row of rows) {
    const relative = path.relative(root, row.path);
    if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`)) continue;
    getFolder(path.dirname(path.resolve(root, relative))).files.push(row);
  }

  // Compare each directory's own files. Empty year/event containers are
  // never compared, and child folders remain independent even if a parent has files.
  const directories = [...folders.values()].filter(folder => folder.path !== root)
    .sort((a, b) => a.path.localeCompare(b.path));
  const filesByKey = new Map<string, Row[]>();
  const foldersByKey = new Map<string, Folder[]>();
  for (const folder of directories) {
    for (const file of folder.files) {
      const key = fileKey(file);
      folder.counts.set(key, (folder.counts.get(key) ?? 0) + 1);
      const copies = filesByKey.get(key) ?? [];
      copies.push(file);
      filesByKey.set(key, copies);
    }
    for (const key of folder.counts.keys()) {
      const candidates = foldersByKey.get(key) ?? [];
      candidates.push(folder);
      foldersByKey.set(key, candidates);
    }
  }

  const result: DuplicateFolder[] = [];
  const grouped = new Set<Folder>();
  for (const folder of directories) {
    if (grouped.has(folder)) continue;
    // Only compare candidates sharing the source folder's rarest signature.
    let candidates: Folder[] | undefined;
    for (const key of folder.counts.keys()) {
      const matches = foldersByKey.get(key) ?? [];
      if (!candidates || matches.length < candidates.length) candidates = matches;
    }
    const containing = (candidates ?? []).filter(candidate => candidate !== folder
      && candidate.files.length >= folder.files.length
      && [...folder.counts].every(([key, count]) => (candidate.counts.get(key) ?? 0) >= count));
    const mainFolders = containing.filter(candidate => candidate.files.length > folder.files.length);
    const identical = containing.filter(candidate => candidate.files.length === folder.files.length);
    const betterCopies = (file: Row): Row[] => (filesByKey.get(fileKey(file)) ?? []).filter(copy =>
      copy.placement > file.placement);
    const covered = folder.files.every(file => file.placement < FilePlacement.Canonical && betterCopies(file).length > 0);
    if (!mainFolders.length && !identical.length && !covered) continue;
    const copyPaths = new Set([...mainFolders, ...identical].map(copy => copy.path));
    result.push({
      path: folder.path,
      mainFolders: mainFolders.map(main => ({ path: main.path, extraFiles: main.files.length - folder.files.length }))
        .sort((a, b) => a.path.localeCompare(b.path)),
      identicalFolders: identical.map(copy => copy.path).sort((a, b) => a.localeCompare(b)),
      files: folder.files.map(file => {
        const copies = copyPaths.size
          ? (filesByKey.get(fileKey(file)) ?? []).filter(copy => copyPaths.has(path.dirname(path.resolve(copy.path))))
          : betterCopies(file);
        return {
          name: file.name,
          source: { id: file.id, path: file.path, size: file.size, placement: file.placement },
          copies: copies.map(copy => ({ id: copy.id, path: copy.path, size: copy.size, placement: copy.placement }))
            .sort((a, b) => b.placement - a.placement || a.path.localeCompare(b.path)),
        };
      }).sort((a, b) => a.source.path.localeCompare(b.source.path)),
    });
    // Equal folders form one group, with no preferred member.
    identical.forEach(copy => grouped.add(copy));
  }
  return result;
}
