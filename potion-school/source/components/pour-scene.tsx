'use client';

import {useEffect, useRef} from 'react';
import {POUR_MS, pourPose, pouredUnits, pourStream, type PourGeometry} from '@/lib/game/pour-animation';

export type ActivePour = { id: number; from: number; to: number; color: number; count: number; geometry: PourGeometry };

type Props = {
  flight: ActivePour;
  color: {hex:string; light:string};
  children: React.ReactNode;
  onUnit: (count:number) => void;
  onDone: () => void;
  onBubble: () => void;
};

export function PourScene({flight,color,children,onUnit,onDone,onBubble}:Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ghost = ghostRef.current;
    if (!canvas || !ghost) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { onDone(); return; }
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * scale);
    canvas.height = Math.round(bounds.height * scale);
    ctx.scale(scale,scale);
    const {source,destination,direction}=flight.geometry;
    let frame=0, beginning:number|undefined, lastUnits=0, done=false;

    function finish() {
      if (done) return;
      done=true;
      cancelAnimationFrame(frame);
      onDone();
    }
    function draw(now:number) {
      if (done || !ctx || !ghost || !canvas) return;
      beginning ??= now;
      const t=Math.min(1,(now-beginning)/POUR_MS);
      const pose=pourPose(t,flight.geometry);
      ghost.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) rotate(${pose.rotation}deg)`;
      ctx.clearRect(0,0,bounds.width,bounds.height);
      const flow=pourStream(t);
      if (flow>0.01) {
        const tipX=source.x+source.width*.5+pose.x+direction*source.width*.22;
        const tipY=source.y+source.width*.2+pose.y+source.width*.11;
        const endX=destination.x+destination.width*.5;
        const endY=destination.y+destination.width*.20;
        const bendX=(tipX+endX)/2+direction*source.width*.1;
        const bendY=(tipY+endY)/2+source.width*.18;
        const gradient=ctx.createLinearGradient(tipX,tipY,endX,endY);
        gradient.addColorStop(0,color.light); gradient.addColorStop(.55,color.hex); gradient.addColorStop(1,color.light);
        ctx.save();
        ctx.globalAlpha=flow;
        ctx.shadowColor=color.hex;ctx.shadowBlur=13;
        ctx.lineCap='round';ctx.lineWidth=Math.max(5,source.width*.12);
        ctx.strokeStyle=gradient;
        ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.quadraticCurveTo(bendX,bendY,endX,endY);ctx.stroke();
        ctx.shadowBlur=0;ctx.globalAlpha=flow*.72;
        ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1.5,source.width*.026);
        ctx.setLineDash([source.width*.25,source.width*.14]);ctx.lineDashOffset=-now*.13;
        ctx.beginPath();ctx.moveTo(tipX-direction*1.2,tipY);ctx.quadraticCurveTo(bendX-2,bendY,endX-2,endY);ctx.stroke();
        ctx.setLineDash([]);
        for(let i=0;i<4;i++) {
          const p=((t*2.9+i/4)%1);
          const x=(1-p)**2*tipX+2*(1-p)*p*bendX+p*p*endX;
          const y=(1-p)**2*tipY+2*(1-p)*p*bendY+p*p*endY;
          ctx.fillStyle=i%2?color.light:'#fff';
          ctx.globalAlpha=flow*(.22+.38*p);
          ctx.beginPath();ctx.arc(x+direction*(i%2?4:-3),y,Math.max(1.5,source.width*.035),0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
      }
      const units=pouredUnits(t,flight.count);
      if(units!==lastUnits){lastUnits=units;onUnit(units);onBubble();}
      if(t>=1)finish();else frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    const finishHidden=()=>{if(document.hidden)finish();};
    window.addEventListener('resize',finish);
    document.addEventListener('visibilitychange',finishHidden);
    return ()=>{done=true;cancelAnimationFrame(frame);window.removeEventListener('resize',finish);document.removeEventListener('visibilitychange',finishHidden);};
  },[flight.id]);

  return <>
    <canvas ref={canvasRef} className="flow-canvas" aria-hidden="true"/>
    <div ref={ghostRef} className="pour-ghost" aria-hidden="true" style={{left:flight.geometry.source.x,top:flight.geometry.source.y,width:flight.geometry.source.width}}>
      {children}
    </div>
  </>;
}
