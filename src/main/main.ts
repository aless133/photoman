import { app, BrowserWindow, ipcMain } from 'electron';
import { getFiles, copyFiles } from './files';
import { createMenu } from './menu';
import { getFilesDir } from './config';
import { FSWatcher, watch } from 'chokidar';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
// import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

//console.log(app.getPath('userData'));
//C:\Users\User\AppData\Roaming\photoman

let mainWindow: BrowserWindow | null = null;
let watcher: FSWatcher | null = null;

const startWatcher = (): void => {
  if (watcher) return;                     // защита от двойного запуска

  watcher = watch(getFilesDir(), {
    persistent: true,
    ignoreInitial: true,                   // не шлём события при первом скане
    depth: 0,                              // только "Входящие", не лезем вглубь
    awaitWriteFinish: {                    // ждём, пока файл дозапишется
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  const notify = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('files-changed');
    }
  };

  watcher.on('add', notify);
  watcher.on('unlink', notify);
  watcher.on('change', notify);
};

const stopWatcher = async (): Promise<void> => {
  if (!watcher) return;
  await watcher.close();
  watcher = null;
};

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 850,
    width: 1600,
    webPreferences: {
      webSecurity: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.maximize();

  ipcMain.handle('get-files', () => getFiles());
  ipcMain.handle('copy-files', (event, d) => copyFiles(d));

  startWatcher();

  mainWindow.on('closed', () => {
    mainWindow = null;                     // чтобы notify не дёргал мёртвое окно
  });  

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

createMenu();
app.whenReady().then(async () => {
  await installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('REACT_DEVELOPER_TOOLS An error occurred: ', err));
  createWindow();
});

app.on('window-all-closed', async () => {
  await stopWatcher();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
