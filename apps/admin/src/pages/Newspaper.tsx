// Mumbaa Aai News editor: every item on the e-paper uses a ready-made layout.
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Eye, EyeOff, Languages, Newspaper as NewsIcon, Pencil, Plus, Trash2, Wand2, X } from 'lucide-react';
import { PAPER_LAYOUTS, PAPER_SECTIONS, type PaperArticle, type PaperLayout, type PaperLangText } from '@mumbaaai/shared';
import { db, isDemo, webUrl } from '../lib/data';
import { useRows } from '../lib/useRows';
import { Badge, Btn, inputCls } from '../components/Resource';

const API = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'mr', label: 'मराठी' },
] as const;
type L = (typeof LANGS)[number]['id'];
const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

export const LAYOUT_INFO: Record<PaperLayout, { name: string; hint: string; ad?: boolean }> = {
  lead: { name: 'Lead story', hint: 'Full width, big headline, photo, intro and text' },
  standard: { name: 'Standard', hint: 'Headline, intro and text in one column' },
  photo: { name: 'Photo story', hint: 'Large photo with caption and short text' },
  brief: { name: 'Brief', hint: 'One-line news in the briefs column' },
  opinion: { name: 'Opinion', hint: 'Column with writer byline, set in italics' },
  ad_full: { name: 'Ad: full width', hint: 'Shows an active ad booked as paper_full', ad: true },
  ad_half: { name: 'Ad: half box', hint: 'Shows an active ad booked as paper_half', ad: true },
  ad_strip: { name: 'Ad: strip', hint: 'Thin ad strip between stories (paper_strip)', ad: true },
};

