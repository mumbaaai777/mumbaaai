import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, Loader2, Volume2, FlaskConical } from 'lucide-react';
import { brand, currentAndNext, isShowOnAir, sortSchedule, type RadioShow, type RjProfile } from '@mumbaaai/shared';
import { useRadio } from '../lib/radio';
import { useI18n } from '../lib/i18n';
import { useTable } from '../lib/content';
import { asset } from '../lib/env';
import { Page, Stagger, Item } from '../components/motion';
import { SectionTitle, SampleBadge } from '../components/ui';
import { AdSlot } from '../components/AdSlot';
import { DedicationForm, DedicationWall } from '../components/Dedications';

/** Bars from the Web Audio analyser when available; otherwise a gentle synthetic animation. */
function Visualiser() {
  const { readFrequencies, hasAnalyser, status } = useRadio();
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    const data = new Uint8Array(new ArrayBuffer(64));
    let raf = 0;
    const bars = 40;
    const draw = (time: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (w < 40 || h < 8) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (c.width !== w * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const live = readFrequencies(data);
      const gap = 3;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        let v: number;
        if (live) v = data[Math.floor((i / bars) * 48)] / 255;
        else if (status === 'playing' && !reduce) v = 0.25 + 0.22 * Math.sin(time / 380 + i * 0.55) * Math.sin(time / 910 + i * 0.21) + 0.1 * Math.sin(time / 170 + i);
        else v = 0.06;
        const bh = Math.max(3, Math.abs(v) * h);
        g.fillStyle = i % 7 === 3 ? brand.live : brand.marigold;
        g.globalAlpha = 0.55 + 0.45 * Math.min(1, Math.abs(v) * 1.4);
        const x = i * (bw + gap);
        g.beginPath();
        g.roundRect(x, (h - bh) / 2, bw, bh, Math.max(0, Math.min(bw, bh) / 2));
        g.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [readFrequencies, status, reduce]);
  return <canvas ref={canvas} className="h-16 w-full" aria-hidden data-analyser={hasAnalyser ? 'live' : 'fallback'} />;
}

export default function Radio() {
  const { t } = useI18n();
  const { status, toggle, volume, setVolume, isTest } = useRadio();
  const { rows: shows } = useTable<RadioShow>('radio_schedule');
  const { rows: rjs } = useTable<RjProfile>('rj_profiles', { eq: { active: true } });
  const { current, next } = currentAndNext(shows ?? []);
  const playing = status === 'playing';
  const reduce = useReducedMotion();

  return (
    <Page>
      <Stagger className="grid gap-5 pt-6 md:grid-cols-[1.1fr_1fr] md:pt-10">
        <Item>
          <section className="card overflow-hidden bg-navy text-offwhite dark:bg-surface">
            <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
              <div className="mb-5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded bg-[#C42A37] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  <span className={`h-1.5 w-1.5 rounded-full bg-white ${playing ? 'animate-pulse' : ''}`} />
                  {t.common.live}
                </span>
                {isTest && (
                  <span className="inline-flex items-center gap-1 rounded border border-marigold/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-marigold">
                    <FlaskConical size={11} /> {t.radio.testStream}
                  </span>
                )}
              </div>
              <div className="relative">
                <motion.div
                  className="absolute -inset-3 rounded-full border border-marigold/30"
                  animate={playing && !reduce ? { scale: [1, 1.06, 1], opacity: [0.6, 0.15, 0.6] } : { scale: 1, opacity: 0.4 }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                />
                <motion.img
                  src={asset('assets/radio-disc.png')}
                  alt={t.radio.title}
                  className="relative h-48 w-48 rounded-full shadow-2xl ring-4 ring-white/10 sm:h-56 sm:w-56"
                  animate={playing && !reduce ? { rotate: 360 } : { rotate: 0 }}
                  transition={playing ? { repeat: Infinity, duration: 14, ease: 'linear' } : { type: 'spring', stiffness: 80 }}
                />
              </div>
              <p className="eyebrow mt-6 !text-offwhite/60">{t.radio.nowPlaying}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{current?.title ?? t.radio.title}</h1>
              <p className="mt-1 text-sm text-offwhite/70">{current?.rj_name ? `${t.radio.with} ${current.rj_name}` : t.radio.tagline}</p>

              <div className="mt-5 w-full max-w-sm">
                <Visualiser />
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={toggle}
                className="mt-4 grid h-[72px] w-[72px] place-items-center rounded-full bg-marigold text-navy shadow-[0_10px_30px_-8px_rgba(244,163,0,0.7)]"
                aria-label={playing ? t.radio.pause : t.radio.play}
              >
                {status === 'connecting' ? <Loader2 size={28} className="animate-spin" /> : playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </motion.button>
              <p className="mt-3 h-5 text-sm text-offwhite/70" aria-live="polite">
                {status === 'connecting' ? t.radio.connecting : status === 'error' ? t.radio.streamError : ''}
              </p>

              <label className="mt-2 flex w-full max-w-xs items-center gap-3 text-offwhite/70">
                <Volume2 size={16} />
                <span className="sr-only">{t.radio.volume}</span>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-[#F4A300]" />
              </label>
              {isTest && <p className="mt-4 max-w-sm text-xs text-offwhite/55">{t.radio.testStreamNote}</p>}
            </div>
            {next && (
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-sm">
                <span className="text-offwhite/60">{t.radio.upNext}</span>
                <span className="font-medium">
                  {next.start_time} · {next.title}
                </span>
              </div>
            )}
          </section>
          <AdSlot placement="radio_preroll_audio" className="mt-4" />
          <div className="mt-5 grid gap-5">
            <DedicationForm shows={sortSchedule(shows ?? [])} />
            <DedicationWall />
          </div>
        </Item>

        <Item>
          <section className="card p-5">
            <SectionTitle title={t.radio.schedule} right={shows?.some((s) => s.sample) ? <SampleBadge /> : undefined} />
            <ol className="relative">
              {sortSchedule(shows ?? []).map((s) => {
                const on = isShowOnAir(s);
                return (
                  <li key={s.id} className={`relative flex gap-4 rounded-xl px-3 py-3 ${on ? 'bg-accent-soft' : ''}`}>
                    {on && <motion.span layoutId="onair" className="absolute inset-y-2 left-0 w-[3px] rounded bg-marigold" />}
                    <span className="tnum w-12 shrink-0 pt-0.5 text-sm font-semibold text-muted">{s.start_time}</span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        {s.title}
                        {s.language !== 'mixed' && <span className="rounded border border-line-strong px-1 py-px text-[9px] font-bold uppercase tracking-wider text-muted">{s.language === 'mr' ? 'मराठी' : s.language === 'hi' ? 'हिन्दी' : 'EN'}</span>}
                        {s.language === 'mixed' && <span className="rounded border border-line-strong px-1 py-px text-[9px] font-bold uppercase tracking-wider text-muted">हिं · म</span>}
                        {on && <span className="rounded bg-[#C42A37] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white">{t.common.live}</span>}
                      </p>
                      <p className="text-sm text-muted">
                        {s.rj_name ? `${s.rj_name} · ` : ''}
                        {s.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
          {rjs && rjs.length > 0 && (
            <section className="mt-5 grid grid-cols-2 gap-3">
              {rjs.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-navy text-sm font-bold text-marigold dark:bg-surface-2">
                    {r.photo_url ? <img src={r.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : r.name.replace('RJ ', '').slice(0, 1)}
                  </div>
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="mt-0.5 line-clamp-3 text-xs text-muted">{r.bio}</p>
                </div>
              ))}
            </section>
          )}
        </Item>
      </Stagger>
    </Page>
  );
}
