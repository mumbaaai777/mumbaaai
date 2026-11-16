import { BIZ_ROLES, BIZ_STAGES, type BusinessListing, AD_CATEGORIES, AD_PLACEMENTS, AD_STATUSES, JOB_TYPES, PRICING_MODELS, ZONES, AdCard, ctr, inr, type Ad, type CityAlert, type Job, type ListenerReport, type RadioShow, type RjProfile } from '@mumbaaai/shared';
import { dictionaries } from '@mumbaaai/shared';
const en = dictionaries.en;
import { ResourcePage, Badge, type Field } from '../components/Resource';
import { db } from '../lib/data';

const opt = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x.replace(/_/g, ' ') }));
const zoneName = (id: string) => (en.zones as Record<string, string>)[id] ?? id;
const zoneOpts = ZONES.map((z) => ({ value: z.id, label: zoneName(z.id) }));
const today = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const plus = (d: number) => new Date(Date.now() + 330 * 60000 + d * 86400000).toISOString().slice(0, 10);
const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d] }));

export function AdsPage() {
  const fields: Field[] = [
    { key: 'advertiser', label: 'Advertiser', type: 'text', required: true, half: true },
    { key: 'category', label: 'Category', type: 'select', options: opt(AD_CATEGORIES), required: true, half: true },
    { key: 'title', label: 'Headline', type: 'text', required: true },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'cta', label: 'Button text', type: 'text', half: true, placeholder: 'Book site visit' },
    { key: 'link', label: 'Link', type: 'url', required: true, half: true },
    { key: 'image_url', label: 'Image', type: 'image' },
    { key: 'placement', label: 'Placement', type: 'select', options: opt(AD_PLACEMENTS), required: true, half: true },
    { key: 'status', label: 'Status', type: 'select', options: opt(AD_STATUSES), required: true, half: true },
    { key: 'zones', label: 'Zones (none = all MMR)', type: 'multiselect', options: zoneOpts },
    { key: 'start_date', label: 'Start', type: 'date', required: true, half: true },
    { key: 'end_date', label: 'End', type: 'date', required: true, half: true },
    { key: 'pricing_model', label: 'Pricing', type: 'select', options: opt(PRICING_MODELS), required: true, half: true },
    { key: 'rate_inr', label: 'Rate (₹)', type: 'number', half: true },
    { key: 'budget_inr', label: 'Budget (₹)', type: 'number', half: true },
  ];
  return (
    <ResourcePage<Ad & Record<string, unknown>>
      table="ads"
      title="Ads"
      description="Real estate, retail, education, food and more. Radio pre-roll ads are read by the RJ."
      fields={fields}
      searchKeys={['advertiser', 'title']}
      defaults={() => ({ category: 'real_estate', placement: 'home_banner', status: 'draft', zones: [], start_date: today(), end_date: plus(30), pricing_model: 'cpm', budget_inr: 10000, impressions: 0, clicks: 0 })}
      preview={(d) => (d.title ? <AdCard ad={d as Ad} label="Sponsored" /> : <p className="text-sm text-muted">Fill the headline to preview.</p>)}
      columns={[
        { key: 'advertiser', label: 'Advertiser', render: (a) => <span className="font-medium">{a.advertiser}</span> },
        { key: 'title', label: 'Headline', className: 'max-w-xs truncate' },
        { key: 'placement', label: 'Placement', render: (a) => a.placement.replace(/_/g, ' ') },
        { key: 'status', label: 'Status', render: (a) => <Badge tone={a.status === 'active' ? 'good' : a.status === 'paused' ? 'warn' : 'muted'}>{a.status}</Badge> },
        { key: 'ctr', label: 'Imp · CTR', render: (a) => `${a.impressions ?? 0} · ${(ctr(a) * 100).toFixed(1)}%` },
        { key: 'budget_inr', label: 'Budget', render: (a) => inr(a.budget_inr ?? 0) },
      ]}
    />
  );
}

