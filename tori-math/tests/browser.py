"""Black-box playthrough against a real static server; --inline supports restricted offline renderers."""
from pathlib import Path
from fractions import Fraction
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import argparse, base64, json, math, os, re, threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--inline',action='store_true');parser.add_argument('--url');args=parser.parse_args()
OUT=Path(os.environ.get('QA_OUTPUT',str(ROOT/'qa')));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok):
    assert ok,name
    checks.append(name)
    print('PASS',name,flush=True)
def state(page):return page.evaluate("JSON.parse(localStorage.getItem('tori-math-adventure:v1')||'{}')")
def solve(text):
    if '최대공약수' in text:
        a,b=map(int,re.findall(r'\d+',text));return str(math.gcd(a,b))
    if '%' in text:
        a,b=map(int,re.findall(r'\d+',text));return str(Fraction(a*b,100))
    if ':' in text:
        a,b,c=map(int,re.findall(r'\d+',text));return str(Fraction(b*c,a))
    a,op,b=text.split(' ');a,b=Fraction(a),Fraction(b)
    return str({'+':lambda:a+b,'−':lambda:a-b,'×':lambda:a*b,'÷':lambda:a/b}[op]())
def answer(page,touch=False):
    s=solve(page.locator('#expression').inner_text())
    if touch:
        for c in s:page.locator(f'#keypad [data-key="{c}"]').click()
        page.locator('#submitButton').click()
    else:page.keyboard.type(s);page.keyboard.press('Enter')
    # Observe readiness, not a fixed wall-clock delay under the test's virtual clock.
    page.wait_for_function("() => document.querySelector('#dialog').open || !document.querySelector('#submitButton').disabled",timeout=5000)
def load(page,saved=None):
    page.on('pageerror',lambda e:errors.append(str(e)))
    if not args.inline:
        page.goto(base,wait_until='networkidle');page.wait_for_timeout(350);return
    html=(ROOT/'index.html').read_text()
    html=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+(ROOT/'style.css').read_text()+'\n'+(ROOT/'action.css').read_text()+'</style>')
    html=html.replace('./icon.svg','data:image/svg+xml;base64,'+base64.b64encode((ROOT/'icon.svg').read_bytes()).decode())
    html=re.sub(r'<script type="module" src="\./app\.mjs[^"]*"></script>', '', html)
    page.set_content(html,wait_until='domcontentloaded')
    page.evaluate('''saved=>{const values={};if(saved)values['tori-math-adventure:v1']=JSON.stringify(saved);Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v,removeItem:k=>delete values[k]}});}''',saved)
    chunks=[]
    for name in ['math.mjs','rig.mjs','action-ui.mjs','scene.mjs','audio.mjs','app.mjs']:
        code=(ROOT/name).read_text()
        if name=='action-ui.mjs':code=code[:code.rfind("if(typeof document!=='undefined'){")]
        code=re.sub(r'^import .*?;\s*$', '',code,flags=re.M)
        code=re.sub(r'^export \{.*?\};\s*$', '',code,flags=re.M)
        code=code.replace('export function ','function ').replace('export class ','class ').replace('export const ','const ')
        chunks.append(code)
    page.add_script_tag(type='module',content='\n'.join(chunks)+'\ninstallActionUI();');page.wait_for_timeout(450)

def quit(page):
    page.locator('#pauseButton').click();page.locator('#quitRun').click()
