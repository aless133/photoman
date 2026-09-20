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
  const hasMatches = !!file.found?.length;

  const getRelativePath = (fullPath: string, root: string): string => {
    const relativePath = fullPath.replace(root, '');
    const directoryPath = relativePath.substring(0, relativePath.lastIndexOf('\\'));
    return directoryPath;
  };

  const found = hasMatches
    ? file.found.map(f => (
        <div key={f} className="fileitem-found-item">
          <div className="fileitem-found-img">
            <Media source={f}/>
          </div>
          <div className="pt-1 small text-secondary text-break">
            {getRelativePath(f, window.photoman.getLibDir())}
          </div>
        </div>
      ))
    : null;

  return (
    <div className={'fileitem d-flex align-items-start gap-3 px-3 py-3 border-bottom' + (selected ? ' fileitem-selected' : '')}>
      <div className="fileitem-img">
        <Media source={file.name}/>
      </div>
      <div className="fileitem-name pt-1 fw-semibold text-light text-break" title={file.basename}>
        {file.basename}
      </div>
      <div className="fileitem-found d-flex flex-column gap-2">
        <div className="d-flex align-items-center gap-2 small text-secondary">
          <span className={'badge rounded-pill ' + (hasMatches ? 'bg-success' : 'bg-secondary')}>
            {file.found?.length ?? 0}
          </span>
          <span>{hasMatches ? 'Совпадения' : 'Совпадений нет'}</span>
        </div>
        {found}
      </div>
      <div className="fileitem-destination">
        <FileDestination destination={destination} updateDestination={updateDestination} />
      </div>
      <div className="fileitem-select d-flex justify-content-center pt-1">
        {!!destination &&
          <div className="form-check m-0 p-0">
            <input
              className="form-check-input form-check-input-lg"
              type="checkbox"
              aria-label={`Выбрать ${file.basename}`}
              checked={selected}
              onChange={e => updateSelected(e.target.checked)}
            />
          </div>
        }
      </div>
    </div>
  );
};

export default FileItem;
