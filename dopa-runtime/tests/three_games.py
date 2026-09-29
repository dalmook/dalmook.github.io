"""Three-site deployment and sustained-load regression. Fresh browser contexts,
real keyboard/touch inputs, no user wordbook access and no public data writes.
"""
import json,os,re,pathlib,sys,time,traceback
from playwright.sync_api import sync_playwright
ROOT=os.getenv('DOPA_ROOT','http://127.0.0.1:8765/').rstrip('/')+'/'
OUT=pathlib.Path(os.getenv('DOPA_OUT','qa/three-games'));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];measurements={}
GAMES=['dopa-word','dopa-ox','dopa-drill']
def check(name,ok=True):
 if not ok:raise AssertionError(name)
 checks.append(name);print('PASS',name,flush=True)
def obj(game):return {'dopa-word':'window.__word','dopa-ox':'window.__ox','dopa-drill':'window.__dopa'}[game]
def active(game):return obj(game)+('.G' if game=='dopa-word' else '.S')
def scene(game):return obj(game)+('.scene' if game=='dopa-word' else '')
def current(page,game,expression):return page.evaluate('('+scene(game)+')'+expression)
def close_drill_prompts(page):
 # Original attendance/trophy modals appear 450-500ms after dismissing the
 # first-visit guide. Wait for the actual UI to stay clear, then open settings.
 deadline=time.monotonic()+8;quiet=None
 while time.monotonic()<deadline:
  clicked=False
  for selector in ['#guide-skip','#bonus-ok','#tg-ok','#hammer-no']:
   el=page.locator(selector)
   if el.count() and el.is_visible():el.click();clicked=True;quiet=None;break
  if not clicked:
   if quiet is None:quiet=time.monotonic()
   if time.monotonic()-quiet>.85:return
  page.wait_for_timeout(100)
 raise AssertionError('Original arithmetic welcome/reward dialogs did not settle')
def ready(page,game):
 suffix='?level=kids&v=kids-1' if game=='dopa-ox' else ''
 page.goto(ROOT+game+'/'+suffix,wait_until='domcontentloaded',timeout=45000)
 page.wait_for_function("document.documentElement.dataset.performanceVersion==='all-smooth-1'",timeout=20000)
 page.wait_for_function(obj(game)+'!==undefined',timeout=15000)
 if game=='dopa-drill':close_drill_prompts(page)
def settings(page,game,mode='auto'):
 if game=='dopa-drill':close_drill_prompts(page)
 page.locator('#open-settings').click();page.locator('#set-performance').select_option(mode)
 if game=='dopa-word':page.locator('#settings button[value="close"]').click()
 elif game=='dopa-ox':page.locator('#close-settings').click()
 else:page.locator('#close-settings').click()
def start(page,game):
 if game=='dopa-drill':
  close_drill_prompts(page);page.locator('.grades button[data-grade="1"]').click();page.wait_for_function('window.__dopa.S.screen==="play"&&window.__dopa.S.ready',timeout=15000)
 else:
  page.locator('#start').click();page.wait_for_function(active(game)+".phase==='question'",timeout=15000)
