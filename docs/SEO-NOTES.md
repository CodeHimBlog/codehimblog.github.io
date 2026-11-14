# SEO implementation notes

All SEO metadata is written into the static HTML by `tools/build.mjs`. Nothing important is rendered only by JavaScript.

## Per-page metadata

Every page has:

- a unique `<title>` (ending in `| Codehimblog` unless the title already contains the name);
- a unique meta description (checked by the QA script — no duplicates across the site);
- exactly one `<h1>`;
- an absolute canonical URL on `https://codehimblog.github.io/` with a trailing slash;
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image` 1200×630, `og:site_name`, `og:locale`) and `twitter:card`;
- a visible breadcrumb plus `BreadcrumbList` JSON-LD (except the homepage and 404);
- an RSS discovery link and favicons.

Titles and descriptions for software and categories come from `seo_title` / `meta_description` in the JSON. Keep descriptions roughly 120–160 characters.

## Structured data (JSON-LD)

| Page | Types |
|---|---|
| Homepage | `WebSite` (with `SearchAction` → `/search/?q=`), `Organization` |
| `/software/` | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| Software pages | `SoftwareApplication`, `BreadcrumbList` |
| Category pages | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| `/windows/`, OS pages | `CollectionPage` (+ `ItemList` on OS pages), `BreadcrumbList` |
| About | `AboutPage`; other info pages `WebPage` |

`SoftwareApplication` includes only supported facts:

- `operatingSystem` lists only Windows versions with verified support (otherwise just `Windows`);
- `softwareVersion` and `datePublished` only when `version_verified` is true;
- `license` only when `license_verified` is true;
- `isAccessibleForFree`, `downloadUrl` (official page), `sameAs` (official site, repository).

Deliberately **not** included: `aggregateRating`, `review`, `offers`/price, download counts, file sizes. Without `offers` or ratings, Google may not show a software rich result; that is acceptable — inventing them is not. If you later add genuine user reviews collected on your own site, follow Google's review-snippet policies.

## Indexing rules

| Page | Robots | In sitemap |
|---|---|---|
| Home, `/software/`, software pages, `/categories/`, `/windows/` | index, follow | yes |
| Category pages | index if ≥ `index_rules.category_min_items` apps (default 1) | when indexable |
| `/windows-11/`, `/windows-10/`, `/windows-7/` | noindex, follow until ≥ `index_rules.os_min_items` verified apps (default 10) | when indexable |
| `/search/` | noindex, follow | no |
| Info/legal pages with unresolved `{{PLACEHOLDER: …}}` | noindex, follow (automatic) | no |
| 404, redirect pages | noindex | no |

Thresholds live in `data/site.json`. As soon as you remove the placeholders from a legal page, or an OS page reaches the threshold, the next build switches it to `index, follow` and adds it to the sitemap.

## Filters and duplicate URLs

- Filters on `/software/` do not change the URL, so no filter URLs exist to crawl.
- Search uses `/search/?q=…&os=…`, but the page is `noindex, follow` with a canonical to `/search/`.
- There are no per-filter category or OS combinations.

## Sitemap, RSS and robots

- `sitemap.xml` is rebuilt on every build from indexable pages only, with `lastmod` from `last_verified_at` / `date_added` (software) or the page's `updated` date.
- `feed.xml` (RSS 2.0) lists software listings, newest `date_added` first.
- `robots.txt` allows everything except `/tools/`, `/content/` and `/docs/`, and points to the sitemap.

## Internal linking

Header (Software, Categories, Windows compatibility, About), footer (directory, every category, all info pages), breadcrumbs, category ↔ software links, related software on each listing, and the compatibility table on `/windows/` linking to every app.

## Performance and accessibility

- One CSS file (~13 KB, unminified utilities included), one deferred JS file (~10 KB). No web fonts, no third-party requests.
- Icons are inline SVG. Screenshots (when added) use `loading="lazy"`, `decoding="async"` and explicit `width`/`height` from the JSON.
- Skip link, semantic landmarks, labelled search fields and selects, visible `:focus-visible` outline, `aria-current` on navigation and breadcrumbs, `aria-expanded` on the mobile menu (Escape closes it), screen-reader text on links that open in a new tab, reduced-motion support.

## After launch

1. Submit the sitemap in Search Console; inspect a software page with the URL Inspection tool.
2. Test a software page in Google's Rich Results Test and the Schema.org validator.
3. Re-check listings periodically (versions change often) and update `last_verified_at`.
4. Add more verified software before expecting the thin OS pages to be indexed.
