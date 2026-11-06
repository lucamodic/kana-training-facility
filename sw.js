const CACHE_NAME = 'kana-training-facility-offline-v31-3-grammar-navigation';
const SHELL = [
  './', './index.html', './romaji.js?v=31.3', './study-ui.js?v=31.3', './styles.css?v=31.3', './app.js?v=31.3', './study-clock.js?v=31.3', './config.js?v=31.3', './cloud-sync.js?v=31.3', './learning-progress.js?v=31.3', './manga-cache.js?v=31.3', './manga-reader.js?v=31.3', './custom-collection.js?v=31.3', './grammar-data.js?v=31.3', './grammar.js?v=31.3', './manifest.webmanifest',
  './favicon.svg', './favicon.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL.map(path => new Request(path, {cache: 'reload'})));
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('kana-training-facility-offline-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const fallback = await cache.match(new URL('./index.html', self.registration.scope));
        if (fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
