# zhalae cooks

A static, mobile-first personal food journal built with Astro 5, TypeScript, Tailwind CSS 4, and Markdown Content Collections. No database, API, scraped feed, paid service, or invented recipe. Fonts are self-hosted. Photographs are optimized into responsive WebP images.

## Start here

Use Node **22.19 or newer** (`nvm use` uses `.nvmrc`), then:

```sh
npm ci
npm run dev
```

Open http://localhost:4321/zhalae-cooks/. The default base follows this repository's GitHub Pages URL. For a root-path preview: `SITE_BASE=/ npm run dev`.

```sh
npm run check       # Content schema and TypeScript checks
npm test            # Import normalization/parser checks
npm run build       # Static output in dist/
npm run preview     # Preview the production build
node scripts/verify-build.mjs # Verify links, assets and draft exclusion
```

If Astro telemetry is restricted in your environment, prefix commands with `ASTRO_TELEMETRY_DISABLED=1`.

## Personalize it

- **Name, description, author, Instagram, Substack, email and default sharing image:** `src/config.ts`. Set `substackUrl` to your real full URL; until then, the newsletter is an honest coming-soon panel with an Instagram link. No email addresses are collected.
- **Colors:** the `:root` CSS variables at the top of `src/styles/global.css`. `--cream`, `--paper`, `--ink`, `--muted`, `--olive`, `--accent`, `--line`, `--white`. Keep text/background contrast accessible. Fonts are `--serif` and `--sans`.
- **Homepage:** introductory copy is in `src/config.ts`; editorial copy and photo selection are in `src/pages/index.astro`.
- **About:** edit `src/data/about.json`. The page now tells the supplied story of learning to cook from her dad, with three family photographs in `src/assets/about/`. The childhood close-up uses CSS, preserving the complete photograph. Edit `src/pages/about.astro` to change the album layout.
- **Public starting selection:** `src/data/featured-imports.json` is an explicit list of Instagram import IDs permitted to appear while their source files remain drafts. All 61 current food entries are now explicitly published with `draft: false`. Archived and unrelated entries remain drafts. The original 18-entry starting selection remains available for reference. The four homepage spotlights are chosen in `src/data/spotlight-imports.json`. Remove an ID to hide it again. This override never publishes entries marked `needsReview` or `archivedOnInstagram`. Publishing by `draft: false` is an explicit author decision and can include archived entries.
- **Journal:** contains nine kitchen notes based on the owner’s account of her spices, salt, steak, chicken thighs and potatoes, plus an unpublished starter draft.

## Add a dish or recipe

1. Copy `DISH_TEMPLATE.md` or `RECIPE_TEMPLATE.md` into `src/content/recipes/your-name.md`.
2. Add a photo to `src/assets/recipes/`. Use a relative frontmatter path such as `../../assets/recipes/my-photo.jpg`.
3. Choose a unique `slug`, fill the fields, and write any longer story underneath the closing `---`.
4. Run `npm run check`. When ready, set `draft: false`, build, and deploy.

Templates live outside collections so their placeholder images and unverified example values cannot accidentally become pages. Markdown body content is rendered on the detail page.

**Upgrade an imported dish:** edit its existing Markdown file; keep `importId`, `importSource`, `slug`, `date`, and `originalCaption`. Add actual ingredients, numbered instruction strings, prep/cook/total minutes and servings. Set `hasRecipe: true` only when all these are complete. Add optional notes, story, cuisine and difficulty, then set `draft: false`. The importer will skip this ID on future runs and preserve your work. Complete recipes gain cook mode, ingredient/step checkboxes, print layout, and Recipe JSON-LD automatically. Checkmarks are saved only in that visitor's browser, separately per recipe; Escape exits cook mode.

## Add journal writing

Copy `JOURNAL_TEMPLATE.md` to `src/content/journal/your-note.md`. Set title, unique slug, date and description; write Markdown below the frontmatter. Optional `heroImage` and `heroAlt` use paths relative to the journal file. Set `draft: false` to publish. The index, homepage preview, detail route and RSS update automatically.

