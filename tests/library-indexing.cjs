require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { ExifDateTime } = require('exiftool-vendored');

async function main() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'photoman-indexing-'));
  const rows = [], reads = [], progress = [];
  let ended = false;
  let toolsCreated = 0;
  const settings = require('../src/main/settings');
  const database = require('../src/main/db');
  const originalRoot = settings.getLibDir;
  const originalMasks = settings.getExcludedDirectoryMasks;
  const originalDb = database.getDb;
  const originalLoad = Module._load;
  settings.getLibDir = () => directory;
  settings.getExcludedDirectoryMasks = () => '';
  database.getDb = () => ({
    prepare: sql => ({ run: (...values) => { if (sql.startsWith('INSERT')) rows.push(values); } }),
    transaction: callback => callback,
  });
  class MetadataTool {
    constructor() { toolsCreated++; }
    async read(filename) {
      reads.push(path.basename(filename));
      return { DateTimeOriginal: ExifDateTime.from('2018:01:24 11:07:37') };
    }
    async end() { ended = true; }
  }
  Module._load = function(request, ...args) {
    if (request === 'electron') return { app: { isPackaged: false, getAppPath: () => process.cwd() } };
    if (request === 'exiftool-vendored') return { ExifTool: MetadataTool, ExifDateTime };
    return originalLoad.call(this, request, ...args);
  };
  try {
    const day = path.join(directory, '2018', '2018.01.24 - 10 лет');
    await fs.mkdir(day, { recursive: true });
    for (const name of ['IMG_20180124_110737.jpg', 'P80124-110737.jpg', 'MVI_1726.THM', 'DSC05839.xmp', 'Photos.zip']) {
      await fs.writeFile(path.join(day, name), 'fixture');
    }
    await fs.writeFile(path.join(day, 'empty.jpg'), '');
    const { updateLibrary } = require('../src/main/library');
    assert.equal(await updateLibrary(value => progress.push(value)), 6);
    assert.equal(rows.length, 6, 'Every file, including archives and zero-size files, must be indexed');
    assert.deepEqual(reads.sort(), ['DSC05839.xmp', 'MVI_1726.THM', 'P80124-110737.jpg']);
    for (const row of rows) {
      assert.equal(row[4], 2, 'Numeric event titles must not lower placement');
      assert.equal(row[3], ['Photos.zip', 'empty.jpg'].includes(row[1]) ? null : '2018.01.24');
    }
    const done = progress.at(-1);
    assert.equal(done.phase, 'done');
    assert.equal(done.processed, 6);
    assert.equal(done.total, 6);
    assert.equal(done.readMetadata, true);
    assert.equal(typeof done.startedAt, 'number');
    assert.ok(done.finishedAt >= done.startedAt);
    assert.ok(progress.every(value => value.startedAt === done.startedAt));
    assert.equal(ended, true);

    rows.length = reads.length = progress.length = 0;
    toolsCreated = 0;
    ended = false;
    assert.equal(await updateLibrary(value => progress.push(value), { readMetadata: false }), 6);
    assert.equal(rows.length, 6, 'Fast mode must index every file');
    assert.equal(toolsCreated, 0, 'Fast mode must not even start ExifTool');
    assert.deepEqual(reads, []);
    for (const row of rows) {
      assert.equal(row[3], row[1] === 'IMG_20180124_110737.jpg' ? '2018.01.24' : null);
      assert.equal(row[4], 2);
    }
    assert.equal(progress.at(-1).readMetadata, false);
    assert.ok(progress.at(-1).finishedAt >= progress.at(-1).startedAt);
    assert.equal(ended, false);

    for (const name of ['!notice.jpg', 'note.tmp', 'ignored.TMP']) await fs.writeFile(path.join(day, name), 'fixture');
    for (const folder of ['!skip', 'Temp']) {
      await fs.mkdir(path.join(day, folder, 'nested'), { recursive: true });
      await fs.writeFile(path.join(day, folder, 'nested', 'excluded.jpg'), 'fixture');
    }
    settings.getExcludedDirectoryMasks = () => '!*, temp';
    rows.length = reads.length = progress.length = 0;
    assert.equal(await updateLibrary(value => progress.push(value)), 9);
    assert.equal(rows.length, 9);
    assert.ok(rows.some(row => row[1] === '!notice.jpg'), 'Never match masks against file names');
    assert.ok(reads.includes('!notice.jpg'));
    assert.ok(!reads.includes('excluded.jpg'), 'Do not read metadata inside excluded subtrees');
    assert.equal(progress.at(-1).total, 9);
    await fs.writeFile(path.join(directory, '!root-file.jpg'), 'fixture');
    settings.getExcludedDirectoryMasks = () => '*';
    rows.length = progress.length = 0;
    assert.equal(await updateLibrary(value => progress.push(value), { readMetadata: false }), 1);
    assert.equal(rows[0][1], '!root-file.jpg', 'Root files remain even when all child directories are excluded');
    assert.equal(progress.at(-1).total, 1);
    assert.equal(progress.at(-1).processed, 1);

    progress.length = 0;
    settings.getLibDir = () => '';
    await assert.rejects(updateLibrary(value => progress.push(value), { readMetadata: false }), /полный путь/);
    assert.equal(progress.at(-1).phase, 'error');
    assert.ok(progress.at(-1).finishedAt >= progress.at(-1).startedAt);
    assert.equal(progress.at(-1).readMetadata, false);
  } finally {
    Module._load = originalLoad;
    settings.getLibDir = originalRoot;
    settings.getExcludedDirectoryMasks = originalMasks;
    database.getDb = originalDb;
    await fs.rm(directory, { recursive: true, force: true });
  }
  console.log('Library indexing: metadata on/off, no ExifTool in fast mode, all files, dates, timings and errors passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