server=None
if not args.inline and not args.url:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self,*a):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/'
else:base=args.url
with sync_playwright() as pw:
    options={'headless':True,'args':['--no-sandbox']}
    if args.inline:options['executable_path']='/usr/bin/chromium'
    browser=pw.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1024},device_scale_factor=1)
    page.clock.install()
    load(page)
    check('Korean document and page title',page.locator('html').get_attribute('lang')=='ko' and '토리의 수학탐험' in page.title())
    check('six world cards',page.locator('.world-card').count()==6)
    check('desktop has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.screenshot(path=str(OUT/'desktop-home.png'),full_page=True)
    page.locator('#startAdventure').click();page.wait_for_timeout(300)
    check('start opens a real arithmetic challenge',page.locator('#game').is_visible() and len(page.locator('#expression').inner_text())>2)
    page.keyboard.type('999');page.keyboard.press('Enter')
    check('wrong answer retains question and gives feedback','생각' in page.locator('#feedback').inner_text() and page.locator('#questionIndex').inner_text()=='1')
    page.locator('#hintButton').click()
    check('a contextual hint is shown',page.locator('#hintBox').is_visible())
    page.locator('#solutionButton').click()
    check('a worked answer is available','함께 풀이' in page.locator('#hintBox').inner_text())
    for i in range(10):
        answer(page)
        if i==5:
            check('charge meter enables ultimate',page.locator('#ultimateButton').is_enabled())
            page.keyboard.press('Space')
            page.wait_for_timeout(180)
            page.screenshot(path=str(OUT/'desktop-ultimate.png'),full_page=True)
            check('ultimate consumes charge and does not skip the problem','0 / 100' in page.locator('#ultimateLabel').inner_text() and page.locator('#questionIndex').inner_text()=='7')
    page.wait_for_timeout(300)
    check('a full stage shows a result dialog',page.locator('#resultHome').is_visible())
    saved=state(page)
    check('exactly 10 answers recorded',saved['total']==10 and saved['correctFirst']==9)
    check('3-star stage and 45 coins awarded',saved['completed']['0-0']['stars']==3 and saved['coins']==45)
    check('wrong question retained for spaced review',len(saved['wrong'])==1)
    page.screenshot(path=str(OUT/'desktop-result.png'),full_page=True)
    page.locator('#resultHome').click()
    for i in range(3):page.locator(f'[data-claim="{i}"]').click()
    check('daily missions awarded once',state(page)['coins']==120 and len(state(page)['missions']['claimed'])==3)
    page.locator('#nav [data-view="wardrobe"]').click();page.locator('[data-outfit="coral"]').click()
    check('costume is purchased and equipped',state(page)['coins']==0 and state(page)['outfit']=='coral')
    page.screenshot(path=str(OUT/'desktop-wardrobe.png'),full_page=True)
    page.locator('#nav [data-view="home"]').click();page.locator('#reviewButton').click();answer(page);page.wait_for_timeout(300)
    check('review clears a first-try corrected question',len(state(page)['wrong'])==0)
    page.locator('#resultHome').click();page.locator('#nav [data-view="map"]').click()
    check('completion unlocks the next stage',page.locator('[data-stage="1"]').is_enabled() and page.locator('[data-stage="2"]').is_disabled())
    page.locator('[data-grade="6"][data-for="map"]').click()
    check('other worlds are accessible without clearing earlier grades',page.locator('[data-stage="0"]').is_enabled())
    page.locator('#nav [data-view="practice"]').click()
    # Exercise all 24 live problem families, not just the generator in isolation.
    for grade in range(1,7):
        page.locator(f'[data-grade="{grade}"][data-for="practice"]').click()
        ids=page.locator('[data-skill]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.skill)')
        check(f'grade {grade} exposes four skills',len(ids)==4)
        for skill in ids:
            page.locator(f'[data-skill="{skill}"]').click();page.wait_for_timeout(100)
            before=state(page).get('total',0)
            answer(page)
            check(f'{skill} accepts its mathematically computed answer',state(page)['total']==before+1)
            quit(page);page.locator('#nav [data-view="practice"]').click();page.locator(f'[data-grade="{grade}"][data-for="practice"]').click()
    page.locator('#nav [data-view="home"]').click();page.locator('#settingsButton').click();page.locator('#setMotion').select_option('off');page.locator('#setMusic').uncheck();page.locator('[data-close]').last.click()
    check('sound and reduced motion settings persist',state(page)['settings']['motion']=='off' and state(page)['settings']['music'] is False)
    page.locator('#assessmentButton').click();page.locator('#assessmentStart').click()
    for i in range(8):answer(page)
    page.wait_for_timeout(250)
    check('adaptive check completes and recommends a valid grade',page.locator('#resultNext').inner_text()=='추천 모험 시작' and 1<=state(page)['grade']<=6)
    page.locator('#resultHome').click();page.locator('#rushButton').click();page.wait_for_timeout(180)
    page.locator('#pauseButton').click();label=page.locator('#timerLabel').inner_text();page.clock.fast_forward(5000)
    check('pause freezes the timed game',page.locator('#timerLabel').inner_text()==label)
    page.locator('[data-close]').click();page.clock.fast_forward(62000);page.wait_for_timeout(100)
    check('60 second mode actually ends',page.locator('#resultHome').is_visible())
    # Phone layout and touch input.
    for width,height in [(390,844),(360,740),(768,1024)]:
        mobile=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=True,has_touch=True)
        load(mobile)
        check(f'{width}px home does not overflow',mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        if width==390:mobile.screenshot(path=str(OUT/'mobile-home.png'),full_page=True)
        mobile.locator('#startAdventure').click();mobile.wait_for_timeout(200)
        check(f'{width}px gameplay does not overflow horizontally',mobile.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        if width<720:check(f'{width}px phone game fits without vertical page scrolling',mobile.evaluate('document.documentElement.scrollHeight<=innerHeight+1'))
        if width==390:
            mobile.screenshot(path=str(OUT/'mobile-play.png'),full_page=True)
            for i in range(10):answer(mobile,touch=True)
            mobile.wait_for_timeout(300)
            check('touch keypad completes an entire stage',state(mobile)['total']==10 and mobile.locator('#resultHome').is_visible())
        mobile.close()
    check('no browser JavaScript errors',not errors)
    report={'status':'passed','mode':'offline-inline' if args.inline else 'real-http','checks':len(checks),'passed':checks,'errors':errors}
    (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps({'checks':len(checks),'status':'passed','mode':report['mode']}),flush=True)
    browser.close()
if server:server.shutdown()
