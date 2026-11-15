import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pause, Play, Loader2 } from 'lucide-react';
import { currentAndNext, type RadioShow } from '@mumbaaai/shared';
import { useRadio } from '../lib/radio';
import { useI18n } from '../lib/i18n';
import { useTable } from '../lib/content';
import { asset } from '../lib/env';
import { spring } from './motion';

export function MiniPlayer() {
  const { status, toggle, isTest } = useRadio();
  const { t } = useI18n();
  const { rows } = useTable<RadioShow>('radio_schedule');
  const { current } = currentAndNext(rows ?? []);
  const playing = status === 'playing';
  return (
    <section className="card flex items-center gap-4 bg-navy p-3 pr-4 text-offwhite dark:bg-surface-2" aria-label={t.radio.title}>
      <Link to="/radio" className="flex min-w-0 flex-1 items-center gap-3">
        <motion.img
          src={asset('assets/radio-disc.png')}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full ring-2 ring-marigold/60"
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={playing ? { repeat: Infinity, duration: 12, ease: 'linear' } : { duration: 0.4 }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-[#C42A37] px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              {t.common.live}
            </span>
            {isTest && <span className="text-[10px] font-semibold uppercase tracking-wider text-marigold">{t.radio.testStream}</span>}
          </div>
          <p className="mt-1 truncate font-semibold">{current?.title ?? t.radio.title}</p>
          <p className="truncate text-xs text-offwhite/70">
            {current?.rj_name ? `${t.radio.with} ${current.rj_name}` : t.radio.tagline}
          </p>
        </div>
      </Link>
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={spring}
        onClick={toggle}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marigold text-navy shadow-lg"
        aria-label={playing ? t.radio.pause : t.radio.play}
      >
        {status === 'connecting' ? <Loader2 size={20} className="animate-spin" /> : playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </motion.button>
    </section>
  );
}