## Field reference

### Dishes and recipes

| Field | Meaning |
| --- | --- |
| `title` | Required display name; editable independently of the URL. |
| `slug` | Required unique lowercase, hyphenated URL segment. Keep stable after publishing. |
| `description` | Short summary; optional/empty for imported photo entries. |
| `heroImage` | Required local image path relative to this Markdown file. |
| `heroAlt` | Required meaningful image description. |
| `gallery` | List of additional local image paths. Default `[]`. |
| `date` | Required original creation/publish timestamp or ISO date. Imported timestamps are preserved; dates written in captions may differ. |
| `hasRecipe` | `false` for photographs/dishes; `true` only for complete, documented recipes. |
| `draft` | Defaults to `true`; set `false` to publish. See the explicit starting selection above. |
| `category` | Breakfast, Lunch, Dinner, Dessert, Sides, Drinks, or Other. |
| `tags` | Searchable list of strings. |
| `favorite` | Enables the Favorites filter. Defaults to `false`. |
| `featured` | Prioritizes the entry in the homepage's latest/featured section. Defaults to `false`. |
| `originalCaption` | Entire repaired original caption, including original dates and emojis. Never silently replaced by a generated title. |
| `instagramUrl` | Optional direct post URL. An fbid is not a shortcode; the importer never fabricates a post URL. Otherwise pages link to the account. |
| `importSource` | Optional `instagram` provenance. |
| `importId` | Stable string identity, independent of title. Keep it when upgrading a dish. |
| `archivedOnInstagram` | Tracks archive membership; does not prevent explicit publication. |
| `needsReview` | Flags uncertain titles, category or incomplete media. Review before publishing. |
| `prepTime`, `cookTime`, `totalTime` | Integer minutes; required for `hasRecipe: true`. Total must be positive. |
| `servings` | Positive number; required for a recipe. |
| `ingredients` | List of actual ingredient/quantity strings; required for a recipe. |
| `instructions` | List of actual steps, rendered in numbered order; required for a recipe. |
| `difficulty`, `cuisine` | Optional strings for a recipe. |
| `notes`, `story` | Optional prose. Longer formatting can instead go in the Markdown body. |

### Journal

`title`, `slug`, `description`, `date` are required. `draft` defaults to true; `tags` defaults to an empty list. `heroImage` and `heroAlt` are optional as a pair. `relatedNotes` lists other journal slugs and renders linked follow-up notes; missing targets fail the build. `relatedDishes` lists public Instagram import IDs and adds linked dish cards. Optional `dishCollection: steak` renders a responsive collage of all published steak photographs. The Markdown body contains the article.

## Photos and privacy

Original exports are never moved or modified. The importer uses Sharp to orient, resize to at most 1800px, and re-encode JPEGs with EXIF, GPS, camera/device IDs, and other metadata stripped. Astro generates responsive WebP variants only for images used by public pages. A build-completion privacy hook removes unreferenced images that Astro/Vite may emit while loading draft collections, so draft-only photographs are excluded from `dist/`. Keep raw exports outside the repository or in the ignored `instagram-import/` directory. Do not put exports or draft images in `public/`, where files are served directly.

For manually added photos, remove personal metadata before committing them. Astro's generated web images strip metadata, but the original source file still exists in your Git repository. Only commit images you intend to keep in that source archive.

## Instagram importer

Place the unzipped export at `instagram-import/`, preserving its folders, then:

```sh
npm run import-instagram
# Or point directly at the existing export:
npm run import-instagram -- /path/to/export
```

The input directory contains `your_instagram_activity/media/posts.json`, `your_instagram_activity/media/archived_posts.json`, and the referenced `media/...` files. Paths containing spaces must be quoted.

### Architecture

