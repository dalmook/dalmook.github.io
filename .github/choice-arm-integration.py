"""One-time, exact-source patch. Removed before merge; no private data involved."""
from pathlib import Path
from hashlib import sha256
root=Path('dopa-word')
expected={'app.mjs':('51229cf80042179c17c0f43acd04ad3fa9aef5ee8adf27348ae8e0cff8dc7cc3','45801906a5c659dd002c948709addfde6b27d0d03fc37ad1af06a4b6a4377d94'),'index.html':('e1f6e7ce6ac0311abe6c6874d23441359cf5869c9caa00c99f6f525cd674b324','8d4d1c1880eac32274c1c5c712da0cafc0a8262553feb48d8325b7df8a4f5b1a'),'tests/browser_legacy.py':('f77f470b689817fd9bf253c570835bece3d49abb2b184e3c020f04b19cc9f8a5','9e3bc37bf61c5970636d1dc11de4c8393496ccddfdaa6833de7f8c07e19b4328')}
for name,(before,after) in expected.items():
    assert sha256((root/name).read_bytes()).hexdigest()==before, 'Base changed: '+name
s=(root/'app.mjs').read_text()
s=s.replace("import {Scene} from './scene.mjs';", "import {Scene} from './scene.mjs';\nimport {ChoiceMotion, CHOICE_MOTION_VERSION} from './choice-motion.mjs';")
s=s.replace('const scene=new Scene();const G=', 'const scene=new Scene();const choiceMotion=new ChoiceMotion(scene);const G=')
s=s.replace('window.__word={G,scene,base:BASE,', 'window.__word={G,scene,choiceMotion,choiceMotionVersion:CHOICE_MOTION_VERSION,base:BASE,')
s=s.replace("G.screen=name;G.token++;$$('.screen')", "G.screen=name;G.token++;choiceMotion.reset();$$('.screen')")
s=s.replace("G.token++;G.phase='question';G.buffer=''", "G.token++;choiceMotion.reset(G.mode);G.phase='question';G.buffer=''")
s=s.replace("$('screen-play').classList.remove('answered');", "$('screen-play').classList.remove('answered','choosing');$('choices').setAttribute('aria-busy','false');")
start=s.index('function choose(index,el){');end=s.index('\nfunction complete(){',start)
s=s[:start]+'''async function choose(index,el){
 if(G.phase!=='question'||G.mode!=='choice'||!usable()||document.hidden||document.querySelector('dialog[open]'))return;
 const opt=G.options[index];if(!opt||G.rejected.has(index))return;
 const button=el||document.querySelector(`[data-choice="${index}"]`);if(!button)return;
 const token=G.token,wordID=current().id;
 const sameQuestion=()=>G.screen==='play'&&G.mode==='choice'&&G.token===token&&current()?.id===wordID;
 const isCurrent=()=>sameQuestion()&&G.phase==='choosing'&&!stale&&!document.querySelector('dialog[open]');
 G.phase='choosing';$('screen-play').classList.add('choosing');$('choices').setAttribute('aria-busy','true');
 $$('#choices button').forEach(b=>b.disabled=true);scene.tap(index);
 let accepted=false;
 try{accepted=await choiceMotion.play(button,index,opt.label,isCurrent);}
 catch(error){console.error('Choice animation failed',error);toast('선택 동작을 다시 눌러 주세요. 학습 기록은 바뀌지 않았어요.');}
 if(!sameQuestion()||G.phase!=='choosing')return;
 G.phase='question';$('screen-play').classList.remove('choosing');$('choices').setAttribute('aria-busy','false');
 $$('#choices button').forEach(b=>b.disabled=G.rejected.has(Number(b.dataset.choice)));
 if(!accepted||stale)return;
 choiceMotion.outcome(opt.correct);
 if(opt.correct){button.classList.add('correct');complete();}
 else{G.rejected.add(index);G.mistakes++;button.classList.add('wrong');button.disabled=true;$('feedback').textContent='다른 뜻이에요. 다시 골라 볼까요?';scene.wrong(button);}
}'''+s[end:]
outputs={'app.mjs':s,'index.html':(root/'index.html').read_text().replace('app.mjs?v=shared-1','app.mjs?v=choice-arm-1')}
s=(root/'tests/browser_legacy.py').read_text()
old='check(\'wrong option disabled but game continues\',page.locator(f\'[data-choice="{wrong}"]\').is_disabled());right='
assert old in s
outputs['tests/browser_legacy.py']=s.replace(old,'''page.wait_for_function("window.__word.G.phase==='question'&&window.__word.G.mistakes===1");check('wrong option disabled but game continues',page.locator(f'[data-choice="{wrong}"]').is_disabled());right=''')
for name,s in outputs.items():
    assert sha256(s.encode()).hexdigest()==expected[name][1], 'Output mismatch: '+name
for name,s in outputs.items():
    (root/name).write_text(s)
    print('Patched',name,sha256(s.encode()).hexdigest())
