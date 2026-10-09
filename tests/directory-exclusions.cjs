require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createDirectoryExcluder } = require('../src/main/directory-exclusions');
const { readLibraryFiles } = require('../src/main/library-scan');

const exclude = createDirectoryExcluder(' !*, temp, event-????, [draft]+(1), , ');
for (const name of ['!разобрать', '!Backup', 'TEMP', 'event-2024', '[draft]+(1)']) {
  assert.equal(exclude(name), true, name);
}
for (const name of ['event', 'event!', 'temporary', 'event-123', 'event-12345', 'draft1']) {
  assert.equal(exclude(name), false, name);
}
assert.equal(createDirectoryExcluder('')('!event'), false);
assert.equal(createDirectoryExcluder(' , , ')('!event'), false);
assert.equal(createDirectoryExcluder('*')('event'), true);

async function main() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'photoman-exclusions-'));
  const settings = require('../src/main/settings');
  const originals = { getLibDir: settings.getLibDir, getFilesDir: settings.getFilesDir,
    getExcludedDirectoryMasks: settings.getExcludedDirectoryMasks };
  const library = path.join(directory, '!library');
  const inbox = path.join(directory, 'import');
  try {
    await fs.mkdir(path.join(library, 'event'), { recursive: true });
    await fs.mkdir(path.join(library, '!skip', 'nested'), { recursive: true });
    await fs.mkdir(path.join(library, 'event', 'Temp', 'nested'), { recursive: true });
    await fs.mkdir(inbox);
    for (const name of ['!notes.jpg', 'cache.TMP', 'photo.jpg']) {
      await fs.writeFile(path.join(inbox, name), 'fixture');
      await fs.writeFile(path.join(library, 'event', name), 'fixture');
    }
    const skipped = path.join(library, '!skip', 'nested', 'only-skipped.jpg');
    await fs.writeFile(skipped, 'fixture');
    await fs.writeFile(path.join(library, 'event', 'Temp', 'nested', 'another-skipped.jpg'), 'fixture');
    await fs.writeFile(path.join(inbox, 'only-skipped.jpg'), 'fixture');
    const scanned = await readLibraryFiles(library, '!*, temp');
    assert.deepEqual(scanned.map(file => file.name).sort(), ['!notes.jpg', 'cache.TMP', 'photo.jpg']);
    assert.equal((await readLibraryFiles(library, '')).length, 5);
    settings.getLibDir = () => library;
    settings.getFilesDir = () => inbox;
    settings.getExcludedDirectoryMasks = () => '!*, temp';
    const { getFiles } = require('../src/main/files');
    const files = await getFiles();
    assert.equal(files.length, 4, 'Incoming file names must never be filtered');
    assert.deepEqual(files.find(file => file.basename === '!notes.jpg').found, [path.join(library, 'event', '!notes.jpg')]);
    assert.equal(files.find(file => file.basename === 'only-skipped.jpg').found, undefined);
    settings.getExcludedDirectoryMasks = () => '';
    assert.deepEqual((await getFiles()).find(file => file.basename === 'only-skipped.jpg').found, [skipped]);
  } finally {
    Object.assign(settings, originals);
    await fs.rm(directory, { recursive: true, force: true });
  }
  console.log('Directory exclusions: masks, nested subtrees, library root, literal punctuation and unfiltered file names passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
