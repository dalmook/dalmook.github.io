// Run after npm start. Uses installed puppeteer-core and local Chrome, never a user profile.
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
await fs.mkdir("test-results", { recursive: true });
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = "http://127.0.0.1:4173/";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const go = async (hash) => {
  await page.goto(url + hash, { waitUntil: "networkidle0" });
  await page.waitForSelector("main h1");
};
try {
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 1 });
  await go("#home");
  assert.equal(await page.$$eval(".game-card", (els) => els.length), 8);
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.click('[data-preset="quick"]');
  await page.waitForSelector(".library-filters");
  assert.ok(
    (await page.$eval(".section-title h2", (e) => e.textContent)).includes(
      "딱 맞는",
    ),
  );
  await page.select('select[name="materials"]', "none");
  await page.click('#filters [type="submit"]');
  assert.ok(await page.$(".game-card"));
  await page.click(".game-card a");
  await page.waitForSelector(".detail-hero");
  await page.click("[data-favorite]");
  assert.equal(await page.$eval("#fav-count", (e) => e.textContent), "1");
  await page.click("#start-game");
  await page.waitForSelector("dialog[open]");
  await page.click("#ready-space");
  await page.click("#timer-start");
  await wait(1100);
  assert.notEqual(await page.$eval(".timer", (e) => e.textContent), "10:00");
  await page.click("#complete-play");
  await page.waitForSelector("dialog", { hidden: true });
  await go("#collection");
  assert.ok(
    (await page.$eval(".collection-stats", (e) => e.textContent)).includes("1"),
  );
  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await page.$eval("#fav-count", (e) => e.textContent), "1");
  for (const mode of ["wheel", "dice", "ladder", "card"]) {
    await go("#pick/" + mode);
    await page.click(
      {
        wheel: "#spin",
        dice: "#roll",
        ladder: '[data-start="0"]',
        card: '[data-card="0"]',
      }[mode],
    );
    await page.waitForSelector(".picker-result", { timeout: 7000 });
    assert.ok(await page.$eval(".picker-result h2", (e) => e.textContent));
    if (mode === "wheel") {
      const result = await page.$eval(
        ".picker-result h2",
        (e) => e.textContent,
      );
      const rotation = await page.$eval(
        ".wheel",
        (e) => +e.style.transform.match(/rotate\((.+)deg/)[1],
      );
      const labels = await page.$$eval(".wheel b", (els) =>
        els.map((e) => e.textContent),
      );
      const idx = Math.floor(
        ((360 - (rotation % 360)) % 360) / (360 / labels.length),
      );
      assert.equal(result, labels[idx]);
    }
    if (mode === "dice") {
      await page.click("#double-dice");
      await page.click("#roll");
      await page.waitForSelector(".picker-result");
      const faces = await page.$$eval(".die", (els) =>
        els.map((e) => "⚀⚁⚂⚃⚄⚅".indexOf(e.textContent)),
      );
      const cell = await page.$$eval(".dice-map span", (els) =>
        els.map((e) => e.textContent.slice(3)),
      );
      assert.equal(
        await page.$eval(".picker-result h2", (e) => e.textContent),
        cell[faces[0] * 6 + faces[1]],
      );
    }
  }
  await go("#shorts/play-19");
  await page.waitForSelector(".short-film");
  assert.ok(await page.$(".action-prepare"));
  await page.click("#next-scene");
  assert.ok(await page.$(".action-flip"));
  await page.click("#play-pause");
  const before = await page.$eval(".scene-progress i", (e) => e.style.width);
  await wait(200);
  assert.equal(
    await page.$eval(".scene-progress i", (e) => e.style.width),
    before,
  );
  await page.click("#replay");
  assert.ok(await page.$(".action-prepare"));
  await page.screenshot({
    path: "test-results/shorts-desktop.png",
    fullPage: true,
  });
  for (const width of [390, 320, 768]) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 1 });
    for (const hash of [
      "#home",
      "#library",
      "#game/play-09",
      "#pick/wheel",
      "#pick/ladder",
      "#pick/card",
      "#pick/dice",
      "#shorts/play-19",
      "#collection",
    ]) {
      await go(hash);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow ${width} ${hash}`,
      );
      if (width === 390 && ["#home", "#shorts/play-19"].includes(hash))
        await page.screenshot({
          path: `test-results/${hash.includes("shorts") ? "shorts" : "home"}-mobile.png`,
          fullPage: true,
        });
    }
  }
  await page.setViewport({ width: 390, height: 844 });
  await go("#library");
  await page.type("#search", "없는놀이123");
  assert.ok(await page.$("#clear-search"));
  await page.click("#clear-search");
  await page.select('select[name="place"]', "집");
  await page.select('select[name="players"]', "20");
  await page.select('select[name="duration"]', "20");
  await page.select('select[name="materials"]', "none");
  await page.click('#filters [type="submit"]');
  await page.click('a[href="#pick/wheel"]');
  await page.waitForSelector(".picker-panel .empty");
  assert.equal(await page.$("#spin"), null);
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "test-results/browser-report.json",
    JSON.stringify(
      {
        passed: true,
        widths: [320, 390, 768, 1440],
        routes: 9,
        checks: [
          "filters",
          "favorites persistence",
          "timer",
          "badges",
          "four pickers",
          "wheel pointer consistency",
          "two dice mapping",
          "shorts controls",
          "empty results",
          "no overflow",
          "no JavaScript exceptions",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Browser smoke passed: all pickers, persistence, player, 3 responsive sizes, zero runtime errors.",
  );
} finally {
  await browser.close();
}
