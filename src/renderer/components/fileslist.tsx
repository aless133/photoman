import React, { useEffect, useState } from 'react';
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
        for (const k in newDest) if (newDest[k] == oldVal) newDest[k] = value;
      } else {
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
      const d = { ...destinations },
        s: string[] = [];
      for (const file of fileList) {
        if (file.destination && !destinations[file.name]) d[file.name] = file.destination;
        if (!file.found) s.push(file.name);
      }
      setDestinations(d);
      setSelected(s);
      setFiles(fileList);
      setState('ok');
    } catch (err) {
      console.error(err);
      setState('error');
      setError(err as string);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (state == 'loading')
    return (
      <p>
        Loading...<span className="loader"></span>
      </p>
    );
  else if (state == 'error') return <p className="error">{error}</p>;

  return (
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
  );
};

export default FilesList;
