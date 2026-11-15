// MumbaAai API — Cloudflare Worker
//   POST /ask    → Google Gemini (key stays server-side as the GEMINI_API_KEY secret)
//   GET  /news   → Mumbai RSS headlines merged server-side (avoids browser CORS)
//   GET  /health → liveness + config check (never reveals secrets)
import { FEEDS, parseFeed, type Headline } from './rss.ts';
import { buildSystemPrompt } from './prompt.ts';

export interface Env {
  /** set automatically in Supabase Edge Functions; used to check the caller is an admin */
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FALLBACK_MODEL?: string;
  /** comma-separated list of allowed browser origins, e.g. "https://you.github.io,http://localhost:5173" */
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  RATE_LIMIT_PER_DAY?: string;
}

const DEFAULT_MODEL = 'gemini-flash-latest';
const DEFAULT_FALLBACK = 'gemini-flash-lite-latest';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const NEWS_TTL_SECONDS = 600;

// ---------- CORS ----------
function allowedOrigin(req: Request, env: Env): string | null {
  const origin = req.headers.get('Origin');
  if (!origin) return null;
  const list = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (list.includes('*') || list.includes(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin; // local dev
  return null;
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const o = allowedOrigin(req, env);
  return o
    ? {
        'Access-Control-Allow-Origin': o,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' };
}

function json(data: unknown, status: number, req: Request, env: Env, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(req, env), ...extra },
  });
}

// ---------- Rate limiting (per IP, per isolate) ----------
// Best-effort: counters live in isolate memory, so limits are per Cloudflare location/isolate.
// For strict global limits, swap in the Workers Rate Limiting binding or a Durable Object.
const buckets = new Map<string, { minute: number; minuteCount: number; day: number; dayCount: number }>();
function rateLimit(ip: string, env: Env): { ok: boolean; retryAfter: number } {
  const perMin = Number(env.RATE_LIMIT_PER_MINUTE ?? 8);
  const perDay = Number(env.RATE_LIMIT_PER_DAY ?? 150);
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const day = Math.floor(now / 86400000);
  const b = buckets.get(ip) ?? { minute, minuteCount: 0, day, dayCount: 0 };
  if (b.minute !== minute) Object.assign(b, { minute, minuteCount: 0 });
  if (b.day !== day) Object.assign(b, { day, dayCount: 0 });
  if (b.minuteCount >= perMin) return { ok: false, retryAfter: 60 - Math.floor((now / 1000) % 60) };
  if (b.dayCount >= perDay) return { ok: false, retryAfter: 3600 };
  b.minuteCount++;
  b.dayCount++;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear(); // memory guard
  return { ok: true, retryAfter: 0 };
}

// ---------- /ask ----------
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
interface AskBody {
  messages?: ChatMessage[];
  question?: string;
  lang?: string;
  zone?: string;
}

async function callGemini(model: string, apiKey: string, payload: unknown, timeoutMs = 10000): Promise<Response> {
  try {
    return await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    // timed out or network error: report as 504 so the caller falls back
    return new Response(JSON.stringify({ error: 'timeout' }), { status: 504 });
  }
}
/** Primary model gets a short time box (it is often overloaded); any failure falls back to the lite model. */
async function callWithFallback(env: Env, payload: unknown): Promise<{ res: Response; model: string }> {
  const primary = env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK;
  const res = await callGemini(primary, env.GEMINI_API_KEY!, payload, 9000);
  if (res.ok || !fallback || fallback === primary) return { res, model: primary };
  return { res: await callGemini(fallback, env.GEMINI_API_KEY!, payload, 25000), model: fallback };
}

async function handleAsk(req: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) return json({ error: 'ai_not_configured' }, 503, req, env);

  const ip = req.headers.get('CF-Connecting-IP') ?? req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ?? 'anon';
  const rl = rateLimit(ip, env);
  if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429, req, env, { 'Retry-After': String(rl.retryAfter) });

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return json({ error: 'invalid_json' }, 400, req, env);
  }
  const history: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
    : body.question
      ? [{ role: 'user', text: body.question }]
      : [];
  const cleaned = history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }));
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== 'user') return json({ error: 'empty_question' }, 400, req, env);

  const lang = typeof body.lang === 'string' ? body.lang.slice(0, 10) : 'en';
  const zone = typeof body.zone === 'string' ? body.zone.slice(0, 40) : undefined;

  const payload = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(lang, zone) }] },
    contents: cleaned.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
    generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
  };

  const { res, model: usedModel } = await callWithFallback(env, payload);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('gemini_error', usedModel, res.status, detail.slice(0, 500));
    const status = res.status === 429 ? 429 : 502;
    return json({ error: res.status === 429 ? 'upstream_rate_limited' : 'upstream_error' }, status, req, env);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();
  if (!text) return json({ error: 'empty_answer', blockReason: data.promptFeedback?.blockReason ?? null }, 502, req, env);
  return json({ answer: text, model: usedModel, lang }, 200, req, env);
}

