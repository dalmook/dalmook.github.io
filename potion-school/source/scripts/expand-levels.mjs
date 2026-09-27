import {readFileSync,writeFileSync} from 'node:fs';
import {rng,solve,solved} from '../lib/game/engine.ts';
const levels=JSON.parse(readFileSync(new URL('../lib/game/levels.json',import.meta.url))).slice(0,30);
const signatures=new Set(levels.map(b=>b.map(t=>t.join('')).sort().join('|')));
const meta=levels.map(b=>({colors:new Set(b.flat()).size,par:solve(b).length}));
for(let level=31;level<=300;level++){
 const n=level<51?4:level<101?5:level<151?6:level<221?7:8,random=rng(level*29473);let found=false;
 for(let attempt=0;attempt<400&&!found;attempt++){
  const a=Array.from({length:n*4},(_,i)=>Math.floor(i/4));for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  const b=Array.from({length:n},(_,i)=>a.slice(i*4,i*4+4));b.push([],[]);
  const key=b.map(t=>t.join('')).sort().join('|');if(signatures.has(key)||solved(b))continue;
  const solution=solve(b,30000);if(!solution||solution.length<n+3)continue;
  levels.push(b);meta.push({colors:n,par:solution.length});signatures.add(key);found=true;
 }
 if(!found)throw Error('Could not generate '+level);
}
writeFileSync(new URL('../lib/game/levels.json',import.meta.url),JSON.stringify(levels));writeFileSync(new URL('../lib/game/level-meta.json',import.meta.url),JSON.stringify(meta));console.log('Generated',levels.length,'verified puzzles,',signatures.size,'distinct layouts');
