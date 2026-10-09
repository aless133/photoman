export const parseDirectoryMasks = (input: string): string[] => input.split(',').map(mask => mask.trim()).filter(Boolean);

export function createDirectoryExcluder(input: string): (name: string) => boolean {
  const patterns = parseDirectoryMasks(input).map(mask => new RegExp(`^${mask
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')}$`, 'iu'));
  return name => patterns.some(pattern => pattern.test(name));
}
