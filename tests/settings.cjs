require('ts-node').register({ files: true });
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function main() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'photoman-settings-'));
  const database = require('../src/main/db');
  const originalDb = database.getDb;
  const values = new Map([['import_dir', directory], ['library_dir', directory]]);
  database.getDb = () => ({
    prepare: () => ({ get: key => values.has(key) ? { value: values.get(key) } : undefined,
      run: (key, value) => values.set(key, value) }),
    transaction: callback => callback,
  });
  try {
    const { getSettingsStatus, saveSettings } = require('../src/main/settings');
    assert.equal((await getSettingsStatus()).excludedDirectoryMasks, '', 'Existing settings default to no exclusions');
    const saved = await saveSettings({ filesDir: directory, libDir: directory, excludedDirectoryMasks: ' !*, , temp , ' });
    assert.equal(saved.valid, true);
    assert.equal(saved.excludedDirectoryMasks, '!*, temp');
    assert.equal(values.get('excluded_directory_masks'), '!*, temp');
    assert.equal((await getSettingsStatus()).excludedDirectoryMasks, '!*, temp');
    await assert.rejects(saveSettings({ filesDir: directory, libDir: directory, excludedDirectoryMasks: 123 }), /маски/);
    assert.equal(values.get('excluded_directory_masks'), '!*, temp');
    const cleared = await saveSettings({ filesDir: directory, libDir: directory, excludedDirectoryMasks: '' });
    assert.equal(cleared.excludedDirectoryMasks, '');
  } finally {
    database.getDb = originalDb;
    await fs.rm(directory, { recursive: true, force: true });
  }
  console.log('Settings: existing configuration, mask persistence, normalization, validation and clearing passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
