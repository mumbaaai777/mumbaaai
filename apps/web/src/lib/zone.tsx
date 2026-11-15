import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ZONE_IDS, type ZoneId } from '@mumbaaai/shared';

const KEY = 'mumbaaai.zone';
const Ctx = createContext<{ zone: ZoneId; setZone: (z: ZoneId) => void } | null>(null);

export function ZoneProvider({ children }: { children: ReactNode }) {
  const [zone, setZone] = useState<ZoneId>(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v && (ZONE_IDS as readonly string[]).includes(v)) return v as ZoneId;
    } catch {
      /* ignore */
    }
    return 'western_suburbs';
  });
  useEffect(() => {
    try {
      localStorage.setItem(KEY, zone);
    } catch {
      /* ignore */
    }
  }, [zone]);
  return <Ctx.Provider value={{ zone, setZone }}>{children}</Ctx.Provider>;
}
export function useZone() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useZone outside provider');
  return v;
}
