import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets, Sun, Wind, Umbrella, Moon } from 'lucide-react';
import { zoneById } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { useZone } from '../lib/zone';
import { useAsync } from '../lib/useAsync';
import { aqiBand, codeKey, getAir, getWeather, type CodeKey } from '../lib/weather';
import { LiveDot, Skeleton } from './ui';

const ICONS: Record<CodeKey, typeof Sun> = { clear: Sun, partly: CloudSun, cloudy: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, heavyRain: CloudRain, thunder: CloudLightning };

export function WeatherCard() {
  const { t, locale } = useI18n();
  const { zone } = useZone();
  const z = zoneById(zone);
  const w = useAsync(() => getWeather(z), [zone]);
  const a = useAsync(() => getAir(z), [zone]);
  const nf = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);

  if (w.loading && !w.data) return <Skeleton className="h-64" />;
  if (w.error || !w.data)
    return (
      <div className="card p-5 text-sm text-muted">
        {t.weather.unavailable}{' '}
        <button className="font-semibold text-marigold-ink underline-offset-2 hover:underline" onClick={w.reload}>
          {t.common.retry}
        </button>
      </div>
    );
  const d = w.data;
  const key = codeKey(d.code);
  const hour = Number(d.time.slice(11, 13));
  const Icon = key === 'clear' && (hour < 6 || hour >= 19) ? Moon : ICONS[key];
  const band = a.data ? aqiBand(a.data.usAqi) : null;
  const maxTemp = Math.max(...d.hours.map((h) => h.temp));
  const minTemp = Math.min(...d.hours.map((h) => h.temp));

  return (
    <section className="card overflow-hidden" aria-label={t.weather.title}>
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <p className="eyebrow">{t.weather.title} · {t.zones[zone]}</p>
            <LiveDot label={t.common.live} />
          </div>
          <div className="flex items-end gap-3">
            <motion.span key={`${zone}-${d.temp}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="tnum text-6xl font-light leading-none tracking-tighter text-ink">
              {nf.format(d.temp)}°
            </motion.span>
            <div className="pb-1">
              <p className="font-medium text-ink">{t.weather.codes[key]}</p>
              <p className="text-sm text-muted">
                {t.weather.feelsLike} <span className="tnum">{nf.format(d.feelsLike)}°</span>
              </p>
            </div>
          </div>
        </div>
        <Icon size={44} strokeWidth={1.25} className="mt-1 shrink-0 text-marigold" aria-hidden />
      </div>

      <dl className="grid grid-cols-3 gap-px border-y border-line bg-line text-sm">
        {[
          { icon: Umbrella, label: t.weather.rainChance, value: `${nf.format(d.maxRainProb)}%` },
          { icon: Droplets, label: t.weather.humidity, value: `${nf.format(d.humidity)}%` },
          { icon: Wind, label: t.weather.wind, value: `${nf.format(d.wind)} km/h` },
        ].map(({ icon: I, label, value }) => (
          <div key={label} className="bg-surface px-4 py-3">
            <dt className="flex items-center gap-1.5 text-[11px] text-muted">
              <I size={12} /> {label}
            </dt>
            <dd className="tnum mt-0.5 font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="px-5 pt-4">
        <p className="eyebrow mb-2">{t.weather.next24}</p>
        <ol className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
          {d.hours.slice(0, 16).map((h, i) => {
            const k = codeKey(h.code);
            const HI = ICONS[k];
            const pct = maxTemp === minTemp ? 0.5 : (h.temp - minTemp) / (maxTemp - minTemp);
            return (
              <li key={h.time} className={`flex w-12 shrink-0 flex-col items-center gap-1.5 rounded-xl py-2 ${i === 0 ? 'bg-accent-soft' : ''}`}>
                <span className="tnum text-[11px] text-muted">{i === 0 ? t.common.now : h.time.slice(11, 16)}</span>
                <HI size={16} strokeWidth={1.6} className="text-ink-soft" />
                <span className="tnum text-sm font-semibold text-ink" style={{ transform: `translateY(${(1 - pct) * 6}px)` }}>
                  {nf.format(h.temp)}°
                </span>
                <span className="relative mt-1 h-8 w-1.5 overflow-hidden rounded-full bg-surface-2" title={`${t.weather.rainChance}: ${h.rainProb}%`}>
                  <span className="absolute inset-x-0 bottom-0 rounded-full bg-[#2E6F95]" style={{ height: `${Math.max(4, h.rainProb)}%` }} />
                </span>
                <span className="tnum text-[10px] text-muted">{h.rainProb}%</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{t.weather.aqi}</span>
          {a.data && band ? (
            <span className="inline-flex items-center gap-2">
              <span className="tnum rounded-md px-2 py-0.5 text-sm font-bold text-white" style={{ background: band.color }}>
                {nf.format(a.data.usAqi)}
              </span>
              <span className="text-sm font-medium text-ink">{t.weather[band.key]}</span>
            </span>
          ) : a.loading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <span className="text-sm text-muted">—</span>
          )}
        </div>
        {a.data && Number.isFinite(a.data.pm25) && (
          <span className="tnum text-xs text-muted">
            {t.weather.pm25} {a.data.pm25.toFixed(0)} µg/m³
          </span>
        )}
      </div>
      <p className="px-5 pb-3 text-[10.5px] text-muted">
        US AQI · {t.weather.source} · {t.common.updated} {d.time.slice(11, 16)} IST
      </p>
    </section>
  );
}
