// RJ queue for Aap Ki Farmaish / Celebrations dedications.
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Clock, Radio, Copy, Phone } from 'lucide-react';
import { DEDICATION_STATUSES, type Dedication, type DedicationStatus } from '@mumbaaai/shared';
import { db } from '../lib/data';
import { useRows } from '../lib/useRows';
import { Badge, Btn, inputCls } from '../components/Resource';

const TONE: Record<DedicationStatus, 'muted' | 'good' | 'warn' | 'bad' | 'accent'> = {
  pending: 'warn',
  approved: 'good',
  scheduled: 'accent',
  aired: 'muted',
  rejected: 'bad',
};
const KIND: Record<string, string> = { farmaish: 'Farmaish', birthday: 'Birthday', anniversary: 'Anniversary', congrats: 'Congrats', other: 'Other' };
const ist = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : '';
const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);

/** What the RJ reads on air. */
export const script = (d: Dedication) =>
  `${d.from_name}${d.from_area ? ` from ${d.from_area}` : ''} wants to dedicate "${d.song}" to ${d.to_name}${
    d.kind === 'birthday' ? ' on their birthday' : d.kind === 'anniversary' ? ' on their anniversary' : ''
  }. The message: "${d.message}"`;

export default function Dedications() {
  const { rows, loading, error, reload } = useRows<Dedication>('dedications', { order: { column: 'created_at', ascending: false } });
  const [tab, setTab] = useState<DedicationStatus | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [airAt, setAirAt] = useState<Record<string, string>>({});
  const counts = useMemo(() => Object.fromEntries(DEDICATION_STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])), [rows]);
  const list = tab === 'all' ? rows : rows.filter((r) => r.status === tab);

  const patch = async (r: Dedication, p: Partial<Dedication>) => {
    setBusy(r.id);
    try {
      await db.update('dedications', r.id, p);
      await reload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dedications</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Aap Ki Farmaish and Celebrations requests from the app. Approve, set an air time, then mark it played after the RJ reads it. Phone numbers stay private.
        </p>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['pending', 'approved', 'scheduled', 'aired', 'rejected', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${tab === s ? 'border-navy bg-navy text-offwhite dark:border-marigold dark:bg-marigold dark:text-navy' : 'border-line-strong text-ink-soft'}`}
          >
            {s} {s !== 'all' && <span className="opacity-70">({counts[s] ?? 0})</span>}
          </button>
        ))}
      </div>
      {error && <p className="mb-3 rounded-lg border border-live/40 p-3 text-sm text-live-ink">{error}</p>}
      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : list.length === 0 ? (
        <p className="card p-8 text-center text-muted">Nothing in this list.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((r) => (
              <motion.article key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="card flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">
                      For {r.to_name} <span className="font-normal text-muted">from {r.from_name}{r.from_area ? `, ${r.from_area}` : ''}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {KIND[r.kind] ?? r.kind} · {r.show_pref ?? 'Any show'} · received {ist(r.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {r.sample && <Badge>Sample</Badge>}
                    <Badge tone={TONE[r.status]}>{r.status}</Badge>
                  </div>
                </div>
                <p className="rounded-lg bg-surface-2 p-3 text-sm text-ink">
                  <span className="font-semibold">🎵 {r.song}</span>
                  <br />“{r.message}”
                </p>
                {r.phone && (
                  <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                    <Phone size={12} /> {r.phone}
                  </a>
                )}
                {r.air_at && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-marigold-ink">
                    <Clock size={12} /> Air time {ist(r.air_at)}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  {r.status === 'pending' && (
                    <>
                      <Btn disabled={busy === r.id} onClick={() => patch(r, { status: 'approved' })}>
                        <Check size={14} /> Approve
                      </Btn>
                      <Btn variant="danger" disabled={busy === r.id} onClick={() => patch(r, { status: 'rejected' })}>
                        <X size={14} /> Reject
                      </Btn>
                    </>
                  )}
                  {(r.status === 'approved' || r.status === 'scheduled') && (
                    <>
                      <input
                        type="datetime-local"
                        className={`${inputCls} w-auto`}
                        value={airAt[r.id] ?? toLocal(r.air_at)}
                        onChange={(e) => setAirAt((a) => ({ ...a, [r.id]: e.target.value }))}
                        aria-label="Air time (IST)"
                      />
                      <Btn variant="ghost" disabled={busy === r.id || !(airAt[r.id] ?? toLocal(r.air_at))} onClick={() => patch(r, { status: 'scheduled', air_at: fromLocal(airAt[r.id] ?? toLocal(r.air_at)) })}>
                        <Clock size={14} /> Schedule
                      </Btn>
                      <Btn disabled={busy === r.id} onClick={() => patch(r, { status: 'aired', air_at: r.air_at ?? new Date().toISOString() })}>
                        <Radio size={14} /> Mark played
                      </Btn>
                    </>
                  )}
                  {(r.status === 'rejected' || r.status === 'aired') && (
                    <Btn variant="ghost" disabled={busy === r.id} onClick={() => patch(r, { status: 'pending' })}>
                      Back to pending
                    </Btn>
                  )}
                  <button className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink" onClick={() => navigator.clipboard?.writeText(script(r))} title="Copy RJ script">
                    <Copy size={13} /> RJ script
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
