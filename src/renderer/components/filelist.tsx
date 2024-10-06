import React, { useEffect, useState } from 'react';
// const { ipcRenderer } = window.require('electron');
// import { ipcRenderer } from 'electron';

const FileList: React.FC = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const fileList = await window.photoman.getImages();
                console.log(fileList);
                setFiles(fileList);
            } catch (err) {
                console.error(err);
                setError(err as string);
            }
        };

        fetchFiles();
    }, []);

    return (
        <div>
            <h2>Изображения</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {files.map((file, index) => (
                    <img key={index} src={`file://${file}`} width="400"/>
                ))}
            </ul>
        </div>
    );
};

export default FileList;
