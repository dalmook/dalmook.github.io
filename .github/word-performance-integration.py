"""One-time exact-base integration; removed after successful branch verification.
Only the listed vocabulary files are edited. User data and vendor assets are not.
"""
from pathlib import Path
from hashlib import sha256
p=Path('dopa-word')
expected={
'app.mjs':('45801906a5c659dd002c948709addfde6b27d0d03fc37ad1af06a4b6a4377d94','a7f9653df3a7c8b1931d5427d82fb44e126c5a2a826e845c3c88c086731ec63e'),
'scene.mjs':('ce2427b396ec93f818a49a39d38b6e29438f5e15e30fc02e42927f808f1642c4','9766f6d475d1ed15da94be465631b165afcff3c50619d6fb49c52f8711bc5ca8'),
'index.html':('8d4d1c1880eac32274c1c5c712da0cafc0a8262553feb48d8325b7df8a4f5b1a','c05ae3816573b6874fb4ad5138b2febc5cc9b870f50fa6cdd6193cb79c779a3f'),
'choice-motion.mjs':('e70ed8bad523e34a0ac3baaf91858cc362a73fde578ae1043e6d99808029fcde','65a8455df7d04cef0b201a9340e9b1251657f608df4400635b45ab8e4d598b08'),
'choice-motion.css':('90de8872147f95b2de4cbb3bf2ffb9a70b76dbfea4a3813b494caf392e5aa30a','32fb3283d101bfb135755af0e326bd86126bfdafbd1586b8492a6c9154c1f82b'),
'word.css':('7d7246b0312d129b23a35b783346892edf521a4b196b5b5d1714dccc4f4f42b7','c5d6e82b8862db3d8ff78f6db53395acb857bbbefae5d0f88909038bded9f8aa')}
for name,(before,after) in expected.items():
 assert sha256((p/name).read_bytes()).hexdigest()==before,'Base mismatch '+name
out={}
s=(p/'scene.mjs').read_text()
s=s.replace("import {Backdrop} from './vendor/bg.js';","import {Backdrop} from './vendor/bg.js';\nimport {RenderBudget, PERFORMANCE_VERSION} from './render-budget.mjs';")
s=s.replace("from './audio-session.mjs';","from './audio-session.mjs?v=smooth-1';")
point="  const burst=(n,o,inn)=>"
s=s.replace(point,"  this.budget=new RenderBudget(this);this.performanceVersion=PERFORMANCE_VERSION;this._decorDt=0;this._tier=-1;this._bgShown=null;this._emptyFx=false;this._emptyBack=false;this._staticDirty=true;this._card=$('card');this._logo=document.querySelector('.logo-burst');\n"+point)
s=s.replace("apply(opts){this.opts={...opts};", "apply(opts){this.opts={...opts};this._staticDirty=true;")
s=s.replace("setScreen(screen){this.screen=screen;", "setScreen(screen){this.screen=screen;this._staticDirty=true;if(!['play','result'].includes(screen)){this.fx.parts.length=0;this.back.parts.length=0;}")
s=s.replace(" layout(){\n", " layout(){\n  this._staticDirty=true;\n")
s=s.replace("Math.min(6,Math.floor(this.E*7))", "Math.min(this.budget?.dancers??6,Math.floor(this.E*7))")
s=s.replace("this.audio.clear(E*.7);", "if(clean&&combo>0&&combo%5===0)this.audio.clear(E*.7);")
s=s[:s.index(' frame(dt,t){')]+''' frame(dt,t){
  if(document.hidden)return;
  const motion=this.opts.motion,playing=this.screen==='play'||this.screen==='result';
  this.budget.frame(t);
  if(this._tier!==this.budget.level){this._tier=this.budget.level;this.layout();}
  // Audio has its own 25 ms look-ahead scheduler; graphics never drive its clock.
  const at=this.audio.now(),last=this.audio.kicks.findLast(x=>x<=at);
  const beat=last===undefined?0:Math.exp(-Math.max(0,at-last)*13);
  this.visual+=(this.E-this.visual)*Math.min(1,dt*4);
  this.bg.state.E=motion?this.visual*Math.max(.6,motion):0;
  this.bg.state.kick=beat*motion;this.bg.state.reach=0;this.bg.state.flash=0;
  const shown=!!motion&&this.bg.state.E>.1;
  if(shown!==this._bgShown){this._bgShown=shown;this.bg.canvas.style.visibility=shown?'visible':'hidden';this.bg.fallback.style.visibility=shown?'visible':'hidden';}
  if(shown&&this.budget.backgroundDue(t))this.bg.render(t);
  // Keep the real hero and stretchy arm geometry at native rAF speed.
  if(this.hero.visible&&(motion||this._staticDirty)){
    this.hero.bob=motion?(playing?.7:.12):0;
    if(!motion){this.hero.lift=0;this.hero.rot=0;}
    this.hero.update(motion?dt:0,motion?t:0,{beat:beat*motion});
  }else if(!this.hero.visible){this.hero.root.style.display='none';this.hero.armsFront.style.display='none';}
  this._decorDt+=dt;
  if(this.budget.decorDue(t)){
    const elapsed=Math.min(.12,this._decorDt);this._decorDt=0;
    for(let i=0;i<this.friends.length;i++){
      const m=this.friends[i];
      if(m.visible&&motion){m.lift=Math.max(0,Math.sin(t/230+i*1.8))*13*this.E;m.tilt.target=Math.sin(t/250+i)*9*this.E;m.hands.forEach((h,j)=>h.raise=(.35+.25*Math.sin(t/200+i+j))*this.E);m.update(elapsed,t,{beat});m._painted=true;}
      else if(m._painted!==false){m.root.style.display='none';m.armsFront.style.display='none';m._painted=false;}
    }
    if(motion&&playing&&this.E>.45&&t-this.rainAt>Math.max(320,1700-this.E*1400)/this.budget.density){this.rainAt=t;this.back.rain(innerWidth,Math.round((2+this.E*5)*this.budget.density),{kinds:this.E>.8?['confetti','mini']:['confetti']});}
    if(motion){this.fx.update(elapsed);this.back.update(elapsed);}
    else{this.fx.parts.length=0;this.back.parts.length=0;}
    if(this.fx.parts.length||!this._emptyFx)this.fx.draw();this._emptyFx=!this.fx.parts.length;
    if(this.back.parts.length||!this._emptyBack)this.back.draw();this._emptyBack=!this.back.parts.length;
    // Scope the changing CSS variable to its consumer, not every DOM descendant.
    const pulse=(beat*motion).toFixed(2);if(this._pulse!==pulse){this._pulse=pulse;this._card.style.setProperty('--kick',pulse);}
    if(this.screen==='title'&&motion)this._logo.style.setProperty('--spin',t/300);
  }
  if(motion&&this.screen==='title'&&t>this.idleAt&&!document.querySelector('dialog[open]')){this.idleAt=t+4700;this.hero.celebrate(.08,{audio:null,variant:'earflap'});}
  this._staticDirty=false;
 }
}
'''
out['scene.mjs']=s
s=(p/'choice-motion.mjs').read_text().replace("new URL('./choice-motion.css',", "new URL('./choice-motion.css?v=smooth-1',")
s=s.replace('      let off = () => {};','''      let off = () => {};
      let geometryDirty = true;
      const dirty = () => { geometryDirty = true; };
      window.addEventListener('resize', dirty);
      document.addEventListener('scroll', dirty, true);
      window.visualViewport?.addEventListener('resize', dirty);''')
