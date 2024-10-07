import FileList from './components/filelist';
function App() {
  return (
  <div>
    <h2>Изображения и видео в каталоге {window.photoman.getFilesDir()}</h2>
    <FileList/>
  </div>    
  );
}

export default App;
