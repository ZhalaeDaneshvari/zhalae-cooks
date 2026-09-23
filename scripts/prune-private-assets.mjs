import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Content Collections register every local image, including unpublished drafts.
// Vite may emit these original files even when no public route uses them.
// Keep only image assets actually referenced by the final public document graph.
export async function prunePrivateAssets(directory) {
  const root = directory instanceof URL ? fileURLToPath(directory) : directory;
  const files = [];
  async function walk(dir) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir,item.name); if (item.isDirectory()) await walk(file); else files.push(file);
    }
  }
  await walk(root);
  const documents = await Promise.all(files.filter(file => /\.(html|css|js|xml|json|svg|txt)$/.test(file)).map(file => fs.readFile(file,'utf8')));
  const referenced = documents.join('\n').replaceAll('&amp;', '&');
  let removed = 0;
  for (const file of files) {
    if (file.startsWith(path.join(root,'_astro') + path.sep) && /\.(jpe?g|png|webp|avif|gif)$/i.test(file) && ![path.basename(file), encodeURI(path.basename(file)), encodeURIComponent(path.basename(file))].some(name => referenced.includes(name))) { await fs.unlink(file); removed++; }
  }
  console.log(`[privacy] Removed ${removed} unreferenced image assets from public output.`);
}
