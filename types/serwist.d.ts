interface Serwist {
  register(options: { url: string; scope: string }): Promise<void>;
}

declare global {
  interface Window {
    serwist?: Serwist;
  }
}

export {};
