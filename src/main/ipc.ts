import { dialog, ipcMain, WebContents } from 'electron';
import { getFilesDir, getLibDir, getSettingsStatus, saveSettings } from './settings';
import { getFiles, copyFiles } from './files';
import { updateLibrary } from './library';
import path from 'path';
import { findDuplicates } from './duplicates';
import { findDuplicateFolders } from './duplicate-folders';

export function registerIpc(onSettingsSaved: () => Promise<void>): void {
  // Keep settings changes and manual refreshes in order.
  let pending: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const result = pending.then(task);
    pending = result.catch(() => undefined);
    return result;
  };
  const refreshLibrary = (sender: WebContents) => updateLibrary(progress => {
    if (!sender.isDestroyed()) sender.send('library:progress', progress);
  });

  ipcMain.handle('files:get', () => getFiles());
  ipcMain.handle('files:copy', (event, d) => copyFiles(d));
  ipcMain.handle('library:update', event => enqueue(() => refreshLibrary(event.sender)));
  ipcMain.handle('duplicates:find', (_event, mode) => enqueue(async () => findDuplicates(mode)));
  ipcMain.handle('duplicates:folders', () => enqueue(async () => findDuplicateFolders()));

  ipcMain.handle('config:get', () => getSettingsStatus());
  ipcMain.handle('config:save', (event, config) => enqueue(async () => {
    const previousLibraryDir = getLibDir();
    const previousFilesDir = getFilesDir();
    const status = await saveSettings(config);
    let libraryUpdateScheduled = false;
    if (status.valid) {
      await onSettingsSaved();
      const normalize = (directory: string) => process.platform === 'win32'
        ? path.normalize(directory).toLowerCase() : path.normalize(directory);
      if (!previousLibraryDir || normalize(previousLibraryDir) !== normalize(status.libDir)
        || normalize(previousFilesDir) !== normalize(status.filesDir)) {
        libraryUpdateScheduled = true;
        // Return saved settings first so the renderer can show the update screen.
        void enqueue(() => refreshLibrary(event.sender)).catch(() => undefined);
      }
    }
    return { ...status, libraryUpdateScheduled };
  }));
  ipcMain.handle('config:choose-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
}
