import {startClock,onFrame,wait,tween,clamp,centerOf,easeOutBack,easeOutCubic} from './vendor/core.js';
import {AudioEngine as OriginalAudio} from './vendor/audio.js';
import {createSessionAudio} from '../dopa-runtime/audio-runtime.mjs?v=all-smooth-1';
import {RenderBudget,PERFORMANCE_VERSION} from '../dopa-runtime/render-budget.mjs?v=all-smooth-1';
const AudioEngine=createSessionAudio(OriginalAudio);
import {Dopakichi,dopakichiSVG} from './vendor/dopakichi.js';
import {FX} from './vendor/fx.js';
import {Backdrop} from './vendor/bg.js';
import {BANK,SOURCES,BANK_INFO} from './bank.mjs';
import {SAVE_KEY,RANKS,CATEGORIES,CATEGORY,categoryName,quizRank,reviewForRank,loadState,saveState,sanitizeState,rankProgress,rankOf,buildDeck,applyAnswer,sessionScore,dayKey,escapeHTML as esc,hash} from './engine.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const IDS=new Set(BANK.map(q=>q.id)), BY_ID=new Map(BANK.map(q=>[q.id,q]));
let storage;try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage disabled');}};}
let state=loadState(storage,IDS),savedWarning=false;
// Explicit share link selects Kids; ordinary reloads keep the user's saved selection.
if(new URLSearchParams(location.search).get('level')==='kids')state.settings.rank=1;
try{if(!storage.getItem(SAVE_KEY)&&matchMedia('(prefers-reduced-motion: reduce)').matches)state.settings.motion=0;}catch{}
const audio=new AudioEngine(),fx=new FX($('#fx'),300),fxBack=new FX($('#fx-back'),380),bg=new Backdrop($('#bg'),$('#rays-fallback'));
const budget=new RenderBudget({fx,back:fxBack,bg},{game:'dopa-ox'});
let staticDirty=true;
const hero=new Dopakichi($('#actors-back'),{scale:.85,front:$('#actors-front')});
const friends=['blue','yellow','mint','violet','pink','blue'].map(p=>new Dopakichi($('#actors-back'),{palette:p,scale:.32,front:$('#actors-front')}));
const S={screen:'title',phase:'idle',run:0,mode:'basic',deck:[],qi:0,results:[],combo:0,peak:0,elapsed:0,E:.06,visualE:.02,level:0,score:0,earned:0,ended:false,shake:0,flash:0,idleAt:0,rainAt:0,stepAt:0,question:null,libraryLimit:30,revision:'ox-1.1.0-kids'};
window.__ox={S,audio,hero,friends,fx,fxBack,bg,budget,performanceVersion:PERFORMANCE_VERSION,bank:BANK,sources:SOURCES,get state(){return state;}};
function persist(){if(!saveState(storage,state)&&!savedWarning){savedWarning=true;toast('이 브라우저에서 저장할 수 없어요. 설정에서 기록 파일을 내보내 주세요.');}}
let toastTimer;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3600);}
function sourceFor(q){return SOURCES[q.source];}
function sourceURL(q){const value=sourceFor(q)?.url||'./SOURCES.md';return /^(https:\/\/|\.\/)/.test(value)?value:'./SOURCES.md';}
function fmt(ms){const n=Math.max(0,Math.floor(ms/1000));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
function modalOpen(){return !!document.querySelector('dialog[open]');}
function setScreen(name){
 staticDirty=true;S.screen=name;$$('.screen').forEach(el=>el.classList.toggle('is-active',el.id===`screen-${name}`));
 hero.begin();hero.rot=0;hero.lift=0;hero.stretchX=hero.stretchY=1;hero.shake=0;hero.hands.forEach(h=>{if(h.cancel)h.cancel();h.raise=0;});hero.resetFace();
 requestAnimationFrame(layoutActors);
}
function layoutActors(){
 staticDirty=true;
 let r,scale=.8,y;if(S.screen==='title'){r=$('#title-stage').getBoundingClientRect();scale=.85;y=r.bottom-6;}
 else if(S.screen==='play'){r=$('#stage').getBoundingClientRect();scale=clamp((r.height-10)/165,.38,.85);y=r.bottom-16;}
 else if(S.screen==='result'){r=$('#screen-result .result-card').getBoundingClientRect();scale=.7;y=r.top+4;}
 else if(S.screen==='collect'){r=$('#co-preview').getBoundingClientRect();scale=.72;y=r.bottom-4;}
 else{hero.visible=false;friends.forEach(m=>m.visible=false);return;}
 hero.visible=r.bottom>0&&r.top<innerHeight;hero.S=scale;hero.place(r.left+r.width/2,y);
 const n=(S.screen==='play'||S.screen==='result')?Math.min(budget.dancers,Math.floor(S.E*7)):0;
 friends.forEach((m,i)=>{m.visible=i<n;const side=i%2?-1:1;const row=Math.floor(i/2);m.S=innerWidth>800?.35+row*.04:.24;const spread=innerWidth>800?185+row*75:105+row*21;m.place(clamp(hero.x+side*spread,22,innerWidth-22),hero.y+row*13);});
 bg.state.cx=hero.x;bg.state.cy=hero.y-75*hero.S;
}
function look(){
 staticDirty=true;
 const o=state.settings;audio.setVolume(o.volume/100);audio.setMuted(o.muted);audio.setSong(o.song);hero.setPalette(o.palette);hero.setCostume(o.costume);bg.setTheme(o.theme);
 document.body.classList.toggle('reduced',o.motion===0);fx.reduced=fxBack.reduced=o.motion===0;fx.motion=fxBack.motion=o.motion;
 $('#mute').textContent=o.muted?'♩':'♪';$('#mute').setAttribute('aria-pressed',String(o.muted));$('#mute').setAttribute('aria-label',o.muted?'소리 켜기':'소리 끄기');
}
function setEnergy(E){S.E=clamp(E,.06,1.1);const L=Math.min(10,Math.floor(S.E*10));S.level=L;for(let i=0;i<=10;i++)document.body.classList.toggle(`lv${i}`,i<=L);document.body.style.setProperty('--E',S.E);audio.setLevel(L,112+Math.floor(S.E*30));audio.key=L>=8?2:0;const labels=['지식 에너지 충전 중','몸풀기 완료!','점점 신나는데?','상식 파티!','도파 폭발!','지식 대축제!'];$('#fever-label').textContent=labels[Math.min(5,Math.floor(L/2))];layoutActors();}
function cutin(text){if(state.settings.motion===0)return;const el=document.createElement('div');el.className='ox-cutin';el.textContent=text;$('#cutins').append(el);audio.cutin();setTimeout(()=>el.remove(),1000);}
function renderHome(){
 const o=state.settings,r=RANKS[o.rank-1];document.body.classList.toggle('kids-mode',o.rank===1);$('#ranks').innerHTML=RANKS.map(x=>`<button type="button" data-rank="${x.id}" aria-pressed="${x.id===o.rank}">${x.name}<small>${x.label}</small></button>`).join('');
 const cats=o.categories.length?o.categories.map(id=>categoryName(id,o.rank)).join(' · '):'모든 분야';$('#category-label').textContent=cats;$('#level-sub').textContent=`${r.name} · ${o.categories.length===1?cats:o.categories.length?`${o.categories.length}개 분야`:'모든 분야'} · ${o.count}문제`;
 $('#review-count').textContent=reviewForRank(BANK,state.review,o.rank).length;
 const rp=rankProgress(state.xp);$('#earned-rank').textContent=rp.rank.name;$('#xp-summary').textContent=rp.next?`${state.xp.toLocaleString()} XP · ${rp.next.name}까지 ${(rp.next.xp-state.xp).toLocaleString()} XP`:`${state.xp.toLocaleString()} XP · 초인 등급 달성!`;$('#xp-bar').value=rp.value*100;
 $('#lifetime').textContent=`누적 ${state.answered.toLocaleString()}문제 · 정답 ${state.correct.toLocaleString()}개 · 최고 ${state.bestCombo}콤보`;
 const d=state.days[dayKey()]||{answered:0,correct:0,categories:[]};const missions=[[d.answered,10,'문제 10개 풀기'],[d.correct,7,'정답 7개 맞히기'],[d.categories.length,3,'3개 분야 탐험하기']];$('#quest-list').innerHTML=missions.map(([n,max,t])=>`<li class="${n>=max?'done':''}"><span>${n>=max?'✓':'○'} ${t}</span><b>${Math.min(max,n)}/${max}</b></li>`).join('');$('#quest-reward').textContent=d.claimed?'80 XP 받았어요!':'모두 완료하면 80 XP';
 $('#bank-count').textContent=`${CATEGORIES.length}개 분야 · ${BANK.length.toLocaleString()}문항 · 해설과 근거 포함`;
}
function showHome(){S.run++;S.phase='idle';S.ended=true;audio.setReach(false);audio.stopMusic();setEnergy(.06);setScreen('title');renderHome();}
function openDialog(id){$('#'+id).showModal();audio.setReach(false);}
function renderCategories(){const sel=state.settings.categories;$('#category-list').innerHTML=`<button type="button" data-category="all" aria-pressed="${!sel.length}">🎲 모든 분야<small>골고루 섞어서 출제</small></button>`+CATEGORIES.map(c=>`<button type="button" data-category="${c.id}" aria-pressed="${sel.includes(c.id)}">${c.icon} ${categoryName(c.id,state.settings.rank)}<small>${BANK.filter(q=>q.category===c.id&&(state.settings.rank!==1||q.level===1)).length}문항</small></button>`).join('');}
function startGame(mode='basic',reviewOverride=null){
 audio.unlock();const opt=state.settings;const seed=mode==='daily'?hash(`dopa-ox:${dayKey()}${opt.rank===1?':kids':''}`):Math.floor(Math.random()*0x7fffffff);
 const deck=buildDeck(BANK,{rank:quizRank(mode,opt.rank),categories:mode==='daily'?[]:opt.categories,count:mode==='challenge'?1000:mode==='daily'?10:opt.count,seen:mode==='daily'?[]:state.seen,reviewIds:mode==='review'?reviewForRank(BANK,reviewOverride||state.review,opt.rank):null,seed});
 if(!deck.length){toast(mode==='review'?'복습할 문제가 없어요. 새 퀴즈에 도전해 봐요!':'이 분야·난이도의 문제가 아직 없어요. 다른 난이도를 선택해 주세요.');return;}
 S.run++;Object.assign(S,{mode,deck,qi:0,results:[],combo:0,peak:0,elapsed:0,score:0,earned:0,ended:false,phase:'enter',question:null});
 $('#clock-label').textContent=mode==='challenge'?'남은 풀이 시간':'풀이 시간';$('#ok-total').textContent=mode==='challenge'?'':`/${deck.length}`;$('#pips').innerHTML=mode==='challenge'?'<span class="ox-small">⚡ 60초</span>':deck.map(()=>'<span class="pip"></span>').join('');
 look();setEnergy(.06);audio.startMusic();audio.jingle();setScreen('play');renderQuestion();
 if(mode!=='challenge'&&deck.length<opt.count&&mode!=='daily')toast(`중복 없이 ${deck.length}문제로 진행해요.`);
}
function updateHUD(){const n=S.results.filter(r=>r.correct).length;$('#ok').textContent=n;$('#ng').textContent=S.results.length-n;$('#combo').textContent=S.combo;$('#dopa').textContent=Math.round(S.score).toLocaleString();$('#clock').textContent=fmt(S.mode==='challenge'?60000-S.elapsed:S.elapsed);$$('#pips .pip').forEach((p,i)=>{p.classList.toggle('now',i===S.qi);p.classList.toggle('good',S.results[i]?.correct===true);p.classList.toggle('bad',S.results[i]?.correct===false);});}
async function renderQuestion(){
 if(S.qi>=S.deck.length||(S.mode==='challenge'&&S.elapsed>=60000)){finishGame();return;}
 const run=S.run;S.phase='enter';S.question=S.deck[S.qi];const q=S.question;
 $('#screen-play').classList.remove('answered');$('#explanation').hidden=true;$('#next-question').hidden=true;$('#play-help').hidden=false;$('#answer-cell').className='ox-answer-cell';$('#answer-cell').textContent='?';$$('#pad button').forEach(b=>{b.disabled=true;b.classList.remove('chosen');});
 $('#qtitle').textContent=`${CATEGORY[q.category].icon} ${categoryName(q.category,q.level)}`;$('#qno').textContent=`${S.qi+1}${S.mode==='challenge'?'번 문제':` / ${S.deck.length}`}`;$('#question-rank').textContent=RANKS[q.level-1].name;$('#question-text').textContent=q.statement;$('#screen-play').scrollTop=0;updateHUD();
 if(S.qi>0)setEnergy(.08+Math.min(1,S.qi/(S.mode==='challenge'?16:Math.max(1,S.deck.length-1)))*1.02);
 requestAnimationFrame(layoutActors);const card=$('#card');
 if(state.settings.motion){const high=S.E>.45;await tween(high?320:220,k=>{card.style.transform=high?`translateY(${(1-k)*-75}px) rotate(${(1-k)*-6}deg) scale(${.9+.1*k})`:`translateX(${(1-k)*45}px) rotate(${(1-k)*3}deg)`;card.style.opacity=String(k);},easeOutCubic);}
 card.style.transform='';card.style.opacity='1';if(run!==S.run||S.screen!=='play')return;
 S.phase='question';$$('#pad button').forEach(b=>b.disabled=false);layoutActors();
 if(S.qi===S.deck.length-1&&S.qi>0){audio.setReach(true);cutin('마지막 문제!');}else audio.setReach(false);
}
function answer(value,button){
 if(S.screen!=='play'||S.phase!=='question'||modalOpen()||document.hidden)return;
 S.phase='carry';const q=S.question,run=S.run,qi=S.qi;$$('#pad button').forEach(b=>b.disabled=true);button.classList.add('chosen','press');setTimeout(()=>button.classList.remove('press'),150);audio.unlock();audio.keyTap(S.combo);
 const correct=value===q.answer;S.combo=correct?S.combo+1:0;S.peak=Math.max(S.peak,S.combo);const result=applyAnswer(state,q,value,{combo:S.combo,reviewMode:S.mode==='review'});S.earned+=result.gained+result.bonus;
 S.results.push({id:q.id,answer:value,correct,combo:S.combo});S.score+=correct?100+q.level*25+Math.min(20,S.combo)*20:10;persist();
 const from=centerOf(button),to=centerOf($('#answer-cell'));const reveal=()=>{if(run!==S.run||qi!==S.qi||S.screen!=='play')return;showAnswer(result,from);};
 if(state.settings.motion===0)reveal();else hero.carry(from,to,value?'O':'X',{E:Math.min(S.E,1),onGrab:()=>audio.grab(),onPlace:()=>{audio.place();reveal();}});
}
function showAnswer(result,from){
 const q=S.question;S.phase='answered';audio.setReach(false);$('#screen-play').classList.add('answered');$('#answer-cell').textContent=S.results.at(-1).answer?'O':'X';$('#answer-cell').classList.add(result.correct?'ok':'bad');$('#verdict').textContent=result.correct?`정답! ${q.answer?'O':'X'}예요 🎉`:`아하! 정답은 ${q.answer?'O':'X'}예요`;$('#verdict').style.color=result.correct?'#17784b':'#bb3053';$('#explanation-text').textContent=q.explanation;$('#source-link').textContent=`${sourceFor(q).name} ↗`;$('#source-link').href=sourceURL(q);$('#bookmark-question').textContent=state.bookmarks.includes(q.id)?'★ 다시 볼 문제':'☆ 다시 볼 문제';$('#explanation').hidden=false;$('#next-question').hidden=false;$('#next-question').textContent=S.qi+1>=S.deck.length?'결과 보기 →':'다음 문제 →';updateHUD();layoutActors();
 const E=Math.min(1,S.E);if(result.correct){audio.correct(S.combo,E);if(S.combo>0&&S.combo%5===0)audio.clear(E*.8);if(state.settings.motion){hero.celebrate(E,{big:S.combo%3===0||E>.75,audio});const c=centerOf($('#card'));fx.burst(c.x,c.y,{count:25+Math.round(E*70),speed:400+E*300,kinds:E>.6?['star','confetti','coin','mini']:['star','confetti'],up:120});fx.ring(c.x,c.y,{radius:90+E*60});if(S.combo>0&&S.combo%5===0){cutin(`${S.combo}콤보!`);fxBack.fireworks(innerWidth,innerHeight,3);}if(E>.7)fxBack.streamers(innerWidth,innerHeight,4);S.shake=Math.max(S.shake,E*4);}}else{audio.wrong(E);if(state.settings.motion)hero.hurt(E,from,{audio});else hero.setFace('wide','o');}
 if(result.bonus)toast('오늘의 미션 모두 완료! 80 XP를 받았어요.');
}
function next(){if(S.phase!=='answered'||S.screen!=='play'||modalOpen())return;S.phase='enter';S.qi++;renderQuestion();}
function finishGame(){
 if(S.ended)return;S.ended=true;S.phase='result';S.run++;audio.setReach(false);const score=sessionScore(S.results,S.mode),correct=S.results.filter(r=>r.correct).length;
 state.sessions++;if(S.mode==='challenge')state.bestChallenge=Math.max(state.bestChallenge,score);state.history.push({day:dayKey(),mode:S.mode,total:S.results.length,correct,score,rank:state.settings.rank});state.history=state.history.slice(-80);persist();
 $('#result-title').textContent=({basic:'OX 퀴즈 완료!',review:'복습 완료!',daily:'오늘의 퀴즈 완료!',challenge:'60초 도전 완료!'})[S.mode];$('#r-score').textContent=score.toLocaleString();$('#r-ok').textContent=`${correct} / ${S.results.length}문제`;$('#r-rate').textContent=`${S.results.length?Math.round(correct/S.results.length*100):0}%`;$('#r-combo').textContent=`${S.peak}콤보`;$('#r-time').textContent=fmt(S.elapsed);$('#r-xp').textContent=`+${S.earned} XP · 현재 ${rankOf(state.xp).name}`;$('#result-cheer').textContent=correct===S.results.length&&correct>0?'모두 정답! 오늘의 상식왕!':correct>0?'새로운 지식을 모았어요!':'첫걸음도 멋진 도전이에요. 해설을 보고 다시 해 봐요!';
 $('#result-review').innerHTML=S.results.filter(r=>!r.correct).map(r=>{const q=BY_ID.get(r.id);return `<details><summary>${esc(q.statement)}</summary><p><b>정답 ${q.answer?'O':'X'}</b> · ${esc(q.explanation)}</p><a href="${esc(sourceURL(q))}" target="_blank" rel="noopener noreferrer">근거 확인 ↗</a></details>`;}).join('');$('#result-wrong').hidden=!S.results.some(r=>!r.correct);setEnergy(Math.max(S.E,.45));setScreen('result');audio.finale();if(state.settings.motion){hero.celebrate(Math.min(1,S.E),{big:true,audio});fxBack.fireworks(innerWidth,innerHeight,4);fxBack.rain(innerWidth,90,{kinds:['confetti','star']});}
}
function bookmark(id){if(state.bookmarks.includes(id))state.bookmarks=state.bookmarks.filter(x=>x!==id);else state.bookmarks.push(id);persist();if(S.screen==='play')$('#bookmark-question').textContent=state.bookmarks.includes(id)?'★ 다시 볼 문제':'☆ 다시 볼 문제';else renderLibrary();}
function openLibrary(){S.libraryLimit=30;$('#library-category').innerHTML='<option value="">모든 분야</option>'+CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');$('#library-rank').innerHTML='<option value="">모든 난이도</option>'+RANKS.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');if(state.settings.rank===1)$('#library-rank').value='1';setScreen('library');renderLibrary();}
function renderLibrary(){const term=$('#library-search').value.trim().toLowerCase(),category=$('#library-category').value,rank=Number($('#library-rank').value),marked=$('#library-bookmarks').checked;const matches=BANK.filter(q=>(!category||q.category===category)&&(!rank||q.level===rank)&&(!marked||state.bookmarks.includes(q.id))&&(!term||(q.statement+' '+q.explanation).toLowerCase().includes(term)));$('#library-count').textContent=`${matches.length.toLocaleString()}문항 · ${Math.min(S.libraryLimit,matches.length)}개 표시`;$('#library-list').innerHTML=matches.slice(0,S.libraryLimit).map(q=>`<article class="ox-library-item"><button class="mark" data-bookmark="${q.id}" aria-label="다시 볼 문제 ${state.bookmarks.includes(q.id)?'해제':'저장'}">${state.bookmarks.includes(q.id)?'★':'☆'}</button><small>${CATEGORY[q.category].icon} ${categoryName(q.category,q.level)} · ${RANKS[q.level-1].name} · ${q.id}</small><p>${esc(q.statement)}</p><details><summary>정답과 해설 보기</summary><p><b>${q.answer?'O':'X'}</b> · ${esc(q.explanation)}</p><a href="${esc(sourceURL(q))}" target="_blank" rel="noopener noreferrer">${esc(sourceFor(q).name)} ↗</a></details></article>`).join('')||'<p class="ox-small">일치하는 문제가 없어요. 검색 조건을 바꿔 보세요.</p>';$('#library-more').hidden=matches.length<=S.libraryLimit;}
const TROPHIES=[['🌱','첫걸음','첫 문제 풀기',s=>s.answered>=1],['⭐','열 개의 별','정답 10개',s=>s.correct>=10],['💯','상식 수집가','정답 100개',s=>s.correct>=100],['📚','지식 도서관','정답 500개',s=>s.correct>=500],['🔥','콤보 스타','5콤보',s=>s.bestCombo>=5],['🌈','완벽한 리듬','10콤보',s=>s.bestCombo>=10],['🎯','만점 도전','일반 퀴즈 100점',s=>s.history.some(h=>h.mode==='basic'&&h.total>=10&&h.score===100)],['🌏','팔방미인','12개 분야 도전',s=>Object.keys(s.categoryStats).length>=12],['📅','꾸준한 탐험가','서로 다른 7일 플레이',s=>Object.keys(s.days).length>=7],['⚡','번개 지식왕','60초 도전 1000점',s=>s.bestChallenge>=1000],['💎','고수의 길','고수 등급 달성',s=>s.xp>=2600],['👑','초인의 탄생','초인 등급 달성',s=>s.xp>=18000]];
function renderTrophies(){setScreen('trophy');$('#trophy-list').innerHTML=TROPHIES.map(([icon,title,desc,test])=>`<article class="ox-trophy ${test(state)?'earned':''}"><b>${test(state)?icon:'🔒'}</b><strong>${title}</strong><small>${desc}<br>${test(state)?'획득 완료!':'아직 도전 중'}</small></article>`).join('');}
const LOOKS={palette:[['pink','원작 핑크',0],['blue','파랑',80],['yellow','노랑',160],['mint','민트',280],['violet','보라',420],['snow','스노',700],['gold','황금',1600],['rainbow','무지개',4000]],costume:[['','기본',0],['cap','모자',180],['glasses','안경',320],['ribbon','리본',500],['headphones','헤드폰',800],['cape','망토',1300],['wizard','마법사',2200],['crown','왕관',5000]],theme:[['classic','원작',0],['paper','종이 축제',220],['sea','바다',600],['night','밤하늘',1100],['festival','축제',1700],['space','우주',3000]],song:[['classic','원작 음악',0],['chip','8비트',300],['brass','브라스',800],['matsuri','축제',1400],['electro','일렉트로',2400]]};
function renderCollection(){setScreen('collect');for(const [key,items] of Object.entries(LOOKS))$('#'+({palette:'palette-list',costume:'costume-list',theme:'theme-list',song:'song-list'}[key])).innerHTML=items.map(([id,label,need])=>`<button data-look="${key}" data-value="${id}" aria-pressed="${state.settings[key]===id}" ${state.xp<need?'disabled':''}>${key==='palette'?dopakichiSVG(id):key==='costume'?dopakichiSVG(state.settings.palette,id):key==='theme'?'✦':'♫'}${label}<small>${state.xp<need?`🔒 ${need.toLocaleString()} XP`:state.settings[key]===id?'사용 중':'사용하기'}</small></button>`).join('');requestAnimationFrame(layoutActors);}
function renderSettings(){const o=state.settings;$('#set-count').value=o.count;$('#set-volume').value=o.volume;$('#set-motion').value=o.motion;$('#set-mute').checked=o.muted;openDialog('settings');}
function exportSave(){const blob=new Blob([JSON.stringify({app:'dopa-ox',...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`dopa-ox-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
$('#import-save').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2_000_000)throw new Error('large');const raw=JSON.parse(await file.text());if(raw.app!=='dopa-ox'||raw.version!==1)throw new Error('format');if(!confirm('현재 OX 기록을 선택한 파일의 기록으로 바꿀까요? 산수판 기록은 바뀌지 않습니다.'))return;state=sanitizeState(raw,IDS);persist();look();renderHome();renderSettingsValues();toast('OX 기록을 가져왔어요.');}catch{toast('올바른 OX 기록 파일인지 확인해 주세요.');}finally{e.target.value='';}});
function renderSettingsValues(){const o=state.settings;$('#set-count').value=o.count;$('#set-volume').value=o.volume;$('#set-motion').value=o.motion;$('#set-mute').checked=o.muted;}
$('#ranks').addEventListener('click',e=>{const b=e.target.closest('[data-rank]');if(!b)return;state.settings.rank=Number(b.dataset.rank);persist();renderHome();audio.unlock();audio.keyTap(1);if(state.settings.motion)hero.hop(24,300,{audio});});
$('#category-list').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;const id=b.dataset.category;if(id==='all')state.settings.categories=[];else if(state.settings.categories.includes(id))state.settings.categories=state.settings.categories.filter(x=>x!==id);else state.settings.categories.push(id);persist();renderCategories();renderHome();});
$('#start').onclick=()=>startGame();$('#start-review').onclick=()=>startGame('review');$('#start-challenge').onclick=()=>startGame('challenge');$('#start-daily').onclick=()=>startGame('daily');$('#open-categories').onclick=()=>{renderCategories();openDialog('category-dialog');};$('#open-settings').onclick=renderSettings;$('#open-guide').onclick=()=>openDialog('help-dialog');$('#open-library').onclick=openLibrary;$('#open-trophy').onclick=renderTrophies;$('#open-collect').onclick=renderCollection;
$('#answer-o').onclick=e=>answer(true,e.currentTarget);$('#answer-x').onclick=e=>answer(false,e.currentTarget);$('#next-question').onclick=next;$('#bookmark-question').onclick=()=>bookmark(S.question.id);
$('#report-question').onclick=()=>{const q=S.question;const body=`문제 ID: ${q.id}\n문장: ${q.statement}\n현재 정답: ${q.answer?'O':'X'}\n근거: ${sourceURL(q)}\n\n어떤 부분을 확인하면 좋을까요?\n`;window.open(`https://github.com/dalmook/dalmook.github.io/issues/new?title=${encodeURIComponent('[OX 문제 확인] '+q.id)}&body=${encodeURIComponent(body)}`,'_blank','noopener,noreferrer');};
$('#leave-game').onclick=()=>openDialog('confirm-dialog');$('#confirm-leave').onclick=()=>finishGame();$('#result-home').onclick=showHome;$('#play-again').onclick=()=>startGame(S.mode);$('#result-wrong').onclick=()=>startGame('review',S.results.filter(r=>!r.correct).map(r=>r.id));$$('[data-home]').forEach(b=>b.onclick=showHome);
$('#mute').onclick=()=>{state.settings.muted=!state.settings.muted;audio.unlock();look();persist();};$('#export-save').onclick=exportSave;
for(const [id,key] of [['set-count','count'],['set-volume','volume'],['set-motion','motion']])$('#'+id).addEventListener('input',e=>{state.settings[key]=Number(e.target.value);persist();look();renderHome();});$('#set-mute').onchange=e=>{state.settings.muted=e.target.checked;persist();look();};
for(const id of ['library-search','library-category','library-rank','library-bookmarks'])$('#'+id).addEventListener(id==='library-search'?'input':'change',()=>{S.libraryLimit=30;renderLibrary();});$('#library-more').onclick=()=>{S.libraryLimit+=30;renderLibrary();};$('#library-list').onclick=e=>{const b=e.target.closest('[data-bookmark]');if(b)bookmark(b.dataset.bookmark);};
$('#screen-collect').onclick=e=>{const b=e.target.closest('[data-look]');if(!b||b.disabled)return;const key=b.dataset.look,id=b.dataset.value,entry=LOOKS[key]?.find(x=>x[0]===id);if(!entry||entry[2]>state.xp)return;state.settings[key]=id;audio.unlock();look();persist();renderCollection();if(key==='song'){audio.startMusic();audio.setLevel(5,120);}else audio.jingle();};
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||modalOpen()||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(S.screen!=='play')return;const k=e.key.toLowerCase();if(['o','x','arrowleft','arrowright','enter',' '].includes(k))e.preventDefault();if(k==='o'||k==='arrowleft')answer(true,$('#answer-o'));else if(k==='x'||k==='arrowright')answer(false,$('#answer-x'));else if(k==='enter'||k===' ')next();else if(k==='escape')openDialog('confirm-dialog');});
window.addEventListener('resize',layoutActors);for(const id of ['screen-title','screen-play','screen-result','screen-collect'])$('#'+id).addEventListener('scroll',layoutActors,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stopMusic();persist();}else if(S.screen==='play'||S.screen==='result'){audio.startMusic();}});
window.addEventListener('pagehide',persist);
function burstPath(n,outer,inner){return Array.from({length:n*2},(_,i)=>{const a=i*Math.PI/n-Math.PI/2,r=i%2?inner:outer;return`${i?'L':'M'}${Math.cos(a)*r},${Math.sin(a)*r}`;}).join(' ')+'Z';}
$('#logo-burst-path').setAttribute('d',burstPath(13,91,66));$('#logo-burst-inner').setAttribute('d',burstPath(13,72,54));$('#flags').innerHTML=Array.from({length:14},(_,i)=>{const x=5+i*29,y=5+Math.sin(i/13*Math.PI)*13;return `<path d="M${x} ${y} l12 20 12-18z" fill="${['#ff7ab6','#ffd23f','#3fdcb0','#a77bff'][i%4]}" stroke="#1b1d4d" stroke-width="2"/>`;}).join('');
// Keep question timers and the main mascot at frame speed; throttle decoration only.
let lastFrame=0,decorDt=0,lastTier=-1,lastShown=null,emptyFx=false,emptyBack=false,lastHUD=0;
const cardEl=$('#card'),logoEl=$('.logo-burst');
onFrame((dt,t)=>{
 if(document.hidden)return;
 budget.frame(t);
 if(lastTier!==budget.level){lastTier=budget.level;layoutActors();}
 const motion=state.settings.motion,playing=S.screen==='play'||S.screen==='result';
 if(S.screen==='play'&&S.phase==='question'&&!modalOpen()){
  S.elapsed+=dt*1000;
  if(t-lastHUD>120){lastHUD=t;updateHUD();}
  if(S.mode==='challenge'&&S.elapsed>=60000)finishGame();
 }
 const at=audio.now(),last=audio.kicks.findLast(x=>x<=at),beat=last!==undefined?Math.exp(-Math.max(0,at-last)*13):0;
 S.visualE+=(S.E-S.visualE)*Math.min(1,dt*4);
 bg.state.E=motion?S.visualE*Math.max(.6,motion):0;bg.state.kick=beat*motion;bg.state.reach=audio.reach?.35:0;bg.state.flash=0;
 const shown=!!motion&&(bg.state.E>.1||bg.state.reach>0);
 if(shown!==lastShown){lastShown=shown;bg.canvas.style.visibility=shown?'visible':'hidden';bg.fallback.style.visibility=shown?'visible':'hidden';}
 if(shown&&budget.backgroundDue(t))bg.render(t);
 if(hero.visible&&(motion||staticDirty)){hero.bob=motion?(playing?.7:.12):0;if(!motion){hero.lift=0;hero.rot=0;}hero.update(motion?dt:0,motion?t:0,{beat:beat*motion});}
 else if(!hero.visible){hero.root.style.display='none';hero.armsFront.style.display='none';}
 decorDt+=dt;
 if(budget.decorDue(t)){
  const elapsed=Math.min(.12,decorDt);decorDt=0;
  friends.forEach((m,i)=>{
   if(m.visible&&motion){m.lift=Math.max(0,Math.sin(t/230+i*1.8))*13*S.E;m.tilt.target=Math.sin(t/250+i)*9*S.E;m.hands.forEach((h,j)=>h.raise=(.35+.25*Math.sin(t/200+i+j))*S.E);m.update(elapsed,t,{beat});m._painted=true;}
   else if(m._painted!==false){m.root.style.display='none';m.armsFront.style.display='none';m._painted=false;}
  });
  if(motion&&t-S.rainAt>Math.max(320,1700-S.E*1400)/budget.density&&playing&&S.E>.45){S.rainAt=t;fxBack.rain(innerWidth,Math.round((2+S.E*5)*budget.density),{kinds:S.E>.8?['confetti','mini']:['confetti']});}
  if(motion){fx.update(elapsed);fxBack.update(elapsed);}else{fx.parts.length=0;fxBack.parts.length=0;}
  if(fx.parts.length||!emptyFx)fx.draw();emptyFx=!fx.parts.length;
  if(fxBack.parts.length||!emptyBack)fxBack.draw();emptyBack=!fxBack.parts.length;
  cardEl.style.setProperty('--kick',(beat*motion).toFixed(2));
  if(S.screen==='title'&&motion&&t-lastFrame>50){lastFrame=t;logoEl.style.setProperty('--spin',t/300);}
 }
 if(motion&&t>S.idleAt&&S.screen==='title'&&!modalOpen()){S.idleAt=t+4800;hero.celebrate(.08,{audio:null,variant:'earflap'});}
 if(S.shake>0){S.shake=Math.max(0,S.shake-dt*15);cardEl.style.translate=motion?`${Math.sin(t/27)*S.shake}px ${Math.cos(t/33)*S.shake*.5}px`:'0 0';}else if(cardEl.style.translate!=='0 0')cardEl.style.translate='0 0';
 staticDirty=false;
});
look();renderHome();layoutActors();startClock();document.documentElement.dataset.oxReady='true';
