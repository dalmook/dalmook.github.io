/* Tori's original articulated canvas rig. White fur, expressive poses, no image assets. */
export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = t => 1 - (1 - clamp(t)) ** 3;
const ink = '#343454';
export function oval(c,x,y,rx,ry,color,stroke=null,width=3){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
export function shape(c,d,color,stroke=null,width=3){c.beginPath();d(c);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke();}}
export function star(c,x,y,r,color,angle=0,points=5){c.save();c.translate(x,y);c.rotate(angle);shape(c,p=>{for(let i=0;i<points*2;i++){const a=i*Math.PI/points-Math.PI/2,v=i%2?r*.46:r;i?p.lineTo(Math.cos(a)*v,Math.sin(a)*v):p.moveTo(Math.cos(a)*v,Math.sin(a)*v);}p.closePath();},color);c.restore();}
export function line(c,x,y,xx,yy,color,w=3){shape(c,p=>{p.moveTo(x,y);p.lineTo(xx,yy);},null,color,w);}
export function round(c,x,y,w,h,r,color,stroke=null){shape(c,p=>p.roundRect(x,y,w,h,r),color,stroke,2);}
export function drawBunny(c,x,y,s=1,t=0,pose='idle',phase=0,outfit='mint',face=1){
 const trim={mint:'#50dcc0',coral:'#ff9b7c',violet:'#a995ff',gold:'#ffcf63',night:'#75aefa'}[outfit]||'#50dcc0';
 const run=pose==='run',strike=pose==='attack',spin=pose==='spin',jump=pose==='jump',cast=pose==='ultimate',carry=pose==='carry',happy=pose==='happy',wave=pose==='wave';
 const action=strike||spin||cast,cycle=t*13,walk=run?Math.sin(cycle):0,swing=Math.sin(clamp(phase)*Math.PI);
 const bounce=run?Math.abs(Math.sin(cycle))*8:Math.sin(t*3)*2,lean=strike?-.25+phase*.65:run?.22:jump?-.13:0;
 c.save();c.translate(x,y);c.scale(s*face,s);c.translate(0,-bounce);c.rotate(lean);c.lineCap='round';c.lineJoin='round';
 // Scarf trails lag behind the torso, rather than moving as a flat picture.
 shape(c,p=>{p.moveTo(-26,-101);p.bezierCurveTo(-62,-121,-80,-83+Math.sin(t*8)*12,-111-(run||action?25:0),-115);p.lineTo(-105,-88);p.lineTo(-91,-74);p.bezierCurveTo(-65,-112,-47,-80,-25,-87);},trim,ink,3.5);
 shape(c,p=>{p.moveTo(-30,-92);p.bezierCurveTo(-63,-81,-71,-47+Math.sin(t*7)*9,-95,-61);p.lineTo(-77,-37);p.bezierCurveTo(-44,-53,-43,-81,-21,-88);},trim,ink,3);
 oval(c,-36,-30,19,20,'#fff',ink,3);oval(c,-41,-36,7,8,'#fff');
 // Independent hip/knee/ankle positions make running, aerial kicks and landing readable.
 for(const side of [-1,1]){c.save();c.translate(side*22,-27);c.rotate(run?walk*side*.82:jump?side*.74:spin?side*.9:strike?side*.42*swing:side*.05);oval(c,0,7,17,24,'#fff',ink,3.4);oval(c,side*5,25,26,14,'#fff',ink,3.4);oval(c,side*6,29,17,4,'#dcecf5');c.restore();}
 const fur=c.createLinearGradient(-40,-180,54,-65);fur.addColorStop(0,'#fff');fur.addColorStop(.64,'#fff');fur.addColorStop(1,'#e3eef8');
 oval(c,0,-66,38,48,fur,ink,3.5);oval(c,1,-55,25,30,'#fff');
 // Short cape jacket keeps the silhouette recognisably a WHITE rabbit.
 shape(c,p=>{p.moveTo(-34,-93);p.lineTo(-26,-39);p.lineTo(-12,-33);p.lineTo(-15,-95);p.moveTo(23,-92);p.lineTo(31,-38);p.lineTo(39,-47);p.lineTo(35,-96);},trim,ink,3);
 line(c,-9,-37,23,-37,'#657190',5);round(c,3,-43,12,12,3,'#ffdb72',ink);
 function arm(side,front){c.save();c.translate(side*32,-91);let r=run?walk*side*.7:Math.sin(t*3+side)*.07;if(carry)r=side*-2.5;else if(cast||happy)r=side*-2.15;else if(wave&&side>0)r=-2.15+Math.sin(t*8)*.22;else if(strike&&side>0)r=-2.6+phase*3;else if(jump&&side>0)r=-1.8;else if(spin)r=side*-1.55;c.rotate(r);oval(c,side*3,18,13,24,fur,ink,3.3);oval(c,side*4,37,16,15,'#fff',ink,3.3);if(carry||wave||happy){oval(c,side*4,38,6,5,'#ffc8d9');}else if(front){c.save();c.translate(19,40);c.rotate(action?-.12:.36);line(c,0,25,0,-73,ink,11);line(c,0,25,0,-73,'#f7bc64',7);round(c,-12,-48,24,7,3,'#9b7bdd');shape(c,p=>{p.moveTo(-13,-50);p.lineTo(-11,-89);p.lineTo(0,-107);p.lineTo(13,-88);p.lineTo(11,-50);p.closePath();},'#fff9d8',ink,2.8);shape(c,p=>{p.moveTo(0,-103);p.lineTo(9,-87);p.lineTo(7,-53);p.lineTo(0,-53);},'#ffe28a');star(c,0,-47,12,trim);c.restore();}c.restore();}
 arm(-1,false);
 // Long asymmetric floppy ears have a separate inertial follow-through.
 for(const side of [-1,1]){c.save();c.translate(side*38,-168);c.rotate(side*.1+Math.sin(t*3+side)*.07+(run?.28*walk:0)+(action?.58*swing:0));c.scale(side,1);shape(c,p=>{p.moveTo(-12,-5);p.bezierCurveTo(4,-33,32,-20,39,1);p.bezierCurveTo(49,31,69,55,62,82);p.bezierCurveTo(55,107,33,101,29,76);p.bezierCurveTo(28,45,13,21,-8,17);p.closePath();},fur,ink,3.6);shape(c,p=>{p.moveTo(18,4);p.bezierCurveTo(28,12,27,35,42,59);p.bezierCurveTo(57,94,39,90,37,65);p.bezierCurveTo(34,36,23,29,18,4);},'#ffcede');c.restore();}
 // Rounded cheeks and a star-shaped tuft are Tori's identifying features.
 shape(c,p=>{p.moveTo(-50,-170);p.quadraticCurveTo(-41,-195,-17,-190);p.lineTo(-9,-203);p.lineTo(0,-193);p.lineTo(14,-202);p.lineTo(21,-188);p.bezierCurveTo(61,-184,66,-146,49,-122);p.bezierCurveTo(29,-98,-32,-98,-51,-125);p.lineTo(-61,-127);p.lineTo(-56,-139);p.quadraticCurveTo(-63,-157,-50,-170);},fur,ink,3.8);
 oval(c,-35,-128,11,6,'#ffd0dc');oval(c,39,-128,11,6,'#ffd0dc');
 const blink=t%4.6>4.44||happy,focus=strike||spin||cast;
 for(const side of [-1,1]){const ex=side*21+4;if(blink){shape(c,p=>{p.moveTo(ex-8,-143);p.quadraticCurveTo(ex,-152,ex+8,-143);},null,ink,3.5);}else{oval(c,ex,-145,9.2,14,ink);oval(c,ex-2,-150,3.5,4,'#fff');oval(c,ex+3,-141,2,2.5,'#a2c6ff');}if(focus)line(c,ex-9,-163+(side<0?-3:2),ex+7,-163+(side<0?2:-3),ink,3);}
 shape(c,p=>{p.moveTo(-4,-132);p.quadraticCurveTo(4,-136,11,-131);p.lineTo(4,-126);p.closePath();},'#ed9aad');
 if(action||happy||wave){shape(c,p=>{p.moveTo(-5,-122);p.quadraticCurveTo(4,-116,14,-123);p.quadraticCurveTo(4,-103,-5,-122);},ink);oval(c,5,-116,4,2,'#f9adc5');}else{shape(c,p=>{p.moveTo(-6,-121);p.quadraticCurveTo(0,-115,4,-122);p.quadraticCurveTo(9,-115,14,-122);},null,ink,2.3);}
 shape(c,p=>{p.moveTo(-29,-105);p.quadraticCurveTo(3,-95,32,-106);p.lineTo(28,-91);p.quadraticCurveTo(1,-81,-30,-96);p.closePath();},trim,ink,3);star(c,3,-95,12,'#ffdd70');star(c,3,-96,6,'#fff5ba');
 arm(1,true);
 if(outfit==='gold'){shape(c,p=>{p.moveTo(-24,-187);p.lineTo(-27,-213);p.lineTo(-12,-204);p.lineTo(0,-223);p.lineTo(12,-203);p.lineTo(29,-213);p.lineTo(24,-185);p.closePath();},'#ffdb72',ink,3);star(c,1,-202,6,'#fff');}
 if(outfit==='violet'){shape(c,p=>{p.moveTo(-35,-184);p.lineTo(-4,-244);p.lineTo(37,-183);p.closePath();},trim,ink,3);oval(c,0,-186,43,8,trim,ink,3);star(c,0,-214,8,'#fff1a4');}
 c.restore();
}
