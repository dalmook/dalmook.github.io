/** Original local soundtrack + synthesized interaction sounds; no third-party audio. */
export type AudioOptions={music:boolean;sound:boolean;musicVolume:number;effectsVolume:number;world:number};
export class PotionAudio {
 private context:AudioContext|null=null;
 private player:HTMLAudioElement|null=null;
 private unlocked=false;
 private disposed=false;
 private track=-1;
 private opts:AudioOptions={music:true,sound:true,musicVolume:35,effectsVolume:70,world:0};
 constructor(private status:(playing:boolean)=>void){}
 configure(opts:AudioOptions){this.opts=opts;this.sync();}
 async unlock(){
  if(this.disposed)return;this.unlocked=true;
  try{this.context??=new AudioContext();if(this.context.state==='suspended')await this.context.resume();}catch{}
  this.sync();
 }
 private sync(){
  if(!this.unlocked||this.disposed)return;
  if(!this.player){this.player=new Audio();this.player.loop=true;this.player.preload='none';this.player.addEventListener('playing',()=>this.status(true));this.player.addEventListener('pause',()=>this.status(false));this.player.addEventListener('error',()=>this.status(false));}
  const p=this.player;
  if(this.track!==this.opts.world){this.track=this.opts.world;p.src=`./audio/${['forest','moon','castle'][this.track]}.ogg`;}
  p.volume=this.opts.musicVolume/100;
  if(this.opts.music&&!document.hidden&&this.opts.musicVolume>0)void p.play().catch(()=>this.status(false));else {p.pause();this.status(false);}
 }
 visibility(){this.sync();if(document.hidden)void this.context?.suspend();else if(this.unlocked)void this.context?.resume();}
 effect(type:'tap'|'pour'|'complete'|'win'|'error'|'undo'|'hint',combo=1){
  const c=this.context;if(!this.opts.sound||!c||c.state!=='running'||document.hidden)return;
  const volume=this.opts.effectsVolume/100,now=c.currentTime;
  const tone=(freq:number,at:number,duration:number,amp:number,wave:OscillatorType='sine')=>{const o=c.createOscillator(),g=c.createGain();o.type=wave;o.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0001,amp*volume),at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+duration+.03);};
  if(type==='pour'){
   const dur=.64,buffer=c.createBuffer(1,c.sampleRate*dur,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/data.length);
   const src=c.createBufferSource(),filter=c.createBiquadFilter(),g=c.createGain();src.buffer=buffer;filter.type='bandpass';filter.frequency.value=1100;filter.Q.value=.8;g.gain.value=.14*volume;src.connect(filter);filter.connect(g);g.connect(c.destination);src.start();src.stop(now+dur);
   [0,.10,.24,.41].forEach((d,i)=>tone(380+i*155,now+d,.12,.12));return;
  }
  if(type==='complete'||type==='win'){
   const notes=type==='win'?[523,659,784,1047,1319,1568]:[659,880,1109,1319];
   notes.forEach((n,i)=>{tone(n*(1+(Math.min(combo,4)-1)*.04),now+i*.095,.55,.11,'triangle');tone(n*2,now+i*.095,.32,.025);});tone(130.8,now,.8,.14,'sine');return;
  }
  if(type==='error'){tone(180,now,.12,.05,'triangle');tone(140,now+.10,.14,.04);return;}
  const notes=type==='hint'?[660,880,1100]:type==='undo'?[600,400]:[840];notes.forEach((n,i)=>tone(n,now+i*.06,.15,.07));
 }
 dispose(){this.disposed=true;this.player?.pause();if(this.player){this.player.removeAttribute('src');this.player.load();}void this.context?.close();}
}
