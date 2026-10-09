import path from 'path';
import { FilePlacement } from '../types';

type DatePart = { year: number; month: number; day: number | null };
type Period = { start: DatePart; end: DatePart };

function parsePart(token: string, year: number, inherited?: DatePart): DatePart | null {
  let result: DatePart;
  const full = /^(\d{4})\.(\d{1,2})(?:\.(\d{1,2}))?$/.exec(token);
  if (full) {
    result = { year: Number(full[1]), month: Number(full[2]), day: full[3] ? Number(full[3]) : null };
  } else if (inherited && /^(\d{1,2})\.(\d{1,2})$/.test(token)) {
    const [month, day] = token.split('.').map(Number);
    result = { year, month, day };
  } else if (inherited && /^\d{1,2}$/.test(token)) {
    result = inherited.day === null
      ? { year, month: Number(token), day: null }
      : { year, month: inherited.month, day: Number(token) };
  } else return null;
  if (result.year !== year || result.month < 1 || result.month > 12) return null;
  if (result.day !== null) {
    const date = new Date(0);
    date.setUTCFullYear(year, result.month - 1, result.day);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== result.month - 1 || date.getUTCDate() !== result.day) {
      return null;
    }
  }
  return result;
}

const dateOrder = (date: DatePart) => date.month * 100 + (date.day ?? 0);

function parsePeriod(directory: string, year: number): Period | null {
  // A spaced hyphen starts a title, which may begin with a number ("10 лет").
  // A full YYYY.MM[.DD] after it still denotes an explicit period endpoint.
  const datePrefix = /^\d{4}\.\d{1,2}(?:\.\d{1,2})?/;
  const title = / *- +/.exec(directory);
  const suffix = title ? directory.slice(title.index + title[0].length) : '';
  if (title && !datePrefix.test(suffix) && !/^\d+(?:\.\d+)*$/.test(suffix)) {
    directory = directory.slice(0, title.index);
  }
  const match = /^(\d{4}\.\d{1,2}(?:\.\d{1,2})?)(?: *- *(\d+(?:\.\d+)*))?((?:,\d{1,2})*)(?: +.*)?$/.exec(directory);
  if (!match) return null;
  const start = parsePart(match[1], year);
  if (!start) return null;
  const end = match[2] ? parsePart(match[2], year, start) : start;
  if (!end || (start.day === null) !== (end.day === null) || dateOrder(end) < dateOrder(start)) return null;
  if (match[3]) {
    // Lists such as 2018.08.23,25 must validate every date, not just the first.
    if (match[2] || start.day === null) return null;
    let previous = start;
    for (const token of match[3].slice(1).split(',')) {
      const next = parsePart(token, year, start);
      if (!next || dateOrder(next) <= dateOrder(previous)) return null;
      previous = next;
    }
  }
  return { start, end };
}

export function getFilePlacement(filename: string, library: string): FilePlacement {
  if (!library || !path.isAbsolute(library)) return FilePlacement.Other;
  const relative = path.relative(library, filename);
  if (path.isAbsolute(relative)) return FilePlacement.Other;
  const parts = relative.split(path.sep);
  if (parts.length < 3 || !/^\d{4}$/.test(parts[0])) return FilePlacement.Other;
  const year = Number(parts[0]);
  const period = parsePeriod(parts[1], year);
  if (!period) return FilePlacement.Other;
  if (period.start.day === null) {
    return FilePlacement.SemiCanonical;
  }
  return parts.length === 3 ? FilePlacement.Canonical : FilePlacement.SemiCanonical;
}
