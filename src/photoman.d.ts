declare global {
  interface Window {
    photoman: {
      getFiles: () => Promise<NewFile[]>;
    };
  }
}

export {};
