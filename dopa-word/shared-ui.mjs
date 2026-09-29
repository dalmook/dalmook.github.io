import {PUBLIC_REPO,PUBLIC_SITE,CATALOG_PATH,publicPayload,validateCatalog,shareURL,decodeShare,issueBody,issueURL,validatePack,validPackID} from './shared-model.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const SOURCE='https://raw.githubusercontent.com/'+PUBLIC_REPO+'/main/'+CATALOG_PATH;
export function installSharing(api){
 let catalog={schema:1,updatedAt:'',packs:[]},incoming=null,loading=false,sourceLabel='',lastRefresh=0;
 const requested=new URLSearchParams(location.search).get('pack');
 const entryBase=()=>{const u=new URL(location.href);u.search='';u.hash='';return u.href;};
 function activePacks(){return catalog.packs.filter(p=>p.status==='public');}
 function localGroups(){return [...new Set(api.getState().custom.map(w=>w.group))];}
 function selectedPayload(){return publicPayload(api.getState(),$('share-category').value,$('share-title').value);}
 function resetResults(){$('share-link-result').hidden=true;$('publish-result').hidden=true;$('share-error').textContent='';$('share-consent').checked=false;consent();}
 function consent(){const yes=$('share-consent').checked&&!!$('share-category').value;$('make-share-link').disabled=!yes;$('prepare-publish').disabled=!yes;}
 function refreshPreview(){resetResults();try{const p=selectedPayload();$('share-count').textContent=p.words.length+'단어 · 영어·뜻과 공개 제목만 포함';$('share-preview').innerHTML=p.words.map(([w,m])=>'<div><b lang="en">'+esc(w)+'</b> — '+esc(m)+'</div>').join('');}catch(e){$('share-count').textContent='';$('share-preview').innerHTML='';$('share-error').textContent=e.message;}}
 function openShare(){
  if(!api.usable())return;const groups=localGroups();if(!groups.length){api.toast('먼저 내 단어를 등록해 주세요. 등록한 카테고리를 골라 공유할 수 있어요.');return;}
  const group=$('list-group').value||api.getState().settings.groups.find(g=>groups.includes(g))||groups[0];
  $('share-category').innerHTML=groups.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join('');
  $('share-category').value=groups.includes(group)?group:groups[0];$('share-title').value=$('share-category').value;refreshPreview();$('share-dialog').showModal();
 }
 async function copy(value,field){try{await navigator.clipboard.writeText(value);api.toast('복사했어요. 받는 사람에게 전달해 주세요.');}catch{field?.focus();field?.select();api.toast('복사가 차단되어 있어요. 선택된 내용을 길게 눌러 직접 복사해 주세요.');}}
 $('share-category').onchange=()=>{$('share-title').value=$('share-category').value;refreshPreview();};$('share-title').oninput=refreshPreview;$('share-consent').onchange=()=>{consent();if(!$('share-consent').checked){$('share-link-result').hidden=true;$('publish-result').hidden=true;}};
 $('make-share-link').onclick=()=>{
  if(!$('share-consent').checked)return;try{const url=shareURL(selectedPayload(),entryBase());$('share-url').value=url;$('share-link-result').hidden=false;$('share-error').textContent='';}catch(e){$('share-error').textContent=e.message;}
 };
 $('copy-share-link').onclick=()=>copy($('share-url').value,$('share-url'));
 $('native-share').onclick=async()=>{const url=$('share-url').value;if(!url)return;if(navigator.share){try{await navigator.share({title:$('share-title').value,text:'함께 배우는 도파드릴 영단어',url});}catch(e){if(e.name!=='AbortError')copy(url,$('share-url'));}}else copy(url,$('share-url'));};
 $('prepare-publish').onclick=()=>{
  if(!$('share-consent').checked)return;try{
   const p=selectedPayload(),existing=activePacks().find(x=>x.title===p.title&&x.owner==='dalmook'),target=issueURL(p);
   $('publish-body').value=issueBody(p);$('publish-result').hidden=false;$('share-error').textContent='';
   $('publish-github').href=existing?'https://github.com/'+PUBLIC_REPO+'/issues/'+existing.issue:target.url;
   $('publish-instructions').textContent=existing?'동일한 제목의 공개 단어장이 있어요. 아래 내용을 복사한 다음 GitHub의 원래 요청 본문을 수정해 주세요. 링크를 유지한 채 업데이트돼요.':target.paste?'단어가 많아 URL에 모두 넣지 않았어요. 아래 등록 내용을 복사한 다음 GitHub 요청 본문에 붙여 넣고 Submit new issue를 눌러 주세요.':'GitHub에서 내용이 채워진 요청을 확인한 다음 Submit new issue를 누르세요. 완료 댓글에 공개 링크가 표시돼요.';
   $('publish-github').textContent=existing?'기존 공개 요청 열기·수정 ↗':'GitHub에서 제출하기 ↗';
  }catch(e){$('share-error').textContent=e.message;}
 };
 $('copy-publish-body').onclick=()=>copy($('publish-body').value,$('publish-body'));
 for(const id of ['open-share','share-from-words','share-here'])$(id).onclick=openShare;
 async function readJSON(url){
  const response=await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  if(Number(response.headers.get('content-length'))>5000000)throw new Error('목록 크기 초과');
  const value=await response.text();if(value.length>5000000)throw new Error('목록 크기 초과');return validateCatalog(JSON.parse(value));
 }
 async function load(force=false){
  if(loading)return;if(!force&&Date.now()-lastRefresh<30000){render();return;}
  loading=true;$('refresh-shared').disabled=true;$('shared-status').textContent='공개 목록을 불러오는 중…';
  let ok=false;
  try{catalog=await readJSON(SOURCE+'?v='+Date.now());sourceLabel='최신 GitHub 공개 목록';ok=true;}
  catch{
   try{catalog=await readJSON('./shared/catalog.json?v='+Date.now());sourceLabel='사이트 배포 시점의 목록 · 최신 확인은 잠시 후 새로고침';ok=true;}
   catch{sourceLabel='공개 목록 연결을 확인하지 못했어요. 잠시 후 새로고침해 주세요. 보관본과 직접 받은 공유 링크는 계속 사용할 수 있어요.';}
  }
  if(ok)lastRefresh=Date.now();loading=false;$('refresh-shared').disabled=false;
  $('shared-status').textContent=sourceLabel+(ok?' · '+activePacks().length+'개 단어장':'');render();
 }
 function card(p,kind){
  const owner=kind==='published'?'GitHub 확인 · '+p.owner:kind==='cached'?'이 브라우저 보관본':'링크로 받은 내용 · 작성자 미확인';
  const publicLink=p.id.startsWith('p-')?entryBase()+'?pack='+p.id:'';
  return '<article class="shared-card" data-pack="'+esc(p.id)+'"><span class="shared-origin">'+esc(owner)+'</span><h3>'+esc(p.title)+'</h3><p class="small muted">'+p.words.length+'단어'+(p.updatedAt?' · '+esc(p.updatedAt.slice(0,10))+' · v'+p.version:'')+'</p>'+
   (kind==='incoming'?'<p class="shared-warning">링크에 들어 있는 단어장입니다. 공개 목록 등록이나 작성자 확인을 의미하지 않아요. 내용을 확인하고 학습하세요.</p>':'')+
   '<div class="menu-grid"><button class="sub-btn" data-shared-action="spell">⌨ 스펠링 전체 학습</button><button class="sub-btn" data-shared-action="choice">❶ 뜻 고르기 전체 학습</button></div>'+
   '<details'+(requested===p.id||kind==='incoming'?' open':'')+'><summary>단어와 뜻 '+p.words.length+'개 보기</summary><div class="shared-words">'+p.words.map(([w,m])=>'<div><b lang="en">'+esc(w)+'</b><span>'+esc(m)+'</span></div>').join('')+'</div></details>'+
   '<div class="shared-footer">'+(publicLink?'<button class="text-btn" data-shared-action="link">공개 링크 복사</button>':'')+'<button class="text-btn" data-shared-action="copy">내 단어장에 복사</button>'+
   (p.issue?'<a href="https://github.com/'+PUBLIC_REPO+'/issues/'+p.issue+'" target="_blank" rel="noopener noreferrer">등록 내용·수정·내리기 ↗</a>':'')+
   (kind==='cached'?'<button class="text-btn" data-shared-action="forget">보관본 지우기</button>':'')+'</div></article>';
 }
 function findPack(id){return activePacks().find(p=>p.id===id)||(incoming?.id===id?incoming:null)||(api.getState().sharedPacks||[]).find(p=>p.id===id);}
 function render(){
  const term=$('shared-search').value.trim().toLowerCase(),matches=activePacks().filter(p=>p.title.toLowerCase().includes(term));
  matches.sort((a,b)=>Number(b.id===requested)-Number(a.id===requested));
  $('incoming-pack').innerHTML=incoming?card(incoming,'incoming'):'';
  $('shared-list').innerHTML=matches.map(p=>card(p,'published')).join('')||'<p class="empty">표시할 공개 단어장이 없어요.<br>등록 후에는 공개 목록을 새로고침해 주세요.</p>';
  if(requested&&!activePacks().some(p=>p.id===requested)){
   const withdrawn=catalog.packs.some(p=>p.id===requested&&p.status==='withdrawn');
   $('shared-list').insertAdjacentHTML('afterbegin','<p class="shared-warning">'+(withdrawn?'요청한 단어장은 공개 목록에서 내려갔어요.':'요청한 공개 단어장을 아직 찾지 못했어요. 등록 완료 댓글을 확인하거나 목록을 새로고침해 주세요.')+'</p>');
  }
  const shown=new Set([...activePacks().map(p=>p.id),...(incoming?[incoming.id]:[])]),cached=(api.getState().sharedPacks||[]).filter(p=>!shown.has(p.id));
  $('saved-shared-heading').hidden=!cached.length;$('saved-shared-list').innerHTML=cached.map(p=>card(p,'cached')).join('');
 }
 $('screen-shared').addEventListener('click',async e=>{
  const btn=e.target.closest('[data-shared-action]');if(!btn)return;const p=findPack(btn.closest('[data-pack]').dataset.pack);if(!p)return;
  try{const action=btn.dataset.sharedAction;
   if(['spell','choice'].includes(action)){api.study(validatePack(p),action);return;}
   if(action==='link'){await copy(entryBase()+'?pack='+p.id);return;}
   if(action==='forget'){if(confirm('이 기기의 보관본과 그 단어장의 개인 학습 기록을 지울까요? 공개 원본은 지우지 않습니다.')){api.forget(p.id);render();}return;}
   if(action==='copy'&&confirm('단어와 뜻을 내 단어장에 복사할까요? 이미 있는 영어 단어는 덮어쓰지 않고 건너뜁니다.')){const n=api.copy(p);api.toast(n+'개를 내 단어장에 복사했어요. 같은 영어가 있으면 기존 뜻을 보존했어요.');}
  }catch(err){api.toast(err.message);}
 });
 function open(){api.setView('shared');render();load();}
 $('open-shared').onclick=open;$('refresh-shared').onclick=()=>load(true);$('shared-search').oninput=render;
 window.__word.sharing={load,open,get catalog(){return catalog;},get incoming(){return incoming;}};
 if(location.hash.startsWith('#words=')){
  api.setView('shared');$('shared-status').textContent='공유 링크를 읽는 중…';
  decodeShare(location.hash).then(pack=>{incoming=pack;render();$('shared-status').textContent='링크 내용을 불러왔어요. 로그인 없이 바로 학습할 수 있어요.';}).catch(err=>{$('shared-status').textContent=err.message;render();});
 }else if(requested){api.setView('shared');if(validPackID(requested))load();else $('shared-status').textContent='단어장 링크의 번호가 올바르지 않아요.';}
 else if(new URLSearchParams(location.search).get('view')==='shared'){open();}
 document.documentElement.dataset.sharingReady='true';
}
