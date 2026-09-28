'use strict';
const fs=require('node:fs'),path=require('node:path');
const C=require('../js/core.js');
const root=path.resolve(__dirname,'..');
try{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/manifest.json'),'utf8'));
 if(manifest.schemaVersion!==1||!Array.isArray(manifest.packs)||!manifest.packs.length)throw new Error('Invalid manifest');
 const ids=new Set(),packIds=new Set();let count=0,pics=0;
 for(const pack of manifest.packs){
  if(!/^[a-zA-Z0-9_-]+$/.test(pack.id)||packIds.has(pack.id))throw new Error('Invalid/duplicate pack ID: '+pack.id);packIds.add(pack.id);
  if(!/^content\/packs\/[a-zA-Z0-9_-]+\.json$/.test(pack.file))throw new Error('Invalid pack file: '+pack.file);
  const data=JSON.parse(fs.readFileSync(path.join(root,pack.file),'utf8'));
  if(data.schemaVersion!==1||data.id!==pack.id)throw new Error('Pack version / ID mismatch: '+pack.file);
  const parsed=C.parseWords(JSON.stringify(data),pack.id);
  if(parsed.duplicates)throw new Error('Duplicate word+meaning in '+pack.file);
  for(const w of parsed.words){
   if(ids.has(w.id))throw new Error('Duplicate word ID: '+w.id);ids.add(w.id);
   if(w.image){if(w.image.startsWith('data:'))throw new Error('Repository packs must use separate image files: '+w.id);if(!fs.existsSync(path.join(root,w.image)))throw new Error('Missing image: '+w.image);pics++;}
   count++;
  }
 }
 if(count>C.STORED_WORD_LIMIT)throw new Error('Repository content exceeds 10,000 words');
 console.log(`PASS: ${manifest.packs.length} packs, ${count} unique words, ${pics} image paths.`);
}catch(e){console.error('Content validation failed:',e.message);process.exitCode=1;}
