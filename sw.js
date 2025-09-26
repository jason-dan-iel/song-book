const VERSION = 'v1.1.0';
const STATIC = 'songbook-static-' + VERSION;
const DYNAMIC = 'songbook-dynamic-' + VERSION;
const DATA = 'songbook-data-' + VERSION; // for small KV items like manifest hash

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
    const keep = [STATIC, DYNAMIC, DATA];
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
    // Broadcast current SW version
    const clientsArr = await self.clients.matchAll({ includeUncontrolled: true });
    clientsArr.forEach(cl => cl.postMessage({ type: 'SW_VERSION', version: VERSION }));
  })());
});

async function getPrevManifestHash() {
  const c = await caches.open(DATA);
  const r = await c.match('manifest-hash');
  if (!r) return null;
  return r.text();
}
async function setManifestHash(hash) {
  const c = await caches.open(DATA);
  await c.put('manifest-hash', new Response(hash));
}
async function sha1(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-1', buf);
  const arr = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return arr;
}

async function swr(request, cacheName, { onUpdate } = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(async res => {
    if (res && res.ok) {
      cache.put(request, res.clone());
      if (onUpdate) onUpdate(res.clone());
    }
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('gstatic.com/cast')) return;

  const isJSON = req.destination === '' && req.url.endsWith('.json');

  if (isJSON || req.url.includes('/lyrics/')) {
    // Special handling for master manifest to detect changes
    if (req.url.endsWith('/lyrics/manifest.json')) {
      event.respondWith(swr(req, DYNAMIC, {
        onUpdate: async (resp) => {
          try {
            const text = await resp.text();
            const hash = await sha1(text);
            const prev = await getPrevManifestHash();
            if (prev && prev !== hash) {
              const clientsArr = await self.clients.matchAll({ includeUncontrolled: true });
              clientsArr.forEach(cl => cl.postMessage({ type: 'MANIFEST_UPDATED' }));
            }
            await setManifestHash(hash);
          } catch { /* ignore */ }
        }
      }));
      return;
    }
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