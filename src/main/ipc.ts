import { dialog, ipcMain } from 'electron';
import { getLibDir, getSettingsStatus, saveSettings } from './settings';
import { getFiles, copyFiles } from './files';
import { updateLibrary } from './library';
import path from 'path';

export function registerIpc(onSettingsSaved: () => Promise<void>): void {
  // Keep settings changes and manual refreshes in order.
  let pending: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const result = pending.then(task);
    pending = result.catch(() => undefined);
    return result;
  };

  ipcMain.handle('files:get', () => getFiles());
  ipcMain.handle('files:copy', (event, d) => copyFiles(d));
  ipcMain.handle('library:update', () => enqueue(updateLibrary));

  ipcMain.handle('config:get', () => getSettingsStatus());
  ipcMain.handle('config:save', (_event, config) => enqueue(async () => {
    const previousLibraryDir = getLibDir();
    const status = await saveSettings(config);
    if (status.valid) {
      await onSettingsSaved();
      const normalize = (directory: string) => process.platform === 'win32'
        ? path.normalize(directory).toLowerCase() : path.normalize(directory);
      if (!previousLibraryDir || normalize(previousLibraryDir) !== normalize(status.libDir)) {
        await updateLibrary();
      }
    }
    return status;
  }));
  ipcMain.handle('config:choose-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
}
