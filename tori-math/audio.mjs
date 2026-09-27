/* Original layered arcade score. No external audio, network, microphone, or paid assets. */
const cap=(v,a,b)=>Math.min(b,Math.max(a,v));
export class AudioEngine{
 constructor(){this.ctx=null;this.master=null;this.musicBus=null;this.sfxBus=null;this.settings={music:true,sfx:true,volume:35};this.playing=false;this.combo=0;this.energy=0;this.step=0;this.next=0;this.paused=false;this.taps=0;}
 async unlock(){try{if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;this.ctx=new Context();this.master=this.ctx.createGain();this.master.gain.value=.001;this.musicBus=this.ctx.createGain();this.sfxBus=this.ctx.createGain();this.musicBus.connect(this.master);this.sfxBus.connect(this.master);const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-15;limiter.knee.value=14;limiter.ratio.value=5;limiter.attack.value=.004;limiter.release.value=.15;this.master.connect(limiter);limiter.connect(this.ctx.destination);this.noise=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*.3),this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.configure(this.settings);}
 if(this.ctx.state==='suspended'&&!this.paused)await this.ctx.resume();}catch{/* Audio is optional; maths must remain playable. */}}
 configure(settings){this.settings={...this.settings,...settings};this.settings.volume=cap(Number(this.settings.volume)||0,0,100);if(this.master){const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.settings.volume/100*.65,t,.025);this.musicBus.gain.setTargetAtTime(this.settings.music?.72:0,t,.015);this.sfxBus.gain.setTargetAtTime(this.settings.sfx?1:0,t,.015);}}
 setPlaying(value){if(value&&!this.playing){this.energy=0;this.step=0;this.combo=0;}this.playing=!!value;this.next=this.ctx?this.ctx.currentTime+.035:0;if(!value)this.combo=0;}
 setPaused(value){this.paused=!!value;if(this.ctx){if(value)this.ctx.suspend().catch(()=>{});else{this.ctx.resume().catch(()=>{});this.next=this.ctx.currentTime+.035;}}}
 note(midi,time,len=.18,amp=.08,type='triangle',music=false){if(!this.ctx||!this.master)return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=type;osc.frequency.value=440*2**((midi-69)/12);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0002,amp),time+.006);g.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.02,len));osc.connect(g);g.connect(music?this.musicBus:this.sfxBus);osc.start(time);osc.stop(time+len+.03);osc.onended=()=>{osc.disconnect();g.disconnect();};}
 noiseHit(time,len=.055,amp=.055,frequency=5600,music=false){if(!this.ctx||!this.noise)return;const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();source.buffer=this.noise;filter.type='highpass';filter.frequency.value=frequency;gain.gain.setValueAtTime(Math.max(.0002,amp),time);gain.gain.exponentialRampToValueAtTime(.0001,time+len);source.connect(filter);filter.connect(gain);gain.connect(music?this.musicBus:this.sfxBus);source.start(time);source.stop(time+len+.01);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};}
 drum(time,strong=false,music=false){if(!strong){this.noiseHit(time,.045,.035,6800,music);return;}if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(150,time);o.frequency.exponentialRampToValueAtTime(44,time+.13);g.gain.setValueAtTime(.18,time);g.gain.exponentialRampToValueAtTime(.0001,time+.2);o.connect(g);g.connect(music?this.musicBus:this.sfxBus);o.start(time);o.stop(time+.22);o.onended=()=>{o.disconnect();g.disconnect();};}
 tick(){if(!this.ctx||this.ctx.state!=='running'||this.paused||!this.playing||!this.settings.music)return;const now=this.ctx.currentTime;if(this.next<now-.15)this.next=now+.025;const level=Math.min(4,Math.floor(this.energy/2)),bpm=116+level*5,roots=[50,55,59,57],melody=[74,0,78,81,83,81,78,0,76,0,79,83,86,83,79,0,78,0,81,86,88,86,81,78,76,78,81,83,81,78,76,0];let count=0;
 while(this.next<now+.09&&count++<4){const s=this.step%64,root=roots[Math.floor(s/16)],t=this.next;
  // The melody is present from the first question; bass, percussion and countermelody join later.
  if(s%2===0){const m=melody[Math.floor(s/2)];if(m){this.note(m,t,.21,.067,'triangle',true);this.note(m+12,t+.018,.27,.015,'sine',true);}}
  if(s%8===0){[root+12,root+19,root+24].forEach((n,i)=>this.note(n,t+i*.017,.64,.019,'sine',true));}
  if(level>=1&&s%4===0){this.note(root-(s%8?0:12),t,.3,.12,'triangle',true);}
  if(level>=2){if(s%8===0)this.drum(t,true,true);if(s%8===4){this.noiseHit(t,.095,.053,2100,true);this.note(50,t,.085,.048,'triangle',true);}if(s%2===1)this.drum(t,false,true);}
  if(level>=3&&s%2===0)this.note(root+[24,28,31,36][Math.floor(s/2)%4],t+.015,.1,.025,'sine',true);
  if(level>=4&&s%4===2){this.note(melody[Math.floor(s/2)]||83,t,.12,.035,'square',true);if(s%16===14)this.noiseHit(t,.08,.03,4000,true);}
  this.next+=60/bpm/4;this.step++;
 }
 }
 effect(name,combo=0){if(name==='correct')this.energy=Math.min(100,this.energy+1);if(!this.ctx||!this.settings.sfx||this.paused)return;const t=this.ctx.currentTime+.005;
 if(name==='tap'){const notes=[74,78,81,83,86];this.note(notes[this.taps++%notes.length],t,.075,.06,'sine');}
 if(name==='correct'){const n=Math.min(4,Math.floor(Math.max(0,combo)/3));[74,78,81,86].slice(0,combo>=3?4:3).forEach((m,i)=>this.note(m+n,t+i*.034,.16,.09,'triangle'));this.noiseHit(t+.15,.09,.08,2200);this.drum(t+.19,true);if(combo>=5)this.note(93,t+.2,.42,.035,'sine');}
 if(name==='wrong'){this.note(74,t,.15,.04,'sine');this.note(78,t+.13,.15,.035,'sine');}
 if(name==='ultimate'){[62,69,74,78,81,86,90,93].forEach((m,i)=>this.note(m,t+i*.065,.3,.09,i%2?'triangle':'sine'));this.noiseHit(t+.54,.23,.11,1800);this.drum(t+.57,true);[74,81,86].forEach(n=>this.note(n,t+.6,.7,.07,'sine'));}
 if(name==='win'){[74,78,81,86,83,86,90,93].forEach((m,i)=>this.note(m,t+i*.105,.3,.09,'triangle'));[62,69,74,78].forEach(m=>this.note(m,t+.74,.8,.045,'sine'));}
 if(name==='reward')[81,86,90].forEach((m,i)=>this.note(m,t+i*.07,.23,.07,'sine'));
 }
}
