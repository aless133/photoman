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
    <div>
      {mediaType === 'image' ? (
        <img src={`file://${source}`}/>
      ) : mediaType === 'video' ? (
        <video controls>
          <source src={`file://${source}`} type={`video/${fileExtension}`} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <p>Unsupported media type</p>
      )}
    </div>
  );
};

export default Media;
