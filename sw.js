const CACHE_NAME = 'password-manage-cache-v4';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css?v=2026022512',
  './manifest.json',
  './favicon.ico',
  './images/192.png',
  './images/512.png',
  './images/192.ico',
  './images/512.ico',
  './src/main.js',
  './src/utils.js',
  './src/services/EncryptionService.js',
  './src/services/FileService.js',
  './src/services/ImportService.js',
  './src/services/PasswordRecordService.js',
  './crypto-js-lib/src/index.js',
  './crypto-js-lib/src/common/CryptoInitializer.js',
  './crypto-js-lib/src/aes/AesContext.js',
  './crypto-js-lib/src/aes/BasicAesStrategy.js',
  './crypto-js-lib/src/aes/IAesStrategy.js',
  './crypto-js-lib/src/kdf/KdfContext.js',
  './crypto-js-lib/src/kdf/Pbkdf2Strategy.js',
  './crypto-js-lib/src/kdf/IKdfStrategy.js',
  './crypto-js-lib/src/hash/ShaHashContext.js',
  './crypto-js-lib/src/hash/BasicSha256HashStrategy.js',
  './crypto-js-lib/src/hash/BasicSha512HashStrategy.js',
  './crypto-js-lib/src/hash/IShaHashStrategy.js',
  './crypto-js-lib/src/rsa/RsaContext.js',
  './crypto-js-lib/src/rsa/BasicRsaStrategy.js',
  './crypto-js-lib/src/rsa/IRsaStrategy.js'
];

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

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || requestUrl.origin !== self.location.origin) {
          return networkResponse;
        }

        const copied = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copied).catch(() => {});
        });
        return networkResponse;
      }).catch(() => caches.match('./index.html'));
    }),
  );
});