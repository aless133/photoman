import { ipcMain } from 'electron';
import { getFilesDir, getLibDir } from './../config';
import { getFiles, copyFiles } from './files';

export function registerIpc(): void {

  ipcMain.handle('files:get', () => getFiles());
  ipcMain.handle('files:copy', (event, d) => copyFiles(d));

  ipcMain.handle('config:get', () => ({
    libDir: getLibDir(),
    filesDir: getFilesDir(),
  }));
}
