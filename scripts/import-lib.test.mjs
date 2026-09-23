import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repairEncoding, normalizeTitle, currentRecord, archiveRecord, fallbackId } from './import-lib.mjs';
test('repairs exported chef emoji without damaging Unicode', () => {
  const text = '👩‍🍳Grilled Ribeye 07/31/2026';
  assert.equal(repairEncoding(Buffer.from(text).toString('latin1')), text);
  for (const value of ['café', 'Ahí tuna', '👩‍🍳', 'crème brûlée', 'سالاد']) assert.equal(repairEncoding(value), value);
  assert.equal(normalizeTitle(text).title, 'Grilled Ribeye');
  assert.equal(normalizeTitle('Lemon cookies 👩‍🍳09/26/25').title, 'Lemon cookies');
  assert.equal(normalizeTitle('Pesto pasta👩‍🍳04/28/2026').title, 'Pesto pasta');
  assert.equal(normalizeTitle('BOOKED AND BUSY 👏').needsReview, true);
});
test('uses rich labels rather than empty top-level media', () => {
  const r = currentRecord({ fbid: '123', timestamp: 10, media: [], label_values: [{ label: 'Media', media: [{ uri: 'media/posts/a.jpg' }] }, { label: 'Caption', value: 'Dinner' }, { label: 'Published', value: 'True' }, { label: 'Creation time', timestamp_value: 9 }] });
  assert.equal(r.media.length, 1); assert.equal(r.caption, 'Dinner'); assert.equal(r.id, '123'); assert.equal(r.timestamp, 9);
});
test('archive preserves galleries and deterministic caption-independent IDs', () => {
  const a = archiveRecord({ title: 'Steak', creation_timestamp: 12, media: [{ uri: 'a.jpg' }, { uri: 'b.jpg' }] });
  assert.equal(a.media.length, 2); assert.equal(fallbackId(a), fallbackId({ ...a, caption: 'Edited title' }));
});
