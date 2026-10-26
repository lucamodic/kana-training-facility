/* Kana Training Facility offline shell, scoped for GitHub Pages subpaths.
   Bump CACHE_NAME on each future release to trigger the update prompt. */
const CACHE_NAME = 'kana-training-facility-offline-v6';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './favicon.svg', './favicon.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const SHELL_URLS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Bypass browser HTTP caches when preparing a complete new release.
    await cache.addAll(SHELL.map(path => new Request(path, {cache: 'reload'})));
    // Intentionally don't skipWaiting: the user decides when to update.
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
    // Keep HTML/CSS/JS in sync. The new version is swapped in only after
    // "Update now" is clicked, while still remaining available offline.
    if (SHELL_URLS.has(url.href)) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
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
