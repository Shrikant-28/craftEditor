import { contextBridge, ipcRenderer } from 'electron';

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
}

const electronAPI: ElectronAPI = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  getSystemInfo: () => ipcRenderer.invoke('app:get-system-info'),
  loadNotes: () => ipcRenderer.invoke('storage:load-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('storage:save-notes', notes),
  exportNote: (data) => ipcRenderer.invoke('dialog:export-note', data),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
