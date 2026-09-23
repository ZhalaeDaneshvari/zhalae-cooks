import { getCollection, type CollectionEntry } from 'astro:content';
import featuredIds from './data/featured-imports.json';
export const href = (path = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const dateLabel = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
export type Dish = CollectionEntry<'recipes'>;
export const dishUrl = (dish: Dish) => href(`recipes/${dish.data.slug}/`);
export async function publicDishes() {
  const entries = await getCollection('recipes', ({ data }) => !data.draft || (!!data.importId && featuredIds.includes(data.importId) && !data.needsReview && !data.archivedOnInstagram));
  const slugs = entries.map(e => e.data.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('Duplicate public recipe slugs');
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
export async function publicJournal() { return (await getCollection('journal', ({ data }) => !data.draft)).sort((a,b) => b.data.date.valueOf() - a.data.date.valueOf()); }

// Keep imported captions intact in Markdown, but render plain text without emoji.
export const withoutEmoji = (value: string) => value.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200d\ufe0f]/gu, '').replace(/ {2,}/g, ' ').trim();
