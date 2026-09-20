import { contextBridge, ipcRenderer } from 'electron';
import { getFilesDir, getLibDir } from '../config';
import { Destinations } from './../types';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('files:get'),
  copyFiles: (d: Destinations) => ipcRenderer.invoke('files:copy', d),
  getFilesDir: () => getFilesDir(),
  getLibDir: () => getLibDir(),
  onFilesChanged: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('files:changed', listener);
    return () => {
      ipcRenderer.removeListener('files:changed', listener);
    };
  },
});
