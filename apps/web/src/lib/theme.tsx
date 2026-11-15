import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyTheme, readThemeMode, THEME_STORAGE_KEY, type ThemeMode } from '@mumbaaai/shared';

const Ctx = createContext<{ mode: ThemeMode; resolved: 'light' | 'dark'; setMode: (m: ThemeMode) => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => applyTheme(readThemeMode()));
  useEffect(() => {
    setResolved(applyTheme(mode));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    if (mode !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [mode]);
  return <Ctx.Provider value={{ mode, resolved, setMode }}>{children}</Ctx.Provider>;
}
export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme outside provider');
  return v;
}
