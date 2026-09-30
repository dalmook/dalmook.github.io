import { state, save, visit } from "./storage.js";
import { recommend, shuffle } from "./filters.js";
import { mountPicker } from "./pickers.js";
import { mountCinema } from "./cinema-player.js";

const main = document.querySelector("main");
let games = [],
  categories = [],
  cleanup = () => {},
  filters = { ...state.filters },
  query = "",
  category = "",
  unseen = false,
  page = 0,
  collectionTab = "favorites",
  detailTab = "watch";
const names = {
  home: "오늘의 놀이",
  library: "놀이 도감",
  pick: "행운의 뽑기",
  collection: "내 보물함",
};
const icon = (name, cls = "") =>
  `<img class="ui-icon ${cls}" src="assets/icons/ui/${name}.svg" alt="" width="22" height="22">`;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const seconds = (g) =>
  g.shortScenes.reduce((sum, scene) => sum + scene.duration, 0);
const game = (id) => games.find((g) => g.id === id),
  cat = (id) => categories.find((c) => c.id === id);
const art = (g, beat = 0) =>
  `<div class="art-window"><div class="art-sheet" style="background-image:url('${g.storyboard?.image || g.illustration}');background-position:${beat % 2 ? 100 : 0}% ${beat > 1 ? 100 : 0}%"></div></div>`;
