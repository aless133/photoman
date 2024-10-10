import { app, BrowserWindow, ipcMain } from 'electron';
import { getFiles, copyFiles } from './files';
import { createMenu } from './menu';
import { getFilesDir } from './config';
import { watch } from 'chokidar';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
// import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

//console.log(app.getPath('userData'));
//C:\Users\User\AppData\Roaming\photoman

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 850,
    width: 1600,
    webPreferences: {
      webSecurity: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  ipcMain.handle('get-files', () => getFiles());
  ipcMain.handle('copy-files', (event, d) => copyFiles(d));

  const handleFilesChange = () => {
    mainWindow.webContents.send('files-changed');
  };
  const watcher = watch(getFilesDir(), { persistent: true });
  watcher.on('add', handleFilesChange).on('unlink', handleFilesChange);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
};

createMenu();
app.whenReady().then(async () => {
  await installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('REACT_DEVELOPER_TOOLS An error occurred: ', err));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
