"""Real-browser integration tests of Action 2.0, against the ORIGINAL math/session app.
This is separate from the local renderer harness. No guessed answers, fake tests or mocked saves.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from fractions import Fraction
import argparse, json, os, math, re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('QA_OUTPUT', '/tmp/tori-action-qa'))
OUT.mkdir(parents=True, exist_ok=True)
args = argparse.ArgumentParser()
args.add_argument('--url')
opts = args.parse_args()
checks, errors = [], []
def check(label, value):
    assert value, label
    checks.append(label)
    print('PASS', label, flush=True)
def solve(text):
    if '최대공약수' in text:
        a,b = map(int, re.findall(r'\d+', text)); return str(math.gcd(a,b))
    if '%' in text:
        a,b = map(int, re.findall(r'\d+', text)); return str(Fraction(a*b,100))
    if ':' in text:
        a,b,c = map(int, re.findall(r'\d+', text)); return str(Fraction(b*c,a))
    a,op,b = text.split(' '); a,b = Fraction(a),Fraction(b)
    return str({'+': lambda:a+b, '−':lambda:a-b, '×':lambda:a*b, '÷':lambda:a/b}[op]())
def answer(page, touch=False):
    solution = solve(page.locator('#expression').inner_text())
    if touch:
        for char in solution: page.locator(f'#keypad [data-key="{char}"]').click()
        page.locator('#submitButton').click()
    else:
        page.keyboard.type(solution)
        page.keyboard.press('Enter')
def ready(page):
    page.wait_for_function("() => !document.querySelector('#submitButton').disabled", timeout=5000)
    page.wait_for_timeout(110)
def save(page):
    return page.evaluate("JSON.parse(localStorage.getItem('tori-math-adventure:v1') || '{}')")
server = None
if opts.url:
    base = opts.url
else:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args): pass
    server = ThreadingHTTPServer(('127.0.0.1',0), partial(QuietHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    for width,height in [(1440,900),(390,844),(360,640),(360,740),(768,1024),(1024,768),(844,390)]:
        ctx = browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,has_touch=True,is_mobile=width<760,record_video_dir=str(OUT/'video') if width in (1440,390) else None)
        page = ctx.new_page()
        page.on('pageerror',lambda e:errors.append(str(e)))
        try:
            page.goto(base,wait_until='networkidle')
            page.wait_for_function("() => document.documentElement.dataset.toriVersion === '2.0.0'")
            page.wait_for_timeout(300)
            check(f'{width}x{height}: original six worlds preserved',page.locator('.world-card').count()==6)
            check(f'{width}x{height}: home width contained',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            if width in (1440,390): page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
            page.locator('#startAdventure').click()
            page.locator('#game').wait_for(state='visible')
            page.wait_for_timeout(400)
            check(f'{width}x{height}: renderer installed',page.locator('#arenaCanvas').get_attribute('data-renderer')=='action-2.0')
            metrics=page.evaluate('''() => {const r=s=>{const a=document.querySelector(s).getBoundingClientRect();return {x:a.x,y:a.y,w:a.width,h:a.height,r:a.right,b:a.bottom}};return {w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,canvas:r('#arenaCanvas'),board:r('.math-board'),deck:r('.control-deck'),button:r('#submitButton')}}''')
            (OUT/f'metrics-{width}x{height}.json').write_text(json.dumps(metrics,indent=2))
            check(f'{width}x{height}: full viewport canvas',metrics['canvas']['w']>=width-1 and metrics['canvas']['h']>=height-1)
            check(f'{width}x{height}: no page overflow',metrics['sw']<=width+1 and metrics['sh']<=height+1)
            a,b=metrics['board'],metrics['deck']
            check(f'{width}x{height}: question and keypad do not overlap',a['r']<=b['x']+1 or b['r']<=a['x']+1 or a['b']<=b['y']+1 or b['b']<=a['y']+1)
            check(f'{width}x{height}: submit button in viewport',0<=metrics['button']['y'] and metrics['button']['b']<=height+1)
            page.evaluate("window.actionEvents=[];['input','attack','impact'].forEach(type=>document.addEventListener('tori:'+type,e=>window.actionEvents.push({type,kind:e.detail.kind,heat:e.detail.heat})))")
            # A correct input triggers animated transport and a real solved question.
            answer(page,touch=width<760);page.wait_for_timeout(280)
            check(f'{width}x{height}: answer causes input and attack events',page.evaluate("actionEvents.some(e=>e.type==='input') && actionEvents.some(e=>e.type==='attack')"))
            page.screenshot(path=str(OUT/f'attack-{width}.png'))
            ready(page)
            if width in (1440,390):
                for i in range(1,10):
                    if i==2:
                        phase=page.locator('body').get_attribute('data-fever')
                        page.keyboard.type('999');page.keyboard.press('Enter')
                        check(f'{width}px: a mistake does not drain stage energy',page.locator('body').get_attribute('data-fever')==phase)
                    answer(page,touch=width==390)
                    if i==9:
                        page.locator('#resultHome').wait_for(state='visible',timeout=5000)
                    else:
                        ready(page)
                    if i==4:
                        check(f'{width}px: five answers unlock the real ultimate',page.locator('#ultimateButton').is_enabled())
                        before=page.locator('#questionIndex').inner_text()
                        page.locator('#ultimateButton').click()
                        page.wait_for_timeout(400)
                        page.screenshot(path=str(OUT/f'ultimate-{width}.png'))
                        check(f'{width}px: ultimate is animated without skipping maths',page.locator('#questionIndex').inner_text()==before and page.evaluate("actionEvents.some(e=>e.kind==='ultimate')"))
                        page.wait_for_timeout(1300)
                state=save(page)
                check(f'{width}px: actual stage completion saved',state['total']==10 and state['completed']['0-0']['stars']>=2)
                check(f'{width}px: real impact events fired',page.evaluate("actionEvents.filter(e=>e.type==='impact').length>=5"))
                check(f'{width}px: final energy level reached',page.locator('body').get_attribute('data-fever')=='4')
                page.screenshot(path=str(OUT/f'result-{width}.png'))
                page.locator('#resultHome').click()
                page.reload(wait_until='networkidle');page.wait_for_timeout(250)
                check(f'{width}px: previous save survives the presentation upgrade',save(page)['total']==10)
            else:
                page.locator('#pauseButton').click()
                check(f'{width}x{height}: pause dialog opens',page.locator('#quitRun').is_visible())
                page.locator('#quitRun').click()
            page.locator('#settingsButton').click()
            page.locator('#setMotion').select_option('off')
            page.locator('#setMusic').uncheck()
            page.locator('#setSfx').uncheck()
            page.locator('[data-close]').last.click()
            page.locator('#startAdventure').click();page.wait_for_timeout(300)
            answer(page,touch=True);page.wait_for_timeout(310)
            check(f'{width}x{height}: motion-off suppresses particles',page.locator('#arenaCanvas').get_attribute('data-particles')=='0')
            check(f'{width}x{height}: accessibility/audio settings still saved',save(page)['settings']['motion']=='off' and not save(page)['settings']['music'] and not save(page)['settings']['sfx'])
        except Exception:
            page.screenshot(path=str(OUT/f'FAIL-{width}x{height}.png'),full_page=True)
            print('Failure text:',page.locator('body').inner_text(),flush=True)
            raise
        finally:
            ctx.close()
    check('No browser JavaScript exceptions',not errors)
    report={'status':'passed','version':'2.0.0','mode':'live-http' if opts.url else 'real-http','checks':len(checks),'passed':checks,'errors':errors}
    (OUT/'action-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False),flush=True)
    browser.close()
if server: server.shutdown()
