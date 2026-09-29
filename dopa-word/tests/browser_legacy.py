"""Real Chromium interaction. Exposed state is read for answers, not used to bypass input."""
import json, os, pathlib, re, sys, traceback
from playwright.sync_api import sync_playwright
URL=os.getenv('WORD_URL','http://127.0.0.1:8765/dopa-word/')
OUT=pathlib.Path(os.getenv('WORD_OUT','qa/word'));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok=True):
 if not ok:raise AssertionError(name)
 checks.append(name);print('PASS',name,flush=True)
def ready(page):
 page.goto(URL,wait_until='networkidle');page.wait_for_function("document.documentElement.dataset.wordReady==='true'",timeout=20000)
def phase(page,p):page.wait_for_function('(p)=>window.__word.G.phase===p',arg=p,timeout=15000)
def target(page):return page.evaluate('window.__word.G.deck[window.__word.G.i].word')
def type_answer(page):
 phase(page,'question');page.keyboard.type(re.sub('[^a-z]','',target(page)),delay=5);phase(page,'answered')
def stop(page):
 page.locator('#leave').click();page.locator('#confirm-ok').click()
 if page.evaluate('window.__word.G.phase')=='result':page.locator('#screen-result [data-home]').click()
def single(page,word,meaning,group='테스트 단어장'):
 page.locator('#add-word').click();page.locator('#edit-word').fill(word);page.locator('#edit-meaning').fill(meaning);page.locator('#edit-group').fill(group);page.locator('#edit-form button[type="submit"]').click();page.wait_for_function("!document.querySelector('#edit-dialog').open")
