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
  ['2024/2024.01', '2024/2024.01.01', 'backup', 'elsewhere', 'same-rank'].map(p => path.normalize(p)).sort());
const backup = result.find(folder => folder.path === path.join(root, 'backup'));
assert.equal(backup.files.length, 2);
assert.deepEqual(backup.files.find(f => f.name === 'b.jpg').copies.map(f => f.placement), [2, 1]);
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
  file(`${directory}/sub/b.jpg`, 2);
}
const identical = search();
assert.equal(identical.length, 1, 'Equal folders and their children should appear in one group');
assert.deepEqual(identical[0].identicalFolders, [path.join(root, 'copy-b'), path.join(root, 'copy-c')]);
assert.deepEqual(identical[0].mainFolders, []);
assert.equal(identical[0].files.length, 2);
assert.ok(identical[0].files.every(f => f.copies.length === 2));

file('complete/a.jpg', 2);
file('complete/b.jpg', 2);
file('complete/extra.jpg', 2);
const equalSubsets = search();
assert.equal(equalSubsets.length, 1);
assert.equal(equalSubsets[0].identicalFolders.length, 2);
assert.deepEqual(equalSubsets[0].mainFolders, [{ path: path.join(root, 'complete'), extraFiles: 1 }]);

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
assert.equal(at(repeated, 'multiple'), undefined, 'One copy cannot cover two repeated files');
assert.deepEqual(at(repeated, 'single').mainFolders, [{ path: path.join(root, 'multiple'), extraFiles: 1 }]);

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
console.log('Folder duplicates: supersets, equal groups, recursive coverage, multiplicity, ranks, sizes and missing files passed');