export function JobsPage() {
  return (
    <ResourcePage<Job & Record<string, unknown>>
      table="jobs"
      title="Jobs"
      description="Local jobs. Applicants contact the employer on WhatsApp."
      searchKeys={['title', 'company']}
      fields={[
        { key: 'title', label: 'Job title', type: 'text', required: true },
        { key: 'company', label: 'Company', type: 'text', required: true, half: true },
        { key: 'job_type', label: 'Type', type: 'select', options: opt(JOB_TYPES), required: true, half: true },
        { key: 'zone', label: 'Zone', type: 'select', options: zoneOpts, required: true, half: true },
        { key: 'locality', label: 'Locality', type: 'text', half: true },
        { key: 'salary_min_inr', label: 'Salary from (₹/month)', type: 'number', half: true },
        { key: 'salary_max_inr', label: 'Salary to (₹/month)', type: 'number', half: true },
        { key: 'whatsapp_number', label: 'WhatsApp (e.g. 919800000000)', type: 'text', required: true, half: true },
        { key: 'status', label: 'Status', type: 'select', options: opt(['active', 'draft', 'closed']), required: true, half: true },
        { key: 'sponsored', label: 'Sponsored', type: 'checkbox', help: 'Pin as sponsored' },
        { key: 'walk_in', label: 'Walk-in interview', type: 'checkbox', help: 'Show in the Walk-ins section' },
        { key: 'walkin_date', label: 'Walk-in date', type: 'date', half: true },
        { key: 'walkin_time', label: 'Walk-in time (e.g. 10 AM - 4 PM)', type: 'text', half: true },
        { key: 'walkin_venue', label: 'Walk-in venue (full address)', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ]}
      defaults={() => ({ job_type: 'full_time', zone: 'western_suburbs', status: 'active', sponsored: false, posted_at: new Date().toISOString() })}
      columns={[
        { key: 'title', label: 'Title', render: (j) => <span className="font-medium">{j.title}</span> },
        { key: 'company', label: 'Company' },
        { key: 'zone', label: 'Zone', render: (j) => zoneName(j.zone) },
        { key: 'status', label: 'Status', render: (j) => <Badge tone={j.status === 'active' ? 'good' : 'muted'}>{j.status}</Badge> },
        { key: 'sponsored', label: '', render: (j) => (j.sponsored ? <Badge tone="warn">Sponsored</Badge> : null) },
      ]}
    />
  );
}

export function AlertsPage() {
  return (
    <ResourcePage<CityAlert & Record<string, unknown>>
      table="alerts"
      title="City alerts"
      description="Waterlogging, train disruption, traffic and civic alerts shown at the top of the app."
      fields={[
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'body', label: 'Details', type: 'textarea' },
        { key: 'severity', label: 'Severity', type: 'select', options: opt(['info', 'warning', 'critical']), required: true, half: true },
        { key: 'kind', label: 'Kind', type: 'select', options: opt(['waterlogging', 'traffic', 'train', 'weather', 'civic', 'other']), required: true, half: true },
        { key: 'zones', label: 'Zones (none = all)', type: 'multiselect', options: zoneOpts },
        { key: 'starts_at', label: 'Starts (IST)', type: 'datetime', required: true, half: true },
        { key: 'ends_at', label: 'Ends (IST)', type: 'datetime', half: true },
        { key: 'active', label: 'Active', type: 'checkbox', help: 'Show in app' },
      ]}
      defaults={() => ({ severity: 'info', kind: 'traffic', zones: [], starts_at: new Date().toISOString(), active: true })}
      columns={[
        { key: 'title', label: 'Title', render: (a) => <span className="font-medium">{a.title}</span> },
        { key: 'severity', label: 'Severity', render: (a) => <Badge tone={a.severity === 'critical' ? 'bad' : a.severity === 'warning' ? 'warn' : 'muted'}>{a.severity}</Badge> },
        { key: 'kind', label: 'Kind' },
        { key: 'active', label: 'Active', render: (a) => (a.active ? <Badge tone="good">on</Badge> : <Badge>off</Badge>) },
      ]}
    />
  );
}

