const CACHE_NAME = 'heypapa-shell-v20260821';
const SHELL = [
  '/', '/index.html', '/styles.css', '/app.js', '/games-data.js',
  '/play.html', '/play.css', '/play.js', '/guides.html', '/about.html', '/privacy.html',
  '/content.css', '/offline.html', '/404.html', '/favicon.svg', '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png'
];
const ROOT_GAMES = new Set([
  '/matchgame.html','/imagechoice.html','/piecegame.html','/logicgame.html','/voiddalbong.html',
  '/wordindex.html','/treeindex.html','/guguindex.html','/kidscalindex.html','/saltindex.html',
  '/findindex.html','/drawindex.html','/hiddencardindex.html','/typingindex.html'
]);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

function isManagedPath(pathname) {
  if (SHELL.includes(pathname) || ROOT_GAMES.has(pathname)) return true;
  return pathname.startsWith('/images/') || pathname.startsWith('/icons/') || pathname.startsWith('/audio/');
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // /vietnam/ 등 별도 하위 앱은 이 서비스워커가 가로채지 않습니다.
  if (request.method !== 'GET' || url.origin !== self.location.origin || !isManagedPath(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(async () => {
        const exact = await caches.match(request);
        if (exact) return exact;
        if (url.pathname === '/play.html') return caches.match('/play.html');
        if (url.pathname === '/' || url.pathname === '/index.html') return caches.match('/index.html');
        return caches.match('/offline.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
