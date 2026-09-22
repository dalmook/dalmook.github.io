import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {amount,pour,solve,solved} from '../lib/game/engine.ts';
const levels=JSON.parse(readFileSync(new URL('../lib/game/levels.json',import.meta.url),'utf8'));
assert.equal(levels.length,30);
for(const [i,b] of levels.entries()){
 const colors=b.flat();for(const c of new Set(colors))assert.equal(colors.filter(v=>v===c).length,4);
 const original=JSON.stringify(b),solution=solve(b);assert.ok(solution,`Level ${i+1}`);
 let current=b;for(const [from,to] of solution){const next=pour(current,from,to);assert.ok(next);assert.equal(next.flat().length,colors.length);assert.ok(next.every(t=>t.length<=4));current=next;}assert.ok(solved(current));assert.equal(JSON.stringify(b),original);
}
assert.equal(amount([[0],[1]],0,1),0);assert.equal(pour([[0],[]],0,0),null);
assert.equal(pour([[0],[0,0,0,0]],0,1),null);
assert.deepEqual(pour([[1,0,0],[0,0,0]],0,1),[[1,0],[0,0,0,0]]);
console.log('PASS: all 30 level solutions, conservation, capacity, illegal moves, input immutability');
