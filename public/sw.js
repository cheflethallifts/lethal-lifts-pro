// A basic service worker to satisfy Android Chrome's PWA install requirements.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // A dummy fetch event listener is required by Chrome to trigger the install prompt.
  return;
});