// ---------- /translate (admins only) ----------
const LANGS: Record<string, string> = { en: 'English', hi: 'Hindi (Devanagari)', mr: 'Marathi (Devanagari)' };
async function isAdminCaller(req: Request, env: Env): Promise<boolean> {
  const auth = req.headers.get('Authorization');
  if (!auth || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return false;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: auth, 'Content-Type': 'application/json' },
    body: '{}',
  });
  return res.ok && (await res.json()) === true;
}

async function handleTranslate(req: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) return json({ error: 'ai_not_configured' }, 503, req, env);
  if (!(await isAdminCaller(req, env))) return json({ error: 'admins_only' }, 401, req, env);
  let body: { texts?: Record<string, string>; from?: string; to?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400, req, env);
  }
  const texts = Object.fromEntries(Object.entries(body.texts ?? {}).filter(([, v]) => typeof v === 'string' && v.trim()).slice(0, 60));
  const total = Object.values(texts).join('').length;
  const to = (body.to ?? ['hi', 'mr']).filter((l) => LANGS[l]);
  if (!Object.keys(texts).length || !to.length) return json({ error: 'nothing_to_translate' }, 400, req, env);
  if (total > 12000) return json({ error: 'too_long' }, 413, req, env);
  const prompt = [
    `You are the translation desk of "Mumbaa Aai News", a Mumbai newspaper. Translate every value of the JSON object below into: ${to.map((l) => `${l} = ${LANGS[l]}`).join(', ')}.`,
    'Write natural newspaper style that Mumbaikars use (Marathi as in Loksatta/Maharashtra Times, Hindi as in Navbharat Times). Keep names of people, places, stations and brands recognisable. Keep numbers, dates and paragraph breaks. Do not add or remove facts.',
    `Return only JSON shaped {${to.map((l) => `"${l}": {same keys}`).join(', ')}}.`,
    JSON.stringify(texts),
  ].join('\n\n');
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 8000 } };
  const { res } = await callWithFallback(env, payload);
  if (!res.ok) return json({ error: res.status === 429 ? 'upstream_rate_limited' : 'upstream_error' }, res.status === 429 ? 429 : 502, req, env);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  try {
    return json({ translations: JSON.parse(raw.replace(/^```json\s*|```$/g, '')) }, 200, req, env);
  } catch {
    return json({ error: 'bad_ai_output' }, 502, req, env);
  }
}

// ---------- /news ----------
async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<Headline[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MumbaAaiNews/1.0; +https://github.com)', Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text(), feed);
  } finally {
    clearTimeout(t);
  }
}

export async function getNews(limit = 40): Promise<{ items: Headline[]; sources: { name: string; ok: boolean; count: number; error?: string }[] }> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const sources = results.map((r, i) => ({
    name: FEEDS[i].name,
    ok: r.status === 'fulfilled',
    count: r.status === 'fulfilled' ? r.value.length : 0,
    ...(r.status === 'rejected' ? { error: String((r.reason as Error)?.message ?? r.reason) } : {}),
  }));
  const seen = new Set<string>();
  const all = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((h) => {
      const key = h.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80);
      if (seen.has(key) || seen.has(h.link)) return false;
      seen.add(key);
      seen.add(h.link);
      return true;
    })
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
  // Interleave so one prolific source doesn't crowd out the rest of the top of the list.
  const bySource = new Map<string, Headline[]>();
  for (const h of all) bySource.set(h.source, [...(bySource.get(h.source) ?? []), h]);
  const merged: Headline[] = [];
  while (merged.length < limit && [...bySource.values()].some((l) => l.length)) {
    for (const l of bySource.values()) {
      const h = l.shift();
      if (h) merged.push(h);
    }
  }
  return { items: merged.slice(0, limit), sources };
}

async function handleNews(req: Request, env: Env, ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
  const url = new URL(req.url);
  const limit = Math.min(60, Math.max(5, Number(url.searchParams.get('limit') ?? 40)));
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(`https://cache.mumbaaai/news?limit=${limit}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const body = await hit.text();
      return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Cache': 'HIT', ...corsHeaders(req, env) } });
    }
  }
  const data = await getNews(limit);
  const body = JSON.stringify({ ...data, fetched_at: new Date().toISOString() });
  if (cache && data.items.length) {
    const toCache = new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${NEWS_TTL_SECONDS}` } });
    const p = cache.put(cacheKey, toCache);
    if (ctx) ctx.waitUntil(p);
    else await p;
  }
  return new Response(body, {
    status: data.items.length ? 200 : 502,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${NEWS_TTL_SECONDS}`, 'X-Cache': 'MISS', ...corsHeaders(req, env) },
  });
}

// ---------- router ----------
export default {
  async fetch(req: Request, env: Env, ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) });
    try {
      if (path === '/ask' && req.method === 'POST') return await handleAsk(req, env);
      if (path === '/news' && req.method === 'GET') return await handleNews(req, env, ctx);
      if (path === '/translate' && req.method === 'POST') return await handleTranslate(req, env);
      if (path === '/health' || path === '/')
        return json(
          { ok: true, service: 'mumbaaai-api', ai: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL || DEFAULT_MODEL, fallback: env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK },
          200,
          req,
          env,
        );
      return json({ error: 'not_found' }, 404, req, env);
    } catch (e) {
      console.error('unhandled', e);
      return json({ error: 'internal_error' }, 500, req, env);
    }
  },
};
