import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, MessageCircle, BadgeCheck } from 'lucide-react';
import { JOB_TYPES, ZONES, type Job, type JobType, type ZoneId } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { useZone } from '../lib/zone';
import { useTable } from '../lib/content';
import { Page } from '../components/motion';
import { Chip, SampleBadge, Skeleton, inputCls } from '../components/ui';
import { AdSlot } from '../components/AdSlot';

// Standard roles always offered in the Job role filter (listing titles are added on top).
const JOB_ROLES = [
  'Sales Executive', 'Sales Manager', 'Business Development Executive', 'Business Development Manager (BDM)', 'Relationship Manager', 'Telecaller', 'Customer Support Executive', 'Field Sales Executive', 'Marketing Executive', 'Digital Marketing Executive', 'Social Media Manager', 'Content Writer',
  'Full-stack Developer', 'Frontend Developer', 'Backend Developer', 'Mobile App Developer', 'Software Engineer', 'Data Analyst', 'UI/UX Designer', 'Graphic Designer', 'IT Support Engineer', 'QA Tester',
  'Accountant', 'Accounts Executive', 'HR Executive', 'HR Manager', 'Recruiter', 'Office Administrator', 'Receptionist', 'Data Entry Operator', 'Back Office Executive', 'Operations Executive', 'Store Manager', 'Retail Sales Associate',
  'Delivery Executive', 'Driver', 'Security Guard', 'Housekeeping', 'Cook / Chef', 'Waiter / Steward', 'Electrician', 'Plumber', 'Technician', 'Warehouse Associate', 'Nurse', 'Pharmacist', 'Teacher / Tutor', 'Beautician',
];

const SALARY_STEPS = [0, 10000, 15000, 20000, 25000, 30000];

/** A listing matches a role if its title contains the role name (or its short form, e.g. BDM). */
function roleMatch(title: string, role: string) {
  const t = title.toLowerCase();
  return role
    .toLowerCase()
    .split(/\s*[/()]\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 2)
    .some((x) => t.includes(x));
}

export function waLink(job: Job, text: string) {
  const num = job.whatsapp_number?.replace(/\D/g, '');
  // Sample jobs have no number: wa.me/?text= opens WhatsApp's contact picker with the text ready.
  return `https://wa.me/${num || ''}?text=${encodeURIComponent(text)}`;
}

export default function Jobs() {
  const { t, f, locale } = useI18n();
  const { zone: myZone } = useZone();
  const { rows, loading } = useTable<Job>('jobs', { eq: { status: 'active' }, order: { column: 'posted_at', ascending: false } });
  const [zone, setZone] = useState<ZoneId | 'all'>(myZone);
  const [type, setType] = useState<JobType | 'all'>('all');
  const [role, setRole] = useState('all');
  const roles = useMemo(() => {
    const extra = (rows ?? []).map((j) => j.title.trim()).filter((t) => !JOB_ROLES.some((r) => roleMatch(t, r)));
    return [...JOB_ROLES, ...Array.from(new Set(extra))].sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const [minSalary, setMinSalary] = useState(0);
  const money = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), [locale]);
  const date = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale]);

  const list = (rows ?? []).filter(
    (j) =>
      (role === 'all' || roleMatch(j.title, role)) &&
      (zone === 'all' || j.zone === zone) &&
      (type === 'all' || j.job_type === type) &&
      (minSalary === 0 || (j.salary_max_inr ?? j.salary_min_inr ?? 0) >= minSalary),
  );
  const sorted = [...list].sort((a, b) => Number(b.sponsored) - Number(a.sponsored));
  const reset = () => {
    setRole('all');
    setZone('all');
    setType('all');
    setMinSalary(0);
  };

  return (
    <Page>
      <div className="flex items-end justify-between gap-3 pb-5 pt-6 md:pt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{t.jobs.title}</h1>
        <span className="tnum pb-1 text-sm text-muted">{f(t.jobs.count, { n: sorted.length })}</span>
      </div>

      <section className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t.jobs.filters}>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t.jobs.role}</span>
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">{t.common.any}</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t.jobs.zone}</span>
          <select className={inputCls} value={zone} onChange={(e) => setZone(e.target.value as ZoneId | 'all')}>
            <option value="all">{t.common.any}</option>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {t.zones[z.id]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t.jobs.type}</span>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as JobType | 'all')}>
            <option value="all">{t.common.any}</option>
            {JOB_TYPES.map((jt) => (
              <option key={jt} value={jt}>
                {t.jobs.types[jt]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t.jobs.salary}</span>
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {SALARY_STEPS.map((s) => (
              <Chip key={s} active={minSalary === s} onClick={() => setMinSalary(s)}>
                {s === 0 ? t.common.any : `${s / 1000}k+`}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <AdSlot placement="jobs_sponsored" className="mb-4" />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted">{t.jobs.none}</p>
          <button onClick={reset} className="mt-3 font-semibold text-marigold-ink">
            {t.jobs.reset}
          </button>
        </div>
      ) : (
        <motion.ul layout className="grid gap-3 md:grid-cols-2">
          <AnimatePresence>
            {sorted.map((j, i) => (
              <motion.li
                layout
                key={j.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`card flex flex-col p-4 ${j.sponsored ? 'ring-1 ring-marigold/50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold leading-snug text-ink">{j.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft">
                      {j.company} {j.sponsored && <BadgeCheck size={14} className="text-marigold-ink" />}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {j.sponsored && <span className="text-[10px] font-semibold uppercase tracking-wider text-marigold-ink">{t.common.sponsored}</span>}
                    {j.sample && <SampleBadge />}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} /> {j.locality ? `${j.locality}, ` : ''}
                    {t.zones[j.zone]}
                  </span>
                  <span>· {t.jobs.types[j.job_type]}</span>
                  <span>
                    · {t.jobs.posted} {date.format(new Date(j.posted_at))}
                  </span>
                </div>
                <p className="tnum mt-2 font-semibold text-ink">
                  {j.salary_min_inr || j.salary_max_inr ? (
                    <>
                      {money.format(j.salary_min_inr ?? j.salary_max_inr!)}
                      {j.salary_max_inr && j.salary_min_inr && j.salary_max_inr !== j.salary_min_inr ? ` – ${money.format(j.salary_max_inr)}` : ''}
                      <span className="font-normal text-muted">{t.jobs.perMonth}</span>
                    </>
                  ) : (
                    <span className="font-normal text-muted">{t.jobs.salaryNotShown}</span>
                  )}
                </p>
                {j.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{j.description}</p>}
                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={waLink(j, f(t.jobs.waText, { title: j.title }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F8F4E] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <MessageCircle size={16} /> {t.jobs.apply}
                </motion.a>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
      <Link to="/business" className="card mt-6 flex items-center justify-between gap-3 bg-accent-soft p-4">
        <span>
          <span className="eyebrow">{t.business.eyebrow}</span>
          <span className="block font-semibold text-ink">{t.business.title}</span>
          <span className="block text-sm text-muted">{t.business.hint}</span>
        </span>
        <span className="text-2xl text-marigold-ink">→</span>
      </Link>
    </Page>
  );
}
