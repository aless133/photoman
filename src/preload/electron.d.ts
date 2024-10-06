declare global {
  interface Window {
    photoman: {
      getImages: () => string[];
    };
  }
}

export {};
