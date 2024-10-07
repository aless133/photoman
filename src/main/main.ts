import { app, BrowserWindow, ipcMain } from 'electron';
import { getFiles } from './files';
import { createMenu } from './menu';
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

    // // Watch a specific directory
    // const directoryToWatch = path.join(__dirname, 'your-directory'); // Change this to your directory
    // const watcher = chokidar.watch(directoryToWatch, { persistent: true });

    // watcher.on('all', (event, path) => {
    //     console.log(event, path); // Log the event and path of the changed file
    //     // Send an IPC message to the renderer process
    //     mainWindow.webContents.send('file-changed', { event, path });
    // });  


  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // mainWindow.webContents.openDevTools();
};

createMenu();
app.on('ready', createWindow);

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

