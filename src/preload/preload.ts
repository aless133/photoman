import { contextBridge, ipcRenderer } from 'electron';
import { filesDir } from '../main/config';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: () => ipcRenderer.invoke('get-files'),
  getFilesDir: () => filesDir,
});
