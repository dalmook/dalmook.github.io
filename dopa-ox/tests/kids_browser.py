"""Kids regression: no higher-level questions leak through daily/review/library."""
import json, os, pathlib, sys, traceback
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from playwright.sync_api import sync_playwright
base=os.getenv('OX_URL','http://127.0.0.1:8765/dopa-ox/')
s=urlsplit(base);query=dict(parse_qsl(s.query));query['level']='kids'
url=urlunsplit((s.scheme,s.netloc,s.path,urlencode(query),''))
out=pathlib.Path(os.getenv('OX_OUT','qa/ox'));out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name);print('KIDS PASS',name,flush=True)
def ready(page):
 page.goto(url,wait_until='networkidle');page.wait_for_function("window.__ox?.S.revision==='ox-1.1.0-kids'",timeout=20000)
def phase(page,value):page.wait_for_function('(x)=>window.__ox.S.phase===x',arg=value,timeout=15000)
def finish(page):
 page.locator('#leave-game').click();page.locator('#confirm-leave').click();phase(page,'result');page.locator('#result-home').click()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,args=['--no-sandbox'])
  for w,h in [(320,568),(390,844),(1280,800),(844,390)]:
   context=browser.new_context(viewport={'width':w,'height':h});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
   check(f'{w}: Kids label and grade-one hint',page.locator('[data-rank="1"]').inner_text()=='키즈\n초등 1학년')
   check(f'{w}: Kids selected',page.locator('[data-rank="1"]').get_attribute('aria-pressed')=='true')
   check(f'{w}: legacy label removed','바보' not in page.locator('body').inner_text())
   if w==390:page.screenshot(path=str(out/'kids-home.png'))
   page.locator('#start').click();phase(page,'question')
   check(f'{w}: only new Kids questions',page.evaluate("window.__ox.S.deck.every(q=>q.level===1&&q.id.startsWith('kids-'))"))
   for selector in ['#question-text','#answer-o','#answer-x']:
    b=page.locator(selector).bounding_box();check(f'{w}: {selector} fits horizontally',b and b['x']>=-1 and b['x']+b['width']<=w+1)
   if w==390:page.screenshot(path=str(out/'kids-question.png'))
   value=page.evaluate('window.__ox.S.question.answer');page.locator('#answer-o' if value else '#answer-x').click();phase(page,'answered')
   check(f'{w}: kid answer and explanation work',page.evaluate('window.__ox.S.results.at(-1).correct') and len(page.locator('#explanation-text').inner_text())<=65)
   context.close()
  context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
  page.locator('#start-daily').click();phase(page,'question')
  check('Kids daily is not forced to intermediate',page.evaluate('window.__ox.S.deck.every(q=>q.level===1)'));finish(page)
  page.locator('#start-challenge').click();phase(page,'question');check('Kids challenge also stays in Kids',page.evaluate('window.__ox.S.deck.every(q=>q.level===1)'));finish(page)
  page.locator('#open-library').click();check('Kids library starts filtered',page.locator('#library-rank').input_value()=='1');check('Kids library contains 200 questions',page.locator('#library-count').inner_text().startswith('200문항'))
  page.locator('#library-category').select_option('language');check('10 easy Korean questions',page.locator('.ox-library-item').count()==10);page.screenshot(path=str(out/'kids-hangul.png'));page.locator('#screen-library [data-home]').click()
  saved=page.evaluate("""()=>{const s=window.__ox.state;const kid=window.__ox.bank.find(q=>q.level===1).id;const hard=window.__ox.bank.find(q=>q.level===6).id;s.xp=1234;s.answered=44;s.correct=33;s.review=[kid,hard,'space-001'];s.bookmarks=[hard];s.settings.rank=1;localStorage.setItem('dopa-ox-ko-v1',JSON.stringify(s));return{kid,hard};}""")
  ready(page);check('XP and totals survive replacement',page.evaluate('window.__ox.state.xp===1234&&window.__ox.state.answered===44'))
  check('retired question removed without reusing answer',not page.evaluate("window.__ox.state.review.includes('space-001')"))
  check('Kids review counter ignores hard questions',page.locator('#review-count').inner_text()=='1')
  page.locator('#start-review').click();phase(page,'question');check('Kids review contains only kid question',page.evaluate('window.__ox.S.deck.map(q=>q.id)')==[saved['kid']]);finish(page)
  check('hard review entry is not deleted by Kids filter',page.evaluate('(id)=>window.__ox.state.review.includes(id)',saved['hard']))
  page.locator('[data-rank="6"]').click();page.locator('#start-review').click();phase(page,'question');check('other ranks keep cross-level review',saved['hard'] in page.evaluate('window.__ox.S.deck.map(q=>q.id)'));finish(page)
  page.locator('#start-daily').click();phase(page,'question');check('other ranks keep original daily level',page.evaluate('window.__ox.S.deck.every(q=>q.level===3)'))
  check('no runtime errors',not errors);context.close();browser.close()
except Exception as exc:
 errors.append(str(exc));traceback.print_exc()
 try:page.screenshot(path=str(out/'kids-failure.png'))
 except Exception:pass
finally:
 (out/'kids-report.json').write_text(json.dumps({'url':url,'passed':len(checks),'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'kids_passed':len(checks),'errors':errors},ensure_ascii=False))
if errors:sys.exit(1)
