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
      setError(err.toString());
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFilesChange = useCallback(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    window.photoman.onFilesChanged(handleFilesChange);
    return () => {
      window.photoman.offFilesChanged(handleFilesChange);
    };
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
      setError(err.toString());
    }
  };

  if (state == 'loading')
    return (
      <p>
        Loading...<span className="loader"></span>
      </p>
    );
  else if (state == 'copying')
    return (
      <p>
        Copying...<span className="loader"></span>
      </p>
    );
  else if (state == 'error') return <p className="error">{error}</p>;

  return (
    <div className="filelist">
      <div className="filelist-header">
        <div className="filelist-header-name">
          {window.photoman.getFilesDir()} Файлов <span className="count">{files.length}</span>
        </div>
        <div className="filelist-header-found">
          {window.photoman.getLibDir()} Найдено <span className="count">{files.filter(f => f.found).length}</span>
        </div>
        <div className="filelist-header-destination">
          Указано <span className="count">{files.filter(f => !!destinations[f.name]).length}</span>
        </div>
        <div className="filelist-header-selected">
          Выбрано <span className="count">{selected.length}</span>
          <button onClick={copyFiles}>Копировать</button>
        </div>
      </div>
      <div className="filelist-list">
        {files.map(file => (
          <FileItem
            key={file.name}
            file={file}
            destination={destinations[file.name]}
            updateDestination={(val, all) => updateDestination(file.name, val, all)}
            selected={selected.includes(file.name)}
            updateSelected={isChecked => updateSelected(file.name, isChecked)}
          />
        ))}
      </div>
    </div>
  );
};

export default FilesList;
