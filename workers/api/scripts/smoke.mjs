// Smoke test for the worker without Cloudflare: runs the fetch handler in Node 22+ (type stripping).
// Usage: node workers/api/scripts/smoke.mjs   (set GEMINI_API_KEY in env to also test /ask live)
import worker from '../src/index.ts';

const env = {
  ALLOWED_ORIGINS: 'https://example.github.io',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
};
const origin = { Origin: 'https://example.github.io' };

const h = await worker.fetch(new Request('https://api.test/health', { headers: origin }), env);
console.log('GET /health', h.status, await h.text());

const n = await worker.fetch(new Request('https://api.test/news?limit=30', { headers: origin }), env);
const nd = await n.json();
console.log('GET /news', n.status, 'CORS:', n.headers.get('access-control-allow-origin'));
console.table(nd.sources);
for (const i of nd.items.slice(0, 8)) console.log(`- [${i.source}] ${i.title} (${i.published_at})`);

const pre = await worker.fetch(new Request('https://api.test/ask', { method: 'OPTIONS', headers: { ...origin, 'Access-Control-Request-Method': 'POST' } }), env);
console.log('OPTIONS /ask', pre.status, pre.headers.get('access-control-allow-origin'));
const bad = await worker.fetch(new Request('https://api.test/ask', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), env);
console.log('OPTIONS /ask from foreign origin → ACAO:', bad.headers.get('access-control-allow-origin'));

const a = await worker.fetch(
  new Request('https://api.test/ask', {
    method: 'POST',
    headers: { ...origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4' },
    body: JSON.stringify({ messages: [{ role: 'user', text: 'Dadar se Thane jaldi kaise pahunchu?' }], lang: 'hi', zone: 'central_suburbs' }),
  }),
  env,
);
console.log('POST /ask', a.status, (await a.text()).slice(0, 600));
