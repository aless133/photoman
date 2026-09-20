import React, { useCallback, useEffect, useState } from 'react';
import { Destinations, NewFile } from '../../types';
import FileItem from './fileitem';

const FilesList: React.FC<{
  destinations: Destinations;
  setDestinations: React.Dispatch<React.SetStateAction<Destinations>>;
}> = ({ destinations, setDestinations }) => {
  const [state, setState] = useState<string>('loading');
  const [files, setFiles] = useState<NewFile[]>([]);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);

  const updateDestination = (key: string, value: string, all: boolean) => {
    setDestinations(prevState => {
      const newDest = { ...prevState };
      const oldVal = prevState[key];
      if (all) {
        for (const k in newDest)
          if (newDest[k] == oldVal) {
            if (!value) updateSelected(k, false);
            newDest[k] = value;
          }
      } else {
        if (!value) updateSelected(key, false);
        newDest[key] = value;
      }
      return newDest;
    });
  };

  const updateSelected = (item: string, isChecked: boolean) => {
    setSelected(prevSelected => {
      if (isChecked) {
        return [...prevSelected, item];
      } else {
        return prevSelected.filter(i => i !== item);
      }
    });
  };

  const fetchFiles = async () => {
    setState('loading');
    try {
      const fileList = await window.photoman.getFiles();
      setDestinations(prevDestinations => {
        const newDestinations = { ...prevDestinations };
        for (const file of fileList) {
          if (file.destination && !newDestinations[file.name]) {
            newDestinations[file.name] = file.destination;
          }
        }
        return newDestinations;
      });
      setSelected(fileList.filter(file => !file.found).map(file => file.name));
      setFiles(fileList);
      setState('ok');
    } catch (err) {
      console.error(err);
      setState('error');
      setError(String(err));
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFilesChange = useCallback(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    return window.photoman.onFilesChanged(handleFilesChange);
  }, [handleFilesChange]);

  const copyFiles = async () => {
    setState('copying');
    try {
      await window.photoman.copyFiles(
        Object.fromEntries(Object.entries(destinations).filter(([key]) => selected.includes(key)))
      );
      await fetchFiles();
    } catch (err) {
      console.error(err);
      setState('error');
      setError(String(err));
    }
  };

  if (state == 'loading')
    return (
      <div className="d-flex align-items-center gap-2">
        <span>Загрузка...</span>
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      </div>
    );
  else if (state == 'copying')
    return (
      <div className="d-flex align-items-center gap-2">
        <span>Копирование...</span>
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      </div>
    );
  else if (state == 'error') return <p className="fs-5 fw-bold text-danger">{error}</p>;

  const foundCount = files.filter(file => !!file.found?.length).length;
  const destinationCount = files.filter(file => !!destinations[file.name]).length;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="filelist-summary d-flex overflow-hidden border rounded shadow-sm bg-dark">
        <div className="filelist-summary-path d-flex align-items-center gap-2 px-3 py-2 border-end">
          <span className="small fw-bold text-uppercase text-secondary">Входящие</span>
          <span className="text-truncate text-light" title={window.photoman.getFilesDir()}>
            {window.photoman.getFilesDir()}
          </span>
          <span className="badge rounded-pill bg-primary">{files.length}</span>
        </div>
        <div className="filelist-summary-path d-flex align-items-center gap-2 px-3 py-2 border-end">
          <span className="small fw-bold text-uppercase text-secondary">Библиотека</span>
          <span className="text-truncate text-light" title={window.photoman.getLibDir()}>
            {window.photoman.getLibDir()}
          </span>
          <span className="badge rounded-pill bg-success">{foundCount}</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 border-end">
          <span className="small fw-bold text-uppercase text-secondary">Назначено</span>
          <span className="badge rounded-pill bg-info text-dark">{destinationCount}</span>
        </div>
        <div className="d-flex align-items-center gap-2 px-3 py-2 text-nowrap">
          <span className="small fw-bold text-uppercase text-secondary">Выбрано</span>
          <span className="badge rounded-pill bg-warning text-dark">{selected.length}</span>
          {JSON.stringify(selected)}
          <button className="btn btn-success" onClick={copyFiles} disabled={selected.length === 0}>
            Копировать
          </button>
        </div>
      </div>

      <div className="overflow-hidden border rounded shadow-sm">
        <div className="filelist-columns d-flex align-items-center gap-3 px-3 py-2 border-bottom small fw-bold text-uppercase text-secondary bg-dark" aria-hidden="true">
          <span className="filelist-column-preview flex-shrink-0">Превью</span>
          <span className="filelist-column-name flex-shrink-0">Файл</span>
          <span className="filelist-column-found flex-shrink-0">В библиотеке</span>
          <span className="filelist-column-destination flex-grow-1">Назначение</span>
          <span className="filelist-column-select flex-shrink-0 text-center">Выбор</span>
        </div>
        <div className="filelist-list">
          {files.length > 0 ? (
            files.map(file => (
              <FileItem
                key={file.name}
                file={file}
                destination={destinations[file.name]}
                updateDestination={(val, all) => updateDestination(file.name, val, all)}
                selected={selected.includes(file.name)}
                updateSelected={isChecked => updateSelected(file.name, isChecked)}
              />
            ))
          ) : (
            <div className="px-3 py-5 text-center text-secondary">
              В каталоге пока нет изображений или видео.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilesList;
