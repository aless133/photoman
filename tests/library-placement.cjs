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
  ['2018/2018.07.14 - 10 лет свадьбы/a.jpg', P.Canonical],
  ['2014/2014.05.09 - 9 Мая у родителей/a.jpg', P.Canonical],
  ['2016/2016.07.23- День МЧС в Парке Горького/a.jpg', P.Canonical],
  ['2018/2018.10.8 - осень на кошевого/a.jpg', P.Canonical],
  ['2024/2024.11.2-11 - Ереван/a.jpg', P.Canonical],
  ['2018/2018.08.23,25 - день статистики и день грузии/a.jpg', P.Canonical],
  ['2024/2024.02.28,29/sub/a.jpg', P.SemiCanonical],
  ['2023/2023.02.28,29/a.jpg', P.Other],
  ['2024/2024.05.03,01/a.jpg', P.Other],
  ['2024/2024.05,06/a.jpg', P.Other],
  ['2024/2024.05.03 - 01/a.jpg', P.Other],
  ['2024/2024.05.01 - 2024.06.03 - 10 лет/a.jpg', P.Canonical],
  ['2020/2020.12-03-07 - Леша в больнице/a.jpg', P.Other],
  ['2026/2026.0131 - доска почета/a.jpg', P.Other],
  ['2005/2005.05.09н - Пьянка у Крема/a.jpg', P.Other],
];
for (const [relative, expected] of cases) {
  assert.equal(getFilePlacement(path.resolve(root, relative), root), expected, relative);
}
assert.equal(getFilePlacement(path.join(root, '2024/2024.05.01/a.jpg'), ''), P.Other);
console.log(`Library placement: ${cases.length + 1} cases passed`);
