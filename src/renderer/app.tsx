import React, { useEffect, useState } from 'react';
import Settings from './components/settings';
import { SettingsStatus } from './../types';

type Screen = 'empty' | 'settings';

function App() {
  const [status, setStatus] = useState<SettingsStatus>();
  const [currentScreen, setCurrentScreen] = useState<Screen>('empty');
  const [error, setError] = useState('');
  const [libraryMessage, setLibraryMessage] = useState('');
  useEffect(() => {
    const unsubscribe = window.photoman.onMenuAction(action => {
      switch (action) {
        case 'open-settings':
          setCurrentScreen('settings');
          break;
        case 'update-library':
          setError('');
          setLibraryMessage('Обновление библиотеки...');
          window.photoman.updateLibrary()
            .then(count => setLibraryMessage(`Библиотека обновлена. Файлов: ${count}.`))
            .catch(err => {
              setLibraryMessage('');
              setError(String(err));
            });
          break;
      }
    });
    window.photoman.getConfig().then(setStatus).catch(err => setError(String(err)));
    return unsubscribe;
  }, []);
  if (!status) return <div className="p-3">{error || 'Проверка каталогов...'}</div>;
  const screen = status.valid ? currentScreen : 'settings';
  switch (screen) {
    case 'settings':
      return <Settings initial={status} onSaved={saved => {
        setStatus(saved);
        setCurrentScreen('empty');
        setError('');
        setLibraryMessage('');
      }} onCancel={() => setCurrentScreen('empty')} />;
    case 'empty':
      return error || libraryMessage
        ? <div className={`p-3${error ? ' text-danger' : ''}`} role="status">{error || libraryMessage}</div>
        : null;
  }
}

export default App;
