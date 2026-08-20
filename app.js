(() => {
  'use strict';

  const games = Array.isArray(window.HP_GAMES) ? window.HP_GAMES : [];
  const STORAGE_KEY = 'heypapa-player-v1';
  const THEME_KEY = 'heypapa-theme-v1';
  const SEOUL_TZ = 'Asia/Seoul';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  let query = params.get('q') || '';
  let category = '전체';
  let favoritesOnly = false;
  let deferredInstallPrompt = null;

  const fallbackState = () => ({
    favorites: [],
    recent: [],
    playsByGame: {},
    visitDates: [],
    rewardedDates: {},
    dailyCompleted: {},
    xp: 0,
    totalPlays: 0,
    streak: 0
  });

  function loadState() {
    const fallback = fallbackState();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const state = { ...fallback, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
      state.favorites = Array.isArray(state.favorites) ? state.favorites.filter(id => games.some(game => game.id === id)) : [];
      state.recent = Array.isArray(state.recent) ? state.recent.filter(id => games.some(game => game.id === id)) : [];
      state.visitDates = Array.isArray(state.visitDates) ? [...new Set(state.visitDates.filter(Boolean))].slice(-60) : [];
      state.playsByGame = state.playsByGame && typeof state.playsByGame === 'object' ? state.playsByGame : {};
      state.rewardedDates = state.rewardedDates && typeof state.rewardedDates === 'object' ? state.rewardedDates : {};
      state.dailyCompleted = state.dailyCompleted && typeof state.dailyCompleted === 'object' ? state.dailyCompleted : {};
      return state;
    } catch (error) {
      console.debug('Local player data could not be read', error);
      return fallback;
    }
  }

  const state = loadState();

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.debug('Local player data could not be saved', error); }
  }

  function track(name, data = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', name, data);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function dateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: SEOUL_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${map.year}-${map.month}-${map.day}`;
  }

  function shiftDateKey(key, amount) {
    const date = new Date(`${key}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  }

  function calculateStreak(keys) {
    const set = new Set(keys);
    let cursor = dateKey();
    let streak = 0;
    while (set.has(cursor)) {
      streak += 1;
      cursor = shiftDateKey(cursor, -1);
    }
    return streak;
  }

  function registerVisit() {
    const today = dateKey();
    if (!state.visitDates.includes(today)) state.visitDates.push(today);
    state.visitDates = [...new Set(state.visitDates)].sort().slice(-60);
    state.streak = calculateStreak(state.visitDates);
    const rewards = Array.isArray(state.rewardedDates[today]) ? state.rewardedDates[today] : [];
    if (!rewards.includes('visit')) {
      rewards.push('visit');
      state.rewardedDates[today] = rewards;
      state.xp = Number(state.xp || 0) + 3;
    }
    saveState();
  }

  function dailyGame() {
    if (!games.length) return null;
    const key = dateKey();
    let hash = 2166136261;
    for (const character of key) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return games[Math.abs(hash) % games.length];
  }

  function toast(message) {
    const region = $('#toast-region');
    if (!region) return;
    const element = document.createElement('div');
    element.className = 'toast';
    element.textContent = message;
    region.appendChild(element);
    setTimeout(() => element.remove(), 2500);
  }

  function readTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'auto'; }
    catch { return 'auto'; }
  }

  function applyTheme(preference = readTheme(), persist = true) {
    const resolved = preference === 'auto'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = resolved;
    if (persist) {
      try { localStorage.setItem(THEME_KEY, preference); } catch {}
    }
    const toggle = $('#theme-toggle');
    if (toggle) {
      toggle.textContent = resolved === 'dark' ? '☀' : '◐';
      toggle.setAttribute('aria-label', resolved === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환');
    }
  }

  function renderDaily() {
    const game = dailyGame();
    if (!game) return;
    const date = new Intl.DateTimeFormat('ko-KR', {
      timeZone: SEOUL_TZ, month: 'long', day: 'numeric', weekday: 'short'
    }).format(new Date());
    $('#daily-date').textContent = date;
    $('#daily-visual').textContent = game.emoji;
    $('#daily-title').textContent = game.title;
    $('#daily-description').textContent = game.description;
    const link = $('#daily-link');
    link.href = `play.html?game=${encodeURIComponent(game.id)}&from=daily`;
    link.onclick = () => track('daily_challenge_open', { game_id: game.id, game_name: game.title });
  }

  function renderStats() {
    $('#streak-count').textContent = Number(state.streak || 0).toLocaleString('ko-KR');
    $('#xp-count').textContent = Number(state.xp || 0).toLocaleString('ko-KR');
    $('#play-count').textContent = Number(state.totalPlays || 0).toLocaleString('ko-KR');
    $('#favorite-count').textContent = state.favorites.length.toLocaleString('ko-KR');
  }

  function renderFilters() {
    const categories = ['전체', ...new Set(games.map(game => game.category))];
    const container = $('#category-filters');
    container.innerHTML = categories.map(item => `
      <button class="filter-chip" type="button" data-category="${escapeHtml(item)}" aria-pressed="${item === category}">${escapeHtml(item)}</button>
    `).join('');
    container.onclick = event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      category = button.dataset.category;
      $$('.filter-chip', container).forEach(chip => chip.setAttribute('aria-pressed', chip === button ? 'true' : 'false'));
      renderGames();
      track('game_filter', { category });
    };
  }

  function filteredGames() {
    const term = query.trim().toLocaleLowerCase('ko-KR');
    return games.filter(game => {
      const categoryMatch = category === '전체' || game.category === category;
      const favoriteMatch = !favoritesOnly || state.favorites.includes(game.id);
      const haystack = [game.title, game.category, game.description, game.benefit, game.age].join(' ').toLocaleLowerCase('ko-KR');
      return categoryMatch && favoriteMatch && (!term || haystack.includes(term));
    });
  }

  function cardTemplate(game) {
    const favorite = state.favorites.includes(game.id);
    const ownPlays = Number(state.playsByGame[game.id] || 0);
    return `
      <article class="game-card" data-game-id="${escapeHtml(game.id)}">
        <a class="game-card-main" href="play.html?game=${encodeURIComponent(game.id)}" aria-label="${escapeHtml(game.title)} 시작">
          <div class="game-card-image">
            <img src="${escapeHtml(game.image)}" alt="" loading="lazy" decoding="async" width="640" height="400">
            <div class="card-badges"><span class="category-badge">${escapeHtml(game.category)}</span></div>
          </div>
          <div class="game-card-body">
            <div class="game-card-title-row"><h3>${escapeHtml(game.title)}</h3><span class="game-emoji" aria-hidden="true">${game.emoji}</span></div>
            <p class="game-description">${escapeHtml(game.description)}</p>
            <div class="game-meta"><span>${escapeHtml(game.age)}</span><span>${escapeHtml(game.duration)}</span>${ownPlays ? `<span>내 기록 ${ownPlays}회</span>` : ''}</div>
            <div class="game-card-footer"><span class="benefit">${escapeHtml(game.benefit)}</span><span class="play-link">게임 시작 →</span></div>
          </div>
        </a>
        <button class="favorite-button" type="button" data-favorite="${escapeHtml(game.id)}" aria-label="${escapeHtml(game.title)} 즐겨찾기" aria-pressed="${favorite}">${favorite ? '♥' : '♡'}</button>
      </article>`;
  }

  function renderGames() {
    const list = filteredGames();
    const grid = $('#game-list');
    grid.innerHTML = list.map(cardTemplate).join('');
    $('#result-count').textContent = `${list.length}개의 게임`;
    $('#empty-state').hidden = list.length > 0;
    grid.hidden = list.length === 0;

    $$('.game-card-main', grid).forEach(link => link.addEventListener('click', () => {
      const gameId = link.closest('[data-game-id]')?.dataset.gameId;
      const game = games.find(item => item.id === gameId);
      if (game) track('game_card_click', { game_id: game.id, game_name: game.title, category: game.category });
    }));

    $$('[data-favorite]', grid).forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(button.dataset.favorite);
    }));
  }

  function toggleFavorite(gameId) {
    const game = games.find(item => item.id === gameId);
    if (!game) return;
    const index = state.favorites.indexOf(gameId);
    if (index >= 0) {
      state.favorites.splice(index, 1);
      toast(`${game.title} 즐겨찾기를 해제했어요`);
    } else {
      state.favorites.unshift(gameId);
      state.xp = Number(state.xp || 0) + 1;
      toast(`${game.title}을 즐겨찾기에 담았어요 ♥`);
    }
    saveState();
    renderStats();
    renderGames();
    track('favorite_toggle', { game_id: gameId, enabled: index < 0 });
  }

  function setupSearch() {
    const input = $('#game-search');
    input.value = query;
    input.addEventListener('input', () => { query = input.value; renderGames(); });
    input.addEventListener('search', () => renderGames());
    document.addEventListener('keydown', event => {
      if (event.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        event.preventDefault();
        input.focus();
      }
    });
  }

  function setupActions() {
    $('#random-game').addEventListener('click', () => {
      const filtered = filteredGames();
      const pool = filtered.length ? filtered : games;
      const game = pool[Math.floor(Math.random() * pool.length)];
      if (!game) return;
      track('random_game', { game_id: game.id, game_name: game.title });
      location.href = `play.html?game=${encodeURIComponent(game.id)}&from=random`;
    });

    const continueButton = $('#continue-game');
    const lastGame = games.find(game => game.id === state.recent[0]);
    if (lastGame) {
      continueButton.hidden = false;
      continueButton.textContent = `▶ ${lastGame.title} 이어서`;
      continueButton.addEventListener('click', () => {
        location.href = `play.html?game=${encodeURIComponent(lastGame.id)}&from=continue`;
      });
    }

    $('#favorites-only').addEventListener('click', event => {
      favoritesOnly = !favoritesOnly;
      event.currentTarget.setAttribute('aria-pressed', String(favoritesOnly));
      renderGames();
      track('favorites_filter', { enabled: favoritesOnly });
    });

    $('#reset-filter').addEventListener('click', () => {
      category = '전체';
      query = '';
      favoritesOnly = false;
      $('#game-search').value = '';
      $('#favorites-only').setAttribute('aria-pressed', 'false');
      renderFilters();
      renderGames();
    });

    $('#theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.dataset.theme;
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    $('#share-site').addEventListener('click', async () => {
      const data = { title: '혜이파파 플레이', text: '아이와 함께 즐기는 무료 웹게임 놀이터', url: location.origin + location.pathname };
      try {
        if (navigator.share) await navigator.share(data);
        else if (navigator.clipboard) { await navigator.clipboard.writeText(data.url); toast('주소를 복사했어요'); }
        else { prompt('주소를 복사해 주세요', data.url); }
        track('share_site');
      } catch (error) {
        if (error?.name !== 'AbortError') toast('공유하지 못했어요');
      }
    });
  }

  function setupInstall() {
    const button = $('#install-app');
    addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      button.hidden = false;
      track('pwa_install_prompt');
    });
    button.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      track('pwa_install_choice', { outcome: choice.outcome });
      deferredInstallPrompt = null;
      button.hidden = true;
    });
    addEventListener('appinstalled', () => {
      button.hidden = true;
      toast('혜이파파를 홈 화면에 설치했어요 ✨');
      track('pwa_installed');
    });
  }

  function init() {
    if (!games.length) return;
    registerVisit();
    applyTheme(readTheme(), false);
    renderDaily();
    renderStats();
    renderFilters();
    setupSearch();
    renderGames();
    setupActions();
    setupInstall();
    $('#year').textContent = new Date().getFullYear();

    if (params.get('daily') === '1') $('#daily-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(error => console.debug('Service worker registration skipped', error));
    }
  }

  init();
})();
