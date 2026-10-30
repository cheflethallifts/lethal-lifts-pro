const CACHE_NAME = 'lethal-lifts-v3'; // Bumped version to force cache refresh

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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignore external API calls (Database, Stripe, Analytics)
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('stripe.com') ||
      event.request.url.includes('vercel-insights')) {
    return;
  }

  // --- HTML PAGES (NETWORK-FIRST STRATEGY) ---
  // Always try to get the freshest HTML from the server so we get the newest JS file names.
  // If the network fails (offline), fall back to the cached HTML.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        return caches.match('/index.html'); // The offline fallback
      })
    );
    return;
  }

  // --- CSS, JS, IMAGES (STALE-WHILE-REVALIDATE STRATEGY) ---
  // Load instantly from cache for speed, but update in the background.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => { /* Ignore network errors in background update */ });

      return cachedResponse || fetchPromise;
    })
  );
});