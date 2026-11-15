// Business Connect board for the Mumbaa Business show.
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, MapPin, MessageCircle, Radio, Send, CheckCircle2, ShieldAlert, Globe } from 'lucide-react';
import { BIZ_ROLES, BIZ_STAGES, ZONES, type BizIntent, type BizRole, type BizStage, type BusinessListing, type ZoneId } from '@mumbaaai/shared';
import { db } from '../lib/data';
import { useI18n } from '../lib/i18n';
import { useTable } from '../lib/content';
import { Page, Stagger, Item } from '../components/motion';
import { Chip, SampleBadge, Skeleton, inputCls } from '../components/ui';
import { AdSlot } from '../components/AdSlot';

const wa = (l: BusinessListing) =>
  `https://wa.me/${l.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${l.founder}, I saw ${l.name} on MumbaAai Business Connect.`)}`;

function PostForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const b = t.business;
  const [intent, setIntent] = useState<BizIntent>('seeking');
  const [role, setRole] = useState<BizRole>('investor');
  const [f, setF] = useState({ name: '', founder: '', sector: '', stage: '' as BizStage | '', zone: '' as ZoneId | '', pitch: '', ask: '', whatsapp: '', website: '' });
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let phone = f.whatsapp.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    if (!f.name.trim() || !f.founder.trim() || !f.sector.trim() || !f.pitch.trim() || phone.length < 11) return setErr(b.required);
    if (!consent) return setErr(b.consent);
    setErr(null);
    setState('sending');
    try {
      await db.insert<BusinessListing>('business_listings', {
        intent,
        role,
        name: f.name.trim().slice(0, 60),
        founder: f.founder.trim().slice(0, 60),
        sector: f.sector.trim().slice(0, 60),
        stage: f.stage || null,
        zone: f.zone || null,
        pitch: f.pitch.trim().slice(0, 300),
        ask: f.ask.trim().slice(0, 100) || null,
        whatsapp: phone.slice(0, 15),
        website: f.website.trim().slice(0, 200) || null,
        status: 'pending',
        featured_on_air: false,
      });
      setState('sent');
    } catch (x) {
      setState('idle');
      setErr((x as Error).message || t.common.error);
    }
  };

  if (state === 'sent')
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
          <CheckCircle2 size={44} className="text-marigold" />
        </motion.span>
        <p className="max-w-sm text-sm text-ink">{b.sent}</p>
        <button className="text-sm font-semibold text-marigold-ink underline" onClick={onDone}>
          {t.common.close}
        </button>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-3 p-5">
      <div className="flex flex-wrap gap-1.5">
        {(['seeking', 'offering'] as const).map((i) => (
          <Chip key={i} active={intent === i} onClick={() => setIntent(i)}>
            {b[i]}
          </Chip>
        ))}
        <span className="mx-1 self-center text-muted">·</span>
        {BIZ_ROLES.map((r) => (
          <Chip key={r} active={role === r} onClick={() => setRole(r)}>
            {b.roles[r]}
          </Chip>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.name} *<input className={inputCls} value={f.name} onChange={set('name')} maxLength={60} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.founder} *<input className={inputCls} value={f.founder} onChange={set('founder')} maxLength={60} autoComplete="name" />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.sector} *<input className={inputCls} value={f.sector} onChange={set('sector')} maxLength={60} placeholder={b.sectorPh} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.stage}
          <select className={inputCls} value={f.stage} onChange={set('stage')}>
            <option value="">—</option>
            {BIZ_STAGES.map((s) => (
              <option key={s} value={s}>
                {b.stages[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.zone}
          <select className={inputCls} value={f.zone} onChange={set('zone')}>
            <option value="">—</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {(t.zones as Record<string, string>)[z.id] ?? z.id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.ask}
          <input className={inputCls} value={f.ask} onChange={set('ask')} maxLength={100} placeholder={b.askPh} />
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-ink-soft">
        {b.pitch} *<textarea className={`${inputCls} min-h-20`} value={f.pitch} onChange={set('pitch')} maxLength={300} />
        <span className="text-right font-normal text-muted">{f.pitch.length}/300</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.whatsapp} *<input className={inputCls} value={f.whatsapp} onChange={set('whatsapp')} inputMode="tel" maxLength={16} placeholder="98xxxxxxxx" />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-soft">
          {b.website}
          <input className={inputCls} value={f.website} onChange={set('website')} maxLength={200} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#F4A300]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        {b.consent}
      </label>
      {err && <p className="text-sm text-live-ink">{err}</p>}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.96 }} disabled={state === 'sending'} className="inline-flex items-center gap-2 rounded-full bg-marigold px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">
          <Send size={15} /> {state === 'sending' ? b.sending : b.send}
        </motion.button>
        <button type="button" className="text-sm text-muted" onClick={onDone}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

export default function Business() {
  const { t } = useI18n();
  const b = t.business;
  const { rows, loading } = useTable<BusinessListing>('business_listings', { eq: { status: 'approved' }, order: { column: 'created_at', ascending: false } });
  const [role, setRole] = useState<BizRole | 'all'>('all');
  const [intent, setIntent] = useState<BizIntent | 'all'>('all');
  const [posting, setPosting] = useState(false);
  const list = useMemo(
    () =>
      (rows ?? [])
        .filter((l) => (role === 'all' || l.role === role) && (intent === 'all' || l.intent === intent))
        .sort((a, c) => Number(Boolean(c.featured_on_air)) - Number(Boolean(a.featured_on_air))),
    [rows, role, intent],
  );

  return (
    <Page>
      <Stagger className="pt-6 md:pt-10">
        <Item>
          <section className="card overflow-hidden bg-navy text-offwhite dark:bg-surface">
            <div className="p-6">
              <p className="eyebrow !text-marigold">{b.eyebrow}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{b.title}</h1>
              <p className="mt-2 max-w-xl text-sm text-offwhite/75">{b.hint}</p>
              {!posting && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setPosting(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-marigold px-4 py-2.5 text-sm font-bold text-navy">
                  <Briefcase size={16} /> {b.post}
                </motion.button>
              )}
            </div>
            <AnimatePresence initial={false}>
              {posting && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-bg text-ink">
                  <PostForm onDone={() => setPosting(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </Item>
        <Item>
          <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
            <Chip active={intent === 'all' && role === 'all'} onClick={() => { setIntent('all'); setRole('all'); }}>
              {b.all}
            </Chip>
            {(['seeking', 'offering'] as const).map((i) => (
              <Chip key={i} active={intent === i} onClick={() => setIntent(intent === i ? 'all' : i)}>
                {b[i]}
              </Chip>
            ))}
            {BIZ_ROLES.map((r) => (
              <Chip key={r} active={role === r} onClick={() => setRole(role === r ? 'all' : r)}>
                {b.roles[r]}
              </Chip>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted">
            <ShieldAlert size={14} className="mt-px shrink-0" /> {b.safety}
          </p>
        </Item>
        <Item>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {loading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)
              : list.length === 0
                ? <p className="card col-span-full p-8 text-center text-muted">{b.empty}</p>
                : list.map((l, i) => (
                    <motion.article key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} className="card flex flex-col gap-2 p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${l.intent === 'seeking' ? 'bg-accent-soft text-marigold-ink' : 'bg-[#3E9B5F]/12 text-[#2B7347] dark:text-[#7FD19C]'}`}>
                          {b[l.intent]}: {b.roles[l.role]}
                        </span>
                        {l.featured_on_air && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#C42A37] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            <Radio size={10} /> {b.onAir}
                          </span>
                        )}
                        {l.sample && <SampleBadge />}
                      </div>
                      <h3 className="text-lg font-semibold text-ink">{l.name}</h3>
                      <p className="text-xs text-muted">
                        {l.founder} · {l.sector}
                        {l.stage ? ` · ${b.stages[l.stage]}` : ''}
                      </p>
                      <p className="text-sm text-ink-soft">{l.pitch}</p>
                      {l.ask && <p className="text-sm font-semibold text-ink">{l.ask}</p>}
                      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                        {!l.sample && (
                          <a href={wa(l)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-white">
                            <MessageCircle size={15} /> {b.connect}
                          </a>
                        )}
                        {l.website && (
                          <a href={/^https?:/.test(l.website) ? l.website : `https://${l.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-ink-soft">
                            <Globe size={14} /> {l.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                        {l.zone && (
                          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
                            <MapPin size={12} /> {(t.zones as Record<string, string>)[l.zone] ?? l.zone}
                          </span>
                        )}
                      </div>
                    </motion.article>
                  ))}
          </div>
          <AdSlot placement="jobs_sponsored" className="mt-5" />
        </Item>
      </Stagger>
    </Page>
  );
}
