"""Public sharing UI regression. Synthetic vocabulary only. Real publication is
verified separately through the owner-authorized issue/Actions path."""
import json, os, pathlib, re, sys, traceback
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
URL=os.getenv('WORD_URL','http://127.0.0.1:8765/dopa-word/')
OUT=pathlib.Path(os.getenv('WORD_OUT','qa/word'));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok=True):
 if not ok:raise AssertionError(name)
 checks.append(name);print('SHARING PASS',name,flush=True)
def ready(page,url=URL):
 page.goto(url,wait_until='domcontentloaded',timeout=45000);page.wait_for_function("document.documentElement.dataset.sharingReady==='true'",timeout=20000)
def phase(page,value):page.wait_for_function('(p)=>window.__word.G.phase===p',arg=value,timeout=15000)
def add(page,word,meaning,group):
 page.locator('#add-word').click();page.locator('#edit-word').fill(word);page.locator('#edit-meaning').fill(meaning);page.locator('#edit-group').fill(group);page.locator('#edit-form button[type="submit"]').click();page.wait_for_function("!document.querySelector('#edit-dialog').open")
def finish(page):
 page.locator('#leave').click();page.locator('#confirm-ok').click()
 if page.evaluate('window.__word.G.screen')=='result':page.locator('#screen-result [data-home]').click()
