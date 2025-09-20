const STATIC = 'songbook-static-v1.0.0';
const DYNAMIC = 'songbook-dynamic-v1.0.0';

const CORE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/js/main.js',
  '/src/css/styles.css',
  '/lyrics/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => ![STATIC, DYNAMIC].includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  })());
});

async function swr(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(res => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('gstatic.com/cast')) return;

  const isJSON = req.destination === '' && req.url.endsWith('.json');

  if (isJSON || req.url.includes('/lyrics/')) {
    event.respondWith(swr(req, DYNAMIC));
    return;
  }

  // HTML navigations -> try preload / network first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        const net = await fetch(req);
        const cache = await caches.open(STATIC);
        cache.put(req, net.clone());
        return net;
      } catch {
        return (await caches.match(req)) || caches.match('/index.html');
      }
    })());
    return;
  }

  // Other static assets: cache-first
  event.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(res => {
        if (res.ok && (/\.(css|js|png|svg|woff2?)$/.test(req.url))) {
          caches.open(STATIC).then(c => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => cached)
    )
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});