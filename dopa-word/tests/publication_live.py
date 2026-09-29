"""Real anonymous end-to-end verification after the publication Action.
No network mocks; no user storage access; no writes to public data.
"""
import json, os, pathlib, re, sys, time, traceback, urllib.request
from playwright.sync_api import sync_playwright
ROOT='https://dalmook.github.io/dopa-word/'
REGISTRY='https://raw.githubusercontent.com/dalmook/dalmook.github.io/main/dopa-word/shared/catalog.json'
OUT=pathlib.Path('qa/word-publication-live');OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok=True):
 if not ok:raise AssertionError(name)
 checks.append(name);print('LIVE PUBLICATION PASS',name,flush=True)
def phase(page,value):page.wait_for_function('(p)=>window.__word.G.phase===p',arg=value,timeout=15000)
try:
 registry=json.load(urllib.request.urlopen(REGISTRY+'?live='+str(time.time()),timeout=25))
 packs=[p for p in registry['packs'] if p.get('status')=='public']
 if not packs:
  print('No active publication to read; withdrawal-only run.');
  (OUT/'report.json').write_text(json.dumps({'active':0,'checks':[],'errors':[]}),encoding='utf8');sys.exit(0)
 pack=sorted(packs,key=lambda p:p['updatedAt'])[-1]
 check('real published catalog has author-verified entry',pack['owner']=='dalmook' and pack['id']=='p-'+str(pack['issue']))
 # Cap automatic action work for large public books; still verify full deck size.
 limit=min(len(pack['words']),30)
 check('published catalog contains word pairs only',all(isinstance(p,list) and len(p)==2 for p in pack['words']))
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--no-sandbox'])
  for mode,width in [('spell',390),('choice',1280)]:
   context=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce')
   page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(ROOT,wait_until='domcontentloaded');page.wait_for_function("document.documentElement.dataset.sharingReady==='true'")
   page.locator('#open-settings').click();page.locator('#set-muted').check();page.locator('#settings button[value="close"]').click()
   page.goto(ROOT+'?pack='+pack['id'],wait_until='domcontentloaded');page.wait_for_function("document.documentElement.dataset.sharingReady==='true'")
   selector='#shared-list [data-pack="'+pack['id']+'"]'
   page.wait_for_selector(selector,timeout=30000)
   check(mode+': fresh anonymous visitor reads actual published book',page.locator(selector+' .shared-words > div').count()==len(pack['words']))
   check(mode+': no personal words were needed to access shared book',page.evaluate('window.__word.state.custom.length')==0)
   if mode=='spell':page.screenshot(path=str(OUT/'actual-public-wordbook-mobile.png'))
   page.locator(selector+' [data-shared-action="'+mode+'"]').click();phase(page,'question')
   actual=page.evaluate('window.__word.G.deck.map(w=>[w.word,w.meaning])')
   check(mode+': every real published target appears once',sorted(actual)==sorted(pack['words']))
   for i in range(limit):
    phase(page,'question')
    if mode=='spell':page.keyboard.type(re.sub('[^a-z]','',page.evaluate('window.__word.G.deck[window.__word.G.i].word')),delay=1)
    else:
     index=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.locator('[data-choice="'+str(index)+'"]').click()
    phase(page,'answered')
    if i==0:page.screenshot(path=str(OUT/('actual-public-'+mode+'-play.png')))
    page.locator('#next').click()
   if limit==len(pack['words']):
    phase(page,'result');check(mode+': entire public book completed correctly',page.locator('#r-total').inner_text()==str(limit)+'개' and page.locator('#score').inner_text()=='100')
   else:
    page.locator('#leave').click();page.locator('#confirm-ok').click();phase(page,'result');check(mode+': first 30 published targets verified',page.locator('#r-total').inner_text()=='30개')
   check(mode+': learning stays private to this fresh browser',page.evaluate('window.__word.state.custom.length===0&&window.__word.state.sharedPacks.length===1'))
   page.reload(wait_until='domcontentloaded');page.wait_for_function("document.documentElement.dataset.sharingReady==='true'")
   check(mode+': published-book learning record persists locally',page.evaluate('window.__word.state.history.at(-1).total')==limit)
   context.close()
  browser.close()
 check('no actual-publication browser errors',not errors)
 (OUT/'report.json').write_text(json.dumps({'url':ROOT+'?pack='+pack['id'],'registry':REGISTRY,'issue':pack['issue'],'owner':pack['owner'],'title':pack['title'],'words':len(pack['words']),'tested_per_mode':limit,'mocked':False,'passed':len(checks),'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
except Exception as exc:
 errors.append(str(exc));traceback.print_exc()
 (OUT/'failure.json').write_text(json.dumps({'errors':errors,'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2),encoding='utf8')
if errors:sys.exit(1)
