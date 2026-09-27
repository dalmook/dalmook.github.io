"""Korean game browser QA. Run: python smoke.py PATH_TO_APP."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json, os, re, sys, time
from playwright.sync_api import sync_playwright
ROOT=Path(sys.argv[1]).resolve()
OUT=Path(os.environ.get('QA_OUTPUT','qa-output'));OUT.mkdir(parents=True,exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/?extra=3'
checks=[];errors=[]
def check(name,ok=True):
    assert ok,name
    checks.append(name);print('PASS',name,flush=True)
def shot(page,name):page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
def state(page):
    return page.evaluate('''()=>{const s=__dopa.S;return {screen:s.screen,ready:s.ready,step:s.step,qi:s.qi,misses:s.misses,reduced:s.reduced,mode:s.mode,scene:!!s.scene,expected:s.problem?.steps[s.step]?.digit}}''')
def dismiss(page,settle=True):
    # Title rewards are intentionally queued 500 ms after closing the guide.
    if settle:page.wait_for_timeout(700)
    for _ in range(24):
        acted=False
        for selector in ['#guide-skip','#bonus-ok','#tg-ok','#hammer-no']:
            if page.locator(selector).is_visible():
                page.locator(selector).click();page.wait_for_timeout(650);acted=True
        if not acted:break
def korean(page,selector):
    text=page.locator(selector).inner_text()
    check(selector+' Korean',not re.search('[ぁ-んァ-ン一-龯]',text))
def start_grade(page,grade):
    dismiss(page);page.locator(f'[data-grade="{grade}"]').click()
    page.wait_for_function('__dopa.S.screen === "play" && __dopa.S.ready')
    korean(page,'#screen-play')
def quit_game(page):
    dismiss(page)
    page.keyboard.press('Escape');page.locator('#confirm-yes').wait_for(state='visible');page.locator('#confirm-yes').click();dismiss(page)
def solve(page,wrong=False,touch=False):
    deadline=time.monotonic()+110;wrong_questions=set()
    while time.monotonic()<deadline:
        dismiss(page,False);s=state(page)
        if s['screen']!='play':break
        if s['ready'] and s.get('expected') is not None:
            key=str(s['expected'])
            # Two first-attempt mistakes put a six-question round below 80%,
            # which is the original game's condition for the review button.
            if wrong and len(wrong_questions)<2 and s['qi'] not in wrong_questions:
                page.keyboard.press(str((int(key)+1)%10));page.wait_for_timeout(100)
                check('wrong answer counted',state(page)['misses']>s['misses'])
                page.keyboard.press('Backspace');wrong_questions.add(s['qi'])
            if touch:page.locator(f'#pad button[data-key="{key}"]').tap()
            else:page.keyboard.press(key)
        page.wait_for_timeout(75)
    check('round completes',state(page)['screen'] in ['result','final'])
    dismiss(page)
def run(browser):
    global page
    mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale='ko-KR')
    page=mobile.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:errors.append(f'{r.url}: {r.failure}'))
    page.on('response',lambda r:errors.append(f'HTTP {r.status}: {r.url}') if r.status>=400 else None)
    page.goto(URL);page.wait_for_function('!!window.__dopa?.S');page.wait_for_timeout(700);shot(page,'01-mobile-guide');dismiss(page)
    check('document language ko',page.locator('html').get_attribute('lang')=='ko');korean(page,'#screen-title');shot(page,'02-mobile-title')
    check('no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.locator('#open-settings').click();shot(page,'03-mobile-settings');page.locator('[data-count="6"]').click()
    page.locator('#motion').fill('0');page.locator('#motion').dispatch_event('input');page.locator('#motion').dispatch_event('change');page.locator('#close-settings').click()
    check('reduced motion saved',state(page)['reduced'])
    for name in ['tree','trophy','collect']:
        page.locator('#open-'+name).click();page.wait_for_timeout(250);korean(page,'#screen-'+name);shot(page,'04-mobile-'+name);page.locator('#'+name+'-back').click()
    start_grade(page,1);shot(page,'05-mobile-play');solve(page,wrong=True,touch=True);shot(page,'06-mobile-result');korean(page,'#screen-result')
    check('six questions completed','6' in page.locator('#r-ok').inner_text());check('review offered',page.locator('#go-review').is_visible())
    page.locator('#go-review').click();page.wait_for_function('__dopa.S.screen === "play" && __dopa.S.ready');check('review starts');solve(page,touch=True)
    page.locator('#go-title').click();dismiss(page)
    start_grade(page,6);shot(page,'07-mobile-grade6');solve(page)
    check('bonus unlocked',page.locator('#go-extra').is_visible());page.locator('#go-extra').click();page.wait_for_function('__dopa.S.screen === "play"');shot(page,'08-mobile-extra')
    page.wait_for_function('__dopa.S.screen === "final"',timeout=20000);dismiss(page);shot(page,'09-mobile-final');korean(page,'#screen-final');check('bonus completes')
    check('local save exists',page.evaluate('!!localStorage.getItem("dopa-drill-ko:v1")'))
    page.reload();page.wait_for_function('!!window.__dopa?.S');dismiss(page);check('settings survive reload',state(page)['reduced'])
    page.locator('#start').click();page.wait_for_function('__dopa.S.screen === "play" && __dopa.S.ready');check('placement starts');quit_game(page);check('quit confirmation works')
    for grade in [2,3,4,5]:start_grade(page,grade);check(f'grade {grade} starts');quit_game(page)
    mobile.close()
    desktop=browser.new_context(viewport={'width':1280,'height':900},locale='ko-KR');page=desktop.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL);page.wait_for_function('!!window.__dopa?.S');dismiss(page);shot(page,'10-desktop-title');start_grade(page,3);shot(page,'11-desktop-play')
    before=state(page);page.keyboard.press(str(before['expected']));page.wait_for_timeout(1500)
    check('keyboard input accepted',state(page)['step']!=before['step'] or state(page)['qi']!=before['qi'])
    check('WebAudio running',page.evaluate('__dopa.audio.ctx?.state==="running"'));check('no browser errors',not errors)
with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.environ.get('CHROMIUM_EXECUTABLE'):launch['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
    browser=pw.chromium.launch(**launch)
    try:
        run(browser)
    except Exception as exc:
        try:
            shot(page,'failure');(OUT/'failure.txt').write_text(str(exc)+'\n'+page.locator('body').inner_text(),encoding='utf-8')
            print('FAILURE_STATE',json.dumps(state(page)),flush=True)
        except Exception:pass
        (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'failure':str(exc)},ensure_ascii=False,indent=2),encoding='utf-8')
        raise
    finally:browser.close();server.shutdown()
(OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks),'errors':errors}))
