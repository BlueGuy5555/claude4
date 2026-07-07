import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SessionRecord } from '../data/types';
import { AsyncStorageHistoryRepository, HistoryRepository } from '../data/HistoryRepository';

interface HistoryContextValue {
  sessions: SessionRecord[];
  loaded: boolean;
  addSession: (record: SessionRecord) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

const repo: HistoryRepository = new AsyncStorageHistoryRepository();

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    repo.getAll().then((all) => {
      if (active) {
        setSessions(all);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const addSession = useCallback(async (record: SessionRecord) => {
    await repo.add(record);
    setSessions((prev) => [...prev, record]);
  }, []);

  const removeSession = useCallback(async (id: string) => {
    await repo.remove(id);
    setSessions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    await repo.clear();
    setSessions([]);
  }, []);

  const value = useMemo(
    () => ({ sessions, loaded, addSession, removeSession, clearAll }),
    [sessions, loaded, addSession, removeSession, clearAll],
  );
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within a HistoryProvider');
  return ctx;
}