s=s.replace('        off();\n        bubble.remove();','''        off();
        window.removeEventListener('resize', dirty);
        document.removeEventListener('scroll', dirty, true);
        window.visualViewport?.removeEventListener('resize', dirty);
        bubble.remove();''')
s=s.replace("        Object.assign(from, centerOf(button));\n        Object.assign(to, centerOf(this.badge));", "        if (geometryDirty) {\n          Object.assign(from, centerOf(button)); Object.assign(to, centerOf(this.badge));\n          geometryDirty = false;\n        }")
s=s.replace("          bubble.style.left = x + 'px';\n          bubble.style.top = y + 'px';", "          bubble.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;")
s=s.replace("            grabbed = true;", "            grabbed = true; geometryDirty = true;")
out['choice-motion.mjs']=s
out['choice-motion.css']=(p/'choice-motion.css').read_text().replace('.word-game .choice-carry-label{position:fixed;', '.word-game .choice-carry-label{position:fixed;left:0;top:0;will-change:transform;')
out['word.css']=(p/'word.css').read_text()+'''\n/* Preserve the celebratory outline without repainting a large animated blur on slow devices. */
.word-game.perf-light.lv9 .card{box-shadow:0 7px 0 var(--ink),0 0 0 5px var(--pink),0 0 16px rgba(255,210,63,.35)}
.word-game.perf-light .spot{filter:none}
'''
out['index.html']=(p/'index.html').read_text().replace('app.mjs?v=choice-arm-1','app.mjs?v=smooth-1').replace('word.css?v=shared-1','word.css?v=smooth-1')
out['app.mjs']=(p/'app.mjs').read_text().replace("from './scene.mjs'", "from './scene.mjs?v=smooth-1'").replace("from './choice-motion.mjs'", "from './choice-motion.mjs?v=smooth-1'")
for name,text in out.items():
 assert sha256(text.encode()).hexdigest()==expected[name][1],'Output mismatch '+name
for name,text in out.items():
 (p/name).write_text(text);print('Verified patch',name,sha256(text.encode()).hexdigest())
