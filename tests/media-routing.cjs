require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const { getFileDate } = require('../src/main/library-date');
const { getMediaType, getPreviewType, getFileUrl, canReadCaptureMetadata } = require('../src/media-formats');
const cases = [
  ['VID_20150203_142222.3gp', '2015.02.03'],
  ['IMG_20190603_184409-ANIMATION.gif', '2019.06.03'],
  ['IMG20220604205045-ANIMATION.gif', '2022.06.04'],
  ['PANO_20180912_160931.jpg', '2018.09.12'],
  ['(05)IMG_20200504_163328.jpg', '2020.05.04'],
  ['20210808180902_IMG_4413.JPG', '2021.08.08'],
  ['20141001162715.jpg', '2014.10.01'],
  ['20141113172314-1.jpg', '2014.11.13'],
  ['20160528_135424.jpg', '2016.05.28'],
  ['20250602.mp4', '2025.06.02'],
  ['VID_20220406_Л в саду1.mp4', '2022.04.06'],
  ['2014.09.09 - раскачивается на четвереньках.MTS', '2014.09.09'],
  ['video_2021-07-27.mp4', '2021.07.27'],
  ['video_2021-07-27_10-31-57.mp4', '2021.07.27'],
  ['IMG_20240229_123456.DNG', '2024.02.29'],
  ['IMG_20240230_123456.jpg', null],
  ['IMG_20241301_123456.jpg', null],
  ['IMG_20240229_123456.jpg.tmp', null],
  ['IMG_20240229_123456.THM', null],
  ['20240229.zip', null],
  ['P80124-110737.jpg', null],
  ['V80701-182042.mp4', null],
  ['2015428142848.jpg', null],
  ['IMG-1478259571931-V.jpg', null],
  ['SAVE_20180720_213007.jpeg', null],
  ['311923708_554278273365149_7962054126521070840_n.jpg', null],
  ['DSC01207.ARW', null],
  ['.mp4', null],
];
for (const [name, date] of cases) assert.equal(getFileDate(name), date, name);
for (const name of ['IMG.DNG', 'DSC.ARW', 'scan.tif', 'edit.psd']) {
  assert.equal(getMediaType(name), 'image');
  assert.equal(getPreviewType(name), null);
}
for (const name of ['clip.ASF', 'clip.VOB', 'clip.3gp', 'clip.MTS', 'clip.avi']) {
  assert.equal(getMediaType(name), 'video');
  assert.equal(getPreviewType(name), null);
}
assert.equal(getPreviewType('photo.bmp'), 'image');
assert.equal(getPreviewType('photo.webp'), 'image');
assert.equal(getPreviewType('note.wav'), 'audio');
assert.equal(canReadCaptureMetadata('MVI_1726.THM'), true);
assert.equal(canReadCaptureMetadata('DSC05839.xmp'), true);
assert.equal(canReadCaptureMetadata('Photos.zip'), false);
assert.equal(canReadCaptureMetadata('VID_20220828_144406.mp4.tmp1'), false);
assert.equal(getMediaType('d:/folder.jpg/.mp4'), 'unknown');
assert.equal(getFileUrl('D:\\Фото\\a #1%?.jpg'), 'file:///D:/%D0%A4%D0%BE%D1%82%D0%BE/a%20%231%25%3F.jpg');
assert.equal(getFileUrl('\\\\server\\share\\a #1.jpg'), 'file://server/share/a%20%231.jpg');
console.log(`Media routing: ${cases.length} filename cases, formats, previews and escaped paths passed`);
