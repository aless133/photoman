import React from 'react';

const getFileExtension = (url: string): string => {
  return url.split('.').pop()?.toLowerCase() || '';
};

type MediaType = 'image' | 'video' | 'unsupported';

const getMediaType = (fileExtension: string): MediaType => {
  if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
    return 'image';
  } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
    return 'video';
  } else {
    return 'unsupported';
  }
};

const Media: React.FC<{ source: string }> = ({ source }) => {
  const fileExtension = getFileExtension(source);
  const mediaType = getMediaType(fileExtension);

  return (
    <div className="media-preview ratio ratio-4x3 overflow-hidden border rounded bg-dark">
      {mediaType === 'image' ? (
        <img className="media-preview-content" src={`file://${source}`} alt="" loading="lazy" />
      ) : mediaType === 'video' ? (
        <video className="media-preview-content" controls preload="metadata">
          <source src={`file://${source}`} type={`video/${fileExtension}`} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <span className="d-flex align-items-center justify-content-center p-3 small text-center text-secondary">
          Формат не поддерживается
        </span>
      )}
    </div>
  );
};

export default Media;
