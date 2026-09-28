"""Build offline cache and a single-file, double-clickable edition. Python 3 only."""
from pathlib import Path
import base64,hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'content/manifest.json').read_text(encoding='utf-8'))
words=[]
for pack in manifest['packs']:
 words.extend(json.loads((ROOT/pack['file']).read_text(encoding='utf-8'))['words'])
(ROOT/'js/starter.js').write_text('window.BUNNY_STARTER = '+json.dumps(words,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
core_files=['./','index.html','css/app.css','js/core.js','js/art.js','js/starter.js','js/app.js','manifest.webmanifest','content/manifest.json','assets/icon.svg','assets/icon-192.png','assets/icon-512.png']+[p['file'] for p in manifest['packs']]+[str(p.relative_to(ROOT)).replace('\\','/') for p in sorted((ROOT/'content/images').rglob('*')) if p.is_file()]
version=hashlib.sha256(b''.join((ROOT/p).read_bytes() for p in core_files if p!='./' and (ROOT/p).is_file())).hexdigest()[:12]
sw='''/* Only handles this app's own scope. Never clears caches belonging to other apps. */
'use strict';
const PREFIX='wordbunny-island:'+self.registration.scope;
const CACHE=PREFIX+':VERSION';
const FILES=FILES_JSON;
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
'''.replace('VERSION',version).replace('FILES_JSON',json.dumps(core_files))
(ROOT/'sw.js').write_text(sw,encoding='utf-8')
assets={}
for folder in ['content/images','assets']:
 for p in (ROOT/folder).rglob('*'):
  if not p.is_file() or p.suffix.lower() not in ['.png','.svg','.jpg','.jpeg','.webp']:continue
  mime={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[p.suffix.lower()]
  assets[str(p.relative_to(ROOT)).replace('\\','/')]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
html=(ROOT/'index.html').read_text(encoding='utf-8')
html=re.sub(r'  <link rel="(?:icon|manifest)"[^>]*>\n','',html)
html=html.replace('<link rel="stylesheet" href="css/app.css">','<style>\n'+(ROOT/'css/app.css').read_text(encoding='utf-8')+'\n</style>')
html=html.replace('  <script src="js/core.js"></script>', '<script>window.BUNNY_PORTABLE=true;window.BUNNY_ASSETS='+json.dumps(assets,separators=(',',':'))+';</script>\n  <script src="js/core.js"></script>')
for name in ['core','art','starter','app']:
 script=(ROOT/f'js/{name}.js').read_text(encoding='utf-8').replace('</script','<\\/script')
 html=html.replace(f'<script src="js/{name}.js"></script>','<script>\n'+script+'\n</script>')
(ROOT/'OPEN_WORD_BUNNY.html').write_text(html,encoding='utf-8')
print(f'Built portable HTML ({len(html.encode()):,} bytes), {len(assets)} embedded images, cache version {version}.')
