import { createHash } from 'node:crypto';
// Only decode suspicious byte runs, never an entire ordinary Unicode string.
export function repairEncoding(text = '') {
  return String(text).replace(/[\u0080-\u00ff]+/g, run => {
    if (!/[\u00c2-\u00f4][\u0080-\u00bf]/.test(run)) return run;
    try { return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(run, c => c.charCodeAt(0))); }
    catch { return run; }
  }).normalize('NFC');
}
const chef = /[👩👨🧑](?:[\u{1F3FB}-\u{1F3FF}])?\u200d🍳/gu;
export function normalizeTitle(caption) {
  let title = repairEncoding(caption).split(/\n/)[0].replace(chef, ' ').replace(/\s*\b\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/, '').replace(/\s+/g, ' ').trim();
  const food = /chicken|steak|ribeye|salmon|tuna|scallop|shrimp|rice|pasta|linguine|rigatoni|cookie|rolls|wings|salad|duck|burger|bruschetta|snapper|octopus|tofu|guac|salsa|tzatziki|shakshouka|mushroom|nachos|fajita|curry|porterhouse|squash|carpaccio|toast|edamame/i.test(title);
  return { title: title || 'Untitled kitchen entry', needsReview: !food || title.length > 180 || /[\u0080-\u009f]/.test(title) };
}
export function suggestCategory(title) {
  if (/cookie|cinnamon roll/i.test(title)) return 'Dessert';
  if (/shakshouka|avocado toast/i.test(title)) return 'Breakfast';
  if (/^homemade tzatziki$|^heirloom tomato bruschetta|^watermelon.*salad/i.test(title)) return 'Sides';
  if (/chicken|wings|steak|ribeye|salmon|tuna|scallop|shrimp|duck|burger|linguine|rigatoni|pasta|snapper|octopus|tofu|curry|porterhouse/i.test(title)) return 'Dinner';
  return 'Other';
}
export function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 85).replace(/-$/, '') || 'kitchen-entry';
}
export const mediaKey = uri => String(uri).split('/').pop().replace(/\.[^.]+$/, '');
export function currentRecord(record) {
  if (!record || !Array.isArray(record.label_values)) throw new Error('Invalid label_values');
  const fields = Object.fromEntries(record.label_values.filter(field => field && typeof field === 'object').map(field => [field.label, field]));
  if (!Array.isArray(fields.Media?.media) || !fields.Media.media.every(m => m && typeof m.uri === 'string')) throw new Error('Invalid media list');
  return { id: record.fbid ? String(record.fbid) : null, caption: fields.Caption?.value ?? '', timestamp: fields['Creation time']?.timestamp_value || record.timestamp, media: fields.Media?.media ?? [], published: String(fields.Published?.value).toLowerCase() === 'true', archived: false };
}
export function archiveRecord(record) {
  if (!record || !Array.isArray(record.media) || !record.media.every(m => m && typeof m.uri === 'string')) throw new Error('Invalid archived media');
  return { id: record.fbid ? String(record.fbid) : null, caption: record.title || record.media.find(m => m.title)?.title || '', timestamp: record.creation_timestamp || record.media[0]?.creation_timestamp, media: record.media, published: true, archived: true };
}
export function fallbackId(record) {
  return `archive-${createHash('sha256').update(record.media.map(m => m.uri).sort().join('|') + ':' + record.timestamp).digest('hex').slice(0, 16)}`;
}
