/* Tori Math Adventure — original arithmetic and save-state engine. No runtime dependencies. */
export const WORLDS = [
 {id:0,name:'새싹 숲',sub:'처음 만나는 모험',grade:'1학년',color:'#37a887',light:'#e8f6ee',symbol:'leaf',boss:'이끼 왕 슬라임'},
 {id:1,name:'카라멜 사막',sub:'반짝이는 구구단',grade:'2학년',color:'#cf8430',light:'#fff3dc',symbol:'sun',boss:'모래 쿠키 골렘'},
 {id:2,name:'구름 항구',sub:'숫자를 타고 높이',grade:'3학년',color:'#508fcd',light:'#e9f3ff',symbol:'cloud',boss:'뭉게구름 대장'},
 {id:3,name:'별빛 도서관',sub:'분수의 비밀을 찾아',grade:'4학년',color:'#8a6ac8',light:'#f1ecff',symbol:'book',boss:'졸린 마법책'},
 {id:4,name:'달빛 설원',sub:'생각이 자라는 곳',grade:'5학년',color:'#468fa5',light:'#e8f8fb',symbol:'snow',boss:'눈송이 수호자'},
 {id:5,name:'오로라 성',sub:'마지막 별의 조각',grade:'6학년',color:'#cb6791',light:'#fff0f6',symbol:'crown',boss:'오로라 드래곤'}
];
const defs = [
 ['add10','10까지 덧셈','3 + 4',1],['sub10','10까지 뺄셈','8 − 3',1],['add20','20까지 덧셈','8 + 7',1],['sub20','20까지 뺄셈','15 − 8',1],
 ['add100','두 자리 덧셈','28 + 35',2],['sub100','두 자리 뺄셈','63 − 28',2],['mul25','2~5단 구구단','4 × 7',2],['mul69','6~9단 구구단','8 × 6',2],
 ['add1000','세 자리 덧셈','235 + 148',3],['sub1000','세 자리 뺄셈','423 − 156',3],['mul2','두 자리 수의 곱셈','24 × 3',3],['div1','나머지 없는 나눗셈','42 ÷ 6',3],
 ['mul3','세 자리 수의 곱셈','123 × 4',4],['div2','큰 수의 나눗셈','168 ÷ 7',4],['fraction1','같은 분모의 덧셈','2/7 + 3/7',4],['decimal1','소수의 덧셈·뺄셈','2.4 + 1.3',4],
 ['decimal2','소수와 자연수의 곱셈','1.2 × 3',5],['gcd','최대공약수','12와 18',5],['fraction2','다른 분모의 덧셈','1/2 + 1/3',5],['fraction3','분수와 자연수의 곱셈','2/5 × 3',5],
 ['decimal3','소수의 나눗셈','3.6 ÷ 0.4',6],['fraction4','분수의 나눗셈','2/3 ÷ 1/4',6],['percent','백분율 구하기','80의 25%',6],['ratio','비례식 완성하기','2 : 3 = 4 : □',6]
];
export const SKILLS = defs.map(([id,name,example,grade])=>({id,name,example,grade}));
export const gcd=(a,b)=>{ a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1; };
export function fraction(n,d) { const g=gcd(n,d);return d/g===1?String(n/g):`${n/g}/${d/g}`; }
export function seeded(seed=1){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function parseAnswer(value){
 const s=String(value).trim().replace(/\s+/g,'');
 if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:\/-?(?:\d+(?:\.\d+)?|\.\d+))?$/.test(s))return NaN;
 const parts=s.split('/').map(Number);if(parts.length===2&&parts[1]===0)return NaN;
 const n=parts.length===2?parts[0]/parts[1]:parts[0];return Number.isFinite(n)?n:NaN;
}
export function isCorrect(q,value){const n=parseAnswer(value);return Number.isFinite(n)&&Math.abs(n-q.value)<1e-8;}
export function question(skillId,rng=Math.random){
 const skill=SKILLS.find(s=>s.id===skillId)||SKILLS[0];
 const r=(a,b)=>Math.floor(rng()*(b-a+1))+a;
 let a,b,c,d,text,answer,hint,explanation,kind='number';
 switch(skill.id){
  case 'add10':a=r(1,8);b=r(1,10-a);break;
  case 'add20':a=r(5,12);b=r(1,20-a);break;
  case 'add100':a=r(10,65);b=r(10,99-a);break;
  case 'add1000':a=r(100,649);b=r(100,999-a);break;
  case 'sub10':a=r(3,10);b=r(1,a);break;
  case 'sub20':a=r(10,20);b=r(1,a);break;
  case 'sub100':a=r(25,99);b=r(10,a);break;
  case 'sub1000':a=r(200,999);b=r(100,a);break;
  case 'mul25':a=r(2,5);b=r(1,9);break;
  case 'mul69':a=r(6,9);b=r(1,9);break;
  case 'mul2':a=r(12,49);b=r(2,9);break;
  case 'mul3':a=r(101,299);b=r(2,5);break;
  case 'div1':b=r(2,9);c=r(2,9);a=b*c;break;
  case 'div2':b=r(2,9);c=r(11,35);a=b*c;break;
  case 'fraction1':d=r(4,12);a=r(1,d-2);b=r(1,d-a);text=`${a}/${d} + ${b}/${d}`;answer=fraction(a+b,d);kind='fraction';hint=`분모 ${d}은 그대로 두고, 위에 있는 분자 ${a}과 ${b}을 더해 봐.`;explanation=`${a}/${d} + ${b}/${d} = ${a+b}/${d}${answer!==`${a+b}/${d}`?` = ${answer}`:''}`;break;
  case 'decimal1':a=r(1,79);b=r(1,49);c=r(0,1);if(!c&&b>a)[a,b]=[b,a];text=`${a/10} ${c?'+':'−'} ${b/10}`;answer=String((c?a+b:a-b)/10);hint='소수점끼리 나란히 놓고 계산해 봐. 0.1이 몇 개인지 세어도 좋아.';break;
  case 'decimal2':a=r(2,29);b=r(2,5);text=`${a/10} × ${b}`;answer=String(a*b/10);hint=`먼저 ${a} × ${b}을 계산한 다음 10으로 나누어 봐.`;break;
  case 'gcd':c=r(2,8);a=c*r(2,5);b=c*r(3,7);text=`${a}와 ${b}의 최대공약수`;answer=String(gcd(a,b));hint='두 수를 모두 나누어떨어지게 하는 수 중 가장 큰 수를 찾아 봐.';explanation=`${a}과 ${b}의 공약수: ${Array.from({length:Math.min(a,b)},(_,i)=>i+1).filter(n=>a%n===0&&b%n===0).join(', ')}. 가장 큰 수는 ${answer}!`;break;
  case 'fraction2':b=r(2,6);d=r(2,8);if(b===d)d=d%7+2;a=r(1,b-1);c=r(1,d-1);text=`${a}/${b} + ${c}/${d}`;answer=fraction(a*d+c*b,b*d);kind='fraction';hint=`분모를 ${b*d}으로 같게 만들어 봐. ${a*d}/${b*d} + ${c*b}/${b*d}이야.`;break;
  case 'fraction3':b=r(3,9);a=r(1,b-1);c=r(2,5);text=`${a}/${b} × ${c}`;answer=fraction(a*c,b);kind='fraction';hint=`분자 ${a}에 ${c}을 곱하고, 분모 ${b}은 그대로 두어 봐.`;break;
  case 'decimal3':b=r(2,9);c=r(2,12);a=b*c;text=`${a/10} ÷ ${b/10}`;answer=String(c);hint=`두 수에 모두 10을 곱하면 ${a} ÷ ${b}이야. 몫은 같아.`;break;
  case 'fraction4':b=r(2,8);a=r(1,b-1);d=r(2,9);c=r(1,d-1);text=`${a}/${b} ÷ ${c}/${d}`;answer=fraction(a*d,b*c);kind='fraction';hint=`뒤 분수를 뒤집어 곱해 봐. ${a}/${b} × ${d}/${c}으로 바꿀 수 있어.`;break;
  case 'percent':a=r(1,10)*20;b=[10,20,25,50,75][r(0,4)];text=`${a}의 ${b}%는?`;answer=String(a*b/100);hint=`${b}%는 100개 중 ${b}개라는 뜻이야. ${a} × ${b} ÷ 100을 계산해 봐.`;break;
  case 'ratio':a=r(1,7);b=r(2,9);c=r(2,6);text=`${a} : ${b} = ${a*c} : □`;answer=String(b*c);hint=`왼쪽 수가 ${a}에서 ${a*c}으로 ${c}배가 되었어. 오른쪽 수도 똑같이 ${c}배!`;break;
 }
 if(!text){const op=skill.id.startsWith('add')?'+':skill.id.startsWith('sub')?'−':skill.id.startsWith('mul')?'×':'÷';text=`${a} ${op} ${b}`;
 answer=String(op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:a/b);
 hint=op==='+'?`${a}에서 ${b}만큼 더 가 보자.${a+b>=10?' 10을 먼저 만들면 쉬워!':''}`:op==='−'?`${a}개에서 ${b}개를 빼면 몇 개가 남을까?`:op==='×'?`${a}을 ${b}번 더하는 것과 같아. ${a}씩 뛰어 세어 봐.`:`${b}에 어떤 수를 곱하면 ${a}이 될까?`;
 }
 if(!explanation)explanation=`${text}${text.endsWith('?')?' ': ' = '}${answer}`;
 return {skill:skill.id,text,answer,value:parseAnswer(answer),hint,explanation,kind,key:`${skill.id}:${text}`};
}
export function stageSkills(world,stage){const all=SKILLS.filter(s=>s.grade===world+1);return stage<4?[all[stage].id]:all.slice(0,stage===7?4:stage-2).map(s=>s.id);}
export function deck(world,stage,length=10,rng=Math.random,ids=null){const pool=ids||stageSkills(world,stage);const out=[],seen=new Set();let last='';for(let i=0;i<length;i++){let q;for(let n=0;n<60;n++){q=question(pool[Math.floor(rng()*pool.length)],rng);if(!seen.has(q.key)&&q.key!==last)break;}out.push(q);seen.add(q.key);last=q.key;}return out;}
export const SAVE_KEY='tori-math-adventure:v1';
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function freshSave(){return {version:1,coins:0,xp:0,grade:1,outfit:'mint',owned:['mint'],completed:{},skills:{},wrong:[],runs:[],total:0,correctFirst:0,bestCombo:0,missions:{date:today(),answers:0,runs:0,combo:0,claimed:[]},settings:{music:true,sfx:true,motion:'full',volume:35}};}
export function normalizeSave(raw){
 const p=freshSave();if(!raw||raw.version!==1)return p;
 const bounded=(v,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
 for(const k of ['coins','xp','total','correctFirst','bestCombo'])p[k]=bounded(raw[k]);
 p.correctFirst=Math.min(p.total,p.correctFirst);
 p.grade=Math.max(1,Math.min(6,bounded(raw.grade,6)||1));
 const costumes=['mint','coral','violet','gold','night'];p.owned=Array.isArray(raw.owned)?[...new Set(['mint',...raw.owned.filter(o=>costumes.includes(o))])]:['mint'];p.outfit=p.owned.includes(raw.outfit)?raw.outfit:'mint';
 if(raw.completed&&typeof raw.completed==='object'){for(const [k,v]of Object.entries(raw.completed)){if(/^[0-5]-[0-7]$/.test(k)&&typeof v==='object'&&v)p.completed[k]={stars:Math.max(1,Math.min(3,bounded(v.stars,3))),best:bounded(v.best,100),plays:bounded(v.plays)};}}
 if(raw.skills&&typeof raw.skills==='object')for(const skill of SKILLS){const v=raw.skills[skill.id];if(v&&typeof v==='object')p.skills[skill.id]={answered:bounded(v.answered),first:Math.min(bounded(v.answered),bounded(v.first))};}
 p.wrong=Array.isArray(raw.wrong)?raw.wrong.filter(q=>q&&SKILLS.some(s=>s.id===q.skill)&&typeof q.text==='string'&&q.text.length<120&&typeof q.answer==='string'&&Number.isFinite(q.value)&&isCorrect(q,q.answer)&&typeof q.key==='string'&&typeof q.hint==='string'&&typeof q.explanation==='string').slice(-100):[];
 p.runs=Array.isArray(raw.runs)?raw.runs.filter(r=>r&&typeof r.mode==='string'&&Number.isFinite(r.score)&&typeof r.date==='string').slice(-30).map(r=>({date:r.date.slice(0,10),mode:r.mode.slice(0,20),score:bounded(r.score,100),count:bounded(r.count,10000),world:bounded(r.world,5)})):[];
 const m=raw.missions;if(m&&m.date===today())p.missions={date:today(),answers:bounded(m.answers),runs:bounded(m.runs),combo:bounded(m.combo),claimed:Array.isArray(m.claimed)?m.claimed.filter(x=>[0,1,2].includes(x)):[]};
 if(raw.settings){const s=raw.settings;p.settings={music:s.music!==false,sfx:s.sfx!==false,motion:['full','gentle','off'].includes(s.motion)?s.motion:'full',volume:Number.isFinite(s.volume)?Math.max(0,Math.min(100,s.volume)):35};}
 return p;
}
export function readSave(storage){try{return normalizeSave(JSON.parse(storage.getItem(SAVE_KEY)||'null'));}catch{return freshSave();}}
export function writeSave(storage,p){try{storage.setItem(SAVE_KEY,JSON.stringify(p));return true;}catch{return false;}}
export function ensureDay(p){if(p.missions.date!==today())p.missions=freshSave().missions;}
export function rememberWrong(p,q){if(!p.wrong.some(w=>w.key===q.key))p.wrong.push({...q});p.wrong=p.wrong.slice(-100);}
export function recordAnswer(p,q,first,combo){ensureDay(p);p.total++;if(first)p.correctFirst++;p.xp+=first?12:6;p.bestCombo=Math.max(p.bestCombo,combo);const v=p.skills[q.skill]||{answered:0,first:0};v.answered++;if(first)v.first++;p.skills[q.skill]=v;p.missions.answers++;p.missions.combo=Math.max(p.missions.combo,combo);}
export function finishRun(p,run){
 ensureDay(p);const score=run.count?Math.round(100*run.first/run.count):0;const stars=run.count?(score>=90?3:score>=65?2:1):0;const coins=run.count*3+stars*5;
 p.coins+=coins;if(run.count>0)p.missions.runs++;p.xp+=run.count*3;
 if(run.mode==='adventure'&&run.complete){const key=`${run.world}-${run.stage}`,old=p.completed[key]||{stars:0,best:0,plays:0};p.completed[key]={stars:Math.max(stars,old.stars),best:Math.max(score,old.best),plays:old.plays+1};}
 p.runs.push({date:today(),mode:run.mode,world:run.world,score,count:run.count});p.runs=p.runs.slice(-30);return {score,stars,coins};
}
export const MISSIONS=[{name:'정답 10개 모으기',goal:10,key:'answers',reward:20},{name:'5콤보 달성하기',goal:5,key:'combo',reward:25},{name:'모험 한 판 완료하기',goal:1,key:'runs',reward:30}];
export function claimMission(p,index){ensureDay(p);const m=MISSIONS[index];if(!m||p.missions.claimed.includes(index)||p.missions[m.key]<m.goal)return false;p.coins+=m.reward;p.missions.claimed.push(index);return true;}
export const OUTFITS=[{id:'mint',name:'새싹 탐험가',color:'#36b8a3',cost:0,desc:'처음부터 함께하는 초록 스카프'},{id:'coral',name:'당근 기사',color:'#f58054',cost:120,desc:'주황 망토와 당근 검의 조합'},{id:'violet',name:'별빛 마법사',color:'#9c7aeb',cost:220,desc:'반짝이는 별빛 마법 모자'},{id:'gold',name:'태양 수호자',color:'#eabf48',cost:320,desc:'작은 왕관을 쓴 당당한 토리'},{id:'night',name:'오로라 기사',color:'#5475b9',cost:450,desc:'밤하늘을 두른 푸른 스카프'}];
export function buyOutfit(p,id){const o=OUTFITS.find(o=>o.id===id);if(!o)return false;if(!p.owned.includes(id)){if(p.coins<o.cost)return false;p.coins-=o.cost;p.owned.push(id);}p.outfit=id;return true;}
