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
  ['2024/2024.01', 'backup', 'elsewhere'].map(p => path.normalize(p)).sort());
const backup = result.find(folder => folder.path === path.join(root, 'backup'));
assert.equal(backup.files.length, 2);
assert.deepEqual(backup.files.find(f => f.name === 'b.jpg').copies.map(f => f.placement), [2, 1]);
assert.equal(result.some(folder => folder.path === path.join(root, 'backup/sub')), false);
assert.equal(findDuplicateFolders(db, '').length, 0);
db.close();
console.log('Folder duplicates: recursive coverage, ranks, sizes, missing files and grouping passed');
