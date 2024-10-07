import React, { useEffect, useState } from 'react';
import { NewFile } from '../../types';
import FileItem from './fileitem';

const FileList: React.FC = () => {
  const [state, setState] = useState<string>('loading');
  const [files, setFiles] = useState<NewFile[]>([]);
  const [error, setError] = useState<string>();

  const fetchFiles = async () => {
    try {
      const fileList = await window.photoman.getFiles();
      console.log(fileList);
      setState('ok');
      setFiles(fileList);
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
        {files.map((file, index) => (
          <FileItem file={file} />
        ))}
      </div>
  );
};

export default FileList;
