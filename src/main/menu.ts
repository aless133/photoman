import { Menu } from 'electron';
import { MenuAction } from '../types';

export function createMenu(onMenuAction: (action: MenuAction) => void) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Поиск дубликатов',
          click: () => onMenuAction('open-duplicates'),
        },
        {
          label: 'Обновить библиотеку',
          click: () => onMenuAction('update-library'),
        },
        { type: 'separator' },
        {
          label: 'Настройки',
          click: () => onMenuAction('open-settings'),
        },
        { type: 'separator' },
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
