// Brand tokens. The CSS variables in theme.css are the runtime source of truth;
// these constants exist for JS consumers (charts, canvas visualiser, meta theme-color).
export const brand = {
  navy: '#0B2545',
  navyDeep: '#071A33',
  marigold: '#F4A300',
  marigoldDeep: '#C98500',
  offWhite: '#FAF7F2',
  live: '#E63946',
  liveText: '#C42A37', // use for LIVE text on white/off-white (AA contrast)
  ink: '#0E1B2C',
  muted: '#5B6675',
} as const;

export const chartPalette = ['#0B2545', '#F4A300', '#2E6F95', '#E07A5F', '#5C946E', '#8D6A9F', '#C98500', '#7A8BA0', '#B23A48'];

export type ThemeMode = 'light' | 'dark' | 'system';
export const THEME_STORAGE_KEY = 'mumbaaai.theme';
export const LANG_STORAGE_KEY = 'mumbaaai.lang';

/** Apply theme to <html>. Returns the resolved mode. */
export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? brand.navyDeep : brand.offWhite);
  return resolved;
}

export function readThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}
