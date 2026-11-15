// Ad renderer shared by the web app (live slots) and admin (preview), so the preview is pixel-identical.
import type { Ad } from '../types';

const CATEGORY_TINT: Record<string, string> = {
  real_estate: '#2E6F95',
  retail: '#B23A48',
  education: '#5C946E',
  food: '#E07A5F',
  jobs: '#0B2545',
  healthcare: '#3A8D8B',
  auto: '#5B6675',
  events: '#8D6A9F',
  other: '#C98500',
};

export interface AdCardProps {
  ad: Pick<Ad, 'advertiser' | 'title' | 'body' | 'cta' | 'image_url' | 'category' | 'placement'>;
  label: string; // localized "Sponsored"
  onClick?: () => void;
  variant?: 'banner' | 'card';
}

export function AdCard({ ad, label, onClick, variant = 'card' }: AdCardProps) {
  const tint = CATEGORY_TINT[ad.category] ?? CATEGORY_TINT.other;
  const banner = variant === 'banner';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full overflow-hidden text-left card transition-transform active:scale-[0.99]"
      aria-label={`${label}: ${ad.title} — ${ad.advertiser}`}
    >
      <div className={banner ? 'flex min-h-[132px] items-stretch' : 'flex flex-col'}>
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt=""
            loading="lazy"
            className={banner ? 'w-32 shrink-0 object-cover sm:w-44' : 'aspect-[16/7] w-full object-cover'}
          />
        ) : (
          <div
            aria-hidden
            className={banner ? 'w-2 shrink-0' : 'h-1.5 w-full'}
            style={{ background: tint }}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {label}
            </span>
            <span className="truncate text-xs text-muted">{ad.advertiser}</span>
          </div>
          <p className="text-[15px] font-semibold leading-snug text-ink">{ad.title}</p>
          {ad.body ? <p className="line-clamp-2 text-sm text-muted">{ad.body}</p> : null}
          {ad.cta ? (
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-marigold-ink">
              {ad.cta}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
