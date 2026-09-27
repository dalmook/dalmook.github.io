'use client';
import {useEffect,useRef} from 'react';
export type MagicImpact={id:number;color:string;kind:'pour'|'complete'|'error'};
export function MagicFX({impact,motion}:{impact:MagicImpact|null;motion:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas||!impact||!motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const {width:w,height:h}=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);
  const strong=impact.kind==='complete',count=strong?65:24;
  const particles=Array.from({length:count},(_,i)=>{const a=i*2.399;return {vx:Math.cos(a)*(60+(i%7)*28),vy:Math.sin(a)*(60+(i%5)*30)-70,size:2+i%4}});
  let frame=0,start=0;
  const draw=(now:number)=>{start ||= now;const t=(now-start)/1000;ctx.clearRect(0,0,w,h);if(t>1.25)return;
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=impact.color;ctx.lineWidth=strong?3:1.5;ctx.globalAlpha=Math.max(0,1-t*1.6);ctx.beginPath();ctx.ellipse(w/2,h*.54,20+t*w*.4,10+t*h*.2,0,0,Math.PI*2);ctx.stroke();
   for(const p of particles){ctx.globalAlpha=Math.max(0,1-t/1.25);ctx.fillStyle=impact.color;ctx.shadowColor=impact.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(w/2+p.vx*t,h*.54+p.vy*t+90*t*t,p.size*(1-t/1.5),0,Math.PI*2);ctx.fill();}ctx.restore();frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);ctx.clearRect(0,0,w,h)};
 },[impact,motion]);
 return <canvas ref={ref} className="magic-fx" aria-hidden="true"/>;
}
