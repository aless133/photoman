import { promises as fs } from 'fs';
import path from 'path';
import { NewFile, FileGroups, Destinations } from './../types';
import { getLibDir, getFilesDir } from './config';

async function getLibrary(dir: string) {
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
  const library = await getLibrary(getLibDir());
  const files = await fs.readdir(getFilesDir());
  const newFiles = Promise.all(files.map(async file => {
    const name = path.join(getFilesDir(), file);
    const found = library[file];
    const ext = path.extname(file).toLowerCase();
    const type = ['.jpg', '.jpeg', '.arw'].includes(ext) ? 'image' : ['.mp4'].includes(ext) ? 'video' : 'unknown';
    const ymd = await extractDate(name);
    const destination = ymd ? `${ymd.year}\\${ymd.year}.${ymd.month}.${ymd.day}` : null;
    return { name, basename: file, type, found, destination };
  }));
  // console.log(newFiles);
  return newFiles;
}

const namePatterns: RegExp[] = [
  /IMG_(\d{4})(\d{2})(\d{2})_\d{6}.*\.mp4/i, // IMG_20211210_040455_CINEMATIC.mp4
  /IMG(\d{4})(\d{2})(\d{2})_\d{6}.*\.mp4/i, // IMG20211210_040455_CINEMATIC.mp4 or IMG20211210040455_1.mp4
  /IMG(\d{4})(\d{2})(\d{2})\d{6}.*\.mp4/i, // IMG20211210040455_CINEMATIC.mp4 or IMG20211210040455_1.mp4
  /IMG_(\d{4})(\d{2})(\d{2})_\d{6}.*\.jpg/i, // IMG_20140101_040533_BURST1.jpg
  /IMG(\d{4})(\d{2})(\d{2})\d{6}.*\.jpg/i, // IMG20140101040533_BURST1.jpg
  /VID_(\d{4})(\d{2})(\d{2})_\d{6}.*\.mp4/i, // VID_20211118_205122_1456233458294.mp4
  /VID(\d{4})(\d{2})(\d{2})\d{6}.*\.mp4i/, // VID20211118205122_1456233458294.mp4
  /video_(\d{4})-(\d{2})-(\d{2})_\d{2}-\d{2}-\d{2}.*\.mp4/i, // video_2021-07-27_10-31-57.mp4 or video_2021-07-27.mp4
];
const metaPatterns: RegExp[] = [
  /DSC\d{5}\.(jpg|arw)$/i, // Matches DSC07837.JPG/ARW
];

async function extractDate(filename: string) {
  for (const pattern of namePatterns) {
    const match = path.basename(filename).match(pattern);
    if (match) return { year: match[1], month: match[2], day: match[3] };
  }
  for (const pattern of metaPatterns) {
    if (pattern.test(path.basename(filename))) {
      const { mtime } = await fs.stat(filename);
      return {
        year: mtime.getFullYear().toString(),
        month: (mtime.getMonth() + 1).toString().padStart(2, '0'), // Months are 0-indexed
        day: mtime.getDate().toString().padStart(2, '0'),
      };      
    }
  }
  return null;
}

export async function copyFiles(d: Destinations): Promise<void> {
  for (const [source, destination] of Object.entries(d)) {
    try {
      const destDir = path.join(getLibDir(), destination);
      await fs.mkdir(destDir, { recursive: true });
      const destinationFull = path.join(destDir, path.basename(source));
      await fs.copyFile(source, destinationFull);
      console.log(`Copied ${source} to ${destinationFull}`);
    } catch (error) {
      console.error(`Error copying ${source} to ${destination}:`, error);
      throw error;
    }
  }
}
