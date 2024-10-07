import { contextBridge, ipcRenderer } from 'electron';
import { filesDir, libDir } from '../main/config';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('get-files'),
  getFilesDir: () => filesDir,
  getLibDir: () => libDir,
});
