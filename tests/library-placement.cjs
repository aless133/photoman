require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const path = require('node:path');
const { getFilePlacement } = require('../src/main/library-placement');
const { FilePlacement: P } = require('../src/types');
const root = path.resolve('test-library');
const cases = [
  ['2024/2024.02.29/a.jpg', P.Canonical],
  ['2024/2024.02.29 Поездка/a.jpg', P.Canonical],
  ['2024/2024.02.29/sub/a.jpg', P.SemiCanonical],
  ['2024/2024.02/a.jpg', P.SemiCanonical],
  ['2024/2024.02 Отпуск/sub/a.jpg', P.SemiCanonical],
  ['2024/2024.05-06 Отпуск/a.jpg', P.SemiCanonical],
  ['2024/2024.05 - 2024.06 Отпуск/a.jpg', P.SemiCanonical],
  ['2024/2024.05-06/2024.06.01-03 Поездка/a.jpg', P.SemiCanonical],
  ['2024/2024.05/01-03 Поездка/a.jpg', P.SemiCanonical],
  ['2024/2024.05/05.01-05.03 Поездка/a.jpg', P.SemiCanonical],
  ['2024/2024.05/2024.05.01 - 2024.05.03 Поездка/a.jpg', P.SemiCanonical],
  ['2024/2024.05 Отпуск/2024.05.01-03/sub/a.jpg', P.SemiCanonical],
  ['2024/2024.05.01-06.03 Отпуск/a.jpg', P.Canonical],
  ['2024/2024.05.01 - 2024.06.03 Отпуск/a.jpg', P.Canonical],
  ['2024/2024.05.01-03 Отпуск/a.jpg', P.Canonical],
  ['2024/2024.05.01-03 Поездка/a.jpg', P.Canonical],
  ['2024/2024.05.01-03 Поездка/sub/a.jpg', P.SemiCanonical],
  ['2024/2024.05.01-06.03/sub/a.jpg', P.SemiCanonical],
  ['2024/2024.06-05/a.jpg', P.Other],
  ['2024/2024.05-13/a.jpg', P.Other],
  ['2024/2024.05.03-01/a.jpg', P.Other],
  ['2024/2024.05.01-04.30/a.jpg', P.Other],
  ['2023/2023.02.28-29/a.jpg', P.Other],
  ['2024/2024.02.28-29/a.jpg', P.Canonical],
  ['2024/2024.02.29-2025.03.01/a.jpg', P.Other],
  ['2023/2024.05.01/a.jpg', P.Other],
  ['2024/2024.05.01Event/a.jpg', P.Other],
  ['2024/2024.05Event/a.jpg', P.Other],
  ['2024/2024.02.30 Event/a.jpg', P.Other],
  ['2024/2024.05-06.03/a.jpg', P.Other],
  ['backup/2024/2024.05.01/a.jpg', P.Other],
  ['../outside/2024/2024.05.01/a.jpg', P.Other],
];
for (const [relative, expected] of cases) {
  assert.equal(getFilePlacement(path.resolve(root, relative), root), expected, relative);
}
assert.equal(getFilePlacement(path.join(root, '2024/2024.05.01/a.jpg'), ''), P.Other);
console.log(`Library placement: ${cases.length + 1} cases passed`);
