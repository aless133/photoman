import { ipcMain } from 'electron';
import { getFilesDir, getLibDir } from './../config';

export function registerIpc(): void {
  ipcMain.handle('config:get', () => ({
    libDir: getLibDir(),
    filesDir: getFilesDir(),
  }));
}
