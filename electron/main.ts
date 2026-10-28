import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import {
  initDatabase,
  loadAllNotes,
  saveAllNotes,
  getDatabaseStats,
  closeDatabase,
  NoteRecord,
} from './database';

// Optimize V8 memory ceiling and Chromium background footprint
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');

let mainWindow: BrowserWindow | null = null;
let isContentProtected = false;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Remove default File, Edit, View, Window, Help menus completely
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Frameless window to use the custom Aura Notes TitleBar
    autoHideMenuBar: true,
    alwaysOnTop: true, // Application is on top of all screen
    icon: fs.existsSync(path.join(__dirname, '../public/note.jpg'))
      ? path.join(__dirname, '../public/note.jpg')
      : path.join(__dirname, '../dist/note.jpg'),
    title: `Aura Notes Desktop v${app.getVersion()}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.setMenu(null);

  // Enable microphone permissions for voice note recording
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(true);
  });

  // Intercept Ctrl+N / Cmd+N at window level to create new note
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      (input.control || input.meta) &&
      !input.alt &&
      !input.shift &&
      input.key.toLowerCase() === 'n' &&
      input.type === 'keyDown'
    ) {
      event.preventDefault();
      mainWindow?.webContents.send('shortcut:new-note');
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed() && isContentProtected) {
      mainWindow.setContentProtection(true);
    }
    mainWindow?.show();
  });

  // Memory management: purge Chromium cache when window is minimized
  mainWindow.on('minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.session.clearCache().catch(() => {});
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    // Initialize Local SQLite Database (aura_notes.sqlite)
    await initDatabase(app.getPath('userData'));
  } catch (err) {
    console.error('Failed to initialize SQLite database:', err);
  }

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  closeDatabase();
});

// IPC handlers for desktop communication
function setupIpcHandlers() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
    return mainWindow?.isMaximized();
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Always on top controls
  ipcMain.handle('window:set-always-on-top', (_, flag: boolean) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(flag, 'floating');
      return mainWindow.isAlwaysOnTop();
    }
    return false;
  });

  ipcMain.handle('window:is-always-on-top', () => {
    return mainWindow?.isAlwaysOnTop() ?? false;
  });

  // Window Opacity controls (e.g. 0.3 to 1.0 to see background text)
  ipcMain.handle('window:set-opacity', (_, opacity: number) => {
    if (mainWindow) {
      const clamped = Math.max(0.2, Math.min(1.0, opacity));
      mainWindow.setOpacity(clamped);
      return clamped;
    }
    return 1.0;
  });

  ipcMain.handle('window:get-opacity', () => {
    return mainWindow?.getOpacity() ?? 1.0;
  });

  // Screen protection / exclude from screen sharing (setContentProtection)
  ipcMain.handle('window:set-content-protection', (_, enable: boolean) => {
    const target = Boolean(enable);
    isContentProtected = target;
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.setContentProtection(target);
        return { success: true, isProtected: isContentProtected };
      } catch (err) {
        console.error('Failed to setContentProtection:', err);
        return { success: false, isProtected: isContentProtected, error: String(err) };
      }
    }
    return { success: true, isProtected: isContentProtected };
  });

  ipcMain.handle('window:get-content-protection', () => {
    return isContentProtected;
  });

  // Query running processes to detect active meeting apps (Zoom, Teams, Zoho Meeting, etc.)
  ipcMain.handle('system:get-running-processes', async () => {
    return new Promise<string[]>((resolve) => {
      try {
        if (process.platform === 'win32') {
          execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true }, (err, stdout) => {
            if (err || !stdout) return resolve([]);
            const lines = stdout.split(/\r?\n/);
            const processes = new Set<string>();
            for (const line of lines) {
              const match = line.match(/^"([^"]+)"/);
              if (match && match[1]) {
                processes.add(match[1].toLowerCase().trim());
              }
            }
            resolve(Array.from(processes));
          });
        } else {
          execFile('ps', ['-e', '-o', 'comm='], (err, stdout) => {
            if (err || !stdout) return resolve([]);
            const lines = stdout.split(/\r?\n/).map(s => s.trim().toLowerCase()).filter(Boolean);
            resolve(Array.from(new Set(lines)));
          });
        }
      } catch (err) {
        console.error('Failed to query running processes:', err);
        resolve([]);
      }
    });
  });

  // System info
  ipcMain.handle('app:get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      appVersion: app.getVersion(),
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData'),
      databaseEngine: 'SQLite 3 (ACID Relational Storage: aura_notes.sqlite)',
    };
  });

  // App version
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  // Open external web URLs in native browser safely
  ipcMain.handle('shell:open-external', async (_, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // Local SQLite Database Handlers
  ipcMain.handle('storage:load-notes', async () => {
    try {
      return loadAllNotes();
    } catch (err) {
      console.error('Failed to load notes from SQLite:', err);
      return [];
    }
  });

  ipcMain.handle('storage:save-notes', async (_, notes: NoteRecord[]) => {
    try {
      const res = await saveAllNotes(notes);
      return { success: true, filePath: res.filePath, count: res.count, engine: 'SQLite' };
    } catch (err) {
      console.error('Failed to save notes to SQLite:', err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('storage:get-db-stats', async () => {
    try {
      return getDatabaseStats();
    } catch (err) {
      console.error('Failed to get database stats:', err);
      return null;
    }
  });

  // Export note to file dialog - Asynchronous
  ipcMain.handle('dialog:export-note', async (_, { title, content }) => {
    if (!mainWindow) return { canceled: true };
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Note',
      defaultPath: `${title.replace(/[^a-z0-9_-]/gi, '_')}.md`,
      filters: [
        { name: 'Markdown Documents', extensions: ['md'] },
        { name: 'Text Documents', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || !filePath) return { canceled: true };

    try {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return { canceled: false, filePath };
    } catch (err) {
      return { canceled: false, error: String(err) };
    }
  });
}
