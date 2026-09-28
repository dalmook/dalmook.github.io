import fs from "node:fs/promises";
// Build only runtime files. Original high-resolution art stays in the authoring workspace.
const paths = [
  "index.html",
  "css/cinema.css",
  "js/cinema-app.js",
  "js/cinema-player.js",
  "js/filters.js",
  "js/storage.js",
  "js/pickers.js",
  "data/games.json",
  "data/categories.json",
  "assets/icons/ui",
];
await fs.mkdir("dist", { recursive: true });
for (const name of paths) {
  await fs.mkdir("dist/" + name.split("/").slice(0, -1).join("/"), {
    recursive: true,
  });
  await fs.cp(name, "dist/" + name, { recursive: true });
}
await fs.mkdir("dist/assets/images/v2", { recursive: true });
for (const name of await fs.readdir("assets/images/v2"))
  if (name.endsWith(".webp"))
    await fs.copyFile(
      "assets/images/v2/" + name,
      "dist/assets/images/v2/" + name,
    );
await fs.writeFile("dist/.nojekyll", "");
console.log("Static v2 ready in dist/ — no build or API needed by visitors.");
