import React, { useState } from 'react';

export default function Preview({ path }: { path: string }) {
  const [failed, setFailed] = useState(false);
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  const normalized = path.replace(/\\/g, '/');
  const encoded = normalized.split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
  const url = normalized.startsWith('//') ? `file:${encoded}`
    : normalized.startsWith('/') ? `file://${encoded}` : `file:///${encoded}`;
  const image = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif'].includes(extension);
  const video = ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(extension);
  return <div className="ratio ratio-4x3 bg-dark border rounded overflow-hidden">
    {failed || (!image && !video)
      ? <span className="d-flex align-items-center justify-content-center text-secondary small p-3 text-center">
        {failed ? 'Не удалось открыть файл' : 'Предпросмотр недоступен'}
      </span>
      : image
        ? <a href={url} target="_blank" rel="noreferrer" title="Открыть изображение в полном размере">
          <img src={url} alt={path} loading="lazy" className="w-100 h-100 object-fit-contain" onError={() => setFailed(true)} />
        </a>
        : <video src={url} controls preload="metadata" className="w-100 h-100 object-fit-contain" onError={() => setFailed(true)} />}
  </div>;
}
