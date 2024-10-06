import React, { useEffect, useState } from 'react';
import { NewFile } from '../../types';
import FileItem from './fileitem'

const FileList: React.FC = () => {
  const [files, setFiles] = useState<NewFile[]>([]);
  const [error, setError] = useState<string>();

  const fetchFiles = async () => {
    try {
      const fileList = await window.photoman.getFiles();
      console.log(fileList);
      setFiles(fileList);
    } catch (err) {
      console.error(err);
      setError(err as string);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Изображения</h2>
      <div className="filelist-list">
        {files.map((file, index) => <FileItem file={file}/>)}
      </div>
    </div>
  );
};

export default FileList;