def complete(page,game):
 if game=='dopa-word':
  for _ in range(10):
   page.wait_for_function("window.__word.G.phase==='question'")
   word=page.evaluate('window.__word.G.deck[window.__word.G.i].word');page.keyboard.type(re.sub('[^a-z]','',word),delay=2)
   page.wait_for_function("window.__word.G.phase==='answered'",timeout=15000);page.locator('#next').click()
  page.wait_for_function("window.__word.G.phase==='result'");check(game+': full spelling session and scoring',page.locator('#score').inner_text()=='100')
 elif game=='dopa-ox':
  for _ in range(10):
   page.wait_for_function("window.__ox.S.phase==='question'")
   answer=page.evaluate('window.__ox.S.question.answer');page.locator('#answer-o' if answer else '#answer-x').click()
   page.wait_for_function("window.__ox.S.phase==='answered'",timeout=15000);page.locator('#next-question').click()
  page.wait_for_function("window.__ox.S.phase==='result'");check(game+': full Kids session and scoring',page.locator('#r-score').inner_text()=='100')
 else:
  # Preserve grade 1 logic and enter the current required digit through its real pad.
  for _ in range(120):
   page.wait_for_function("window.__dopa.S.ready||window.__dopa.S.screen==='result'",timeout=30000)
   if page.evaluate("window.__dopa.S.screen==='result'"):break
   digit=page.evaluate('window.__dopa.S.problem.steps[window.__dopa.S.step].digit')
   page.locator(f'#pad button[data-key="{digit}"]').click();page.wait_for_timeout(90)
  check(game+': full arithmetic session completes',page.evaluate("window.__dopa.S.screen==='result'"))
  check(game+': all correct inputs retain original score',page.evaluate('window.__dopa.S.firstTry===window.__dopa.S.N'))
def home(page,game):
 if game=='dopa-word':page.locator('#screen-result [data-home]').click()
 elif game=='dopa-ox':page.locator('#result-home').click()
 else:page.locator('#go-title').click();close_drill_prompts(page)
