/* The post-build script replaces these tokens with a content hash and exact asset list. */
const VERSION = '__PWA_VERSION__';
const ASSETS = /*__PWA_ASSETS__*/ [];
const CACHE = 'mughal-shell-' + VERSION;

self.addEventListener('install', event => {
  // Atomic install: an incomplete download never replaces the working app.
  event.waitUntil((async () => {
    if (!ASSETS.length) throw new Error('Run the PWA packaging step before deployment.');
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(ASSETS.map(path => new Request(path, { cache: 'reload' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  // Keep the previous shell: other open tabs may still be using its lazy chunks.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Never cache Firebase responses, credentials, account data or external images.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__/')) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return await cache.match('/index.html') || fetch(request);
    })());
  } else if (ASSETS.includes(url.pathname) || /\.(js|css)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(url.pathname);
      if (cached) return cached;
      // Older open tabs can still load their matching, content-hashed chunks.
      for (const key of await caches.keys()) {
        if (!key.startsWith('mughal-shell-')) continue;
        const previous = await (await caches.open(key)).match(url.pathname);
        if (previous) return previous;
      }
      return fetch(request);
    })());
  }
});
