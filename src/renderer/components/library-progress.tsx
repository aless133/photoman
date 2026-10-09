import React, { useEffect, useState } from 'react';
import { LibraryProgress } from '../../types';

export default function LibraryProgressView({ progress, starting, readMetadata, onReadMetadataChange, onStart }: {
  progress?: LibraryProgress;
  starting: boolean;
  readMetadata: boolean;
  onReadMetadataChange: (value: boolean) => void;
  onStart: () => void;
}) {
  const phase = progress?.phase;
  const processed = progress?.processed ?? 0;
  const total = progress?.total ?? null;
  const percent = total ? Math.round(processed / total * 100) : phase === 'done' ? 100 : 0;
  const active = phase === 'scanning' || phase === 'indexing';
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, progress?.startedAt]);
  const elapsed = progress ? Math.max(0, Math.floor(((progress.finishedAt ?? now) - progress.startedAt) / 1000)) : 0;
  const duration = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
  return (
    <section className="library-progress p-3 p-sm-4 mx-auto" aria-label="Обновление библиотеки">
      <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
        <div className="form-check mb-0">
          <input id="library-read-metadata" className="form-check-input" type="checkbox"
            checked={readMetadata} disabled={starting || active}
            onChange={event => onReadMetadataChange(event.target.checked)} />
          <label className="form-check-label" htmlFor="library-read-metadata">Читать метаданные</label>
        </div>
        <button className="btn btn-success" disabled={starting || active} onClick={onStart}>Старт</button>
      </div>
      <p className="small text-secondary mb-3">
        Без галочки дата определяется только по имени файла. С галочкой недостающие даты ищутся
        в метаданных — это увеличивает время обновления.
      </p>
      {progress && <div className="d-flex flex-wrap gap-3 small text-secondary mb-3">
        <span>Начало: <time dateTime={new Date(progress.startedAt).toISOString()}>
          {new Date(progress.startedAt).toLocaleString('ru-RU')}
        </time></span>
        <span>Прошло: <span className="font-monospace">{duration}</span></span>
        <span>{progress.readMetadata ? 'С метаданными' : 'Без метаданных'}</span>
      </div>}
      <div className={phase === 'error' ? 'text-danger mb-2' : 'mb-2'} role="status">
        {!progress && (starting ? 'Ожидание запуска обновления...' : 'Выберите режим и нажмите «Старт».')}
        {phase === 'scanning' && 'Поиск файлов в библиотеке...'}
        {phase === 'indexing' && `Обновление библиотеки: ${processed} из ${total} файлов (${percent}%)`}
        {phase === 'done' && `Библиотека обновлена. Файлов: ${processed}.`}
        {phase === 'error' && `Ошибка обновления библиотеки: ${progress?.error}`}
      </div>
      {(active || phase === 'done') && (
        <div className="progress" role="progressbar" aria-label="Обновление библиотеки"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={total === null ? undefined : percent}>
          <div className={`progress-bar${active ? ' progress-bar-striped progress-bar-animated' : ' bg-success'}`}
            style={{ width: `${total === null ? 100 : percent}%` }} />
        </div>
      )}
    </section>
  );
}
