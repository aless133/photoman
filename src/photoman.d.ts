import { Destinations } from './types';

declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
      copyFiles: (d: Destinations) => Promise<void>;
      getFilesDir: () => string;
      getLibDir: () => string;
      onFilesChanged: (callback: () => void) => void;
      offFilesChanged: (callback: () => void) => void;      
    };
  }
}

export {};
