export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  openActiveWindow: () => Promise<void>;
  // Active window controls
  minimizeActiveWindow: () => Promise<void>;
  toggleMaximizeActiveWindow: () => Promise<void>;
  closeActiveWindow: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
