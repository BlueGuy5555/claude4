import { DEFAULT_PREFERENCES, Preferences } from './types';
import { StorageKeys, readJson, writeJson } from './storage';

export interface PreferencesRepository {
  get(): Promise<Preferences>;
  save(prefs: Preferences): Promise<void>;
}

export class AsyncStoragePreferencesRepository implements PreferencesRepository {
  async get(): Promise<Preferences> {
    const stored = await readJson<Partial<Preferences>>(StorageKeys.preferences, {});
    // Merge so newly-added preference fields fall back to their defaults.
    return { ...DEFAULT_PREFERENCES, ...stored };
  }

  async save(prefs: Preferences): Promise<void> {
    await writeJson(StorageKeys.preferences, prefs);
  }
}
