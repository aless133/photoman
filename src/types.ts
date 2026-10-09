export type FileGroups = Record<string, string[]>;

export type NewFile = {
  name: string;
  basename: string;
  type?: string;
  destination?: string | null;
  found?: string[];
};

export type Destinations = Record<string, string>;

export type MenuAction = 'open-settings' | 'update-library' | 'open-duplicates';

export type DuplicateMode = 'name' | 'name-size';
export const FilePlacement = {
  Other: 0,
  SemiCanonical: 1,
  Canonical: 2,
} as const;
export type FilePlacement = typeof FilePlacement[keyof typeof FilePlacement];
export type DuplicateFile = { id: number; path: string; size: number; placement: FilePlacement };
export type DuplicateGroup = { name: string; size: number | null; files: DuplicateFile[] };
export type DuplicateFolderFile = { name: string; source: DuplicateFile; copies: DuplicateFile[] };
export type DuplicateFolder = { path: string; files: DuplicateFolderFile[] };

export type LibraryProgress = {
  phase: 'scanning' | 'indexing' | 'done' | 'error';
  processed: number;
  total: number | null;
  error?: string;
};

export type SettingsConfig = { filesDir: string; libDir: string };
export type SettingsStatus = SettingsConfig & { valid: boolean; errors: string[] };
export type SettingsSaveResult = SettingsStatus & { libraryUpdateScheduled: boolean };
