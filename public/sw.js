/**
 * EduSmart PWA & CBC Learning Materials Service Worker
 * Enables offline access to critical lesson notes, syllabi, and learning resources.
 */

const CACHE_NAME = 'edusmart-cbc-offline-v6';
const STATIC_ASSETS = [
  '/edusmart-logo.svg',
  '/logo.svg',
  '/GADSA-SYSTEMS.jpeg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('EduSmart Service Worker: initial asset caching warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API endpoints or Vite dev server module/HMR requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // For HTML document navigation: ALWAYS NETWORK FIRST
  const isHtmlNavigation =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = (await caches.match(event.request)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"><title>EduSmart LMS</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>Reconnecting to EduSmart Server…</h2><p>Please refresh the page in a moment.</p><script>setTimeout(()=>location.reload(),1500)</script></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // For static hashed assets (e.g. /assets/*.js, /assets/*.css): Cache-first with network fallback
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => new Response('', { status: 504 }));
      })
    );
    return;
  }

  // Default network fetch with safe fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => new Response('', { status: 504 }));
    })
  );
});
