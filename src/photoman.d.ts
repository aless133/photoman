import { Destinations } from './types';

declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
      copyFiles: (d: Destinations) => Promise<void>;
      getFilesDir: () => string;
      getLibDir: () => string;
    };
  }
}

export {};
