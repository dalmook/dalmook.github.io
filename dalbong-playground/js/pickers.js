import { shuffle, randomInt } from "./filters.js";
export function ladderPath(start, bridges, count = 4) {
  let col = start;
  const pts = [[40 + col * 100, 25]];
  for (const b of bridges) {
    pts.push([40 + col * 100, b.y]);
    if (b.left === col) col++;
    else if (b.left + 1 === col) col--;
    pts.push([40 + col * 100, b.y]);
  }
  pts.push([40 + col * 100, 310]);
  return {
    index: col,
    d: pts.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" "),
  };
}
export function mountPicker(root, mode, pool, onResult) {
  let disposed = false,
    busy = false,
    timer;
  let candidates = shuffle(pool).slice(
    0,
    mode === "ladder" ? 4 : mode === "card" ? 6 : 8,
  );
  const later = (f, ms) => {
    timer = setTimeout(() => {
      if (!disposed) f();
    }, ms);
  };
  const reveal = (g) => {
    busy = false;
    onResult(g);
  };
  const resetResult = () => root.querySelector(".picker-result")?.remove();
  if (!pool.length) {
    root.innerHTML =
      '<div class="empty"><h2>이 조건에 맞는 놀이가 아직 없어요.</h2><p>인원이나 장소 조건을 조금 바꿔보세요.</p><a class="button" href="#library">조건 바꾸기</a></div>';
    return () => {};
  }
  const choices = () =>
    `<div class="candidate-list">${candidates.map((g, i) => `<span><b>${i + 1}</b> ${g.title}</span>`).join("")}</div>`;
  if (mode === "wheel") {
    const n = candidates.length,
      colors = [
        "#efbb84",
        "#bad2a1",
        "#d8c3e8",
        "#aacece",
        "#edb4b3",
        "#e6d68b",
        "#b6c4e6",
        "#d6c7a5",
      ];
    root.innerHTML = `<div class="wheel-shell"><span class="pointer">▼</span><div class="wheel" style="background:conic-gradient(${candidates.map((g, i) => `${colors[i]} ${(i * 360) / n}deg ${((i + 1) * 360) / n}deg`).join(",")})">${candidates.map((g, i) => `<span style="transform:rotate(${((i + 0.5) * 360) / n}deg)"><b>${g.title}</b></span>`).join("")}</div><div class="wheel-center">놀자!</div></div><button class="button primary" id="spin">돌림판 돌리기 ↻</button>${choices()}`;
    let angle = 0;
    root.querySelector("#spin").onclick = () => {
      if (busy) return;
      busy = true;
      resetResult();
      const i = randomInt(n),
        target = (360 - ((i + 0.5) * 360) / n) % 360;
      angle += 1440 + ((target - (angle % 360) + 360) % 360);
      root.querySelector(".wheel").style.transform = `rotate(${angle}deg)`;
      root.querySelector("#spin").disabled = true;
      later(() => {
        root.querySelector("#spin").disabled = false;
        reveal(candidates[i]);
      }, 3400);
    };
  } else if (mode === "dice") {
    candidates = shuffle(pool).slice(0, 6);
    root.innerHTML = `<div class="dice-stage"><div class="die" aria-label="주사위"><img src="assets/icons/ui/dice-5.svg" alt=""></div><div class="die second" hidden><img src="assets/icons/ui/dice-3.svg" alt=""></div></div><label class="dice-option"><input id="double-dice" type="checkbox"> 주사위 2개 · 첫 주사위는 행, 두 번째는 열</label><div id="dice-mapping"></div><button class="button primary" id="roll">주사위 굴리기</button>`;
    const mapping = root.querySelector("#dice-mapping");
    const double = root.querySelector("#double-dice");
    let grid = [];
    function setup() {
      const selected = shuffle(pool).slice(0, 36);
      grid = Array.from(
        { length: 36 },
        (_, i) => selected[i % selected.length],
      );
      grid = shuffle(grid);
      root.querySelector(".second").hidden = !double.checked;
      mapping.innerHTML = double.checked
        ? `<p class="muted">두 눈이 만나는 칸의 놀이가 나와요. 후보는 ${Math.min(pool.length, 36)}개예요.</p><div class="dice-map">${grid.map((g, i) => `<span><small>${Math.floor(i / 6) + 1}·${(i % 6) + 1}</small>${g.title}</span>`).join("")}</div>`
        : `<div class="candidate-list">${Array.from({ length: 6 }, (_, i) => `<span><b>${i + 1}</b> ${candidates[i % candidates.length].title}</span>`).join("")}</div>`;
    }
    setup();
    double.onchange = setup;
    root.querySelector("#roll").onclick = () => {
      if (busy) return;
      busy = true;
      resetResult();
      double.disabled = true;
      root.querySelector("#roll").disabled = true;
      const a = randomInt(6),
        b = randomInt(6);
      root
        .querySelectorAll(".die")
        .forEach((el) => el.classList.add("rolling"));
      later(() => {
        root.querySelectorAll(".die").forEach((el, i) => {
          el.classList.remove("rolling");
          el.innerHTML = `<img src="assets/icons/ui/dice-${(i ? b : a) + 1}.svg" alt="">`;
          el.setAttribute("aria-label", `주사위 ${i ? b + 1 : a + 1}`);
        });
        double.disabled = false;
        root.querySelector("#roll").disabled = false;
        reveal(
          double.checked ? grid[a * 6 + b] : candidates[a % candidates.length],
        );
      }, 1200);
    };
  } else if (mode === "ladder") {
    const n = candidates.length;
    const bridges =
      n < 2
        ? []
        : Array.from({ length: 8 }, (_, i) => ({
            left: randomInt(n - 1),
            y: 50 + i * 30,
          }));
    root.innerHTML = `<p>출발점을 고르면 길을 따라 놀이를 찾아가요.</p><div class="ladder-starts" style="--n:${n}">${candidates.map((_, i) => `<button data-start="${i}" aria-label="${i + 1}번 출발점">${i + 1}</button>`).join("")}</div><svg class="ladder" viewBox="0 0 ${n * 100 - 20} 335" aria-label="놀이 사다리">${candidates.map((_, i) => `<path d="M${40 + i * 100} 25V310"/>`).join("")}${bridges.map((b) => `<path d="M${40 + b.left * 100} ${b.y}h100"/>`).join("")}<path id="trail"/></svg><div class="ladder-ends" style="--n:${n}">${candidates.map((g) => `<span>${g.title}</span>`).join("")}</div>`;
    root.querySelectorAll("[data-start]").forEach(
      (btn) =>
        (btn.onclick = () => {
          if (busy) return;
          busy = true;
          resetResult();
          root
            .querySelectorAll("[data-start]")
            .forEach((b) => (b.disabled = true));
          const route = ladderPath(+btn.dataset.start, bridges, n);
          const path = root.querySelector("#trail");
          path.setAttribute("d", route.d);
          const length = path.getTotalLength();
          path.style.strokeDasharray = length;
          path.style.strokeDashoffset = length;
          path.getBoundingClientRect();
          path.style.transition = "stroke-dashoffset 2s ease";
          path.style.strokeDashoffset = 0;
          later(() => {
            root
              .querySelectorAll("[data-start]")
              .forEach((b) => (b.disabled = false));
            reveal(candidates[route.index]);
          }, 2100);
        }),
    );
  } else {
    root.innerHTML = `<p>마음이 가는 카드를 콕! 오늘의 놀이가 숨어 있어요.</p><div class="draw-cards">${candidates.map((g, i) => `<button class="draw-card" data-card="${i}" aria-label="${i + 1}번 카드 뒤집기"><span class="back"><img src="assets/images/v2/hero.webp" alt=""><small>PLAY DAY</small></span><span class="front"><div class="card-art" style="background-image:url('${g.thumbnail}')"></div><b>${g.title}</b></span></button>`).join("")}</div><button class="button" id="reshuffle">카드 다시 섞기</button>`;
    root.querySelectorAll("[data-card]").forEach(
      (b) =>
        (b.onclick = () => {
          if (busy) return;
          busy = true;
          resetResult();
          root
            .querySelectorAll("[data-card]")
            .forEach((el) => (el.disabled = true));
          b.classList.add("flipped");
          later(() => reveal(candidates[+b.dataset.card]), 650);
        }),
    );
    root.querySelector("#reshuffle").onclick = () => {
      candidates = shuffle(pool).slice(0, 6);
      root.querySelectorAll("[data-card]").forEach((b, i) => {
        b.classList.remove("flipped");
        b.disabled = false;
        b.querySelector(".front").innerHTML =
          `<div class="card-art" style="background-image:url('${candidates[i].thumbnail}')"></div><b>${candidates[i].title}</b>`;
      });
      resetResult();
      busy = false;
      clearTimeout(timer);
    };
  }
  return () => {
    disposed = true;
    clearTimeout(timer);
  };
}
