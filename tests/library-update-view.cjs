require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const View = require('../src/renderer/components/library-progress').default;
const callbacks = { onStart() {}, onReadMetadataChange() {} };
const render = props => renderToStaticMarkup(React.createElement(View, {
  ...callbacks, starting: false, readMetadata: false, ...props,
}));
const ready = render({});
assert.match(ready, /Читать метаданные/);
assert.match(ready, />Старт</);
assert.doesNotMatch(ready, /disabled=""|checked=""/);
assert.match(ready, /Выберите режим/);
assert.doesNotMatch(ready, /Начало:/);
assert.match(render({ starting: true }), /Ожидание запуска обновления/);
const startedAt = Date.now() - 1000;
const running = render({ readMetadata: true, starting: true, progress: {
  phase: 'indexing', processed: 10, total: 100, startedAt, readMetadata: true,
} });
assert.match(running, /checked=""/);
assert.equal((running.match(/disabled=""/g) || []).length, 2);
assert.match(running, /Начало:/);
assert.match(running, /Прошло:/);
assert.match(running, /10 из 100/);
const finished = { phase: 'done', processed: 100, total: 100, startedAt,
  finishedAt: startedAt + 3661000, readMetadata: false };
const complete = render({ progress: finished });
assert.match(complete, /01:01:01/);
assert.match(complete, /Без метаданных/);
assert.doesNotMatch(complete, /disabled=""/);
assert.match(render({ progress: { ...finished, phase: 'error', error: 'Нет доступа' } }), /01:01:01/);
assert.match(render({ progress: { ...finished, phase: 'error', error: 'Нет доступа' } }), /Нет доступа/);
console.log('Library screen: initial controls, disabled during work, start time, duration and frozen results passed');
