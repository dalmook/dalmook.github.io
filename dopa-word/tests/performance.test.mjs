import test from 'node:test';
import assert from 'node:assert/strict';
import {VoicePool} from '../voice-pool.mjs';
import {SessionAudio} from '../audio-session.mjs';
function fakeContext(){
  const ctx={currentTime:0,state:'running',made:[]};
  const node=(source=false)=>{const n={disconnected:0,disconnect(){this.disconnected++},connect(){}};if(source){n.start=()=>{};n.stop=()=>{};}ctx.made.push(n);return n;};
  ctx.createGain=()=>node();ctx.createOscillator=()=>node(true);return ctx;
}
test('note graph is disconnected only after its final scheduled source ends',()=>{
  const ctx=fakeContext(),pool=new VoicePool(ctx),v=pool.begin();
  const a=v.ctx.createOscillator(),b=v.ctx.createOscillator(),gain=v.ctx.createGain();a.stop(1);b.stop(2);v.commit();
  pool.sweep(1.5);assert.equal(pool.nodes,3);assert.equal(gain.disconnected,0);
  pool.sweep(2.1);assert.equal(pool.nodes,0);assert.equal(gain.disconnected,1);assert.equal(a.disconnected,1);assert.equal(pool.voices.size,0);
});
test('per-note proxy does not change original context factory methods',()=>{
  const ctx=fakeContext(),original=ctx.createGain,pool=new VoicePool(ctx),v=pool.begin();v.ctx.createGain();v.commit();assert.equal(ctx.createGain,original);assert.equal(pool.nodes,0);
});
test('sources and connected effect-send nodes are released in the same ownership group',()=>{
  const ctx=fakeContext(),pool=new VoicePool(ctx),v=pool.begin();v.ctx.createOscillator().stop(.1);v.ctx.createGain();v.ctx.createGain();v.commit();ctx.currentTime=1;pool.sweep();assert.ok(ctx.made.every(n=>n.disconnected===1));
});
test('thousands of note lifetimes do not accumulate active graphs',()=>{
  const ctx=fakeContext(),pool=new VoicePool(ctx);
  for(let n=0;n<3000;n++){ctx.currentTime=n*.01;const v=pool.begin();assert.ok(v);v.ctx.createOscillator().stop(ctx.currentTime+.15);v.ctx.createGain();v.commit();}
  assert.ok(pool.nodes<50);ctx.currentTime+=1;pool.sweep();assert.equal(pool.nodes,0);assert.equal(pool.stats.created,pool.stats.released);
});
test('voice budget prevents unbounded bursts and reports dropped decorative work',()=>{
  const ctx=fakeContext(),pool=new VoicePool(ctx,{maxVoices:3});
  for(let n=0;n<3;n++){const v=pool.begin();v.ctx.createOscillator().stop(5);v.commit();}
  assert.equal(pool.begin(),null);assert.equal(pool.stats.dropped,1);assert.equal(pool.voices.size,3);
});
test('music stop releases backing notes but allows existing one-shot feedback to finish',()=>{
  const ctx=fakeContext(),pool=new VoicePool(ctx);
  for(const music of [true,false]){const v=pool.begin(music);v.ctx.createOscillator().stop(5);v.commit();}
  pool.clear(true);assert.equal(pool.voices.size,1);pool.clear();assert.equal(pool.nodes,0);
});
test('scheduler covers a larger horizon than a typical delayed frame',()=>{
  const a=new SessionAudio();a.ctx=fakeContext();a.playing=true;a.nextTime=.05;const times=[];a.scheduleStep=(_,t)=>times.push(t);a.update();
  assert.ok(times.length>=2);assert.ok(a.nextTime>=.32);a.dispose();
});
test('scheduler skips an overdue backlog rather than playing all overdue notes at once',()=>{
  const a=new SessionAudio();a.ctx=fakeContext();a.ctx.currentTime=10;a.playing=true;a.nextTime=0;const times=[];a.scheduleStep=(_,t)=>times.push(t);a.update();
  assert.ok(times.every(t=>t>=10));assert.ok(times.length<5);assert.ok(a.stats.skippedSteps>50);a.dispose();
});
test('repeated volume application does not restart or retime a running song',()=>{
  const a=new SessionAudio();a.ctx=fakeContext();a.playing=true;a.nextTime=8;a.setVolume(.5);assert.equal(a.nextTime,8);a.setVolume(.5);assert.equal(a.nextTime,8);a.dispose();
});
test('only one scheduler timer exists across repeated start/unlock calls',()=>{
  const a=new SessionAudio();a.startMusic();const first=a.timer;for(let n=0;n<20;n++)a.startMusic();assert.equal(a.timer,first);a.stopMusic();assert.equal(a.timer,null);a.dispose();
});
