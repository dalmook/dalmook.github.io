"""Full-category regressions with synthetic data imported through the supported UI."""
import json, os, pathlib, re, sys, traceback
from playwright.sync_api import sync_playwright
URL=os.getenv('WORD_URL','http://127.0.0.1:8765/dopa-word/')
OUT=pathlib.Path(os.getenv('WORD_OUT','qa/word'));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok=True):
 if not ok:raise AssertionError(name)
 checks.append(name);print('CATEGORY PASS',name,flush=True)
def phase(page,value):page.wait_for_function('(p)=>window.__word.G.phase===p',arg=value,timeout=15000)
def ready(page):
 page.goto(URL,wait_until='domcontentloaded',timeout=45000);page.wait_for_function("window.__word?.revision==='word-1.1.0-categories'",timeout=20000)
def reload_ready(page):
 page.evaluate("window.__categoryReloadProbe='old-document'")
 before=page.evaluate("({ready:document.readyState,screen:window.__word.G.screen,count:window.__word.state.history.at(-1)?.total,muted:window.__word.scene.audio.muted,ctx:window.__word.scene.audio.ctx?.state,bytes:localStorage.getItem('dopa-word-ko-v1').length})")
 (OUT/'reload-before.json').write_text(json.dumps(before,ensure_ascii=False),encoding='utf8')
 navigation=[]
 def on_response(response):
  if response.request.is_navigation_request():navigation.append({'url':response.url,'status':response.status})
 page.on('response',on_response)
 try:
  response=page.reload(wait_until='domcontentloaded',timeout=45000)
  check('reload HTTP response succeeds',response is not None and response.ok)
  page.wait_for_function("window.__word?.revision==='word-1.1.0-categories'&&document.documentElement.dataset.wordReady==='true'",timeout=20000)
  check('reload produced a newly initialized document',page.evaluate("window.__categoryReloadProbe===undefined"))
 except Exception:
  try:
   (OUT/'reload-failure-state.json').write_text(json.dumps({'url':page.url,'errors':errors,'navigation':navigation,'before':before},ensure_ascii=False),encoding='utf8')
   page.screenshot(path=str(OUT/'reload-failure.png'),timeout=5000)
  except Exception:pass
  raise
def go_home(page):
 if page.evaluate('window.__word.G.screen')=='play':
  page.locator('#leave').click();page.locator('#confirm-ok').click()
 if page.evaluate('window.__word.G.screen')=='result':page.locator('#screen-result [data-home]').click()
