import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createSessionAudio} from '../audio-runtime.mjs';
import {AudioEngine as Drill} from '../../dopa-drill/js/audio.js';
import {AudioEngine as OX} from '../../dopa-ox/vendor/audio.js';
import {AudioEngine as Word} from '../../dopa-word/vendor/audio.js';
for(const [name,Base] of [['산수',Drill],['OX',OX],['영단어',Word]]){
 const Audio=createSessionAudio(Base);
 test(name+': independent scheduler, lookahead and original instruments',()=>{const a=new Audio();a.startMusic();const timer=a.timer;a.startMusic();assert.ok(timer);assert.equal(a.timer,timer);assert.equal(a.horizon,.32);assert.equal(typeof a.correct,'function');assert.equal(typeof a.setSong,'function');a.dispose();assert.equal(a.timer,null);});
 test(name+': background lifecycle suspends without changing game mode',()=>{const a=new Audio();let suspended=0,resumed=0;a.ctx={currentTime:5,state:'running',suspend:()=>{suspended++;return Promise.resolve()},resume:()=>{resumed++;return Promise.resolve()}};a.playing=true;a.ensureTimer();a.setPageHidden(true);assert.equal(a.playing,true);assert.equal(a.timer,null);assert.equal(suspended,1);a.setPageHidden(false);assert.equal(a.nextTime,5.06);assert.ok(a.timer);assert.equal(resumed,1);a.dispose();});
 test(name+': offline capture remains deterministic and timer-free',()=>{const a=new Audio({capture:true});a.startMusic();a.setMuted(true);a.play('bell',2,{v:1});assert.equal(a.timer,null);assert.deepEqual(a.log,[['bell',2,{v:1}]]);a.dispose();});
 test(name+': delayed schedule never replays an old backlog',()=>{const a=new Audio();a.ctx={currentTime:12,state:'running'};a.playing=true;a.nextTime=0;const times=[];a.scheduleStep=(_,t)=>times.push(t);a.update();assert.ok(times.length>0&&times.length<5);assert.ok(times.every(t=>t>=12));assert.ok(a.stats.skippedSteps>0);a.dispose();});
}
test('all protected words, quiz questions, scoring, licenses and art equal approved baseline',()=>{const manifest=JSON.parse(readFileSync(new URL('../protected-files.json',import.meta.url)));assert.ok(Object.keys(manifest).length>=50);for(const [path,hash] of Object.entries(manifest))assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex'),hash,path);});
test('three sites use the same performance runtime, without state-key migration',()=>{for(const [path,needle]of [['dopa-word/audio-session.mjs','createSessionAudio'],['dopa-ox/app.mjs','createSessionAudio'],['dopa-drill/js/main.js','createSessionAudio']])assert.ok(readFileSync(new URL('../../'+path,import.meta.url),'utf8').includes(needle));const render=readFileSync(new URL('../render-budget.mjs',import.meta.url),'utf8');assert.ok(render.includes("game+'-performance-v1'"));});
