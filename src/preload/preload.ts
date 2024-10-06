import { contextBridge, ipcRenderer  } from 'electron';

contextBridge.exposeInMainWorld('photoman', {
  getFiles: ()=>ipcRenderer.invoke('get-files'),
})

