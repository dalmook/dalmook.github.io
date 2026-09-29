"""Synthetic sustained load comparison + real-UI smoke. No private browser data.
CPU throttling and software rendering are lab conditions, not a phone FPS claim.
"""
import json,os,time,pathlib,traceback,sys
from playwright.sync_api import sync_playwright
OUT=pathlib.Path(os.getenv('PERF_OUT','qa/performance'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('PERF_BASE_URL','http://127.0.0.1:8765/qa/baseline/dopa-word/')
TARGET=os.getenv('WORD_URL','http://127.0.0.1:8765/dopa-word/')
checks=[];results={};errors=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name);print('PERF PASS',name,flush=True)
def run(browser,url,label):
 ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
 page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));cdp=ctx.new_cdp_session(page)
 counts={'created':0,'destroyed':0,'nodes':set()}
 def create(e):counts['created']+=1;counts['nodes'].add(e['node']['nodeId'])
 def destroy(e):counts['destroyed']+=1;counts['nodes'].discard(e['nodeId'])
 cdp.on('WebAudio.audioNodeCreated',create);cdp.on('WebAudio.audioNodeWillBeDestroyed',destroy)
 cdp.send('WebAudio.enable');cdp.send('Performance.enable');cdp.send('Emulation.setCPUThrottlingRate',{'rate':4})
 page.goto(url,wait_until='domcontentloaded',timeout=45000);page.wait_for_function('window.__word')
 page.locator('#start').click()
 page.evaluate('''()=>{
  const s=window.__word.scene,a=s.audio;window.perfProbe={frames:[],late:[],steps:0,bg:0,rootStyle:0,reads:0};
  let last=performance.now();const r=t=>{window.perfProbe.frames.push(t-last);last=t;requestAnimationFrame(r)};requestAnimationFrame(r);
  const old=a.scheduleStep.bind(a);a.scheduleStep=(n,t)=>{window.perfProbe.steps++;window.perfProbe.late.push(Math.max(0,a.now()-t)*1000);old(n,t)};
  const render=s.bg.render.bind(s.bg);s.bg.render=(t)=>{window.perfProbe.bg++;return render(t)};
  new MutationObserver(records=>{window.perfProbe.rootStyle+=records.length}).observe(document.body,{attributes:true,attributeFilter:['style']});
 }''')
 rows=[]
 for level in [.08,1,1,1]:
  page.evaluate('(e)=>window.__word.scene.energy(e)',level)
  if level==1:page.evaluate('()=>{if(!window.perfStress){let c=7;window.perfStress=setInterval(()=>window.__word.scene.success(++c,true),1400)}}')
  page.evaluate('()=>{Object.assign(window.perfProbe,{frames:[],late:[],steps:0,bg:0,rootStyle:0})}')
  page.wait_for_timeout(7000)
  row=page.evaluate('''()=>{const p=window.perfProbe,s=window.__word.scene;
   const q=(a,n)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*n)]||0;
   return{frames:p.frames.length,frameP50:q(p.frames,.5),frameP95:q(p.frames,.95),gapsOver50:p.frames.filter(x=>x>50).length,lateSteps:p.late.filter(x=>x>10).length,maxLate:Math.max(0,...p.late),steps:p.steps,backgroundDraws:p.bg,bodyStyleWrites:p.rootStyle,particles:s.fx.parts.length+s.back.parts.length,dom:document.getElementsByTagName('*').length,pool:s.audio.pool?{nodes:s.audio.pool.nodes,voices:s.audio.pool.voices.size,...s.audio.pool.stats}:null,quality:s.budget?.level}}''')
  cdp.send('HeapProfiler.collectGarbage');row.update(level=level,created=counts['created'],destroyed=counts['destroyed'],nativeNodes=len(counts['nodes']))
  rows.append(row);print(label,json.dumps(row),flush=True)
 page.screenshot(path=str(OUT/(label+'-high-load.png')))
 if label=='after':
  check('music runs independently of the render frame',page.evaluate('window.__word.scene.audio.timer!==null'))
  check('active transient sound nodes have a hard bound',all(r['pool']['nodes']<=640 and r['pool']['peakNodes']<=640 for r in rows))
  check('no per-frame body-wide CSS invalidation',all(r['bodyStyleWrites']<4 for r in rows))
  before=page.evaluate('window.__word.scene.audio.step')
  page.evaluate('()=>{window.oldFrame=window.__word.scene.frame;window.__word.scene.frame=()=>{}}');page.wait_for_timeout(900)
  check('music sequencer advances even with rendering disabled',page.evaluate('window.__word.scene.audio.step')>before)
  page.evaluate('()=>{window.__word.scene.frame=window.oldFrame}')
 page.evaluate('()=>{clearInterval(window.perfStress);window.__word.scene.audio.stopMusic()}');page.wait_for_timeout(6500)
 if label=='after':
  check('all transient sounds are disconnected after tails end',page.evaluate('window.__word.scene.audio.pool.nodes===0&&window.__word.scene.audio.pool.voices.size===0'))
  check('scheduler stops when no audio work remains',page.evaluate('window.__word.scene.audio.timer===null'))
  page.locator('#leave').click();page.locator('#confirm-ok').click()
  page.locator('#open-settings').click();page.locator('#set-performance').select_option('light');page.locator('#settings button[value="close"]').click()
  check('light mode does not disable requested character animation',page.evaluate("window.__word.state.settings.motion===1&&window.__word.scene.budget.mode==='light'"))
  check('original carry API and instruments remain available',page.evaluate("typeof window.__word.scene.hero.carry==='function'&&typeof window.__word.scene.audio.correct==='function'"))
 ctx.close();return rows
try:
 with sync_playwright() as p:
  b=p.chromium.launch(args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
  if os.getenv('PERF_SKIP_BASE')!='1':results['before']=run(b,BASE,'before')
  results['after']=run(b,TARGET,'after')
  check('no runtime errors under sustained audible load',not errors)
  b.close()
except Exception as e:errors.append(str(e));traceback.print_exc()
finally:
 (OUT/'report.json').write_text(json.dumps({'target':TARGET,'baseline':BASE,'conditions':'390x844 DPR2 Chromium CPU4x; 28s per build plus 6.5s sound drain; synthetic level-10 celebrations every 1.4s; not actual-device FPS','passed':len(checks),'checks':checks,'results':results,'errors':errors},ensure_ascii=False,indent=2),encoding='utf8')
if errors:sys.exit(1)
