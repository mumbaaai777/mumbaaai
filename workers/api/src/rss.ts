// Minimal RSS parser (Workers have no DOMParser). Handles CDATA, entities and the
// non-RFC date formats some Indian publishers use.
export interface Headline {
  title: string;
  link: string;
  source: string;
  published_at: string | null; // ISO 8601
}

export interface FeedDef {
  name: string;
  url: string;
  /** keep only items whose link contains this (for feeds that ignore section filters) */
  linkMustContain?: string;
}

// Each URL verified with curl on 2026-11-13 (HTTP 200, valid RSS with <item>s).
export const FEEDS: FeedDef[] = [
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms' },
  { name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/cities/mumbai-news/rssfeed.xml' },
  { name: 'mid-day', url: 'https://www.mid-day.com/Resources/midday/rss/mumbai-news.xml' },
  // FPJ's feed ignores the section param and returns all sections, so filter to /mumbai/ links.
  { name: 'Free Press Journal', url: 'https://www.freepressjournal.in/stories.rss?section=mumbai', linkMustContain: '/mumbai/' },
  { name: 'Indian Express', url: 'https://indianexpress.com/section/cities/mumbai/feed/' },
  { name: 'The Hindu', url: 'https://www.thehindu.com/news/cities/mumbai/feeder/default.rss' },
];

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, e: string) => ENTITIES[e] ?? _)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : null;
}

export function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // ISO timestamps without an offset (mid-day) are Mumbai local time, not UTC.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    const local = new Date(`${s}+05:30`);
    if (!isNaN(local.getTime())) return local.toISOString();
  }
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();
  // "Fri 2026-11-13 11:58 AM IST (UTC+05:30)"
  const m = s.match(/(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (m) {
    let h = Number(m[2]);
    if (m[5]) {
      const pm = m[5].toUpperCase() === 'PM';
      if (pm && h < 12) h += 12;
      if (!pm && h === 12) h = 0;
    }
    const tz = /UTC|GMT|Z\b|\+00:?00/.test(s) && !/IST|\+05:?30/.test(s) ? 'Z' : '+05:30';
    d = new Date(`${m[1]}T${String(h).padStart(2, '0')}:${m[3]}:${m[4] ?? '00'}${tz}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

export function parseFeed(xml: string, feed: FeedDef): Headline[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const out: Headline[] = [];
  for (const it of items) {
    const title = tag(it, 'title');
    let link = tag(it, 'link') ?? tag(it, 'guid');
    if (!title || !link) continue;
    link = link.trim();
    if (!/^https?:\/\//.test(link)) continue;
    if (feed.linkMustContain && !link.includes(feed.linkMustContain)) continue;
    out.push({
      title,
      link,
      source: feed.name,
      published_at: parseDate(tag(it, 'pubDate') ?? tag(it, 'dc:date') ?? tag(it, 'updated')),
    });
  }
  return out;
}