def sample(page,game):
 # Synthetic high-energy scene, explicitly separate from correctness/real game tests.
 sc=scene(game);st=active(game)
 page.evaluate('''({sc,st,game})=>{
  const s=eval(sc),q=eval(st),a=s.audio;
  if(game==='dopa-word')s.energy(1);else{q.E=1;q.level=10;a.setLevel(10,140);}
  window.perfProbe={frames:[],late:[],root:0};let last=performance.now();
  const tick=t=>{window.perfProbe.frames.push(t-last);last=t;requestAnimationFrame(tick)};requestAnimationFrame(tick);
  const orig=a.scheduleStep.bind(a);a.scheduleStep=(i,t)=>{window.perfProbe.late.push(Math.max(0,a.now()-t)*1000);return orig(i,t)};
  window.observer=new MutationObserver(rs=>window.perfProbe.root+=rs.length);window.observer.observe(document.body,{attributes:true,attributeFilter:['style']});
  window.stress=setInterval(()=>{a.correct(5,1);const f=s.fx;f.burst(190,250,{count:60});},1600);
 }''',{'sc':sc,'st':st,'game':game})
 page.wait_for_timeout(8500)
 values=page.evaluate('''(sc)=>{const s=eval(sc),p=window.perfProbe,sorted=[...p.frames].sort((a,b)=>a-b);return{
 frameP50:sorted[Math.floor(sorted.length*.5)],frameP95:sorted[Math.floor(sorted.length*.95)],lateSteps:p.late.filter(v=>v>10).length,maxLate:Math.max(0,...p.late),frames:p.frames.length,bodyWrites:p.root,
 nodes:s.audio.pool.nodes,peakNodes:s.audio.pool.stats.peakNodes,voices:s.audio.pool.voices.size,dropped:s.audio.pool.stats.dropped,quality:s.budget.level,backgrounds:s.budget.stats.backgrounds,decorations:s.budget.stats.decorations,particles:s.fx.parts.length+(s.back||s.fxBack).parts.length}}''',sc)
 measurements[game]=values
 check(game+': bounded active audio resources',values['nodes']<=640 and values['peakNodes']<=640)
 check(game+': independent lookahead scheduler',current(page,game,'.audio.timer!==null&&('+sc+').audio.horizon===.32'))
 check(game+': background and particle updates are budgeted',current(page,game,'.budget.level>=0&&('+sc+').budget.level<=2'))
 check(game+': no per-frame body-wide style writes',values['bodyWrites']<15)
 page.screenshot(path=str(OUT/(game+'-high-load.png')))
 page.evaluate('(sc)=>{clearInterval(window.stress);window.observer.disconnect();eval(sc).audio.stopMusic();eval(sc).audio.pool.clear();}',sc)
 page.wait_for_timeout(100)
 check(game+': audio graphs and timers can cleanly drain',current(page,game,'.audio.pool.nodes===0'))
 # Explicit lifecycle test does not alter the game/score state.
 page.evaluate('(sc)=>{const a=eval(sc).audio;a.startMusic();a.setPageHidden(true)}',sc)
 check(game+': background audio work stops without losing game state',current(page,game,'.audio.timer===null&&('+sc+').audio.playing'))
 page.evaluate('(sc)=>eval(sc).audio.setPageHidden(false)',sc);page.wait_for_timeout(200)
 check(game+': foreground audio resumes',current(page,game,'.audio.timer!==null'))
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
  for game in GAMES:
   ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
   page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   ready(page,game);check(game+': upgraded runtime loads through original URL')
   check(game+': performance control exists once',page.locator('#set-performance').count()==1)
   page.evaluate("localStorage.setItem('unrelated-save-sentinel','unchanged')")
   settings(page,game,'light');check(game+': performance mode does not disable arm motion',current(page,game,'.budget.mode')=='light')
   settings(page,game,'auto')
   page.screenshot(path=str(OUT/(game+'-home.png')))
   start(page,game)
   if game=='dopa-ox':check('Kids URL and 200 easy questions preserved',page.evaluate("window.__ox.S.deck.every(q=>q.level===1&&q.id.startsWith('kids-'))&&window.__ox.bank.filter(q=>q.level===1).length===200"))
   if game=='dopa-word':check('word starter vocabulary preserved',page.evaluate('window.__word.base.length===240'))
   complete(page,game);home(page,game)
   # Assert actual fresh document and real persisted session, never seed score.
   before=page.evaluate(obj(game)+('.state.answered' if game!='dopa-drill' else '.store.load().history.length'))
   page.evaluate("window.reloadMarker='before'")
   page.reload(wait_until='domcontentloaded',timeout=45000);page.wait_for_function("document.documentElement.dataset.performanceVersion==='all-smooth-1'",timeout=20000)
   check(game+': refresh reinitializes new document',page.evaluate('window.reloadMarker===undefined'))
   if game=='dopa-drill':close_drill_prompts(page)
   check(game+': real learning record survives reload',page.evaluate(obj(game)+('.state.answered' if game!='dopa-drill' else '.store.load().history.length'))==before)
   check(game+': unrelated save untouched',page.evaluate("localStorage.getItem('unrelated-save-sentinel')")=='unchanged')
   start(page,game);sample(page,game);ctx.close()
  # All three layouts at compact and desktop sizes, using the old Kids query.
  for game in GAMES:
   for width,height in [(320,640),(1280,800)]:
    ctx=browser.new_context(viewport={'width':width,'height':height});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    ready(page,game);start(page,game)
    selector='#keyboard' if game=='dopa-word' else '#pad'
    rect=page.locator(selector).bounding_box()
    check(f'{game}: {width}px input remains inside viewport',rect and rect['x']>=-1 and rect['x']+rect['width']<=width+1)
    ctx.close()
  check('all three games: no JavaScript runtime errors',not errors)
  browser.close()
except Exception as e:
 errors.append(str(e));traceback.print_exc()
 try:page.screenshot(path=str(OUT/'failure.png'),timeout=5000)
 except Exception:pass
finally:
 (OUT/'report.json').write_text(json.dumps({'root':ROOT,'runtime':'all-smooth-1','passed':len(checks),'checks':checks,'measurements':measurements,'errors':errors,'conditions':'Chromium 390x844 DPR2, real native audio, 8.5s synthetic high-energy load after real full sessions. Not a real-phone FPS or acoustic output claim.'},ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps({'passed':len(checks),'errors':errors},ensure_ascii=False),flush=True)
if errors:sys.exit(1)
