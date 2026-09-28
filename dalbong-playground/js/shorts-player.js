import { scene } from "./art.js";
export function mountShorts(root, game) {
  let index = 0,
    elapsed = 0,
    playing = true,
    last = performance.now(),
    raf,
    closed = false;
  const scenes = game.shortScenes;
  root.innerHTML = `<div class="short-film"><div class="short-top"><span>달봉이의 ${scenes.reduce((sum, s) => sum + s.duration, 0)}초 놀이교실</span><span id="scene-count"></span></div><div class="scene-progress">${scenes.map(() => "<span><i></i></span>").join("")}</div><div id="short-art"></div><div class="short-caption"><small id="scene-title"></small><p id="scene-caption"></p></div><span class="short-brand">DALBONG PLAY CLUB</span></div><div class="player-controls"><button id="prev-scene" aria-label="이전 장면">←</button><button id="play-pause" class="button primary">일시정지</button><button id="next-scene" aria-label="다음 장면">→</button><button id="replay" aria-label="처음부터 다시보기">↻</button></div><p class="muted player-help">소리 없이도 이해할 수 있어요 · ← → 장면 이동</p>`;
  const art = root.querySelector("#short-art");
  const pause = root.querySelector("#play-pause");
  function draw() {
    const s = scenes[index];
    art.innerHTML = scene(
      s.characterAction,
      s.backgroundType,
      `${game.title}: ${s.caption}`,
    );
    root.querySelector("#scene-title").textContent = s.sceneTitle;
    root.querySelector("#scene-caption").textContent = s.caption;
    root.querySelector("#scene-count").textContent =
      `${index + 1} / ${scenes.length}`;
    root.querySelector("#prev-scene").disabled = index === 0;
    root.querySelector("#next-scene").disabled = index === scenes.length - 1;
    sync();
  }
  function sync() {
    root.classList.toggle("paused", !playing);
    pause.textContent = playing
      ? "일시정지"
      : index === scenes.length - 1 && elapsed >= scenes[index].duration
        ? "다시보기"
        : "재생";
  }
  function move(n) {
    index = Math.max(0, Math.min(scenes.length - 1, n));
    elapsed = 0;
    last = performance.now();
    draw();
  }
  pause.onclick = () => {
    if (
      !playing &&
      index === scenes.length - 1 &&
      elapsed >= scenes[index].duration
    )
      move(0);
    playing = !playing;
    last = performance.now();
    sync();
  };
  root.querySelector("#prev-scene").onclick = () => move(index - 1);
  root.querySelector("#next-scene").onclick = () => move(index + 1);
  root.querySelector("#replay").onclick = () => {
    playing = true;
    move(0);
  };
  function key(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(index + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(index - 1);
    }
  }
  root.addEventListener("keydown", key);
  function tick(now) {
    if (closed) return;
    if (playing && !document.hidden) {
      elapsed += (now - last) / 1000;
      if (elapsed >= scenes[index].duration) {
        if (index < scenes.length - 1) move(index + 1);
        else {
          elapsed = scenes[index].duration;
          playing = false;
          sync();
        }
      }
    }
    last = now;
    root
      .querySelectorAll(".scene-progress i")
      .forEach(
        (bar, i) =>
          (bar.style.width = `${i < index ? 100 : i === index ? Math.min(100, (elapsed / scenes[index].duration) * 100) : 0}%`),
      );
    raf = requestAnimationFrame(tick);
  }
  draw();
  raf = requestAnimationFrame(tick);
  return () => {
    closed = true;
    cancelAnimationFrame(raf);
    root.removeEventListener("keydown", key);
  };
}
