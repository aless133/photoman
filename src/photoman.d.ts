declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
      getFilesDir: () => string;
    };
  }
}

export {};
