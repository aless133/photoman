import { promises as fs } from 'fs';
import path from 'path';
import { getDb } from './db';
import { SettingsConfig, SettingsStatus } from '../types';
import { parseDirectoryMasks } from './directory-exclusions';

function readSetting(key: string): string {
  const row = getDb().prepare('SELECT value FROM setting WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? '';
}

export const getFilesDir = (): string => readSetting('import_dir');
export const getLibDir = (): string => readSetting('library_dir');
export const getExcludedDirectoryMasks = (): string => readSetting('excluded_directory_masks');

export async function validateSettings(config: SettingsConfig): Promise<string[]> {
  const errors: string[] = [];
  for (const [label, directory] of [['Каталог импорта', config.filesDir], ['Каталог библиотеки', config.libDir]]) {
    if (!directory || !path.isAbsolute(directory)) {
      errors.push(`${label}: укажите полный путь к каталогу.`);
      continue;
    }
    try {
      if (!(await fs.stat(directory)).isDirectory()) errors.push(`${label}: путь не является каталогом.`);
    } catch {
      errors.push(`${label}: каталог не существует или недоступен.`);
    }
  }
  return errors;
}

export async function getSettingsStatus(): Promise<SettingsStatus> {
  const config = { filesDir: getFilesDir(), libDir: getLibDir(), excludedDirectoryMasks: getExcludedDirectoryMasks() };
  const errors = await validateSettings(config);
  return { ...config, errors, valid: errors.length === 0 };
}

export async function saveSettings(input: SettingsConfig): Promise<SettingsStatus> {
  if (typeof input?.filesDir !== 'string' || typeof input?.libDir !== 'string') {
    throw new Error('Укажите оба каталога.');
  }
  if (input.excludedDirectoryMasks !== undefined && typeof input.excludedDirectoryMasks !== 'string') {
    throw new Error('Укажите маски исключаемых каталогов строкой через запятую.');
  }
  const config = { filesDir: input.filesDir.trim(), libDir: input.libDir.trim(),
    excludedDirectoryMasks: parseDirectoryMasks(input.excludedDirectoryMasks ?? '').join(', ') };
  const errors = await validateSettings(config);
  if (errors.length) return { ...config, errors, valid: false };
  const write = getDb().prepare('INSERT INTO setting (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  getDb().transaction(() => {
    write.run('import_dir', path.normalize(config.filesDir));
    write.run('library_dir', path.normalize(config.libDir));
    write.run('excluded_directory_masks', config.excludedDirectoryMasks);
  })();
  return getSettingsStatus();
}
