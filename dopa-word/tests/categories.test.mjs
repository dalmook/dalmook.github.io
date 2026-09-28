import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BASE} from '../words.mjs';
import * as M from '../model.mjs';
// Synthetic fixtures only: not a copy of any user's private browser wordbook.
const fixture=()=>{
 const s=M.freshState();
 for(let i=0;i<35;i++)M.upsertWord(s,{word:'test word '+String.fromCharCode(97+Math.floor(i/26),97+i%26),meaning:'테스트 뜻 '+i,group:'테스트 마트'});
 M.upsertWord(s,{word:'test other',meaning:'다른 주제 테스트',group:'다른 카테고리'});
 return s;
};
test('custom categories stay discoverable under base and short-word filters',()=>{
 const s=fixture();assert.equal(s.settings.source,'base');assert.equal(s.settings.level,1);
 const c=M.categoryCatalog(s);assert.equal(c.find(c=>c.name==='테스트 마트').total,35);assert.equal(c.find(c=>c.name==='테스트 마트').custom,35);assert.ok(c.some(c=>c.name===BASE[0].group));
});
test('selecting a custom category clears incompatible source/length/count filters',()=>{
 const s=fixture();M.selectCategories(s,['테스트 마트']);assert.equal(s.settings.source,'all');assert.equal(s.settings.level,0);assert.equal(s.settings.count,0);assert.equal(M.eligible(s).length,35);
});
for(const mode of ['spell','choice'])test(mode+': direct full-category study includes all 35 words once',()=>{
 const s=fixture();M.chooseCategoryMode(s,'테스트 마트',mode);const deck=M.makeDeck(s,{seed:14});assert.equal(s.settings.mode,mode);assert.equal(deck.length,35);assert.equal(new Set(deck.map(w=>w.id)).size,35);assert.ok(deck.every(w=>w.group==='테스트 마트'));
});
test('full-category selection works for built-in categories too',()=>{const s=fixture();M.chooseCategoryMode(s,BASE[0].group,'choice');assert.equal(M.makeDeck(s).length,20);assert.ok(M.makeDeck(s).every(w=>w.group===BASE[0].group));});
test('multiple category selection does not leak unrelated words',()=>{const s=fixture();M.selectCategories(s,['테스트 마트','다른 카테고리']);assert.equal(M.makeDeck(s).length,36);});
test('10/20/30 per-session limits remain explicit options',()=>{for(const count of [10,20,30]){const s=fixture();M.selectCategories(s,['테스트 마트']);s.settings.count=count;assert.equal(M.makeDeck(s).length,count);}});
test('all-word choice and 35-word history survive existing v1 save/backup',()=>{
 const s=fixture();M.selectCategories(s,['테스트 마트']);s.xp=123;s.answered=35;s.correct=34;s.history=[{day:'2026-09-29',mode:'spell',total:35,correct:34}];
 const copy=M.parseBackup(JSON.stringify(s));assert.equal(copy.settings.count,0);assert.equal(copy.history[0].total,35);assert.equal(copy.history[0].correct,34);assert.equal(copy.xp,123);assert.deepEqual(copy.custom,s.custom);assert.equal(M.makeDeck(copy).length,35);assert.equal(M.SAVE_KEY,'dopa-word-ko-v1');
});
test('category review respects category, remains independent per mode, and keeps other errors',()=>{
 const s=fixture(),a=s.custom[0],b=s.custom.at(-1);M.recordAnswer(s,a,'spell',false);M.recordAnswer(s,b,'spell',false);M.selectCategories(s,['테스트 마트']);
 assert.deepEqual(M.makeDeck(s,{review:true}).map(w=>w.id),[a.id]);s.settings.mode='choice';assert.equal(M.eligible(s,{review:true}).length,0);assert.ok(s.progress[b.id].spell.review);
 s.settings.mode='spell';s.settings.groups=[];assert.equal(M.eligible(s,{review:true}).length,2);
});
test('selecting a category does not mutate any words, scores or progress',()=>{
 const s=fixture();M.recordAnswer(s,s.custom[0],'spell',true);const before=JSON.stringify([s.custom,s.progress,s.xp,s.answered]);M.selectCategories(s,['테스트 마트']);assert.equal(JSON.stringify([s.custom,s.progress,s.xp,s.answered]),before);
});
test('category selection normalizes whitespace, removes duplicates and rejects nonexistent names',()=>{const s=fixture();assert.deepEqual(M.selectCategories(s,[' 테스트 마트 ','테스트 마트','missing']),['테스트 마트']);assert.throws(()=>M.chooseCategoryMode(s,'missing','spell'));assert.throws(()=>M.chooseCategoryMode(s,'테스트 마트','bad'));});
test('blank category receives a visible default name',()=>assert.equal(M.validateWord({word:'test word',meaning:'시험',group:'  '}).value.group,'내 단어'));
test('overriding built-in English does not duplicate category counts',()=>{const s=fixture();M.upsertWord(s,{word:BASE[0].word,meaning:'테스트 뜻',group:'테스트 마트'});assert.equal(M.categoryCatalog(s).find(c=>c.name==='테스트 마트').total,36);assert.equal(M.vocabulary(s).filter(w=>w.id===BASE[0].id).length,1);});
test('category discovery includes safely renderable hostile labels as plain data',()=>{const s=fixture();const label='<img src=x onerror=alert(1)>';M.upsertWord(s,{word:'safe label',meaning:'뜻',group:label});assert.ok(M.categoryCatalog(s).some(c=>c.name===label));assert.ok(!M.escapeHTML(label).includes('<img'));});
test('no implicit network uploads introduced by category functions',()=>{const source=readFileSync(new URL('../model.mjs',import.meta.url),'utf8');assert.ok(!/\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\s*\(/.test(source));});
