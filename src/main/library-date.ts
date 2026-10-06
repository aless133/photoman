import path from 'path';

const namePatterns: RegExp[] = [
  /^(?:IMG|VID)_?(\d{4})(\d{2})(\d{2})_?\d{6}.*\.(?:jpg|jpeg|mp4)$/i,
  /^video_(\d{4})-(\d{2})-(\d{2})_\d{2}-\d{2}-\d{2}.*\.mp4$/i,
];

export function getFileDate(filename: string): string | null {
  for (const pattern of namePatterns) {
    const match = path.basename(filename).match(pattern);
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
