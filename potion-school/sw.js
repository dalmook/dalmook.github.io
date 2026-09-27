const CACHE='bangul-potion-school-v2';
const SHELL=['./','./favicon.svg','./momo.webp','./friends-atlas.webp','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 const page=await fetch('./',{cache:'no-store'});
 if(!page.ok)throw new Error('Unable to cache game');
 const html=await page.clone().text();
 const assets=[...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(match=>match[1]);
 await cache.addAll([...SHELL.slice(1),...assets]);
 await cache.put('./',page);
 await self.skipWaiting();
})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('bangul-potion-school-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);
  if(request.mode==='navigate'){try{const fresh=await fetch(request);if(fresh.ok)await cache.put('./',fresh.clone());return fresh;}catch{return await cache.match('./')||Response.error();}}
  const saved=await cache.match(request);if(saved)return saved;
  try{const fresh=await fetch(request);if(fresh.ok)await cache.put(request,fresh.clone());return fresh;}catch{return Response.error();}
 })());
});
