/* MumbaAai service worker — app-shell caching, network-first for data.
   Bump VERSION to invalidate old caches on deploy. */
const VERSION = 'v1';
const SHELL = `mumbaaai-shell-${VERSION}`;
const RUNTIME = `mumbaaai-runtime-${VERSION}`;
const SCOPE = self.registration.scope;
const PRECACHE = ['', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'assets/logo-primary.png', 'assets/logo-dark.png', 'assets/radio-disc.png'].map((p) => new URL(p, SCOPE).toString());

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, RUNTIME].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache audio streams or Supabase auth/API writes
  if (req.destination === 'audio' || req.headers.get('range')) return;
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).catch(() => caches.match(new URL('index.html', SCOPE).toString())));
      return;
    }
    // hashed build assets: cache-first
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(RUNTIME).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }
  // Cross-origin data (Open-Meteo, worker /news, Supabase REST): network-first, fall back to last copy
  if (/open-meteo\.com|\/news|supabase\.co\/rest/.test(url.href)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req)),
    );
  }
});
