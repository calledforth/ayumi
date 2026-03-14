import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Window controls
  windowControls: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },

  // Settings storage (electron-store for local prefs)
  settings: {
    get: (key: string): Promise<string | null> => ipcRenderer.invoke('settings-get', key),
    set: (key: string, value: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('settings-set', key, value),
    delete: (key: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('settings-delete', key),
  },

  // Auto-updater
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater-check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updater-download'),
    quitAndInstall: () => ipcRenderer.invoke('updater-quit-and-install'),

    onCheckingForUpdate: (callback: () => void) => {
      ipcRenderer.on('updater-checking', callback);
    },
    onUpdateAvailable: (callback: (info: { version: string }) => void) => {
      ipcRenderer.on('updater-available', (_event, info) => callback(info));
    },
    onUpdateNotAvailable: (callback: () => void) => {
      ipcRenderer.on('updater-not-available', callback);
    },
    onDownloadProgress: (callback: (percent: number) => void) => {
      ipcRenderer.on('updater-progress', (_event, percent) => callback(percent));
    },
    onUpdateDownloaded: (callback: () => void) => {
      ipcRenderer.on('updater-downloaded', callback);
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('updater-error', (_event, error) => callback(error));
    },
  },
});