- `scripts/import-lib.mjs`: conservative encoding repair, title cleanup, category suggestions and parsers for the **actual** supplied formats.
- `scripts/import-instagram.mjs`: read-only source access, normalization, archive reconciliation, metadata-stripped image copying, Markdown generation and atomic manifest writes.
- **Primary source:** `posts.json` array. Reads `fbid`, top-level/Creation-time timestamps, `label_values` Caption, Published, and Media. Does not depend on the poorer `posts_1.json` file.
- **Archive source:** `archived_posts.json.ig_archived_post_media`. Keeps each gallery, using the first successfully processed image as hero. No title-based deduplication.
- **Cross-source overlap:** matching stable media IDs reconcile archived records with current `fbid` entries, set `archivedOnInstagram: true`, and merge additional gallery images. Archive-only records use a deterministic hash of sorted source media URIs plus timestamp when no fbid exists.
- **Encoding:** only suspicious Latin-1 byte sequences are decoded through a fatal UTF-8 decoder. Already-correct Unicode is retained. Chef emojis and trailing numeric dates are removed only from titles; cleaned original captions are saved in full.
- **Review:** uncertain/non-food captions, ambiguous categories and incomplete media are flagged. Categories are suggestions to review, not editorial truth. No quantities, ingredients, instructions, times or servings are inferred.
- **Stories:** intentionally ignored; no Stories files are opened or imported.
- **Output:** `src/content/recipes/*.md`, `src/assets/recipes/imported/*.jpg` and `src/data/instagram-import-manifest.json`.
- **Manifest:** import ID, relative source media paths, slug, content destination, import timestamp, archive state and review state. No camera, GPS or unrelated raw metadata.
- **Duplicates:** both manifest IDs and existing Markdown `importId` values are checked. Re-running the same export creates zero duplicates and never overwrites edits. This is an append-only importer, not a synchronization tool: it does not update captions, archive status or newly added media for already-imported IDs. Add later edits/gallery images manually.
- **Report:** current/archive counts, unique imports, archive imports, cross-source overlaps, duplicates, malformed/unpublished records, missing/unsupported media, and new entries needing review. Missing images are reported; incomplete entries with at least one image remain drafts requiring review; entries without usable media are skipped.

The supplied export includes older entries apparently unrelated to food. They remain private drafts with `needsReview: true`; review before choosing to publish. The raw export itself is ignored by Git.

## Deploy to GitHub Pages

The included `.github/workflows/deploy.yml` installs from the lockfile, tests, checks, builds and deploys a static Pages artifact on pushes to `main` or manual runs.

1. Push this repository to GitHub.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to `main`, or run **Deploy cooking journal to GitHub Pages** from Actions.
4. Open the URL reported by the deployment job.

Default local settings are in `src/config.ts`: `siteUrl: https://zhalaedaneshvari.github.io`, `base: /zhalae-cooks`. The workflow obtains the origin and base path from `actions/configure-pages`, supporting both `username.github.io/` and `username.github.io/repository-name/`, including custom-domain configurations. All internal navigation, assets, RSS and canonical URLs use this base. Override manually with `SITE_URL` and `SITE_BASE` when needed.

```sh
SITE_URL=https://example.github.io SITE_BASE=/ npm run build
SITE_URL=https://example.github.io SITE_BASE=/my-repository npm run build
```

Sitemap generation and RSS include only public pages/entries. Recipe structured data appears only when `hasRecipe` passes the complete-recipe schema. Social metadata uses each dish's own photo. No external tracking or fragile Instagram embed.

## Verified initial import

The supplied export had 87 current and 27 archived records. After reconciling 21 overlaps, the importer produced 93 unique Markdown entries and 105 metadata-stripped photographs. All 27 archived records are represented; 15 entries require review. There were no missing or malformed media records. The importer originally generated drafts. All 61 current food entries have since been explicitly published, with four seafood favorites and a dedicated steak-frites feature. Archived and unrelated entries remain unpublished. A repeat import skipped all 93 IDs and imported zero new entries.

The final check covers TypeScript, parser/encoding tests, public links and images, absence of draft pages and draft-only assets, and both root and repository GitHub Pages base paths. The interface was reviewed at 375px, 430px, 768px and 1440px, with search/filter and cook-mode persistence checks. No Lighthouse score is claimed.
