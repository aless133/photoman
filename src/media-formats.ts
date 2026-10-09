// Classification and browser preview support are different: RAW, TIFF and
// legacy video containers can be indexed/copied even without a native preview.
export const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.avif',
  '.tif', '.tiff', '.arw', '.dng', '.heic', '.heif', '.cr2', '.cr3', '.nef', '.nrw',
  '.orf', '.rw2', '.raf', '.pef', '.srw', '.psd'];
export const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.ogg',
  '.ogv', '.mpeg', '.mpg', '.mts', '.m2ts', '.3gp', '.wmv', '.vob', '.asf'];
const audioExtensions = ['.mp3', '.wav', '.m4a'];

export function getFileExtension(filename: string): string {
  const name = filename.split(/[\\/]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot).toLowerCase() : '';
}

export function getMediaType(filename: string): 'image' | 'video' | 'audio' | 'unknown' {
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension) ? 'image'
    : videoExtensions.includes(extension) ? 'video'
      : audioExtensions.includes(extension) ? 'audio' : 'unknown';
}

export function getPreviewType(filename: string): 'image' | 'video' | 'audio' | null {
  const extension = getFileExtension(filename);
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.avif'].includes(extension)) return 'image';
  if (['.mp4', '.mov', '.m4v', '.webm', '.ogg', '.ogv'].includes(extension)) return 'video';
  return audioExtensions.includes(extension) ? 'audio' : null;
}

export function canReadCaptureMetadata(filename: string): boolean {
  // Camera thumbnails and XMP sidecars may retain the original capture date.
  return getMediaType(filename) !== 'unknown' || ['.thm', '.xmp'].includes(getFileExtension(filename));
}

export function getFileUrl(filename: string): string {
  const normalized = filename.replace(/\\/g, '/');
  const encoded = normalized.split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
  return normalized.startsWith('//') ? `file:${encoded}`
    : normalized.startsWith('/') ? `file://${encoded}` : `file:///${encoded}`;
}
