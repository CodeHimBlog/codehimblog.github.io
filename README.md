# Codehimblog

**Free & Open-Source Software for Windows** — https://codehimblog.github.io/

Codehimblog is an independent, static software directory. It describes free and open-source Windows applications, records which Windows versions their official sources support, and links to official download pages. It never hosts or mirrors installers.

- Plain HTML5, generated CSS, vanilla JavaScript, JSON data
- No framework, no server, no database, no runtime CDN
- Deploys as-is from the repository root on GitHub Pages

---

## 1. Deploy to GitHub Pages

1. Create (or open) the repository **`codehimblog.github.io`** on GitHub.
2. Upload **the contents of this folder** to the repository root, so `index.html` sits at the top level. Keep the hidden `.nojekyll` file: it stops GitHub from running Jekyll over the files.
3. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait for the deployment to finish, then open https://codehimblog.github.io/ and check a few pages, `/sitemap.xml`, `/robots.txt` and a missing URL (to see the 404 page).
5. Add the site to Google Search Console and Bing Webmaster Tools and submit `https://codehimblog.github.io/sitemap.xml`.

Before launch, work through [`docs/LEGAL-CHECKLIST.md`](docs/LEGAL-CHECKLIST.md) and [`docs/VERIFICATION.md`](docs/VERIFICATION.md).

## 2. Edit content and rebuild

The HTML pages, `sitemap.xml`, `feed.xml`, `robots.txt`, `404.html` and `assets/css/site.css` are **generated**. Edit the sources, then rebuild:

```bash
node tools/build.mjs        # Node.js 18 or newer, no npm install needed
```

Commit the regenerated files. GitHub Pages serves them directly — there is no build step on GitHub.

| What you want to change | Edit this |
|---|---|
| Add or update software | `data/software.json` |
| Categories | `data/categories.json` |
| Windows versions / landing pages | `data/os.json` |
| Site name, URL, indexing thresholds | `data/site.json` |
| About, legal and policy pages | `content/pages/*.html` |
| Redirects from old URLs | `data/redirects.json` |
| Layout, header, footer, components | `tools/lib/layout.mjs`, `tools/build.mjs` |
| Base styles and components | `tools/src/base.css` |
| Search, filters, mobile menu | `assets/js/site.js` |

The build stops with an error if a record references an unknown category, OS or related app, if a canonical URL is wrong, if `latest_version` is set without `version_verified: true`, or if a template uses a utility class the CSS compiler does not know.

### Adding a software listing

1. Copy an existing object in `data/software.json` and change every field. Use a lowercase URL slug (`my-app`); the page will be `/software/my-app/`.
2. Fill `supported_operating_systems` honestly (see the status values below). Only `"status": "supported"` with `"verified": true` counts as verified support.
3. Leave `latest_version`, `release_date`, file names, sizes and checksums as `null` unless you have checked them on an official source.
4. Set `last_verified_at` to the date you checked, and `verification_status` to `verified` or `partial`.
5. Run `node tools/build.mjs`. The page, category listings, Windows pages, sitemap and RSS feed update automatically. Pages for slugs removed from the JSON are deleted from `/software/`.

**Compatibility status values**

| status | Meaning | Counts as verified? |
|---|---|---|
| `supported` | Official source states support for the current release | Only with `verified: true` |
| `legacy` | Only an older release supports it (`legacy_version`) | No |
| `runs_unsupported` | Project says it runs but is not supported | No |
| `reported` | Secondary source only | No |
| `not_listed` | Official source lists other versions only | No |
| `unknown` | No reliable information | No |

**Download asset `kind` values:** `installer` (EXE/MSI), `portable` (ZIP/7z or other portable archive), `source` (source code – never shown as installable), `other`.

## 3. Project structure

