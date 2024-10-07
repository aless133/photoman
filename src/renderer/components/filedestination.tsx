import React, { useState, useEffect } from 'react';

const FileDestination: React.FC<{
  destination: string;
  updateDestination: (value: string, all: boolean) => void;
}> = ({ destination, updateDestination }) => {
  const [inputValue, setInputValue] = useState<string>(destination??'');

  useEffect(() => {
    setInputValue(destination??'');
  }, [destination]);  

  return (
    <div className={'filedestination' + ((destination??'') !== inputValue ? ' filedestination-changed' : '')}>
      <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} />
      <div className="filedestination-actions">
        <button onClick={()=>updateDestination(inputValue,false)}>OK</button>
        <button onClick={()=>updateDestination(inputValue,true)}>Все</button>
        <button onClick={()=>setInputValue(destination??'')}>Отмена</button>
      </div>
    </div>
  );
};

export default FileDestination;