def fixture():
 words=[{'word':'test word '+chr(97+i//26)+chr(97+i%26),'meaning':'테스트 뜻 '+str(i),'group':'테스트 마트'} for i in range(35)]
 words.append({'word':'test other','meaning':'다른 주제 테스트','group':'다른 카테고리'})
 return {'app':'dopa-word','version':1,'revision':0,'custom':words,'xp':123,'answered':4,'correct':3,'settings':{'source':'base','level':1,'count':10,'mode':'spell','groups':[],'muted':True,'motion':0},'progress':{'word:test other':{'signature':json.dumps(['test other','다른 주제 테스트'],ensure_ascii=False,separators=(',',':')),'spell':{'tries':1,'correct':0,'streak':0,'review':True}}}}
def install(page):
 # Use the same import interaction as a real user, with no persistent init hooks.
 page.locator('#open-settings').click()
 page.locator('#restore-file').set_input_files({'name':'category-fixture.json','mimeType':'application/json','buffer':json.dumps(fixture(),ensure_ascii=False).encode('utf8')})
 page.locator('#confirm-ok').click()
 page.wait_for_function("window.__word.state.custom.length===36")
def answer(page,mode,incorrect=False):
 phase(page,'question')
 if mode=='spell':
  value=re.sub('[^a-z]','',page.evaluate('window.__word.G.deck[window.__word.G.i].word'))
  if incorrect:
   page.keyboard.type('z'*len(value));page.wait_for_function('window.__word.G.mistakes>0');page.locator('[data-control="clear"]').click()
  page.keyboard.type(value,delay=1)
 else:
  idx=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.locator(f'[data-choice="{idx}"]').click()
 phase(page,'answered')
def shot(page,name):page.screenshot(path=str(OUT/(name+'.png')))
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,args=['--no-sandbox'])
  for mode,w,h in [('spell',390,844),('choice',1280,800)]:
   context=browser.new_context(viewport={'width':w,'height':h});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));writes=[]
   page.on('request',lambda req:writes.append(req.url) if req.method not in ('GET','HEAD') else None)
   ready(page);install(page);check(mode+': existing records and old defaults retained',page.evaluate("window.__word.state.xp===123&&window.__word.state.settings.source==='base'&&window.__word.state.settings.level===1"))
   check(mode+': existing custom category visible on home',page.locator('[data-home-category="테스트 마트"]').count()==1)
   page.locator('#open-topics').click();check(mode+': custom category shown despite base-only source',page.locator('[data-topic="테스트 마트"]').is_visible())
   page.locator('[data-topic="테스트 마트"]').click();page.locator('#topics-dialog button[value="close"]').click()
   check(mode+': category activates all lengths and all words',page.evaluate("window.__word.state.settings.source==='all'&&window.__word.state.settings.level===0&&window.__word.state.settings.count===0"))
   check(mode+': selected category name and full count shown','테스트 마트' in page.locator('#open-topics').inner_text() and '35단어' in page.locator('#selection-summary').inner_text())
   page.locator(f'[data-mode="{mode}"]').click();shot(page,'categories-'+mode+'-home');page.locator('#start').click();phase(page,'question')
   check(mode+': exactly 35 category targets, no unrelated words',page.evaluate("window.__word.G.deck.length===35&&new Set(window.__word.G.deck.map(w=>w.id)).size===35&&window.__word.G.deck.every(w=>w.group==='테스트 마트')"))
   check(mode+': progress dots capped at 30',page.locator('#pips .pip').count()==30)
   for i in range(35):
    answer(page,mode,incorrect=(mode=='spell' and i==0))
    if i==30:
     check(mode+': page two of progress points updates',page.locator('#qno').inner_text()=='31 / 35' and page.locator('#pips .pip:not([hidden])').count()==5);shot(page,'categories-'+mode+'-31')
    page.locator('#next').click()
   phase(page,'result');check(mode+': full category finishes, no 10-word truncation',page.locator('#r-total').inner_text()=='35개')
   check(mode+': result accuracy computed from all 35',page.locator('#score').inner_text()==('97' if mode=='spell' else '100'))
   check(mode+': muted full sessions do not create inaudible audio graphs',page.evaluate('window.__word.scene.audio.ctx===null'))
   go_home(page);reload_ready(page)
   check(mode+': full count and 35-word history survive reload',page.evaluate('window.__word.state.settings.count===0&&window.__word.state.history.at(-1).total===35'))
   if mode=='spell':
    check('category review excludes unrelated prior mistake',page.locator('#review-count').inner_text()=='1');page.locator('#start-review').click();phase(page,'question');check('review deck only contains selected category',page.evaluate("window.__word.G.deck.length===1&&window.__word.G.deck[0].group==='테스트 마트'"));go_home(page)
   page.locator('#session-count').select_option('10');page.locator('#start').click();phase(page,'question');check(mode+': explicit 10-question sampling still works',page.evaluate('window.__word.G.deck.length')==10);go_home(page)
   page.locator('#open-words').click();page.locator('#list-source').select_option('base');page.locator('#list-group').select_option('테스트 마트');page.locator('#word-search').fill('뜻 0')
   check(mode+': manager selects custom category despite previous source',page.locator('#category-study').is_visible() and '35단어' in page.locator('#category-study-title').inner_text())
   check(mode+': list search only narrows list',page.locator('.word-entry').count()==1);shot(page,'categories-'+mode+'-manager')
   page.locator('#category-spell' if mode=='spell' else '#category-choice').click();phase(page,'question');check(mode+': direct button studies full category ignoring list search',page.evaluate("window.__word.G.deck.length===35&&window.__word.G.mode==='"+mode+"'"));go_home(page)
   check(mode+': other category review is retained',page.evaluate("window.__word.state.progress['word:test other'].spell.review"))
   check(mode+': no vocabulary upload requests',not writes);context.close()
  context=browser.new_context(viewport={'width':320,'height':640});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
  check('separate visitor cannot see another context custom words',page.evaluate('window.__word.state.custom.length')==0 and page.locator('[data-home-category="테스트 마트"]').count()==0)
  page.locator('#open-words').click();page.locator('#bulk-word').click();page.locator('#import-text').fill('word\tmeaning\tgroup\ntest apple\t연습 사과\t연습 장보기\ntest banana\t연습 바나나\t연습 장보기\ntest long phrase\t긴 표현 연습\t연습 장보기');page.locator('#preview-import').click();page.locator('#apply-import').click()
  check('bulk registration selects its new category and clears old short filter',page.evaluate("window.__word.state.settings.groups[0]==='연습 장보기'&&window.__word.state.settings.level===0&&window.__word.state.settings.count===0"))
  page.locator('#screen-words [data-home]').click();check('bulk category appears immediately on home',page.locator('[data-home-category="연습 장보기"]').is_visible())
  page.locator('#source').select_option('base');page.locator('[data-level="1"]').click();page.locator('[data-home-category="연습 장보기"]').click();check('shortcut recovers from conflicting source and length',page.evaluate("window.__word.state.settings.groups[0]==='연습 장보기'&&window.__word.state.settings.source==='all'&&window.__word.state.settings.level===0"))
  page.locator('#open-words').click();page.locator('#add-word').click();page.locator('#edit-word').fill('test newest');page.locator('#edit-meaning').fill('새 단어 연습');page.locator('#edit-group').fill('새 카테고리');page.locator('#edit-form button[type="submit"]').click();check('single registration selects new category',page.evaluate("window.__word.state.settings.groups[0]==='새 카테고리'"));page.locator('#screen-words [data-home]').click()
  page.locator('#open-topics').click();check('single-registration category present in chooser',page.locator('[data-topic="새 카테고리"]').count()==1);page.locator('[data-topic="연습 장보기"]').click();page.locator('#topics-dialog button[value="close"]').click();page.locator('#start').click();phase(page,'question');check('multiple custom categories study together',page.evaluate('window.__word.G.deck.length')==4)
  b=page.locator('#card').bounding_box();check('320px category gameplay stays within width',b and b['x']>=-1 and b['x']+b['width']<=321)
  check('no runtime errors',not errors);context.close();browser.close()
except Exception as exc:
 errors.append(str(exc));traceback.print_exc()
 try:shot(page,'categories-failure')
 except Exception:pass
finally:
 (OUT/'categories-report.json').write_text(json.dumps({'url':URL,'passed':len(checks),'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps({'category_checks':len(checks),'errors':errors},ensure_ascii=False),flush=True)
if errors:sys.exit(1)
