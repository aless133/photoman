import { contextBridge, ipcRenderer } from 'electron';
import { getFilesDir, getLibDir } from '../main/config';
import { Destinations } from './../types';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('get-files'),
  copyFiles: (d: Destinations) => ipcRenderer.invoke('copy-files', d),
  getFilesDir: () => getFilesDir(),
  getLibDir: () => getLibDir(),
});
