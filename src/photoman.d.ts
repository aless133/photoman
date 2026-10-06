import { Destinations, NewFile, SettingsConfig, SettingsStatus } from './types';

declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
      getConfig: () => Promise<SettingsStatus>;
      saveConfig: (config: SettingsConfig) => Promise<SettingsStatus>;
      chooseDirectory: () => Promise<string | null>;
      copyFiles: (d: Destinations) => Promise<void>;
      getFilesDir: () => string;
      getLibDir: () => string;
      onFilesChanged: (callback: () => void) => () => void;
    };
  }
}

export {};
