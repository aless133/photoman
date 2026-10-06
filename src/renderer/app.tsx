import React, { useEffect, useState } from 'react';
import FilesList from './components/fileslist';
import Settings from './components/settings';
import { Destinations, SettingsStatus } from './../types';
function App() {
  const [destinations, setDestinations] = useState<Destinations>({});
  const [status, setStatus] = useState<SettingsStatus>();
  const [error, setError] = useState('');
  useEffect(() => {
    window.photoman.getConfig().then(setStatus).catch(err => setError(String(err)));
  }, []);
  if (!status) return <div className="p-3">{error || 'Проверка каталогов...'}</div>;
  if (!status.valid) return <Settings initial={status} onSaved={setStatus} />;
  return (
  <div className="p-3">
    <h2>Изображения и видео в каталоге {window.photoman.getFilesDir()}</h2>
    <FilesList destinations={destinations} setDestinations={setDestinations}/>
  </div>
  );
}

export default App;
