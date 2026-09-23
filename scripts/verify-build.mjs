import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
const base = (process.argv[2] ?? '/zhalae-cooks').replace(/\/$/,'');
const files = [];
async function walk(dir) { for (const e of await fs.readdir(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()) await walk(p);else files.push(p); } }
await walk('dist');
let links = 0;
for (const file of files.filter(f=>f.endsWith('.html'))) {
 const html=await fs.readFile(file,'utf8');
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,`${file}: exactly one h1`);
 const refs=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>m[1]);
 for(const set of html.matchAll(/srcset="([^"]+)"/g)) refs.push(...set[1].split(',').map(s=>s.trim().split(' ')[0]));
 for(const ref of refs) {
  if(!ref.startsWith('/') || ref.startsWith('//'))continue;
  const url=new URL(ref,'https://local.test');
  assert.ok(!base || url.pathname.startsWith(base+'/'),`${file}: missing base in ${ref}`);
  let relative=decodeURIComponent(url.pathname.slice(base.length)).replace(/^\//,'');
  if(!relative || relative.endsWith('/'))relative+='index.html';
  await fs.access(path.join('dist',relative));links++;
 }
 assert.ok(!html.includes('device_id')&&!html.includes('exif_data'),`${file}: raw metadata leaked`);
}
const selected=JSON.parse(await fs.readFile('src/data/featured-imports.json','utf8'));
const manifest=JSON.parse(await fs.readFile('src/data/instagram-import-manifest.json','utf8'));
for(const entry of manifest){
 const raw=await fs.readFile(entry.destinationContentFile,'utf8');const data=parse(raw.split('---\n')[1]);
 const isPublic=!data.draft || (selected.includes(data.importId)&&!data.needsReview&&!data.archivedOnInstagram);
 const route=`dist/recipes/${data.slug}/index.html`;
 if(isPublic)await fs.access(route);
 else {assert.ok(!files.includes(route),`Draft route leaked: ${data.slug}`);assert.ok(!files.some(f=>f.includes(data.slug)),`Draft image leaked: ${data.slug}`);}
 if(isPublic&&!data.hasRecipe)assert.ok(!(await fs.readFile(route,'utf8')).includes('application/ld+json'),'Dish must not pretend to be a recipe');
}
console.log(`Verified ${files.filter(f=>f.endsWith('.html')).length} HTML pages, ${links} internal links/assets, draft exclusion, and dish structured-data rules at base ${base||'/'}.`);
