import { contextBridge, ipcRenderer } from 'electron';
import { filesDir, libDir } from '../main/config';
import { Destinations } from './../types';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('get-files'),
  copyFiles: (d:Destinations) => ipcRenderer.invoke('copy-files',d),
  getFilesDir: () => filesDir,
  getLibDir: () => libDir,
});