def shot(page,name):page.screenshot(path=str(OUT/(name+'.png')))
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,args=['--no-sandbox'])
  for w,h in [(320,568),(360,640),(390,844),(430,932),(768,1024),(1280,800),(844,390)]:
   context=browser.new_context(viewport={'width':w,'height':h});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
   check(f'{w}: 240 default words and Korean mode labels',page.evaluate('window.__word.base.length')==240 and page.locator('[data-mode="spell"]').inner_text().startswith('⌨ 스펠링'))
   if w in (390,1280):shot(page,f'{w}-home')
   page.locator('#start').click();phase(page,'question');check(f'{w}: 26 on-screen alphabet keys',page.locator('[data-key]').count()==26)
   for sel in ['#card','#keyboard']:
    box=page.locator(sel).bounding_box();check(f'{w}: {sel} fits screen width',box and box['x']>=-1 and box['x']+box['width']<=w+1)
   if w in (390,1280):shot(page,f'{w}-spell')
   word=target(page);first=re.sub('[^a-z]','',word)[0];page.locator(f'[data-key="{first}"]').click();page.keyboard.type(re.sub('[^a-z]','',word)[1:],delay=10);phase(page,'answered')
   check(f'{w}: pointer and physical keyboard spell correctly',page.locator('#answer-word').inner_text()==word)
   page.locator('#leave').click();page.locator('#confirm-ok').click();page.locator('#screen-result [data-home]').click();page.locator('[data-mode="choice"]').click();page.locator('#start').click();phase(page,'question')
   check(f'{w}: four multiple-choice buttons',page.locator('[data-choice]').count()==4)
   i=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.locator(f'[data-choice="{i}"]').click();phase(page,'answered');check(f'{w}: meaning answer works',page.evaluate('window.__word.G.results.at(-1).clean'))
   if w==390:shot(page,'390-choice-result')
   context.close()
  context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
  page.evaluate("localStorage.setItem('arithmetic-sentinel','do-not-change');localStorage.setItem('ox-sentinel','keep')")
  page.locator('#start').click();phase(page,'question')
  word=target(page);bad='z'*len(re.sub('[^a-z]','',word));page.keyboard.type(bad);page.wait_for_function('window.__word.G.mistakes===1')
  check('wrong spelling stays playable',page.evaluate("window.__word.G.phase==='question'"));page.locator('[data-control="clear"]').click();type_answer(page)
  check('corrected attempt is recorded for review, not inflated accuracy',not page.evaluate('window.__word.G.results.at(-1).clean'))
  page.locator('#next').click();phase(page,'question');page.locator('#hint').click();remaining=page.evaluate('window.__word.G.deck[window.__word.G.i].word.replace(/[^a-z]/g,"").slice(window.__word.G.buffer.length)');page.keyboard.type(remaining);phase(page,'answered');check('hinted word is marked assisted',page.evaluate('window.__word.G.results.at(-1).assisted'))
  for i in range(2,10):page.locator('#next').click();type_answer(page)
  shot(page,'390-fever');page.locator('#next').click();phase(page,'result');check('10-word completion scores 80 for eight first-try answers',page.locator('#score').inner_text()=='80');check('original soundtrack and stage reach level 10',page.evaluate('window.__word.scene.audio.level>=10'));shot(page,'390-result')
  page.locator('#screen-result [data-home]').click();check('two spelling mistakes queued',page.locator('#review-count').inner_text()=='2');page.reload(wait_until='networkidle');page.wait_for_function("document.documentElement.dataset.wordReady==='true'");check('learning survives reload',page.evaluate('window.__word.state.answered')==10)
  page.locator('[data-mode="choice"]').click();check('choice review is independent',page.locator('#review-count').inner_text()=='0')
  page.locator('#open-words').click();single(page,'kiwi','키위');check('single word saved',page.evaluate("window.__word.state.custom.some(w=>w.word==='kiwi')"))
  page.locator('#study-custom').click();phase(page,'question');check('one-word custom book uses four fallback choices',page.locator('[data-choice]').count()==4 and target(page)=='kiwi');wrong=page.evaluate('window.__word.G.options.findIndex(o=>!o.correct)');page.locator(f'[data-choice="{wrong}"]').click();page.wait_for_function("window.__word.G.phase==='question'&&window.__word.G.mistakes===1");check('wrong option disabled but game continues',page.locator(f'[data-choice="{wrong}"]').is_disabled());right=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.keyboard.press(str(right+1));phase(page,'answered');page.locator('#next').click();phase(page,'result');check('guessing does not produce a first-try point',page.locator('#score').inner_text()=='0');page.locator('#screen-result [data-home]').click()
  page.locator('#open-words').click();page.locator('#bulk-word').click();page.locator('#import-text').fill('word\tmeaning\tgroup\npear\t배 과일\t우리반\nkiwi\t키위 새 뜻\t우리반\nt-shirt\t티셔츠\t우리반\ndon\'t\t~하지 마\t우리반\npear\t중복\t우리반\n123\t잘못된 영어\t우리반');page.locator('#preview-import').click()
  check('bulk preview counts valid, duplicate and invalid rows',page.locator('#apply-import').inner_text()=='정상 3개 등록 (오류 행 제외)');check('preview does not mutate saved words',page.evaluate('window.__word.state.custom.length')==1);shot(page,'390-import');page.locator('#apply-import').click();check('only three valid new words imported',page.evaluate('window.__word.state.custom.length')==4)
  page.locator('#bulk-word').click();page.locator('#import-text').fill('kiwi,키위 열매');page.locator('#overwrite').check();page.locator('#preview-import').click();page.locator('#apply-import').click();check('explicit overwrite updates meaning',page.evaluate("window.__word.state.custom.find(w=>w.word==='kiwi').meaning")=='키위 열매')
  single(page,'safe','<img src=x onerror="window.badHTML=1">');check('user markup is rendered as text',page.locator('#word-list img').count()==0 and page.evaluate('window.badHTML===undefined'))
  page.locator('#word-search').fill('kiwi');page.locator('[data-edit="word:kiwi"]').click();page.locator('#edit-meaning').fill('맛있는 키위');page.locator('#edit-form button[type="submit"]').click();check('single edit persists',page.locator('#word-list').inner_text().find('맛있는 키위')>=0);page.locator('#word-search').fill('')
  with page.expect_download() as dl:page.locator('#export-words').click()
  csv=dl.value;csv.save_as(str(OUT/'custom-words.csv'));check('CSV export has BOM', (OUT/'custom-words.csv').read_bytes().startswith(b'\xef\xbb\xbf'))
  page.locator('#bulk-word').click();page.locator('#overwrite').uncheck();page.locator('#import-file').set_input_files({'name':'more.csv','mimeType':'text/csv','buffer':'word,meaning,group\npeanut,"땅콩, 견과류",간식'.encode('utf8')});page.wait_for_function("!document.querySelector('#apply-import').disabled");page.locator('#apply-import').click();check('quoted CSV file upload succeeds',page.evaluate("window.__word.state.custom.some(w=>w.word==='peanut'&&w.meaning==='땅콩, 견과류')"))
  page.locator('#word-search').fill('safe');page.locator('[data-delete="word:safe"]').click();page.locator('#confirm-ok').click();check('individual delete succeeds',not page.evaluate("window.__word.state.custom.some(w=>w.word==='safe')"));page.locator('#word-search').fill('');shot(page,'390-wordbook')
  page.locator('#screen-words [data-home]').click();page.locator('#open-settings').click();page.locator('#set-motion').select_option('0');page.locator('#set-muted').check();check('reduced motion and mute applied',page.evaluate('window.__word.scene.audio.muted&&window.__word.state.settings.motion===0'))
  with page.expect_download() as dl:page.locator('#backup').click()
  backup=dl.value;backup.save_as(str(OUT/'record-backup.json'));saved=json.loads((OUT/'record-backup.json').read_text());check('backup includes custom words and learning records',len(saved['custom'])==5 and saved['answered']>=11)
  page.locator('#settings button[value="close"]').click();page.locator('[data-mode="spell"]').click();page.locator('#open-words').click();page.locator('#word-search').fill('t-shirt');page.locator('#screen-words [data-home]').click();page.locator('#source').select_option('custom');page.locator('#start').click();phase(page,'question')
  for i in range(5):
   type_answer(page)
   if i<4:page.locator('#next').click()
  page.locator('#next').click();phase(page,'result');check('phrases, apostrophe and hyphen spell with automatic separators',page.locator('#score').inner_text()=='100')
  check('original game storage sentinel untouched',page.evaluate("localStorage.getItem('arithmetic-sentinel')==='do-not-change'&&localStorage.getItem('ox-sentinel')==='keep'"));context.close()
  context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page);page.locator('#open-settings').click();page.locator('#restore-file').set_input_files(str(OUT/'record-backup.json'));page.locator('#confirm-ok').click();check('JSON import restores words into a fresh browser',page.evaluate('window.__word.state.custom.length')==5);check('JSON import restores previous progress',page.evaluate('window.__word.state.answered')==saved['answered']);page.reload(wait_until='networkidle');page.wait_for_function("document.documentElement.dataset.wordReady==='true'");check('restored data survives reload',page.evaluate('window.__word.state.custom.length')==5)
  page.locator('#open-progress').click();check('progress covers topics and saved sessions',page.locator('.progress-topic').count()>=12);page.locator('#screen-progress [data-home]').click();page.locator('#open-collection').click();check('27 original customization options render',page.locator('[data-look]').count()==27);context.close()
  context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page);check('system reduced-motion preference respected on first visit',page.evaluate('window.__word.state.settings.motion')==0)
  check('no JavaScript runtime errors',not errors);context.close();browser.close()
except Exception as e:
 errors.append(str(e));traceback.print_exc()
 try:shot(page,'failure');(OUT/'failure.html').write_text(page.content(),encoding='utf8')
 except Exception:pass
finally:
 (OUT/'report.json').write_text(json.dumps({'url':URL,'passed':len(checks),'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps({'passed':len(checks),'errors':errors},ensure_ascii=False),flush=True)
if errors:sys.exit(1)
