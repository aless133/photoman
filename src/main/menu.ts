import { Menu } from 'electron';

export function createMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Файл',
      submenu: [
      //   {
      //     label: 'Изменить рабочий каталог',
      //     click: () => {
      //       console.log('New File clicked');
      //       // Add your logic here
      //     },
      //   },
      //   {
      //     label: 'Изменить каталог хранилища',
      //     click: () => {
      //       console.log('Open File clicked');
      //       // Add your logic here
      //     },
      //   },
      //   { type: 'separator' },
        {
          label: 'Выход',
          role: 'quit', // This will automatically close the app
        },
      ],
    },
    {
      label: 'Dev',
      submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
