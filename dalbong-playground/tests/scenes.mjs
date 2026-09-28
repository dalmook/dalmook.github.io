import puppeteer from "puppeteer-core";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const games = JSON.parse(await fs.readFile("data/games.json"));
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 320, height: 740 });
const failures = [];
try {
  await page.goto("http://127.0.0.1:4173/#shorts/play-01", {
    waitUntil: "networkidle0",
  });
  for (const g of games) {
    await page.evaluate((id) => (location.hash = "#shorts/" + id), g.id);
    await page.waitForFunction(
      (title) =>
        document.querySelector(".shorts-description h2")?.textContent === title,
      {},
      g.title,
    );
    await page.click("#play-pause");
    for (let i = 0; i < g.shortScenes.length; i++) {
      const bounds = await page.evaluate(() => {
        const film = document
            .querySelector(".short-film")
            .getBoundingClientRect(),
          caption = document
            .querySelector(".short-caption")
            .getBoundingClientRect(),
          text = document
            .querySelector("#scene-caption")
            .getBoundingClientRect(),
          brand = document
            .querySelector(".short-brand")
            .getBoundingClientRect();
        return {
          fits:
            caption.top >= film.top &&
            caption.bottom <= brand.top &&
            text.bottom <= caption.bottom,
          film: film.height,
          caption: caption.height,
        };
      });
      if (!bounds.fits) failures.push({ id: g.id, scene: i, ...bounds });
      if (i < g.shortScenes.length - 1) await page.click("#next-scene");
    }
  }
  assert.deepEqual(failures, []);
  await page.setViewport({ width: 1440, height: 1080 });
  await page.goto("http://127.0.0.1:4173/#home");
  await page.waitForSelector(".hero");
  await page.evaluate(async () => {
    document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
    await Promise.all(
      [...document.images].map((i) => i.decode().catch(() => {})),
    );
  });
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.evaluate(() => (location.hash = "#shorts/play-19"));
  await page.waitForSelector(".short-film");
  await page.click("#next-scene");
  await page.screenshot({
    path: "test-results/shorts-mobile.png",
    fullPage: true,
  });
  await fs.writeFile(
    "test-results/scenes-report.json",
    JSON.stringify(
      {
        games: games.length,
        scenes: games.reduce((n, g) => n + g.shortScenes.length, 0),
        width: 320,
        passed: true,
      },
      null,
      2,
    ),
  );
  console.log("248 scene captions fit at 320px. Final screenshots captured.");
} finally {
  await browser.close();
}
