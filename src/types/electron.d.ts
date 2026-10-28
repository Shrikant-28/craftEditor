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
  onNewNote?: (callback: () => void) => () => void;
  setAlwaysOnTop?: (alwaysOnTop: boolean) => Promise<boolean>;
  isAlwaysOnTop?: () => Promise<boolean>;
  setOpacity?: (opacity: number) => Promise<number>;
  getOpacity?: () => Promise<number>;
  setContentProtection?: (enable: boolean) => Promise<{ success: boolean; isProtected: boolean; error?: string }>;
  getContentProtection?: () => Promise<boolean>;
  getRunningProcesses?: () => Promise<string[]>;
}

declare global {
  const __APP_VERSION__: string;

  interface Window {
    electronAPI?: ElectronAPI;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

