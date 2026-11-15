import { Link } from 'react-router-dom';
import { Heart, Megaphone, Briefcase, MessageSquareWarning, Handshake } from 'lucide-react';
import { estimateRevenue, inr, type Ad, type BusinessListing, type Dedication, type Job, type ListenerReport, type RateCardRow } from '@mumbaaai/shared';
import { useRows } from '../lib/useRows';

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
