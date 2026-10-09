import { Dirent, promises as fs } from 'fs';
import path from 'path';
import { createDirectoryExcluder } from './directory-exclusions';

export async function readLibraryFiles(directory: string, excludedDirectoryMasks: string): Promise<Dirent[]> {
  const isExcludedDirectory = createDirectoryExcluder(excludedDirectoryMasks);
  const pending = [directory];
  const files: Dirent[] = [];
  for (const current of pending) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      if (entry.isFile()) files.push(entry);
      else if (entry.isDirectory() && !isExcludedDirectory(entry.name)) {
        pending.push(path.join(current, entry.name));
      }
    }
  }
  return files;
}
