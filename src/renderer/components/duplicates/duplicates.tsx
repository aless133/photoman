import React, { useEffect, useRef, useState } from 'react';
import { DuplicateFile, DuplicateFolder, DuplicateFolderFile, DuplicateGroup, DuplicateMode, FilePlacement } from '../../../types';
import Preview from './preview';

const PAGE_SIZE = 20;
const formatSize = (size: number) => `${size.toLocaleString('ru-RU')} байт`;
const placementLabels = {
  [FilePlacement.Canonical]: { label: 'Каноническое', className: 'border-success', badgeClassName: 'bg-success' },
  [FilePlacement.SemiCanonical]: { label: 'Полуканоническое', className: 'border-info', badgeClassName: 'bg-info' },
  [FilePlacement.Other]: { label: '', className: '', badgeClassName: '' },
};

function FileCard({ file }: { file: DuplicateFile }) {
  const placement = placementLabels[file.placement];
  return <article className={`border rounded p-2 ${placement.className}`}>
    {placement.label && <div className="mb-2"><span className={`badge ${placement.badgeClassName}`}>
      {placement.label}
    </span></div>}
    <Preview path={file.path} />
    <div className="small mt-2 text-break" title={file.path}>{file.path}</div>
    <div className="small text-secondary mt-1">{formatSize(file.size)}</div>
  </article>;
}

function FolderFile({ file }: { file: DuplicateFolderFile }) {
  const [open, setOpen] = useState(false);
  return <details className="border rounded p-2 mt-2" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="text-break">{file.name} — {formatSize(file.source.size)}
      <span className="text-secondary ms-2">Копий: {file.copies.length}</span>
    </summary>
    {open && <>
      <p className="small text-break mt-2">Исходный файл: {file.source.path}</p>
      <div className="duplicates-grid">
        <FileCard file={file.source} />
        {file.copies.map(copy => <FileCard key={copy.id} file={copy} />)}
      </div>
    </>}
  </details>;
}

export function DuplicateFolderCard({ folder }: { folder: DuplicateFolder }) {
  return <section className="border rounded p-3 mb-3">
    <h2 className="h6 text-break">{folder.identicalFolders.length ? 'Полностью одинаковые папки' : folder.path}
      <span className="badge bg-secondary ms-2">{folder.files.length} файлов</span></h2>
    {folder.identicalFolders.length > 0 && <>
      <p className="small text-secondary">Совпадают имена, размеры и количество всех файлов, включая подпапки.
        {folder.mainFolders.length === 0 && ' Главная папка среди них не выбрана.'}</p>
      <ul className="small text-break">
        {[folder.path, ...folder.identicalFolders].map(directory => <li key={directory}>{directory}</li>)}
      </ul>
    </>}
    {folder.mainFolders.length > 0 && <div className="small mb-2">
      <strong>{folder.mainFolders.length === 1 ? 'Главная папка:' : 'Главные папки:'}</strong>
      <ul className="text-break">
        {folder.mainFolders.map(main => <li key={main.path}>{main.path} — дополнительных файлов: {main.extraFiles}</li>)}
      </ul>
    </div>}
    {folder.mainFolders.length === 0 && folder.identicalFolders.length === 0
      && <p className="small text-secondary">Все файлы имеют копии в более каноническом размещении.</p>}
    <details className="mt-2">
      <summary>Файлы ({folder.files.length})</summary>
      {folder.files.map(file => <FolderFile key={file.source.id} file={file} />)}
    </details>
  </section>;
}

export default function Duplicates() {
  const [mode, setMode] = useState<DuplicateMode | 'folders'>('name-size');
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [folders, setFolders] = useState<DuplicateFolder[] | null>(null);
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
    setFolders(null);
    setPage(0);
    try {
      if (mode === 'folders') {
        const result = await window.photoman.findDuplicateFolders();
        if (request.current === id) setFolders(result);
      } else {
        const result = await window.photoman.findDuplicates(mode);
        if (request.current === id) setGroups(result);
      }
    } catch (err) {
      if (request.current === id) setError(String(err));
    } finally {
      if (request.current === id) setBusy(false);
    }
  };
  const pages = Math.ceil((folders?.length ?? groups?.length ?? 0) / PAGE_SIZE);
  const pagination = pages > 1 && <nav className="d-flex align-items-center gap-3 mb-3" aria-label="Страницы групп дубликатов">
    <button className="btn btn-primary" disabled={page === 0} onClick={() => setPage(page - 1)}>Назад</button>
    <span>Страница {page + 1} из {pages}</span>
    <button className="btn btn-primary" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Далее</button>
  </nav>;
  return <main className="p-3">
    <h1 className="h4">Поиск дубликатов</h1>
    <p className="text-secondary small">Поиск по базе библиотеки. Совпадения имени учитывают регистр и расширение.
      Имя и размер не гарантируют одинаковое содержимое файлов. Если библиотека изменилась, обновите её через меню.</p>
    <div className="d-flex align-items-center gap-3 mb-3">
      <label htmlFor="duplicate-mode">Искать совпадения</label>
      <select id="duplicate-mode" className="form-select w-auto" value={mode} disabled={busy} onChange={event => {
        setMode(event.target.value as DuplicateMode | 'folders');
        setGroups(null);
        setFolders(null);
        setError('');
        setPage(0);
      }}>
        <option value="name">По имени</option>
        <option value="name-size">По имени и размеру</option>
        <option value="video-size">Видео только по размеру</option>
        <option value="folders">Папки целиком из дубликатов</option>
      </select>
      <button className="btn btn-secondary" disabled={busy} onClick={search}>Найти дубликаты</button>
    </div>
    {mode === 'video-size' && <p className="text-secondary small">
      Видеофайлы группируются по точному размеру в байтах. Показываются только группы с разными именами файлов.
      Одинаковый размер не гарантирует одинаковое содержимое.
    </p>}
    {mode === 'folders' && <p className="text-secondary small">
      Сравниваются имена, размеры и количество файлов, включая подпапки. Папка, содержащая весь набор
      и дополнительные файлы, считается главной независимо от каноничности. Полностью одинаковые папки
      показываются одной группой. Также показываются папки, все файлы которых имеют более канонические копии.
      Родительская папка не считается копией собственной подпапки.
    </p>}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {groups !== null && <p role="status">{groups.length === 0 ? 'Дубликаты не найдены.' :
      `Групп: ${groups.length.toLocaleString('ru-RU')}. Файлов: ${groups.reduce((sum, group) => sum + group.files.length, 0).toLocaleString('ru-RU')}.`}</p>}
    {folders !== null && <p role="status">{folders.length === 0 ? 'Подходящие папки не найдены.' :
      `Групп папок: ${folders.length.toLocaleString('ru-RU')}. Файлов в наборах: ${folders.reduce((sum, folder) => sum + folder.files.length, 0).toLocaleString('ru-RU')}.`}</p>}
    {pagination}
    {groups?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(group => <section
      key={JSON.stringify([group.name, group.size])} className="border rounded p-3 mb-3">
      <h2 className="h6 text-break">{group.name} <span className="badge bg-secondary">{group.files.length}</span>
        {group.size !== null && <span className="ms-2 text-secondary fw-normal">{formatSize(group.size)}</span>}</h2>
      <div className="duplicates-grid">
        {group.files.map(file => <FileCard key={file.id} file={file} />)}
      </div>
    </section>)}
    {folders?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(folder => <DuplicateFolderCard key={folder.path} folder={folder} />)}
    {pagination}
  </main>;
}
