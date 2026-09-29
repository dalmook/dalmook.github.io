// Pure domain rules. User input is never executed as HTML or code.
import {BASE} from './words.mjs';
import {validatePack,packWords,MAX_CACHED_PACKS} from './shared-model.mjs';
export const SAVE_KEY='dopa-word-ko-v1';
export const MAX_WORDS=3000;
export const REVISION='word-1.2.0-sharing';
export const MAX_SESSION_WORDS=MAX_WORDS+BASE.length+MAX_CACHED_PACKS*500;
export const MODE_NAMES={spell:'스펠링 맞히기',choice:'뜻 고르기'};
export const LEVELS=[{id:0,name:'전체',note:'길이 무관'},{id:1,name:'첫 단어',note:'2~4글자'},{id:2,name:'기초',note:'5~6글자'},{id:3,name:'도전',note:'7글자 이상'}];
export const normalWord=s=>String(s??'').normalize('NFKC').replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,'-').trim().replace(/\s+/g,' ').toLowerCase();
export const letters=s=>normalWord(s).replace(/[^a-z]/g,'');
export const wordID=s=>'word:'+normalWord(s);
export const signature=w=>JSON.stringify([w.word,w.meaning]);
export function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const cleanText=s=>String(s??'').normalize('NFKC').trim().replace(/[\r\n\t]+/g,' ').replace(/ +/g,' ');
export function validateWord(raw){
 const word=normalWord(raw?.word),meaning=cleanText(raw?.meaning),group=cleanText(raw?.group||'내 단어')||'내 단어';
 if(!/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)||word.length>40)return{error:'영어는 알파벳으로 1~40자, 띄어쓰기·하이픈·아포스트로피만 사용할 수 있어요.'};
 if(!meaning||meaning.length>100||/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/.test(meaning))return{error:'뜻은 비어 있지 않은 100자 이내의 올바른 글자로 적어 주세요.'};
 if(group.length>30||/[\x00-\x1f\ufffd]/.test(group))return{error:'단어장 이름은 30자 이내로 적어 주세요.'};
 const n=letters(word).length;
 return{value:{id:wordID(word),word,meaning,group,level:n<=4?1:n<=6?2:3,origin:'custom'}};
}
export function vocabulary(state){const map=new Map(BASE.map(w=>[w.id,w]));for(const w of state.custom)map.set(w.id,w);return [...map.values(),...(state.sharedPacks||[]).flatMap(packWords)];}
export function freshState(){return{app:'dopa-word',version:1,revision:0,xp:0,answered:0,correct:0,sessions:0,bestCombo:0,custom:[],sharedPacks:[],progress:{},days:{},history:[],settings:{mode:'spell',source:'base',level:1,groups:[],count:10,volume:55,motion:1,muted:false,palette:'pink',costume:'',theme:'classic',song:'classic'}};}
const integer=(n,max=1e8)=>Number.isFinite(Number(n))?Math.max(0,Math.min(max,Math.floor(Number(n)))):0;
export function sanitizeState(raw){
 const s=freshState();if(!raw||typeof raw!=='object'||Array.isArray(raw))return s;
 for(const k of ['revision','xp','answered','correct','sessions','bestCombo'])s[k]=integer(raw[k]);s.correct=Math.min(s.correct,s.answered);
 const map=new Map();for(const r of (Array.isArray(raw.custom)?raw.custom:[]).slice(0,MAX_WORDS)){const v=validateWord(r).value;if(v)map.set(v.id,v);}s.custom=[...map.values()];
 const packs=new Map();for(const rawPack of (Array.isArray(raw.sharedPacks)?raw.sharedPacks:[]).slice(0,MAX_CACHED_PACKS)){try{const p=validatePack(rawPack);packs.set(p.id,p);}catch{}}s.sharedPacks=[...packs.values()];
 const known=new Map(vocabulary(s).map(w=>[w.id,signature(w)]));
 if(raw.progress&&typeof raw.progress==='object')for(const [id,p] of Object.entries(raw.progress)){
  if(!known.has(id)||!p||p.signature!==known.get(id))continue;const out={signature:p.signature};
  for(const mode of ['spell','choice']){const v=p[mode];if(v&&typeof v==='object')out[mode]={tries:integer(v.tries),correct:Math.min(integer(v.correct),integer(v.tries)),streak:integer(v.streak,99),review:!!v.review};}s.progress[id]=out;
 }
 if(raw.days&&typeof raw.days==='object')for(const [day,v] of Object.entries(raw.days).sort().slice(-366)){if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&v&&typeof v==='object')s.days[day]={answered:integer(v.answered),correct:integer(v.correct)};}
 s.history=(Array.isArray(raw.history)?raw.history:[]).slice(-50).filter(v=>v&&['spell','choice'].includes(v.mode)).map(v=>({mode:v.mode,total:integer(v.total,MAX_SESSION_WORDS),correct:Math.min(integer(v.correct,MAX_SESSION_WORDS),integer(v.total,MAX_SESSION_WORDS)),day:cleanText(v.day).slice(0,10)}));
 const o=raw.settings||{},d=s.settings;for(const [key,allowed] of Object.entries({mode:['spell','choice'],source:['base','custom','shared','all'],palette:['pink','blue','yellow','mint','violet','gold','snow','rainbow'],costume:['','cap','glasses','ribbon','headphones','cape','wizard','crown'],theme:['classic','night','sea','space','festival','paper'],song:['classic','chip','matsuri','brass','electro']}))if(allowed.includes(o[key]))d[key]=o[key];
 if([0,1,2,3].includes(Number(o.level)))d.level=Number(o.level);if([0,10,20,30].includes(Number(o.count)))d.count=Number(o.count);if([0,.45,1].includes(Number(o.motion)))d.motion=Number(o.motion);if(o.volume!==undefined)d.volume=integer(o.volume,100);d.muted=!!o.muted;d.groups=[...new Set((Array.isArray(o.groups)?o.groups:[]).filter(x=>typeof x==='string'&&x.length<=30))];return s;
}
export function loadState(storage){try{return sanitizeState(JSON.parse(storage.getItem(SAVE_KEY)||'null'));}catch{return freshState();}}
export function saveState(storage,s){try{storage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
export function dayKey(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function hash(s){let h=2166136261;for(const c of String(s)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let a=hash(seed);return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,a|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function progressOf(s,w,mode=s.settings.mode){const p=s.progress[w.id];return p?.signature===signature(w)?p[mode]:undefined;}
export function eligible(s,{review=false}={}){return vocabulary(s).filter(w=>review?(progressOf(s,w)?.review&&(!s.settings.groups.length||s.settings.groups.includes(w.group))):((s.settings.source==='all'||w.origin===s.settings.source)&&(!s.settings.level||w.level===s.settings.level)&&(!s.settings.groups.length||s.settings.groups.includes(w.group))));}
// Category discovery is intentionally independent of source and word-length filters.
// Choosing a category is an explicit request for its full contents, not an empty
// intersection with a hidden previous "base / first words" selection.
export function categoryCatalog(s){
 const map=new Map();for(const w of vocabulary(s)){
  if(!map.has(w.group))map.set(w.group,{name:w.group,total:0,custom:0,base:0,shared:0});
  const c=map.get(w.group);c.total++;c[w.origin]++;
 }
 return [...map.values()].sort((a,b)=>Number(b.custom>0)-Number(a.custom>0));
}
export function selectCategories(s,names,{allWords=true}={}){
 const known=new Set(categoryCatalog(s).map(c=>c.name));
 s.settings.groups=[...new Set(names.map(cleanText).filter(n=>known.has(n)))];
 if(s.settings.groups.length){s.settings.source='all';s.settings.level=0;if(allWords)s.settings.count=0;}
 return s.settings.groups;
}
export function chooseCategoryMode(s,name,mode){
 if(!['spell','choice'].includes(mode))throw new Error('학습 모드를 다시 선택해 주세요.');
 if(!categoryCatalog(s).some(c=>c.name===name))throw new Error('이 카테고리에 단어가 없어요. 단어장을 확인해 주세요.');
 selectCategories(s,[name]);s.settings.mode=mode;
}
export function plannedCount(s,total){return s.settings.count===0?total:Math.min(s.settings.count,total);}
export function makeDeck(s,{review=false,seed=Date.now()}={}){
 const pool=eligible(s,{review}),target=plannedCount(s,pool.length),random=rng(seed),by=new Map();
 for(const w of shuffle(pool,random)){if(!by.has(w.group))by.set(w.group,[]);by.get(w.group).push(w);}
 for(const a of by.values())a.sort((x,y)=>(progressOf(s,x)?.tries||0)-(progressOf(s,y)?.tries||0));
 const deck=[];let groups=shuffle([...by.keys()],random);
 while(groups.length&&deck.length<target){for(const g of groups){deck.push(by.get(g).shift());if(deck.length===target)break;}groups=shuffle(groups.filter(g=>by.get(g).length),random);}return shuffle(deck,random);
}
// Shared Korean senses (including semicolon-separated glosses) must not become distractors.
const synonymous={엄마:'어머니',아빠:'아버지',고양이:'고양이',커다란:'큰',조그만:'작은',자전거:'자전거',회색:'회색'};
export function senses(meaning){return [...new Set(String(meaning).normalize('NFKC').replace(/\([^)]*\)/g,'').split(/[;,/·]/).map(x=>x.trim().replace(/\s+/g,'')).filter(Boolean).map(x=>synonymous[x]||x))];}
export function overlap(a,b){const x=new Set(senses(a));return senses(b).some(s=>x.has(s));}
export function makeChoices(target,pool,seed=Date.now()){
 const random=rng(seed),chosen=[target];const seen=new Set([target.id]);
 const related=shuffle(pool.filter(w=>w.group===target.group),random),rest=shuffle(pool,random),fallback=shuffle(BASE,random);
 for(const w of [...related,...rest,...fallback]){if(seen.has(w.id)||chosen.some(v=>overlap(v.meaning,w.meaning)))continue;seen.add(w.id);chosen.push(w);if(chosen.length===4)break;}
 if(chosen.length!==4)throw new Error('서로 다른 뜻의 보기 네 개를 만들 수 없어요. 단어의 뜻을 구분해 주세요.');
 return shuffle(chosen.map(w=>({id:w.id,label:w.meaning,correct:w.id===target.id})),random);
}
export function checkSpelling(input,word){return letters(input)===letters(word)&&letters(word).length>0;}
export function recordAnswer(s,w,mode,clean,combo=0){
 if(!['spell','choice'].includes(mode))throw new Error('Invalid mode');if(typeof clean!=='boolean')throw new Error('Invalid result');
 let p=s.progress[w.id];if(!p||p.signature!==signature(w))p=s.progress[w.id]={signature:signature(w)};
 const r=p[mode]??={tries:0,correct:0,streak:0,review:false};r.tries++;r.correct+=Number(clean);r.streak=clean?r.streak+1:0;r.review=!clean;
 s.answered++;s.correct+=Number(clean);s.bestCombo=Math.max(s.bestCombo,combo);const xp=clean?(r.tries===1?15:5):2;s.xp+=xp;
 const d=s.days[dayKey()]??={answered:0,correct:0};d.answered++;d.correct+=Number(clean);return xp;
}
export function upsertWord(s,raw,oldID=null){
 const result=validateWord(raw);if(result.error)throw new Error(result.error);const w=result.value;
 if(s.custom.length>=MAX_WORDS&&!s.custom.some(x=>x.id===w.id)&&!oldID)throw new Error('내 단어는 최대 3,000개까지 저장해요.');
 if(oldID&&oldID!==w.id&&vocabulary(s).some(x=>x.id===w.id))throw new Error('바꾸려는 영어 단어가 이미 있어요. 다른 단어를 선택해 주세요.');
 if(oldID&&oldID!==w.id){s.custom=s.custom.filter(x=>x.id!==oldID);delete s.progress[oldID];}
 const previous=vocabulary(s).find(x=>x.id===w.id);if(previous&&signature(previous)!==signature(w))delete s.progress[w.id];
 s.custom=s.custom.filter(x=>x.id!==w.id);s.custom.push(w);return w;
}
export function removeWord(s,id){s.custom=s.custom.filter(w=>w.id!==id);delete s.progress[id];}
// RFC-style quoted fields, tabs (Excel), pipes and "word meaning" lines. No eval.
function delimited(text,sep){const rows=[];let cells=[],cell='',quoted=false,after=false,line=1,start=1;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;after=true;}}else{cell+=c;if(c==='\n')line++;}continue;}if(c==='"'&&cell.trim()===''){quoted=true;cell='';after=false;continue;}if(c===sep){cells.push(cell);cell='';after=false;continue;}if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;cells.push(cell);rows.push({cells,line:start});cells=[];cell='';after=false;line++;start=line;continue;}if(after&&!/\s/.test(c))throw new Error(`${line}행: 따옴표 다음 구분자를 확인해 주세요.`);cell+=c;}
 if(quoted)throw new Error(`${start}행: 닫히지 않은 따옴표가 있어요.`);if(cell||cells.length){cells.push(cell);rows.push({cells,line:start});}return rows;}
