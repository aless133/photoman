import React from 'react';
import { LibraryProgress } from '../../types';

export default function LibraryProgressView({ progress }: { progress: LibraryProgress }) {
  const { phase, processed, total } = progress;
  const percent = total ? Math.round(processed / total * 100) : phase === 'done' ? 100 : 0;
  const active = phase === 'scanning' || phase === 'indexing';
  return (
    <section className="library-progress p-3 p-sm-4 mx-auto" aria-label="Обновление библиотеки">
      <div className={phase === 'error' ? 'text-danger mb-2' : 'mb-2'} role="status">
        {phase === 'scanning' && 'Поиск файлов в библиотеке...'}
        {phase === 'indexing' && `Обновление библиотеки: ${processed} из ${total} файлов (${percent}%)`}
        {phase === 'done' && `Библиотека обновлена. Файлов: ${processed}.`}
        {phase === 'error' && `Ошибка обновления библиотеки: ${progress.error}`}
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
