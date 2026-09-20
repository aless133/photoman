import { contextBridge, ipcRenderer } from 'electron';
import { getFilesDir, getLibDir } from '../config';
import { Destinations } from './../types';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('files:get'),
  copyFiles: (d: Destinations) => ipcRenderer.invoke('files:copy', d),
  getFilesDir: () => getFilesDir(),
  getLibDir: () => getLibDir(),
  onFilesChanged: (callback: () => void) => {
    ipcRenderer.on('files-changed', () => callback());
  },
  offFilesChanged: (callback: () => void) => {
    ipcRenderer.removeListener('files-changed', callback);
  },
});
