const CACHE_NAME = 'kana-training-facility-offline-v31-6-custom-json';
const SHELL = [
  './', './index.html', './romaji.js?v=31.6', './meaning.js?v=31.6', './study-ui.js?v=31.6', './styles.css?v=31.6', './app.js?v=31.6', './study-clock.js?v=31.6', './config.js?v=31.6', './cloud-sync.js?v=31.6', './learning-progress.js?v=31.6', './manga-cache.js?v=31.6', './manga-reader.js?v=31.6', './custom-collection.js?v=31.6', './custom-json.js?v=31.6', './grammar-data.js?v=31.6', './grammar.js?v=31.6', './review-scheduler.js?v=31.6', './spaced-review.js?v=31.6', './manifest.webmanifest',
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