function toast(s) {
  const el = document.querySelector("#toast");
  el.textContent = s;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
let audio;
function chime() {
  if (!state.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    [523, 659, 784].forEach((f, i) => {
      const o = audio.createOscillator(),
        v = audio.createGain();
      o.connect(v);
      v.connect(audio.destination);
      o.frequency.value = f;
      v.gain.setValueAtTime(0.035, audio.currentTime + i * 0.1);
      v.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + i * 0.1 + 0.25,
      );
      o.start(audio.currentTime + i * 0.1);
      o.stop(audio.currentTime + i * 0.1 + 0.26);
    });
  } catch {}
}
function celebrate() {
  chime();
  navigator.vibrate?.(35);
  document.querySelector("#confetti").innerHTML = Array.from(
    { length: 22 },
    (_, i) =>
      `<i style="left:${Math.random() * 100}%;background:${["#ff853c", "#ffd065", "#6e9ef8"][i % 3]};animation-delay:${Math.random() * 0.3}s"></i>`,
  ).join("");
  setTimeout(() => document.querySelector("#confetti").replaceChildren(), 1700);
}
function favorite(id) {
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((x) => x !== id)
    : [...state.favorites, id];
  save();
  document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
    b.classList.toggle("saved", state.favorites.includes(id));
    b.setAttribute("aria-pressed", state.favorites.includes(id));
  });
  toast(
    state.favorites.includes(id)
      ? "보물함에 담았어요."
      : "보물함에서 꺼냈어요.",
  );
  if (location.hash === "#collection") collection();
}
function favButton(g) {
  return `<button class="favorite ${state.favorites.includes(g.id) ? "saved" : ""}" data-fav="${g.id}" aria-label="${g.title} 즐겨찾기" aria-pressed="${state.favorites.includes(g.id)}">${icon("heart")}</button>`;
}
function navigation() {
  const items = [
    ["home", "house"],
    ["library", "book-open"],
    ["pick", "gift"],
    ["collection", "star"],
  ];
  const html = items
    .map(
      ([key, img]) =>
        `<a href="#${key === "pick" ? "pick/wheel" : key}" data-nav="${key}">${icon(img)}<span>${names[key]}</span></a>`,
    )
    .join("");
  document.querySelector("#navigation").innerHTML = html;
  document.querySelector("#mobile-navigation").innerHTML = html;
}
function head(title, sub = "", right = "") {
  return `<header class="page-head"><div>${sub ? `<p class="eyebrow">${sub}</p>` : ""}<h1>${title}</h1></div>${right}</header>`;
}
function select(name, label, items) {
  return `<label class="select-row"><span>${icon(name === "place" ? "map-pin" : name === "players" ? "users" : "clock")} ${label}</span><select name="${name}">${[["", "전체"], ...items].map(([v, t]) => `<option value="${v}" ${filters[name] === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>`;
}
function basics() {
  return `${select(
    "place",
    "장소",
    ["집", "거실", "교실", "놀이터", "운동장", "공원", "실내", "야외"].map(
      (x) => [x, x],
    ),
  )}${select("players", "인원", [
    ["2", "2명"],
    ["3", "3명"],
    ["4", "4명"],
    ["5", "5명"],
    ["6", "6명"],
    ["8", "8명"],
    ["10", "10명"],
    ["12", "12명"],
    ["16", "16명"],
    ["20", "20명"],
  ])}${select("duration", "시간", [
    ["5", "5분 이내"],
    ["10", "10분 이내"],
    ["20", "20분 이상"],
  ])}`;
}
function pool() {
  return recommend(games, filters, query, category, unseen ? state.seen : [])
    .filter((r) => !r.misses.length)
    .map((r) => r.game);
}
function miniCard(g) {
  return `<article class="mini-card"><a href="#game/${g.id}" aria-label="${g.title} 쇼츠 보기">${art(g)}<span class="duration">${icon("play")} ${seconds(g)}초</span><div class="mini-copy"><h3>${g.title}</h3><p>${g.minPlayers}–${g.maxPlayers}명 · ${g.durationMin}분</p></div><span class="mini-play">${icon("play")}</span></a></article>`;
}
function home() {
  const recommended = [game("play-01"), game("play-09"), game("play-19")];
  main.innerHTML = `<div class="screen home-screen">${head("오늘은 어떤 추억을 만들까?", "안녕! 오늘도 놀 준비됐어?", `<button class="circle-button" data-action="filters" aria-label="놀이 조건 설정">${icon("sliders-horizontal")}</button>`)}<div class="home-stage"><a class="hero-feature" href="#game/play-04"><img class="hero-image" src="assets/images/v2/hero.webp" alt="한국 골목에서 달봉이와 친구들이 얼음땡 놀이를 해요"><div class="hero-overlay"><span class="tag">달봉이 PICK</span><h2>골목이 우리의 놀이터</h2><p>평범한 오후가 특별한 추억이 되는 순간.</p><span class="button orange">${icon("play")} 놀이 쇼츠 보기 <small>${seconds(game("play-04"))}초</small></span></div></a><form class="recommend-panel" id="quick-form"><div><span class="eyebrow">LET’S PLAY TOGETHER</span><h2>딱 맞는 놀이를 찾아요</h2></div><div class="quick-fields">${basics()}</div><label class="toggle-row"><span>${icon("leaf")} 준비물 없이</span><input type="checkbox" name="materials" value="none" ${filters.materials === "none" ? "checked" : ""}><i></i></label><button type="submit" class="button orange">${icon("sparkles")} 오늘의 놀이 추천 ${icon("chevron-right")}</button><button type="button" class="text-button" data-action="filters">조건 더 보기</button></form></div><section class="home-shelf"><div class="shelf-heading"><h2>지금 이 놀이 어때?</h2><p>보고 나면 바로 놀 수 있어요.</p><a href="#library">더 많은 놀이 ${icon("arrow-right")}</a></div><div class="mini-grid">${recommended.map(miniCard).join("")}</div></section><div class="mobile-shortcuts"><button data-preset="rain">비 오는 날</button><button data-preset="family">가족과 함께</button><a href="#pick/wheel">운명에 맡기기</a></div></div>`;
  document.querySelector("#quick-form").onsubmit = (e) => {
    e.preventDefault();
    filters = {
      ...filters,
      ...Object.fromEntries(new FormData(e.currentTarget)),
    };
    filters.materials = e.currentTarget.elements.materials.checked
      ? "none"
      : "";
    query = "";
    category = "";
    unseen = false;
    page = 0;
    location.hash = "#library";
  };
}
function library() {
  const ranked = recommend(
      games,
      filters,
      query,
      category,
      unseen ? state.seen : [],
    ),
    exact = ranked.filter((x) => !x.misses.length),
    near = !exact.length && ranked.length > 0;
  const items = exact.length ? exact : ranked.slice(0, 8);
  const size = window.innerWidth < 700 ? 4 : 6;
  const pages = Math.max(1, Math.ceil(items.length / size));
  page = Math.min(page, pages - 1);
  const slice = items.slice(page * size, (page + 1) * size);
  main.innerHTML = `<div class="screen library-screen">${head("오늘의 놀이를 골라봐", `${games.length}가지 놀이 · 모두 이미지 쇼츠로`, `<button class="button soft" data-action="filters">${icon("sliders-horizontal")} 조건 설정</button>`)}<div class="library-toolbar"><label class="search">${icon("search")}<input id="search" type="search" placeholder="놀이 이름으로 찾기" value="${esc(query)}" aria-label="놀이 검색"></label><select id="category" aria-label="놀이 카테고리"><option value="">모든 놀이</option>${categories.map((c) => `<option value="${c.id}" ${category === c.id ? "selected" : ""}>${c.title}</option>`).join("")}</select><button class="unseen-toggle ${unseen ? "active" : ""}" aria-pressed="${unseen}" id="unseen">처음 보는 놀이</button></div><div class="result-line"><span>${near ? "조건을 바꾸면 가능한 놀이" : `${items.length}개의 놀이`}</span><button class="text-button" id="reset-library">조건 초기화</button><a href="#pick/wheel">이 후보로 뽑기 ${icon("arrow-right")}</a></div>${near ? '<p class="near-note">정확히 맞는 결과가 없어요. 아래에 바꿔야 할 조건을 표시했어요.</p>' : ""}<div class="library-grid">${slice.map(({ game: g, misses }) => `<article class="library-card"><a href="#game/${g.id}" aria-label="${g.title} 설명 보기">${art(g)}<span class="duration">${seconds(g)}초</span><div class="library-card-copy"><small>${cat(g.category).title}</small><h2>${g.title}</h2><p>${g.minPlayers}–${g.maxPlayers}명 · ${g.durationMin}분 · ${g.materials.length ? "준비물 있음" : "준비물 없이"}</p>${misses.length ? `<em>${misses.join("·")} 변경 필요</em>` : ""}</div></a>${favButton(g)}</article>`).join("") || '<div class="empty"><h2>아직 못 찾았어요.</h2><p>다른 이름이나 조건으로 찾아볼까요?</p></div>'}</div><div class="pagination"><button id="page-prev" aria-label="이전 놀이 페이지" ${page === 0 ? "disabled" : ""}>${icon("chevron-left")} 이전</button><span>${page + 1} <i>/ ${pages}</i></span><button id="page-next" aria-label="다음 놀이 페이지" ${page >= pages - 1 ? "disabled" : ""}>다음 ${icon("chevron-right")}</button></div></div>`;
  document.querySelector("#search").oninput = (e) => {
    query = e.target.value;
    const pos = e.target.selectionStart;
    page = 0;
    library();
    const input = document.querySelector("#search");
    input.focus();
    try {
      input.setSelectionRange(pos, pos);
    } catch {}
  };
  document.querySelector("#category").onchange = (e) => {
    category = e.target.value;
    page = 0;
    library();
  };
  document.querySelector("#unseen").onclick = () => {
    unseen = !unseen;
    page = 0;
    library();
  };
  document.querySelector("#page-prev").onclick = () => {
    page--;
    library();
  };
  document.querySelector("#page-next").onclick = () => {
    page++;
    library();
  };
  document.querySelector("#reset-library").onclick = () => {
    filters = {};
    query = "";
    category = "";
    unseen = false;
    page = 0;
    library();
  };
}
function rules(g) {
  return `<div class="guide-intro"><span class="tag">${cat(g.category).title}</span><h2>${g.title}</h2><p>${g.subtitle}</p></div><div class="facts"><span>${icon("users")} ${g.minPlayers}–${g.maxPlayers}명</span><span>${icon("clock")} ${g.durationMin}분</span><span>${g.ageGroup}</span></div><div class="guide-tabs"><button data-guide="rules" class="active">놀이 방법</button><button data-guide="safety">준비·안전</button><button data-guide="related">비슷한 놀이</button></div><div id="guide-content" class="guide-content"><ol class="rule-list">${g.steps.map((s, i) => `<li><b>${i + 1}</b><p>${s}</p></li>`).join("")}</ol><p class="rule-note">${g.ruleNote}</p></div><div class="guide-actions"><button class="button orange" id="start-game">${icon("flag")} 이제 놀러 가자</button>${favButton(g)}</div>`;
}
function detail(id) {
  const g = game(id);
  if (!g) return missing();
  visit(id);
  main.innerHTML = `<div class="screen detail-screen">${head(g.title, "보고, 배우고, 바로 놀자", `<a class="circle-button" href="#library" aria-label="놀이 도감으로">${icon("x")}</a>`)}<div class="mobile-view-tabs"><button data-detail-tab="watch" class="${detailTab === "watch" ? "active" : ""}">쇼츠로 보기</button><button data-detail-tab="rules" class="${detailTab === "rules" ? "active" : ""}">규칙·준비물</button></div><div class="detail-work ${detailTab === "rules" ? "show-rules" : ""}"><div class="cinema-stage"><div class="cinema-backdrop" style="background-image:url('${g.storyboard?.image || g.illustration}')"></div><div id="cinema-player" tabindex="0" aria-label="${g.title} 쇼츠 플레이어"></div></div><aside class="guide-side">${rules(g)}</aside></div></div>`;
  cleanup = mountCinema(document.querySelector("#cinema-player"), g, {
    sound: state.sound,
  });
  document.querySelectorAll("[data-detail-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        detailTab = b.dataset.detailTab;
        if (detailTab === "rules") cleanup.pause?.();
        document
          .querySelector(".detail-work")
          .classList.toggle("show-rules", detailTab === "rules");
        document
          .querySelectorAll("[data-detail-tab]")
          .forEach((x) => x.classList.toggle("active", x === b));
      }),
  );
  document.querySelectorAll("[data-guide]").forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll("[data-guide]")
          .forEach((x) => x.classList.toggle("active", x === b));
        document.querySelector("#guide-content").innerHTML =
          b.dataset.guide === "related"
            ? `<div class="related-links">${games
                .filter((x) => x.category === g.category && x.id !== g.id)
                .slice(0, 3)
                .map(
                  (x) =>
                    `<a href="#game/${x.id}"><b>${x.title}</b><span>${x.minPlayers}–${x.maxPlayers}명 · ${x.durationMin}분 ${icon("chevron-right")}</span></a>`,
                )
                .join("")}</div>`
            : b.dataset.guide === "rules"
              ? `<ol class="rule-list">${g.steps.map((s, i) => `<li><b>${i + 1}</b><p>${s}</p></li>`).join("")}</ol><p class="rule-note">${g.ruleNote}</p>`
              : `<div class="safety-content"><h3>준비물</h3><p>${g.materials.join(", ") || "필요 없어요. 친구와 함께 오세요!"}</p><h3>어디서 놀까요?</h3><p>${g.places.join(" · ")}</p><h3>안전 약속</h3>${g.safety.map((s) => `<p>${s}</p>`).join("")}<small>활동량 ${g.activityLevel} · 소음 ${g.noiseLevel} · 위험도 ${g.risk}</small></div>`;
      }),
  );
  document.querySelector("#start-game").onclick = () => start(g);
}
function picker(mode = "wheel") {
  if (!["wheel", "dice", "ladder", "card"].includes(mode)) mode = "wheel";
  const labels = {
    wheel: "돌림판",
    dice: "주사위",
    ladder: "사다리",
    card: "카드 뽑기",
  };
  const candidates = pool();
  main.innerHTML = `<div class="screen picker-screen">${head("고르는 순간부터, 놀이", "오늘의 행운은 어떤 놀이일까?", `<button class="button soft" data-action="filters">${icon("sliders-horizontal")} 조건</button>`)}<div class="picker-tabbar">${Object.entries(
    labels,
  )
    .map(
      ([id, title]) =>
        `<a href="#pick/${id}" class="${id === mode ? "active" : ""}">${icon({ wheel: "circle-dot", dice: "dice-5", ladder: "git-branch", card: "layers" }[id])}${title}</a>`,
    )
    .join(
      "",
    )}</div><div class="picker-work"><section class="picker-panel" id="picker"></section><aside class="result-preview" id="result-preview"><img src="assets/images/v2/hero.webp" alt="달봉이가 친구들과 기다리고 있어요"><span class="eyebrow">YOUR NEXT ADVENTURE</span><h2>두근두근,<br>어떤 놀이를 만날까?</h2><p>현재 조건에 맞는 ${candidates.length}개 놀이에서 골라요.</p><a class="button soft" href="#library">후보 먼저 둘러보기</a></aside></div></div>`;
  cleanup = mountPicker(
    document.querySelector("#picker"),
    mode,
    candidates,
    (g) => {
      document.querySelector("#result-preview").innerHTML =
        `<div class="result-photo">${art(g, 1)}</div><span class="eyebrow">오늘은 이 놀이!</span><h2>${g.title}</h2><p>${g.minPlayers}–${g.maxPlayers}명 · ${g.durationMin}분</p><a class="button orange" href="#game/${g.id}">${icon("play")} 쇼츠로 배우기</a><button class="text-button" id="pick-again">한 번 더 뽑기</button>`;
      document.querySelector(".picker-work").classList.add("has-result");
      document.querySelector("#pick-again").onclick = () => {
        cleanup();
        picker(mode);
      };
      celebrate();
    },
  );
}
function collection() {
  const ids = state[collectionTab] || [],
    items = ids.map(game).filter(Boolean);
  const size = window.innerWidth < 700 ? 4 : 6,
    total = Math.max(1, Math.ceil(items.length / size));
  page = Math.min(page, total - 1);
  const seen = state.seen.map(game).filter(Boolean),
    badges = [
      ["첫 발자국", seen.length >= 1],
      ["10개 발견", seen.length >= 10],
      [
        "실내 탐험가",
        seen.filter((g) => g.places.includes("실내")).length >= 5,
      ],
      [
        "전통놀이 탐험가",
        seen.filter((g) => g.category === "traditional").length >= 5,
      ],
    ];
  main.innerHTML = `<div class="screen collection-screen">${head("우리들의 작은 보물함", "좋아하는 놀이와 함께 쌓이는 추억")}<div class="badges">${badges.map(([name, yes]) => `<span class="${yes ? "earned" : ""}">${icon("award")}<b>${name}</b><small>${yes ? "획득" : "도전 중"}</small></span>`).join("")}</div><div class="collection-tabs">${[
    ["favorites", "좋아하는 놀이"],
    ["recent", "최근 본 놀이"],
    ["played", "해본 놀이"],
  ]
    .map(
      ([key, title]) =>
        `<button data-collection="${key}" class="${key === collectionTab ? "active" : ""}">${title} <small>${state[key].length}</small></button>`,
    )
    .join("")}</div><div class="library-grid">${
    items
      .slice(page * size, (page + 1) * size)
      .map(
        (g) =>
          `<article class="library-card"><a href="#game/${g.id}">${art(g)}<div class="library-card-copy"><h2>${g.title}</h2><p>${g.minPlayers}–${g.maxPlayers}명 · ${g.durationMin}분</p></div></a>${favButton(g)}</article>`,
      )
      .join("") ||
    '<div class="empty"><h2>첫 번째 추억을 담아볼까요?</h2><p>좋아하는 놀이의 하트를 눌러보세요.</p><a href="#library" class="button orange">놀이 만나러 가기</a></div>'
  }</div><div class="pagination"><button id="page-prev" ${page === 0 ? "disabled" : ""}>← 이전</button><span>${page + 1} / ${total}</span><button id="page-next" ${page === total - 1 ? "disabled" : ""}>다음 →</button></div></div>`;
  document.querySelectorAll("[data-collection]").forEach(
    (b) =>
      (b.onclick = () => {
        collectionTab = b.dataset.collection;
        page = 0;
        collection();
      }),
  );
  document.querySelector("#page-prev").onclick = () => {
    page--;
    collection();
  };
  document.querySelector("#page-next").onclick = () => {
    page++;
    collection();
  };
}
function filterDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "filter-dialog";
  dialog.innerHTML = `<form id="filter-form"><header><div><span class="eyebrow">맞춤 놀이 찾기</span><h2>지금 우리 상황은?</h2></div><button type="button" class="circle-button" data-close aria-label="닫기">${icon("x")}</button></header><div class="dialog-body"><div class="condition-grid">${basics()}${select(
    "activity",
    "활동량",
    ["낮음", "보통", "높음"].map((x) => [x, x]),
  )}${select(
    "noise",
    "소음",
    ["낮음", "보통", "높음"].map((x) => [x, x]),
  )}${select("age", "연령", [
    ["6", "6세"],
    ["7", "7세"],
    ["8", "8세"],
    ["10", "10세 이상"],
  ])}</div><div class="checkbox-options">${[
    ["materials", "none", "준비물 없이"],
    ["team", "yes", "팀전 가능한 놀이"],
    ["safe", "yes", "위험도 낮은 놀이"],
  ]
    .map(
      ([key, v, label]) =>
        `<label><input type="checkbox" name="${key}" value="${v}" ${filters[key] === v ? "checked" : ""}>${label}</label>`,
    )
    .join(
      "",
    )}</div></div><footer><button type="button" id="clear-filters" class="text-button">초기화</button><button type="button" id="save-filters" class="button soft">조건 저장</button><button class="button orange" type="submit">추천 보기</button></footer></form>`;
  document.body.append(dialog);
  dialog.showModal();
  const form = dialog.querySelector("form");
  form.onsubmit = (e) => {
    e.preventDefault();
    filters = Object.fromEntries(new FormData(form));
    page = 0;
    dialog.close();
    if (location.hash === "#library") library();
    else location.hash = "#library";
  };
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.querySelector("#clear-filters").onclick = () => {
    filters = {};
    form.querySelectorAll("select").forEach((s) => (s.value = ""));
    form.querySelectorAll("input").forEach((i) => (i.checked = false));
  };
  dialog.querySelector("#save-filters").onclick = () => {
    state.filters = Object.fromEntries(new FormData(form));
    filters = { ...state.filters };
    toast(
      save() ? "다음에도 이 조건으로 만나요." : "저장이 제한된 브라우저예요.",
    );
  };
  dialog.onclose = () => dialog.remove();
}
function start(g) {
  cleanup.pause?.();
  const d = document.createElement("dialog");
  d.className = "start-dialog";
  d.innerHTML = `<button class="circle-button close" aria-label="닫기">${icon("x")}</button><span class="eyebrow">화면 밖으로, 출발!</span><h2>${g.title}</h2><p>${g.safety[0]}</p><label><input id="ready-space" type="checkbox"> 공간과 친구들의 준비를 확인했어요</label><div class="timer">${g.durationMin}:00</div><button class="button orange" id="timer-start" disabled>놀이 시작</button><button class="button soft" id="complete-play">다 놀았어요</button><p class="muted">이 창이 열려 있는 동안 타이머가 작동해요.</p>`;
  document.body.append(d);
  d.showModal();
  let end = 0,
    remaining = g.durationMin * 60,
    running = false,
    timer;
  const b = d.querySelector("#timer-start");
  d.querySelector("#ready-space").onchange = (e) =>
    (b.disabled = !e.target.checked);
  b.onclick = () => {
    if (running) {
      clearInterval(timer);
      running = false;
      b.textContent = "계속 놀기";
    } else {
      running = true;
      end = Date.now() + remaining * 1000;
      b.textContent = "잠깐 쉬기";
      timer = setInterval(() => {
        remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        d.querySelector(".timer").textContent =
          `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
        if (!remaining) {
          clearInterval(timer);
          running = false;
          b.disabled = true;
          toast("잠깐 쉬어갈 시간이에요!");
          chime();
        }
      }, 250);
    }
  };
  d.querySelector(".close").onclick = () => d.close();
  d.querySelector("#complete-play").onclick = () => {
    state.played = [...new Set([...state.played, g.id])];
    save();
    d.close();
    celebrate();
    toast("오늘의 추억을 보물함에 담았어요.");
  };
  d.onclose = () => {
    clearInterval(timer);
    d.remove();
  };
}
function missing() {
  main.innerHTML =
    '<div class="screen empty"><h1>이 놀이를 찾지 못했어요.</h1><a class="button orange" href="#home">홈으로</a></div>';
}
function route() {
  cleanup();
  cleanup = () => {};
  document.querySelector("dialog[open]")?.close();
  document.querySelector("#confetti").replaceChildren();
  const [view = "home", id] = (location.hash.slice(1) || "home").split("/");
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const active =
      a.dataset.nav ===
      (view === "game" || view === "shorts" ? "library" : view);
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (view === "home") home();
  else if (view === "library") library();
  else if (view === "game" || view === "shorts") {
    detailTab = "watch";
    detail(id);
  } else if (view === "pick") picker(id);
  else if (view === "collection") collection();
  else missing();
  main.focus({ preventScroll: true });
  document.title =
    (game(id)?.title ? game(id).title + " · " : "") + "달봉이의 놀이동산";
}
document.querySelector(".skip").onclick = (e) => {
  e.preventDefault();
  main.focus();
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-fav],[data-action],[data-preset]");
  if (!b) return;
  if (b.dataset.fav) favorite(b.dataset.fav);
  else if (b.dataset.action === "filters") filterDialog();
  else if (b.dataset.preset) {
    filters = b.dataset.preset === "rain" ? { place: "실내" } : {};
    category = b.dataset.preset === "family" ? "traditional" : "";
    query = "";
    page = 0;
    location.hash = "#library";
  }
});
function soundUI() {
  for (const id of ["sound", "mobile-sound"]) {
    const b = document.getElementById(id);
    b.innerHTML =
      icon(state.sound ? "volume-2" : "volume-x") +
      (id === "sound"
        ? `<span>${state.sound ? "소리 켜짐" : "소리 꺼짐"}</span>`
        : "");
    b.setAttribute("aria-pressed", state.sound);
    b.setAttribute("aria-label", state.sound ? "소리 끄기" : "소리 켜기");
    b.onclick = () => {
      state.sound = !state.sound;
      save();
      soundUI();
      chime();
      toast(
        state.sound
          ? "효과음과 기기 음성 안내를 켰어요."
          : "소리 없이도 배울 수 있어요.",
      );
      if (
        location.hash.startsWith("#game/") ||
        location.hash.startsWith("#shorts/")
      )
        route();
    };
  }
}
navigation();
soundUI();
try {
  [games, categories] = await Promise.all(
    ["games", "categories"].map(async (key) => {
      const r = await fetch(`data/${key}.json`);
      if (!r.ok) throw Error("load");
      return r.json();
    }),
  );
  window.addEventListener("hashchange", route);
  let resize;
  window.addEventListener("resize", () => {
    clearTimeout(resize);
    resize = setTimeout(() => {
      if (location.hash === "#library") library();
      if (location.hash === "#collection") collection();
    }, 150);
  });
  route();
} catch {
  main.innerHTML =
    '<div class="empty"><h1>놀이를 불러오지 못했어요.</h1><p>연결을 확인하고 다시 열어주세요.</p><button class="button orange" onclick="location.reload()">다시 불러오기</button></div>';
}
