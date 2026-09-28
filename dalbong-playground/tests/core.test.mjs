import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  recommend,
  eligible,
  mismatches,
  randomInt,
  shuffle,
} from "../js/filters.js";
import { ladderPath } from "../js/pickers.js";
const games = JSON.parse(
  await fs.readFile(new URL("../data/games.json", import.meta.url)),
);
const categories = JSON.parse(
  await fs.readFile(new URL("../data/categories.json", import.meta.url)),
);
test("62 complete unique playable entries and local assets", async () => {
  assert.ok(games.length >= 50);
  assert.equal(new Set(games.map((g) => g.id)).size, games.length);
  for (const g of games) {
    assert.ok(categories.some((c) => c.id === g.category));
    assert.ok(
      g.title &&
        g.subtitle &&
        g.minPlayers <= g.maxPlayers &&
        g.steps.length >= 3,
    );
    assert.ok(g.safety.length && g.tips.length && g.shortScenes.length >= 3);
    assert.ok(
      g.shortScenes.every(
        (s) =>
          s.caption && s.characterAction && s.backgroundType && s.duration > 0,
      ),
    );
    const duration = g.shortScenes.reduce((a, s) => a + s.duration, 0);
    assert.ok(duration >= 15 && duration <= 30);
    await fs.access(new URL("../" + g.thumbnail, import.meta.url));
  }
});
test("filters respect exact player counts, age, materials and location", () => {
  const f = {
    place: "놀이터",
    players: "4",
    duration: "10",
    materials: "none",
  };
  const result = eligible(games, f);
  assert.ok(result.length);
  for (const g of result) {
    assert.ok(g.places.includes("놀이터"));
    assert.ok(g.minPlayers <= 4 && g.maxPlayers >= 4);
    assert.ok(g.durationMin <= 10);
    assert.equal(g.materials.length, 0);
  }
  assert.ok(!eligible(games, { age: "6" }).some((g) => g.title === "공기놀이"));
});
test("all filter dimensions exclude incompatible games", () => {
  const g = games[0];
  assert.deepEqual(
    mismatches(g, {
      place: "실내",
      players: "20",
      duration: "5",
      activity: "낮음",
      noise: "낮음",
      team: "yes",
      safe: "yes",
      age: "3",
    }),
    ["장소", "인원", "활동량", "시간", "소음", "연령", "팀전", "위험도"],
  );
});
test("ranking puts exact results first and explains near matches", () => {
  const r = recommend(games, { place: "실내", players: "2" });
  assert.equal(r[0].misses.length, 0);
  assert.ok(r.some((g) => g.misses.length > 0));
  for (let i = 1; i < r.length; i++)
    assert.ok(r[i].misses.length >= r[i - 1].misses.length);
});
test("empty pool never silently falls back; search and unseen work", () => {
  assert.equal(eligible(games, { players: "100" }).length, 0);
  assert.equal(recommend(games, {}, "딱지")[0].game.title, "딱지치기");
  assert.equal(
    recommend(
      games,
      {},
      "",
      "",
      games.map((g) => g.id),
    ).length,
    0,
  );
});
test("ladder traversal produces a permutation without impossible branch intersections", () => {
  const bridges = [
    { left: 0, y: 60 },
    { left: 2, y: 100 },
    { left: 1, y: 140 },
    { left: 0, y: 190 },
  ];
  const endpoints = [0, 1, 2, 3].map(
    (start) => ladderPath(start, bridges).index,
  );
  assert.equal(new Set(endpoints).size, 4);
  assert.deepEqual(endpoints, [2, 1, 3, 0]);
  assert.equal(ladderPath(0, [], 1).index, 0);
});
test("random index boundaries and shuffle preserve membership", () => {
  for (let i = 0; i < 100; i++) {
    const n = randomInt(6);
    assert.ok(n >= 0 && n < 6);
  }
  assert.throws(() => randomInt(0));
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
