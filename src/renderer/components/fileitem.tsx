import React, { useEffect, useState } from 'react';
import path from 'path';
import { NewFile } from '../../types';

const FileItem: React.FC<{ file: NewFile }> = ({ file }) => {
  let found = null;
  if (file.found) {
    found = (
      <div className="fileitem-found">
        {file.found.map(f => (
          <div className="fileitem-found-item">
            <img className="fileitem-found-img" src={`file://${f}`} />
            <div className="fileitem-found-name">{f}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="fileitem">
      <img className="fileitem-img" src={`file://${file.name}`} />
      <div className="fileitem-name">{file.basename}</div>
      {found}
    </div>
  );
};

export default FileItem;
