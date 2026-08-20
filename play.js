(() => {
  'use strict';
  const games = Array.isArray(window.HP_GAMES) ? window.HP_GAMES : [];
  const params = new URLSearchParams(location.search);
  const game = games.find(item => item.id === params.get('game'));
  const STORAGE_KEY = 'heypapa-player-v1';
  const THEME_KEY = 'heypapa-theme-v1';
  const SEOUL_TZ = 'Asia/Seoul';
  const $ = selector => document.querySelector(selector);
  const startedAt = Date.now();
  let timerId;

  function todayKey() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone:SEOUL_TZ, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(({type,value}) => [type,value]));
    return `${map.year}-${map.month}-${map.day}`;
  }
  function fallbackState() { return { favorites:[], recent:[], playsByGame:{}, rewardedDates:{}, dailyCompleted:{}, xp:0, totalPlays:0 }; }
  function loadState() {
    const fallback=fallbackState();
    try {
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      const state={...fallback,...(parsed&&typeof parsed==='object'?parsed:{})};
      state.favorites=Array.isArray(state.favorites)?state.favorites:[];
      state.recent=Array.isArray(state.recent)?state.recent:[];
      state.playsByGame=state.playsByGame&&typeof state.playsByGame==='object'?state.playsByGame:{};
      state.rewardedDates=state.rewardedDates&&typeof state.rewardedDates==='object'?state.rewardedDates:{};
      state.dailyCompleted=state.dailyCompleted&&typeof state.dailyCompleted==='object'?state.dailyCompleted:{};
      return state;
    } catch { return fallback; }
  }
  function saveState(state) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch(error) { console.debug('Local state was not saved',error); } }
  function track(name,data={}) { if(typeof window.gtag==='function') window.gtag('event',name,data); }
  function toast(message) { const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(el._timer);el._timer=setTimeout(()=>el.hidden=true,2300); }
  function dailyGame() { if(!games.length)return null;const key=todayKey();let hash=2166136261;for(const char of key){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return games[Math.abs(hash)%games.length]; }
  function setTheme() { let stored='auto';try{stored=localStorage.getItem(THEME_KEY)||'auto';}catch{}const theme=stored==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):stored;document.documentElement.dataset.theme=theme; }
  function recordOpen() {
    const state=loadState();const day=todayKey();
    state.totalPlays=Number(state.totalPlays||0)+1;
    state.playsByGame[game.id]=Number(state.playsByGame[game.id]||0)+1;
    state.recent=[game.id,...state.recent.filter(id=>id!==game.id)].slice(0,6);
    const rewardKey=`play:${game.id}`;
    const rewards=Array.isArray(state.rewardedDates[day])?state.rewardedDates[day]:[];
    if(!rewards.includes(rewardKey)){state.xp=Number(state.xp||0)+2;rewards.push(rewardKey);state.rewardedDates[day]=rewards;}
    saveState(state);
  }
  function updateFavoriteButton() { const state=loadState();const active=state.favorites.includes(game.id);const btn=$('#favorite-game');btn.textContent=active?'♥':'♡';btn.setAttribute('aria-pressed',String(active)); }
  function toggleFavorite() { const state=loadState();const index=state.favorites.indexOf(game.id);if(index>=0){state.favorites.splice(index,1);toast('즐겨찾기를 해제했어요');}else{state.favorites.unshift(game.id);state.xp=Number(state.xp||0)+1;toast('즐겨찾기에 담았어요 ♥');}saveState(state);updateFavoriteButton();track('favorite_toggle',{game_id:game.id,enabled:index<0}); }
  function completeDaily() { const state=loadState();const day=todayKey();const btn=$('#complete-daily');if(state.dailyCompleted[day])return;state.dailyCompleted[day]=game.id;state.xp=Number(state.xp||0)+20;saveState(state);btn.textContent='✓ 오늘 도전 완료';btn.disabled=true;toast('20 XP를 받았어요! ✨');track('daily_challenge_complete',{game_id:game.id}); }
  function setupDaily() { if(dailyGame()?.id!==game.id)return;const state=loadState();const day=todayKey();const card=$('#mission-card');const btn=$('#complete-daily');card.hidden=false;if(state.dailyCompleted[day]){btn.textContent='✓ 오늘 도전 완료';btn.disabled=true;}btn.addEventListener('click',completeDaily); }
  function renderRecommendations() {
    const same=games.filter(item=>item.id!==game.id&&item.category===game.category);
    const other=games.filter(item=>item.id!==game.id&&!same.includes(item));
    const seed=game.id.split('').reduce((sum,char)=>sum+char.charCodeAt(0),0);
    const order=list=>[...list].sort((a,b)=>((a.id.length*seed+a.title.length)%19)-((b.id.length*seed+b.title.length)%19));
    const list=[...order(same),...order(other)].slice(0,3);
    $('#recommend-grid').innerHTML=list.map(item=>`<a class="recommend-card" href="play.html?game=${encodeURIComponent(item.id)}&from=recommend"><img src="${item.image}" alt="" loading="lazy" width="480" height="270"><div><h3>${item.emoji} ${item.title}</h3><p>${item.benefit} · ${item.duration}</p></div></a>`).join('');
  }
  function setupTimer() { const tick=()=>{const seconds=Math.floor((Date.now()-startedAt)/1000);$('#session-time').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};tick();timerId=setInterval(tick,1000);addEventListener('pagehide',()=>{clearInterval(timerId);const seconds=Math.round((Date.now()-startedAt)/1000);track('game_session_end',{game_id:game.id,engagement_time_sec:seconds});}); }
  async function shareGame() { const data={title:`${game.title} | 혜이파파 플레이`,text:game.description,url:location.href};try{if(navigator.share)await navigator.share(data);else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);toast('게임 주소를 복사했어요');}else prompt('주소를 복사해 주세요',location.href);track('share_game',{game_id:game.id});}catch(error){if(error?.name!=='AbortError')toast('공유하지 못했어요');} }
  function showNotFound() { document.body.innerHTML='<main style="min-height:100vh;display:grid;place-content:center;text-align:center;font-family:system-ui;padding:24px"><div style="font-size:64px">🛸</div><h1>게임을 찾지 못했어요</h1><p>잘못된 주소이거나 목록에서 빠진 게임이에요.</p><a href="./" style="color:#6d5dfc;font-weight:800">전체 게임으로 돌아가기</a></main>'; }
  function init() {
    setTheme();if(!game){showNotFound();return;}
    document.title=`${game.title} | 혜이파파 플레이`;
    $('#play-emoji').textContent=game.emoji;$('#play-title').textContent=game.title;$('#play-subtitle').textContent=`${game.category} · ${game.duration}`;
    $('#about-title').textContent=game.title;$('#about-description').textContent=game.description;$('#about-tip').textContent=game.tip||'결과보다 과정을 칭찬해 주세요.';
    $('#about-meta').innerHTML=[game.age,game.duration,game.level,game.benefit].map(value=>`<span>${value}</span>`).join('');
    $('#open-original').href=game.path;
    const frame=$('#game-frame');frame.src=game.path;frame.title=game.title;
    frame.addEventListener('load',()=>{frame.classList.add('ready');$('#loading-panel').hidden=true;});
    setTimeout(()=>{if(!frame.classList.contains('ready'))$('#loading-panel small').textContent='조금 오래 걸리고 있어요. 우측 상단 ↻ 버튼으로 다시 불러올 수 있어요.';},7000);
    recordOpen();updateFavoriteButton();setupDaily();renderRecommendations();setupTimer();
    $('#favorite-game').addEventListener('click',toggleFavorite);
    $('#reload-game').addEventListener('click',()=>{$('#loading-panel').hidden=false;frame.classList.remove('ready');const separator=game.path.includes('?')?'&':'?';frame.src=`${game.path}${separator}reload=${Date.now()}`;track('game_reload',{game_id:game.id});});
    $('#fullscreen-game').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#game-stage').requestFullscreen();}catch{toast('전체 화면을 열 수 없어요');}});
    $('#share-game').addEventListener('click',shareGame);
    track('game_open',{game_id:game.id,game_name:game.title,category:game.category,source:params.get('from')||'direct'});
    if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
  }
  init();
})();
