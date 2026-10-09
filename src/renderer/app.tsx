import React, { useEffect, useRef, useState } from 'react';
import Settings from './components/settings';
import LibraryProgressView from './components/library-progress';
import Duplicates from './components/duplicates/duplicates';
import { LibraryProgress, SettingsStatus } from './../types';

type Screen = 'empty' | 'settings' | 'duplicates' | 'library';

function App() {
  const [status, setStatus] = useState<SettingsStatus>();
  const [currentScreen, setCurrentScreen] = useState<Screen>('empty');
  const [error, setError] = useState('');
  const [libraryProgress, setLibraryProgress] = useState<LibraryProgress>();
  const [readMetadata, setReadMetadata] = useState(false);
  const [libraryStarting, setLibraryStarting] = useState(false);
  const libraryRequestPending = useRef(false);
  const startLibraryUpdate = async () => {
    if (libraryRequestPending.current) return;
    libraryRequestPending.current = true;
    setLibraryStarting(true);
    setLibraryProgress(undefined);
    try {
      await window.photoman.updateLibrary({ readMetadata });
    } catch (err) {
      setLibraryProgress(previous => ({
        phase: 'error', processed: previous?.processed ?? 0, total: previous?.total ?? null,
        startedAt: previous?.startedAt ?? Date.now(), finishedAt: Date.now(), readMetadata,
        error: String(err),
      }));
    } finally {
      libraryRequestPending.current = false;
      setLibraryStarting(false);
    }
  };
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
          setCurrentScreen('library');
          setError('');
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
    case 'library':
      content = <main>
        <div className="p-3 p-sm-4 mx-auto library-progress">
          <div className="d-flex justify-content-between align-items-center gap-3">
            <h1 className="h4 mb-0">Обновление библиотеки</h1>
            <button className="btn btn-primary" onClick={() => setCurrentScreen('empty')}>Закрыть</button>
          </div>
          {(libraryProgress?.phase === 'scanning' || libraryProgress?.phase === 'indexing') &&
            <p className="small text-secondary mt-2 mb-0">При закрытии экрана обновление продолжится.</p>}
        </div>
        <LibraryProgressView progress={libraryProgress} starting={libraryStarting} readMetadata={readMetadata}
          onReadMetadataChange={setReadMetadata} onStart={startLibraryUpdate} />
      </main>;
      break;
    case 'duplicates':
      content = <Duplicates />;
      break;
    case 'settings':
      content = <Settings initial={status} onSaved={saved => {
        setStatus(saved);
        if (saved.libraryUpdateRequired) {
          setLibraryProgress(undefined);
          setCurrentScreen('library');
        } else {
          setCurrentScreen('empty');
        }
        setError('');
      }} onCancel={() => setCurrentScreen('empty')} />;
      break;
    case 'empty':
      content = error
        ? <div className="p-3 text-danger" role="status">{error}</div>
        : null;
      break;
  }
  return <>{content}</>;
}

export default App;
