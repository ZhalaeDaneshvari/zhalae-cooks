import rss from '@astrojs/rss';
import { publicDishes, publicJournal, href } from '../lib';
import { siteConfig } from '../config';
import type { APIContext } from 'astro';
export async function GET(context: APIContext) {
  const [dishes, journal] = await Promise.all([publicDishes(),publicJournal()]);
  return rss({ title: siteConfig.siteName, description: siteConfig.siteDescription, site: context.site!, items: [...dishes.map(d => ({ title: d.data.title, description: d.data.description || d.data.title, pubDate: d.data.date, link: href(`recipes/${d.data.slug}/`) })), ...journal.map(p => ({ title: p.data.title, description: p.data.description, pubDate: p.data.date, link: href(`journal/${p.data.slug}/`) }))].sort((a,b) => b.pubDate.valueOf() - a.pubDate.valueOf()) });
}
