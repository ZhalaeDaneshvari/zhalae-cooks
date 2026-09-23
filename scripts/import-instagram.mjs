import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parse, stringify } from 'yaml';
import { currentRecord, archiveRecord, fallbackId, mediaKey, repairEncoding, normalizeTitle, suggestCategory, slugify } from './import-lib.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(process.argv[2] || path.join(root, 'instagram-import'));
const contentDir = path.join(root, 'src/content/recipes');
const manifestPath = path.join(root, 'src/data/instagram-import-manifest.json');
const report = { detectedCurrent: 0, detectedArchived: 0, imported: 0, currentImported: 0, archivedImported: 0, overlapsMerged: 0, duplicatesSkipped: 0, malformedSkipped: 0, unpublishedSkipped: 0, mediaMissing: 0, unsupportedMedia: 0, needsReview: 0 };
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
async function main() {
  await fs.mkdir(contentDir, { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  const current = await read(path.join(input, 'your_instagram_activity/media/posts.json'));
  let archived;
  try { archived = (await read(path.join(input, 'your_instagram_activity/media/archived_posts.json'))).ig_archived_post_media; }
  catch (error) { if (error.code !== 'ENOENT') throw error; archived = []; }
  if (!Array.isArray(current) || !Array.isArray(archived)) throw new Error('Unexpected export structure');
  report.detectedCurrent = current.length; report.detectedArchived = archived.length;
  const records = [], mediaIndex = new Map();
  for (const raw of current) {
    try {
      const r = currentRecord(raw);
      if (!r.published) { report.unpublishedSkipped++; continue; }
      records.push(r); for (const m of r.media) mediaIndex.set(mediaKey(m.uri), r);
    } catch { report.malformedSkipped++; }
  }
  for (const raw of archived) {
    try {
      const r = archiveRecord(raw), existing = r.media.map(m => mediaIndex.get(mediaKey(m.uri))).find(Boolean);
      if (existing) {
        existing.archived = true;
        const keys = new Set(existing.media.map(m => mediaKey(m.uri)));
        existing.media.push(...r.media.filter(m => !keys.has(mediaKey(m.uri))));
        report.overlapsMerged++;
      } else { r.id ||= fallbackId(r); records.push(r); }
    } catch { report.malformedSkipped++; }
  }
  let manifest = [];
  try { manifest = await read(manifestPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const known = new Set(manifest.map(m => m.importId));
  // Content is also authoritative if a manifest is lost; never overwrite author edits.
  for (const name of await fs.readdir(contentDir)) {
    if (!name.endsWith('.md')) continue;
    const raw = await fs.readFile(path.join(contentDir, name), 'utf8');
    const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (front) { const id = parse(front[1])?.importId; if (id) known.add(String(id)); }
  }
  const realInput = await fs.realpath(input);
  for (const r of records) {
    if (!r.id || !r.media.length || !Number.isFinite(r.timestamp) || r.timestamp <= 0) { report.malformedSkipped++; continue; }
    if (known.has(r.id)) { report.duplicatesSkipped++; continue; }
    const originalCaption = repairEncoding(r.caption);
    const normalized = normalizeTitle(originalCaption), category = suggestCategory(normalized.title);
    const slug = `${slugify(normalized.title)}-${slugify(r.id)}`;
    const images = [];
    let incomplete = false;
    for (const [i, m] of r.media.entries()) {
      if (typeof m.uri !== 'string' || !/\.(jpe?g|png|webp)$/i.test(m.uri)) { report.unsupportedMedia++; incomplete = true; continue; }
      const source = path.resolve(input, m.uri);
      try {
        const realSource = await fs.realpath(source);
        if (!realSource.startsWith(realInput + path.sep)) throw new Error('Unsafe media path');
        const name = `${slug}-${i + 1}.jpg`;
        const target = path.join(root, 'src/assets/recipes/imported', name);
        // sharp discards EXIF, GPS, XMP and device metadata by default; rotate first.
        await sharp(realSource).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(target);
        images.push(`../../assets/recipes/imported/${name}`);
      } catch (error) {
        if (error.code === 'ENOENT') report.mediaMissing++;
        else { report.malformedSkipped++; console.error(`Media could not be processed for ${r.id}: ${error.message}`); }
        incomplete = true;
      }
    }
    if (!images.length) { report.malformedSkipped++; continue; }
    const needsReview = normalized.needsReview || category === 'Other' || incomplete;
    const data = { title: normalized.title, slug, description: '', heroImage: images[0], heroAlt: normalized.title, gallery: images.slice(1), date: new Date(r.timestamp * 1000).toISOString(), originalCaption, importSource: 'instagram', importId: r.id, tags: [], category, favorite: false, featured: false, archivedOnInstagram: r.archived, hasRecipe: false, draft: true, needsReview };
    const destinationContentFile = `src/content/recipes/${slug}.md`;
    await fs.writeFile(path.join(root, destinationContentFile), `---\n${stringify(data)}---\n`, { flag: 'wx' });
    manifest.push({ importId: r.id, sourceMedia: r.media.map(m => m.uri), slug, destinationContentFile, importedAt: new Date().toISOString(), archivedOnInstagram: r.archived, needsReview });
    await fs.writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n');
    await fs.rename(manifestPath + '.tmp', manifestPath);
    known.add(r.id); report.imported++; if (r.archived) report.archivedImported++; else report.currentImported++;
    if (needsReview) report.needsReview++;
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(`Import failed: ${error.message}`); process.exitCode = 1; });
