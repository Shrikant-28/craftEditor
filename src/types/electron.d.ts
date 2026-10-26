export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  appPath: string;
  userDataPath: string;
}

export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getSystemInfo: () => Promise<SystemInfo>;
  loadNotes: () => Promise<any>;
  saveNotes: (notes: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  exportNote: (data: { title: string; content: string }) => Promise<{ canceled: boolean; filePath?: string; error?: string }>;
  openExternalUrl: (url: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}
