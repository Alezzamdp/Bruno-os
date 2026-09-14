// BRUNO OS · trabaja sin señal. Al cambiar VERSION se reemplaza todo lo guardado.
const VERSION = 'brunoos-v7';
const ARCHIVOS = ['./', './index.html', './app.css?v=7', './app.js?v=7', './manifest.json', './fonts/Archivo-Variable.ttf', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: false }).then((r) => r || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
