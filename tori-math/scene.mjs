/* ACTION 2.0 — original real-time choreography, not a sprite-sheet or looping video. */
import {TAU,clamp,ease,oval,shape,star,line,round,drawBunny} from './rig.mjs';
import './action-ui.mjs';
export {star,drawBunny};
const THEMES=[['#e8fbff','#aaeed9','#568dcc','#637eb8','#3d5c8d','#42d8b5'],['#fff0e8','#ffd1b1','#c79be9','#a57cae','#775d8d','#ffb36e'],['#edf6ff','#c2dfff','#819fe7','#6579bc','#404f86','#88cfff'],['#f1edff','#e4ceff','#ad92d5','#7a67af','#433d80','#bc9fff'],['#edfcff','#c6f0f7','#8bbed4','#6395b5','#375e8d','#8af0e2'],['#fff1f8','#f2c7ec','#c1a2e5','#9c7bc4','#604a92','#ff9cdf']];
const PALETTE=['#ffda68','#fff','#8cf3df','#aa9aff','#ff9ed1'];
const TITLES={normal:'별빛 베기!',storm:'토리 회오리!',ice:'오로라 연격!',ultimate:'별빛 대폭발!'};
const DURATION={normal:.63,storm:.83,ice:.94,ultimate:1.6};
const rand=(a,b)=>a+Math.random()*(b-a);
const event=(type,detail)=>{if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('tori:'+type,{detail}));};
function cloud(c,x,y,s,color){c.save();c.translate(x,y);c.scale(s,s);oval(c,0,0,55,16,color);oval(c,-22,-12,25,23,color);oval(c,12,-19,30,30,color);oval(c,44,-5,25,18,color);c.restore();}
function rune(c,x,y,r,t,color,alpha=1){c.save();c.globalAlpha=alpha;c.translate(x,y);c.scale(1,.3);c.rotate(t);c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(0,0,r,0,TAU);c.arc(0,0,r*.84,0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8;line(c,Math.cos(a)*r*.84,Math.sin(a)*r*.84,Math.cos(a)*r*1.08,Math.sin(a)*r*1.08,color,3);}c.restore();}
function enemy(c,x,y,s,t,world,boss,hurt=0){
 const colors=['#9e8ee8','#ffb49a','#90c6ef','#b59cec','#b3e8e7','#eea7ce'];c.save();c.translate(x,y);c.scale(s,s);const sh=hurt?Math.sin(hurt*45)*.09:Math.sin(t*2.1)*.035;c.rotate(sh);const yb=Math.sin(t*2.8)*5;c.translate(0,yb);
 oval(c,0,4,53,9,'#20376429');
 if(boss){for(const d of [-1,1])shape(c,p=>{p.moveTo(d*39,-76);p.quadraticCurveTo(d*110,-162,d*113,-114);p.lineTo(d*77,-107);p.lineTo(d*91,-75);p.quadraticCurveTo(d*58,-89,d*43,-51);},colors[world],'#555081',3);}
 const grad=c.createLinearGradient(-48,-100,40,0);grad.addColorStop(0,'#fff');grad.addColorStop(.15,colors[world]);grad.addColorStop(1,'#8678bd');
 shape(c,p=>{p.moveTo(-48,-4);p.bezierCurveTo(-68,-36,-47,-105,1,-106);p.bezierCurveTo(54,-104,65,-26,47,-4);p.quadraticCurveTo(1,17,-48,-4);},grad,'#494b78',3.5);
 for(const d of [-1,1]){c.save();c.translate(d*45,-28);c.rotate(d*.3+Math.sin(t*3)*.15);oval(c,0,0,15,25,colors[world],'#494b78',3);c.restore();}
 oval(c,-10,-82,24,9,'#ffffff50');oval(c,-18,-46,7,11,'#45456b');oval(c,20,-46,7,11,'#45456b');oval(c,-20,-49,2,3,'#fff');oval(c,18,-49,2,3,'#fff');oval(c,-32,-31,9,5,'#ffc9dd');oval(c,34,-31,9,5,'#ffc9dd');
 shape(c,p=>{p.moveTo(-7,-28);p.quadraticCurveTo(2,-20,10,-28);},null,'#45456b',3);
 star(c,1,-73,10,'#fff0ab',Math.PI/5,world===4?6:5);
 if(boss){shape(c,p=>{p.moveTo(-27,-105);p.lineTo(-31,-134);p.lineTo(-12,-121);p.lineTo(0,-148);p.lineTo(15,-122);p.lineTo(32,-135);p.lineTo(27,-105);p.closePath();},'#ffe191','#5f5283',3);oval(c,0,-121,4,6,'#ffadcc');}
 else{for(const d of [-1,1])shape(c,p=>{p.moveTo(d*22,-103);p.quadraticCurveTo(d*55,-146,d*44,-104);},colors[world],'#494b78',3);}
 if(hurt>0){star(c,-66,-92,10,'#fff0a2',t*5);star(c,63,-112,8,'#fff',t*4);}
 c.restore();
}
export class Scene{
 constructor(canvas,mode='home'){
  this.canvas=canvas;this.c=canvas.getContext('2d');this.mode=mode;this.world=0;this.outfit='mint';this.motion='full';this.paused=false;this.t=0;this.last=performance.now();this.step=0;this.boss=false;this.combo=0;this.charge=0;this.fx=[];this.tokens=[];this.queue=[];this.current=null;this.heat=0;this.travel=0;this.velocity=0;this.freeze=0;this.hurt=0;this.shake=0;this.token='';this.win=false;this.winAge=0;this.nextDemo=3;this.geometry=null;this._observer=null;
  this.canvas.dataset.renderer='action-2.0';
  this.onTap=()=>{if(this.mode!=='arena')this.attack('storm',3);};canvas.addEventListener('pointerdown',this.onTap);
 }
 reset(world=0){this.world=clamp(Number(world)||0,0,5);this.step=0;this.boss=false;this.combo=0;this.heat=0;this.travel=0;this.velocity=0;this.current=null;this.queue=[];this.fx=[];this.tokens=[];this.token='';this.hurt=0;this.freeze=0;this.shake=0;this.win=false;this.winAge=0;this.last=performance.now();if(this.mode==='arena')event('reset',{scene:this});}
 input(value){
  const text=String(value);if(text.length>this.token.length&&this.geometry){const g=this.geometry;let tx=g.w*.5,ty=110;const answer=typeof document!=='undefined'&&document.querySelector('#answer');if(answer){const a=answer.getBoundingClientRect(),b=this.canvas.getBoundingClientRect();tx=a.x+a.width/2-b.x;ty=a.y+a.height/2-b.y;}
   this.tokens.push({text:text.slice(-1),age:0,x:g.hx,y:g.floor-g.size*120,tx,ty});if(this.tokens.length>8)this.tokens.shift();
  }this.token=text;if(this.mode==='arena')event('input',{value:text});
 }
 attack(kind='normal',combo=1){
  const k=DURATION[kind]?kind:'normal';this.combo=Number(combo)||0;if(k!=='ultimate')this.heat=Math.min(100,this.heat+1);this.win=false;const a={kind:k,age:0,duration:DURATION[k],hit:false,combo:this.combo};
  if(this.current&&this.current.kind==='ultimate'){this.queue.push(a);if(this.queue.length>2)this.queue.shift();}else this.current=a;
  this.velocity=Math.max(this.velocity,k==='ultimate'?240:100+this.heat*13);
  if(this.mode==='arena')event('attack',{kind:k,combo:this.combo,heat:this.heat,phase:Math.min(4,Math.floor(this.heat/2)),title:TITLES[k]});
 }
 celebrate(){this.win=true;this.winAge=0;this.current=null;this.queue=[];if(this.geometry){const g=this.geometry;this.burst(g.w*.24,g.floor-g.size*130,60);this.burst(g.w*.7,g.floor-g.size*140,60);}if(this.mode==='arena')event('win',{});}
 burst(x,y,n=40){const factor=this.motion==='full'?1:this.motion==='gentle'?.3:0,cap=this.canvas.clientWidth<600?150:230;for(let i=0;i<n*factor;i++){const a=rand(-Math.PI,0),v=rand(75,330);this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,age:0,life:rand(.5,1.3),r:rand(3,8),angle:rand(0,TAU),spin:rand(-7,7),color:PALETTE[i%PALETTE.length],star:i%3===0});}if(this.fx.length>cap)this.fx.splice(0,this.fx.length-cap);}
 impact(){const g=this.geometry;if(!g)return;const k=this.current?.kind||'normal';this.hurt=.42;this.shake=this.motion==='full'?(k==='ultimate'?9:4.5):0;this.freeze=this.motion==='full'?(k==='ultimate'?.065:.035):0;this.burst(g.ex,g.floor-g.es*56,k==='ultimate'?140:k==='normal'?42:76);if(this.mode==='arena')event('impact',{kind:k});}
 measure(){const r=this.canvas.getBoundingClientRect(),w=r.width,h=r.height;if(w<2||h<2)return null;const dpr=Math.min(window.devicePixelRatio||1,w<760?1.6:2);if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}let floor=h*.88,size=Math.min(w/470,h/300),hx=w*.45,ex=w*.81,es=size*.79,available=w;
  if(this.mode==='home'){hx=w*.7;size=Math.min(h/285,w/470);ex=w*.91;es=size*.59;}
  if(this.mode==='portrait'){hx=w*.5;size=Math.min(w/245,h/265);}
  if(this.mode==='arena'){
   const deck=document.querySelector('.control-deck'),board=document.querySelector('.math-board');const dr=deck?.getBoundingClientRect(),br=board?.getBoundingClientRect();
   if(w<760){floor=(dr?dr.top-r.top:h*.69)-24;const top=br?br.bottom-r.top:200;size=Math.min(clamp((floor-top-14)/240,.42,1.27),w/385);hx=w*.28;ex=w*.76;es=size*.78;}
   else{available=dr?dr.left-r.left-22:w*.72;floor=h-105;size=clamp((floor-(br?br.bottom-r.top:220))/255,.72,1.75);size=Math.min(size,available/505);hx=available*.29;ex=available*.79;es=size*.86;}
  }
  return {w,h,dpr,floor,size,hx,ex,es,available};
 }
 backdrop(c,g,t){
  const {w,h,floor}=g,p=THEMES[this.world],home=this.mode!=='arena';const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,p[0]);sky.addColorStop(.46,p[1]);sky.addColorStop(1,p[2]);c.fillStyle=sky;c.fillRect(0,0,w,h);
  // Moving aurora and a warm sun; none of these layers are raster images.
  const sunX=home?w*.8:w*.83,sunY=h*.19;const glow=c.createRadialGradient(sunX,sunY,5,sunX,sunY,Math.min(w,h)*.43);glow.addColorStop(0,'#fffcefcc');glow.addColorStop(1,'#fffcef00');c.fillStyle=glow;c.fillRect(0,0,w,h);oval(c,sunX,sunY,38,38,'#fffbe8');
  for(let j=0;j<3;j++){c.save();c.globalAlpha=.16;shape(c,q=>{q.moveTo(-100,h*.08+j*37);q.bezierCurveTo(w*.2,h*.5+Math.sin(t*.15+j)*40,w*.7,-150,w+100,h*.3+j*40);q.lineTo(w+100,h*.36+j*40);q.bezierCurveTo(w*.7,-50,w*.2,h*.6,-100,h*.17+j*37);},['#fff','#9affec','#b5a1ff'][j]);c.restore();}
  for(let j=0;j<5;j++){const x=((j*w*.27+this.travel*-.08)%(w+240)+w+240)%(w+240)-100;cloud(c,x,h*.19+(j%3)*27,.7+(j%2)*.38,'#ffffffa0');}
  for(let layer=0;layer<3;layer++){const base=floor-20-(2-layer)*65,step=150+layer*18,scroll=this.travel*(.08+layer*.1);shape(c,q=>{q.moveTo(0,h);q.lineTo(0,base);for(let x=-step;x<w+step;x+=step){const xx=x-(scroll%step),yy=base-Math.sin((x+layer*161)*.008)*28;q.quadraticCurveTo(xx+step*.4,yy-90+layer*18,xx+step,yy);}q.lineTo(w,h);q.closePath();},p[2+layer]);}
  // Distant floating islands, pines and ruined portals give depth to the journey.
  c.save();c.globalAlpha=.5;for(let i=0;i<9;i++){const x=((i*193-this.travel*.22)%(w+250)+w+250)%(w+250)-100;const yy=floor-65-(i%3)*18;line(c,x,yy-12,x,yy-117,p[4],7);for(let j=0;j<3;j++)shape(c,q=>{q.moveTo(x,yy-135+j*25);q.lineTo(x-26-j*6,yy-78+j*25);q.quadraticCurveTo(x,yy-66+j*25,x+26+j*6,yy-78+j*25);q.closePath();},p[3]);}c.restore();
  c.save();c.translate(g.ex,floor-13);c.scale(g.es*1.6,g.es*1.6);c.strokeStyle=p[1]+'70';c.lineWidth=10;c.beginPath();c.arc(0,-38,70,Math.PI,TAU);c.stroke();for(const a of [-1,1])round(c,a*70-8,-40,16,49,3,p[1]+'70');c.restore();
  const ground=c.createLinearGradient(0,floor-7,0,h);ground.addColorStop(0,'#d8f7dc');ground.addColorStop(.08,p[5]);ground.addColorStop(.13,p[4]);ground.addColorStop(1,'#283c60');shape(c,q=>{q.moveTo(0,floor);q.bezierCurveTo(w*.32,floor-18,w*.64,floor+16,w,floor-8);q.lineTo(w,h);q.lineTo(0,h);q.closePath();},ground);
  for(let i=0;i<23;i++){const x=((i*81-this.travel*.6)%(w+100)+w+100)%(w+100)-35;line(c,x,floor+randStable(i)*8,x+7,floor-7-randStable(i+1)*9,p[5],3);if(i%3===0){star(c,x,floor-7,5,'#fff4bf',t*.1,5);oval(c,x+15,floor+20,12,3,'#182e5020');}}
  const ambient=this.motion==='off'?0:Math.min(32,10+this.heat*2);for(let i=0;i<ambient;i++){const x=(randStable(i+22)*w+t*(6+i%4))%w,y=floor-30-randStable(i+100)*Math.min(260,h*.45)+Math.sin(t+i)*10;c.globalAlpha=.4+Math.sin(t*2+i)*.2;star(c,x,y,2+i%3,PALETTE[i%5],t*.15,4);}c.globalAlpha=1;
 }
 draw(now){
  const g=this.measure();if(!g){this.last=now;return;}this.geometry=g;const dt=this.paused?0:Math.min(.035,Math.max(0,(now-this.last)/1000));this.last=now;if(!this.paused){this.t+=dt;this.velocity*=Math.exp(-dt*2.5);this.travel+=dt*(this.motion==='off'?0:12+this.velocity);this.hurt=Math.max(0,this.hurt-dt);this.shake*=Math.exp(-dt*17);if(this.freeze>0)this.freeze-=dt;else if(this.current)this.current.age+=dt;this.winAge+=dt;}
  const t=this.motion==='off'?0:this.t,c=this.c;const moving=this.motion!=='off'&&!this.paused;
  if(this.mode==='home'&&moving&&this.t>this.nextDemo){this.attack(this.nextDemo%2?'normal':'storm',3);this.nextDemo=this.t+7;this.heat=0;}
  if(this.current){const hitAt=this.current.kind==='ultimate'?.56:this.current.kind==='ice'?.34:.22;if(!this.current.hit&&this.current.age>=hitAt){this.current.hit=true;this.impact();}if(this.current.age>this.current.duration)this.current=this.queue.shift()||null;}
  c.setTransform(g.dpr,0,0,g.dpr,0,0);c.clearRect(0,0,g.w,g.h);c.save();if(this.motion==='full')c.translate(Math.sin(this.t*130)*this.shake,Math.cos(this.t*109)*this.shake*.45);this.backdrop(c,g,t);
  if(this.mode==='portrait'){rune(c,g.hx,g.floor,68*g.size,t*.25,'#dbfdff',.8);drawBunny(c,g.hx,g.floor,g.size,t,'wave',0,this.outfit);c.restore();return;}
  let x=g.hx,y=g.floor,pose=this.win?'happy':this.mode==='home'?'wave':'idle',p=0,kind=null,rotation=0;const a=this.current;
  if(a&&this.motion!=='off'){kind=a.kind;p=clamp(a.age/a.duration);const distance=(g.ex-g.hx)*(this.motion==='gentle'?.34:.78);
   if(kind==='normal'){const advance=p<.36?ease((p-.1)/.26):1-ease((p-.47)/.53);x+=distance*advance;pose=p<.17?'run':'attack';}
   if(kind==='storm'){x+=distance*Math.sin(p*Math.PI);y-=Math.sin(p*Math.PI)*90*g.size;rotation=this.motion==='full'&&p>.18&&p<.8?(p-.18)/.62*TAU:0;pose='spin';}
   if(kind==='ice'){x+=distance*.37*Math.sin(p*Math.PI);y-=Math.sin(p*Math.PI)*30*g.size;pose='ultimate';}
   if(kind==='ultimate'){y-=Math.sin(p*Math.PI)*55*g.size;pose='ultimate';}
  }
  if(this.mode==='arena'||this.current)enemy(c,g.ex+(this.hurt?Math.sin(this.t*21)*g.es*7:0),g.floor,g.es*(this.boss?1.13:1),t,this.world,this.boss,this.hurt);
  if(this.heat>=4||kind==='ultimate')rune(c,x,g.floor,70*g.size,t*.7,kind==='ultimate'?'#ffe09c':'#bffff0',.72);
  if(a&&p>.13&&p<.62&&this.motion==='full'){for(let j=3;j>0;j--){c.save();c.globalAlpha=(4-j)*.1;drawBunny(c,x-j*25*g.size,y+j*4,g.size,t-j*.045,pose,p,this.outfit);c.restore();}}
  oval(c,x,g.floor+4,48*g.size,8*g.size,'#17365130');c.save();if(rotation){c.translate(x,y-90*g.size);c.rotate(rotation);c.translate(-x,-y+90*g.size);}drawBunny(c,x,y,g.size,t,pose,p,this.outfit);c.restore();
  if(a&&this.motion!=='off')this.drawAttack(c,g,a,x,y,p);
  if(a&&this.motion==='off'){round(c,g.ex-45,g.floor-100,90,30,12,'#fff9e2');c.fillStyle='#403565';c.textAlign='center';c.font='bold 16px sans-serif';c.fillText('정답!',g.ex,g.floor-79);}
  for(const f of this.fx){if(!this.paused){f.age+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=360*dt;f.angle+=f.spin*dt;}c.save();c.globalAlpha=clamp(1-f.age/f.life);if(f.star)star(c,f.x,f.y,f.r,f.color,f.angle);else{c.translate(f.x,f.y);c.rotate(f.angle);c.fillStyle=f.color;c.fillRect(-f.r/2,-f.r/2,f.r*1.4,f.r*.6);}c.restore();}this.fx=this.fx.filter(f=>f.age<f.life);
  for(const q of this.tokens){if(!this.paused)q.age+=dt;const k=clamp(q.age/.55),e=ease(k);const tx=q.x+(q.tx-q.x)*e,ty=q.y+(q.ty-q.y)*e-Math.sin(k*Math.PI)*45;c.save();c.globalAlpha=clamp((1-k)*4);if(this.motion!=='off'){drawBunny(c,tx,ty+43,.22,t*1.8,'carry');round(c,tx-17,ty-18,34,34,11,'#fff','#cbb2ff');c.fillStyle='#7951c9';c.font='900 23px sans-serif';c.textAlign='center';c.fillText(q.text,tx,ty+7);}c.restore();}this.tokens=this.tokens.filter(q=>q.age<.6);
  c.restore();this.canvas.dataset.phase=String(Math.min(4,Math.floor(this.heat/2)));this.canvas.dataset.particles=String(this.fx.length);this.canvas.dataset.pose=pose;
 }
 drawAttack(c,g,a,x,y,p){
  const {kind}=a,hx=g.ex,hy=g.floor-g.es*63,alpha=clamp(Math.sin(p*Math.PI)*1.7);c.save();c.globalAlpha=alpha;c.lineCap='round';
  if(kind==='normal'||kind==='storm'){
   const n=kind==='storm'?3:1;for(let j=0;j<n;j++){c.save();c.translate(x+g.size*34,y-g.size*92);c.rotate(-.8+p*3.4+j*.65);c.scale(1,kind==='storm'?.7:.44);const r=g.size*(105+j*18);for(const [width,color] of [[30,'#8168ee35'],[15,'#c5a9ff'],[7,'#fffce1']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(0,0,r,-2.7,1);c.stroke();}c.restore();}
  }
  if(kind==='ice'){
   for(let j=0;j<5;j++){const local=clamp((p-j*.045)*2.1),ix=hx+(j-2)*23*g.es,iy=hy-170*(1-local);c.save();c.translate(ix,iy);c.rotate(.4);shape(c,q=>{q.moveTo(0,-49);q.lineTo(13,-7);q.lineTo(0,22);q.lineTo(-13,-7);q.closePath();},j%2?'#dfffff':'#b8a3ff','#fff',2);c.restore();}
   c.strokeStyle='#c7fff5';c.lineWidth=6;c.beginPath();c.moveTo(x+55*g.size,y-114*g.size);c.quadraticCurveTo((x+hx)/2,hy-70,hx,hy);c.stroke();
  }
  if(kind==='ultimate'){
   rune(c,hx,g.floor,clamp(p*3)*155*g.es,-this.t,'#fff0ac');
   if(p<.34){c.save();c.globalAlpha=Math.sin(p/.34*Math.PI)*.93;const yy=g.floor-g.size*183;shape(c,q=>{q.moveTo(0,yy-35);q.lineTo(g.available||g.w,yy-95);q.lineTo(g.available||g.w,yy+50);q.lineTo(0,yy+104);q.closePath();},'#51417fcc');drawBunny(c,g.w*.3,yy+151,g.size*1.3,this.t,'ultimate',p,this.outfit);c.restore();}
   if(p>.27){const mp=clamp((p-.27)/.23);const mx=hx+220*(1-mp),my=hy-400*(1-mp);line(c,mx+190,my-300,mx,my,'#ffedab99',34*g.es);line(c,mx+190,my-300,mx,my,'#fffde7',10*g.es);star(c,mx,my,clamp((1-p)*3)*65*g.es,'#ffe177',this.t*2);star(c,mx,my,30*g.es,'#fff9d9',this.t*2);}
  }
  if(a.hit){const hitAge=Math.max(0,a.age-(kind==='ultimate'?.56:kind==='ice'?.34:.22));const pop=clamp(1-hitAge/.34);if(pop>0){c.save();c.globalAlpha=pop*.85;c.translate(hx,hy);c.rotate(kind==='normal'?.3:0);star(c,0,0,(52+kind.length*5)*g.es*(1.5-pop*.5),'#fffad1',.1,8);star(c,0,0,29*g.es,'#fff');c.restore();}}
  if(a.combo>=3||kind==='ultimate'){const title=TITLES[kind],size=clamp(g.w/28,17,35);c.save();c.globalAlpha=alpha;c.translate(g.available*.5,g.floor-g.size*208);c.rotate(-.04);c.font=`900 ${size}px "Noto Sans CJK KR",sans-serif`;c.textAlign='center';c.strokeStyle='#fff';c.lineWidth=7;c.strokeText(title,0,0);c.fillStyle=kind==='ultimate'?'#aa51c9':'#6050a4';c.fillText(title,0,0);c.restore();}
  c.restore();
 }
 dispose(){this.canvas.removeEventListener('pointerdown',this.onTap);this.fx=[];this.tokens=[];this.queue=[];}
}
function randStable(n){return (Math.sin(n*127.13+78.3)*43758.5453)%1*.5+.5;}
