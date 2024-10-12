import React from 'react';
import FileDestination from './filedestination';
import { NewFile } from '../../types';
import Media from './media';

const FileItem: React.FC<{
  file: NewFile;
  destination: string;
  updateDestination: (value: string, all: boolean) => void;
  selected: boolean;
  updateSelected: (isChecked: boolean) => void;
}> = ({ file, destination, updateDestination, selected, updateSelected }) => {
  const getRelativePath = (fullPath: string, root: string): string => {
    const relativePath = fullPath.replace(root, '');
    const directoryPath = relativePath.substring(0, relativePath.lastIndexOf('\\'));
    return directoryPath;
  };

  const found = file.found
    ? file.found.map(f => (
        <div key={f} className="fileitem-found-item">
          <div className="fileitem-found-img">
            <Media source={f}/>
          </div>
          <div className="fileitem-found-name">{getRelativePath(f, window.photoman.getLibDir())}</div>
        </div>
      ))
    : null;

  return (
    <div className="fileitem">
      <div className="fileitem-img">
        <Media source={file.name}/>
      </div>
      <div className="fileitem-name">{file.basename}</div>
      <div className="fileitem-found">{found}</div>
      <div className="fileitem-destination">
        <FileDestination destination={destination} updateDestination={updateDestination} />
      </div>
      <div className="fileitem-select">
        {!!destination && <input type="checkbox" checked={selected} onChange={e => updateSelected(e.target.checked)} />}
      </div>
    </div>
  );
};

export default FileItem;
