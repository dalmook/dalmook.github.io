/* An original layered chiptune score synthesized locally. No audio downloads or microphone. */
export class AudioEngine{
 constructor(){this.ctx=null;this.master=null;this.settings={music:true,sfx:true,volume:35};this.playing=false;this.combo=0;this.step=0;this.next=0;this.paused=false;}
 async unlock(){try{if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;this.ctx=new Context();this.master=this.ctx.createGain();this.master.gain.value=this.settings.volume/100*.55;this.master.connect(this.ctx.destination);const size=this.ctx.sampleRate*.15;this.noise=this.ctx.createBuffer(1,size,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size);}
 if(this.ctx.state==='suspended')await this.ctx.resume();}catch{/* Audio failure must not prevent playing. */}}
 configure(settings){this.settings={...this.settings,...settings};if(this.master)this.master.gain.setTargetAtTime(this.settings.volume/100*.55,this.ctx.currentTime,.03);}
 setPlaying(playing){this.playing=playing;this.next=this.ctx?this.ctx.currentTime+.04:0;if(!playing)this.combo=0;}
 setPaused(paused){this.paused=paused;if(this.ctx){if(paused)this.ctx.suspend().catch(()=>{});else{this.ctx.resume().catch(()=>{});this.next=this.ctx.currentTime+.06;}}}
 note(midi,time,len=.18,amp=.11,type='triangle'){if(!this.ctx||!this.master)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.value=440*Math.pow(2,(midi-69)/12);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,amp),time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+len);osc.connect(gain);gain.connect(this.master);osc.start(time);osc.stop(time+len+.03);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 drum(time,strong=false){if(!this.ctx)return;if(strong){const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.frequency.setValueAtTime(120,time);osc.frequency.exponentialRampToValueAtTime(45,time+.13);g.gain.setValueAtTime(.14,time);g.gain.exponentialRampToValueAtTime(.0001,time+.16);osc.connect(g);g.connect(this.master);osc.start(time);osc.stop(time+.18);osc.onended=()=>{osc.disconnect();g.disconnect();};}else{const src=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();src.buffer=this.noise;filter.type='highpass';filter.frequency.value=6400;g.gain.value=.035;src.connect(filter);filter.connect(g);g.connect(this.master);src.start(time);src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();};}}
 tick(){if(!this.ctx||this.ctx.state!=='running'||this.paused||!this.playing||!this.settings.music)return;const now=this.ctx.currentTime;if(this.next<now-.2)this.next=now+.02;
 const melody=[72,76,79,76,74,77,81,77,76,79,84,79,74,77,79,77,72,76,79,84,81,79,76,74,72,74,76,79,77,74,72,67];const bass=[48,48,53,53,45,45,55,55];let n=0;
 while(this.next<now+.12&&n++<4){const i=this.step%32;this.note(melody[i],this.next,.20,.065,'triangle');if(i%4===0){this.note(bass[Math.floor(i/4)],this.next,.38,.12,'triangle');if(this.combo>=3)this.drum(this.next,true);}if(this.combo>=5&&i%2===1)this.drum(this.next);if(this.combo>=7)this.note(melody[(i+4)%32]+12,this.next+.08,.10,.025,'sine');this.next+=60/(this.combo>=7?126:112)/2;this.step++;}
 }
 effect(name,combo=0){if(!this.ctx||!this.settings.sfx||this.paused)return;const t=this.ctx.currentTime+.005;
 if(name==='tap')this.note(76,t,.05,.06,'sine');
 if(name==='correct'){[72,76,79,84].slice(0,combo>=3?4:3).forEach((n,i)=>this.note(n+Math.min(4,Math.floor(combo/3)),t+i*.045,.17,.14,'triangle'));this.drum(t,true);}
 if(name==='wrong'){this.note(62,t,.18,.055,'sine');this.note(60,t+.1,.18,.045,'sine');}
 if(name==='ultimate')[60,67,72,76,79,84,88,91].forEach((n,i)=>this.note(n,t+i*.065,.32,.14,i%2?'triangle':'sine'));
 if(name==='win')[72,76,79,84,79,84,88,91].forEach((n,i)=>this.note(n,t+i*.12,.36,.15,'triangle'));
 if(name==='reward')[79,84,88].forEach((n,i)=>this.note(n,t+i*.07,.28,.10,'sine'));
 }
}
