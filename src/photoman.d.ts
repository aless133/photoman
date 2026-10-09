import { Destinations, DuplicateFolder, DuplicateGroup, DuplicateMode, LibraryProgress, MenuAction, NewFile, SettingsConfig, SettingsSaveResult, SettingsStatus } from './types';

declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
      findDuplicates: (mode: DuplicateMode) => Promise<DuplicateGroup[]>;
      findDuplicateFolders: () => Promise<DuplicateFolder[]>;
      getConfig: () => Promise<SettingsStatus>;
      saveConfig: (config: SettingsConfig) => Promise<SettingsSaveResult>;
      chooseDirectory: () => Promise<string | null>;
      copyFiles: (d: Destinations) => Promise<void>;
      updateLibrary: () => Promise<number>;
      onLibraryProgress: (callback: (progress: LibraryProgress) => void) => () => void;
      getFilesDir: () => string;
      getLibDir: () => string;
      onMenuAction: (callback: (action: MenuAction) => void) => () => void;
      onFilesChanged: (callback: () => void) => () => void;
    };
  }
}

export {};
