import { promises as fs } from 'fs';
import path from 'path';

const getImages = async (directoryPath: string) => {
  try {
    const files = await fs.readdir(directoryPath);
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.arw'].includes(ext);
      })
      // .map(file => `file://${path.join(directoryPath, file)}`)
      .map(file => path.join(directoryPath, file));
  } catch (err) {
    throw new Error('Unable to scan directory: ' + err);
  }
};

export { getImages };