def answer(page,mode):
 phase(page,'question')
 if mode=='spell':page.keyboard.type(re.sub('[^a-z]','',page.evaluate('window.__word.G.deck[window.__word.G.i].word')),delay=1)
 else:
  i=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.locator(f'[data-choice="{i}"]').click()
 phase(page,'answered')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,args=['--no-sandbox'])
  owner=browser.new_context(viewport={'width':390,'height':844});page=owner.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
  check('public and sharing entry points exist without account prompts',page.locator('#open-shared').count()==1 and page.locator('#open-share').count()==1)
  page.locator('#open-words').click()
  for w,m in [('orchard','과수원'),('festival','축제'),('t-shirt','티셔츠')]:add(page,w,m,'공유 연습')
  add(page,'secret note','공유하지 않는 연습 메모','개인 연습')
  page.locator('#share-from-words').click();page.locator('#share-category').select_option('공유 연습')
  check('sharing requires explicit consent before either output',page.locator('#make-share-link').is_disabled() and page.locator('#prepare-publish').is_disabled())
  check('preview contains only chosen category','secret' not in page.locator('#share-preview').inner_text() and '3단어' in page.locator('#share-count').inner_text())
  page.locator('#share-consent').check();page.locator('#make-share-link').click();url=page.locator('#share-url').input_value()
  check('instant link contains snapshot in fragment not query',urlparse(url).fragment.startswith('words=') and not urlparse(url).query)
  page.locator('#prepare-publish').click();body=page.locator('#publish-body').input_value();href=page.locator('#publish-github').get_attribute('href')
  check('publication request contains no progress or unselected words',all(k not in body for k in ['secret note','xp','progress','history','settings']))
  check('GitHub issue submission is explicitly required, not reported as saved','Submit new issue' in page.locator('#publish-instructions').inner_text() and 'issues/new' in href)
  check('GitHub body roundtrips without a client secret',parse_qs(urlparse(href).query)['body'][0]==body and 'token' not in href)
  page.screenshot(path=str(OUT/'sharing-consent-and-link.png'))
  page.locator('#share-title').fill('공유 연습 새 제목');check('editing title invalidates previous consent and generated output',page.locator('#make-share-link').is_disabled() and not page.locator('#share-link-result').is_visible())
  page.locator('[data-close="share-dialog"]').click();check('publishing preparation does not delete personal words',page.evaluate('window.__word.state.custom.length')==4)
  for mode,width in [('spell',390),('choice',1280)]:
   ctx=browser.new_context(viewport={'width':width,'height':844});reader=ctx.new_page();reader.on('pageerror',lambda e:errors.append(str(e)));ready(reader,url)
   reader.wait_for_selector('#incoming-pack [data-pack]')
   check(mode+': other browser can read 3 shared words without login',reader.locator('#incoming-pack .shared-words div').count()==3)
   check(mode+': received link is not falsely author-verified','작성자 미확인' in reader.locator('#incoming-pack').inner_text())
   check(mode+': private wordbook is empty before studying',reader.evaluate('window.__word.state.custom.length')==0)
   reader.locator(f'#incoming-pack [data-shared-action="{mode}"]').click();phase(reader,'question')
   check(mode+': only shared targets are studied',reader.evaluate("window.__word.G.deck.length===3&&window.__word.G.deck.every(w=>w.origin==='shared')"))
   for i in range(3):answer(reader,mode);reader.locator('#next').click()
   phase(reader,'result');check(mode+': all shared words finish correctly',reader.locator('#score').inner_text()=='100' and reader.locator('#r-total').inner_text()=='3개')
   check(mode+': shared study does not overwrite own/base words',reader.evaluate('window.__word.state.custom.length')==0)
   reader.reload(wait_until='domcontentloaded');reader.wait_for_function("document.documentElement.dataset.sharingReady==='true'")
   check(mode+': personal shared-study results survive reload',reader.evaluate('window.__word.state.history.at(-1).total')==3)
   reader.screenshot(path=str(OUT/('sharing-'+mode+'-receiver.png')));ctx.close()
  # Public index UI uses controlled synthetic data here, not a real publication.
  catalog={'schema':1,'updatedAt':'2026-09-29T00:00:00Z','packs':[{'v':1,'id':'p-9001','issue':9001,'title':'목록 연습','words':[['apple','사과'],['orchard','과수원'],['t-shirt','티셔츠']],'owner':'dalmook','version':1,'updatedAt':'2026-09-29T00:00:00Z','status':'public'}]}
  ctx=browser.new_context(viewport={'width':390,'height':844});ctx.route('https://raw.githubusercontent.com/dalmook/dalmook.github.io/main/dopa-word/shared/catalog.json*',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(catalog,ensure_ascii=False)))
  reader=ctx.new_page();reader.on('pageerror',lambda e:errors.append(str(e)));ready(reader,URL+'?pack=p-9001');reader.wait_for_selector('#shared-list [data-pack="p-9001"]')
  check('public library loads explicit version, title, owner and words','목록 연습' in reader.locator('#shared-list').inner_text() and 'dalmook' in reader.locator('#shared-list').inner_text())
  check('direct catalog link highlights all words',reader.locator('#shared-list .shared-words div').count()==3)
  reader.screenshot(path=str(OUT/'sharing-public-library.png'))
  reader.locator('#shared-list [data-shared-action="choice"]').click();answer(reader,'choice');finish(reader)
  check('public pack remembered without copying to personal words',reader.evaluate('window.__word.state.sharedPacks[0].id')=='p-9001' and reader.evaluate('window.__word.state.custom.length')==0)
  reader.locator('#open-words').click();add(reader,'apple','내 사과 뜻','개인 사전');reader.locator('#screen-words [data-home]').click();reader.locator('#open-shared').click();reader.wait_for_selector('#shared-list [data-pack="p-9001"]')
  reader.once('dialog',lambda dialog:dialog.accept());reader.locator('#shared-list [data-shared-action="copy"]').click()
  check('copy to own book skips colliding English and preserves personal definition',reader.evaluate("window.__word.state.custom.find(w=>w.word==='apple').meaning")=='내 사과 뜻')
  catalog['packs'][0]['words']=[['apple','사과 과일'],['orchard','과수원']];catalog['packs'][0]['version']=2
  reader.locator('#refresh-shared').click();reader.wait_for_function("window.__word.sharing.catalog.packs[0]?.version===2")
  check('refresh reflects owner updates without rebuilding application','2단어' in reader.locator('#shared-list').inner_text())
  catalog['packs']=[{'id':'p-9001','status':'withdrawn','version':2}]
  reader.locator('#refresh-shared').click();reader.wait_for_function("window.__word.sharing.catalog.packs[0]?.status==='withdrawn'")
  check('withdrawn book disappears from current listing',reader.locator('#shared-list [data-pack="p-9001"]').count()==0)
  check('existing reader copy honestly remains as local cached copy',reader.locator('#saved-shared-list [data-pack="p-9001"]').count()==1)
  ctx.close()
  # A fresh browser gets neither another visitor's private words nor history.
  ctx=browser.new_context(viewport={'width':320,'height':640});reader=ctx.new_page();reader.on('pageerror',lambda e:errors.append(str(e)));ready(reader)
  check('unrelated visitor has no other user private data',reader.evaluate('window.__word.state.custom.length===0&&window.__word.state.answered===0'))
  ready(reader,URL+'#words=@@@');check('malformed shared URL does not start or import anything',reader.evaluate('window.__word.G.screen')=='shared' and reader.evaluate('window.__word.state.sharedPacks.length')==0)
  ctx.close();owner.close();check('no sharing runtime errors',not errors);browser.close()
except Exception as exc:
 errors.append(str(exc));traceback.print_exc()
 try:page.screenshot(path=str(OUT/'sharing-failure.png'))
 except Exception:pass
finally:
 (OUT/'sharing-report.json').write_text(json.dumps({'url':URL,'passed':len(checks),'checks':checks,'errors':errors,'catalog_test':'synthetic route; production action publication checked separately'},ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps({'sharing_passed':len(checks),'errors':errors},ensure_ascii=False),flush=True)
if errors:sys.exit(1)
