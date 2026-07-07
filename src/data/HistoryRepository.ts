/**
 * Persistence for workout history.
 *
 * The screen code depends only on the {@link HistoryRepository} interface, so we
 * can back it with AsyncStorage on device or an in-memory list in tests without
 * touching any UI.
 */
import { SessionRecord } from './types';
import { StorageKeys, readJson, writeJson } from './storage';

export interface HistoryRepository {
  getAll(): Promise<SessionRecord[]>;
  add(record: SessionRecord): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class AsyncStorageHistoryRepository implements HistoryRepository {
  async getAll(): Promise<SessionRecord[]> {
    return readJson<SessionRecord[]>(StorageKeys.sessions, []);
  }

  async add(record: SessionRecord): Promise<void> {
    const all = await this.getAll();
    all.push(record);
    await writeJson(StorageKeys.sessions, all);
  }

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    await writeJson(
      StorageKeys.sessions,
      all.filter((r) => r.id !== id),
    );
  }

  async clear(): Promise<void> {
    await writeJson(StorageKeys.sessions, []);
  }
}

/** In-memory repository, handy for tests and Storybook-style previews. */
export class InMemoryHistoryRepository implements HistoryRepository {
  private records: SessionRecord[];

  constructor(initial: SessionRecord[] = []) {
    this.records = [...initial];
  }

  async getAll(): Promise<SessionRecord[]> {
    return [...this.records];
  }

  async add(record: SessionRecord): Promise<void> {
    this.records.push(record);
  }

  async remove(id: string): Promise<void> {
    this.records = this.records.filter((r) => r.id !== id);
  }

  async clear(): Promise<void> {
    this.records = [];
  }
}