export function SchedulePage() {
  return (
    <ResourcePage<RadioShow & Record<string, unknown>>
      table="radio_schedule"
      title="Radio schedule"
      description="Mumbaa Radio shows in IST. Hindi and Marathi programs; a show can run past midnight."
      listOptions={{ order: { column: 'sort_order' } }}
      fields={[
        { key: 'title', label: 'Show', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'rj_name', label: 'RJ', type: 'text', half: true, placeholder: 'RJ Aai' },
        { key: 'language', label: 'Language', type: 'select', options: [{ value: 'hi', label: 'Hindi' }, { value: 'mr', label: 'Marathi' }, { value: 'mixed', label: 'Hindi + Marathi' }, { value: 'en', label: 'English' }], required: true, half: true },
        { key: 'start_time', label: 'Start (IST)', type: 'time', required: true, half: true },
        { key: 'end_time', label: 'End (IST)', type: 'time', required: true, half: true },
        { key: 'days', label: 'Days (none = daily)', type: 'multiselect', options: days },
        { key: 'sort_order', label: 'Order', type: 'number', half: true },
      ]}
      beforeSave={(d) => ({ ...d, days: ((d.days as unknown as string[]) ?? []).map(Number) })}
      defaults={() => ({ language: 'mixed', days: [], start_time: '20:00', end_time: '22:00' })}
      columns={[
        { key: 'start_time', label: 'Time', render: (s) => `${s.start_time}–${s.end_time}` },
        { key: 'title', label: 'Show', render: (s) => <span className="font-medium">{s.title}</span> },
        { key: 'rj_name', label: 'RJ', render: (s) => s.rj_name ?? 'Auto' },
        { key: 'language', label: 'Lang', render: (s) => ({ hi: 'Hindi', mr: 'Marathi', mixed: 'Hindi + Marathi', en: 'English' })[s.language] },
      ]}
    />
  );
}

export function RjPage() {
  return (
    <ResourcePage<RjProfile & Record<string, unknown>>
      table="rj_profiles"
      title="RJs"
      fields={[
        { key: 'name', label: 'Name', type: 'text', required: true, half: true },
        { key: 'instagram', label: 'Instagram', type: 'text', half: true },
        { key: 'bio', label: 'Bio', type: 'textarea' },
        { key: 'photo_url', label: 'Photo', type: 'image' },
        { key: 'languages', label: 'Languages', type: 'multiselect', options: [{ value: 'hi', label: 'Hindi' }, { value: 'mr', label: 'Marathi' }, { value: 'en', label: 'English' }] },
        { key: 'active', label: 'Active', type: 'checkbox', help: 'Show in app' },
      ]}
      defaults={() => ({ languages: ['hi', 'mr'], active: true })}
      columns={[
        { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'languages', label: 'Languages', render: (r) => (r.languages ?? []).join(', ') },
        { key: 'active', label: 'Active', render: (r) => (r.active ? <Badge tone="good">on</Badge> : <Badge>off</Badge>) },
      ]}
    />
  );
}

export function ReportsPage() {
  return (
    <ResourcePage<ListenerReport & Record<string, unknown>>
      table="listener_reports"
      title="Listener reports"
      description="Traffic and train tips from listeners. Approve the ones the RJ should read on air."
      listOptions={{ order: { column: 'created_at', ascending: false } }}
      fields={[
        { key: 'status', label: 'Status', type: 'select', options: opt(['pending', 'approved', 'rejected']), required: true, half: true },
        { key: 'kind', label: 'Kind', type: 'select', options: opt(['traffic', 'train', 'waterlogging', 'other']), required: true, half: true },
        { key: 'zone', label: 'Zone', type: 'select', options: zoneOpts, required: true, half: true },
        { key: 'location', label: 'Location', type: 'text', required: true, half: true },
        { key: 'message', label: 'Message', type: 'textarea', required: true },
      ]}
      defaults={() => ({ status: 'approved', kind: 'traffic', zone: 'western_suburbs' })}
      columns={[
        { key: 'location', label: 'Where', render: (r) => <span className="font-medium">{r.location}</span> },
        { key: 'message', label: 'Message', className: 'max-w-sm' },
        { key: 'kind', label: 'Kind' },
        { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'good' : r.status === 'pending' ? 'warn' : 'bad'}>{r.status}</Badge> },
      ]}
    />
  );
}

