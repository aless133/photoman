import path from 'path';
import { getMediaType } from '../media-formats';

const namePatterns: RegExp[] = [
  /^(?:\(\d+\))?(?:IMG|VID|PANO)_?(\d{4})(\d{2})(\d{2})(?:_?\d{6}|(?=[_. -]|$))/i,
  /^video_(\d{4})-(\d{2})-(\d{2})(?=[_. -]|$)/i,
  /^(\d{4})(\d{2})(\d{2})_?\d{6}(?=[_. -]|$)/,
  /^(\d{4})(\d{2})(\d{2})(?=[_. -]|$)/,
  /^(\d{4})[.-](\d{2})[.-](\d{2})(?=[_. -]|$)/,
];

export function getFileDate(filename: string): string | null {
  if (getMediaType(filename) === 'unknown') return null;
  const name = path.basename(filename);
  const stem = name.slice(0, name.lastIndexOf('.'));
  for (const pattern of namePatterns) {
    const match = stem.match(pattern);
    if (!match) continue;
    const [year, month, day] = match.slice(1, 4).map(Number);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
  }
  return null;
}

