import { contextBridge, ipcRenderer } from 'electron';

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
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<boolean>;
  isAlwaysOnTop: () => Promise<boolean>;
  setOpacity: (opacity: number) => Promise<number>;
  getOpacity: () => Promise<number>;
}

const electronAPI: ElectronAPI = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  getSystemInfo: () => ipcRenderer.invoke('app:get-system-info'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  loadNotes: () => ipcRenderer.invoke('storage:load-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('storage:save-notes', notes),
  getDatabaseStats: () => ipcRenderer.invoke('storage:get-db-stats'),
  exportNote: (data) => ipcRenderer.invoke('dialog:export-note', data),
  openExternalUrl: (url) => ipcRenderer.invoke('shell:open-external', url),
  onNewNote: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('shortcut:new-note', handler);
    return () => {
      ipcRenderer.removeListener('shortcut:new-note', handler);
    };
  },
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:set-always-on-top', flag),
  isAlwaysOnTop: () => ipcRenderer.invoke('window:is-always-on-top'),
  setOpacity: (opacity: number) => ipcRenderer.invoke('window:set-opacity', opacity),
  getOpacity: () => ipcRenderer.invoke('window:get-opacity'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
