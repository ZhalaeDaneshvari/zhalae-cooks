import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { prunePrivateAssets } from './scripts/prune-private-assets.mjs';
import { siteConfig } from './src/config.ts';
export default defineConfig({
  site: process.env.SITE_URL || siteConfig.siteUrl,
  base: process.env.SITE_BASE ?? siteConfig.base,
  output: 'static', trailingSlash: 'always', devToolbar: { enabled: false },
  integrations: [sitemap(), { name: 'private-draft-assets', hooks: { 'astro:build:done': ({ dir }) => prunePrivateAssets(dir) } }], vite: { plugins: [tailwindcss()] },
});
