// Shared data contract. Plain word/meaning pairs only; never a local save dump.
export const SHARED_VERSION = 1;
export const MAX_PACK_WORDS = 500;
export const MAX_PAYLOAD_BYTES = 48000;
export const MAX_CATALOG_BYTES = 5000000;
export const MAX_CACHED_PACKS = 12;
export const PUBLIC_REPO = 'dalmook/dalmook.github.io';
export const PUBLIC_SITE = 'https://dalmook.github.io/dopa-word/';
export const CATALOG_PATH = 'dopa-word/shared/catalog.json';
export const ISSUE_PREFIX = '[단어공개]';
const size = value => new TextEncoder().encode(value).length;
const text = value => typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/g, ' ') : '';
const bad = /[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069\ufffd]/;
function keys(obj,allowed){return Object.keys(obj).every(k=>allowed.includes(k));}
export function validatePayload(raw) {
  if (!raw || Array.isArray(raw) || raw.v !== 1 || !keys(raw,['v','title','words'])) throw new Error('공개 단어장 형식이 올바르지 않아요. 앱에서 다시 만들어 주세요.');
  const title = text(raw.title);
  if (!title || title.length > 30 || bad.test(raw.title)) throw new Error('공개 제목은 1~30자의 일반 글자로 적어 주세요.');
  if (!Array.isArray(raw.words) || !raw.words.length || raw.words.length > MAX_PACK_WORDS) throw new Error('공개 단어장은 1~500개 단어로 나누어 주세요.');
  const seen=new Set();
  const words=raw.words.map(pair=>{
    if (!Array.isArray(pair)||pair.length!==2||pair.some(v=>typeof v!=='string'||bad.test(v))) throw new Error('영어와 뜻만 있는 두 칸의 단어 데이터가 필요해요.');
    const word=text(pair[0]).replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,'-').toLowerCase(), meaning=text(pair[1]);
    if (word.length>40||!/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)||!meaning||meaning.length>100) throw new Error('영어는 40자, 뜻은 100자 이내로 확인해 주세요.');
    if(seen.has(word)) throw new Error('같은 영어 단어가 두 번 들어 있어요.');
    seen.add(word);return [word,meaning];
  });
  const value={v:1,title,words};
  if(size(JSON.stringify(value))>MAX_PAYLOAD_BYTES)throw new Error('공개 데이터가 너무 커요. 카테고리를 나누어 주세요.');
  return value;
}
export function publicPayload(state,group,title=group){
  return validatePayload({v:1,title,words:state.custom.filter(w=>w.group===group).map(w=>[w.word,w.meaning])});
}
export const validPackID=id=>typeof id==='string'&&/^(p-[1-9]\d{0,14}|link-[a-f0-9]{24})$/.test(id);
export function validatePack(raw){
  if(!raw||!validPackID(raw.id))throw new Error('공개 단어장 번호가 올바르지 않아요.');
  const data=validatePayload({v:1,title:raw.title,words:raw.words});
  const issue=Number(raw.issue||0);
  if(raw.id.startsWith('p-')&&(!Number.isSafeInteger(issue)||issue<1||raw.id!=='p-'+issue))throw new Error('공개 등록 번호가 일치하지 않아요.');
  const owner=typeof raw.owner==='string'&&/^[a-zA-Z0-9-]{1,39}$/.test(raw.owner)?raw.owner:'';
  const updatedAt=typeof raw.updatedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(raw.updatedAt)&&Number.isFinite(Date.parse(raw.updatedAt))?raw.updatedAt:'';
  return {...data,id:raw.id,owner,issue,version:Number.isSafeInteger(raw.version)&&raw.version>0?raw.version:1,updatedAt};
}
export function validateCatalog(raw){
  if(!raw||raw.schema!==1||!Array.isArray(raw.packs)||raw.packs.length>100||size(JSON.stringify(raw))>MAX_CATALOG_BYTES)throw new Error('공개 목록 형식이나 크기를 확인해 주세요.');
  const ids=new Set();const packs=raw.packs.map(p=>{
    if(!validPackID(p?.id)||!p.id.startsWith('p-')||ids.has(p.id))throw new Error('공개 목록의 단어장 번호가 겹치거나 잘못되었어요.');ids.add(p.id);
    if(p.status==='withdrawn')return {id:p.id,status:'withdrawn',version:Number.isSafeInteger(p.version)&&p.version>0?p.version:1};
    return {...validatePack(p),status:'public'};
  });
  return {schema:1,updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:'',packs};
}
export function sharedGroup(pack){return ((pack.id.startsWith('p-')?'공개 #'+pack.issue:'공유 '+pack.id.slice(5,17))+' · '+pack.title).slice(0,30);}
export function packWords(pack){
  const p=validatePack(pack),group=sharedGroup(p);
  return p.words.map(([word,meaning])=>({id:'shared:'+p.id+':'+word,word,meaning,group,origin:'shared',packId:p.id,level:word.replace(/[^a-z]/g,'').length<=4?1:word.replace(/[^a-z]/g,'').length<=6?2:3}));
}
export function rememberPack(state,raw){
  const p=validatePack(raw);state.sharedPacks||=[];
  if(!state.sharedPacks.some(x=>x.id===p.id)&&state.sharedPacks.length>=MAX_CACHED_PACKS)throw new Error('보관한 공개 단어장이 12개예요. 더 받으려면 백업 후 이전 보관본을 정리해 주세요.');
  const old=state.sharedPacks.find(x=>x.id===p.id);
  if(old){for(const [word,meaning]of old.words){if(!p.words.some(x=>x[0]===word&&x[1]===meaning))delete state.progress['shared:'+p.id+':'+word];}}
  state.sharedPacks=state.sharedPacks.filter(x=>x.id!==p.id);state.sharedPacks.push(p);return p;
}
function base64url(bytes){let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function shareURL(payload,base=PUBLIC_SITE){
  const data=JSON.stringify(validatePayload(payload)),url=new URL(base);url.search='';url.hash='words='+base64url(new TextEncoder().encode(data));
  if(url.href.length>12000)throw new Error('링크에 담기에는 단어가 많아요. 공개 목록에 등록하거나 카테고리를 작게 나누어 주세요.');return url.href;
}
export async function decodeShare(hash){
  if(typeof hash!=='string'||!hash.startsWith('#words=')||hash.length>12010)throw new Error('단어장 공유 링크가 올바르지 않아요.');
  const code=hash.slice(7);if(!/^[A-Za-z0-9_-]+$/.test(code))throw new Error('공유 링크가 잘렸거나 잘못되었어요.');
  let payload;try{const bin=atob(code.replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));payload=validatePayload(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}catch(e){throw new Error('공유 링크의 단어 데이터를 읽을 수 없어요. 링크 전체를 다시 받아 주세요.');}
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));const id='link-'+Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,24);
  return validatePack({...payload,id,owner:'',issue:0,version:1,updatedAt:''});
}
export function issueBody(payload){return '선택한 단어와 뜻을 공개 단어장으로 게시합니다. 개인 기록은 포함하지 않습니다.\n\n```dopa-word\n'+JSON.stringify(validatePayload(payload))+'\n```\n';}
export function parseIssueBody(body){
  if(typeof body!=='string'||size(body)>60000)throw new Error('요청 본문이 너무 크거나 비어 있어요.');
  const blocks=[...body.matchAll(/```dopa-word[ \t]*\r?\n([\s\S]*?)\r?\n```/g)];
  if(blocks.length!==1)throw new Error('앱에서 복사한 dopa-word 블록을 한 개만 붙여 넣어 주세요.');
  let json;try{json=JSON.parse(blocks[0][1]);}catch{throw new Error('단어 JSON을 읽지 못했어요. 앱에서 다시 복사해 주세요.');}return validatePayload(json);
}
export function issueURL(payload){
  const p=validatePayload(payload),u=new URL('https://github.com/'+PUBLIC_REPO+'/issues/new');u.searchParams.set('title',ISSUE_PREFIX+' '+p.title);u.searchParams.set('body',issueBody(p));
  if(u.href.length<=7500)return {url:u.href,paste:false};
  u.searchParams.delete('body');u.searchParams.set('body','앱에서 복사한 공개 단어장 내용을 아래에 붙여 넣고 제출해 주세요.');return {url:u.href,paste:true};
}
// Deterministic, author-checked transformation shared by tests and Actions.
export function applyIssue(rawCatalog,issue,{actorID,ownerID,ownerLogin,now=new Date().toISOString()}){
  const catalog=validateCatalog(rawCatalog);
  if(!Number.isSafeInteger(ownerID)||actorID!==ownerID||issue?.user?.id!==ownerID)throw new Error('공개 목록 등록·수정은 저장소 소유자 계정만 할 수 있어요.');
  if(!Number.isSafeInteger(issue.number)||issue.number<1||!String(issue.title).startsWith(ISSUE_PREFIX))throw new Error('공개 단어장 요청이 아니에요.');
  const id='p-'+issue.number,existing=catalog.packs.find(x=>x.id===id);
  if(issue.state==='closed'){
    if(!existing||existing.status==='withdrawn')return {catalog,changed:false,id,withdrawn:true};
    return {catalog:{schema:1,updatedAt:now,packs:catalog.packs.map(p=>p.id===id?{id,status:'withdrawn',version:p.version}:p)},changed:true,id,withdrawn:true};
  }
  if(issue.state!=='open')throw new Error('열린 공개 등록 요청만 게시할 수 있어요.');
  const data=parseIssueBody(issue.body),pack={...data,id,owner:ownerLogin,issue:issue.number,version:(existing?.version||0)+1,updatedAt:now,status:'public'};
  if(existing?.status==='public'&&JSON.stringify([existing.title,existing.words])===JSON.stringify([data.title,data.words]))return {catalog,changed:false,id,withdrawn:false};
  if(!existing&&catalog.packs.length>=100)throw new Error('공개 단어장 100개 한도에 도달했어요. 운영자가 목록을 정리해야 해요.');
  const next={schema:1,updatedAt:now,packs:[...catalog.packs.filter(x=>x.id!==id),pack]};validateCatalog(next);return {catalog:next,changed:true,id,withdrawn:false};
}
