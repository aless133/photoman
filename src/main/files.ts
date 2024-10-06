import { promises as fs } from 'fs';
import path from 'path';
import { NewFile, FileGroups } from './../types';

const dirLib = 'd:\\photo\\',
  dirFiles = 'd:\\!pic\\';

async function getFileGroups(dir: string) {
  const libAll = await fs.readdir(dir, { recursive: true, withFileTypes: true });
  const libGroups = libAll
    .filter(file => file.isFile())
    .reduce((acc, file) => {
      if (!acc[file.name]) {
        acc[file.name] = [];
      }
      acc[file.name].push(file.parentPath + '\\' + file.name);
      return acc;
    }, {} as FileGroups);
  return libGroups;
}

export async function getFiles(): Promise<NewFile[]> {
  const library = await getFileGroups(dirLib);
  const files = await fs.readdir(dirFiles);
  const newFiles = files.map(file => {
    const name = path.join(dirFiles, file);
    const found = library[file];
    const ext = path.extname(file).toLowerCase();
    const type = ['.jpg', '.jpeg', '.arw'].includes(ext) ? 'image' : ['.mp4'].includes(ext) ? 'video' : 'unknown';
    const ymd = extractDate(file);
    return { name, type, found, ymd };
  });
  console.log(newFiles);
  return newFiles;
}

const datePatterns = [
  /IMG_(\d{4})(\d{2})(\d{2})_\d{6}.*\.mp4/, // IMG_20211210_040455_CINEMATIC.mp4
  /IMG(\d{4})(\d{2})(\d{2})_\d{6}.*\.mp4/, // IMG20211210_040455_CINEMATIC.mp4 or IMG20211210040455_1.mp4
  /IMG(\d{4})(\d{2})(\d{2})\d{6}.*\.mp4/, // IMG20211210040455_CINEMATIC.mp4 or IMG20211210040455_1.mp4
  /IMG_(\d{4})(\d{2})(\d{2})_\d{6}.*\.jpg/, // IMG_20140101_040533_BURST1.jpg
  /VID_(\d{4})(\d{2})(\d{2})_\d{6}.*\.mp4/, // VID_20211118_205122_1456233458294.mp4
  /VID(\d{4})(\d{2})(\d{2})\d{6}.*\.mp4/, // VID20211118205122_1456233458294.mp4
  /video_(\d{4})-(\d{2})-(\d{2})_\d{2}-\d{2}-\d{2}.*\.mp4/, // video_2021-07-27_10-31-57.mp4 or video_2021-07-27.mp4
];

// Extract date from the filename using the regular expressions
function extractDate(filename: string) {
  for (const pattern of datePatterns) {
    const match = filename.match(pattern);
    if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return null;
}
