/* Original vector-rigged white rabbit and action renderer. Every visible game asset is drawn here. */
const TAU=Math.PI*2;
const palettes=[
 ['#182c49','#2c5470','#3b7b79','#73b49c','#a7dbb3'],
 ['#302e57','#815a71','#b97b72','#dea25c','#f6cf87'],
 ['#243d6b','#5078a3','#77a2c1','#a6d8e4','#e2f3ef'],
 ['#211c49','#403365','#67588d','#9c8fc6','#d2c2ec'],
 ['#223e59','#42748e','#8abbca','#c6e2e8','#eaf7fa'],
 ['#242448','#414677','#826992','#b497b6','#e3b9cb']
];
const colors={mint:'#36b8a3',coral:'#f58054',violet:'#9c7aeb',gold:'#eabf48',night:'#5475b9'};
function ellipse(c,x,y,rx,ry,fill,stroke=null,lw=3){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function path(c,pts,fill,stroke=null,lw=3){c.beginPath();pts(c);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function line(c,x,y,a,b,color,w=3){c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
export function star(c,x,y,r,color,angle=0,points=5){c.save();c.translate(x,y);c.rotate(angle);path(c,p=>{for(let i=0;i<points*2;i++){const a=i*Math.PI/points-Math.PI/2,rad=i%2?r*.46:r;i?p.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):p.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);}p.closePath();},color);c.restore();}
function diamond(c,x,y,r,color){path(c,p=>{p.moveTo(x,y-r);p.quadraticCurveTo(x+r*.2,y-r*.2,x+r,y);p.quadraticCurveTo(x+r*.2,y+r*.2,x,y+r);p.quadraticCurveTo(x-r*.2,y+r*.2,x-r,y);p.quadraticCurveTo(x-r*.2,y-r*.2,x,y-r);},color);}
function cloud(c,x,y,s,color){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,0,0,60,20,color);ellipse(c,-25,-12,25,23,color);ellipse(c,18,-20,33,31,color);ellipse(c,48,-4,30,17,color);c.restore();}
function wing(c,x,y,s,t,color){c.save();c.translate(x,y);c.scale(s,s);c.rotate(Math.sin(t)*.25);ellipse(c,0,0,12,5,color);c.restore();}
function rune(c,x,y,r,t,color){c.save();c.translate(x,y);c.rotate(t);c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a+TAU/3)*r,Math.sin(a+TAU/3)*r);}c.stroke();c.restore();}
export function drawBunny(c,x,y,scale=1,t=0,pose='idle',power=0,outfit='mint',face=1){
 const trim=colors[outfit]||colors.mint,ink='#334b65',attack=pose==='attack'||pose==='ultimate',wave=pose==='wave',joy=pose==='happy';
 const swing=attack?Math.sin(power*Math.PI):0,walk=pose==='run'?Math.sin(t*18):0,bob=Math.sin(t*3)*3;
 c.save();c.translate(x,y);c.scale(scale*face,scale);
 ellipse(c,0,7,72,10,'#06132940');
 c.translate(0,bob-(attack?Math.sin(power*Math.PI)*28:0));c.rotate(attack?.11*swing:Math.sin(t*2)*.025);
 // Scarf tails: independent curves create drag during a lunge.
 path(c,p=>{p.moveTo(-31,-115);p.bezierCurveTo(-62,-114,-86,-132-Math.sin(t*6)*10,-105-swing*50,-99);p.lineTo(-100-swing*45,-69);p.lineTo(-70,-78);p.bezierCurveTo(-53,-90,-39,-68,-21,-111);},trim,ink,4);
 path(c,p=>{p.moveTo(-27,-109);p.bezierCurveTo(-68,-83,-78,-89+Math.sin(t*7)*7,-80,-43);p.lineTo(-59,-58);p.lineTo(-37,-48);p.quadraticCurveTo(-47,-92,-19,-104);},trim,ink,4);
 // Fluffy tail and legs.
 ellipse(c,-48,-38,23,24,'#f9fdff',ink,4);ellipse(c,-52,-44,11,13,'#fff');
 for(const side of [-1,1]){c.save();c.translate(side*29,-23);c.rotate(side*walk*.5+(attack?side*.24*swing:0));ellipse(c,2,10,26,33,'#f9fdff',ink,4);ellipse(c,side*4,25,30,17,'#fff',ink,4);ellipse(c,side*4,27,16,7,'#d8e6ee');c.restore();}
 const fur=c.createLinearGradient(-50,-130,50,-20);fur.addColorStop(0,'#fff');fur.addColorStop(.65,'#fff');fur.addColorStop(1,'#dceaf4');
 ellipse(c,0,-69,50,62,fur,ink,4);
 // Explorer tunic, belt and star clasp.
 path(c,p=>{p.moveTo(-40,-105);p.quadraticCurveTo(0,-116,40,-104);p.lineTo(41,-42);p.quadraticCurveTo(0,-27,-41,-43);p.closePath();},trim,ink,4);
 path(c,p=>{p.moveTo(-15,-105);p.lineTo(-10,-35);p.lineTo(18,-36);p.lineTo(16,-102);},'#ffffff40');
 rr(c,-46,-54,91,14,5,'#334b65');rr(c,-6,-58,19,22,5,'#ffd478',ink);
 // Arms have separate joints, rather than moving a static picture.
 c.save();c.translate(-39,-96);c.rotate(attack?-1.1*swing:wave?.2:Math.sin(t*3)*.1);ellipse(c,-8,24,18,33,fur,ink,4);ellipse(c,-12,47,20,19,'#fff',ink,4);c.restore();
 c.save();c.translate(38,-99);c.rotate(attack?-1.7*swing:wave?-2.05+Math.sin(t*6)*.25:joy?-1.9:Math.sin(t*3+.5)*.12);ellipse(c,7,22,18,34,fur,ink,4);ellipse(c,10,47,20,19,'#fff',ink,4);
 if(!wave&&!joy){c.save();c.translate(25,38);c.rotate(.24);rr(c,-5,-35,10,78,5,'#e7b960',ink);if(outfit==='coral'){path(c,p=>{p.moveTo(-15,-30);p.lineTo(0,-125);p.lineTo(20,-28);p.closePath();},'#ff9b59',ink,4);line(c,-11,-35,22,-35,'#61b78c',8);line(c,2,-112,7,-45,'#ffcb87',3);}else{star(c,0,-48,31,'#ffe497',t*.08);star(c,0,-48,20,'#fff7c0');ellipse(c,-4,-54,4,4,'#fff');}c.restore();}else{ellipse(c,12,49,9,7,'#f7bfc8');for(const n of [-1,0,1])ellipse(c,12+n*8,39,3.3,4,'#f7bfc8');}c.restore();
 // Distinctive asymmetric long white ears, softly pink on the inside.
 for(const side of [-1,1]){c.save();c.translate(side*46,-204);c.rotate(side*Math.sin(t*3+side)*.07+swing*.9);c.scale(side,1);path(c,p=>{p.moveTo(-13,2);p.bezierCurveTo(0,-29,33,-32,47,-7);p.bezierCurveTo(70,25,99,76,77,94);p.bezierCurveTo(56,113,38,82,29,48);p.quadraticCurveTo(23,26,8,23);p.closePath();},fur,ink,4);path(c,p=>{p.moveTo(23,3);p.bezierCurveTo(38,0,43,32,55,51);p.bezierCurveTo(74,85,57,89,47,66);p.bezierCurveTo(39,50,30,25,23,3);},'#f8ccd7');c.restore();}
 // Head with fur tufts and cel shading.
 path(c,p=>{p.moveTo(-66,-177);p.bezierCurveTo(-68,-217,-35,-230,-12,-223);p.lineTo(-4,-235);p.lineTo(8,-226);p.lineTo(23,-234);p.lineTo(30,-220);p.bezierCurveTo(72,-216,78,-173,64,-146);p.bezierCurveTo(46,-113,-47,-110,-64,-146);p.quadraticCurveTo(-82,-152,-66,-177);},fur,ink,4.5);
 path(c,p=>{p.moveTo(-60,-147);p.quadraticCurveTo(0,-101,61,-147);p.quadraticCurveTo(39,-109,-22,-124);p.quadraticCurveTo(-53,-126,-60,-147);},'#dceaf060');
 const blink=(t%4.7)>4.48||joy;
 for(const side of [-1,1]){const ex=side*26+5;if(blink){path(c,p=>{p.moveTo(ex-10,-164);p.quadraticCurveTo(ex,-175,ex+10,-164);},null,ink,4);}else{ellipse(c,ex,-168,11.8,17.5,ink);ellipse(c,ex-3,-174,4.2,5,'#fff');ellipse(c,ex+4,-162,2.4,3,'#a7d9e8');}ellipse(c,side*44,-146,11,6,'#f7b7c380');}
 if(attack){line(c,-33,-190,-16,-184,ink,4);line(c,24,-184,41,-190,ink,4);}
 path(c,p=>{p.moveTo(-5,-151);p.quadraticCurveTo(4,-155,12,-151);p.quadraticCurveTo(8,-143,3,-143);p.closePath();},'#ed9da9');
 line(c,3,-142,3,-136,ink,2.5);path(c,p=>{p.moveTo(-8,-136);p.quadraticCurveTo(-2,-129,3,-136);p.quadraticCurveTo(9,-129,15,-136);},null,ink,2.5);
 if(joy||wave){path(c,p=>{p.moveTo(-3,-133);p.quadraticCurveTo(4,-114,12,-133);},'#de8798');}
 // Collar lays on top of the chin, keeping the rabbit's face completely white.
 path(c,p=>{p.moveTo(-41,-120);p.quadraticCurveTo(0,-102,40,-119);p.lineTo(37,-106);p.quadraticCurveTo(0,-88,-39,-108);p.closePath();},trim,ink,3.5);star(c,6,-107,14,'#ffdc7b');
 if(outfit==='violet'){path(c,p=>{p.moveTo(-53,-218);p.lineTo(-11,-283);p.quadraticCurveTo(22,-268,38,-222);p.closePath();},trim,ink,4);ellipse(c,-5,-221,59,12,trim,ink,4);star(c,-3,-250,11,'#ffe49c');}
 if(outfit==='gold'){path(c,p=>{p.moveTo(-30,-221);p.lineTo(-35,-253);p.lineTo(-14,-238);p.lineTo(0,-265);p.lineTo(14,-238);p.lineTo(35,-253);p.lineTo(30,-221);p.closePath();},'#f9d567',ink,3);ellipse(c,0,-239,4,6,'#ed8b91');}
 c.restore();
}
function monster(c,x,y,s,t,world,boss=false,hurt=0){
 const col=['#8bddb6','#f5c184','#afd4f9','#baadeb','#d4eff7','#e9b5df'][world];c.save();c.translate(x,y);c.scale(s,s);c.rotate(hurt?Math.sin(hurt*30)*.12:Math.sin(t*2)*.035);const by=Math.sin(t*3.5)*6;
 ellipse(c,0,5,boss?82:52,10,'#04132830');c.translate(0,by);
 if(boss){wing(c,-70,-80,3,t*5,col);wing(c,70,-80,3,-t*5,col);}
 path(c,p=>{p.moveTo(-56,0);p.bezierCurveTo(-75,-21,-48,-97,0,-102);p.bezierCurveTo(49,-97,76,-21,56,0);p.quadraticCurveTo(0,19,-56,0);},col,'#37526c',3.8);
 ellipse(c,-19,-72,21,13,'#ffffff30');ellipse(c,-21,-39,5,9,'#34485e');ellipse(c,22,-39,5,9,'#34485e');ellipse(c,-30,-26,8,4,'#ee9bb37a');ellipse(c,31,-26,8,4,'#ee9bb37a');path(c,p=>{p.moveTo(-6,-26);p.quadraticCurveTo(1,-19,8,-26);},null,'#34485e',3);
 if(world===0){path(c,p=>{p.moveTo(-2,-99);p.quadraticCurveTo(-44,-131,-38,-104);p.quadraticCurveTo(-20,-86,-2,-99);p.quadraticCurveTo(14,-141,31,-124);p.quadraticCurveTo(36,-106,-2,-99);},'#4f9f81','#37526c',3);}
 if(world===1){rr(c,-40,-104,80,21,7,'#cd8b63');ellipse(c,-13,-93,4,4,'#845b49');ellipse(c,22,-97,4,4,'#845b49');}
 if(world===2){cloud(c,0,-95,.64,'#eef8ff');}
 if(world===3){rr(c,-50,-103,98,22,5,'#647198');rr(c,-45,-98,88,11,3,'#f0e9d6');}
 if(world===4){star(c,0,-103,20,'#fff',t*.15,6);}
 if(world===5){path(c,p=>{p.moveTo(-42,-78);p.lineTo(-59,-124);p.lineTo(-20,-97);p.moveTo(42,-78);p.lineTo(59,-124);p.lineTo(20,-97);},'#efd782','#37526c',3);}
 if(boss){path(c,p=>{p.moveTo(-26,-108);p.lineTo(-31,-138);p.lineTo(-13,-129);p.lineTo(0,-150);p.lineTo(13,-129);p.lineTo(31,-138);p.lineTo(26,-108);p.closePath();},'#ffdf83','#37526c',3);}
 if(hurt>0){star(c,-68,-108,10,'#ffe39c',t*2);star(c,70,-96,8,'#ffe39c',-t*3);}
 c.restore();
}
export class Scene{
 constructor(canvas,mode='home'){
  this.canvas=canvas;this.c=canvas.getContext('2d');this.mode=mode;this.world=0;this.outfit='mint';this.t=0;this.fx=[];this.attackAge=10;this.attackKind='normal';this.enemyHurt=0;this.combo=0;this.charge=0;this.step=0;this.boss=false;this.paused=false;this.motion='full';this.token='';this.tokenAge=2;this.banner='';this.bannerAge=5;this.win=false;this.last=performance.now();
  let seed=1807;this.rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};this.dots=Array.from({length:65},()=>({x:this.rand(),y:this.rand(),s:this.rand(),p:this.rand()*TAU}));
 }
 input(value){this.token=value;this.tokenAge=0;}
 reset(world=0){this.world=world;this.fx=[];this.step=0;this.combo=0;this.charge=0;this.boss=false;this.win=false;this.attackAge=10;this.enemyHurt=0;this.bannerAge=10;this.token='';}
 celebrate(){this.win=true;this.burst(550,250,80,'#ffdc79');this.banner='탐험 완료!';this.bannerAge=0;}
 attack(kind='normal',combo=1){this.attackAge=0;this.attackKind=kind;this.combo=combo;this.enemyHurt=1;this.token='';this.banner=kind==='ultimate'?'별똥별 각성!':kind==='storm'?'당근 회오리!':kind==='ice'?'빙결의 별빛!':combo>=3?`${combo} COMBO!`:'';this.bannerAge=0;const color=kind==='ice'?'#a9edff':kind==='ultimate'?'#e2bcff':'#ffe497';this.burst(770,this.H*.74-70,kind==='ultimate'?75:kind==='normal'?22:40,color);}
 burst(x,y,n,col){if(this.motion==='off')n=Math.min(6,n);if(this.motion==='gentle')n=Math.round(n*.45);for(let i=0;i<n;i++){const a=this.rand()*TAU,v=60+this.rand()*280;this.fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,life:.5+this.rand()*.9,max:1.4,r:3+this.rand()*7,col,angle:this.rand()*TAU,star:this.rand()>.45});}if(this.fx.length>180)this.fx.splice(0,this.fx.length-180);}
 draw(now){
  const rect=this.canvas.getBoundingClientRect();if(rect.width<1||rect.height<1){this.last=now;return;}
  const dt=Math.min(.035,(now-this.last)/1000);this.last=now;
  if(!this.paused){this.t+=dt;this.attackAge+=dt;this.enemyHurt=Math.max(0,this.enemyHurt-dt*1.3);this.tokenAge+=dt;this.bannerAge+=dt;for(const p of this.fx){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;p.angle+=dt*3;}this.fx=this.fx.filter(p=>p.life>0);}
  const dpr=Math.min(window.devicePixelRatio||1,2);const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const c=this.c,W=1100,H=this.H=rect.height/rect.width*1100,k=Math.min(1.35,H/600),ground=H*.79,t=this.motion==='off'?0:this.t;
  c.setTransform(w/W,0,0,h/H,0,0);c.clearRect(0,0,W,H);c.lineJoin='round';c.lineCap='round';c.save();
  const power=this.attackAge<.65?this.attackAge/.65:0,attack=power>0&&power<1;
  if(attack&&this.motion==='full'){c.translate(Math.sin(this.attackAge*95)*3*(1-power),Math.cos(this.attackAge*79)*2*(1-power));}
  if(this.mode==='portrait'){
   const g=c.createRadialGradient(W/2,H*.53,0,W/2,H*.53,W*.52);g.addColorStop(0,'#e7f5ef');g.addColorStop(1,'#f7faf9');c.fillStyle=g;c.fillRect(0,0,W,H);rune(c,W/2,H*.62,Math.min(210,H*.28),t*.04,'#a1c9bf55');drawBunny(c,W*.5,H*.89,Math.min(H/350,2.0),t,this.win?'happy':'wave',0,this.outfit);c.restore();return;
  }
  this.background(c,W,H,ground,t,k);
  const home=this.mode==='home',baseX=home?W*.5:W*.245,lunge=attack?Math.sin(power*Math.PI)*340:0,bunnyX=baseX+lunge;
  // Ambient spirit companion, orbiting sparkles and ground rings.
  if(home){rune(c,W*.5,ground+5,115,t*.07,'#ddf8d533');c.save();c.translate(790,ground-195+Math.sin(t*2)*12);ellipse(c,0,0,19,22,'#d7fcdf');wing(c,-22,0,1,t*8,'#f5ffda');wing(c,22,0,1,-t*8,'#f5ffda');ellipse(c,-5,-2,2,3,'#447a71');ellipse(c,6,-2,2,3,'#447a71');c.restore();}
  if(!home){
   const enemyScale=(this.boss?1.42:.94)*k,ex=825+(this.enemyHurt?Math.sin(this.enemyHurt*20)*13:0);
   monster(c,ex,ground,enemyScale,t,this.world,this.boss,this.enemyHurt);
   if(this.boss){const rem=3-(this.step%10-7);for(let i=0;i<3;i++){diamond(c,ex-27+i*27,ground-220*k,9,i<rem?'#ffda8d':'#ffffff25');}}
   else {for(let i=0;i<2;i++)monster(c,980+i*95,ground-17+i*4,.43*k,t+i*2,this.world,false,0);}
   if(attack&&this.motion!=='off'){this.slash(c,bunnyX,ground,k,power,this.attackKind,t,W,H);}
  }else{monster(c,830,ground+8,.52*k,t,this.world,false,0);}
  if(attack&&this.motion==='full'){c.save();c.globalAlpha=.10;drawBunny(c,bunnyX-45,ground,1.08*k,t,'attack',power,this.outfit);c.globalAlpha=.06;drawBunny(c,bunnyX-83,ground,1.08*k,t,'attack',power,this.outfit);c.restore();}
  drawBunny(c,bunnyX,ground,(home?1.55:1.08)*k,t,attack?(this.attackKind==='ultimate'?'ultimate':'attack'):this.win?'happy':home?'wave':'idle',power,this.outfit);
  if(attack&&this.motion!=='off')this.foregroundAttack(c,power,this.attackKind,ground,k,W,H);
  if(this.token&&this.tokenAge<1.8&&!home){const age=Math.min(1,this.tokenAge/.3);const tx=baseX+75,ty=ground-260*k-18*age;c.save();c.globalAlpha=Math.min(1,age*3);rr(c,tx-42,ty-30,84,58,18,'#fff6dc','#efd18e');c.font='900 32px system-ui';c.textAlign='center';c.fillStyle='#6a563d';c.fillText(this.token,tx,ty+12);c.restore();}
  for(const p of this.fx){c.save();c.globalAlpha=Math.min(1,p.life*1.8);if(p.star)star(c,p.x,p.y,p.r,p.col,p.angle);else{c.translate(p.x,p.y);c.rotate(p.angle);rr(c,-p.r/2,-p.r/2,p.r,p.r*.6,1,p.col);}c.restore();}
  if(this.banner&&this.bannerAge<1.5&&!home){c.save();const a=this.bannerAge;c.globalAlpha=Math.min(1,a*10,(1.5-a)*3);c.translate(W*.52,H*.26-Math.min(a,.2)*35);c.rotate(-.065);c.textAlign='center';c.font=`italic 900 ${this.attackKind==='ultimate'?45:39}px system-ui`;c.strokeStyle='#273a60';c.lineWidth=7;c.strokeText(this.banner,0,0);c.fillStyle=this.attackKind==='ultimate'?'#e5c5ff':'#fff0a8';c.fillText(this.banner,0,0);c.restore();}
  c.restore();
 }
 background(c,W,H,ground,t,k){
  const p=palettes[this.world],g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,p[0]);g.addColorStop(.72,p[1]);g.addColorStop(1,p[2]);c.fillStyle=g;c.fillRect(0,0,W,H);
  // A subtly luminous moon and atmosphere, not a static downloaded background.
  const glow=c.createRadialGradient(790,H*.22,5,790,H*.22,310);glow.addColorStop(0,`${p[4]}25`);glow.addColorStop(1,`${p[4]}00`);c.fillStyle=glow;c.fillRect(0,0,W,H);ellipse(c,790,H*.20,32,32,p[4]);ellipse(c,802,H*.185,30,29,p[0]);
  for(let layer=0;layer<3;layer++){
   const offset=(this.mode==='home'?Math.sin(t*.07)*10:(t*(layer+1)*3)%260);
   c.fillStyle=p[layer+1];c.globalAlpha=.35+layer*.15;
   path(c,z=>{z.moveTo(0,ground);for(let i=0;i<=12;i++){const x=i*120-offset-30,y=ground-H*(.20+(Math.sin(i*1.9+layer)*.075))-(2-layer)*40;z.quadraticCurveTo(x-50,y-60,x+70,y);}z.lineTo(W+200,H);z.lineTo(0,H);z.closePath();},p[layer+1]);
   if(this.world===0){for(let i=0;i<7;i++){const x=i*205-offset-80+(layer%2)*65,h=(170+Math.sin(i*4)*40)*k+layer*22;rr(c,x,ground-h,22+layer*4,h,9,p[layer+1]);ellipse(c,x+10,ground-h,80+layer*8,86,p[layer+1]);ellipse(c,x-15,ground-h-33,57,66,p[layer+1]);}}
   if(this.world===1){for(let i=0;i<5;i++){let x=i*290-offset-40;path(c,z=>{z.moveTo(x,ground);z.lineTo(x+75,ground-140*k);z.lineTo(x+160,ground);z.closePath();},p[layer+1]);}}
   if([3,5].includes(this.world)){for(let i=0;i<7;i++){const x=i*180-offset;rr(c,x,ground-210*k,55,230*k,6,p[layer+1]);path(c,z=>{z.moveTo(x-10,ground-209*k);z.lineTo(x+27,ground-260*k);z.lineTo(x+66,ground-209*k);},p[layer+1]);}}
   if([2,4].includes(this.world))for(let i=0;i<5;i++)cloud(c,i*290-offset,ground-(170+layer*70)*k,1.8+layer*.35,p[layer+1]);
  }
  c.globalAlpha=1;
  // Foreground platforms, ledges and luminous grass.
  const floor=c.createLinearGradient(0,ground,0,H);floor.addColorStop(0,'#162e48');floor.addColorStop(1,'#172439');c.fillStyle=floor;c.fillRect(0,ground,W,H-ground);
  path(c,z=>{z.moveTo(0,ground);for(let i=0;i<24;i++)z.lineTo(i*50,ground+Math.sin(i*4)*4);z.lineTo(W,ground+14);z.lineTo(0,ground+14);z.closePath();},p[3]);
  for(let i=0;i<18;i++){const x=i*69+Math.sin(i*5)*14;rr(c,x,ground+30+(i%3)*24,30+i%4*8,3,2,'#7cacc323');}
  for(let i=0;i<30;i++){const x=i*42;path(c,z=>{z.moveTo(x,ground);z.quadraticCurveTo(x-8,ground-18,x-13,ground-18);z.lineTo(x-3,ground+2);z.lineTo(x+10,ground-11);z.lineTo(x+7,ground+3);},p[3]);}
  // Ruins framing the battlefield.
  for(const side of [-1,1]){const x=side<0?24:1020;rr(c,x,ground-174*k,53,176*k,8,'#315064');rr(c,x-6,ground-176*k,65,20,7,'#547988');rr(c,x+7,ground-144*k,9,96*k,3,'#83c2b833');rune(c,x+27,ground-117*k,13,t*.08,'#b4e7bd7a');}
  if(this.world===5){for(let i=0;i<3;i++){c.save();c.globalAlpha=.08;c.strokeStyle=['#71f8bf','#88c7ff','#e2a5ff'][i];c.lineWidth=25;path(c,z=>{z.moveTo(0,H*.2+i*25);z.bezierCurveTo(300,H*.1+Math.sin(t*.4)*40,600,H*.45,1100,H*.15);},null,c.strokeStyle,25);c.restore();}}
  for(const d of this.dots){const x=(d.x*W+t*(4+d.s*10))%W,y=d.y*ground*.94+Math.sin(t+d.p)*8;c.globalAlpha=.2+d.s*.6;if(d.s>.75)diamond(c,x,y,2.5+d.s*2,'#ecedb1');else ellipse(c,x,y,1+d.s*2,1+d.s*2,'#e4f6cb');}c.globalAlpha=1;
  const edge=c.createLinearGradient(0,0,W,0);edge.addColorStop(0,'#14244038');edge.addColorStop(.2,'#00000000');edge.addColorStop(.8,'#00000000');edge.addColorStop(1,'#14244028');c.fillStyle=edge;c.fillRect(0,0,W,H);
 }
 slash(c,x,y,k,p,kind,t,W,H){
  c.save();c.globalAlpha=Math.sin(p*Math.PI);const col=kind==='ice'?'#b6edff':kind==='ultimate'?'#dec3ff':'#ffe09a';
  if(kind==='storm'){for(let i=0;i<4;i++){c.save();c.translate(730,y-95*k);c.rotate(p*TAU*2+i*TAU/4);c.strokeStyle=i%2?'#ffbd7d':'#d1f4c7';c.lineWidth=12;c.beginPath();c.ellipse(0,0,110,30,0,0,Math.PI*1.5);c.stroke();c.restore();}}
  else {for(let i=0;i<3;i++){c.strokeStyle=i===0?'#ffffff':col;c.lineWidth=i===0?10:22-i*4;c.beginPath();c.ellipse(x+90+i*38,y-130*k,100+i*22,120*k,-.7+p*1.2,-1.9+p*1.4,1.2+p*.8);c.stroke();}}
  for(let i=0;i<5;i++){const xx=450+p*550+i*40,yy=y-120*k+Math.sin(i*2+p*8)*40;line(c,xx-70,yy,xx,yy,col,2+i%3);}
  c.restore();
 }
 foregroundAttack(c,p,kind,ground,k,W,H){
  const c1=kind==='ultimate'?'#e6c8ff':kind==='ice'?'#b7f2ff':'#ffe195';c.save();c.globalAlpha=Math.sin(p*Math.PI)*.9;
  if(kind==='ultimate'){rune(c,820,ground-90*k,85+p*90,-p*2,c1);for(let i=0;i<7;i++){let mx=650+i*46,my=-120+((p+i*.055)*1.5)*(ground+160);line(c,mx-70,my-150,mx,my,'#e2b7ff40',23);line(c,mx-40,my-95,mx,my,'#fff3cf',6);star(c,mx,my,16+i%3*6,c1,p*3);}c.fillStyle='#eac8ff';c.globalAlpha=Math.max(0,1-Math.abs(p-.48)*12)*.08;c.fillRect(0,0,W,H);}
  else if(kind==='ice'){for(let i=0;i<5;i++){const x=740+i*32,h=Math.sin(p*Math.PI)*(65+i%3*25);path(c,z=>{z.moveTo(x-14,ground);z.lineTo(x,ground-h-50);z.lineTo(x+16,ground);z.closePath();},c1,'#f2fdff',2);}}
  else {const xx=380+p*530,yy=ground-160*k;star(c,xx,yy,20+12*Math.sin(p*Math.PI),c1,p*6);diamond(c,xx+23,yy-5,9,'#fff');}
  c.restore();
 }
}
