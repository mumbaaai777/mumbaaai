import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, TrainFront, Radio, BriefcaseBusiness, Sparkles, Sun, Moon, Monitor } from 'lucide-react';
import type { ReactNode } from 'react';
import { LANGUAGES, type Lang } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { useRadio } from '../lib/radio';
import { asset, env } from '../lib/env';
import { isDemo } from '../lib/data';
import { spring } from './motion';

const TABS = [
  { to: '/', key: 'home', icon: Home },
  { to: '/travel', key: 'travel', icon: TrainFront },
  { to: '/radio', key: 'radio', icon: Radio },
  { to: '/jobs', key: 'jobs', icon: BriefcaseBusiness },
  { to: '/ask', key: 'ask', icon: Sparkles },
] as const;

function ThemeButton() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  const next = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const label = { light: t.common.themeLight, dark: t.common.themeDark, system: t.common.themeSystem }[mode];
  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      className="grid h-9 w-9 place-items-center rounded-full border border-line-strong text-ink-soft transition-colors hover:text-ink"
      title={`${t.common.theme}: ${label}`}
      aria-label={`${t.common.theme}: ${label}`}
    >
      <motion.span key={mode} initial={{ rotate: -40, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={spring}>
        <Icon size={16} strokeWidth={1.75} />
      </motion.span>
    </button>
  );
}

function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  const short: Record<Lang, string> = { en: 'EN', hi: 'हि', mr: 'म' };
  return (
    <div role="radiogroup" aria-label={t.common.language} className="flex rounded-full border border-line-strong p-0.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          role="radio"
          aria-checked={lang === l.code}
          title={l.label}
          onClick={() => setLang(l.code)}
          className="relative h-8 min-w-8 rounded-full px-2 text-xs font-semibold"
        >
          {lang === l.code && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-full bg-navy dark:bg-marigold" transition={spring} />}
          <span className={`relative ${lang === l.code ? 'text-offwhite dark:text-navy' : 'text-muted'}`}>{short[l.code]}</span>
        </button>
      ))}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { resolved } = useTheme();
  const { status } = useRadio();
  const loc = useLocation();
  const isActive = (to: string) => (to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to));
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2" aria-label="MumbaAai home">
            <img src={asset(resolved === 'dark' ? 'assets/logo-dark.png' : 'assets/logo-primary.png')} alt="MumbaAai" className="h-7 w-auto" />
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {TABS.map(({ to, key }) => (
              <NavLink key={to} to={to} className="relative px-3 py-2 text-sm font-medium">
                {isActive(to) && <motion.span layoutId="top-tab" className="absolute inset-x-2 -bottom-[13px] h-[2px] rounded bg-marigold" transition={spring} />}
                <span className={isActive(to) ? 'text-ink' : 'text-muted hover:text-ink'}>{t.nav[key]}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <ThemeButton />
          </div>
        </div>
        {isDemo && (
          <div className="border-t border-line bg-accent-soft py-1 text-center text-[11px] font-medium text-marigold-ink">{t.common.sampleData}</div>
        )}
      </header>

      {children}

      {env.contactPhone && (
        <footer className="mx-auto mb-24 mt-10 max-w-6xl px-4 md:mb-10">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">{t.contact.title}</p>
              <p className="text-sm text-muted">{t.contact.hint}</p>
            </div>
            <div className="flex gap-2">
              <a href={`tel:+${env.contactPhone}`} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-ink">
                {t.contact.call} +{env.contactPhone.replace(/^91(\d{5})(\d{5})$/, '91 $1 $2')}
              </a>
              <a href={`https://wa.me/${env.contactPhone}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white">
                {t.contact.whatsapp}
              </a>
            </div>
          </div>
        </footer>
      )}

      <nav
        aria-label="Tabs"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map(({ to, key, icon: Icon }) => {
            const active = isActive(to);
            return (
              <li key={to}>
                <NavLink to={to} className="relative flex flex-col items-center gap-1 py-2.5" aria-current={active ? 'page' : undefined}>
                  {active && <motion.span layoutId="bottom-tab" className="absolute top-0 h-[3px] w-8 rounded-b bg-marigold" transition={spring} />}
                  <motion.span whileTap={{ scale: 0.85 }} transition={spring} className="relative">
                    <Icon size={21} strokeWidth={active ? 2.1 : 1.6} className={active ? 'text-ink' : 'text-muted'} />
                    {key === 'radio' && status === 'playing' && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-live ring-2 ring-surface" />}
                  </motion.span>
                  <span className={`text-[10.5px] font-medium leading-none ${active ? 'text-ink' : 'text-muted'}`}>{t.nav[key]}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
