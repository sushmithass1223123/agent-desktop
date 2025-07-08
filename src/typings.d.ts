// Global type declarations

declare global {
  interface Window {
    __TMACSDK?: {
      SDKClient: {
        events: {
          emit(event: string, data: any): void;
        };
      };
    };
  }
}

// This makes the file a module (required for global augmentation)
export {};