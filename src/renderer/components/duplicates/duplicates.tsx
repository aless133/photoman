import React, { useEffect, useRef, useState } from 'react';
import { DuplicateGroup, DuplicateMode } from '../../../types';
import Preview from './preview';

const PAGE_SIZE = 20;
const formatSize = (size: number) => `${size.toLocaleString('ru-RU')} байт`;

export default function Duplicates() {
  const [mode, setMode] = useState<DuplicateMode>('name-size');
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);

  const search = async () => {
    const id = ++request.current;
    setBusy(true);
    setError('');
    setGroups(null);
    setPage(0);
    try {
      const result = await window.photoman.findDuplicates(mode);
      if (request.current === id) setGroups(result);
    } catch (err) {
      if (request.current === id) setError(String(err));
    } finally {
      if (request.current === id) setBusy(false);
    }
  };
  const pages = Math.ceil((groups?.length ?? 0) / PAGE_SIZE);
  return <main className="p-3">
    <h1 className="h4">Поиск дубликатов</h1>
    <p className="text-secondary small">Поиск по базе библиотеки. Совпадения имени учитывают регистр и расширение.
      Имя и размер не гарантируют одинаковое содержимое файлов. Если библиотека изменилась, обновите её через меню.</p>
    <div className="d-flex align-items-center gap-3 mb-3">
      <label htmlFor="duplicate-mode">Искать совпадения</label>
      <select id="duplicate-mode" className="form-select w-auto" value={mode} disabled={busy} onChange={event => {
        setMode(event.target.value as DuplicateMode);
        setGroups(null);
        setError('');
        setPage(0);
      }}>
        <option value="name">По имени</option>
        <option value="name-size">По имени и размеру</option>
      </select>
      <button className="btn btn-secondary" disabled={busy} onClick={search}>Найти дубликаты</button>
    </div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {groups !== null && <p role="status">{groups.length === 0 ? 'Дубликаты не найдены.' :
      `Групп: ${groups.length.toLocaleString('ru-RU')}. Файлов: ${groups.reduce((sum, group) => sum + group.files.length, 0).toLocaleString('ru-RU')}.`}</p>}
    {pages > 1 && <nav className="d-flex align-items-center gap-3 mb-3" aria-label="Страницы групп дубликатов">
      <button className="btn btn-primary" disabled={page === 0} onClick={() => setPage(page - 1)}>Назад</button>
      <span>Страница {page + 1} из {pages}</span>
      <button className="btn btn-primary" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Далее</button>
    </nav>}
    {groups?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(group => <section
      key={JSON.stringify([group.name, group.size])} className="border rounded p-3 mb-3">
      <h2 className="h6 text-break">{group.name} <span className="badge bg-secondary">{group.files.length}</span>
        {group.size !== null && <span className="ms-2 text-secondary fw-normal">{formatSize(group.size)}</span>}</h2>
      <div className="duplicates-grid">
        {group.files.map(file => <article key={file.id} className="border rounded p-2">
          <Preview path={file.path} />
          <div className="small mt-2 text-break" title={file.path}>{file.path}</div>
          <div className="small text-secondary mt-1">{formatSize(file.size)}</div>
        </article>)}
      </div>
    </section>)}
  </main>;
}