export function parseImport(text,group='내 단어'){
 if(typeof text!=='string'||text.length>1_000_000)throw new Error('1MB 이하의 텍스트로 나누어 넣어 주세요.');text=text.replace(/^\ufeff/,'');if(text.includes('\ufffd'))throw new Error('글자가 깨졌어요. UTF-8 파일로 저장하거나 엑셀에서 직접 복사해 주세요.');
 const first=text.split(/\r?\n/).find(x=>x.trim())||'';const sep=first.includes('\t')?'\t':first.includes('|')?'|':first.includes(',')?',':null;
 let rows=sep?delimited(text,sep):text.split(/\r?\n/).map((line,i)=>{const match=line.trim().match(/^([A-Za-z][A-Za-z'’ -]*?)\s*(?:=|:|\s)\s*([^A-Za-z\s].*)$/);return{line:i+1,cells:match?[match[1],match[2]]:[line]};});
 const valid=[],errors=[];let blanks=0;for(const row of rows){let c=row.cells.map(x=>x.trim());if(c.every(x=>!x)){blanks++;continue;}if(!valid.length&&/^(word|english|영어|영어단어|단어)$/i.test(c[0])&&/^(meaning|뜻|한글뜻|의미)$/i.test(c[1]||''))continue;
 if(c.length<2||c.length>3){errors.push({line:row.line,error:'영어와 뜻을 두 칸으로 구분해 주세요. 세 번째 칸은 단어장 이름이에요.'});continue;}
 const r=validateWord({word:c[0],meaning:c[1],group:c[2]||group});if(r.error)errors.push({line:row.line,error:r.error});else valid.push({...r.value,line:row.line});
 if(valid.length>MAX_WORDS)throw new Error('한 번에 3,000개 이하로 등록해 주세요.');}
 return{valid,errors,blanks};
}
export function planImport(s,parsed,overwrite=false){
 const known=new Map(vocabulary(s).map(w=>[w.id,w])),adds=[],updates=[],skipped=[];const queued=new Set();
 for(const w of parsed.valid){if(queued.has(w.id)){skipped.push({word:w.word,reason:'파일 안 중복'});continue;}queued.add(w.id);if(known.has(w.id)){if(overwrite)updates.push(w);else skipped.push({word:w.word,reason:'이미 있는 단어'});}else adds.push(w);}
 if(s.custom.length+adds.length+updates.filter(w=>!s.custom.some(c=>c.id===w.id)).length>MAX_WORDS)throw new Error('내 단어장 3,000개 제한을 넘어요.');return{adds,updates,skipped,errors:parsed.errors};
}
export function applyImport(s,plan){for(const w of [...plan.adds,...plan.updates])upsertWord(s,w);return plan.adds.length+plan.updates.length;}
const csvCell=s=>{let t=String(s);if(/^[=+\-@\t\r]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};
export function exportCSV(words){return'\ufeff'+[['word','meaning','group'],...words.map(w=>[w.word,w.meaning,w.group])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function parseBackup(text){
 if(text.length>5_000_000)throw new Error('백업 파일이 너무 커요.');let raw;try{raw=JSON.parse(text);}catch{throw new Error('올바른 JSON 백업 파일이 아니에요.');}
 if(raw?.app!=='dopa-word'||raw.version!==1||!Array.isArray(raw.custom)||raw.custom.length>MAX_WORDS)throw new Error('도파드릴 영단어판의 백업 파일을 선택해 주세요.');
 if(raw.custom.some(w=>validateWord(w).error))throw new Error('백업에 올바르지 않은 단어가 있어요. 기존 기록은 변경하지 않았어요.');return sanitizeState(raw);
}
