import { contextBridge, ipcRenderer } from 'electron';
import { Destinations, DuplicateMode, LibraryProgress, MenuAction, SettingsConfig, SettingsStatus } from './../types';

let settings: SettingsConfig = { filesDir: '', libDir: '' };
async function loadSettings(channel: string, config?: SettingsConfig): Promise<SettingsStatus> {
  const status: SettingsStatus = await ipcRenderer.invoke(channel, config);
  if (status.valid) settings = { filesDir: status.filesDir, libDir: status.libDir };
  return status;
}

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('files:get'),
  findDuplicates: (mode: DuplicateMode) => ipcRenderer.invoke('duplicates:find', mode),
  copyFiles: (d: Destinations) => ipcRenderer.invoke('files:copy', d),
  updateLibrary: () => ipcRenderer.invoke('library:update'),
  getConfig: () => loadSettings('config:get'),
  saveConfig: (config: SettingsConfig) => loadSettings('config:save', config),
  chooseDirectory: () => ipcRenderer.invoke('config:choose-directory'),
  getFilesDir: () => settings.filesDir,
  getLibDir: () => settings.libDir,
  onLibraryProgress: (callback: (progress: LibraryProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: LibraryProgress) => callback(progress);
    ipcRenderer.on('library:progress', listener);
    return () => ipcRenderer.removeListener('library:progress', listener);
  },
  onMenuAction: (callback: (action: MenuAction) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: MenuAction) => callback(action);
    ipcRenderer.on('menu:action', listener);
    return () => {
      ipcRenderer.removeListener('menu:action', listener);
    };
  },
  onFilesChanged: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('files:changed', listener);
    return () => {
      ipcRenderer.removeListener('files:changed', listener);
    };
  },
});
