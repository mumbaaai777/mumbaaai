import { ArrowUpRight, Pin } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAsync } from '../lib/useAsync';
import { getNews } from '../lib/api';
import { SectionTitle, Skeleton, SampleBadge } from './ui';
import { AdSlot } from './AdSlot';

function ago(iso: string | null | undefined, locale: string) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (mins < 60) return rtf.format(-Math.max(1, mins), 'minute');
  if (mins < 1440) return rtf.format(-Math.round(mins / 60), 'hour');
  return rtf.format(-Math.round(mins / 1440), 'day');
}

export function NewsList({ limit = 8 }: { limit?: number }) {
  const { t, locale } = useI18n();
  const { data, loading } = useAsync(() => getNews(limit), [limit]);
  return (
    <section>
      <SectionTitle title={t.news.title} right={data && !data.live ? <SampleBadge /> : undefined} />
      {loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {data!.items.map((n, i) => (
            <div key={n.id}>
              <a href={n.link} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/60">
                <span className="tnum mt-0.5 w-5 shrink-0 text-xs font-semibold text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-snug text-ink group-hover:underline group-hover:decoration-marigold group-hover:underline-offset-4">
                    {n.title}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted">
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 font-semibold text-marigold-ink">
                        <Pin size={11} /> {t.news.pinned}
                      </span>
                    )}
                    <span>{n.source}</span>
                    {n.published_at && <span>· {ago(n.published_at, locale)}</span>}
                  </span>
                </span>
                <ArrowUpRight size={16} className="mt-1 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
              {i === 3 && <AdSlot placement="feed_card" index={1} className="bg-bg/50 p-3" />}
            </div>
          ))}
        </div>
      )}
      {data && !data.live && <p className="mt-2 text-xs text-muted">{t.news.sampleNote}</p>}
    </section>
  );
}
