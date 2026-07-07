import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PREFERENCES, Preferences } from '../data/types';
import { AsyncStoragePreferencesRepository, PreferencesRepository } from '../data/PreferencesRepository';

interface SettingsContextValue {
  prefs: Preferences;
  loaded: boolean;
  update: (patch: Partial<Preferences>) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const repo: PreferencesRepository = new AsyncStoragePreferencesRepository();

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    repo.get().then((p) => {
      if (active) {
        setPrefs(p);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      void repo.save(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ prefs, loaded, update }), [prefs, loaded, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
