import React, { useEffect, useState } from 'react';
import { NewFile } from './../../types';

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

  return (
    <div>
      <h2>Изображения</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {files.map((file, index) => (
          <li>
            <img key={index} src={`file://${file.name}`} width="100" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;
