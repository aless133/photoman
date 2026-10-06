import { contextBridge, ipcRenderer } from 'electron';
import { Destinations, MenuAction, SettingsConfig, SettingsStatus } from './../types';

let settings: SettingsConfig = { filesDir: '', libDir: '' };
async function loadSettings(channel: string, config?: SettingsConfig): Promise<SettingsStatus> {
  const status: SettingsStatus = await ipcRenderer.invoke(channel, config);
  if (status.valid) settings = { filesDir: status.filesDir, libDir: status.libDir };
  return status;
}

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('files:get'),
  copyFiles: (d: Destinations) => ipcRenderer.invoke('files:copy', d),
  getConfig: () => loadSettings('config:get'),
  saveConfig: (config: SettingsConfig) => loadSettings('config:save', config),
  chooseDirectory: () => ipcRenderer.invoke('config:choose-directory'),
  getFilesDir: () => settings.filesDir,
  getLibDir: () => settings.libDir,
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
