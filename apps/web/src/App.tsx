import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { currentAndNext, type RadioShow } from '@mumbaaai/shared';
import { I18nProvider } from './lib/i18n';
import { ThemeProvider } from './lib/theme';
import { ZoneProvider } from './lib/zone';
import { RadioProvider } from './lib/radio';
import { useTable } from './lib/content';
import { Shell } from './components/Shell';
import Home from './pages/Home';

const Travel = lazy(() => import('./pages/Travel'));
const Radio = lazy(() => import('./pages/Radio'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Ask = lazy(() => import('./pages/Ask'));
const Business = lazy(() => import('./pages/Business'));
const Paper = lazy(() => import('./pages/Paper'));

function Routed() {
  const location = useLocation();
  return (
    <Shell>
      <Suspense fallback={<div className="h-[60vh]" />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/train" element={<Travel />} />
            <Route path="/travel" element={<Navigate to="/train" replace />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/business" element={<Business />} />
            <Route path="/paper" element={<Paper />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </Shell>
  );
}

function RadioWithSchedule({ children }: { children: React.ReactNode }) {
  const { rows } = useTable<RadioShow>('radio_schedule');
  return <RadioProvider showTitle={currentAndNext(rows ?? []).current?.title}>{children}</RadioProvider>;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <I18nProvider>
          <ZoneProvider>
            <RadioWithSchedule>
              <HashRouter>
                <Routed />
              </HashRouter>
            </RadioWithSchedule>
          </ZoneProvider>
        </I18nProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
