"""Exercise the real original arm geometry and delayed choice transaction.
No animation mocks and no writes to private/public word data. Local and Pages
runs create new disposable browser profiles; publication remains read-only.
"""
import json, os, pathlib, sys, traceback
from playwright.sync_api import sync_playwright
URL=os.getenv('WORD_URL','http://127.0.0.1:8765/dopa-word/')
OUT=pathlib.Path(os.getenv('WORD_OUT','qa/choice-arm'));OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok=True):
    if not ok:raise AssertionError(name)
    checks.append(name);print('PASS',name,flush=True)
def phase(page,value):page.wait_for_function('(s)=>window.__word.G.phase===s',arg=value,timeout=15000)
def ready(page):
    page.goto(URL,wait_until='domcontentloaded',timeout=45000)
    page.wait_for_function("window.__word?.choiceMotionVersion==='choice-arm-1'",timeout=20000)
def launch_quiz(page):
    page.locator('[data-mode="choice"]').click();page.locator('#start').click();phase(page,'question')
def probe(page,index):
    page.evaluate('''(index)=>{
      const a=window.__word,b=document.querySelector(`[data-choice="${index}"]`);
      const rect=b.getBoundingClientRect();window.armProbe={index,start:performance.now(),source:{x:rect.x+rect.width/2,y:rect.y+rect.height/2},samples:[]};
      const sample=()=>{const p=window.armProbe;if(!p)return;
        p.samples.push({ms:performance.now()-p.start,phase:a.G.phase,stage:a.choiceMotion.stage,results:a.G.results.length,choicesVisible:!document.querySelector('#choices').hidden,
          hands:a.scene.hero.hands.map((h,i)=>({job:h.job,carry:h.carry,x:h.x,y:h.y,mode:h.mode,path:a.scene.hero.arms[i].out.getAttribute('d')}))});
        if(p.samples.length<160&&a.G.phase!=='answered')requestAnimationFrame(sample);
      };sample();
    }''',index)
