import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { registerIpc } from './ipc';
import { createMenu } from './menu';
import { getDb } from './db';
import { getFilesDir } from './../config';
import { FSWatcher, watch } from 'chokidar';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import path from 'path';

const appDataRoot = app.getPath('appData');
const folderName = app.isPackaged ? 'photoman' : 'photoman-dev';
app.setPath('userData', path.join(appDataRoot, folderName));

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (started) {
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
      mainWindow.webContents.send('files:changed');
    }
  };

  watcher.on('add', notify);
  watcher.on('unlink', notify);
  watcher.on('change', notify);
  watcher.on('error', error => {
    // On Windows a photo can be temporarily locked by another application.
    // Chokidar emits an `error` event when it cannot attach fs.watch to that
    // particular file. Handling it keeps the watcher (and its directory-level
    // subscription) alive, so later additions/removals still reach the UI.
    const fsError = error as NodeJS.ErrnoException;
    if (fsError.code === 'EBUSY') {
      console.warn(`File watcher skipped a locked file: ${fsError.path ?? fsError.message}`);
      return;
    }
    console.error('File watcher error:', error);
  });
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
  getDb();
  registerIpc();
  await installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
    .then(extension => console.log(`Added Extension:  ${extension.name}`))
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
