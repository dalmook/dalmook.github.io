import test from 'node:test';
import assert from 'node:assert/strict';
import {SessionAudio} from '../audio-session.mjs';
import {AudioEngine} from '../vendor/audio.js';

test('silent long sessions never allocate an AudioContext or synth nodes',()=>{
 const unlock=AudioEngine.prototype.unlock,play=AudioEngine.prototype.play;
 let unlocked=0,played=0;
 try {
  AudioEngine.prototype.unlock=function(){unlocked++;};
  AudioEngine.prototype.play=function(){played++;};
  const audio=new SessionAudio();audio.setMuted(true);audio.startMusic();
  for(let i=0;i<1000;i++){audio.unlock();audio.keyTap(i%15);audio.correct(i%10,.8);}
  audio.update();assert.equal(unlocked,0);assert.equal(played,0);assert.equal(audio.ctx,null);
 } finally {AudioEngine.prototype.unlock=unlock;AudioEngine.prototype.play=play;}
});
test('zero volume also avoids inaudible synthesis',()=>{
 const old=AudioEngine.prototype.play;let calls=0;
 try{AudioEngine.prototype.play=()=>calls++;const a=new SessionAudio();a.setVolume(0);a.keyTap(0);assert.equal(calls,0);}
 finally{AudioEngine.prototype.play=old;}
});
test('audible synthesis is delegated with original arguments',()=>{
 const old=AudioEngine.prototype.play;const calls=[];
 try{AudioEngine.prototype.play=function(...args){calls.push(args);};const a=new SessionAudio();a.play('bell',.4,{v:.2});assert.deepEqual(calls,[['bell',.4,{v:.2}]]);}
 finally{AudioEngine.prototype.play=old;}
});
test('unmuting a running silent session rebases the new audio clock',()=>{
 const old=AudioEngine.prototype.unlock;
 try{
  AudioEngine.prototype.unlock=function(){this.ctx={currentTime:0,state:'running'};};
  const a=new SessionAudio();a.setMuted(true);a.startMusic();a.nextTime=900;a.kicks=[899];a.beats=[{t:899}];a.setMuted(false);
  assert.ok(a.ctx);assert.equal(a.nextTime,.06);assert.deepEqual(a.kicks,[]);assert.deepEqual(a.beats,[]);
 }finally{AudioEngine.prototype.unlock=old;}
});
test('disposal stops music and closes native resources once',async()=>{
 const a=new SessionAudio();let closed=0;a.ctx={state:'running',close(){closed++;return Promise.resolve();}};a.g={};a.playing=true;a.dispose();a.dispose();await Promise.resolve();assert.equal(closed,1);assert.equal(a.playing,false);assert.equal(a.ctx,null);assert.equal(a.g,null);
});
test('offline capture semantics remain unchanged even when muted',()=>{
 const a=new SessionAudio({capture:true});a.setMuted(true);a.play('bell',2,{v:1});assert.deepEqual(a.log,[['bell',2,{v:1}]]);
});
