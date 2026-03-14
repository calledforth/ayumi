import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// ============================================================================
// WINDOW STATE
// ============================================================================

let mainWindow: BrowserWindow | null = null;
let windowStateSaveTimer: NodeJS.Timeout | null = null;
const settingsStore = new Store();

const isExternalHttpUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const saveWindowBounds = (immediate = false): void => {
  if (!mainWindow) return;

  const doSave = () => {
    if (!mainWindow) return;
    const isMaximized = mainWindow.isMaximized();
    const bounds = isMaximized ? mainWindow.getNormalBounds() : mainWindow.getBounds();
    try {
      settingsStore.set('windowBounds', {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized,
      });
    } catch (error) {
      console.error('[Settings] Failed to persist window settings:', error);
    }
  };

  if (immediate) {
    if (windowStateSaveTimer) {
      clearTimeout(windowStateSaveTimer);
      windowStateSaveTimer = null;
    }
    doSave();
    return;
  }

  if (windowStateSaveTimer) clearTimeout(windowStateSaveTimer);
  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = null;
    doSave();
  }, 300);
};

// ============================================================================
// WINDOW CREATION
// ============================================================================

const createWindow = (): void => {
  let windowWidth = 1000;
  let windowHeight = 700;
  let windowX: number | undefined;
  let windowY: number | undefined;
  let shouldMaximize = false;

  try {
    const savedBounds = settingsStore.get('windowBounds') as
      | { width?: number; height?: number; x?: number; y?: number; isMaximized?: boolean }
      | undefined;
    if (savedBounds?.width) windowWidth = savedBounds.width;
    if (savedBounds?.height) windowHeight = savedBounds.height;
    if (typeof savedBounds?.x === 'number') windowX = savedBounds.x;
    if (typeof savedBounds?.y === 'number') windowY = savedBounds.y;
    shouldMaximize = Boolean(savedBounds?.isMaximized);
  } catch (error) {
    console.error('[Settings] Failed to read window settings:', error);
  }

  mainWindow = new BrowserWindow({
    height: windowHeight,
    width: windowWidth,
    x: windowX,
    y: windowY,
    backgroundColor: '#0c0c0c',
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (shouldMaximize) {
      mainWindow?.maximize();
    }
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalHttpUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow?.webContents.getURL();
    if (currentUrl && url !== currentUrl && isExternalHttpUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('close', () => saveWindowBounds(true));
  mainWindow.on('resize', () => saveWindowBounds());
  mainWindow.on('move', () => saveWindowBounds());
  mainWindow.on('closed', () => { mainWindow = null; });
};

const sendToRenderer = (channel: string, ...args: unknown[]) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send(channel, ...args);
  }
};

// ============================================================================
// AUTO-UPDATER
// ============================================================================

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = console;

autoUpdater.on('checking-for-update', () => sendToRenderer('updater-checking'));
autoUpdater.on('update-available', (info) => sendToRenderer('updater-available', { version: info.version }));
autoUpdater.on('update-not-available', () => sendToRenderer('updater-not-available'));
autoUpdater.on('download-progress', (progress) => sendToRenderer('updater-progress', progress.percent));
autoUpdater.on('update-downloaded', () => sendToRenderer('updater-downloaded'));
autoUpdater.on('error', (error) => sendToRenderer('updater-error', error.message));

ipcMain.handle('updater-check-for-updates', () => {
  if (isDev) {
    sendToRenderer('updater-checking');
    setTimeout(() => sendToRenderer('updater-not-available'), 500);
    return;
  }
  autoUpdater.checkForUpdates();
});

ipcMain.handle('updater-download', () => autoUpdater.downloadUpdate());

ipcMain.handle('updater-quit-and-install', () => {
  saveWindowBounds(true);
  autoUpdater.quitAndInstall(true, true);
});

// ============================================================================
// WINDOW CONTROL IPC
// ============================================================================

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// ============================================================================
// SETTINGS IPC (electron-store for local prefs like theme, window bounds)
// ============================================================================

ipcMain.handle('settings-get', (_event, key: string) => {
  const value = settingsStore.get(key);
  return typeof value === 'string' ? value : null;
});

ipcMain.handle('settings-set', (_event, key: string, value: string) => {
  settingsStore.set(key, value);
  return { success: true };
});

ipcMain.handle('settings-delete', (_event, key: string) => {
  settingsStore.delete(key);
  return { success: true };
});

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.on('ready', () => {
  createWindow();

  if (!isDev) {
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
