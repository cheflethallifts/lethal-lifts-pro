const CACHE_NAME = 'lethal-lifts-v4'; // Bumped version to force cache refresh

const APP_SHELL = [
  '/',
  '/App.Logo.png',
  '/manifest.json'
];

// The first visit loads the JS before this worker is running, so nothing would
// cache it. Without these files the saved page opens to a blank screen offline.
const cacheCurrentBuild = async (cache) => {
  const page = await cache.match('/');
  const html = await page.text();
  const assets = html.match(/\/assets\/[^"'\s>]+/g) || [];
  await cache.addAll([...new Set(assets)]);
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Opened cache');
      await cache.addAll(APP_SHELL);
      await cacheCurrentBuild(cache);
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
  // Only reads can be cached. Analytics sends POSTs through here.
  if (event.request.method !== 'GET') return;

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
        if (!networkResponse.ok) return networkResponse;
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(async () => {
        // The offline fallback: the newest saved copy, which matches the newest cached JS
        return (await caches.match(event.request, { ignoreSearch: true })) || caches.match('/');
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