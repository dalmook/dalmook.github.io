// Connect individually generated storyboard assets to the editable game catalogue.
import fs from 'node:fs/promises';
const games=JSON.parse(await fs.readFile('data/games.json','utf8'));
for(const game of games){
  game.thumbnail=`assets/images/v2/${game.id}.webp`;
  game.illustration=game.thumbnail;
  game.storyboard={image:game.thumbnail,columns:2,rows:2,artType:'AI-generated illustration',panelAspectRatio:'2:3'};
  game.shortScenes.forEach((scene,index)=>{scene.panel=index;});
}
await fs.writeFile('data/games.json',JSON.stringify(games,null,2)+'\n');
const pkg=JSON.parse(await fs.readFile('package.json'));pkg.version='2.0.0';pkg.scripts.dev=pkg.scripts.start;
await fs.writeFile('package.json',JSON.stringify(pkg,null,2)+'\n');
let pickers=await fs.readFile('js/pickers.js','utf8');
pickers=pickers.replace('<div class="die" aria-label="주사위">⚄</div><div class="die second" hidden>⚂</div>','<div class="die" aria-label="주사위"><img src="assets/icons/ui/dice-5.svg" alt=""></div><div class="die second" hidden><img src="assets/icons/ui/dice-3.svg" alt=""></div>');
pickers=pickers.replace('el.textContent = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][i ? b : a];','el.innerHTML = `<img src="assets/icons/ui/dice-${(i ? b : a)+1}.svg" alt="">`;');
pickers=pickers.replaceAll('<span class="back">✦<small>PLAY DAY</small></span>','<span class="back"><img src="assets/images/v2/hero.webp" alt=""><small>PLAY DAY</small></span>');
pickers=pickers.replaceAll('<img src="${g.thumbnail}" alt="">','<div class="card-art" style="background-image:url(\'${g.thumbnail}\')"></div>');
pickers=pickers.replaceAll('<img src="${candidates[i].thumbnail}" alt="">','<div class="card-art" style="background-image:url(\'${candidates[i].thumbnail}\')"></div>');
await fs.writeFile('js/pickers.js',pickers);
console.log(`Connected ${games.length} storyboards; preserved all existing game rules.`);
