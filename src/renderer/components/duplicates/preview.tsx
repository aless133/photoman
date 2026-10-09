import React, { useEffect, useState } from 'react';
import { getFileUrl, getPreviewType } from '../../../media-formats';

export default function Preview({ path }: { path: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [path]);
  const url = getFileUrl(path);
  const preview = getPreviewType(path);
  return <div className="media-preview ratio ratio-4x3 bg-dark border rounded overflow-hidden">
    {failed || !preview
      ? <span className="d-flex align-items-center justify-content-center text-secondary small p-3 text-center">
        {failed ? 'Не удалось открыть файл' : 'Предпросмотр недоступен'}
      </span>
      : preview === 'image'
        ? <a href={url} target="_blank" rel="noreferrer" title="Открыть изображение в полном размере">
          <img src={url} alt={path} loading="lazy" className="w-100 h-100 object-fit-contain" onError={() => setFailed(true)} />
        </a>
        : preview === 'audio'
          ? <audio src={url} controls preload="metadata" className="w-100" onError={() => setFailed(true)} />
          : <video src={url} controls preload="metadata" className="w-100 h-100 object-fit-contain" onError={() => setFailed(true)} />}
  </div>;
}
