import React, { useEffect, useState } from 'react';
import Settings from './components/settings';
import LibraryProgressView from './components/library-progress';
import Duplicates from './components/duplicates/duplicates';
import { LibraryProgress, SettingsStatus } from './../types';

type Screen = 'empty' | 'settings' | 'duplicates';

function App() {
  const [status, setStatus] = useState<SettingsStatus>();
  const [currentScreen, setCurrentScreen] = useState<Screen>('empty');
  const [error, setError] = useState('');
  const [libraryProgress, setLibraryProgress] = useState<LibraryProgress>();
  useEffect(() => {
    const unsubscribeProgress = window.photoman.onLibraryProgress(setLibraryProgress);
    const unsubscribe = window.photoman.onMenuAction(action => {
      switch (action) {
        case 'open-duplicates':
          setCurrentScreen('duplicates');
          break;
        case 'open-settings':
          setCurrentScreen('settings');
          break;
        case 'update-library':
          setError('');
          setLibraryProgress({ phase: 'scanning', processed: 0, total: null });
          window.photoman.updateLibrary()
            .catch(err => setLibraryProgress(previous => ({
              phase: 'error', processed: previous?.processed ?? 0,
              total: previous?.total ?? null, error: String(err),
            })));
          break;
      }
    });
    window.photoman.getConfig().then(setStatus).catch(err => setError(String(err)));
    return () => {
      unsubscribe();
      unsubscribeProgress();
    };
  }, []);
  if (!status) return <div className="p-3">{error || 'Проверка каталогов...'}</div>;
  const screen = status.valid ? currentScreen : 'settings';
  let content: React.ReactNode = null;
  switch (screen) {
    case 'duplicates':
      content = <Duplicates />;
      break;
    case 'settings':
      content = <Settings initial={status} onSaved={saved => {
        setStatus(saved);
        setCurrentScreen('empty');
        setError('');
      }} onCancel={() => setCurrentScreen('empty')} />;
      break;
    case 'empty':
      content = error
        ? <div className="p-3 text-danger" role="status">{error}</div>
        : null;
      break;
  }
  return <>
    {libraryProgress && <LibraryProgressView progress={libraryProgress} />}
    {content}
  </>;
}

export default App;
