declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
      getFilesDir: () => string;
      getLibDir: () => string;
    };
  }
}

export {};
