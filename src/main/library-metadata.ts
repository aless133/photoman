import { ExifDateTime, ExifTool, Tags } from 'exiftool-vendored';


export function getMetadataDate(tags: Tags): string | null {
  // Only embedded capture/creation dates; filesystem and modification dates
  // do not establish when a photo or video was taken.
  const candidates = [tags.SubSecDateTimeOriginal, tags.DateTimeOriginal,
    tags.CreationDate, tags.SubSecCreateDate, tags.CreateDate,
    tags.MediaCreateDate, tags.TrackCreateDate];
  for (const value of candidates) {
    const timestamp = value instanceof ExifDateTime ? value
      : typeof value === 'string' ? ExifDateTime.from(value) : undefined;
    if (!timestamp?.isValid || timestamp.year <= 1904) continue;


    const date = [timestamp.year, timestamp.month, timestamp.day]
      .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0')).join('.');
    return date;
  }
  return null;
}

export async function readMetadataDate(tool: ExifTool, filename: string): Promise<string | null> {
  try {
    return getMetadataDate(await tool.read(filename));
  } catch (error) {
    console.warn(`Cannot read capture date from ${filename}:`, String(error));
    return null;
  }
}

