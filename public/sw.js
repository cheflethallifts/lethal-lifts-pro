const CACHE_NAME = 'lethal-lifts-v1';

// We want to cache the core app shell immediately when the worker installs.
// This ensures the bare minimum files are saved to the phone instantly.
const APP_SHELL = [
  '/',
  '/index.html',
  '/App.Logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(APP_SHELL);
    })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches if we ever change the CACHE_NAME version (e.g., to lethal-lifts-v2)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately without a reload
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignore Supabase API calls and Stripe Webhooks in the service worker cache!
  // We NEVER want to cache database responses, otherwise users might see old workout data.
  // The React app handles saving these to the offline queue via local storage instead.
  if (event.request.url.includes('supabase.co') || event.request.url.includes('stripe.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // STALE-WHILE-REVALIDATE STRATEGY:
        // Return the cached version immediately (this makes the app load instantly, even offline)
        // BUT also quietly fetch the latest version in the background to update the cache for next time.
        fetch(event.request).then((networkResponse) => {
           if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                 cache.put(event.request, networkResponse.clone());
              });
           }
        }).catch(() => { /* Ignore network errors in background update (we are offline) */ });
        
        return cachedResponse;
      }

      // If it's not in the cache at all, fetch it from the network
      return fetch(event.request).then((networkResponse) => {
        // Cache this new resource for future offline use (this dynamically caches Vite's JS/CSS files)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // OFFLINE FALLBACK: If the network fails and they requested a webpage, serve the cached index.html
         if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
         }
      });
    })
  );
});