require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ExifTool, ExifDateTime } = require('exiftool-vendored');
const { getFileDate } = require('../src/main/library-date');
const { getMetadataDate, readMetadataDate } = require('../src/main/library-metadata');

async function main() {
  const empty = null;
  assert.deepEqual(getFileDate('12345.jpg'), empty);
  const named = getFileDate('IMG_20240229_123456.jpg');
  assert.equal(named, '2024.02.29');
  assert.deepEqual(getFileDate('IMG_20240230_123456.jpg'), empty);
  const original = ExifDateTime.from('2024:02:29 23:30:00+03:00');
  const created = ExifDateTime.from('2025:01:01 00:00:00Z');
  assert.deepEqual(getMetadataDate({ DateTimeOriginal: original, CreateDate: created }),
    '2024.02.29');
  assert.equal(getMetadataDate({ CreationDate: created }), '2025.01.01');
  assert.deepEqual(getMetadataDate({ FileModifyDate: created, FileCreateDate: created }), empty);
  assert.deepEqual(getMetadataDate({ CreateDate: '0000:00:00 00:00:00' }), empty);
  assert.deepEqual(getMetadataDate({ CreateDate: '1904:01:01 00:00:00' }), empty);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'photoman-metadata-'));
  const tool = new ExifTool();
  try {
    const filename = path.join(directory, '12345.png');
    await fs.copyFile(path.resolve('assets/icon.png'), filename);
    assert.deepEqual(await readMetadataDate(tool, filename), empty);
    await tool.write(filename, { DateTimeOriginal: '2024:02:29 23:30:00+03:00' });
    assert.equal(await readMetadataDate(tool, filename), '2024.02.29');
    const invalid = path.join(directory, 'broken.jpg');
    await fs.writeFile(invalid, 'not a photo');
    assert.deepEqual(await readMetadataDate(tool, invalid), empty);
  } finally {
    await tool.end();
    await fs.rm(directory, { recursive: true, force: true });
  }
  console.log('Library metadata checks passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

