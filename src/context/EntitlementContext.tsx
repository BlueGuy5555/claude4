import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EntitlementService, LocalEntitlementService } from '../data/EntitlementService';

interface EntitlementContextValue {
  entitled: boolean;
  loaded: boolean;
  price: string;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

// Swap this for a store-backed implementation to ship real one-time purchases.
const service: EntitlementService = new LocalEntitlementService();

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [entitled, setEntitled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    service.isEntitled().then((e) => {
      if (active) {
        setEntitled(e);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const purchase = useCallback(async () => {
    const ok = await service.purchase();
    setEntitled(ok);
    return ok;
  }, []);

  const restore = useCallback(async () => {
    const ok = await service.restore();
    setEntitled(ok);
    return ok;
  }, []);

  const value = useMemo(
    () => ({ entitled, loaded, price: service.price, purchase, restore }),
    [entitled, loaded, purchase, restore],
  );
  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement must be used within an EntitlementProvider');
  return ctx;
}
