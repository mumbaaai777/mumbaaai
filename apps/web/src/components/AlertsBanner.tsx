import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info, OctagonAlert, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { CityAlert } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { useZone } from '../lib/zone';
import { useTable } from '../lib/content';
import { SampleBadge } from './ui';

const STYLE = {
  critical: { icon: OctagonAlert, cls: 'border-live/40 bg-live/8 text-live-ink' },
  warning: { icon: AlertTriangle, cls: 'border-marigold/50 bg-accent-soft text-marigold-ink' },
  info: { icon: Info, cls: 'border-line-strong bg-surface text-ink-soft' },
};

export function AlertsBanner() {
  const { t, locale } = useI18n();
  const { zone } = useZone();
  const { rows } = useTable<CityAlert>('alerts', { eq: { active: true } });
  const [open, setOpen] = useState<string | null>(null);
  const now = Date.now();
  const list = (rows ?? [])
    .filter((a) => a.active && (!a.zones?.length || a.zones.includes(zone)) && (!a.ends_at || new Date(a.ends_at).getTime() > now))
    .sort((a, b) => ['critical', 'warning', 'info'].indexOf(a.severity) - ['critical', 'warning', 'info'].indexOf(b.severity));
  if (!list.length) return null;
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  return (
    <section aria-label={t.alerts.title} className="space-y-2">
      {list.map((a) => {
        const S = STYLE[a.severity];
        const expanded = open === a.id;
        return (
          <motion.div layout key={a.id} className={`overflow-hidden rounded-2xl border ${S.cls}`}>
            <button className="flex w-full items-start gap-3 px-4 py-3 text-left" onClick={() => setOpen(expanded ? null : a.id)} aria-expanded={expanded}>
              <S.icon size={18} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t.alerts[a.severity]}</span>
                  {a.sample && <SampleBadge />}
                </span>
                <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-ink">{a.title}</span>
              </span>
              <ChevronDown size={16} className={`mt-1 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-3 pl-11 text-sm text-ink-soft">
                  {a.body && <p>{a.body}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {fmt.format(new Date(a.starts_at))}
                    {a.ends_at ? ` – ${fmt.format(new Date(a.ends_at))}` : ''}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </section>
  );
}
