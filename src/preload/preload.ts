import { contextBridge, ipcRenderer  } from 'electron';

contextBridge.exposeInMainWorld('photoman', {
  getImages: ()=>ipcRenderer.invoke('get-images'),
})

