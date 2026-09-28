/** Image storyboard player. Web scene transitions, not generated video. */
export function mountCinema(
  root,
  game,
  { sound = false, onComplete = () => {} } = {},
) {
  let index = 0,
    elapsed = 0,
    playing = true,
    last = performance.now(),
    raf,
    closed = false,
    completed = false;
  const scenes = game.shortScenes,
    total = scenes.reduce((n, s) => n + s.duration, 0);
  root.innerHTML = `<div class="film" aria-label="${game.title} 이미지 쇼츠"><div class="film-visual"><div class="story-frame"></div></div><div class="film-shade"></div><div class="film-top"><span class="film-label">달봉이 놀이교실</span><span id="film-counter"></span></div><div class="film-progress">${scenes.map((_, i) => `<button aria-label="${i + 1}장면으로 이동" data-scene="${i}"><i></i></button>`).join("")}</div><div class="film-caption"><span id="film-step"></span><h2 id="film-caption"></h2><p id="film-narration"></p></div><span class="image-note">AI 일러스트 · 이미지 쇼츠</span><button class="film-toggle" aria-label="일시정지" id="film-toggle">Ⅱ</button></div><div class="film-controls"><button id="film-prev" aria-label="이전 장면">←</button><button id="film-play" class="player-primary">일시정지</button><button id="film-next" aria-label="다음 장면">→</button><button id="film-replay" aria-label="다시보기">↻</button><span id="film-time">00:00 / 00:${total}</span></div>`;
  const picture = root.querySelector(".story-frame"),
    playButton = root.querySelector("#film-play");
  picture.style.backgroundImage = `url("${game.storyboard?.image || game.illustration}")`;
  function speak() {
    if (!sound || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(scenes[index].narration);
    u.lang = "ko-KR";
    u.rate = 1;
    const voice = speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("ko"));
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  function sync() {
    root.classList.toggle("paused", !playing);
    playButton.textContent = playing
      ? "일시정지"
      : completed
        ? "다시보기"
        : "재생";
    root.querySelector("#film-toggle").textContent = playing ? "Ⅱ" : "▶";
    root
      .querySelector("#film-toggle")
      .setAttribute("aria-label", playing ? "일시정지" : "재생");
  }
  function draw() {
    const s = scenes[index];
    picture.style.backgroundPosition = `${index % 2 ? 100 : 0}% ${index > 1 ? 100 : 0}%`;
    picture.dataset.beat = index;
    picture.classList.remove("scene-enter");
    void picture.offsetWidth;
    picture.classList.add("scene-enter");
    root.querySelector("#film-step").textContent =
      `STEP ${String(index + 1).padStart(2, "0")} / ${s.sceneTitle}`;
    root.querySelector("#film-caption").textContent = s.caption;
    root.querySelector("#film-narration").textContent =
      [
        "친구와 준비하고",
        "방법을 보고 따라 해요",
        "차례와 목표를 기억해요",
        "안전까지 챙기면 준비 끝!",
      ][index] || "";
    root.querySelector("#film-counter").textContent =
      `${index + 1} / ${scenes.length}`;
    root.querySelector("#film-prev").disabled = index === 0;
    root.querySelector("#film-next").disabled = index === scenes.length - 1;
    root
      .querySelectorAll("[data-scene]")
      .forEach((b, i) =>
        b.setAttribute("aria-current", i === index ? "step" : "false"),
      );
    sync();
    if (playing) speak();
  }
  function move(n) {
    index = Math.max(0, Math.min(scenes.length - 1, n));
    elapsed = 0;
    completed = false;
    last = performance.now();
    draw();
  }
  function toggle() {
    if (completed) {
      move(0);
      playing = true;
      completed = false;
      speak();
    } else {
      playing = !playing;
      if (playing) speak();
      else window.speechSynthesis?.cancel();
    }
    last = performance.now();
    sync();
  }
  root.querySelector("#film-prev").onclick = () => move(index - 1);
  root.querySelector("#film-next").onclick = () => move(index + 1);
  playButton.onclick = toggle;
  root.querySelector("#film-toggle").onclick = toggle;
  root.querySelector("#film-replay").onclick = () => {
    playing = true;
    move(0);
  };
  root
    .querySelectorAll("[data-scene]")
    .forEach((b) => (b.onclick = () => move(+b.dataset.scene)));
  function key(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(index + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(index - 1);
    }
    if (e.key === " " && e.target === root) {
      e.preventDefault();
      toggle();
    }
  }
  root.addEventListener("keydown", key);
  function visibility() {
    if (document.hidden) window.speechSynthesis?.cancel();
    else if (playing) speak();
    last = performance.now();
  }
  document.addEventListener("visibilitychange", visibility);
  function tick(now) {
    if (closed) return;
    if (playing && !document.hidden) {
      elapsed += (now - last) / 1000;
      if (elapsed >= scenes[index].duration) {
        if (index < scenes.length - 1) move(index + 1);
        else {
          elapsed = scenes[index].duration;
          playing = false;
          completed = true;
          sync();
          onComplete();
        }
      }
    }
    last = now;
    const current =
      scenes.slice(0, index).reduce((n, s) => n + s.duration, 0) + elapsed;
    root.querySelector("#film-time").textContent =
      `00:${String(Math.floor(current)).padStart(2, "0")} / 00:${total}`;
    root
      .querySelectorAll(".film-progress i")
      .forEach(
        (bar, i) =>
          (bar.style.width = `${i < index ? 100 : i === index ? Math.min(100, (elapsed / scenes[index].duration) * 100) : 0}%`),
      );
    raf = requestAnimationFrame(tick);
  }
  draw();
  raf = requestAnimationFrame(tick);
  const dispose = () => {
    closed = true;
    cancelAnimationFrame(raf);
    window.speechSynthesis?.cancel();
    root.removeEventListener("keydown", key);
    document.removeEventListener("visibilitychange", visibility);
  };
  dispose.pause = () => {
    playing = false;
    window.speechSynthesis?.cancel();
    sync();
  };
  return dispose;
}
