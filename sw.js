const CACHE_NAME = 'password-manage-cache-v2026022803';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './images/192.png',
  './images/512.png',
  './images/192.ico',
  './images/512.ico'
];

function isAppAsset(pathname) {
  return pathname.endsWith('/styles.css')
    || pathname.endsWith('/manifest.json')
    || pathname.endsWith('/favicon.ico')
    || pathname.includes('/images/')
    || pathname.includes('/src/')
    || pathname.includes('/crypto-js-lib/');
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (fallbackUrl) {
      const fallbackResponse = await cache.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, networkResponse.clone()).catch(() => {});
    });
  }
  return networkResponse;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (!['http:', 'https:'].includes(requestUrl.protocol)) {
    return;
  }
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  if (requestUrl.pathname.endsWith('/sw.js')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, './index.html'));
    return;
  }

  if (isAppAsset(requestUrl.pathname)) {
    event.respondWith(cacheFirst(event.request));
  }
});
