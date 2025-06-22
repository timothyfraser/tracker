
self.addEventListener('install', event => {
  event.waitUntil(caches.open('likert-cache').then(cache => cache.addAll([
    './',
    './likert_tracker.html',
    './manifest.json'
  ])));
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
