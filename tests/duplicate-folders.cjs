require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { findDuplicateFolders } = require('../src/main/duplicate-folders');

const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE files (id INTEGER PRIMARY KEY, path TEXT, name TEXT, size INTEGER,
  placement INTEGER, missing INTEGER DEFAULT 0);
  CREATE INDEX idx_name_size ON files(name, size);`);
const root = path.resolve('test-library');
const add = db.prepare('INSERT INTO files (path, name, size, placement, missing) VALUES (?, ?, ?, ?, ?)');
const file = (relative, placement, size = 10, missing = 0) =>
  add.run(path.join(root, relative), path.basename(relative), size, placement, missing);

file('2024/2024.01.01/a.jpg', 2);
file('2024/2024.01/b.jpg', 1);
file('2024/2024.02.01/b.jpg', 2);
file('backup/a.jpg', 0);
file('backup/sub/b.jpg', 0);
file('mixed/a.jpg', 0);
file('mixed/sub/unique.txt', 0);
file('wrong-size/a.jpg', 0, 11);
file('same-rank/c.jpg', 0);
file('same-rank-2/c.jpg', 0);
file('missing-copy/d.jpg', 0);
file('2024/2024.03.01/d.jpg', 2, 10, 1);
file('semi-only/2024.04/e.jpg', 1);
file('elsewhere/e.jpg', 0);

const result = findDuplicateFolders(db, root);
assert.deepEqual(result.map(folder => path.relative(root, folder.path)).sort(),
  ['2024/2024.01', '2024/2024.01.01', 'elsewhere', 'same-rank'].map(p => path.normalize(p)).sort());
const a = result.find(folder => folder.path === path.join(root, '2024/2024.01.01'));
assert.equal(a.files.length, 1);
assert.deepEqual(a.identicalFolders, [path.join(root, 'backup'), path.join(root, 'mixed')]);
assert.deepEqual(a.mainFolders, []);
const b = result.find(folder => folder.path === path.join(root, '2024/2024.01'));
assert.deepEqual(b.identicalFolders, [path.join(root, '2024/2024.02.01'), path.join(root, 'backup/sub')]);
assert.deepEqual(b.files[0].copies.map(f => f.placement), [2, 0]);
assert.equal(result.some(folder => folder.path === path.join(root, 'backup/sub')), false);
assert.deepEqual(result.find(folder => folder.path === path.join(root, 'same-rank')).identicalFolders,
  [path.join(root, 'same-rank-2')]);
assert.equal(findDuplicateFolders(db, '').length, 0);

const reset = () => db.exec('DELETE FROM files');
const search = () => findDuplicateFolders(db, root);
const at = (results, relative) => results.find(folder => folder.path === path.join(root, relative));

reset();
for (const name of ['141_4114.JPG', '141_4115.JPG']) {
  file(`2004/2004.12.31 - Новый 2005 год/фотки со мной/${name}`, 1);
  file(`2004/2004.12.31 - Новый 2005 год/Фотки Алыма/${name}`, 1);
}
file('2004/2004.12.31 - Новый 2005 год/Фотки Алыма/extra.jpg', 1);
const subset = search();
assert.equal(subset.length, 1);
assert.deepEqual(subset[0].mainFolders, [{
  path: path.join(root, '2004/2004.12.31 - Новый 2005 год/Фотки Алыма'), extraFiles: 1,
}]);
assert.equal(subset[0].files.length, 2);
assert.deepEqual(subset[0].identicalFolders, []);
assert.ok(subset[0].files.every(f => f.copies.length === 1 && f.copies[0].placement === 1));

reset();
file('canonical/a.jpg', 2);
file('backup/a.jpg', 0);
file('backup/extra.jpg', 0);
const biggerWins = search();
assert.deepEqual(at(biggerWins, 'canonical').mainFolders, [{ path: path.join(root, 'backup'), extraFiles: 1 }]);

reset();
for (const directory of ['copy-a', 'copy-b', 'copy-c']) {
  file(`${directory}/a.jpg`, 2);
  file(`${directory}/b.jpg`, 2);
  file(`${directory}/sub/clip.mp4`, 2);
}
const identical = search();
assert.equal(identical.length, 2, 'Compare parent photos and child videos in separate groups');
const photos = at(identical, 'copy-a');
assert.deepEqual(photos.identicalFolders, [path.join(root, 'copy-b'), path.join(root, 'copy-c')]);
assert.deepEqual(photos.mainFolders, []);
assert.equal(photos.files.length, 2);
assert.ok(photos.files.every(f => f.copies.length === 2));
assert.deepEqual(at(identical, 'copy-a/sub').identicalFolders, [path.join(root, 'copy-b/sub'), path.join(root, 'copy-c/sub')]);

file('complete/a.jpg', 2);
file('complete/b.jpg', 2);
file('complete/extra.jpg', 2);
const equalSubsets = search();
assert.equal(equalSubsets.length, 2);
assert.equal(at(equalSubsets, 'copy-a').identicalFolders.length, 2);
assert.deepEqual(at(equalSubsets, 'copy-a').mainFolders, [{ path: path.join(root, 'complete'), extraFiles: 1 }]);

reset();
file('parent/a.jpg', 1);
file('parent/sub/b.jpg', 1);
assert.deepEqual(search(), [], 'Ancestors must not make their own children redundant');

reset();
file('a/photo.jpg', 1, 10);
file('b/photo.jpg', 1, 11);
file('missing/photo.jpg', 1, 10, 1);
file('case/PHOTO.jpg', 1, 10);
assert.deepEqual(search(), [], 'Sizes, case and missing files must still be respected');

reset();
file('multiple/one/a.jpg', 1);
file('multiple/two/a.jpg', 1);
file('single/a.jpg', 1);
const repeated = search();
assert.equal(at(repeated, 'multiple'), undefined, 'Do not aggregate copies from child folders');
assert.equal(repeated.length, 1);
assert.deepEqual(repeated[0].mainFolders, []);
assert.deepEqual([repeated[0].path, ...repeated[0].identicalFolders].sort(),
  ['multiple/one', 'multiple/two', 'single'].map(directory => path.join(root, directory)).sort());

reset();
for (const directory of ['2005/2005.03.26 - Москва', 'разобрать/2005.03.26 - Москва']) {
  file(`${directory}/a.jpg`, 1);
  file(`${directory}/b.jpg`, 1);
  file(`${directory}/Video/clip.mp4`, 1);
}
file('разобрать/2005.06.01 - Дача/extra.jpg', 1);
const moscow = search();
assert.equal(moscow.length, 2);
assert.equal(at(moscow, '2005/2005.03.26 - Москва').files.length, 2);
assert.equal(at(moscow, '2005/2005.03.26 - Москва/Video').files.length, 1);
assert.ok(moscow.every(folder => folder.mainFolders.length === 0));
const reportedPaths = moscow.flatMap(folder => [folder.path, ...folder.identicalFolders, ...folder.mainFolders.map(main => main.path)]);
assert.ok(!reportedPaths.includes(path.join(root, '2005')));
assert.ok(!reportedPaths.includes(path.join(root, 'разобрать')), 'Empty containers must never be main or equal folders');

reset();
file('subset/a.jpg', 1);
file('main/a.jpg', 1);
file('main/extra.jpg', 1);
file('main/sub/unrelated.jpg', 1);
assert.deepEqual(at(search(), 'subset').mainFolders, [{ path: path.join(root, 'main'), extraFiles: 1 }],
  'Extra-file counts must exclude child folders');

reset();
file('partial-a/a.jpg', 1);
file('partial-a/b.jpg', 1);
file('partial-b/a.jpg', 1);
file('partial-b/c.jpg', 1);
const partial = search();
assert.equal(at(partial, 'partial-a'), undefined);
assert.equal(at(partial, 'partial-b'), undefined, 'A shared file does not imply full folder coverage');

reset();
file('source/a.jpg', 0);
file('source/b.jpg', 0);
file('keep-a/a.jpg', 2);
file('keep-a/unique-a.jpg', 2);
file('keep-b/b.jpg', 2);
file('keep-b/unique-b.jpg', 2);
const scattered = at(search(), 'source');
assert.ok(scattered, 'Preserve coverage by better copies spread across several folders');
assert.deepEqual(scattered.mainFolders, []);
assert.deepEqual(scattered.identicalFolders, []);
assert.ok(scattered.files.every(f => f.copies.length === 1 && f.copies[0].placement === 2));
db.close();
console.log('Folder duplicates: direct files, independent subfolders, empty containers, supersets, equal groups, ranks and missing files passed');
