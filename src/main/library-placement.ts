import path from 'path';
import { FilePlacement } from '../types';

export function getFilePlacement(filename: string, library: string): FilePlacement {
  if (!library || !path.isAbsolute(library)) return FilePlacement.Other;
  const relative = path.relative(library, filename);
  if (path.isAbsolute(relative)) return FilePlacement.Other;
  const parts = relative.split(path.sep);
  if (parts.length < 3 || !/^\d{4}$/.test(parts[0])) return FilePlacement.Other;
  const match = /^(\d{4})\.(\d{2})(?:\.(\d{2}))?$/.exec(parts[1]);
  if (!match || match[1] !== parts[0]) return FilePlacement.Other;
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return FilePlacement.Other;
  if (!match[3]) return FilePlacement.SemiCanonical;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return FilePlacement.Other;
  }
  return parts.length === 3 ? FilePlacement.Canonical : FilePlacement.SemiCanonical;
}
