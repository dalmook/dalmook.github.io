export type Board = number[][];
export type Move = [number, number];
export const CAPACITY = 4;
export const colors = [
 {name:'딸기',hex:'#f17bab',light:'#ffb8d5',symbol:'♥'},
 {name:'바다',hex:'#55bdea',light:'#b4eeff',symbol:'◆'},
 {name:'햇살',hex:'#f6c74e',light:'#fff1a9',symbol:'★'},
 {name:'포도',hex:'#a383eb',light:'#e0ccff',symbol:'●'},
 {name:'풀잎',hex:'#62cca0',light:'#bef9dc',symbol:'✿'},
 {name:'귤빛',hex:'#ff9954',light:'#ffdab2',symbol:'▲'},
 {name:'산호',hex:'#f05766',light:'#ffa5af',symbol:'✚'},
 {name:'민트',hex:'#33d8cb',light:'#b0fff4',symbol:'■'},
];
export function topRun(t:number[]) {if(!t.length)return 0;let n=1;while(n<t.length&&t[t.length-1-n]===t[t.length-1])n++;return n;}
export function complete(t:number[]) {return t.length===4&&t.every(c=>c===t[0]);}
export function solved(b:Board) {return b.every(t=>!t.length||complete(t));}
export function amount(b:Board,from:number,to:number) {const a=b[from],d=b[to];if(from===to||!a||!d||!a.length||d.length===4||(d.length&&d[d.length-1]!==a[a.length-1]))return 0;return Math.min(topRun(a),4-d.length);}
export function pour(b:Board,from:number,to:number):Board|null {const n=amount(b,from,to);if(!n)return null;const next=b.map(t=>t.slice());next[to].push(...next[from].splice(-n));return next;}
export function legalMoves(b:Board):Move[] {const out:Move[]=[];for(let i=0;i<b.length;i++)for(let j=0;j<b.length;j++)if(amount(b,i,j))out.push([i,j]);return out;}
export function solve(board:Board,limit=65000):Move[]|null {
 const seen=new Set<string>();let count=0;
 function dfs(b:Board,depth:number):Move[]|null {
  if(solved(b))return [];if(depth>65||count++>limit)return null;
  const key=b.map(t=>t.join('')).sort().join('|');if(seen.has(key))return null;seen.add(key);
  const moves=legalMoves(b).filter(([i,j])=>!complete(b[i])&&!(b[j].length===0&&topRun(b[i])===b[i].length));
  moves.sort((a,z)=>(b[z[1]].length?10:0)+amount(b,...z)-(b[a[1]].length?10:0)-amount(b,...a));
  const emptyUsed=new Set<number>();
  for(const m of moves){if(!b[m[1]].length){if(emptyUsed.has(m[0]))continue;emptyUsed.add(m[0]);}const tail=dfs(pour(b,...m)!,depth+1);if(tail)return [m,...tail];}return null;
 }
 return dfs(board,0);
}
export function rng(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function makeLevel(level:number):Board {
 if(level===1)return [[0,0,1,1],[1,1,0,0],[2,2,2,2],[],[]];
 const n=level<6?3:level<16?4:5, random=rng(level*9173);
 for(let attempt=0;attempt<80;attempt++){
  const arr=Array.from({length:n*4},(_,i)=>Math.floor(i/4));for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  const b=Array.from({length:n},(_,i)=>arr.slice(i*4,i*4+4));b.push([],[]);if(!solved(b)&&solve(b,12000))return b;
 }
 return [[0,0,1,1],[1,1,0,0],[2,2,2,2],[],[]];
}
export const worlds=[{name:'반짝이는 숲',subtitle:'첫 번째 마법 여행',icon:'🌿',color:'#3a946e'},{name:'달빛 호수',subtitle:'물결 속 비밀을 찾아서',icon:'🌙',color:'#747bc9'},{name:'구름 위 성',subtitle:'하늘 위 마법 연구소',icon:'☁️',color:'#c48b43'}];
export const friends=[{name:'마법사 모모',emoji:'🐱',need:0,desc:'언제나 네 편인 첫 번째 친구'},{name:'숲속 토토',emoji:'🐰',need:5,desc:'다섯 번의 마법을 함께해요'},{name:'별빛 루루',emoji:'🦉',need:10,desc:'별을 읽는 작은 지혜의 친구'},{name:'꼬마 용 보보',emoji:'🐲',need:20,desc:'뜨거운 용기를 선물해요'},{name:'무지개 유니',emoji:'🦄',need:30,desc:'서른 번의 도전을 함께한 친구'}];