export function BusinessPage() {
  return (
    <ResourcePage<BusinessListing & Record<string, unknown>>
      table="business_listings"
      title="Business Connect"
      description="Listings for the Mumbaa Business show. Check every listing before approving (no fees-for-funding, real founder, working WhatsApp). Tick Featured to have the RJ read it on air."
      listOptions={{ order: { column: 'created_at', ascending: false } }}
      searchKeys={['name', 'founder', 'sector']}
      fields={[
        { key: 'status', label: 'Status', type: 'select', options: opt(['pending', 'approved', 'rejected']), required: true, half: true },
        { key: 'featured_on_air', label: 'On air', type: 'checkbox', help: 'Featured on air' },
        { key: 'intent', label: 'Intent', type: 'select', options: opt(['seeking', 'offering']), required: true, half: true },
        { key: 'role', label: 'Role', type: 'select', options: opt(BIZ_ROLES), required: true, half: true },
        { key: 'name', label: 'Startup / name', type: 'text', required: true, half: true },
        { key: 'founder', label: 'Founder', type: 'text', required: true, half: true },
        { key: 'sector', label: 'Sector', type: 'text', required: true, half: true },
        { key: 'stage', label: 'Stage', type: 'select', options: opt(BIZ_STAGES), half: true },
        { key: 'zone', label: 'Zone', type: 'select', options: zoneOpts, half: true },
        { key: 'ask', label: 'Ask', type: 'text', half: true },
        { key: 'pitch', label: 'Pitch', type: 'textarea', required: true },
        { key: 'whatsapp', label: 'WhatsApp (digits)', type: 'text', required: true, half: true },
        { key: 'website', label: 'Website', type: 'text', half: true },
      ]}
      defaults={() => ({ status: 'approved', intent: 'seeking', role: 'investor', featured_on_air: false })}
      columns={[
        { key: 'name', label: 'Listing', render: (l) => <span className="font-medium">{l.name}</span> },
        { key: 'role', label: 'Wants', render: (l) => `${l.intent} ${l.role}` },
        { key: 'sector', label: 'Sector' },
        { key: 'status', label: 'Status', render: (l) => <Badge tone={l.status === 'approved' ? 'good' : l.status === 'pending' ? 'warn' : 'bad'}>{l.status}</Badge> },
        { key: 'featured_on_air', label: '', render: (l) => (l.featured_on_air ? <Badge tone="accent">On air</Badge> : null) },
      ]}
    />
  );
}

export { db };

export interface StationPlatform { id: string; station: string; line: string; towards?: string | null; platform: string; note?: string | null }
const LINE_OPTS = [
  { value: 'western', label: 'Western' },
  { value: 'central', label: 'Central' },
  { value: 'harbour', label: 'Harbour' },
  { value: 'trans_harbour', label: 'Trans-Harbour' },
];

export function PlatformsPage() {
  return (
    <ResourcePage<StationPlatform & Record<string, unknown>>
      table="station_platforms"
      title="Train platforms"
      description="Usual boarding platforms for local trains. Ask Aai and the Local & Metro planner show these. Only add what you are sure of; everything else says to check the indicator board."
      searchKeys={['station', 'line']}
      fields={[
        { key: 'station', label: 'Station (spelled as in the app, e.g. Dadar)', type: 'text', required: true, half: true },
        { key: 'line', label: 'Line', type: 'select', options: LINE_OPTS, required: true, half: true },
        { key: 'towards', label: 'Direction (optional, e.g. Churchgate, Kalyan, Panvel)', type: 'text', half: true },
        { key: 'platform', label: 'Platform', type: 'text', required: true, half: true, placeholder: '1 or 2' },
        { key: 'note', label: 'Note (optional)', type: 'text' },
      ]}
      defaults={() => ({ line: 'western' })}
      columns={[
        { key: 'station', label: 'Station', render: (r) => <span className="font-medium">{r.station}</span> },
        { key: 'line', label: 'Line', render: (r) => LINE_OPTS.find((o) => o.value === r.line)?.label ?? r.line },
        { key: 'towards', label: 'Direction', render: (r) => r.towards || 'Any' },
        { key: 'platform', label: 'Platform' },
      ]}
    />
  );
}
