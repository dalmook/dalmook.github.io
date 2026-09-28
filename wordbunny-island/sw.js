/* Only handles this app's own scope. Never clears caches belonging to other apps. */
'use strict';
const PREFIX='wordbunny-island:'+self.registration.scope;
const CACHE=PREFIX+':1b6e375d2d6d';
const FILES=["./", "index.html", "css/app.css", "js/core.js", "js/art.js", "js/starter.js", "js/app.js", "manifest.webmanifest", "content/manifest.json", "assets/icon.svg", "assets/icon-192.png", "assets/icon-512.png", "content/packs/food.json", "content/packs/animals.json", "content/packs/school.json", "content/packs/world.json", "content/images/airplane.svg", "content/images/apple.svg", "content/images/bag.svg", "content/images/ball.svg", "content/images/banana.svg", "content/images/bear.svg", "content/images/bird.svg", "content/images/boat.svg", "content/images/book.svg", "content/images/bread.svg", "content/images/car.svg", "content/images/carrot.svg", "content/images/cat.svg", "content/images/chair.svg", "content/images/clock.svg", "content/images/cloud.svg", "content/images/cookie.svg", "content/images/corn.svg", "content/images/crayon.svg", "content/images/desk.svg", "content/images/dog.svg", "content/images/duck.svg", "content/images/egg.svg", "content/images/eraser.svg", "content/images/fish.svg", "content/images/flower.svg", "content/images/fox.svg", "content/images/grape.svg", "content/images/house.svg", "content/images/lion.svg", "content/images/milk.svg", "content/images/moon.svg", "content/images/orange.svg", "content/images/panda.svg", "content/images/paper.svg", "content/images/pencil.svg", "content/images/pig.svg", "content/images/rabbit.svg", "content/images/rain.svg", "content/images/ruler.svg", "content/images/school.svg", "content/images/snow.svg", "content/images/star.svg", "content/images/strawberry.svg", "content/images/sun.svg", "content/images/tree.svg", "content/images/turtle.svg", "content/images/water.svg"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX+':')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const fresh=await fetch(req);if(fresh.ok)await cache.put(req,fresh.clone());return fresh;}
  catch(error){const cached=await cache.match(req);if(cached)return cached;if(req.mode==='navigate')return (await cache.match('index.html'))||Response.error();return Response.error();}
 })());
});