/** Tiny wireframe so editors can see each layout before choosing. */
function Wire({ layout }: { layout: PaperLayout }) {
  const bar = (w: string, h = 'h-1.5', c = 'bg-ink/25') => <div className={`${h} ${w} rounded ${c}`} />;
  const img = (h: string) => <div className={`${h} w-full rounded bg-marigold/40`} />;
  const box = 'flex h-20 w-full flex-col gap-1 rounded-lg border border-line bg-surface p-2';
  switch (layout) {
    case 'lead':
      return <div className={box}>{bar('w-11/12', 'h-2.5', 'bg-ink/60')}{img('h-7')}{bar('w-full')}{bar('w-4/5')}</div>;
    case 'standard':
      return <div className={box}>{bar('w-3/4', 'h-2', 'bg-ink/50')}{bar('w-full')}{bar('w-full')}{bar('w-2/3')}</div>;
    case 'photo':
      return <div className={box}>{img('h-10')}{bar('w-2/3', 'h-2', 'bg-ink/50')}{bar('w-1/2')}</div>;
    case 'brief':
      return <div className={box}>{[0, 1, 2, 3].map((i) => <div key={i} className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-marigold" />{bar('w-full')}</div>)}</div>;
    case 'opinion':
      return <div className={box}><div className="flex items-center gap-1"><span className="h-4 w-4 rounded-full bg-ink/30" />{bar('w-1/3')}</div>{bar('w-4/5', 'h-2', 'bg-ink/50')}{bar('w-full')}{bar('w-3/4')}</div>;
    case 'ad_full':
      return <div className={`${box} items-center justify-center border-dashed border-marigold bg-accent-soft text-[10px] font-bold text-marigold-ink`}>AD · FULL</div>;
    case 'ad_half':
      return <div className={`${box} items-start`}><div className="flex h-full w-1/2 items-center justify-center rounded border border-dashed border-marigold bg-accent-soft text-[10px] font-bold text-marigold-ink">AD</div></div>;
    case 'ad_strip':
      return <div className={`${box} justify-center`}>{bar('w-full')}<div className="flex h-4 items-center justify-center rounded border border-dashed border-marigold bg-accent-soft text-[9px] font-bold text-marigold-ink">AD STRIP</div>{bar('w-full')}</div>;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!API) throw new Error('AI is not connected (VITE_API_URL missing).');
  const token = (await db.client?.auth.getSession())?.data.session?.access_token;
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
  return j as T;
}

async function translate(texts: Record<string, string>, to: L[]): Promise<Record<string, Record<string, string>>> {
  if (isDemo) throw new Error('Translation works once Supabase is connected.');
  const r = await apiPost<{ translations: Record<string, Record<string, string>> }>('/translate', { texts, to });
  return r.translations;
}

type Draft = Omit<PaperArticle, 'id' | 'created_at'> & { id?: string };
const blank = (edition: string, layout: PaperLayout, position: number): Draft => ({
  edition_date: edition,
  layout,
  section: layout === 'opinion' ? 'opinion' : 'city',
  position,
  headline: {},
  standfirst: {},
  body: {},
  image_url: null,
  image_caption: null,
  byline: layout === 'opinion' ? '' : 'Mumbaa Aai News Desk',
  source_name: null,
  source_url: null,
  is_auto: false,
  status: 'draft',
});

function Editor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [lang, setLang] = useState<L>('en');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const info = LAYOUT_INFO[d.layout];
  const setText = (k: 'headline' | 'standfirst' | 'body', v: string) => setD((x) => ({ ...x, [k]: { ...(x[k] ?? {}), [lang]: v } }));
  const val = (k: 'headline' | 'standfirst' | 'body') => ((d[k] ?? {}) as PaperLangText)[lang] ?? '';

  const doTranslate = async () => {
    const texts: Record<string, string> = {};
    for (const k of ['headline', 'standfirst', 'body'] as const) {
      const v = ((d[k] ?? {}) as PaperLangText)[lang];
      if (v?.trim()) texts[k] = v;
    }
    if (!Object.keys(texts).length) return setErr(`Write the ${LANGS.find((l) => l.id === lang)!.label} text first.`);
    setBusy('translate');
    setErr(null);
    try {
      const to = LANGS.map((l) => l.id).filter((l) => l !== lang);
      const tr = await translate(texts, to);
      setD((x) => {
        const n = { ...x };
        for (const k of Object.keys(texts) as ('headline' | 'standfirst' | 'body')[]) {
          n[k] = { ...(x[k] ?? {}), ...Object.fromEntries(to.map((l) => [l, tr[l]?.[k] ?? (x[k] as PaperLangText | null)?.[l] ?? ''])) };
        }
        return n;
      });
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(null);
  };

  const save = async (status?: 'draft' | 'published') => {
    if (!info.ad && !Object.values(d.headline).some((v) => v?.trim())) return setErr('Add a headline in at least one language.');
    setBusy('save');
    setErr(null);
    const { id, ...row } = { ...d, status: status ?? d.status, headline: info.ad ? { en: info.name } : d.headline };
    try {
      if (id) await db.update('paper_articles', id, row as Partial<PaperArticle>);
      else await db.insert('paper_articles', row as Partial<PaperArticle>);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40" onClick={onClose}>
      <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="h-full w-full max-w-2xl overflow-y-auto bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="eyebrow">{info.name}</p>
            <h2 className="text-lg font-semibold text-ink">{d.id ? 'Edit item' : 'New item'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </div>

        <p className="mb-2 text-xs font-semibold text-ink-soft">Layout</p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {PAPER_LAYOUTS.map((l) => (
            <button key={l} type="button" onClick={() => setD((x) => ({ ...x, layout: l }))} className={`rounded-xl p-1 text-left ${d.layout === l ? 'ring-2 ring-marigold' : 'opacity-70 hover:opacity-100'}`}>
              <Wire layout={l} />
              <span className="mt-1 block text-[11px] font-semibold text-ink">{LAYOUT_INFO[l].name}</span>
            </button>
          ))}
        </div>

        {info.ad ? (
          <p className="card p-4 text-sm text-ink-soft">This space shows an active ad booked with placement <b>{d.layout.replace('ad_', 'paper_')}</b>. Book or change ads in the Ads page.</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-semibold text-ink-soft">Section
                <select className={inputCls} value={d.section} onChange={(e) => setD((x) => ({ ...x, section: e.target.value as Draft['section'] }))}>
                  {PAPER_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-soft">Byline
                <input className={inputCls} value={d.byline ?? ''} onChange={(e) => setD((x) => ({ ...x, byline: e.target.value }))} />
              </label>
            </div>
            <div className="mb-3 flex items-center gap-2">
              {LANGS.map((l) => (
                <button key={l.id} type="button" onClick={() => setLang(l.id)} className={`rounded-full px-3 py-1 text-sm font-semibold ${lang === l.id ? 'bg-navy text-offwhite' : 'border border-line text-ink-soft'}`}>
                  {l.label}
                  {(d.headline as PaperLangText)[l.id]?.trim() ? ' ✓' : ''}
                </button>
              ))}
              <Btn variant="ghost" type="button" className="ml-auto" disabled={busy !== null} onClick={doTranslate}>
                <Languages size={15} /> {busy === 'translate' ? 'Translating…' : 'Translate with Aai'}
              </Btn>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-ink-soft">Headline
                <input className={`${inputCls} text-base font-semibold`} value={val('headline')} onChange={(e) => setText('headline', e.target.value)} maxLength={160} />
              </label>
              {d.layout !== 'brief' && (
                <label className="grid gap-1 text-xs font-semibold text-ink-soft">Intro (standfirst)
                  <textarea className={`${inputCls} min-h-16`} value={val('standfirst')} onChange={(e) => setText('standfirst', e.target.value)} maxLength={400} />
                </label>
              )}
              {d.layout !== 'brief' && (
                <label className="grid gap-1 text-xs font-semibold text-ink-soft">Story (blank line between paragraphs)
                  <textarea className={`${inputCls} min-h-48`} value={val('body')} onChange={(e) => setText('body', e.target.value)} />
                </label>
              )}
              {(d.layout === 'lead' || d.layout === 'photo' || d.layout === 'standard') && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">Photo
                    <input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setBusy('upload');
                      try { const url = await db.uploadImage(f); setD((x) => ({ ...x, image_url: url })); } catch (x) { setErr((x as Error).message); }
                      setBusy(null);
                    }} />
                    {d.image_url && <img src={d.image_url} alt="" className="mt-1 h-20 w-full rounded object-cover" />}
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-ink-soft">Photo caption
                    <input className={inputCls} value={d.image_caption ?? ''} onChange={(e) => setD((x) => ({ ...x, image_caption: e.target.value }))} />
                  </label>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs font-semibold text-ink-soft">Source name (if not your own story)
                  <input className={inputCls} value={d.source_name ?? ''} onChange={(e) => setD((x) => ({ ...x, source_name: e.target.value || null }))} />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-ink-soft">Source link
                  <input className={inputCls} value={d.source_url ?? ''} onChange={(e) => setD((x) => ({ ...x, source_url: e.target.value || null }))} />
                </label>
              </div>
            </div>
          </>
        )}
        <label className="mt-3 grid w-40 gap-1 text-xs font-semibold text-ink-soft">Edition date
          <input type="date" className={inputCls} value={d.edition_date} onChange={(e) => setD((x) => ({ ...x, edition_date: e.target.value }))} />
        </label>
        {err && <p className="mt-3 text-sm text-live-ink">{err}</p>}
        <div className="mt-5 flex gap-2">
          <Btn disabled={busy !== null} onClick={() => save('published')}>Publish</Btn>
          <Btn variant="ghost" disabled={busy !== null} onClick={() => save('draft')}>Save draft</Btn>
        </div>
      </motion.div>
    </div>
  );
}

export default function Newspaper() {
  const [edition, setEdition] = useState(todayIST());
  const { rows, loading, error, reload } = useRows<PaperArticle>('paper_articles', { order: { column: 'position', ascending: true } });
  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const items = useMemo(() => rows.filter((r) => r.edition_date === edition).sort((a, b) => a.position - b.position), [rows, edition]);
  const nextPos = (items.at(-1)?.position ?? 0) + 1;

  const move = async (i: number, dir: -1 | 1) => {
    const a = items[i];
    const b = items[i + dir];
    if (!a || !b) return;
    setBusy(a.id);
    await db.update('paper_articles', a.id, { position: b.position === a.position ? a.position + dir : b.position });
    await db.update('paper_articles', b.id, { position: a.position });
    await reload();
    setBusy(null);
  };

  const digest = async () => {
    setBusy('digest');
    setMsg(null);
    try {
      if (!API) throw new Error('AI is not connected.');
      const res = await fetch(`${API}/news?limit=12`);
      const { items: heads } = (await res.json()) as { items: { title: string; link: string; source: string }[] };
      const have = new Set(items.map((i) => i.source_url));
      const fresh = heads.filter((h) => !have.has(h.link)).slice(0, 10);
      if (!fresh.length) throw new Error('No new headlines right now.');
      let tr: Record<string, Record<string, string>> = {};
      try {
        tr = await translate(Object.fromEntries(fresh.map((h, i) => [`h${i}`, h.title])), ['hi', 'mr']);
      } catch (e) {
        setMsg(`Headlines added in English only (${(e as Error).message}).`);
      }
      let pos = nextPos;
      for (const [i, h] of fresh.entries()) {
        await db.insert('paper_articles', {
          edition_date: edition,
          layout: 'brief',
          section: 'city',
          position: pos++,
          headline: { en: h.title, hi: tr.hi?.[`h${i}`] ?? null, mr: tr.mr?.[`h${i}`] ?? null },
          source_name: h.source,
          source_url: h.link,
          is_auto: true,
          status: 'draft',
        } as Partial<PaperArticle>);
      }
      setMsg((m) => m ?? `${fresh.length} headlines added as drafts. Check them, then Publish all.`);
      await reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(null);
  };

  const publishAll = async () => {
    setBusy('publish');
    for (const it of items.filter((i) => i.status === 'draft')) await db.update('paper_articles', it.id, { status: 'published' });
    await reload();
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink"><NewsIcon /> Mumbaa Aai News</h1>
          <p className="text-sm text-muted">Every item uses a ready-made layout. Write in one language and let Aai translate to the others.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className={`${inputCls} w-40`} value={edition} onChange={(e) => setEdition(e.target.value)} />
          <a className="text-sm font-semibold text-marigold-ink underline" href={`${webUrl}#/paper`} target="_blank" rel="noreferrer">View paper</a>
        </div>
      </div>

      <div className="card p-4">
        <p className="mb-2 text-sm font-semibold text-ink">Add to this edition</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {PAPER_LAYOUTS.map((l) => (
            <button key={l} onClick={() => setEditing(blank(edition, l, nextPos))} className="rounded-xl p-1 text-left hover:ring-2 hover:ring-marigold" title={LAYOUT_INFO[l].hint}>
              <Wire layout={l} />
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink"><Plus size={11} /> {LAYOUT_INFO[l].name}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn variant="ghost" disabled={busy !== null} onClick={digest}><Wand2 size={15} /> {busy === 'digest' ? 'Building digest…' : "Build today's headline digest"}</Btn>
          <Btn disabled={busy !== null || !items.some((i) => i.status === 'draft')} onClick={publishAll}>Publish all drafts</Btn>
          {msg && <span className="text-sm text-ink-soft">{msg}</span>}
        </div>
      </div>

      {error && <p className="text-sm text-live-ink">{error}</p>}
      <div className="space-y-2">
        {loading ? <p className="text-muted">Loading…</p> : items.length === 0 ? (
          <p className="card p-8 text-center text-muted">Nothing in this edition yet. Pick a layout above or build the headline digest.</p>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((it, i) => (
              <motion.div layout key={it.id} className="card flex items-center gap-3 p-3">
                <div className="w-24 shrink-0"><Wire layout={it.layout} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={it.status === 'published' ? 'good' : 'warn'}>{it.status}</Badge>
                    <Badge>{LAYOUT_INFO[it.layout].name}</Badge>
                    {!LAYOUT_INFO[it.layout].ad && <Badge>{it.section}</Badge>}
                    {it.is_auto && <Badge tone="accent">digest</Badge>}
                    {(['en', 'hi', 'mr'] as const).map((l) => <span key={l} className={`text-[10px] font-bold ${it.headline[l] ? 'text-ink' : 'text-muted line-through'}`}>{l.toUpperCase()}</span>)}
                  </div>
                  <p className="mt-1 truncate font-medium text-ink">{it.headline.en || it.headline.hi || it.headline.mr}</p>
                  {it.source_name && <p className="text-xs text-muted">Source: {it.source_name}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button className="p-1.5 text-muted disabled:opacity-30" disabled={i === 0 || busy !== null} onClick={() => move(i, -1)} aria-label="Up"><ArrowUp size={16} /></button>
                  <button className="p-1.5 text-muted disabled:opacity-30" disabled={i === items.length - 1 || busy !== null} onClick={() => move(i, 1)} aria-label="Down"><ArrowDown size={16} /></button>
                  <button className="p-1.5 text-muted" title={it.status === 'published' ? 'Unpublish' : 'Publish'} onClick={async () => { await db.update('paper_articles', it.id, { status: it.status === 'published' ? 'draft' : 'published' }); reload(); }}>
                    {it.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="p-1.5 text-muted" onClick={() => setEditing({ ...it })} aria-label="Edit"><Pencil size={16} /></button>
                  <button className="p-1.5 text-live-ink" onClick={async () => { if (confirm('Delete this item?')) { await db.remove('paper_articles', it.id); reload(); } }} aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      {editing && <Editor draft={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}
