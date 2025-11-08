const CACHE_NAME = 'tripsplit-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json'
  // Note: External CDN scripts are not pre-cached.
  // The browser's standard caching will handle them.
  // The app shell will work offline, but full functionality
  // depends on the browser's cache of external scripts.
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache, caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try to find the response in the cache
    caches.match(event.request)
      .then((response) => {
        // If it's in the cache, return it
        if (response) {
          return response;
        }
        // If it's not in the cache, fetch it from the network
        return fetch(event.request);
      })
  );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
