// Minimal service worker for PWA installability.
// No offline caching — just a passthrough fetch handler so Chrome/Edge
// treats the site as installable and shows the install prompt.
// Also clears any old Workbox caches from the previous PWA setup.

const OLD_CACHE_PATTERN = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-|^static-assets$|^image-cache$|^cdn-assets$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.allSettled(
        names.filter((n) => OLD_CACHE_PATTERN.test(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Basic fetch handler for PWA installability and SPA routing support.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Fallback for offline or network error
        return caches.match('/index.html');
      })
    );
  }
});
