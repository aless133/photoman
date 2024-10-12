import React from 'react';

const getFileExtension = (url: string): string => {
  return url.split('.').pop()?.toLowerCase() || '';
};

type MediaType = 'image' | 'video' | 'unsupported';

const getMediaType = (fileExtension: string): MediaType => {
  if (['jpg', 'jpeg', 'arw'].includes(fileExtension)) {
    return 'image';
  } else if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
    return 'video';
  } else {
    return 'unsupported';
  }
};

const modifySource = (source: string, fileExtension: string): string => {
  if (fileExtension === 'arw') {
    const isInArwSubfolder = source.includes('/arw/');
    const pathParts = source.split('/');
    const fileName = pathParts.pop(); // Get the file name

    // Replace the file extension with .jpg
    const newFileName = fileName?.replace(/\.[^/.]+$/, '.jpg'); // Change extension to .jpg

    if (isInArwSubfolder) {
      // Change to parent folder
      return [...pathParts.slice(0, -1), newFileName].join('/'); // Remove the subfolder and add new file name
    } else {
      // Change to arw subfolder
      return [...pathParts, 'arw', newFileName].join('/'); // Add 'arw' subfolder and new file name
    }
  }
  return source; // Return original source for other extensions
};


const Media: React.FC<{ source: string }> = ({ source }) => {
  const fileExtension = getFileExtension(source);
  const modifiedSource = modifySource(source, fileExtension);
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
