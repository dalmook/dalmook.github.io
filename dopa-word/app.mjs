import {BASE,TOPICS} from './words.mjs';
import {installSharing} from './shared-ui.mjs';
import {rememberPack,sharedGroup} from './shared-model.mjs';
import {Scene} from './scene.mjs?v=smooth-1';
import {ChoiceMotion, CHOICE_MOTION_VERSION} from './choice-motion.mjs?v=smooth-1';
import {dopakichiSVG} from './vendor/dopakichi.js';
import {SAVE_KEY,REVISION,LEVELS,MODE_NAMES,letters,normalWord,escapeHTML as esc,vocabulary,freshState,loadState,saveState,eligible,makeDeck,makeChoices,overlap,progressOf,recordAnswer,upsertWord,removeWord,parseImport,planImport,applyImport,exportCSV,parseBackup,dayKey,categoryCatalog,selectCategories,chooseCategoryMode,plannedCount} from './model.mjs?v=shared-1';
const $=id=>document.getElementById(id),$$=s=>[...document.querySelectorAll(s)];
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('storage');}};}
let state=loadState(storage),baseRevision=state.revision,stale=false,storageWarned=false;
try{if(!storage.getItem(SAVE_KEY)&&matchMedia('(prefers-reduced-motion: reduce)').matches)state.settings.motion=0;}catch{}
const scene=new Scene();const choiceMotion=new ChoiceMotion(scene);const G={screen:'title',phase:'idle',token:0,deck:[],i:0,results:[],mode:'spell',review:false,combo:0,peak:0,xp:0,buffer:'',mistakes:0,assisted:false,options:[],rejected:new Set(),limit:35};
let checkTimer=0,toastTimer=0,editID=null,importPlan=null,confirmAction=null;
// Read-only by convention, provided for diagnostics and deterministic browser tests.
window.__word={G,scene,choiceMotion,choiceMotionVersion:CHOICE_MOTION_VERSION,base:BASE,get state(){return state;},get words(){return vocabulary(state);},revision:REVISION};
function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function ask(title,text,action){$('confirm-title').textContent=title;$('confirm-text').textContent=text;confirmAction=action;$('confirm-dialog').showModal();}
function conflict(){stale=true;clearTimeout(checkTimer);if(!$('confirm-dialog').open)ask('다른 탭에서 기록이 바뀌었어요','덮어쓰지 않도록 저장을 멈췄어요. 새로 불러오면 다른 탭의 기록을 이어서 사용할 수 있어요.',()=>location.reload());}
function persist({force=false}={}){
 if(stale&&!force)return false;
 try{const current=JSON.parse(storage.getItem(SAVE_KEY)||'null');if(!force&&(current?.revision||0)!==baseRevision){conflict();return false;}}catch{}
 state.revision=baseRevision+1;if(saveState(storage,state)){baseRevision=state.revision;return true;}state.revision=baseRevision;if(!storageWarned){storageWarned=true;toast('브라우저 저장이 안 돼요. 설정에서 전체 기록을 파일로 백업해 주세요.');}return false;
}
window.addEventListener('storage',e=>{if(e.key===SAVE_KEY)conflict();});
function usable(){if(stale){toast('다른 탭의 기록을 보존하려면 새로고침해 주세요.');return false;}return true;}
function setView(name){clearTimeout(checkTimer);G.screen=name;G.token++;choiceMotion.reset();$$('.screen').forEach(el=>el.classList.toggle('is-active',el.id==='screen-'+name));scene.setScreen(name);}
function home(){G.phase='idle';setView('title');renderHome();}
function reviewWords(){return eligible(state,{review:true});}
function rank(){return state.xp>=3000?'단어 마스터':state.xp>=1000?'영어 탐험가':state.xp>=300?'단어 수집가':'새싹 탐험가';}
function renderCategoryShortcuts(){
 const list=categoryCatalog(state).filter(c=>c.custom>0);
 $('custom-categories').hidden=!list.length;
 $('custom-category-list').innerHTML=list.map(c=>`<button data-home-category="${esc(c.name)}" aria-pressed="${state.settings.groups.includes(c.name)}"><b>${esc(c.name)}</b><small>${c.total}단어</small></button>`).join('');
}
function renderHome(){
 const o=state.settings;$$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===o.mode)));
 $('levels').innerHTML=LEVELS.map(l=>`<button data-level="${l.id}" aria-pressed="${l.id===o.level}">${l.name}<small>${l.note}</small></button>`).join('');$('source').value=o.source;
 $('open-topics').textContent=o.groups.length===1?`${o.groups[0]} ▾`:o.groups.length?`${o.groups.length}개 카테고리 ▾`:'카테고리 선택 ▾';$('open-topics').title=o.groups.join(' · ')||'기본·내 카테고리 모두 보기';const pool=eligible(state),n=plannedCount(state,pool.length);
 $('session-count').value=o.count;renderCategoryShortcuts();
 const chosen=categoryCatalog(state).filter(c=>o.groups.includes(c.name));
 $('selection-summary').textContent=o.groups.length?`${o.groups.join(' · ')} · 전체 ${chosen.reduce((n,c)=>n+c.total,0)}단어 / 현재 조건 ${pool.length}단어`:'';
 $('reset-category-filters').hidden=!o.groups.length||(!o.level&&o.source==='all'&&o.count===0);
 $('start-sub').textContent=`${MODE_NAMES[o.mode]} · ${o.groups.length===1?o.groups[0]:o.groups.length?o.groups.length+'개 카테고리':o.source==='custom'?'내 단어':o.source==='shared'?'공개 단어':o.source==='all'?'전체 단어':'기본 단어'} · ${n}문제`;
 $('pool-count').textContent=pool.length?`지금 고른 조건에 ${pool.length}단어 · 한 판에 중복 없이 ${n}문제`:'이 조건에 단어가 없어요. 다른 길이·주제를 고르거나 내 단어를 등록해요.';
 $('review-count').textContent=reviewWords().length;$('start').disabled=!pool.length;
 const d=state.days[dayKey()]||{answered:0,correct:0};$('today-count').textContent=`${Math.min(10,d.answered)} / 10`;$('daily-progress').value=Math.min(10,d.answered);
 $('total-summary').textContent=`${rank()} · ${state.xp.toLocaleString()} XP · 누적 ${state.answered}단어 학습${storageWarned?' · 파일 백업 필요':''}`;
}
function start(review=false){
 if(!usable())return;scene.audio.unlock();const deck=makeDeck(state,{review});if(!deck.length){toast(review?'이 모드에 복습할 단어가 없어요.':'조건에 맞는 단어가 없어요. 단어장을 확인해 주세요.');return;}
 Object.assign(G,{deck,i:0,results:[],mode:state.settings.mode,review,combo:0,peak:0,xp:0,phase:'enter'});$('pips').innerHTML=deck.slice(0,30).map(()=>'<span class="pip"></span>').join('');setView('play');scene.apply(state.settings);scene.start();question();
}
function current(){return G.deck[G.i];}
function hud(){ $('qno').textContent=`${G.i+1} / ${G.deck.length}`;$('correct-count').textContent=G.results.filter(r=>r.clean).length;$('combo').textContent=G.combo;$('energy-number').textContent=G.results.length*100+G.results.filter(r=>r.clean).length*50;$$('#pips .pip').forEach((p,j)=>{const i=Math.floor(G.i/30)*30+j;p.hidden=i>=G.deck.length;p.classList.toggle('now',i===G.i);p.classList.toggle('good',G.results[i]?.clean===true);p.classList.toggle('helped',G.results[i]?.clean===false);});}
function question(){
 if(G.i>=G.deck.length){finish();return;}clearTimeout(checkTimer);scene.stopSpeech();G.token++;choiceMotion.reset(G.mode);G.phase='question';G.buffer='';G.mistakes=0;G.assisted=false;G.rejected=new Set();const w=current();
 $('screen-play').classList.remove('answered','choosing');$('choices').setAttribute('aria-busy','false');$('screen-play').scrollTop=0;$('answer-panel').hidden=true;$('feedback').textContent='';$('qgroup').textContent=w.group;$('mode-label').textContent=MODE_NAMES[G.mode];$('question').classList.toggle('english',G.mode==='choice');$('question').lang=G.mode==='choice'?'en':'ko';$('question').textContent=G.mode==='spell'?w.meaning:w.word;
 $('spell-controls').hidden=G.mode!=='spell';$('choices').hidden=G.mode!=='choice';$('choice-note').hidden=G.mode!=='choice';$('letter-slots').hidden=G.mode!=='spell';
 if(G.mode==='spell'){
  const ambiguous=vocabulary(state).some(v=>v.id!==w.id&&letters(v.word).length===letters(w.word).length&&overlap(w.meaning,v.meaning));
  $('question-note').textContent=`영어 ${letters(w.word).length}글자${ambiguous?' · 첫 글자 '+w.word[0]:''}${/[^a-z]/.test(w.word)?' · 띄어쓰기와 기호는 자동으로 들어가요':''}`;drawSlots();
 }else{
  $('question-note').textContent='이 단어장의 한글 뜻은 무엇일까요?';try{G.options=makeChoices(w,vocabulary(state));}catch(e){toast(e.message);home();return;}
  $('choices').innerHTML=G.options.map((o,i)=>`<button data-choice="${i}"><b>${i+1}</b><span>${esc(o.label)}</span></button>`).join('');
 }
 hud();scene.energy(.08+(G.i/Math.max(1,G.deck.length-1))*.97);requestAnimationFrame(()=>scene.layout());if(G.i===G.deck.length-1&&G.i>0)scene.cutin('마지막 단어!');
}
function drawSlots(wrong=false){const w=current();let i=0;const expected=letters(w.word);$('letter-slots').innerHTML=[...w.word].map(c=>{
 if(!/[a-z]/.test(c))return`<span class="letter-cell fixed" aria-hidden="true">${c===' '?'·':esc(c)}</span>`;
 const n=i++,v=G.buffer[n]||'';return`<span data-slot="${n}" class="letter-cell ${n===G.buffer.length?'active':''} ${wrong&&v!==expected[n]?'wrong':''} ${G.phase==='answered'?'right':''}" aria-label="${n+1}번째 글자 ${v||'빈칸'}">${v}</span>`;
 }).join('');}
