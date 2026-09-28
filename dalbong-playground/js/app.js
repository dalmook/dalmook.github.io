import { state, save, visit } from "./storage.js";
import { recommend, eligible, shuffle } from "./filters.js";
import { mountPicker } from "./pickers.js";
import { mountShorts } from "./shorts-player.js";
const main = document.querySelector("main");
let games = [],
  categories = [],
  cleanup = () => {},
  filters = { ...state.filters },
  query = "",
  category = "",
  tab = "all",
  limit = 24,
  audio;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const find = (id) => games.find((g) => g.id === id);
const cat = (id) => categories.find((c) => c.id === id);
const btn = (label, href, cls = "") =>
  `<a class="button ${cls}" href="${href}">${label}</a>`;
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3000);
}
function ping() {
  if (!state.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    [523, 659, 784].forEach((f, i) => {
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.connect(g);
      g.connect(audio.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.055, audio.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + i * 0.1 + 0.22,
      );
      o.start(audio.currentTime + i * 0.1);
      o.stop(audio.currentTime + i * 0.1 + 0.23);
    });
  } catch {}
}
function celebrate() {
  ping();
  navigator.vibrate?.([30, 30, 60]);
  const c = document.querySelector("#confetti");
  c.innerHTML = Array.from(
    { length: 30 },
    (_, i) =>
      `<i style="--x:${Math.random() * 100}vw;--delay:${Math.random() * 0.4}s;--color:${["#e8ad75", "#83ab83", "#b09ac8", "#f0d27b"][i % 4]}"></i>`,
  ).join("");
  setTimeout(() => c.replaceChildren(), 2300);
}
function count() {
  document.querySelector("#fav-count").textContent = state.favorites.length;
}
function favorite(id) {
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((x) => x !== id)
    : [...state.favorites, id];
  if (!save())
    toast("이 브라우저에서는 저장할 수 없어요. 현재 창에서만 유지돼요.");
  count();
  document.querySelectorAll(`[data-favorite="${id}"]`).forEach((b) => {
    const yes = state.favorites.includes(id);
    b.classList.toggle("saved", yes);
    b.setAttribute("aria-pressed", yes);
    b.textContent = yes ? "♥" : "♡";
  });
}
function card(g, match = "") {
  return `<article class="game-card"><a href="#game/${g.id}" class="card-image" style="background:${cat(g.category).color}"><img src="${g.thumbnail}" alt="${esc(g.title)} 놀이 일러스트" loading="lazy" width="500" height="380"><span class="play-pill">▷ 움직이는 놀이 설명</span></a><button class="favorite ${state.favorites.includes(g.id) ? "saved" : ""}" aria-label="${esc(g.title)} 즐겨찾기" aria-pressed="${state.favorites.includes(g.id)}" data-favorite="${g.id}">${state.favorites.includes(g.id) ? "♥" : "♡"}</button><div class="card-body"><small class="category-label">${cat(g.category).title}${g.materials.length ? "" : " · 준비물 없이"}</small><a href="#game/${g.id}"><h3>${g.title}</h3></a><p>${g.subtitle}</p><div class="card-meta"><span>♧ ${g.minPlayers}–${g.maxPlayers}명</span><span>◷ ${g.durationMin}분</span><span>${g.activityLevel === "높음" ? "↗ 활기차게" : g.activityLevel === "낮음" ? "☁ 차분하게" : "↝ 가볍게"}</span></div>${match ? `<small class="match">${match}</small>` : ""}</div></article>`;
}
function heading(eyebrow, title, copy = "") {
  return `<div class="page-heading"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${copy ? `<p>${copy}</p>` : ""}</div>`;
}
function select(name, label, options) {
  return `<label class="filter-field">${label}<select name="${name}"><option value="">상관없어요</option>${options.map(([value, text]) => `<option value="${value}" ${filters[name] === value ? "selected" : ""}>${text}</option>`).join("")}</select></label>`;
}
function filterForm() {
  return `<form id="filters"><div class="filter-grid">${select(
    "place",
    "어디에서?",
    ["집", "거실", "교실", "놀이터", "운동장", "공원", "실내", "야외"].map(
      (x) => [x, x],
    ),
  )}${select("players", "몇 명이서?", [
    ["2", "2명"],
    ["3", "3명"],
    ["4", "4명"],
    ["5", "5명"],
    ["6", "6명"],
    ["8", "8명"],
    ["10", "10명"],
    ["12", "12명"],
    ["16", "16명"],
    ["20", "20명 · 단체"],
  ])}${select("duration", "얼마나?", [
    ["5", "5분 이내"],
    ["10", "10분 이내"],
    ["20", "20분 이상"],
  ])}${select("materials", "준비물은?", [["none", "준비물 없이"]])}</div><details class="more-filters"><summary>활동량 · 소음 · 연령 · 팀전 조건 더 보기</summary><div class="filter-grid">${select(
    "activity",
    "활동량",
    ["낮음", "보통", "높음"].map((x) => [x, x]),
  )}${select(
    "noise",
    "소음도",
    ["낮음", "보통", "높음"].map((x) => [x, x]),
  )}${select("age", "가장 어린 친구", [
    ["6", "6세"],
    ["7", "7세"],
    ["8", "8세"],
    ["10", "10세 이상"],
  ])}${select("team", "팀전", [["yes", "팀전 가능한 놀이"]])}${select("safe", "안전도", [["yes", "위험도 낮은 놀이"]])}</div></details><div class="filter-actions"><button class="button primary" type="submit">딱 맞는 놀이 찾기 ↗</button><button class="text-button" type="button" id="save-filters">이 조건 저장</button><button class="text-button" type="button" id="reset-filters">초기화</button></div></form>`;
}
function bindFilters() {
  const form = document.querySelector("#filters");
  if (!form) return;
  const collect = () => Object.fromEntries(new FormData(form));
  form.onsubmit = (e) => {
    e.preventDefault();
    filters = collect();
    if (location.hash === "#library") library();
    else location.hash = "#library";
  };
  document.querySelector("#save-filters").onclick = () => {
    filters = collect();
    state.filters = filters;
    toast(
      save() ? "다음에도 이 조건으로 만나요!" : "저장이 제한된 브라우저예요.",
    );
  };
  document.querySelector("#reset-filters").onclick = () => {
    filters = {};
    form.reset();
    form.querySelectorAll("select").forEach((s) => (s.value = ""));
    if (location.hash === "#library") library();
  };
}
function home() {
  const day = Math.floor(Date.now() / 86400000),
    daily = games[day % games.length];
  main.innerHTML = `<section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i> 오늘도, 같이 놀자!</span><h1>오늘 뭐 하고 <br><em>놀까?</em><span class="hand-star">✳</span></h1><p>골목에서 뛰놀던 그 설렘 그대로.<br>달봉이와 찾는 우리들의 다음 놀이!</p><div class="hero-buttons">${btn("나에게 맞는 놀이 찾기 ↗", "#library", "primary")}${btn("운명에 맡겨볼까? ↻", "#pick/wheel", "outline")}</div><div class="hero-note"><span class="tiny-faces">● ● ●</span><span><strong>62가지 놀이</strong>와 매일 새로운 추억</span></div></div><div class="hero-art"><span class="floating-note">준비됐어? 같이 놀자! <b>☺</b></span><img src="assets/images/hero.svg" alt="달봉이와 친구들이 나무와 작은 집이 있는 풀밭에서 노는 모습" width="640" height="450"><span class="hero-stamp">100%<br><b>함께 노는 즐거움</b></span></div></section><section class="quick-filter"><div><span class="eyebrow">LET’S FIND YOUR PLAY</span><h2>지금, 우리에게 딱 맞는 놀이</h2></div>${filterForm()}<button class="quick-link" data-preset="quick">✦ 4명 · 놀이터 · 10분으로 바로 추천 →</button></section><section><div class="section-title"><div><span class="eyebrow">PICK YOUR FUN</span><h2>고르는 순간부터 재밌게!</h2></div><p>어떤 방법으로 골라볼까?</p></div><div class="picker-grid">${[
    ["wheel", "◉", "돌림판", "빙글빙글, 오늘의 운명은?"],
    ["dice", "⚄", "주사위", "데굴데굴, 설렘 한 스푼"],
    ["ladder", "⑂", "사다리타기", "따라가면 만나는 뜻밖의 놀이"],
    ["card", "▧", "카드 뽑기", "두근두근, 한 장의 발견"],
  ]
    .map(
      ([id, icon, title, desc], i) =>
        `<a class="picker-tile tile-${i}" href="#pick/${id}"><span class="picker-graphic">${icon}</span><div><h3>${title} <span>↗</span></h3><p>${desc}</p></div></a>`,
    )
    .join(
      "",
    )}</div></section><section class="daily-banner"><div class="daily-picture"><img src="${daily.thumbnail}" alt="${daily.title}" loading="lazy"></div><div><span class="eyebrow">TODAY’S LITTLE ADVENTURE</span><h2>오늘의 미션, ${daily.title}</h2><p>${daily.subtitle} 오늘은 친구 한 명에게 먼저 같이 놀자고 말해볼까요?</p>${btn("오늘의 놀이 만나기 →", `#game/${daily.id}`, "outline")}</div><span class="daily-number">DAY<br><b>${String((day % 365) + 1).padStart(3, "0")}</b></span></section><section><div class="section-title"><div><span class="eyebrow">OUR ALL-TIME FAVORITES</span><h2>언제 해도 즐거운, 우리 놀이</h2></div><a class="text-link" href="#library">놀이 도감 전체 보기 →</a></div><div class="game-grid">${[games[8], games[3], games[18], games[40]].map((g) => card(g)).join("")}</div></section><section><div class="section-title"><div><span class="eyebrow">A PLACE FOR EVERY PLAY</span><h2>어디서, 누구와 놀아볼까?</h2></div></div><div class="occasion-grid">${[
    ["rain", "☂", "비 오는 날", "집에서도 모험은 계속돼"],
    ["birthday", "♧", "생일파티", "모두가 주인공인 하루"],
    ["family", "⌂", "가족모임", "함께라서 더 특별한"],
    ["school", "⚑", "체육시간", "몸도 마음도 활짝"],
  ]
    .map(
      ([id, icon, title, desc]) =>
        `<button class="occasion" data-preset="${id}"><span>${icon}</span><b>${title}</b><small>${desc}</small></button>`,
    )
    .join(
      "",
    )}</div><div class="shortcut-row">${["집", "교실", "놀이터", "운동장", "공원"].map((x) => `<button class="chip" data-place="${x}">${x}에서</button>`).join("")}${[
    ["2", "둘이서"],
    ["4", "3~4명"],
    ["6", "5명 이상"],
    ["16", "단체"],
  ]
    .map(([n, t]) => `<button class="chip" data-players="${n}">${t}</button>`)
    .join(
      "",
    )}<button class="chip" data-preset="none">준비물 없이</button><button class="chip" data-preset="unseen">처음 보는 놀이</button></div></section><section class="new-section"><div class="section-title"><div><span class="eyebrow">NEW DISCOVERIES</span><h2>새롭게 발견하는 놀이</h2></div></div><div class="game-grid">${games
    .slice(-4)
    .map((g) => card(g))
    .join("")}</div></section>`;
  bindFilters();
}
function library() {
  const unseen = tab === "unseen" ? state.seen : [];
  const ranked = recommend(games, filters, query, category, unseen);
  const exact = ranked.filter((x) => !x.misses.length);
  const shown = (exact.length ? exact : ranked.slice(0, 8)).slice(0, limit);
  main.innerHTML = `${heading("THE PLAY ENCYCLOPEDIA", "놀이 도감", "추억 속 놀이부터 새로운 발견까지, 우리에게 맞는 놀이를 찾아요.")}<section class="library-filters"><label class="search"><span>⌕</span><input id="search" type="search" value="${esc(query)}" placeholder="어떤 놀이를 찾고 있나요?" aria-label="놀이 검색"><kbd>검색</kbd></label>${filterForm()}</section><div class="category-chips"><button class="chip ${!category ? "active" : ""}" data-category="">전체 ${games.length}</button>${categories.map((c) => `<button class="chip ${category === c.id ? "active" : ""}" data-category="${c.id}">${c.title}</button>`).join("")}<button class="chip ${tab === "unseen" ? "active" : ""}" id="unseen">처음 보는 놀이</button></div><div class="section-title"><h2>${exact.length ? `${exact.length}개의 딱 맞는 놀이` : ranked.length ? "조건을 바꾸면 만날 수 있어요" : "아직 찾지 못했어요"}</h2><a class="text-link" href="#pick/wheel">이 조건으로 돌림판 ↻</a></div>${!exact.length && ranked.length ? '<p class="notice">완전히 맞는 놀이가 없어요. 아래는 조건 변경이 필요한 제안이며, 뽑기 후보에는 포함되지 않아요.</p>' : ""}<div class="game-grid">${shown.map(({ game, misses }) => card(game, misses.length ? `${misses.join(" · ")} 조건 변경 필요` : "완전 딱 맞아요")).join("")}</div>${!ranked.length ? '<div class="empty"><h3>다른 낱말이나 카테고리로 찾아볼까요?</h3><button class="button" id="clear-search">검색 초기화</button></div>' : ""}${exact.length > limit ? '<div class="center"><button class="button" id="load-more">놀이 더 보기 +</button></div>' : ""}`;
  bindFilters();
  const search = document.querySelector("#search");
  search.oninput = () => {
    query = search.value;
    const pos = search.selectionStart;
    library();
    const next = document.querySelector("#search");
    next.focus();
    try {
      next.setSelectionRange(pos, pos);
    } catch {}
  };
  document.querySelector("#unseen").onclick = () => {
    tab = tab === "unseen" ? "all" : "unseen";
    library();
  };
  document.querySelector("#load-more")?.addEventListener("click", () => {
    limit += 24;
    library();
  });
  document.querySelector("#clear-search")?.addEventListener("click", () => {
    query = "";
    category = "";
    tab = "all";
    library();
  });
}
function detail(id) {
  const g = find(id);
  if (!g) return notFound();
  visit(id);
  main.innerHTML = `<a href="#library" class="back-link">← 놀이 도감으로</a><section class="detail-hero"><div class="detail-art"><img src="${g.illustration}" alt="${g.title} 놀이 장면"><a class="short-preview" href="#shorts/${g.id}">▷ 24초로 배우기 <span>움직이는 놀이 설명 →</span></a></div><div class="detail-copy"><span class="eyebrow">${cat(g.category).title} · ${g.difficulty}</span><h1>${g.title}</h1><p class="detail-intro">${g.subtitle}</p><div class="detail-stats"><div>♧<b>${g.minPlayers}–${g.maxPlayers}명</b><small>함께할 친구</small></div><div>◷<b>${g.durationMin}분</b><small>놀이 시간</small></div><div>☺<b>${g.ageGroup}</b><small>추천 연령</small></div></div><p><b>장소</b>　${g.places.join(" · ")}</p><p><b>준비물</b>　${g.materials.join(", ") || "친구와 신나는 마음만!"}</p><div class="tags">${g.tags.map((t) => `<span># ${t}</span>`).join("")}</div><div class="detail-actions">${btn("▷ 움직이는 설명 보기", `#shorts/${g.id}`, "primary")}<button class="button" id="start-game">바로 시작</button><button class="button favorite-inline" data-favorite="${g.id}" aria-label="${g.title} 즐겨찾기" aria-pressed="${state.favorites.includes(g.id)}">${state.favorites.includes(g.id) ? "♥" : "♡"}</button></div></div></section><section class="rules-layout"><div><span class="eyebrow">HOW TO PLAY</span><h2>이렇게 놀면 돼요</h2><p class="muted">${g.ruleNote}</p><ol class="rules">${g.steps.map((s, i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><p>${s}</p></li>`).join("")}</ol></div><aside><div class="tip-box"><h3>✦ 달봉이의 재미 한 스푼</h3>${g.tips.map((t) => `<p>${t}</p>`).join("")}</div><div class="safety-box"><h3>♡ 안전도 함께 챙겨요</h3>${g.safety.map((t) => `<p>${t}</p>`).join("")}<small>활동량 ${g.activityLevel} · 소음 ${g.noiseLevel} · 위험도 ${g.risk}</small></div></aside></section><section><div class="section-title"><h2>이 놀이도 좋아할 거예요</h2></div><div class="game-grid">${games
    .filter((x) => x.category === g.category && x.id !== g.id)
    .slice(0, 4)
    .map((x) => card(x))
    .join("")}</div></section>`;
  document.querySelector("#start-game").onclick = () => startGame(g);
}
function startGame(g) {
  const dialog = document.createElement("dialog");
  dialog.className = "start-dialog";
  dialog.innerHTML = `<button class="dialog-close icon-button" aria-label="닫기">×</button><span class="eyebrow">READY, SET, PLAY!</span><h2>${g.title}, 시작할까요?</h2><p>${g.safety[0]}</p><label class="check"><input type="checkbox" id="ready-space"> 안전한 공간과 친구들의 준비를 확인했어요</label><div class="timer">${g.durationMin}:00</div><button class="button primary" id="timer-start" disabled>놀이 타이머 시작</button><button class="button" id="complete-play">다 놀았어요 · 기록 남기기</button><p class="muted">타이머는 이 창이 열려 있는 동안 작동해요.</p>`;
  document.body.append(dialog);
  dialog.showModal();
  let end = 0,
    remaining = g.durationMin * 60,
    running = false,
    timer;
  dialog.querySelector("#ready-space").onchange = (e) =>
    (dialog.querySelector("#timer-start").disabled = !e.target.checked);
  const button = dialog.querySelector("#timer-start");
  button.onclick = () => {
    if (!running) {
      end = Date.now() + remaining * 1000;
      running = true;
      button.textContent = "잠깐 쉬기";
      timer = setInterval(() => {
        remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        dialog.querySelector(".timer").textContent =
          `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
        if (!remaining) {
          clearInterval(timer);
          running = false;
          button.disabled = true;
          toast("놀이 시간이 끝났어요! 잠깐 쉬어가요.");
          ping();
        }
      }, 250);
    } else {
      clearInterval(timer);
      running = false;
      button.textContent = "계속 놀기";
    }
  };
  dialog.querySelector("#complete-play").onclick = () => {
    state.played = [...new Set([...state.played, g.id])];
    save();
    dialog.close();
    celebrate();
    toast("오늘의 놀이 추억을 보물함에 담았어요.");
  };
  dialog.querySelector(".dialog-close").onclick = () => dialog.close();
  dialog.onclose = () => {
    clearInterval(timer);
    dialog.remove();
    document.querySelector("#start-game")?.focus();
  };
}
function picker(mode) {
  if (!["wheel", "dice", "ladder", "card"].includes(mode)) mode = "wheel";
  const names = {
    wheel: "빙글빙글, 돌림판",
    dice: "데굴데굴, 주사위",
    ladder: "어디로 갈까? 사다리타기",
    card: "두근두근, 카드 뽑기",
  };
  const pool = recommend(
    games,
    filters,
    query,
    category,
    tab === "unseen" ? state.seen : [],
  )
    .filter((item) => !item.misses.length)
    .map((item) => item.game);
  main.innerHTML = `${heading("A LITTLE LUCK, A LOT OF FUN", names[mode], "고민은 잠깐 내려놓고, 오늘의 놀이를 만나봐요.")}<div class="picker-tabs">${Object.entries(
    names,
  )
    .map(
      ([id, name]) =>
        `<a class="chip ${mode === id ? "active" : ""}" href="#pick/${id}">${name.split(", ").pop()}</a>`,
    )
    .join(
      "",
    )}</div><p class="center muted">현재 조건에 맞는 ${pool.length}개 놀이 중에서 골라요. <a href="#library">조건 바꾸기 →</a></p><section class="picker-panel" id="picker"></section>`;
  const root = document.querySelector("#picker");
  cleanup = mountPicker(root, mode, pool, (g) => {
    root.querySelector(".picker-result")?.remove();
    root.insertAdjacentHTML(
      "beforeend",
      `<div class="picker-result" role="status"><span class="eyebrow">오늘은 이 놀이!</span><h2>${g.title}</h2><p>${g.subtitle}</p>${btn("놀이 방법 보러 가기 →", `#game/${g.id}`, "primary")}<p class="muted">다시 고르고 싶으면 위에서 한 번 더!</p></div>`,
    );
    celebrate();
    root
      .querySelector(".picker-result")
      .scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}
function shorts(id) {
  const g = find(id);
  if (!g) return notFound();
  visit(id);
  main.innerHTML = `<a class="back-link" href="#game/${id}">← ${g.title} 상세로</a><section class="shorts-layout"><div class="shorts-description"><span class="eyebrow">WATCH. LEARN. PLAY.</span><h1>보고 나면,<br>바로 놀 수 있어요.</h1><h2>${g.title}</h2><p>${g.subtitle}</p><ol>${g.steps.map((s) => `<li>${s}</li>`).join("")}</ol>${btn("이제 놀러 가자 →", `#game/${id}`, "primary")}<p class="muted">짧은 그림 설명은 요약이에요.<br>자세한 규칙과 안전사항도 함께 확인해요.</p></div><div id="shorts-player" tabindex="0" aria-label="놀이 설명 플레이어"></div></section>`;
  cleanup = mountShorts(document.querySelector("#shorts-player"), g);
}
function collection() {
  const seen = state.seen.map(find).filter(Boolean);
  const badges = [
    ["✦", "첫 발자국", seen.length >= 1, Math.min(seen.length, 1), 1],
    ["♧", "놀이 탐험가", seen.length >= 10, Math.min(seen.length, 10), 10],
    [
      "⌂",
      "실내놀이 마스터",
      seen.filter((g) => g.places.includes("실내")).length >= 5,
      Math.min(seen.filter((g) => g.places.includes("실내")).length, 5),
      5,
    ],
    [
      "⚑",
      "전통놀이 탐험가",
      seen.filter((g) => g.category === "traditional").length >= 5,
      Math.min(seen.filter((g) => g.category === "traditional").length, 5),
      5,
    ],
  ];
  const grid = (ids, empty) =>
    ids.length
      ? `<div class="game-grid">${ids
          .map(find)
          .filter(Boolean)
          .map((g) => card(g))
          .join("")}</div>`
      : `<div class="empty"><p>${empty}</p>${btn("놀이 찾아보기 →", "#library", "outline")}</div>`;
  main.innerHTML = `${heading("MY LITTLE TREASURE BOX", "내 보물함", "좋아하는 놀이와 함께 쌓이는, 우리들의 작은 추억.")}<div class="collection-stats"><span><b>${state.favorites.length}</b> 좋아하는 놀이</span><span><b>${state.seen.length}</b> 발견한 놀이</span><span><b>${state.played.length}</b> 해본 놀이</span></div><div class="badge-grid">${badges.map(([icon, name, earned, n, total]) => `<div class="badge ${earned ? "earned" : ""}"><span>${icon}</span><h3>${name}</h3><p>${earned ? "배지 획득!" : `${n} / ${total}개 발견`}</p><progress value="${n}" max="${total}" aria-label="${name} 진행도"></progress></div>`).join("")}</div><section><div class="section-title"><h2>♡ 좋아하는 놀이</h2></div>${grid(state.favorites, "마음에 드는 놀이의 하트를 눌러 담아보세요.")}</section><section><div class="section-title"><h2>최근 만난 놀이</h2></div>${grid(state.recent, "새로운 놀이를 만나면 여기에 모여요.")}</section><section><div class="section-title"><h2>함께 놀아본 추억</h2></div>${grid(state.played, "놀이 상세의 바로 시작에서 완료 기록을 남겨보세요.")}</section><p class="muted center">보물함은 이 브라우저에 저장돼요. 개인 정보를 수집하거나 계정을 만들지 않아요.</p>`;
}
function notFound() {
  main.innerHTML = `<div class="empty"><h1>이 길에는 아직 놀이가 없어요.</h1>${btn("홈으로 돌아가기", "#home", "primary")}</div>`;
}
function route() {
  document.querySelector('dialog[open]')?.close();
  document.querySelector("#confetti").replaceChildren();
  cleanup();
  cleanup = () => {};
  const [page = "home", id] = (location.hash.slice(1) || "home").split("/");
  if (page === "home") home();
  else if (page === "library") library();
  else if (page === "game") detail(id);
  else if (page === "pick") picker(id);
  else if (page === "shorts") shorts(id);
  else if (page === "collection") collection();
  else notFound();
  document.querySelectorAll("nav a").forEach((a) => {
    const active = a.hash.split("/")[0] === `#${page}`;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = `${page === "game" && find(id) ? find(id).title + " · " : ""}달봉이의 놀이동산`;
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest(
    "[data-favorite],[data-category],[data-preset],[data-place],[data-players]",
  );
  if (!b) return;
  if (b.hasAttribute("data-favorite")) {
    favorite(b.dataset.favorite);
    return;
  }
  if (b.hasAttribute("data-category")) {
    category = b.dataset.category;
    limit = 24;
    library();
    return;
  }
  filters = {};
  query = "";
  category = "";
  tab = "all";
  if (b.dataset.place) filters.place = b.dataset.place;
  if (b.dataset.players) filters.players = b.dataset.players;
  switch (b.dataset.preset) {
    case "quick":
      filters = { place: "놀이터", players: "4", duration: "10" };
      break;
    case "rain":
      filters = { place: "실내" };
      break;
    case "birthday":
      category = "party";
      break;
    case "family":
      category = "traditional";
      break;
    case "school":
      filters = { place: "운동장", team: "yes" };
      break;
    case "none":
      filters = { materials: "none" };
      break;
    case "unseen":
      tab = "unseen";
      break;
  }
  if (location.hash === "#library") library();
  else location.hash = "#library";
});
const sound = document.querySelector("#sound");
function syncSound() {
  sound.setAttribute("aria-pressed", state.sound);
  sound.setAttribute("aria-label", state.sound ? "효과음 끄기" : "효과음 켜기");
  sound.textContent = state.sound ? "♫" : "♪";
}
sound.onclick = () => {
  state.sound = !state.sound;
  save();
  syncSound();
  if (state.sound) ping();
  toast(state.sound ? "효과음을 켰어요." : "조용히 놀아요.");
};
syncSound();
count();
try {
  [games, categories] = await Promise.all(
    ["games", "categories"].map(async (name) => {
      const r = await fetch(`data/${name}.json`);
      if (!r.ok) throw Error();
      return r.json();
    }),
  );
  window.addEventListener("hashchange", route);
  route();
} catch {
  main.innerHTML =
    '<div class="empty"><h1>놀이 도감을 불러오지 못했어요.</h1><p>연결을 확인해 주세요. 로컬에서는 npm start로 실행해요.</p><button class="button" id="retry">다시 불러오기</button></div>';
  document.querySelector("#retry").onclick = () => location.reload();
}
