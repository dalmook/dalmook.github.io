// Original Dopa Drill drawing, choreography, synth music and particles are unmodified.
import {startClock,onFrame,clamp,centerOf} from './vendor/core.js';
import {Dopakichi} from './vendor/dopakichi.js';
import {AudioEngine} from './vendor/audio.js';
import {FX} from './vendor/fx.js';
import {Backdrop} from './vendor/bg.js';
const $=id=>document.getElementById(id);
export class Scene{
 constructor(){
  this.screen='title';this.E=.06;this.visual=.02;this.rainAt=0;this.idleAt=0;this.opts={motion:1,volume:55,muted:false};this.audio=new AudioEngine();
  this.fx=new FX($('fx'),270);this.back=new FX($('fx-back'),330);this.bg=new Backdrop($('bg'),$('rays-fallback'));
  this.hero=new Dopakichi($('actors-back'),{scale:.8,front:$('actors-front')});this.friends=['blue','yellow','mint','violet','pink','blue'].map(p=>new Dopakichi($('actors-back'),{palette:p,scale:.28,front:$('actors-front')}));
  const burst=(n,o,inn)=>Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n-Math.PI/2,r=i%2?inn:o;return`${i?'L':'M'}${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ')+'Z';
  $('burst-outer').setAttribute('d',burst(13,91,66));$('burst-inner').setAttribute('d',burst(13,72,54));
  $('flags').innerHTML=Array.from({length:14},(_,i)=>`<path d="M${5+i*29} ${5+Math.sin(i/13*Math.PI)*13} l12 20 12-18z" fill="${['#ff7ab6','#ffd23f','#3fdcb0','#a77bff'][i%4]}" stroke="#1b1d4d" stroke-width="2"/>`).join('');
  for(const el of document.querySelectorAll('.screen'))el.addEventListener('scroll',()=>this.layout(),{passive:true});
  window.addEventListener('resize',()=>this.layout());
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.audio.stopMusic();this.stopSpeech();}else if(['play','result'].includes(this.screen))this.audio.startMusic();});
  onFrame((dt,t)=>this.frame(dt,t));startClock();
 }
 apply(opts){this.opts={...opts};const a=this.audio;a.setMuted(opts.muted);a.setVolume(opts.volume/100);a.setSong(opts.song);this.hero.setPalette(opts.palette);this.hero.setCostume(opts.costume);this.bg.setTheme(opts.theme);this.fx.reduced=this.back.reduced=opts.motion===0;this.fx.motion=this.back.motion=opts.motion;document.body.classList.toggle('reduced',opts.motion===0);$('mute').textContent=opts.muted?'♩':'♪';$('mute').setAttribute('aria-pressed',String(opts.muted));$('mute').setAttribute('aria-label',opts.muted?'소리 켜기':'소리 끄기');}
 setScreen(screen){this.screen=screen;this.stopSpeech();this.hero.begin();this.hero.rot=0;this.hero.lift=0;this.hero.stretchX=this.hero.stretchY=1;this.hero.hands.forEach(h=>{h.cancel?.();h.job=0;h.cancel=null;h.mode='rest';h.carry=null;h.raise=0;});this.hero.resetFace();if(!['play','result'].includes(screen)){this.audio.stopMusic();this.energy(.06);}requestAnimationFrame(()=>this.layout());}
 layout(){
  let r,s,y;const h=this.hero;
  if(this.screen==='title'){r=$('title-stage').getBoundingClientRect();s=.78;y=r.bottom-3;}
  else if(this.screen==='play'){r=$('stage').getBoundingClientRect();s=clamp((r.height-10)/165,.38,.8);y=r.bottom-17;}
  else if(this.screen==='result'){r=document.querySelector('.result-card').getBoundingClientRect();s=.68;y=r.top-4;}
  else if(this.screen==='collection'){r=$('collection-stage').getBoundingClientRect();s=.78;y=r.bottom-4;}
  else{h.visible=false;this.friends.forEach(m=>m.visible=false);return;}
  h.visible=r.bottom>0&&r.top<innerHeight;h.S=s;h.place(r.left+r.width/2,y);const n=['play','result'].includes(this.screen)?Math.min(6,Math.floor(this.E*7)):0;
  this.friends.forEach((m,i)=>{const row=Math.floor(i/2),side=i%2?-1:1;m.visible=i<n&&!!this.opts.motion;m.S=innerWidth>800?.32:.23;const spread=innerWidth>800?180+row*75:104+row*20;m.place(clamp(h.x+side*spread,18,innerWidth-18),y+row*12);});this.bg.state.cx=h.x;this.bg.state.cy=y-75*s;
 }
 energy(n){this.E=clamp(n,.06,1.05);const l=Math.min(10,Math.floor(this.E*10));for(let i=0;i<=10;i++)document.body.classList.toggle('lv'+i,i<=l);document.body.style.setProperty('--E',this.E);this.audio.setLevel(l,112+Math.floor(this.E*28));const labels=['알파벳 에너지 충전 중','조금씩 신나는데?','단어 파티 시작!','콤보가 쌓여요!','도파 폭발!','영단어 대축제!'];$('fever-label').textContent=labels[Math.min(5,Math.floor(l/2))];this.layout();}
 start(){this.audio.unlock();this.audio.startMusic();this.audio.jingle();this.energy(.06);}
 tap(n=0){this.audio.unlock();this.audio.keyTap(n);}
 carry(from,to,text){if(this.opts.motion&&from&&to)this.hero.carry(centerOf(from),centerOf(to),text,{E:Math.min(1,this.E),onGrab:()=>this.audio.grab(),onPlace:()=>this.audio.place()});}
 swipe(el){if(this.opts.motion&&el)this.hero.swipe(centerOf(el));}
 cutin(text){if(!this.opts.motion)return;const el=document.createElement('div');el.className='word-cutin';el.textContent=text;$('cutins').append(el);this.audio.cutin();setTimeout(()=>el.remove(),950);}
 success(combo,clean){const E=Math.min(1,this.E);this.audio.correct(Math.max(1,combo),E);this.audio.clear(E*.7);if(!this.opts.motion)return;this.hero.celebrate(E,{big:combo%3===0||E>.7,audio:this.audio});const c=centerOf($('card'));this.fx.burst(c.x,c.y,{count:25+Math.round(E*60),speed:400+E*250,kinds:E>.65?['star','confetti','coin','mini']:['star','confetti'],up:120});this.fx.ring(c.x,c.y,{radius:90+E*60});if(clean&&combo&&combo%5===0){this.cutin(combo+'콤보!');this.back.fireworks(innerWidth,innerHeight,3);}if(E>.75)this.back.streamers(innerWidth,innerHeight,4);}
 wrong(el){this.audio.wrong(Math.min(1,this.E));if(this.opts.motion)this.hero.hurt(Math.min(.6,this.E),centerOf(el||$('card')),{audio:this.audio});}
 finale(){this.audio.finale();if(this.opts.motion){this.hero.celebrate(Math.min(1,this.E),{big:true,audio:this.audio});this.back.fireworks(innerWidth,innerHeight,4);this.back.rain(innerWidth,75,{kinds:['star','confetti']});}}
 stopSpeech(){if('speechSynthesis'in window)speechSynthesis.cancel();this.audio.setVolume(this.opts.volume/100);}
 speak(word){if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window))return false;this.stopSpeech();const voices=speechSynthesis.getVoices(),voice=voices.find(v=>/^en-US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));if(voices.length&&!voice)return false;const u=new SpeechSynthesisUtterance(word);u.lang=voice?.lang||'en-US';if(voice)u.voice=voice;u.rate=.78;u.onend=u.onerror=()=>this.audio.setVolume(this.opts.volume/100);this.audio.setVolume(this.opts.volume/100*.25);speechSynthesis.speak(u);return true;}
 frame(dt,t){if(document.hidden)return;const motion=this.opts.motion,playing=['play','result'].includes(this.screen);this.audio.update();const at=this.audio.now(),last=this.audio.kicks.findLast(x=>x<=at),beat=last===undefined?0:Math.exp(-Math.max(0,at-last)*13);this.visual+=(this.E-this.visual)*Math.min(1,dt*4);this.bg.state.E=motion?this.visual*Math.max(.6,motion):0;this.bg.state.kick=beat*motion;this.bg.state.reach=0;this.bg.state.flash=0;
  if(motion){this.hero.bob=playing?.7:.12;this.hero.update(dt,t,{beat});this.friends.forEach((m,i)=>{if(m.visible){m.lift=Math.max(0,Math.sin(t/230+i*1.8))*13*this.E;m.tilt.target=Math.sin(t/250+i)*9*this.E;m.hands.forEach((h,j)=>h.raise=(.35+.25*Math.sin(t/200+i+j))*this.E);}m.update(dt,t,{beat});});}
  else{this.hero.bob=0;this.hero.lift=0;this.hero.rot=0;this.hero.update(0,0,{});this.friends.forEach(m=>{m.visible=false;m.update(0,0,{});});}
  if(motion&&playing&&this.E>.45&&t-this.rainAt>Math.max(240,1700-this.E*1400)){this.rainAt=t;this.back.rain(innerWidth,Math.round(2+this.E*5),{kinds:this.E>.8?['confetti','mini']:['confetti']});}
  if(motion&&this.screen==='title'&&t>this.idleAt&&!document.querySelector('dialog[open]')){this.idleAt=t+4700;this.hero.celebrate(.08,{audio:null,variant:'earflap'});}
  this.bg.render(motion?t:0);this.fx.update(dt);this.back.update(dt);this.fx.draw();this.back.draw();document.body.style.setProperty('--kick',beat*motion);document.querySelector('.logo-burst').style.setProperty('--spin',motion?t/300:0);
 }
}