def verify_probe(page,name):
    data=page.evaluate('window.armProbe');samples=data['samples']
    check(name+': real engine reaches then carries before placement',{'reach','carry','placed'}<=set(s['stage'] for s in samples))
    moving=[s for s in samples if s['phase']=='choosing']
    check(name+': quiz stays visible and uncommitted throughout motion',bool(moving) and all(s['choicesVisible'] and s['results']==0 for s in moving))
    paths={h['path'] for s in moving for h in s['hands'] if h['job']}
    check(name+': original SVG arm bends along multiple frames',len(paths)>3)
    near=[h for s in samples for h in s['hands'] if ((h['x']-data['source']['x'])**2+(h['y']-data['source']['y'])**2)**.5<14]
    check(name+': hand reaches the selected answer, not a decorative location',bool(near))
    (OUT/(name+'-geometry.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
def answer(page):
    i=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.locator(f'[data-choice="{i}"]').click();phase(page,'answered')
try:
  with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,args=['--no-sandbox'])
    for width,height,touch in [(320,640,True),(390,844,True),(1280,800,False),(844,390,True)]:
      ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=touch)
      page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page);launch_quiz(page)
      index=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');probe(page,index)
      button=page.locator(f'[data-choice="{index}"]')
      if touch:button.tap()
      else:button.click()
      check(str(width)+': motion locks selection before grading',page.evaluate("window.__word.G.phase==='choosing'&&window.__word.G.results.length===0"))
      check(str(width)+': all buttons disabled during one arm action',page.locator('#choices button:disabled').count()==4)
      page.keyboard.press(str((index+1)%4+1))
      page.wait_for_function("window.__word.choiceMotion.stage==='carry'",timeout=10000)
      page.screenshot(path=str(OUT/(str(width)+'-arm-carry.png')))
      phase(page,'answered');verify_probe(page,str(width))
      check(str(width)+': one completed answer, no double-click score',page.evaluate('window.__word.G.results.length===1&&window.__word.G.results[0].clean'))
      check(str(width)+': chosen meaning appears in receiver',page.locator('#choice-target span').inner_text()==page.locator('#answer-meaning').inner_text())
      check(str(width)+': temporary floating label cleaned up',page.locator('.choice-carry-label').count()==0)
      ctx.close()
    ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page);launch_quiz(page)
    wrong=page.evaluate('window.__word.G.options.findIndex(o=>!o.correct)');probe(page,wrong)
    page.keyboard.press(str(wrong+1));check('number keys start the same arm action',page.evaluate("window.__word.G.phase==='choosing'"))
    page.wait_for_function("window.__word.G.phase==='question'&&window.__word.G.mistakes===1",timeout=15000)
    check('wrong choice is disabled after arm finishes, other choices enabled',page.locator('#choices button:disabled').count()==1)
    check('wrong choice does not count as learned answer',page.evaluate('window.__word.G.results.length')==0)
    answer(page);check('corrected answer retains non-first-try grading',page.evaluate('!window.__word.G.results[0].clean'))
    for i in range(1,10):page.locator('#next').click();phase(page,'question');answer(page)
    page.locator('#next').click();phase(page,'result');check('10-word quiz completes with original score rule',page.locator('#score').inner_text()=='90')
    page.locator('#screen-result [data-home]').click()
    page.reload(wait_until='domcontentloaded',timeout=30000);page.wait_for_function("window.__word?.choiceMotionVersion==='choice-arm-1'")
    check('completion and review remain saved after reload',page.evaluate('window.__word.state.history.at(-1).total===10&&window.__word.state.correct===9'))
    launch_quiz(page);index=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)')
    before=page.evaluate('window.__word.state.answered')
    page.evaluate('''(i)=>{document.querySelector(`[data-choice="${i}"]`).click();document.querySelector('#leave').click();}''',index)
    page.wait_for_timeout(700);check('exit prompt cancels in-flight grading',page.evaluate('window.__word.state.answered')==before)
    page.locator('#confirm-dialog [data-close]').click();phase(page,'question');answer(page)
    check('continue after cancellation still permits selection',page.evaluate('window.__word.G.results.length')==1)
    page.locator('#next').click();phase(page,'question')
    index=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)')
    page.evaluate('''(i)=>{document.querySelector(`[data-choice="${i}"]`).click();document.querySelector('#leave').click();document.querySelector('#confirm-ok').click();}''',index)
    phase(page,'result');page.wait_for_timeout(700)
    check('leaving mid-reach cannot add a stale result',page.evaluate('window.__word.G.results.length')==1)
    check('leaving removes arm label and pending transaction',page.locator('.choice-carry-label').count()==0 and page.evaluate('window.__word.choiceMotion.pending===null'))
    ctx.close()
    for motion in ['0','0.45']:
      ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page)
      page.locator('#open-settings').click();page.locator('#set-motion').select_option(motion);page.locator('#settings button[value="close"]').click();launch_quiz(page);answer(page)
      check('motion '+motion+': selection still graded once',page.evaluate('window.__word.G.results.length===1&&window.__word.G.results[0].clean'))
      check('motion '+motion+': temporary nodes do not leak',page.locator('.choice-carry-label').count()==0)
      ctx.close()
    ctx=browser.new_context(viewport={'width':390,'height':700});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));ready(page);launch_quiz(page)
    index=page.evaluate('window.__word.G.options.findIndex(o=>o.correct)');page.locator(f'[data-choice="{index}"]').click();page.set_viewport_size({'width':844,'height':390});phase(page,'answered')
    check('viewport rotation does not lose choice or lock controls',page.evaluate('window.__word.G.results.length===1'))
    ctx.close();check('no JavaScript runtime errors',not errors);browser.close()
except Exception as exc:
    errors.append(str(exc));traceback.print_exc()
    try:page.screenshot(path=str(OUT/'failure.png'),timeout=5000)
    except Exception:pass
finally:
    (OUT/'report.json').write_text(json.dumps({'url':URL,'passed':len(checks),'checks':checks,'errors':errors,'animation':'original Dopakichi.carry; no animation mocks'},ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'choice_arm_passed':len(checks),'errors':errors},ensure_ascii=False),flush=True)
if errors:sys.exit(1)
