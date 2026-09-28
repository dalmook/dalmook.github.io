import fs from "node:fs/promises";
await fs.mkdir("dist", { recursive: true });
for (const name of ["index.html", "css", "js", "data", "assets"])
  await fs.cp(name, `dist/${name}`, { recursive: true });
await fs.writeFile("dist/.nojekyll", "");
console.log("Static site ready: dist/");
