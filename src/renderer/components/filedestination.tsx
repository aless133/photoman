import React, { useState, useEffect } from 'react';

const FileDestination: React.FC<{
  destination: string;
  updateDestination: (value: string, all: boolean) => void;
}> = ({ destination, updateDestination }) => {
  const [inputValue, setInputValue] = useState<string>(destination??'');
  const isChanged = (destination??'') !== inputValue;

  useEffect(() => {
    setInputValue(destination??'');
  }, [destination]);  

  return (
    <div>
      <input
        className={'form-control' + (isChanged ? ' bg-info' : '')}
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
      />
      {isChanged && (
        <div className="d-flex gap-2 mt-2">
          <button className="btn btn-sm btn-info flex-fill" onClick={()=>updateDestination(inputValue,false)}>OK</button>
          <button className="btn btn-sm btn-secondary flex-fill" onClick={()=>updateDestination(inputValue,true)}>Все</button>
          <button className="btn btn-sm btn-warning flex-fill" onClick={()=>setInputValue(destination??'')}>Отмена</button>
        </div>
      )}
    </div>
  );
};

export default FileDestination;
