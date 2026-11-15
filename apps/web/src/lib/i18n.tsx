import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGES, LANG_STORAGE_KEY, detectLang, fmt, getDict, type Dict, type Lang } from '@mumbaaai/shared';

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  f: typeof fmt;
  locale: string;
}
const Ctx = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    if (v && LANGUAGES.some((l) => l.code === v)) return v as Lang;
  } catch {
    /* ignore */
  }
  return detectLang();
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang)!;
    document.documentElement.lang = meta.htmlLang;
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);
  const value = useMemo<I18n>(
    () => ({ lang, setLang: setLangState, t: getDict(lang), f: fmt, locale: LANGUAGES.find((l) => l.code === lang)!.bcp47 }),
    [lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside provider');
  return v;
}
