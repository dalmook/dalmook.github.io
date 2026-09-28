import fs from "node:fs/promises";
import { scene, mascot, hero } from "../js/art.js";
await fs.mkdir("assets/images", { recursive: true });
await fs.mkdir("assets/icons", { recursive: true });
await fs.mkdir("assets/animations", { recursive: true });
const games = JSON.parse(await fs.readFile("data/games.json"));
for (const g of games)
  await fs.writeFile(
    g.thumbnail,
    scene(
      g.shortScenes[1].characterAction,
      g.shortScenes[1].backgroundType,
      g.title,
    ),
  );
await fs.writeFile("assets/images/hero.svg", hero());
for (const [name, color] of [
  ["happy", "#ffc85c"],
  ["wave", "#ffc85c"],
  ["surprise", "#ffc85c"],
  ["friend", "#f4ad92"],
])
  await fs.writeFile(
    `assets/images/dalbong-${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 160"><g transform="translate(75 55)">${name === 'wave' ? mascot(color, name).replace('M22 31 Q40 39 43 20','M22 31 Q58 6 46 -13') : mascot(color, name)}</g></svg>`,
  );
await fs.writeFile(
  "assets/icons/logo.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="#f7d789"/><g transform="translate(50 46) scale(.9)">${mascot()}</g></svg>`,
);
const cats = JSON.parse(await fs.readFile("data/categories.json"));
for (let i = 0; i < cats.length; i++)
  await fs.writeFile(
    `assets/icons/${cats[i].id}.svg`,
    scene(
      ["chase", "stop", "flip", "hop", "pass", "word", "card"][i],
      "park",
      cats[i].title,
    ),
  );
console.log("Original SVG assets generated");
