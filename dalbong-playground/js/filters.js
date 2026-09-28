// Exact matches are never mixed with unsuitable choices in random pickers.
export function mismatches(g, f = {}) {
  const misses = [];
  if (f.place && !g.places.includes(f.place)) misses.push("장소");
  if (f.players && !(g.minPlayers <= +f.players && g.maxPlayers >= +f.players))
    misses.push("인원");
  if (f.activity && g.activityLevel !== f.activity) misses.push("활동량");
  if (
    f.duration &&
    (f.duration === "20" ? g.durationMin < 20 : g.durationMin > +f.duration)
  )
    misses.push("시간");
  if (f.materials === "none" && g.materials.length) misses.push("준비물");
  if (f.noise && g.noiseLevel !== f.noise) misses.push("소음");
  if (f.age && !(g.minAge <= +f.age)) misses.push("연령");
  if (f.team === "yes" && !g.team) misses.push("팀전");
  if (f.safe === "yes" && g.risk !== "낮음") misses.push("위험도");
  return misses;
}
export function recommend(
  games,
  f = {},
  query = "",
  category = "",
  unseen = [],
) {
  const q = query.trim().toLocaleLowerCase();
  return games
    .filter(
      (g) =>
        (!q ||
          [g.title, g.subtitle, ...g.tags]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)) &&
        (!category || g.category === category) &&
        !unseen.includes(g.id),
    )
    .map((g) => ({ game: g, misses: mismatches(g, f) }))
    .sort((a, b) => a.misses.length - b.misses.length);
}
export function eligible(games, f) {
  return games.filter((g) => mismatches(g, f).length === 0);
}
export function randomInt(n) {
  if (!Number.isInteger(n) || n < 1) throw new Error("후보가 필요해요");
  const a = new Uint32Array(1),
    limit = Math.floor(4294967296 / n) * n;
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % n;
}
export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
