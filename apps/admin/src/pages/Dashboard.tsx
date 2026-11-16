import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/data';
import { Heart, Users, Megaphone, Briefcase, MessageSquareWarning, Handshake } from 'lucide-react';
import { estimateRevenue, inr, type Ad, type BusinessListing, type Dedication, type Job, type ListenerReport, type RateCardRow } from '@mumbaaai/shared';
import { useRows } from '../lib/useRows';

function useLiveCount() {
  const [live, setLive] = useState<{ users: number; listening: number } | null>(null);
  useEffect(() => {
    const client = db.client;
    if (!client) return;
    const ch = client.channel('live-users');
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ listening?: boolean }>();
      const keys = Object.keys(state);
      setLive({ users: keys.length, listening: keys.filter((k) => state[k].some((m) => m.listening)).length });
    }).subscribe();
    return () => {
      void client.removeChannel(ch);
    };
  }, []);
  return live;
}

function useVisits() {
  const [rows, setRows] = useState<{ day: string; visitors: number; listeners: number }[] | null>(null);
  useEffect(() => {
    const client = db.client;
    if (!client) return;
    void client.rpc('visit_stats', { days: 7 }).then(({ data, error }) => setRows(error ? [] : ((data as typeof rows) ?? [])));
  }, []);
  return rows;
}

function VisitsCard() {
  const rows = useVisits();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const t = rows?.find((r) => r.day === today);
  const week = rows?.reduce((s, r) => s + Number(r.visitors), 0) ?? 0;
  return (
    <div className="card mb-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Real visitors (counted since 17 Nov 2026)</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-ink-soft">
        <p><span className="text-3xl font-semibold tabular-nums text-ink">{rows ? Number(t?.visitors ?? 0) : '…'}</span> today</p>
        <p><span className="text-3xl font-semibold tabular-nums text-ink">{rows ? Number(t?.listeners ?? 0) : '…'}</span> played the radio today</p>
        <p><span className="text-3xl font-semibold tabular-nums text-ink">{rows ? week : '…'}</span> visits in last 7 days</p>
      </div>
      {rows && rows.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          {rows.map((r) => (
            <span key={r.day} className="rounded-full bg-black/5 px-2 py-0.5 tabular-nums">{r.day.slice(5)}: {Number(r.visitors)}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveCard() {
  const live = useLiveCount();
  return (
    <div className="card mb-4 flex items-center gap-4 p-4">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
      </span>
      <div className="flex flex-1 flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-sm text-ink-soft">
          <span className="text-3xl font-semibold tabular-nums text-ink">{live ? live.users : '…'}</span> in the app now
        </p>
        <p className="text-sm text-ink-soft">
          <span className="text-3xl font-semibold tabular-nums text-ink">{live ? live.listening : '…'}</span> listening to Mumbaa Radio
        </p>
      </div>
      <Users size={18} className="text-marigold-ink" />
    </div>
  );
}

export default function Dashboard() {
  const { rows: ded } = useRows<Dedication>('dedications');
  const { rows: ads } = useRows<Ad>('ads');
  const { rows: jobs } = useRows<Job>('jobs');
  const { rows: reps } = useRows<ListenerReport>('listener_reports');
  const { rows: rate } = useRows<RateCardRow>('rate_card');
  const { rows: biz } = useRows<BusinessListing>('business_listings');
  const active = ads.filter((a) => a.status === 'active');
  const cards = [
    { to: '/dedications', icon: Heart, label: 'Dedications waiting', value: ded.filter((d) => d.status === 'pending').length, sub: `${ded.filter((d) => d.status === 'scheduled').length} scheduled` },
    { to: '/business', icon: Handshake, label: 'Business listings to check', value: biz.filter((b) => b.status === 'pending').length, sub: `${biz.filter((b) => b.featured_on_air).length} featured on air` },
    { to: '/ads', icon: Megaphone, label: 'Active ads', value: active.length, sub: `≈ ${inr(active.reduce((s, a) => s + estimateRevenue(a, rate), 0))} earned` },
    { to: '/jobs', icon: Briefcase, label: 'Open jobs', value: jobs.filter((j) => j.status === 'active').length, sub: `${jobs.filter((j) => j.sponsored).length} sponsored` },
    { to: '/reports', icon: MessageSquareWarning, label: 'Reports to review', value: reps.filter((r) => r.status === 'pending').length, sub: 'traffic and train tips' },
  ];
  return (
    <div>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight text-ink">Today at Mumbaa Radio</h1>
      <LiveCard />
      <VisitsCard />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card p-4 transition-transform hover:-translate-y-0.5">
            <c.icon size={18} className="text-marigold-ink" />
            <p className="mt-3 text-3xl font-semibold tabular-nums text-ink">{c.value}</p>
            <p className="text-sm font-medium text-ink-soft">{c.label}</p>
            <p className="text-xs text-muted">{c.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
