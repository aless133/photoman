import React, { useState } from 'react';
import { SettingsConfig, SettingsSaveResult, SettingsStatus } from '../../types';

function Settings({ initial, onSaved, onCancel }: {
  initial: SettingsStatus;
  onSaved: (status: SettingsSaveResult) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState<SettingsConfig>({ filesDir: initial.filesDir, libDir: initial.libDir,
    excludedDirectoryMasks: initial.excludedDirectoryMasks ?? '' });
  const [errors, setErrors] = useState(initial.errors);
  const [busy, setBusy] = useState(false);

  const choose = async (key: 'filesDir' | 'libDir') => {
    try {
      const directory = await window.photoman.chooseDirectory();
      if (directory) setConfig(previous => ({ ...previous, [key]: directory }));
    } catch (err) {
      setErrors([String(err)]);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await window.photoman.saveConfig(config);
      if (result.valid) onSaved(result);
      else setErrors(result.errors);
    } catch (err) {
      setErrors([String(err)]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="p-4 mx-auto" style={{ maxWidth: 800 }}>
      <h2>Настройки</h2>
      <form onSubmit={save}>
        <fieldset className="mb-4" disabled={busy}>
          <legend className="fs-5">Каталоги</legend>
          <p className="text-secondary">Выберите существующие каталоги для импорта и библиотеки.</p>
        {(['filesDir', 'libDir'] as const).map(key => (
          <div className="mb-3" key={key}>
            <label className="form-label" htmlFor={key}>{key === 'filesDir' ? 'Каталог импорта' : 'Каталог библиотеки'}</label>
            <div className="input-group">
              <input id={key} className="form-control" value={config[key]} disabled={busy}
                onChange={event => setConfig({ ...config, [key]: event.target.value })} />
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => choose(key)}>Обзор...</button>
            </div>
          </div>
        ))}
        </fieldset>
        <div className="mb-4">
          <label className="form-label" htmlFor="excludedDirectoryMasks">Маски исключаемых каталогов</label>
          <input id="excludedDirectoryMasks" className="form-control" value={config.excludedDirectoryMasks} disabled={busy}
            placeholder="!*, _*, temp" aria-describedby="excludedDirectoryMasks-help"
            onChange={event => setConfig({ ...config, excludedDirectoryMasks: event.target.value })} />
          <div id="excludedDirectoryMasks-help" className="form-text">
            Маски через запятую: * — любое количество символов, ? — один символ. Регистр не учитывается.
            Маска !* исключает каталоги, начинающиеся с !, вместе со всеми их подпапками и файлами.
            Применяются только к именам каталогов внутри библиотеки. Пустое поле — без исключений.
            После изменения обновите библиотеку для поиска дубликатов.
          </div>
        </div>
        {errors.length > 0 && <div className="alert alert-danger" role="alert">{errors.map(message => <div key={message}>{message}</div>)}</div>}
        <button className="btn btn-success" type="submit" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>
        <button className="btn btn-primary ms-2" type="button" disabled={busy || !initial.valid} onClick={onCancel}>Отмена</button>
      </form>
    </main>
  );
}

export default Settings;
