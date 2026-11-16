import { seed, type NewsItem, type NewsOverride } from '@mumbaaai/shared';
import { env } from './env';
import { db } from './data';

export interface NewsResult {
  items: NewsItem[];
  live: boolean;
}

async function overrides(): Promise<NewsOverride[]> {
  try {
    return await db.list<NewsOverride>('news_overrides');
  } catch {
    return [];
  }
}

/** Live headlines from the worker (merged RSS), with admin pin/hide overrides applied. */
export async function getNews(limit = 12): Promise<NewsResult> {
  const ov = await overrides();
  const hidden = new Set(ov.filter((o) => o.action === 'hide').map((o) => o.url));
  const pins: NewsItem[] = ov
    .filter((o) => o.action === 'pin' && o.title)
    .map((o) => ({ id: `pin-${o.id}`, title: o.title!, link: o.url, source: o.source || 'MumbaAai', pinned: true }));
  let items: NewsItem[] = [];
  let live = false;
  if (env.apiUrl) {
    try {
      const res = await fetch(`${env.apiUrl}/news?limit=${limit + 10}`);
      if (res.ok) {
        const data = (await res.json()) as { items: Omit<NewsItem, 'id'>[] };
        items = data.items.map((h, i) => ({ ...h, id: `n-${i}-${h.link}` }));
        live = items.length > 0;
      }
    } catch {
      /* fall through to sample */
    }
  }
  if (!live) items = seed.news;
  const pinnedUrls = new Set(pins.map((p) => p.link));
  const merged = [...pins, ...items.filter((i) => !hidden.has(i.link) && !pinnedUrls.has(i.link))];
  return { items: merged.slice(0, limit), live };
}

export interface RailLeg { line: string; board: string; alight: string; towards: string; stops: string[]; platform?: string; kind?: 'local' | 'metro' | 'walk' }
export interface RailRoute { from: string; to: string; legs: RailLeg[]; totalStops: number }
export type AskResult = { ok: true; answer: string; route?: RailRoute | null } | { ok: false; reason: 'not_connected' | 'rate_limited' | 'error' };

export async function askAai(messages: { role: 'user' | 'assistant'; text: string }[], lang: string, zone: string): Promise<AskResult> {
  if (!env.apiUrl) return { ok: false, reason: 'not_connected' };
  try {
    const res = await fetch(`${env.apiUrl}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang, zone }),
    });
    if (res.status === 429) return { ok: false, reason: 'rate_limited' };
    if (res.status === 503) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (j.error === 'ai_not_configured') return { ok: false, reason: 'not_connected' };
    }
    if (!res.ok) return { ok: false, reason: 'error' };
    const j = (await res.json()) as { answer: string; route?: RailRoute | null };
    return { ok: true, answer: j.answer, route: j.route ?? null };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