function typing(char,button){
 if(!usable()||G.screen!=='play'||G.phase!=='question'||G.mode!=='spell'||document.querySelector('dialog[open]'))return;
 char=char.toLowerCase();if(!/^[a-z]$/.test(char)||G.buffer.length>=letters(current().word).length)return;clearTimeout(checkTimer);const index=G.buffer.length;G.buffer+=char;drawSlots();scene.tap(index);
 const key=button||document.querySelector(`[data-key="${char}"]`);key?.classList.add('pressed');setTimeout(()=>key?.classList.remove('pressed'),110);scene.carry(key,document.querySelector(`[data-slot="${index}"]`),char);
 const token=G.token,buffer=G.buffer;if(buffer.length===letters(current().word).length)checkTimer=setTimeout(()=>{if(G.token===token&&G.buffer===buffer)submit();},360);
}
function erase(all=false){if(G.phase!=='question'||G.mode!=='spell'||!usable())return;clearTimeout(checkTimer);scene.swipe(document.querySelector(`[data-slot="${Math.max(0,G.buffer.length-1)}"]`));G.buffer=all?'':G.buffer.slice(0,-1);$('feedback').textContent='';drawSlots();}
function submit(){
 if(G.phase!=='question'||G.mode!=='spell'||!usable())return;clearTimeout(checkTimer);const target=letters(current().word);
 if(G.buffer.length!==target.length){$('feedback').textContent='빈칸을 모두 채워 주세요.';return;}
 if(G.buffer===target){complete();}else{G.mistakes++;drawSlots(true);$('feedback').textContent='조금 달라요! 빨간 칸을 지우고 다시 써 봐요.';scene.wrong($('letter-slots'));}
}
function hint(){if(G.phase!=='question'||G.mode!=='spell'||!usable())return;clearTimeout(checkTimer);G.assisted=true;const target=letters(current().word);let n=0;while(n<G.buffer.length&&target[n]===G.buffer[n])n++;G.buffer=target.slice(0,n+1);drawSlots();$('feedback').textContent='한 글자 도와줬어요. 나머지도 채워 볼까요?';scene.tap(n);if(G.buffer===target)complete();}
function reveal(){if(G.phase!=='question'||!usable())return;clearTimeout(checkTimer);G.assisted=true;G.buffer=letters(current().word);complete();}
async function choose(index,el){
 if(G.phase!=='question'||G.mode!=='choice'||!usable()||document.hidden||document.querySelector('dialog[open]'))return;
 const opt=G.options[index];if(!opt||G.rejected.has(index))return;
 const button=el||document.querySelector(`[data-choice="${index}"]`);if(!button)return;
 const token=G.token,wordID=current().id;
 const sameQuestion=()=>G.screen==='play'&&G.mode==='choice'&&G.token===token&&current()?.id===wordID;
 const isCurrent=()=>sameQuestion()&&G.phase==='choosing'&&!stale&&!document.querySelector('dialog[open]');
 G.phase='choosing';$('screen-play').classList.add('choosing');$('choices').setAttribute('aria-busy','true');
 $$('#choices button').forEach(b=>b.disabled=true);scene.tap(index);
 let accepted=false;
 try{accepted=await choiceMotion.play(button,index,opt.label,isCurrent);}
 catch(error){console.error('Choice animation failed',error);toast('선택 동작을 다시 눌러 주세요. 학습 기록은 바뀌지 않았어요.');}
 if(!sameQuestion()||G.phase!=='choosing')return;
 G.phase='question';$('screen-play').classList.remove('choosing');$('choices').setAttribute('aria-busy','false');
 $$('#choices button').forEach(b=>b.disabled=G.rejected.has(Number(b.dataset.choice)));
 if(!accepted||stale)return;
 choiceMotion.outcome(opt.correct);
 if(opt.correct){button.classList.add('correct');complete();}
 else{G.rejected.add(index);G.mistakes++;button.classList.add('wrong');button.disabled=true;$('feedback').textContent='다른 뜻이에요. 다시 골라 볼까요?';scene.wrong(button);}
}
function complete(){
 if(G.phase!=='question'||!usable())return;G.phase='answered';clearTimeout(checkTimer);const w=current(),clean=!G.assisted&&!G.mistakes;G.combo=clean?G.combo+1:0;G.peak=Math.max(G.peak,G.combo);const xp=recordAnswer(state,w,G.mode,clean,G.combo);G.xp+=xp;G.results.push({word:w,clean,assisted:G.assisted,mistakes:G.mistakes});persist();
 $('screen-play').classList.add('answered');$('spell-controls').hidden=true;$('choices').hidden=true;$('choice-note').hidden=true;$('answer-panel').hidden=false;$('answer-title').textContent=clean?'정답! 단어 하나 더 모았어요!':'잘 배웠어요! 복습에서 다시 만나요.';$('answer-word').textContent=w.word;$('answer-meaning').textContent=w.meaning;$('answer-note').textContent=clean?`+${xp} XP · ${G.combo}콤보`:`+${xp} XP · 힌트·오답 단어는 복습에 저장돼요.`;$('next').textContent=G.i+1===G.deck.length?'결과 보기 →':'다음 단어 →';
 if(G.mode==='spell'){G.buffer=letters(w.word);drawSlots();}hud();scene.layout();scene.success(G.combo,clean);
}
function next(){if(G.phase==='answered'&&!document.querySelector('dialog[open]')&&usable()){G.i++;question();}}
function finish(){
 if(G.phase==='result')return;if(!G.results.length){home();return;}G.phase='result';const correct=G.results.filter(r=>r.clean).length;state.sessions++;state.history.push({day:dayKey(),mode:G.mode,total:G.results.length,correct});state.history=state.history.slice(-50);persist();
 $('score').textContent=Math.round(correct/G.results.length*100);$('result-cheer').textContent=correct===G.results.length?'모두 스스로 정답! 멋진 단어 탐험이었어요!':'새로 배운 단어를 복습하면 더 쉬워져요!';$('r-correct').textContent=correct+'개';$('r-total').textContent=G.results.length+'개';$('r-combo').textContent=G.peak+'콤보';$('r-xp').textContent='+'+G.xp+' XP';
 $('result-words').innerHTML=G.results.map(r=>`<div class="result-word"><b lang="en">${r.clean?'★':'↻'} ${esc(r.word.word)}</b><span>${esc(r.word.meaning)}</span></div>`).join('');$('result-review').hidden=!G.results.some(r=>!r.clean);setView('result');scene.finale();
}
function openWords(){setView('words');G.limit=35;renderGroups();renderWords();}
function renderGroups(){const existing=$('list-group').value;const groups=[...new Set(vocabulary(state).map(w=>w.group))];$('list-group').innerHTML='<option value="">모든 주제</option>'+groups.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');if(groups.includes(existing))$('list-group').value=existing;$('group-names').innerHTML=groups.map(g=>`<option value="${esc(g)}"></option>`).join('');}
function renderWords(){
 const search=$('word-search').value.trim().toLowerCase(),source=$('list-source').value,group=$('list-group').value;
 const pool=vocabulary(state).filter(w=>(!group?(source==='all'||w.origin===source):w.group===group)&&(!search||`${w.word} ${w.meaning}`.toLowerCase().includes(search)));
 $('list-count').textContent=`${pool.length}단어 · 기본 ${BASE.length}개 / 내 단어 ${state.custom.length}개`;
 $('word-list').innerHTML=pool.slice(0,G.limit).map(w=>`<article class="word-entry"><div class="entry-top"><b lang="en">${esc(w.word)}</b><small>${w.origin==='custom'?'내 단어':w.origin==='shared'?'공개 보관본':'기본'}</small></div><p>${esc(w.meaning)}</p><footer><span>${esc(w.group)} · ${letters(w.word).length}글자</span><button data-speak="${esc(w.id)}" aria-label="${esc(w.word)} 발음 듣기">🔊</button><button data-edit="${esc(w.id)}">${w.origin==='custom'?'수정':'내 뜻으로'}</button>${w.origin==='custom'?`<button data-delete="${esc(w.id)}">삭제</button>`:''}</footer></article>`).join('')||'<p class="empty">아직 단어가 없어요.<br>한 단어 등록 또는 일괄 등록으로 시작해요!</p>';
 $('list-more').hidden=pool.length<=G.limit;$('study-custom').disabled=!state.custom.length;
 const category=categoryCatalog(state).find(c=>c.name===group);
 $('category-study').hidden=!category;
 if(category){$('category-study-title').textContent=category.name+' · 전체 '+category.total+'단어';$('category-study-note').textContent='아래 버튼은 검색어·길이 제한 없이 이 카테고리 전체를 학습해요.';}
 $('study-custom').hidden=false;$('study-custom').textContent=category?'이 카테고리로 바로 연습':'내 단어로 바로 연습';$('study-custom').disabled=category?false:!state.custom.length;
}
function editWord(id=null){if(!usable())return;const w=vocabulary(state).find(w=>w.id===id);editID=w?.origin==='custom'?id:null;$('edit-title').textContent=w?'단어 수정':'한 단어 등록';$('edit-word').value=w?.word||'';$('edit-meaning').value=w?.meaning||'';$('edit-group').value=w?.origin==='custom'?w.group:'내 단어';$('edit-error').textContent='';$('edit-dialog').showModal();setTimeout(()=>$('edit-word').focus(),30);}
$('edit-form').addEventListener('submit',e=>{e.preventDefault();if(!usable())return;try{const saved=upsertWord(state,{word:$('edit-word').value,meaning:$('edit-meaning').value,group:$('edit-group').value},editID);selectCategories(state,[saved.group]);persist();$('edit-dialog').close();renderGroups();$('list-source').value='all';$('list-group').value='';$('word-search').value=saved.word;renderWords();renderHome();toast('내 단어장에 저장했어요. 두 모드에서 바로 연습할 수 있어요.');}catch(err){$('edit-error').textContent=err.message;}});
function openImport(){if(!usable())return;importPlan=null;$('import-preview').innerHTML='';$('import-error').textContent='';$('apply-import').disabled=true;$('apply-import').textContent='미리 보기를 먼저 확인해요';$('import-dialog').showModal();}
function invalidateImport(){importPlan=null;$('apply-import').disabled=true;$('apply-import').textContent='바뀐 내용을 다시 미리 보기';$('import-preview').innerHTML='';}
function previewImport(){try{
 const parsed=parseImport($('import-text').value,$('import-group').value||'내 단어');importPlan=planImport(state,parsed,$('overwrite').checked);const p=importPlan,count=p.adds.length+p.updates.length;
 $('import-error').textContent='';$('import-preview').innerHTML=`<p class="import-counts">새 단어 <b>${p.adds.length}</b>개 · 뜻 수정 <b>${p.updates.length}</b>개<br>중복 건너뛰기 ${p.skipped.length}개 · 오류 제외 ${p.errors.length}행</p><div class="preview-wrap"><table><thead><tr><th>영어</th><th>뜻</th><th>단어장</th></tr></thead><tbody>${[...p.adds,...p.updates].slice(0,20).map(w=>`<tr><td lang="en">${esc(w.word)}</td><td>${esc(w.meaning)}</td><td>${esc(w.group)}</td></tr>`).join('')}</tbody></table></div>${count>20?'<p class="small muted">앞의 20개만 미리 보여 줘요. 정상 행은 모두 등록돼요.</p>':''}${p.errors.length?`<div class="import-errors">${p.errors.slice(0,25).map(x=>`${x.line}행: ${esc(x.error)}`).join('<br>')}</div>`:''}${p.skipped.length?`<p class="small muted">건너뛸 단어: ${p.skipped.slice(0,10).map(w=>esc(w.word)).join(', ')}${p.skipped.length>10?' 외':''}</p>`:''}`;
 $('apply-import').disabled=!count;$('apply-import').textContent=count?`정상 ${count}개 등록${p.errors.length?' (오류 행 제외)':''}`:'등록할 새 단어가 없어요';
 }catch(e){invalidateImport();$('import-error').textContent=e.message;}}
$('import-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>1_000_000)throw Error('1MB 이하의 파일로 나눠 주세요.');$('import-text').value=await f.text();invalidateImport();previewImport();}catch(err){$('import-error').textContent=err.message;}finally{e.target.value='';}});
$('apply-import').onclick=()=>{if(!importPlan||!usable())return;try{const importedGroups=[...new Set([...importPlan.adds,...importPlan.updates].map(w=>w.group))];const n=applyImport(state,importPlan);selectCategories(state,importedGroups);persist();$('import-dialog').close();importPlan=null;renderGroups();$('list-source').value='all';$('list-group').value='';$('word-search').value='';renderWords();renderHome();toast(`${n}개 등록 완료! 해당 카테고리가 학습 대상으로 선택됐어요.`);}catch(e){$('import-error').textContent=e.message;}};
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function settings(){const o=state.settings;$('set-count').value=o.count;$('set-volume').value=o.volume;$('set-motion').value=o.motion;$('set-muted').checked=o.muted;$('settings').showModal();}
$('restore-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5_000_000)throw Error('백업 파일이 너무 커요.');const replacement=parseBackup(await f.text());$('settings').close();ask('백업 기록을 가져올까요?',`내 단어 ${replacement.custom.length}개와 학습 기록으로 이 브라우저의 영단어 기록을 바꿔요. 기존 기록이 필요하면 먼저 내보내 주세요. 산수판과 OX판에는 영향이 없어요.`,()=>{state=replacement;stale=false;persist({force:true});scene.apply(state.settings);home();toast('단어장과 학습 기록을 가져왔어요.');});}catch(err){toast(err.message);}finally{e.target.value='';}});
function topics(){
 const catalog=categoryCatalog(state),sel=state.settings.groups;
 $('topic-list').innerHTML=`<button type="button" data-topic="" aria-pressed="${!sel.length}">🎲 모든 카테고리<small>${vocabulary(state).length}단어</small></button>`+
 catalog.map(c=>`<button type="button" data-topic="${esc(c.name)}" aria-pressed="${sel.includes(c.name)}">${c.custom?'📚':TOPICS.find(t=>t[0]===c.name)?.[1]||'📖'} ${esc(c.name)}<small>${c.total}단어${c.custom?' · 내가 등록함':''}</small></button>`).join('');
}
function categoryStart(name,mode){
 if(!usable())return;try{chooseCategoryMode(state,name,mode);persist();renderHome();start();}catch(err){toast(err.message);}
}
function progress(){setView('progress');const words=vocabulary(state);$('profile-rank').textContent=rank()+' · '+state.xp.toLocaleString()+' XP';$('profile-summary').textContent=`${state.sessions}판 학습 · 스스로 맞힌 단어 ${state.correct}회 · 최고 ${state.bestCombo}콤보`;
 $('progress-topics').innerHTML=[...new Set(words.map(w=>w.group))].map(g=>{const a=words.filter(w=>w.group===g);return`<section class="progress-topic"><strong>${esc(g)}</strong>⌨ 스펠링 익숙함 ${a.filter(w=>(progressOf(state,w,'spell')?.streak||0)>=3).length} / ${a.length}<br>❶ 뜻 고르기 익숙함 ${a.filter(w=>(progressOf(state,w,'choice')?.streak||0)>=3).length} / ${a.length}</section>`;}).join('');
 $('history-list').innerHTML=[...state.history].reverse().map(h=>`<div class="history-item">${esc(h.day)} · ${MODE_NAMES[h.mode]}<br>${h.total}단어 학습 · 스스로 정답 ${h.correct}개</div>`).join('')||'<p class="empty">첫 단어 탐험을 시작해 보세요!</p>';
}
const LOOKS={palette:[['pink','원작 핑크',0],['blue','파랑',80],['yellow','노랑',160],['mint','민트',280],['violet','보라',420],['snow','하양',700],['gold','황금',1600],['rainbow','무지개',4000]],costume:[['','기본',0],['cap','모자',180],['glasses','안경',320],['ribbon','리본',500],['headphones','헤드폰',800],['cape','망토',1300],['wizard','마법사',2200],['crown','왕관',5000]],theme:[['classic','원작',0],['paper','종이 축제',220],['sea','바다',600],['night','밤하늘',1100],['festival','축제',1700],['space','우주',3000]],song:[['classic','원작 음악',0],['chip','8비트',300],['brass','브라스',800],['matsuri','축제',1400],['electro','일렉트로',2400]]};
function collection(){setView('collection');for(const [key,items]of Object.entries(LOOKS))$({palette:'palettes',costume:'costumes',theme:'themes',song:'songs'}[key]).innerHTML=items.map(([id,name,need])=>`<button data-look="${key}" data-value="${id}" aria-pressed="${state.settings[key]===id}" ${state.xp<need?'disabled':''}>${key==='palette'?dopakichiSVG(id):key==='costume'?dopakichiSVG(state.settings.palette,id):key==='song'?'♫':'✦'} ${name}<small>${state.xp<need?'🔒 '+need+' XP':state.settings[key]===id?'사용 중':'사용하기'}</small></button>`).join('');}
$('keyboard').innerHTML=['qwertyuiop','asdfghjkl','zxcvbnm'].map(row=>`<div class="key-row">${[...row].map(k=>`<button data-key="${k}" class="${'aeiou'.includes(k)?'vowel':''}" aria-label="알파벳 ${k}" lang="en">${k}</button>`).join('')}</div>`).join('')+'<div class="key-row"><button class="control" data-control="clear">모두 지우기</button><button class="control" data-control="back">⌫ 지우기</button><button class="control" data-control="check">정답 확인 ↵</button></div>';
$('keyboard').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.key)typing(b.dataset.key,b);else if(b.dataset.control==='clear')erase(true);else if(b.dataset.control==='back')erase();else submit();};
$('choices').onclick=e=>{const b=e.target.closest('[data-choice]');if(b)choose(Number(b.dataset.choice),b);};$('hint').onclick=hint;$('reveal').onclick=reveal;$('next').onclick=next;
$('pronounce').onclick=()=>{if(!scene.speak(current().word))toast('이 브라우저에 영어 음성이 준비되지 않았어요. 다른 브라우저나 기기의 영어 음성 설정을 확인해 주세요.');};
$('start').onclick=()=>start();$('start-review').onclick=()=>start(true);$('again').onclick=()=>start(G.review);$('result-review').onclick=()=>start(true);$('open-words').onclick=openWords;$('open-progress').onclick=progress;$('open-collection').onclick=collection;
$$('[data-home]').forEach(b=>b.onclick=home);$$('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());$('open-help').onclick=()=>$('help-dialog').showModal();$('open-settings').onclick=settings;$('leave').onclick=()=>ask('이번 판을 마칠까요?','이미 끝낸 단어의 학습 기록은 남아요. 아직 답하지 않은 단어는 기록하지 않아요.',finish);
$('confirm-ok').onclick=()=>{const action=confirmAction;confirmAction=null;$('confirm-dialog').close();action?.();};
$$('[data-mode]').forEach(b=>b.onclick=()=>{if(!usable())return;state.settings.mode=b.dataset.mode;persist();renderHome();scene.tap();});
$('levels').onclick=e=>{const b=e.target.closest('[data-level]');if(b&&usable()){state.settings.level=Number(b.dataset.level);persist();renderHome();scene.tap();}};
$('source').onchange=e=>{if(!usable())return;state.settings.source=e.target.value;state.settings.groups=[];if(['custom','shared'].includes(e.target.value))state.settings.level=0;persist();renderHome();};
$('open-topics').onclick=()=>{topics();$('topics-dialog').showModal();};$('topic-list').onclick=e=>{const b=e.target.closest('[data-topic]');if(!b||!usable())return;const g=b.dataset.topic;const names=!g?[]:state.settings.groups.includes(g)?state.settings.groups.filter(x=>x!==g):[...state.settings.groups,g];selectCategories(state,names);if(!names.length){state.settings.source='all';state.settings.level=0;}persist();topics();renderHome();};
$('mute').onclick=()=>{if(!usable())return;state.settings.muted=!state.settings.muted;scene.audio.unlock();scene.apply(state.settings);persist();};
for(const [id,key]of [['set-count','count'],['set-volume','volume'],['set-motion','motion']])$(id).oninput=e=>{if(!usable())return;state.settings[key]=Number(e.target.value);persist();scene.apply(state.settings);renderHome();};$('set-muted').onchange=e=>{if(!usable())return;state.settings.muted=e.target.checked;persist();scene.apply(state.settings);};
$('add-word').onclick=()=>editWord();$('bulk-word').onclick=openImport;$('preview-import').onclick=previewImport;for(const id of ['import-text','import-group','overwrite'])$(id).addEventListener('input',invalidateImport);
$('word-search').oninput=()=>{G.limit=35;renderWords();};$('list-source').onchange=()=>{G.limit=35;$('list-group').value='';renderWords();};$('list-group').onchange=()=>{G.limit=35;$('list-source').value='all';$('word-search').value='';renderWords();};$('list-more').onclick=()=>{G.limit+=35;renderWords();};
$('word-list').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)editWord(b.dataset.edit);else if(b.dataset.delete&&usable()){const w=vocabulary(state).find(x=>x.id===b.dataset.delete);ask('내 단어를 삭제할까요?',`${w.word} — ${w.meaning}\n이 단어의 개인 학습 기록도 지워요. 기본 단어를 수정했던 경우 원래 기본 뜻으로 돌아가요.`,()=>{removeWord(state,w.id);state.settings.groups=state.settings.groups.filter(g=>categoryCatalog(state).some(c=>c.name===g));persist();renderGroups();renderWords();renderHome();});}else if(b.dataset.speak){const w=vocabulary(state).find(x=>x.id===b.dataset.speak);if(!scene.speak(w.word))toast('이 기기에서 영어 음성을 사용할 수 없어요.');}};
$('study-custom').onclick=()=>{if(!usable())return;const group=$('list-group').value;if(group){categoryStart(group,state.settings.mode);return;}state.settings.source='custom';state.settings.level=0;state.settings.groups=[];state.settings.count=0;persist();renderHome();start();};
$('category-spell').onclick=()=>categoryStart($('list-group').value,'spell');
$('category-choice').onclick=()=>categoryStart($('list-group').value,'choice');
$('custom-category-list').onclick=e=>{const b=e.target.closest('[data-home-category]');if(!b||!usable())return;selectCategories(state,[b.dataset.homeCategory]);persist();renderHome();toast(b.dataset.homeCategory+' 전체 단어를 선택했어요. 원하는 모드로 시작해요.');};
$('session-count').onchange=e=>{if(!usable())return;state.settings.count=Number(e.target.value);persist();renderHome();};
$('reset-category-filters').onclick=()=>{if(!usable())return;selectCategories(state,state.settings.groups);persist();renderHome();};
$('export-words').onclick=()=>{if(!state.custom.length){toast('먼저 내 단어를 등록해 주세요.');return;}download('내_영단어_'+dayKey()+'.csv',exportCSV(state.custom),'text/csv;charset=utf-8');};$('backup').onclick=()=>download('dopa-word-backup-'+dayKey()+'.json',JSON.stringify(state,null,2),'application/json');
$('screen-collection').onclick=e=>{const b=e.target.closest('[data-look]');if(!b||b.disabled||!usable())return;const k=b.dataset.look,v=b.dataset.value,entry=LOOKS[k]?.find(x=>x[0]===v);if(!entry||state.xp<entry[2])return;state.settings[k]=v;persist();scene.apply(state.settings);collection();scene.audio.unlock();if(k==='song'){scene.audio.startMusic();scene.audio.setLevel(5,120);}else scene.audio.jingle();};
document.addEventListener('keydown',e=>{if(e.repeat||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable||G.screen!=='play')return;
 const k=e.key.toLowerCase();if(G.phase==='answered'&&(k==='enter'||k===' ')){e.preventDefault();next();return;}if(G.phase!=='question')return;
 if(G.mode==='spell'){if(/^[a-z]$/.test(k)){e.preventDefault();typing(k);}else if(k==='backspace'){e.preventDefault();erase();}else if(k==='enter'){e.preventDefault();submit();}}
 else if(/^[1-4]$/.test(k)){e.preventDefault();const i=Number(k)-1;choose(i,document.querySelector(`[data-choice="${i}"]`));}if(k==='escape')$('leave').click();
});
scene.apply(state.settings);renderHome();scene.layout();document.documentElement.dataset.wordReady='true';

installSharing({
 getState:()=>state, persist, usable, toast, setView, renderHome,
 study(pack,mode){
  if(!usable())return;rememberPack(state,pack);
  state.settings.mode=mode;state.settings.source='shared';state.settings.groups=[sharedGroup(pack)];state.settings.level=0;state.settings.count=0;
  persist();renderHome();start();
 },
 forget(id){
  if(!usable())return;state.sharedPacks=(state.sharedPacks||[]).filter(p=>p.id!==id);
  for(const key of Object.keys(state.progress))if(key.startsWith('shared:'+id+':'))delete state.progress[key];
  state.settings.groups=state.settings.groups.filter(g=>categoryCatalog(state).some(c=>c.name===g));persist();renderHome();
 },
 copy(pack){
  if(!usable())return 0;const p=planImport(state,{valid:pack.words.map(([word,meaning])=>({word,meaning,group:pack.title,id:'word:'+word})),errors:[]},false);
  const n=applyImport(state,p);if(n){selectCategories(state,[pack.title]);persist();renderHome();renderGroups();renderWords();}return n;
 }
});
