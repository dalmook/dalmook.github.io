/* Non-destructive presentation upgrade: existing controls, sessions and saves remain authoritative. */
export function installActionUI(){
 if(typeof document==='undefined'||document.documentElement.classList.contains('action-v2'))return;
 const $=s=>document.querySelector(s),panel=$('.question-panel');if(!panel||!$('#arenaCanvas'))return;
 document.documentElement.classList.add('action-v2');document.documentElement.dataset.toriVersion='2.0.0';
 const board=document.createElement('div');board.className='math-board';
 for(const sel of ['.question-top','.question-progress','.question-prompt']){const node=$(sel);if(node)board.append(node);}
 const eq=document.createElement('div');eq.className='equation-line';eq.append($('#expression'),$('.answer-row'));board.append(eq,$('#feedback'));
 const hint=$('#hintBox');board.append(hint);
 const deck=document.createElement('div');deck.className='control-deck';deck.setAttribute('aria-label','정답 키패드와 스킬');
 for(const sel of ['.skillbar','#keypad','#submitButton','#hintButton']){const node=$(sel);if(node)deck.append(node);}
 panel.append(board,deck);
 const meter=document.createElement('div');meter.id='feverHud';meter.className='fever-hud';meter.innerHTML='<span class="fever-label">별빛 에너지</span><strong id="feverName">한 문제부터, 출발!</strong><div class="fever-track"><i id="feverFill"></i></div><span id="feverHint">맞힐수록 무대와 음악이 더 신나져!</span>';
 $('.arena-panel').append(meter);
 const phaseNames=['한 문제부터, 출발!','반짝이는 시작','연격 준비 완료','토리의 피버 타임','별빛 폭발!'];
 const phaseHints=['맞힐수록 무대와 음악이 더 신나져!','리듬에 베이스가 더해졌어!','비트가 뛰고, 별빛이 모여!','음악과 스킬이 더 강해졌어!','끝까지 가 보자, 토리와 함께!'];
 const markKey=key=>{const btn=[...document.querySelectorAll('[data-key]')].find(b=>b.dataset.key===key);if(btn){btn.classList.add('key-pop');setTimeout(()=>btn.classList.remove('key-pop'),140);}};
 document.addEventListener('keydown',e=>{if(!document.body.classList.contains('playing')||$('#dialog')?.open)return;markKey(e.key);});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(b)markKey(b.dataset.key);});
 document.addEventListener('tori:reset',()=>{document.body.dataset.fever='0';$('#feverName').textContent=phaseNames[0];$('#feverHint').textContent=phaseHints[0];$('#feverFill').style.width='0%';board.classList.remove('answer-hit');});
 document.addEventListener('tori:input',()=>{const a=$('#answer');a.classList.remove('digit-pop');void a.offsetWidth;a.classList.add('digit-pop');});
 document.addEventListener('tori:attack',({detail:d})=>{document.body.dataset.fever=String(d.phase);$('#feverName').textContent=phaseNames[d.phase];$('#feverHint').textContent=phaseHints[d.phase];$('#feverFill').style.width=Math.min(100,d.heat/10*100)+'%';board.classList.remove('answer-hit');void board.offsetWidth;board.classList.add('answer-hit');$('.arena-panel').dataset.lastSkill=d.kind;const slot=d.kind==='ultimate'?$('#ultimateButton'):document.querySelectorAll('.skill-slot')[d.kind==='normal'?0:1];if(slot){slot.classList.add('skill-fired');setTimeout(()=>slot.classList.remove('skill-fired'),650);}});
 document.addEventListener('tori:impact',()=>{document.body.classList.add('impact-frame');setTimeout(()=>document.body.classList.remove('impact-frame'),220);});
 const copy=$('.hero-copy h2');if(copy)copy.innerHTML='한 문제 풀 때마다,<br><em>토리가 깨어난다!</em>';
 const sub=$('.hero-copy>p');if(sub)sub.innerHTML='정답이면 돌진! 연속 정답이면 스킬 폭발!<br>하얀 토끼 토리와, 신나는 수학 액션.';
 const pill=$('.chapter-pill');if(pill)pill.innerHTML='<span class="live-dot"></span>토리의 수학탐험 · 액션 2.0';
 const preview=document.createElement('button');preview.id='previewAction';preview.className='preview-action';preview.textContent='✦ 토리의 스킬 보기';preview.addEventListener('click',()=>$('#homeCanvas')?.dispatchEvent(new Event('pointerdown')));$('.hero-art')?.append(preview);
 const ft=$('.floating-tag');if(ft)ft.textContent='귀는 팔랑, 정답은 팡팡!';
 const a=$('.hero-art canvas');if(a)a.setAttribute('aria-label','하얀 토끼 토리의 실시간 액션 미리보기');
 const note=document.createElement('span');note.className='version-stamp';note.textContent='액션 2.0';document.querySelector('footer')?.append(note);
 const dialog=$('#dialogContent');if(dialog)new MutationObserver(()=>{const p=dialog.querySelector('.about-copy')?.previousElementSibling;if(p&&p.textContent.includes('v1.0.0'))p.textContent='정답이 모험이 되는 순간 · v2.0.0 · 액션 무대';}).observe(dialog,{childList:true,subtree:true});
}
if(typeof document!=='undefined'){
 const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./action.css?v=2.0.0',import.meta.url).href;link.onload=installActionUI;document.head.append(link);
 // DOM construction happens after app.mjs has attached its original handlers.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installActionUI,{once:true});else queueMicrotask(installActionUI);
}
