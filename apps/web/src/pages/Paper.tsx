// Mumbaa Aai News: the daily e-paper. Every item renders with the layout the editor chose in admin.
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { AdPlacement, Lang, PaperArticle, PaperLangText } from '@mumbaaai/shared';
import { useI18n } from '../lib/i18n';
import { useTable } from '../lib/content';
import { Page } from '../components/motion';
import { SampleBadge, Skeleton } from '../components/ui';
import { AdSlot } from '../components/AdSlot';

const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const shift = (d: string, n: number) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const pick = (v: PaperLangText | null | undefined, lang: Lang) => (v ? v[lang]?.trim() || v.en?.trim() || v.hi?.trim() || v.mr?.trim() || '' : '');
const serif = { fontFamily: '"Noto Serif Devanagari", "Noto Serif", Georgia, "Times New Roman", serif' };

function Body({ text, open }: { text: string; open: boolean }) {
  const paras = text.split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
      {(open ? paras : paras.slice(0, 1)).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}

function Story({ a, lang }: { a: PaperArticle; lang: Lang }) {
  const { t } = useI18n();
  const p = t.paper;
  const [open, setOpen] = useState(false);
  const head = pick(a.headline, lang);
  const intro = pick(a.standfirst, lang);
  const body = pick(a.body, lang);
  const hasMore = body.split(/\n\s*\n/).filter(Boolean).length > 1;
  const meta = (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="font-semibold uppercase tracking-wider text-marigold-ink">{(p.sections as Record<string, string>)[a.section] ?? a.section}</span>
      {a.byline && <span>· {a.byline}</span>}
      {a.source_url && (
        <a href={a.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
          {p.source}: {a.source_name ?? new URL(a.source_url).hostname} <ExternalLink size={11} />
        </a>
      )}
      {a.sample && <SampleBadge />}
    </p>
  );
  const more = hasMore && (
    <button onClick={() => setOpen((o) => !o)} className="mt-2 text-sm font-semibold text-marigold-ink underline">
      {open ? p.less : p.more}
    </button>
  );
  const img = a.image_url && (
    <figure>
      <img src={a.image_url} alt={a.image_caption ?? ''} className={`w-full rounded-lg object-cover ${a.layout === 'lead' ? 'max-h-[420px]' : 'max-h-72'}`} loading="lazy" />
      {a.image_caption && <figcaption className="mt-1 text-xs italic text-muted">{a.image_caption}</figcaption>}
    </figure>
  );

  if (a.layout === 'lead')
    return (
      <article className="col-span-full border-b-2 border-ink/80 pb-6">
        <h2 style={serif} className="text-3xl font-bold leading-tight text-ink sm:text-[42px]">{head}</h2>
        {intro && <p className="mt-3 text-lg text-ink-soft">{intro}</p>}
        {meta}
        <div className={`mt-4 grid gap-5 ${a.image_url ? 'md:grid-cols-[3fr_2fr]' : ''}`}>
          {img}
          <div>{body && <Body text={body} open={open} />}{more}</div>
        </div>
      </article>
    );
  if (a.layout === 'photo')
    return (
      <article className="border-b border-line pb-5 md:col-span-2">
        {img}
        <h3 style={serif} className="mt-3 text-2xl font-bold leading-snug text-ink">{head}</h3>
        {intro && <p className="mt-1 text-ink-soft">{intro}</p>}
        {meta}
        {body && <div className="mt-3"><Body text={body} open={open} /></div>}
        {more}
      </article>
    );
  if (a.layout === 'opinion')
    return (
      <article className="border-b border-line pb-5">
        <p className="eyebrow">{p.opinion}</p>
        <h3 style={serif} className="mt-1 text-xl font-bold italic leading-snug text-ink">{head}</h3>
        {a.byline && <p className="mt-1 text-sm font-semibold text-ink">{a.byline}</p>}
        {intro && <p className="mt-2 italic text-ink-soft">{intro}</p>}
        {body && <div className="mt-3 italic"><Body text={body} open={open} /></div>}
        {more}
      </article>
    );
  // standard
  return (
    <article className="border-b border-line pb-5">
      {img && <div className="mb-3">{img}</div>}
      <h3 style={serif} className="text-xl font-bold leading-snug text-ink">{head}</h3>
      {intro && <p className="mt-1 text-ink-soft">{intro}</p>}
      {meta}
      {body && <div className="mt-3"><Body text={body} open={open} /></div>}
      {more}
    </article>
  );
}

function Briefs({ items, lang }: { items: PaperArticle[]; lang: Lang }) {
  const { t } = useI18n();
  return (
    <aside className="rounded-xl border-2 border-ink/80 p-4">
      <p style={serif} className="mb-2 border-b border-ink/30 pb-2 text-lg font-bold text-ink">{t.paper.briefs}</p>
      <ul className="space-y-2.5">
        {items.map((b) => (
          <li key={b.id} className="flex gap-2 text-[15px] leading-snug text-ink">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold" />
            <span>
              {pick(b.headline, lang)}
              {b.source_url && (
                <a href={b.source_url} target="_blank" rel="noreferrer" className="ml-1 whitespace-nowrap text-xs text-muted underline">
                  {b.source_name ?? t.paper.source}
                </a>
              )}
              {b.sample && <span className="ml-1 align-middle"><SampleBadge /></span>}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function Paper() {
  const { t, lang, locale } = useI18n();
  const p = t.paper;
  const { rows, loading } = useTable<PaperArticle>('paper_articles', { eq: { status: 'published' }, order: { column: 'position', ascending: true } });
  const published = useMemo(() => (rows ?? []).filter((r) => r.status === 'published'), [rows]);
  const latest = useMemo(() => published.map((r) => r.edition_date).sort().at(-1), [published]);
  const [chosen, setChosen] = useState<string | null>(null);
  const edition = chosen ?? (published.some((r) => r.edition_date === todayIST()) ? todayIST() : latest ?? todayIST());
  const items = published.filter((r) => r.edition_date === edition).sort((a, b) => a.position - b.position);
  const dateLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${edition}T12:00:00+05:30`));

  // Group consecutive briefs into one box; keep everything else in editor order.
  const blocks: ({ kind: 'item'; a: PaperArticle } | { kind: 'briefs'; items: PaperArticle[] })[] = [];
  for (const a of items) {
    const last = blocks.at(-1);
    if (a.layout === 'brief') {
      if (last?.kind === 'briefs') last.items.push(a);
      else blocks.push({ kind: 'briefs', items: [a] });
    } else blocks.push({ kind: 'item', a });
  }

  return (
    <Page>
      <header className="pt-6 text-center md:pt-10">
        <div className="border-y-4 border-double border-ink/80 py-3">
          <h1 style={serif} className="text-4xl font-black tracking-tight text-ink sm:text-6xl">{p.title}</h1>
          <p className="mt-1 text-sm text-muted">{p.tagline}</p>
        </div>
        <div className="flex items-center justify-between border-b border-ink/30 py-2 text-sm">
          <button onClick={() => setChosen(shift(edition, -1))} className="inline-flex items-center gap-1 text-ink-soft"><ChevronLeft size={16} /> {p.prev}</button>
          <span className="font-semibold text-ink">{dateLabel}</span>
          <button onClick={() => setChosen(shift(edition, 1))} disabled={edition >= todayIST()} className="inline-flex items-center gap-1 text-ink-soft disabled:opacity-30">{p.next} <ChevronRight size={16} /></button>
        </div>
      </header>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : items.length === 0 ? (
        <p className="card mt-8 p-10 text-center text-muted">{p.empty}</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {blocks.map((b, i) => {
            if (b.kind === 'briefs') return <Briefs key={`b${i}`} items={b.items} lang={lang} />;
            const a = b.a;
            if (a.layout.startsWith('ad_')) {
              const placement = a.layout.replace('ad_', 'paper_') as AdPlacement;
              const span = a.layout === 'ad_half' ? '' : 'col-span-full';
              return <AdSlot key={a.id} placement={placement} index={i} variant={a.layout === 'ad_strip' ? 'banner' : 'card'} className={span} />;
            }
            return <Story key={a.id} a={a} lang={lang} />;
          })}
        </div>
      )}
    </Page>
  );
}
