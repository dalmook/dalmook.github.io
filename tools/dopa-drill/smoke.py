"""Browser smoke test: local-only server, real touch/keyboard inputs."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json, os, re, sys, time
from playwright.sync_api import sync_playwright
ROOT=Path(sys.argv[1]).resolve()
OUT=Path(os.environ.get('QA_OUTPUT','qa-output'));OUT.mkdir(parents=True,exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/?count=6&extra=3'
errors=[]; checks=[]; page=None
def fail_hook(kind,value,tb):
    try:
        page.screenshot(path=str(OUT/'failure.png'),full_page=True)
        (OUT/'failure.txt').write_text(str(value)+'\n'+page.locator('body').inner_text(),encoding='utf-8')
        (OUT/'failure-state.json').write_text(json.dumps(state(page),ensure_ascii=False,default=str),encoding='utf-8')
    except Exception:pass
    (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'failure':str(value)},ensure_ascii=False,indent=2),encoding='utf-8')
    sys.__excepthook__(kind,value,tb)
sys.excepthook=fail_hook
def check(name,condition=True):
    if not condition: raise AssertionError(name)
    checks.append(name);print('PASS',name,flush=True)
def dismiss(page):
    for _ in range(16):
        found=False
        for sel in ['#guide-skip','#bonus-ok','#tg-ok','#hammer-no']:
            if page.locator(sel).is_visible():
                page.locator(sel).click();page.wait_for_timeout(180);found=True
        if not found:break
def screenshot(page,name):
    page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
def state(page):
    return page.evaluate('''()=> {let s=window.__dopa.S;return {screen:s.screen,ready:s.ready,step:s.step,qi:s.qi,solved:s.solved,misses:s.misses,reduced:s.reduced,mode:s.mode,confirm:s.confirm,expected:s.problem?.steps[s.step]?.digit,problem:s.problem,extra:s.extra}}''')
def solve(page, wrong=False, touch=False):
    end=time.monotonic()+110;count=0;wrong_done=False
    while time.monotonic()<end:
        dismiss(page)
        s=state(page)
        if s['screen']!='play':break
        if s['ready'] and s.get('expected') is not None:
            key=str(s['expected'])
            if wrong and not wrong_done:
                page.keyboard.press(str((int(key)+1)%10));page.wait_for_timeout(150)
                check('wrong answer increments misses',state(page)['misses']>=1)
                page.keyboard.press('Backspace');wrong_done=True;page.wait_for_timeout(100)
            if touch:page.locator(f'#pad button[data-key="{key}"]').tap()
            else:page.keyboard.press(key)
            count+=1
        page.wait_for_timeout(70)
    check('round reaches result',state(page)['screen'] in ['result','final'])
    return count
with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.environ.get('CHROMIUM_EXECUTABLE'):launch['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
    browser=pw.chromium.launch(**launch)
    context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale='ko-KR',device_scale_factor=1)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:errors.append(f'HTTP {r.status} {r.url}') if r.status>=400 else None)
    page.on('requestfailed',lambda r:errors.append(f'FAILED {r.url} {r.failure}'))
    page.goto(URL);page.wait_for_function('!!window.__dopa?.S');page.wait_for_timeout(700)
    check('Korean document language',page.locator('html').get_attribute('lang')=='ko')
    screenshot(page,'01-mobile-guide');dismiss(page)
    screenshot(page,'02-mobile-title')
    print('TITLE',page.locator('#screen-title').inner_text(),flush=True)
    check('title has no Japanese',not re.search('[ぁ-んァ-ン一-龯]',page.locator('#screen-title').inner_text()))
    check('no mobile horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    page.locator('#open-settings').click();screenshot(page,'03-mobile-settings')
    page.locator('[data-count="6"]').click()
    page.locator('#motion').fill('0');page.locator('#motion').dispatch_event('input');page.locator('#motion').dispatch_event('change')
    page.locator('#close-settings').click()
    check('reduced motion saved',state(page)['reduced'])
    for name,open_sel,back_sel,screen in [('tree','#open-tree','#tree-back','#screen-tree'),('trophies','#open-trophy','#trophy-back','#screen-trophy'),('collection','#open-collect','#collect-back','#screen-collect')]:
        page.locator(open_sel).click();page.wait_for_timeout(300)
        check(name+' screen Korean',not re.search('[ぁ-んァ-ン一-龯]',page.locator(screen).inner_text()))
        screenshot(page,'04-mobile-'+name);page.locator(back_sel).click()
    page.locator('[data-grade="1"]').click();page.wait_for_function('window.__dopa.S.screen === "play" && window.__dopa.S.ready')
    screenshot(page,'05-mobile-play')
    check('play area has no Japanese',not re.search('[ぁ-んァ-ン一-龯]',page.locator('#screen-play').inner_text()))
    solve(page,wrong=True,touch=True);screenshot(page,'06-mobile-result')
    check('result shows six completed questions','6' in page.locator('#r-ok').inner_text())
    check('review offered',page.locator('#go-review').is_visible())
    print('RESULT',page.locator('#screen-result').inner_text(),flush=True)
    page.locator('#go-review').click();page.wait_for_function('window.__dopa.S.screen === "play" && window.__dopa.S.ready')
    check('review can start');solve(page,touch=True)
    page.locator('#go-title').click();dismiss(page)
    page.locator('[data-grade="6"]').click();page.wait_for_function('window.__dopa.S.screen === "play" && window.__dopa.S.ready')
    check('grade6 starts');screenshot(page,'07-mobile-grade6');solve(page)
    check('extra unlocked',page.locator('#go-extra').is_visible())
    page.locator('#go-extra').click();page.wait_for_function('window.__dopa.S.screen === "play"');screenshot(page,'08-mobile-extra')
    page.wait_for_function('window.__dopa.S.screen === "final"',timeout=20000)
    dismiss(page);screenshot(page,'09-mobile-final');check('extra round completes')
    check('localStorage persists Korean profile',page.evaluate('!!localStorage.getItem("dopa-drill-ko:v1")'))
    page.reload();page.wait_for_function('!!window.__dopa?.S');page.wait_for_timeout(500);dismiss(page)
    check('reload retains settings',state(page)['reduced'])
    page.locator('#start').click();page.wait_for_function('window.__dopa.S.screen === "play" && window.__dopa.S.ready')
    check('placement mode starts')
    page.keyboard.press('Escape');page.wait_for_timeout(200)
    check('quit confirmation works',page.locator('#confirm-yes').is_visible());page.locator('#confirm-yes').click();dismiss(page)
    for grade in [2,3,4,5]:
        page.locator(f'[data-grade="{grade}"]').click();page.wait_for_function('window.__dopa.S.screen === "play" && window.__dopa.S.ready')
        check(f'grade {grade} starts in Korean',not re.search('[ぁ-んァ-ン一-龯]',page.locator('#screen-play').inner_text()))
        page.keyboard.press('Escape');page.locator('#confirm-yes').click();dismiss(page)
    context.close()
    desk=browser.new_context(viewport={'width':1280,'height':900},locale='ko-KR');page=desk.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL);page.wait_for_function('!!window.__dopa?.S');page.wait_for_timeout(700);dismiss(page)
    screenshot(page,'10-desktop-title');page.locator('[data-grade="3"]').click();page.wait_for_function('window.__dopa.S.screen === "play" && window.__dopa.S.ready');screenshot(page,'11-desktop-play')
    digit=state(page)['expected'];page.keyboard.press(str(digit));page.wait_for_timeout(1000)
    check('desktop keyboard accepts input',state(page)['step']>=1 or state(page)['qi']>=1)
    check('desktop WebAudio started',page.evaluate('window.__dopa.audio.ctx?.state === "running"'))
    check('no browser errors',not errors)
    browser.close()
server.shutdown()
(OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'passed':len(checks)},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks),'errors':errors},ensure_ascii=False))
