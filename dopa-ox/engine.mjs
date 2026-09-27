// Pure quiz rules: no dependency on the arithmetic game's save state or DOM.
export const SAVE_KEY = 'dopa-ox-ko-v1';
export const RANKS = Object.freeze([
 {id:1,name:'키즈',label:'초등 1학년',xp:0}, {id:2,name:'초보',label:'쉬운 상식',xp:200},
 {id:3,name:'중수',label:'한 걸음 더',xp:900}, {id:4,name:'고수',label:'헷갈림 주의',xp:2600},
 {id:5,name:'천재',label:'깊이 생각',xp:7000}, {id:6,name:'초인',label:'최고 난도',xp:18000}
]);
export const CATEGORIES = Object.freeze([
 {id:'space',name:'우주·천문',icon:'🪐'}, {id:'science',name:'과학·원소',icon:'🧪'},
 {id:'animals',name:'동물',icon:'🐾'}, {id:'nature',name:'지구·자연',icon:'🌿'},
 {id:'world',name:'세계지리',icon:'🌏'}, {id:'heritage',name:'세계유산·역사',icon:'🏛'},
 {id:'korea',name:'한국사·문화',icon:'🇰🇷'}, {id:'language',name:'국어·언어',icon:'📚'},
 {id:'arts',name:'예술·문학',icon:'🎨'}, {id:'sports',name:'스포츠·놀이',icon:'⚽'},
 {id:'tech',name:'컴퓨터·생활',icon:'💻'}, {id:'math',name:'수학·논리',icon:'🧩'}
]);
export const CATEGORY = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
export const KIDS_CATEGORY_NAMES=Object.freeze({space:'하늘과 우주',science:'쉬운 과학',animals:'동물 친구',nature:'자연과 날씨',world:'땅과 바다',heritage:'옛날 이야기',korea:'우리나라',language:'쉬운 한글',arts:'그림과 노래',sports:'운동과 놀이',tech:'생활 속 도구',math:'숫자 놀이'});
export function categoryName(id,rank=2){return Number(rank)===1?KIDS_CATEGORY_NAMES[id]:CATEGORY[id]?.name;}
export function quizRank(mode,rank){return mode==='daily'?(Number(rank)===1?1:3):Number(rank);}
export function reviewForRank(bank,ids,rank){if(Number(rank)!==1)return ids;const allowed=new Set(bank.filter(q=>q.level===1).map(q=>q.id));return ids.filter(id=>allowed.has(id));}
export function rng(seed=Date.now()) { let a=(Number(seed)||hash(String(seed)))>>>0; return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}; }
export function hash(s) { let h=2166136261;for(const c of String(s)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0; }
export function shuffle(list,random=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function dayKey(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
const integer=(x,lo=0,hi=1e9)=>Number.isFinite(Number(x))?Math.max(lo,Math.min(hi,Math.floor(Number(x)))):lo;
export function freshState(){return{version:1,xp:0,answered:0,correct:0,bestCombo:0,sessions:0,bestChallenge:0,seen:[],review:[],bookmarks:[],days:{},history:[],categoryStats:{},settings:{rank:1,categories:[],count:10,volume:65,motion:1,muted:false,palette:'pink',costume:'',theme:'classic',song:'classic'}};}
export function sanitizeState(raw,validIds=null){
 const s=freshState();if(!raw||typeof raw!=='object'||Array.isArray(raw))return s;
 for(const k of ['xp','answered','correct','bestCombo','sessions','bestChallenge'])s[k]=integer(raw[k]);s.correct=Math.min(s.correct,s.answered);
 const ids=x=>[...new Set((Array.isArray(x)?x:[]).filter(v=>typeof v==='string'&&v.length<100&&(!validIds||validIds.has(v))))].slice(-12000);
 s.seen=ids(raw.seen);s.review=ids(raw.review);s.bookmarks=ids(raw.bookmarks);
 if(raw.days&&typeof raw.days==='object')for(const [k,v] of Object.entries(raw.days).sort().slice(-730)){if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!v||typeof v!=='object')continue;s.days[k]={answered:integer(v.answered),correct:integer(v.correct),review:integer(v.review),categories:[...new Set((Array.isArray(v.categories)?v.categories:[]).filter(x=>CATEGORY[x]))],claimed:!!v.claimed};}
 for(const c of CATEGORIES){const v=raw.categoryStats?.[c.id];if(v&&typeof v==='object')s.categoryStats[c.id]={answered:integer(v.answered),correct:Math.min(integer(v.correct),integer(v.answered))};}
 s.history=(Array.isArray(raw.history)?raw.history:[]).filter(x=>x&&typeof x==='object').slice(-80).map(x=>({day:/^\d{4}-\d{2}-\d{2}$/.test(x.day)?x.day:'',mode:['basic','challenge','daily','review'].includes(x.mode)?x.mode:'basic',total:integer(x.total,0,1000),correct:integer(x.correct,0,1000),score:integer(x.score),rank:integer(x.rank,1,6)}));
 const v=raw.settings||{};s.settings.rank=integer(v.rank??1,1,6);s.settings.categories=[...new Set((Array.isArray(v.categories)?v.categories:[]).filter(x=>CATEGORY[x]))];s.settings.count=[10,20,30].includes(Number(v.count))?Number(v.count):10;s.settings.volume=integer(v.volume??65,0,100);s.settings.motion=[0,.45,1].includes(Number(v.motion))?Number(v.motion):1;s.settings.muted=!!v.muted;
 const looks={palette:['pink','blue','yellow','mint','violet','gold','snow','rainbow'],costume:['','cap','glasses','ribbon','headphones','cape','wizard','crown'],theme:['classic','night','sea','space','festival','paper'],song:['classic','chip','matsuri','brass','electro']};
 for(const [k,values] of Object.entries(looks))if(values.includes(v[k]))s.settings[k]=v[k];return s;
}
export function loadState(storage,ids){try{return sanitizeState(JSON.parse(storage.getItem(SAVE_KEY)||'null'),ids);}catch{return freshState();}}
export function saveState(storage,state){try{storage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function rankOf(xp){return [...RANKS].reverse().find(x=>integer(xp)>=x.xp)||RANKS[0];}
export function rankProgress(xp){const rank=rankOf(xp),next=RANKS[rank.id];return{rank,next,value:next?Math.min(1,(xp-rank.xp)/(next.xp-rank.xp)):1};}
export function buildDeck(bank,{rank=2,categories=[],count=10,seen=[],reviewIds=null,seed=Date.now()}={}){
 const random=rng(seed),seenSet=new Set(seen),requested=new Set(categories),review=reviewIds?new Set(reviewIds):null;
 let pool=bank.filter(q=>review?review.has(q.id):(q.level===Number(rank)&&(!requested.size||requested.has(q.category))));
 const shuffled=shuffle(pool,random);const groups=new Map();for(const q of shuffled){if(!groups.has(q.category))groups.set(q.category,[]);groups.get(q.category).push(q);}
 // Stable priority keeps random order within the unseen and previously seen partitions.
 for(const items of groups.values())items.sort((a,b)=>Number(seenSet.has(a.id))-Number(seenSet.has(b.id)));
 const deck=[],families=new Set();let names=shuffle([...groups.keys()],random);const target=Math.min(integer(count,1,1000),pool.length);
 while(deck.length<target&&names.length){for(const category of names){const items=groups.get(category);let i=items.findIndex(q=>!families.has(q.family||q.id));if(i<0)continue;const [q]=items.splice(i,1);deck.push(q);families.add(q.family||q.id);if(deck.length===target)break;}names=shuffle(names.filter(c=>groups.get(c).some(q=>!families.has(q.family||q.id))),random);}
 // Final shuffle avoids a predictable category pattern. No fabricated filler or repeats.
 return shuffle(deck,random);
}
export function applyAnswer(state,q,answer,{combo=0,reviewMode=false,day=dayKey()}={}){
 if(typeof answer!=='boolean')throw new TypeError('O/X answer must be boolean');
 const correct=answer===q.answer,first=!state.seen.includes(q.id);state.answered++;if(correct)state.correct++;
 state.bestCombo=Math.max(state.bestCombo,correct?combo:0);if(first)state.seen.push(q.id);
 if(correct)state.review=state.review.filter(id=>id!==q.id);else if(!state.review.includes(q.id))state.review.push(q.id);
 const gained=correct?(first?8+q.level*4:2):1;state.xp+=gained;
 const c=state.categoryStats[q.category]??={answered:0,correct:0};c.answered++;if(correct)c.correct++;
 const d=state.days[day]??={answered:0,correct:0,review:0,categories:[],claimed:false};d.answered++;if(correct)d.correct++;if(reviewMode&&correct)d.review++;if(!d.categories.includes(q.category))d.categories.push(q.category);
 const complete=d.answered>=10&&d.correct>=7&&d.categories.length>=3;let bonus=0;if(complete&&!d.claimed){d.claimed=true;bonus=80;state.xp+=bonus;}
 return{correct,gained,bonus,first};
}
export function sessionScore(results,mode='basic'){const correct=results.filter(x=>x.correct).length;return mode==='challenge'?results.reduce((s,r)=>s+(r.correct?100+Math.min(r.combo,20)*10:0),0):results.length?Math.round(correct/results.length*100):0;}
export function validateBank(bank,sources){
 const errors=[],ids=new Set(),statements=new Set();if(!Array.isArray(bank)||!bank.length)return['Empty bank'];
 for(const q of bank){if(!q.id||ids.has(q.id))errors.push(`Duplicate/missing id: ${q.id}`);ids.add(q.id);const text=q.statement?.replace(/\s+/g,'').toLowerCase();if(!text||statements.has(text))errors.push(`Duplicate/missing statement: ${q.id}`);statements.add(text);if(!CATEGORY[q.category])errors.push(`Category: ${q.id}`);if(!Number.isInteger(q.level)||q.level<1||q.level>6)errors.push(`Level: ${q.id}`);if(typeof q.answer!=='boolean')errors.push(`Answer: ${q.id}`);if(!q.explanation||q.explanation.length<6)errors.push(`Explanation: ${q.id}`);if(!sources[q.source])errors.push(`Source: ${q.id} / ${q.source}`);if(q.statement?.includes('\ufffd')||q.explanation?.includes('\ufffd'))errors.push(`Encoding: ${q.id}`);}
 return errors;
}
export function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function parseRows(category,text){return text.trim().split('\n').filter(x=>x.trim()&&!x.startsWith('#')).map((line,i)=>{const [level,a,statement,explanation,source,family]=line.split('|');if(!['O','X'].includes(a))throw new Error(`${category} row ${i+1}: invalid answer`);return{id:`${category}-${String(i+1).padStart(3,'0')}`,category,level:Number(level),answer:a==='O',statement,explanation,source,family:family||`${category}-${i+1}`,kind:'curated'};});}
