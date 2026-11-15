// Aap Ki Farmaish + Celebrations: listener song dedications.
// Listeners submit; RJs approve/schedule in the admin queue; approved ones show on the wall.
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Cake, PartyPopper, Music2, Sparkles, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { DEDICATION_KINDS, fmt, type Dedication, type DedicationKind, type RadioShow } from '@mumbaaai/shared';
import { db } from '../lib/data';
import { env } from '../lib/env';
import { useI18n } from '../lib/i18n';
import { useTable } from '../lib/content';
import { SectionTitle, SampleBadge, inputCls } from './ui';

const ICON: Record<DedicationKind, typeof Heart> = {
  farmaish: Music2,
  birthday: Cake,
  anniversary: Heart,
  congrats: PartyPopper,
  other: Sparkles,
};

const istTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '';

export function DedicationForm({ shows }: { shows: RadioShow[] }) {
  const { t } = useI18n();
  const d = t.dedication;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DedicationKind>('farmaish');
  const [f, setF] = useState({ from_name: '', from_area: '', to_name: '', song: '', message: '', show_pref: '', phone: '' });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.from_name.trim() || !f.to_name.trim() || !f.song.trim() || !f.message.trim()) return setErr(d.required);
    if (!consent) return setErr(d.consent);
    setErr(null);
    setState('sending');
    try {
      await db.insert<Dedication>('dedications', {
        kind,
        from_name: f.from_name.trim().slice(0, 40),
        from_area: f.from_area.trim().slice(0, 60) || null,
        to_name: f.to_name.trim().slice(0, 60),
        song: f.song.trim().slice(0, 120),
        message: f.message.trim().slice(0, 280),
        show_pref: f.show_pref || (kind === 'farmaish' ? 'Aap Ki Farmaish' : 'Celebrations'),
        phone: f.phone.replace(/[^\d+]/g, '').slice(0, 15) || null,
        status: 'pending',
      });
      setState('sent');
      setF({ from_name: f.from_name, from_area: f.from_area, to_name: '', song: '', message: '', show_pref: '', phone: '' });
    } catch (x) {
      setState('error');
      setErr((x as Error).message || t.common.error);
    }
  };

  const wa = env.radioWhatsapp
    ? `https://wa.me/${env.radioWhatsapp}?text=${encodeURIComponent('Mumbaa Radio dedication: ')}`
    : null;

  return (
    <section className="card overflow-hidden">
      <div className="relative bg-gradient-to-br from-marigold/25 via-accent-soft to-transparent p-5">
        <SectionTitle eyebrow="Aap Ki Farmaish · Celebrations" title={d.title} hint={d.hint} />
        {!open && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setOpen(true);
              setState('idle');
            }}
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-offwhite dark:bg-marigold dark:text-navy"
          >
            <Heart size={16} /> {d.open}
          </motion.button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {state === 'sent' ? (
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <motion.span initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
                  <CheckCircle2 size={44} className="text-marigold" />
                </motion.span>
                <p className="max-w-sm text-sm text-ink">{d.sent}</p>
                <button className="text-sm font-semibold text-marigold-ink underline" onClick={() => setState('idle')}>
                  {d.open}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-3 p-5 pt-3">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-ink-soft">{d.kind}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEDICATION_KINDS.map((k) => {
                      const I = ICON[k];
                      const on = k === kind;
                      return (
                        <button
                          type="button"
                          key={k}
                          onClick={() => setKind(k)}
                          aria-pressed={on}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                            on ? 'border-navy bg-navy text-offwhite dark:border-marigold dark:bg-marigold dark:text-navy' : 'border-line-strong text-ink-soft'
                          }`}
                        >
                          <I size={14} /> {d.kinds[k]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    {d.fromName} *<input className={inputCls} value={f.from_name} onChange={set('from_name')} maxLength={40} autoComplete="given-name" />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    {d.fromArea}
                    <input className={inputCls} value={f.from_area} onChange={set('from_area')} maxLength={60} placeholder="Borivali, Thane, Vashi…" />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    {d.toName} *<input className={inputCls} value={f.to_name} onChange={set('to_name')} maxLength={60} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    {d.song} *<input className={inputCls} value={f.song} onChange={set('song')} maxLength={120} placeholder={d.songPh} />
                  </label>
                </div>
                <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                  {d.message} *
                  <textarea className={`${inputCls} min-h-20`} value={f.message} onChange={set('message')} maxLength={280} placeholder={d.messagePh} />
                  <span className="text-right font-normal text-muted">{f.message.length}/280</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    {d.show}
                    <select className={inputCls} value={f.show_pref} onChange={set('show_pref')}>
                      <option value="">{kind === 'farmaish' ? 'Aap Ki Farmaish' : 'Celebrations'}</option>
                      {shows.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.start_time} · {s.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">
                    {d.phone}
                    <input className={inputCls} value={f.phone} onChange={set('phone')} inputMode="tel" maxLength={15} autoComplete="tel" />
                  </label>
                </div>
                <label className="flex items-start gap-2 text-sm text-ink-soft">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#F4A300]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  {d.consent}
                </label>
                {err && <p className="text-sm text-live-ink">{err}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={state === 'sending'}
                    className="inline-flex items-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60"
                  >
                    <Send size={15} /> {state === 'sending' ? d.sending : d.send}
                  </motion.button>
                  <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
                    {t.common.cancel}
                  </button>
                  {wa && (
                    <a href={wa} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#2B7347] dark:text-[#7FD19C]">
                      <MessageCircle size={15} /> {d.whatsapp}
                    </a>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Public wall: approved / scheduled / aired dedications, newest first. Phone numbers are never shown. */
export function DedicationWall() {
  const { t } = useI18n();
  const d = t.dedication;
  const { rows } = useTable<Dedication>('dedications_public', { order: { column: 'created_at', ascending: false }, limit: 40 });
  const items = useMemo(() => (rows ?? []).filter((r) => r.status === 'approved' || r.status === 'scheduled' || r.status === 'aired').slice(0, 8), [rows]);
  return (
    <section className="card p-5">
      <SectionTitle title={d.wall} right={items.some((r) => r.sample) ? <SampleBadge /> : undefined} />
      {items.length === 0 ? (
        <p className="text-sm text-muted">{d.wallEmpty}</p>
      ) : (
        <ul className="grid gap-2.5">
          {items.map((r, i) => {
            const I = ICON[r.kind] ?? Music2;
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                className="flex gap-3 rounded-xl bg-surface-2/60 p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-marigold-ink">
                  <I size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-semibold">{r.to_name}</span>
                    <span className="text-muted">
                      {' '}
                      · {d.from} {r.from_name}
                      {r.from_area ? `, ${r.from_area}` : ''}
                    </span>
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">“{r.message}”</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Music2 size={12} /> {r.song}
                    {r.status === 'aired' ? (
                      <span className="rounded-full bg-surface px-2 py-px font-semibold">{d.aired}</span>
                    ) : r.air_at ? (
                      <span className="rounded-full bg-marigold/20 px-2 py-px font-semibold text-marigold-ink">{fmt(d.airsAt, { time: istTime(r.air_at) })}</span>
                    ) : null}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
