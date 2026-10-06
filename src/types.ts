export type FileGroups = Record<string, string[]>;

export type NewFile = {
  name: string;
  basename: string;
  type?: string;
  destination?: string | null;
  found?: string[];
};

export type Destinations = Record<string, string>;

export type MenuAction = 'open-settings' | 'update-library';

export type LibraryProgress = {
  phase: 'scanning' | 'indexing' | 'done' | 'error';
  processed: number;
  total: number | null;
  error?: string;
};

export type SettingsConfig = { filesDir: string; libDir: string };
export type SettingsStatus = SettingsConfig & { valid: boolean; errors: string[] };
