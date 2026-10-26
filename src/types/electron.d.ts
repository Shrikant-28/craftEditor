export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  appVersion: string;
  appPath: string;
  userDataPath: string;
  databaseEngine?: string;
}

export interface DatabaseStats {
  filePath: string;
  fileSizeBytes: number;
  totalNotes: number;
  totalVoiceRecordings: number;
  engine: string;
}

export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getSystemInfo: () => Promise<SystemInfo>;
  getAppVersion: () => Promise<string>;
  loadNotes: () => Promise<any[]>;
  saveNotes: (notes: any[]) => Promise<{ success: boolean; filePath?: string; count?: number; engine?: string; error?: string }>;
  getDatabaseStats: () => Promise<DatabaseStats | null>;
  exportNote: (data: { title: string; content: string }) => Promise<{ canceled: boolean; filePath?: string; error?: string }>;
  openExternalUrl: (url: string) => Promise<boolean>;
}

declare global {
  const __APP_VERSION__: string;

  interface Window {
    electronAPI?: ElectronAPI;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

