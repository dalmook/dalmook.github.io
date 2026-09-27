"""Run against local or public Pages. No production debug mutation of answers."""
import json, os, pathlib, sys, traceback
from playwright.sync_api import sync_playwright
URL=os.getenv('OX_URL','http://127.0.0.1:8765/dopa-ox/')
OUT=pathlib.Path(os.getenv('OX_OUT','qa/ox'));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name, condition=True):
    if not condition: raise AssertionError(name)
    checks.append(name);print('PASS',name,flush=True)
def ready(page):
    page.goto(URL,wait_until='networkidle');page.wait_for_function("document.documentElement.dataset.oxReady==='true'",timeout=20000)
def phase(page,value): page.wait_for_function('(p)=>window.__ox.S.phase===p',value,timeout=15000)
def play_answer(page,correct=True):
    phase(page,'question');value=page.evaluate('window.__ox.S.question.answer');value=value if correct else not value
    page.locator('#answer-o' if value else '#answer-x').click();phase(page,'answered')
    check('answer verdict matches selection',page.evaluate('window.__ox.S.results.at(-1).correct')==correct)
def screenshot(page,name):page.screenshot(path=str(OUT/(name+'.png')))
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    for width,height in [(320,568),(360,640),(390,844),(430,932),(768,1024),(1280,800),(844,390)]:
        context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        ready(page);check(f'{width}x{height}: ready and 1200 questions',page.evaluate('window.__ox.bank.length')==1200)
        if width in (390,1280):screenshot(page,f'{width}-home')
        check(f'{width}: six retro difficulty buttons',page.locator('[data-rank]').count()==6)
        page.locator('[data-rank="3"]').click();page.locator('#start').click();phase(page,'question')
        check(f'{width}: real selected rank',page.evaluate('window.__ox.S.question.level')==3)
        for selector in ['#answer-o','#answer-x','#question-text']:
            box=page.locator(selector).bounding_box();check(f'{width}: {selector} horizontal bounds',box and box['x']>=-1 and box['x']+box['width']<=width+1)
        if width==390:
            before=page.locator('#actors-back').inner_html();page.wait_for_timeout(180);after=page.locator('#actors-back').inner_html();check('original mascot animates',before!=after)
        play_answer(page,True)
        check(f'{width}: explanation and source',page.locator('#explanation-text').inner_text() and page.locator('#source-link').get_attribute('href'))
        if width in (390,1280):screenshot(page,f'{width}-answer')
        context.close()
    context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
    page.evaluate("localStorage.setItem('dopa-arithmetic-sentinel','preserve-me')")
    page.locator('#start').click();phase(page,'question');first_wrong=page.evaluate('window.__ox.S.question.id');play_answer(page,False)
    check('wrong answer added to review',page.evaluate('(id)=>window.__ox.state.review.includes(id)',first_wrong))
    page.locator('#bookmark-question').click();check('bookmark saved',page.evaluate('(id)=>window.__ox.state.bookmarks.includes(id)',first_wrong))
    count=page.evaluate('window.__ox.S.results.length');page.evaluate("document.querySelector('#answer-o').click();document.querySelector('#answer-x').click()")
    check('answer locking blocks double submissions',page.evaluate('window.__ox.S.results.length')==count)
    for i in range(1,10):
        page.locator('#next-question').click();play_answer(page,True)
        if i==8:screenshot(page,'390-fever')
    page.locator('#next-question').click();phase(page,'result');check('10-question session score is 90',page.locator('#r-score').inner_text()=='90');screenshot(page,'390-result')
    check('high energy and added music layers',page.evaluate('window.__ox.S.E>.9 && window.__ox.audio.level>=9'))
    check('arithmetic storage unchanged',page.evaluate("localStorage.getItem('dopa-arithmetic-sentinel')")=='preserve-me')
    check('result persisted',page.evaluate('window.__ox.state.sessions')==1)
    page.locator('#result-home').click();page.reload(wait_until='networkidle');page.wait_for_function("document.documentElement.dataset.oxReady==='true'")
    check('state survives reload',page.evaluate('window.__ox.state.answered')==10)
    page.locator('#start-review').click();play_answer(page,True);check('review repair removes solved question',page.evaluate('(id)=>!window.__ox.state.review.includes(id)',first_wrong));page.locator('#next-question').click();phase(page,'result');page.locator('#result-home').click()
    page.locator('#open-library').click();page.locator('#library-bookmarks').check();check('bookmarked library filter',page.locator('.ox-library-item').count()==1);page.locator('.ox-library-item summary').click();check('library explanation opens',page.locator('.ox-library-item details').get_attribute('open') is not None);screenshot(page,'390-library');page.locator('#screen-library [data-home]').click()
    page.locator('#open-categories').click();page.locator('[data-category="animals"]').click();page.locator('#category-dialog button[value="close"]').click();page.locator('[data-rank="6"]').click();page.locator('#start').click();phase(page,'question');check('category and difficulty both honored',page.evaluate("window.__ox.S.deck.every(q=>q.category==='animals'&&q.level===6)"));page.locator('#leave-game').click();page.locator('#confirm-leave').click();phase(page,'result');page.locator('#result-home').click()
    page.locator('#open-settings').click();page.locator('#set-motion').select_option('0');page.locator('#set-mute').check();page.locator('#close-settings').click();check('reduced motion and mute persist',page.evaluate("document.body.classList.contains('reduced')&&window.__ox.audio.muted"))
    page.locator('#start-challenge').click();phase(page,'question');t=page.evaluate('window.__ox.S.elapsed');page.wait_for_timeout(220);check('challenge clock counts during question',page.evaluate('window.__ox.S.elapsed')>t);play_answer(page,True);t=page.evaluate('window.__ox.S.elapsed');page.wait_for_timeout(250);check('challenge clock pauses during explanation',abs(page.evaluate('window.__ox.S.elapsed')-t)<50)
    page.locator('#next-question').click();phase(page,'question');page.locator('#leave-game').click();t=page.evaluate('window.__ox.S.elapsed');page.wait_for_timeout(250);check('challenge clock pauses in dialog',abs(page.evaluate('window.__ox.S.elapsed')-t)<50);page.locator('#confirm-dialog button[value="continue"]').click();page.locator('#leave-game').click();page.locator('#confirm-leave').click();phase(page,'result');page.locator('#result-home').click()
    page.locator('#open-trophy').click();check('12 trophies render',page.locator('.ox-trophy').count()==12);page.locator('#screen-trophy [data-home]').click();page.locator('#open-collect').click();check('all collection groups render',page.locator('[data-look]').count()==27);page.locator('#screen-collect [data-home]').click()
    page.locator('#start-daily').click();phase(page,'question');daily=page.evaluate('window.__ox.S.deck.map(q=>q.id)');page.locator('#leave-game').click();page.locator('#confirm-leave').click();phase(page,'result');page.locator('#result-home').click();page.locator('#start-daily').click();phase(page,'question');check('daily seed is stable',page.evaluate('window.__ox.S.deck.map(q=>q.id)')==daily)
    check('no JavaScript runtime errors',not errors);context.close();browser.close()
except Exception as e:
    errors.append(str(e));traceback.print_exc()
    try:screenshot(page,'failure');(OUT/'failure.html').write_text(page.content(),encoding='utf-8')
    except Exception:pass
finally:
    (OUT/'report.json').write_text(json.dumps({'url':URL,'passed':len(checks),'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'passed':len(checks),'errors':errors},ensure_ascii=False),flush=True)
if errors:sys.exit(1)
