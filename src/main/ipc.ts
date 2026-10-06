import { dialog, ipcMain } from 'electron';
import { getSettingsStatus, saveSettings } from './settings';
import { getFiles, copyFiles } from './files';

export function registerIpc(onSettingsSaved: () => Promise<void>): void {

  ipcMain.handle('files:get', () => getFiles());
  ipcMain.handle('files:copy', (event, d) => copyFiles(d));

  ipcMain.handle('config:get', () => getSettingsStatus());
  ipcMain.handle('config:save', async (_event, config) => {
    const status = await saveSettings(config);
    if (status.valid) await onSettingsSaved();
    return status;
  });
  ipcMain.handle('config:choose-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });
}