```
/                         index.html (homepage), 404.html, sitemap.xml, feed.xml, robots.txt, favicon.svg, .nojekyll
/software/                directory + one folder per app (/software/<slug>/index.html)
/categories/              category index + one folder per category
/windows/                 compatibility overview (indexable)
/windows-11/ /windows-10/ /windows-7/   OS landing pages (noindex until they reach the threshold)
/search/                  client-side search (noindex, follow)
/about/ /contact/ /privacy-policy/ /terms-and-conditions/ /disclaimer/ /editorial-policy/ /dmca/
/assets/css/site.css      generated stylesheet (≈13 KB)
/assets/js/site.js        vanilla JS (≈10 KB): mobile menu, catalogue filters, search
/assets/img/              favicon PNGs, logo, Open Graph image
/data/                    JSON catalogue (also read by search in the browser)
/content/pages/           source HTML for information/legal pages
/tools/                   generator (build.mjs), CSS compiler, icons, base CSS
/docs/                    SEO notes, legal checklist, migration report, verification log
```

`/tools/`, `/content/` and `/docs/` are published by GitHub Pages but are disallowed in `robots.txt` and not linked from the site.

## 4. Styling: Tailwind CSS without a runtime

Templates use Tailwind CSS utility classes (v3 default names and values). `tools/lib/utilities.mjs` scans the generated HTML and `assets/js/site.js`, and writes only the utilities actually used into `assets/css/site.css`, after the base/component layer in `tools/src/base.css`. There is no Tailwind CDN or browser compiler.

The official Tailwind CLI could not be installed while building this project (no package network access), so this small dependency-free compiler was written instead. Because markup uses standard Tailwind class names, you can switch to the official CLI later with the included `tailwind.config.cjs`:

```bash
npx tailwindcss@3 -c tailwind.config.cjs -i tools/src/tailwind-input.css -o assets/css/site.css --minify
```

Run it after `node tools/build.mjs` (which would otherwise overwrite `site.css`). If you add a class the built-in compiler does not support, the build tells you which one; either add it to `tools/lib/utilities.mjs` or switch to the official CLI.

Icons are inline SVGs from [Lucide](https://lucide.dev) (ISC license), embedded at build time in `tools/lib/icons.mjs` — no icon library is loaded in the browser.

Design tokens: primary `#2563EB` (hover `#1D4ED8`), text `#0F172A`, secondary text `#64748B`, background `#F8FAFC`, borders `#E2E8F0`, success `#15803D`; radii 8–12 px; system font stack.

## 5. Behaviour without JavaScript

- All software, category, Windows and information pages are complete static HTML.
- The mobile menu is shown expanded when JavaScript is off.
- The homepage search box submits to `/search/`; without JavaScript that page links to the directory and categories.
- Catalogue filters on `/software/` are hidden without JavaScript; all listings remain visible.

## 6. Advertising readiness

No advertising code or placeholder units are included. If you enable advertising later:

- Suitable positions: between homepage sections (after “Browse by category” or “Featured software”), below the card grid on category pages, and on software pages between content sections **in the main column below “Key features”** — never in the header block or the “At a glance” sidebar next to the download buttons.
- Never place an ad that could be mistaken for an official download button.
- Before enabling ads, analytics or cookies: add a consent mechanism where required, update the privacy policy, disclaimer, about and editorial policy pages, and set `advertising_enabled` / `analytics_enabled` in `data/site.json` for your own records.

## 7. Documentation

- [`docs/SEO-NOTES.md`](docs/SEO-NOTES.md) – how titles, canonicals, structured data, sitemap and indexing rules work
- [`docs/LEGAL-CHECKLIST.md`](docs/LEGAL-CHECKLIST.md) – placeholders and decisions required before launch
- [`docs/MIGRATION-REPORT.md`](docs/MIGRATION-REPORT.md) – existing vs new URLs
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) – what was verified, when, and what still needs human checking

**The legal pages are general templates, not legal advice.** Have them reviewed for your situation.

## 8. Future automation (Cloudhim/Basehim)

The data model is deliberately separate from the templates. An external application can generate the same `data/*.json` files (one object per app, fields as in `data/software.json`) and then either run `node tools/build.mjs` or emit HTML with the same structure. Keep `canonical_url` = `https://codehimblog.github.io/software/<slug>/`, and only set verified flags when the data comes from official release sources.
