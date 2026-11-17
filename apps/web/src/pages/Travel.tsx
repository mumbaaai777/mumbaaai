import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownUp, ArrowUpRight, ChevronDown, Clock, Send, CheckCircle2 } from 'lucide-react';
import { ZONES, type ListenerReport, type ReportKind, type ZoneId } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { useZone } from '../lib/zone';
import { useTable } from '../lib/content';
import { db, isDemo } from '../lib/data';
import { ALL_STATIONS, CORRIDORS, LINES, mapsTrafficUrl, type LineId } from '../data/transit';
import { planRoute, sampleDepartures } from '../lib/planner';
import { Page, Stagger, Item, Press } from '../components/motion';
import { Chip, SectionTitle, SampleBadge, inputCls } from '../components/ui';

// Usual boarding platforms, only where well established. Everything else: check the indicator board.
const PLATFORMS: Record<string, string> = { 'harbour|CSMT': '1 / 2', 'harbour|Kurla': '7 / 8', 'trans_harbour|Thane': '9 / 10' };

const lineColor = (id: LineId | 'walk') => (id === 'walk' ? 'var(--muted)' : LINES.find((l) => l.id === id)!.color);

function Planner() {
  const { t } = useI18n();
  const [from, setFrom] = useState('Borivali');
  const [to, setTo] = useState('Churchgate');
  const [openSeg, setOpenSeg] = useState<string | null>(null);
  const valid = ALL_STATIONS.includes(from) && ALL_STATIONS.includes(to);
  const plan = useMemo(() => (valid ? planRoute(from, to) : null), [from, to, valid]);
  const { rows: pfRows } = useTable<{ station: string; line: string; towards?: string | null; platform: string }>('station_platforms');
  const platformFor = (line: string, station: string, towards: string) => {
    const here = (pfRows ?? []).filter((r) => r.line === line && r.station.trim().toLowerCase() === station.toLowerCase());
    const hit = here.find((r) => r.towards && towards.toLowerCase().includes(r.towards.trim().toLowerCase())) ?? here.find((r) => !r.towards);
    return hit?.platform ?? PLATFORMS[`${line}|${station}`];
  };
  const firstRide = plan?.segments.find((s) => s.line !== 'walk');
  const deps = firstRide && firstRide.line !== 'walk' ? sampleDepartures(firstRide.line, firstRide.from) : [];

  return (
    <section className="card p-5">
      <SectionTitle title={t.travel.planner} hint={t.travel.plannerHint} />
      <datalist id="stations">
        {ALL_STATIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="relative grid gap-2">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t.common.from}</span>
          <input className={inputCls} list="stations" value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="off" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t.common.to}</span>
          <input className={inputCls} list="stations" value={to} onChange={(e) => setTo(e.target.value)} autoComplete="off" />
        </label>
        <Press
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="absolute right-3 top-[52%] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-surface text-ink-soft shadow-sm"
          aria-label={t.travel.swap}
        >
          <ArrowDownUp size={16} />
        </Press>
      </div>

      <AnimatePresence mode="wait">
        {valid && (
          <motion.div key={`${from}-${to}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            {!plan ? (
              <p className="text-sm text-muted">{t.travel.noRoute}</p>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="tnum text-2xl font-semibold text-ink">~{plan.totalMinutes} {t.common.minutesShort}</span>
                  <span className="text-sm text-muted">
                    {t.travel.estTime} · {plan.segments.filter((s) => s.line !== 'walk').length > 1 ? `${t.travel.change} ${plan.segments.slice(0, -1).map((s) => s.to).join(', ')}` : t.travel.direct}
                  </span>
                </div>
                <ol className="relative space-y-0">
                  {plan.segments.map((s, i) => (
                    <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      <span className="flex flex-col items-center">
                        <span className="h-3 w-3 rounded-full border-2 bg-surface" style={{ borderColor: lineColor(s.line) }} />
                        <span className="w-[3px] flex-1 rounded" style={{ background: lineColor(s.line), opacity: s.line === 'walk' ? 0.3 : 1 }} />
                      </span>
                      <div className="-mt-1 min-w-0 flex-1">
                        <p className="font-semibold text-ink">{s.from}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                          {s.line === 'walk' ? (
                            <span className="inline-flex items-center gap-1">
                              🚶 {t.travel.walk} → {s.to} · {s.minutes} {t.common.minutesShort}
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setOpenSeg((o) => (o === `${from}-${to}-${i}` ? null : `${from}-${to}-${i}`))}
                                aria-expanded={openSeg === `${from}-${to}-${i}`}
                                className="inline-flex items-center gap-1 font-semibold"
                                style={{ color: lineColor(s.line) }}
                              >
                                {t.travel.lines[s.line]}
                                <ChevronDown size={15} className={`transition-transform ${openSeg === `${from}-${to}-${i}` ? 'rotate-180' : ''}`} />
                              </button>
                              <span>→ {s.towards}</span>
                              <span className="tnum">
                                · {s.stops} {s.stops === 1 ? t.travel.stop : t.travel.stops} · {s.minutes} {t.common.minutesShort}
                              </span>
                            </>
                          )}
                        </p>
                        {s.line !== 'walk' && (
                          <p className="mt-1 text-xs font-medium text-ink-soft">
                            {platformFor(s.line, s.from, s.towards) ? `${t.travel.platform} ${platformFor(s.line, s.from, s.towards)}` : t.travel.checkBoard}
                          </p>
                        )}
                        {s.line !== 'walk' && openSeg === `${from}-${to}-${i}` && (
                          <motion.ol initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1 overflow-hidden border-l-2 pl-3 text-sm text-ink-soft" style={{ borderColor: lineColor(s.line) }}>
                            {(s.via ?? []).map((st, k) => (
                              <li key={st} className="flex items-center gap-2">
                                <span className="tnum w-5 text-right text-xs text-muted">{k + 1}</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </motion.ol>
                        )}
                        {i === plan.segments.length - 1 && <p className="mt-3 font-semibold text-ink">{s.to}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                {deps.length > 0 && (
                  <div className="mt-4 rounded-xl bg-surface-2 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                        <Clock size={13} /> {t.travel.nextDepartures} · {firstRide!.from}
                      </span>
                      <SampleBadge label={t.travel.timetableSample} />
                    </div>
                    <div className="flex gap-2">
                      {deps.map((d) => (
                        <span key={d} className="tnum rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold text-ink">
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-muted">{t.travel.platformNote}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Official published timings (MMOPL/RMM Line 1, MMRDA/MMMOCL press release 8 Apr 2026 for 2A, 7+9, 2B; MMRCL for Line 3).
// Headways are the operators' stated peak/off-peak intervals; exact departures vary, so "next" times are estimates.
const METRO_TT: { id: string; name: string; color: string; route: string; first: string; last: string; peak: number; off: number; note?: string }[] = [
  { id: 'm1', name: 'Line 1 · Blue', color: '#2E86C1', route: 'Versova ⇄ Ghatkopar', first: '05:30', last: '23:25', peak: 3.5, off: 7, note: 'Last from Ghatkopar 23:50 · weekends differ' },
  { id: 'm2a', name: 'Line 2A · Yellow', color: '#D4AC0D', route: 'Dahisar East ⇄ Andheri West', first: '05:50', last: '23:00', peak: 6, off: 9, note: 'Last trains 22:35 to 23:00' },
  { id: 'm3', name: 'Line 3 · Aqua', color: '#17A2B8', route: 'Aarey JVLR ⇄ Cuffe Parade', first: '05:55', last: '22:30', peak: 5, off: 10, note: 'First from Aarey JVLR, last from Cuffe Parade' },
  { id: 'm7', name: 'Line 7 + 9 · Red', color: '#E74C3C', route: 'Gundavali ⇄ Kashigaon', first: '05:50', last: '23:00', peak: 5.8, off: 9 },
  { id: 'm2b', name: 'Line 2B · Yellow', color: '#D4AC0D', route: 'Mandale ⇄ Diamond Garden', first: '06:00', last: '22:30', peak: 9.5, off: 9.5 },
];
const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
const fmtMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;

function MetroTimetable() {
  const { t } = useI18n();
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const weekday = ist.getDay() >= 1 && ist.getDay() <= 5;
  const peak = weekday && ((mins >= 8 * 60 && mins < 11 * 60) || (mins >= 17 * 60 && mins < 21 * 60));
  const next = (l: (typeof METRO_TT)[number]) => {
    const f = toMin(l.first), e = toMin(l.last), h = peak ? l.peak : l.off;
    if (mins > e || mins < f) return `${t.travel.firstAt} ${l.first}`;
    const k = Math.ceil((mins + 1 - f) / h);
    return [0, 1, 2].map((i) => f + (k + i) * h).filter((x) => x <= e).map(fmtMin).join(' · ') || `${t.travel.firstAt} ${l.first}`;
  };
  return (
    <section className="card p-4">
      <SectionTitle title={t.travel.metroTT} hint={peak ? t.travel.peakNow : t.travel.offPeakNow} />
      <ul className="divide-y divide-line">
        {METRO_TT.map((l) => (
          <li key={l.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              <span className="font-semibold text-ink">{l.name}</span>
              <span className="truncate text-sm text-muted">{l.route}</span>
            </div>
            <div className="tnum mt-1.5 grid grid-cols-3 gap-2 text-sm">
              <span><span className="block text-xs text-muted">{t.travel.first}</span>{l.first}</span>
              <span><span className="block text-xs text-muted">{t.travel.last}</span>{l.last}</span>
              <span><span className="block text-xs text-muted">{t.travel.every}</span>{l.peak === l.off ? `${l.peak}` : `${l.peak} / ${l.off}`} {t.common.minutesShort}</span>
            </div>
            <p className="tnum mt-1.5 text-sm text-ink-soft"><span className="text-xs text-muted">{t.travel.nextApprox}: </span>{next(l)}</p>
            {l.note && <p className="mt-0.5 text-xs text-muted">{l.note}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t.travel.metroTTNote}</p>
    </section>
  );
}

function LinesBrowser() {
  const { t } = useI18n();
  const [kind, setKind] = useState<'local' | 'metro'>('local');
  const lines = LINES.filter((l) => l.kind === kind);
  const [lineId, setLineId] = useState<LineId>('western');
  const line = lines.find((l) => l.id === lineId) ?? lines[0];
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{kind === 'local' ? t.travel.trains : t.travel.metro}</h2>
        <div className="flex rounded-full border border-line-strong p-0.5 text-sm">
          {(['local', 'metro'] as const).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setLineId(LINES.find((l) => l.kind === k)!.id);
              }}
              className={`rounded-full px-3 py-1 font-medium ${kind === k ? 'bg-navy text-offwhite dark:bg-marigold dark:text-navy' : 'text-muted'}`}
            >
              {k === 'local' ? t.travel.trains : t.travel.metro}
            </button>
          ))}
        </div>
      </div>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
        {lines.map((l) => (
          <Chip key={l.id} active={l.id === line.id} onClick={() => setLineId(l.id)}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: l.color }} />
            {t.travel.lines[l.id]}
          </Chip>
        ))}
      </div>
      <motion.div key={line.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        {line.branches.map((b) => (
          <div key={b.name}>
            <p className="mb-2 text-sm font-semibold text-ink-soft">
              {b.name} <span className="tnum font-normal text-muted">· {b.stations.length} {t.travel.stations}</span>
            </p>
            <ol className="max-h-80 overflow-y-auto pr-1">
              {b.stations.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="flex h-7 flex-col items-center">
                    <span className="w-[3px] flex-1" style={{ background: i === 0 ? 'transparent' : line.color }} />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-surface" style={{ borderColor: line.color }} />
                    <span className="w-[3px] flex-1" style={{ background: i === b.stations.length - 1 ? 'transparent' : line.color }} />
                  </span>
                  <span className="text-sm text-ink">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function Traffic() {
  const { t, locale } = useI18n();
  const { rows } = useTable<ListenerReport>('listener_reports', { eq: { status: 'approved' }, order: { column: 'created_at', ascending: false }, limit: 20 });
  const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  return (
    <section className="card p-5">
      <SectionTitle title={t.travel.traffic} hint={t.travel.trafficHint} />
      <div className="grid gap-2 sm:grid-cols-2">
        {CORRIDORS.map((c) => (
          <a
            key={c.name}
            href={mapsTrafficUrl(c)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-xl border border-line px-3.5 py-3 text-sm font-medium text-ink transition-colors hover:border-marigold"
          >
            {c.name}
            <ArrowUpRight size={15} className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-marigold-ink" />
          </a>
        ))}
      </div>
      <h3 className="mb-2 mt-6 text-sm font-semibold text-ink-soft">{t.travel.reports}</h3>
      {rows && rows.length ? (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-ink-soft">{t.report[r.kind]}</span>
                <span>{r.location}</span>
                <span>· {fmt.format(new Date(r.created_at))}</span>
                {r.sample && <SampleBadge />}
              </div>
              <p className="mt-1 text-[15px] text-ink">{r.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t.travel.noReports}</p>
      )}
    </section>
  );
}

function ReportForm() {
  const { t } = useI18n();
  const { zone: myZone } = useZone();
  const [kind, setKind] = useState<ReportKind>('traffic');
  const [zone, setZone] = useState<ZoneId>(myZone);
  const [location, setLocation] = useState('');
  const [line, setLine] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error' | 'invalid'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim().length < 3 || message.trim().length < 5) return setState('invalid');
    setState('sending');
    try {
      await db.insert<ListenerReport>('listener_reports', {
        kind,
        zone,
        location: location.trim().slice(0, 120),
        line: kind === 'train' && line ? line : null,
        message: message.trim().slice(0, 500),
        reporter_name: name.trim().slice(0, 60) || null,
        status: 'pending',
      });
      setState('done');
      setLocation('');
      setMessage('');
    } catch {
      setState('error');
    }
  };

  return (
    <section className="card p-5">
      <SectionTitle title={t.report.title} />
      <AnimatePresence mode="wait">
        {state === 'done' ? (
          <motion.div key="done" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-start gap-3 rounded-xl bg-accent-soft p-4">
            <CheckCircle2 className="shrink-0 text-marigold-ink" />
            <div className="text-sm text-ink">
              <p className="font-semibold">{t.report.thanks}</p>
              {isDemo && <p className="mt-1 text-muted">{t.report.savedLocal}</p>}
              <button className="mt-2 font-semibold text-marigold-ink" onClick={() => setState('idle')}>
                + {t.report.send}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} className="grid gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-muted">{t.report.kind}</legend>
              <div className="flex flex-wrap gap-2">
                {(['traffic', 'train', 'waterlogging', 'other'] as const).map((k) => (
                  <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
                    {t.report[k]}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-muted">{t.zones.label}</span>
                <select className={inputCls} value={zone} onChange={(e) => setZone(e.target.value as ZoneId)}>
                  {ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {t.zones[z.id]}
                    </option>
                  ))}
                </select>
              </label>
              {kind === 'train' && (
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-muted">{t.report.line}</span>
                  <select className={inputCls} value={line} onChange={(e) => setLine(e.target.value)}>
                    <option value="">—</option>
                    {LINES.map((l) => (
                      <option key={l.id} value={l.id}>
                        {t.travel.lines[l.id]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted">{t.report.location}</span>
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.report.locationPh} maxLength={120} required />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted">{t.report.message}</span>
              <textarea className={`${inputCls} min-h-24`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.report.messagePh} maxLength={500} required />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted">{t.report.name}</span>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </label>
            {state === 'invalid' && <p className="text-sm text-live-ink">{t.report.tooShort}</p>}
            {state === 'error' && <p className="text-sm text-live-ink">{t.common.error}</p>}
            <Press
              type="submit"
              disabled={state === 'sending'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 font-semibold text-offwhite disabled:opacity-60 dark:bg-marigold dark:text-navy"
            >
              <Send size={16} /> {state === 'sending' ? t.common.loading : t.report.send}
            </Press>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function Travel() {
  const { t } = useI18n();
  return (
    <Page>
      <h1 className="pb-5 pt-6 text-3xl font-semibold tracking-tight text-ink md:pt-10">{t.travel.title}</h1>
      <Stagger className="grid gap-5 md:grid-cols-2 md:items-start">
        <Item>
          <Planner />
        </Item>
        <Item>
          <MetroTimetable />
        </Item>
        <Item>
          <LinesBrowser />
        </Item>
        <Item>
          <Traffic />
        </Item>
        <Item>
          <ReportForm />
        </Item>
      </Stagger>
    </Page>
  );
}
