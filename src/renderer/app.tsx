import React, { useState } from 'react';
import FilesList from './components/fileslist';
import { Destinations } from './../types';
function App() {
  const [destinations, setDestinations] = useState<Destinations>({});
  return (
  <div>
    <h2>Изображения и видео в каталоге {window.photoman.getFilesDir()}</h2>
    <FilesList destinations={destinations} setDestinations={setDestinations}/>
  </div>    
  );
}

export default App;
