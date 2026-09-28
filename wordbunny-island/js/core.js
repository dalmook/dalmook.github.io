/* WordBunny Island — independent learning & content engine. No external dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BunnyCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const RESERVED_IDS = new Set([...Object.getOwnPropertyNames(Object.prototype), 'prototype']);
  const STORED_WORD_LIMIT = 10000;
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  const clean = (s, max = 120) => String(s ?? '').normalize('NFC').trim().slice(0, max);
  const normalizeAnswer = s => clean(s).toLocaleLowerCase('en-US').replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const dayNumber = key => Math.floor(Date.parse(`${key}T12:00:00Z`) / 86400000);
  function safeImage(value) {
    const s = clean(value, 2000000);
    if (!s) return '';
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
    if (/^(content\/images|assets)\/[a-zA-Z0-9_\-/.]+\.(svg|png|jpg|jpeg|webp)$/i.test(s) && !s.includes('..') && !s.includes('//')) return s;
    throw new Error('사진은 직접 업로드하거나 content/images/ 아래의 이미지 경로를 사용하세요.');
  }
  function normalizeWord(input, fallbackId) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('단어 항목 형식이 올바르지 않아요.');
    const en = clean(input.en ?? input.word ?? input.english, 70);
    const ko = clean(input.ko ?? input.meaning ?? input.korean, 120);
    if (!en || !ko) throw new Error('영어 단어와 한글 뜻이 모두 필요해요.');
    if (!/^[A-Za-z][A-Za-z ’'\-]*$/.test(en)) throw new Error(`영어 칸을 확인해 주세요: ${en.slice(0,30)}`);
    const id = clean(input.id || fallbackId, 100);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(id) || RESERVED_IDS.has(id)) throw new Error('단어 ID는 영문·숫자·밑줄·하이픈으로 지정하세요.');
    const level = Number(input.level ?? 1);
    return { id, en, ko, category:clean(input.category || '내 단어', 36), image:safeImage(input.image), example:clean(input.example, 180), level:[1,2,3].includes(level) ? level : 1 };
  }
  function parseDelimited(text) {
    const s = String(text).replace(/^\uFEFF/,'').trim();
    if (!s) return [];
    const sep = s.split(/\r?\n/)[0].includes('\t') ? '\t' : ',';
    const rows = []; let row=[], field='', quote=false;
    for (let i=0; i<s.length; i++) {
      const c=s[i];
      if (c==='"') { if (quote && s[i+1]==='"') {field+='"'; i++;} else quote=!quote; }
      else if (!quote && c===sep) {row.push(field.trim()); field='';}
      else if (!quote && (c==='\n' || c==='\r')) {if(c==='\r'&&s[i+1]==='\n') i++; row.push(field.trim()); if(row.some(Boolean)) rows.push(row); row=[]; field='';}
      else field+=c;
    }
    if (quote) throw new Error('CSV의 따옴표가 닫히지 않았어요.');
    row.push(field.trim()); if(row.some(Boolean)) rows.push(row);
    return rows;
  }
  function parseWords(text, prefix = 'import', maxItems = 1000) {
    const s=String(text).trim(); let arr;
    if (s.startsWith('[') || s.startsWith('{')) {
      const obj=JSON.parse(s);
      if (obj.schemaVersion !== undefined && obj.schemaVersion !== VERSION) throw new Error('지원하지 않는 단어팩 버전이에요.');
      arr=Array.isArray(obj)?obj:obj.words;
    } else {
      let rows;
      if (!s.includes(',') && !s.includes('\t')) rows=s.split(/\r?\n/).filter(x=>x.trim()).map(x=>x.split(/\s*\/\s*/));
      else rows=parseDelimited(s);
      let header=null;
      const aliases={en:'en',word:'en',english:'en','영어':'en','단어':'en',ko:'ko',meaning:'ko',korean:'ko','뜻':'ko','한글':'ko',category:'category','주제':'category',example:'example','예문':'example',id:'id',image:'image','사진':'image',level:'level'};
      if(rows.length && rows[0].some(v=>['en','english','word','영어','단어'].includes(v.toLowerCase())) && rows[0].some(v=>['ko','meaning','korean','뜻','한글'].includes(v.toLowerCase()))) header=rows.shift().map(v=>aliases[v.toLowerCase()] || 'ignore');
      arr=rows.map(r=>{ if(header) return Object.fromEntries(header.map((h,i)=>[h,r[i]||''])); return {en:r[0],ko:r[1],category:r[2],example:r[3]}; });
    }
    if (!Array.isArray(arr) || !arr.length) throw new Error('추가할 단어가 없어요.');
    const limit=Math.max(1,Math.min(STORED_WORD_LIMIT,Number.isInteger(maxItems)?maxItems:1000));
    if (arr.length>limit) throw new Error(`한 번에 ${limit.toLocaleString('ko-KR')}단어까지 처리할 수 있어요.`);
    const seen=new Set(), ids=new Set(); let duplicates=0;
    const words=[];
    arr.forEach((w,i)=>{
      let n;
      try {n=normalizeWord(w,`${prefix}-${i+1}`);} catch(e){throw new Error(`${i+1}번째 단어: ${e.message}`);}
      const key=normalizeAnswer(n.en)+'|'+normalizeAnswer(n.ko);
      if (seen.has(key)) {duplicates++;return;}
      if(ids.has(n.id)) throw new Error(`중복된 ID가 있어요: ${n.id}`);
      seen.add(key);ids.add(n.id);words.push(n);
    });
    return {words,duplicates};
  }
  function shuffle(items, rng = Math.random) {
    const out=[...items]; for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
  }
  function initialState() {
    return {schemaVersion:1,name:'탐험가',xp:0,coins:0,goal:10,progress:{},days:{},owned:['scarf'],equipped:'scarf',hidden:[],favorite:[],settings:{sfx:true,music:false,reduced:false,rate:0.8},lastBackup:0};
  }
  function freshProgress() {return {attempts:0,correct:0,stage:0,due:0,lastSeen:0,lastGradedDay:'',lastWrong:0};}
  function grade(state, id, correct, now=Date.now(), hinted=false) {
    const d=dayKey(new Date(now)); const p=state.progress[id]||(state.progress[id]=freshProgress());
    const firstToday=p.lastGradedDay!==d;
    p.attempts++;p.lastSeen=now;
    if(correct && !hinted){
      p.correct++;
      // Same-day repetitions increase practice counts, never fast-forward mastery.
      if(firstToday && p.due<=now){p.stage=Math.min(5,p.stage+1);p.due=now+INTERVALS[p.stage]*86400000;}
    } else {p.stage=Math.max(0,p.stage-1);p.due=now;p.lastWrong=now;}
    p.lastGradedDay=d;
    const ds=state.days[d]||(state.days[d]={attempts:0,correct:0,words:[],sessions:0,rewarded:false});
    ds.attempts++;if(correct&&!hinted)ds.correct++;
    if(!ds.words.includes(id))ds.words.push(id);
    // Cap daily earned currency, without limiting children's learning.
    const earned=correct&&!hinted && ds.correct<=100 ? 2 : 0;
    state.xp+=correct&&!hinted?10:2;state.coins+=earned;
    let bonus=0;
    if(ds.correct>=state.goal&&!ds.rewarded){ds.rewarded=true;bonus=20;state.coins+=bonus;}
    return {progress:p,earned,bonus};
  }
  function selectDeck(words, progress, n=5, reviewOnly=false, now=Date.now(), rng=Math.random) {
    const due=shuffle(words.filter(w=>progress[w.id] && progress[w.id].due<=now),rng).sort((a,b)=>(progress[a.id].due||0)-(progress[b.id].due||0));
    const fresh=shuffle(words.filter(w=>!progress[w.id]),rng);
    const rest=shuffle(words.filter(w=>progress[w.id]&&progress[w.id].due>now),rng);
    return [...due,...(reviewOnly?[]:fresh),...(reviewOnly?[]:rest)].slice(0,n);
  }
  function choiceOptions(word, pool, field='en', n=4, rng=Math.random) {
    const seen=new Set([normalizeAnswer(word[field])]);
    const candidates=shuffle(pool,rng).filter(w=>{const key=normalizeAnswer(w[field]);if(w.id===word.id||seen.has(key))return false;seen.add(key);return true;});
    return shuffle([word,...candidates.slice(0,n-1)],rng);
  }
  function streak(days, date=new Date()) {
    let today=dayNumber(dayKey(date));
    const active=new Set(Object.entries(days).filter(([,d])=>d.attempts>0).map(([k])=>dayNumber(k)));
    if(!active.has(today))today--;
    let total=0; while(active.has(today-total))total++; return total;
  }
  function validateState(input) {
    if(!input || typeof input!=='object' || input.schemaVersion!==1) throw new Error('학습 기록 버전이 올바르지 않아요.');
    const state=initialState();
    state.name=clean(input.name||'탐험가',18);
    for(const key of ['xp','coins','lastBackup']) state[key]=Number.isFinite(input[key])?Math.max(0,Math.min(key==='lastBackup'?8640000000000000:100000000,input[key])):0;
    state.goal=[5,10,15,20].includes(input.goal)?input.goal:10;
    const allowed=['scarf','hat','crown','bow','cape','flower'];
    state.owned=[...new Set(['scarf',...(Array.isArray(input.owned)?input.owned.filter(x=>allowed.includes(x)):[])])];
    state.equipped=state.owned.includes(input.equipped)?input.equipped:'scarf';
    for(const k of ['hidden','favorite']) state[k]=Array.isArray(input[k])?input[k].filter(x=>typeof x==='string'&&/^[a-zA-Z0-9][\w-]{0,99}$/.test(x)).slice(0,10000):[];
    for(const [id,p] of Object.entries(input.progress||{}).slice(0,10000)) {
      if(!/^[a-zA-Z0-9][\w-]{0,99}$/.test(id)||RESERVED_IDS.has(id)||!p||typeof p!=='object')continue;
      const next=freshProgress();
      for(const k of ['attempts','correct','stage','due','lastSeen','lastWrong'])next[k]=Number.isFinite(p[k])?Math.max(0,p[k]):0;
      next.stage=Math.min(5,Math.floor(next.stage));next.correct=Math.min(next.correct,next.attempts);
      next.lastGradedDay=/^\d{4}-\d{2}-\d{2}$/.test(p.lastGradedDay)?p.lastGradedDay:'';
      state.progress[id]=next;
    }
    for(const [key,d] of Object.entries(input.days||{}).slice(-4000)) {
      if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!d||typeof d!=='object')continue;
      const safeNum=v=>Number.isFinite(v)?Math.max(0,Math.floor(v)):0;
      state.days[key]={attempts:safeNum(d.attempts),correct:Math.min(safeNum(d.correct),safeNum(d.attempts)),words:Array.isArray(d.words)?[...new Set(d.words.filter(x=>typeof x==='string'))].slice(0,10000):[],sessions:safeNum(d.sessions),rewarded:d.rewarded===true};
    }
    for(const k of ['sfx','music','reduced']) if(typeof input.settings?.[k]==='boolean')state.settings[k]=input.settings[k];
    state.settings.rate=[0.65,0.8,1].includes(input.settings?.rate)?input.settings.rate:0.8;
    return state;
  }
  function parseBackup(text) {
    const obj=JSON.parse(text);
    if(obj.app!=='wordbunny-island'||obj.schemaVersion!==1)throw new Error('워드버니 아일랜드 백업 파일이 아니에요.');
    const state=validateState(obj.state);
    const custom=Array.isArray(obj.custom)&&obj.custom.length?parseWords(JSON.stringify(obj.custom),'restore',STORED_WORD_LIMIT).words:[];
    return {state,custom};
  }
  function csvEscape(v) {let s=String(v??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  return {VERSION,STORED_WORD_LIMIT,INTERVALS,clean,normalizeAnswer,escapeHTML,dayKey,dayNumber,safeImage,normalizeWord,parseDelimited,parseWords,shuffle,initialState,freshProgress,grade,selectDeck,choiceOptions,streak,validateState,parseBackup,csvEscape};
});
