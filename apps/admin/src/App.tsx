import { useState } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { LayoutDashboard, Heart, Megaphone, Briefcase, TriangleAlert, Radio, Mic2, MessageSquareWarning, Handshake, LogOut, ExternalLink, Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth, DEMO_EMAIL, DEMO_PASSWORD } from './lib/auth';
import { asset, isDemo, webUrl } from './lib/data';
import { Btn, inputCls } from './components/Resource';
import Dashboard from './pages/Dashboard';
import Dedications from './pages/Dedications';
import { BusinessPage, AdsPage, JobsPage, AlertsPage, SchedulePage, RjPage, ReportsPage } from './pages/Resources';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dedications', label: 'Dedications', icon: Heart },
  { to: '/schedule', label: 'Radio schedule', icon: Radio },
  { to: '/rjs', label: 'RJs', icon: Mic2 },
  { to: '/business', label: 'Business Connect', icon: Handshake },
  { to: '/ads', label: 'Ads', icon: Megaphone },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/alerts', label: 'City alerts', icon: TriangleAlert },
  { to: '/reports', label: 'Listener reports', icon: MessageSquareWarning },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  return (
    <button
      className="rounded-md p-2 text-muted hover:text-ink"
      aria-label="Toggle theme"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('mumbaaai.theme', next ? 'dark' : 'light');
      }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(isDemo ? DEMO_EMAIL : '');
  const [pw, setPw] = useState(isDemo ? DEMO_PASSWORD : '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <form
        className="card w-full max-w-sm space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(await signIn(email, pw));
          setBusy(false);
        }}
      >
        <img src={asset('assets/logo-primary.png')} alt="MumbaAai" className="h-10 dark:hidden" />
        <img src={asset('assets/logo-dark.png')} alt="MumbaAai" className="hidden h-10 dark:block" />
        <h1 className="text-xl font-semibold text-ink">Admin sign in</h1>
        {isDemo && <p className="rounded-lg bg-accent-soft p-3 text-xs text-marigold-ink">Demo mode: data is stored in this browser only. Connect Supabase for the shared admin.</p>}
        <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <input className={inputCls} type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        {err && <p className="text-sm text-live-ink">{err}</p>}
        <Btn className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Btn>
      </form>
    </div>
  );
}

function Shell() {
  const { email, isAdmin, ready, signOut } = useAuth();
  if (!ready) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
  if (!email || !isAdmin) return <Login />;
  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <img src={asset('assets/logo-primary.png')} alt="MumbaAai" className="mb-6 ml-2 h-8 self-start dark:hidden" />
        <img src={asset('assets/logo-dark.png')} alt="MumbaAai" className="mb-6 ml-2 hidden h-8 self-start dark:block" />
        <nav className="grid gap-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-navy text-offwhite dark:bg-marigold dark:text-navy' : 'text-ink-soft hover:bg-surface-2'}`
              }
            >
              <n.icon size={16} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto grid gap-1 border-t border-line pt-3 text-sm">
          <a href={webUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink-soft hover:bg-surface-2">
            <ExternalLink size={15} /> Open app
          </a>
          <div className="flex items-center justify-between px-3">
            <span className="truncate text-xs text-muted">{email}</span>
            <ThemeToggle />
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink-soft hover:bg-surface-2">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-navy text-offwhite' : 'text-ink-soft'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          {isDemo && <p className="mb-4 rounded-lg border border-dashed border-marigold/60 bg-accent-soft px-3 py-2 text-xs text-marigold-ink">Demo mode: changes are saved in this browser and show in the app on this browser only.</p>}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dedications" element={<Dedications />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/rjs" element={<RjPage />} />
            <Route path="/business" element={<BusinessPage />} />
            <Route path="/ads" element={<AdsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AuthProvider>
  );
}
