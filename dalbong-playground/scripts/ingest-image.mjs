import sharp from 'sharp';import fs from 'node:fs/promises';
const [source,id]=process.argv.slice(2);if(!source||!/^play-\d{2}$|^hero$/.test(id))throw Error('source and asset id required');
await fs.mkdir('assets/images/v2',{recursive:true});const target=`assets/images/v2/${id}.webp`;
await sharp(source).webp({quality:88,effort:5}).toFile(target);
const meta=await sharp(target).metadata();console.log(JSON.stringify({id,target,width:meta.width,height:meta.height,size:(await fs.stat(target)).size}));
