require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { DuplicateFolderCard } = require('../src/renderer/components/duplicates/duplicates');
const render = props => renderToStaticMarkup(React.createElement(DuplicateFolderCard, {
  folder: { path: 'subset', files: [], mainFolders: [], identicalFolders: [], ...props },
}));
const subset = render({ mainFolders: [{ path: 'main', extraFiles: 177 }] });
assert.match(subset, /Главная папка:/);
assert.match(subset, /main — дополнительных файлов: 177/);
assert.doesNotMatch(subset, /Полностью одинаковые папки/);
const equal = render({ identicalFolders: ['equal-copy'] });
assert.match(equal, /Полностью одинаковые папки/);
assert.match(equal, /<li>subset<\/li>/);
assert.match(equal, /<li>equal-copy<\/li>/);
assert.match(equal, /Главная папка среди них не выбрана/);
assert.doesNotMatch(equal, /Главная папка:/);
const group = render({ identicalFolders: ['equal-copy'], mainFolders: [{ path: 'main', extraFiles: 2 }] });
assert.match(group, /Полностью одинаковые папки/);
assert.match(group, /Главная папка:/);
assert.doesNotMatch(group, /не выбрана/);
assert.match(render({}), /более каноническом размещении/);
console.log('Folder duplicate view: main folders, extra files, equal groups and legacy coverage passed');
