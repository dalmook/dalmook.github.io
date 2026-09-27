'use client';
import {useEffect,useRef} from 'react';
export type MagicImpact={id:number;color:string;kind:'pour'|'complete'|'error'|'win';x?:number;y?:number;combo?:number};
export function MagicFX({impact,motion}:{impact:MagicImpact|null;motion:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas||!impact||!motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const {width:w,height:h}=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);
  const strong=impact.kind==='complete'||impact.kind==='win',win=impact.kind==='win',cx=(impact.x??.5)*w,cy=(impact.y??.5)*h,count=win?140:strong?88:28;
  const particles=Array.from({length:count},(_,i)=>{const a=i*2.399;return {vx:Math.cos(a)*(50+(i%11)*24),vy:Math.sin(a)*(60+(i%9)*24)-80,size:2+i%5,star:i%4===0}});
  let frame=0,start=0;const duration=strong?1.65:.8;
  const draw=(now:number)=>{start ||= now;const t=(now-start)/1000;ctx.clearRect(0,0,w,h);if(t>duration)return;
   ctx.save();ctx.globalCompositeOperation='lighter';
   if(strong){const gradient=ctx.createRadialGradient(cx,cy,0,cx,cy,180);gradient.addColorStop(0,impact.color+'88');gradient.addColorStop(1,impact.color+'00');ctx.globalAlpha=Math.max(0,1-t*2);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    for(let i=0;i<3;i++){ctx.strokeStyle=i===1?'#fff8c4':impact.color;ctx.globalAlpha=Math.max(0,1-t*1.1-i*.1);ctx.lineWidth=3-i*.7;ctx.beginPath();ctx.ellipse(cx,cy,12+t*(180+i*45),6+t*(80+i*20),-.12,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.globalAlpha=Math.max(0,.6-t);ctx.strokeStyle='#fff1c1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*t*60,cy+Math.sin(a)*t*60);ctx.lineTo(cx+Math.cos(a)*(45+t*220),cy+Math.sin(a)*(45+t*220));ctx.stroke();}}
   for(const p of particles){ctx.globalAlpha=Math.max(0,1-t/duration);ctx.fillStyle=p.star?'#fff5cb':impact.color;ctx.shadowColor=impact.color;ctx.shadowBlur=p.star?14:5;const x=cx+p.vx*t,y=cy+p.vy*t+90*t*t,r=p.size*(1-t/(duration+.2));ctx.beginPath();if(p.star){ctx.moveTo(x,y-r*2);ctx.lineTo(x+r*.5,y-r*.5);ctx.lineTo(x+r*2,y);ctx.lineTo(x+r*.5,y+r*.5);ctx.lineTo(x,y+r*2);ctx.lineTo(x-r*.5,y+r*.5);ctx.lineTo(x-r*2,y);ctx.lineTo(x-r*.5,y-r*.5);ctx.closePath();}else ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.restore();frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);ctx.clearRect(0,0,w,h)};
 },[impact,motion]);
 return <canvas ref={ref} className="magic-fx" aria-hidden="true"/>;
}
