import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';

// Optimize V8 memory ceiling and Chromium background footprint
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function getNotesFilePath() {
  const userDataDir = app.getPath('userData');
  return path.join(userDataDir, 'aura_notes_store.json');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    frame: true, // Native titlebar or custom styling
    backgroundColor: '#0b0f19',
    show: false, // Don't show until ready-to-show to prevent white flash
    title: 'Aura Notes Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Enable microphone permissions for voice note recording
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(true);
  });

  mainWindow.once('ready-to-show', () => {
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
app.whenReady().then(() => {
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

  // System info
  ipcMain.handle('app:get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData'),
    };
  });

  // Open external web URLs in native browser safely
  ipcMain.handle('shell:open-external', async (_, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // Local file storage for notes - Asynchronous non-blocking I/O
  ipcMain.handle('storage:load-notes', async () => {
    try {
      const filePath = getNotesFilePath();
      if (fs.existsSync(filePath)) {
        const raw = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load notes from disk:', err);
    }
    return null;
  });

  ipcMain.handle('storage:save-notes', async (_, notes) => {
    try {
      const filePath = getNotesFilePath();
      // Use compact JSON serialization without indent to avoid 2x string memory bloat
      await fs.promises.writeFile(filePath, JSON.stringify(notes), 'utf-8');
      return { success: true, filePath };
    } catch (err) {
      console.error('Failed to save notes to disk:', err);
      return { success: false, error: String(err) };
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
