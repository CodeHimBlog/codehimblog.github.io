# URL migration report

## What was available

- **Starter project** (`codehimblog-starter.zip`): 22 HTML pages plus `sitemap.xml`, `robots.txt`, `feed.xml`, `404.html`, `assets/css/style.css`, `assets/js/site.js`, `data/software.json`, `data/categories.json`.
- **Live/old website:** not included in the project. Its URLs could not be inspected, so they are **not** covered below. See "Old live site" at the end.

## Starter URLs → new site

Every starter URL is preserved at the same address.

| Starter URL | New site | Notes |
|---|---|---|
| `/` | Preserved | Rebuilt homepage |
| `/software/` | Preserved | Now server-rendered (works without JS) + filters |
| `/software/sharex/` | Preserved | Expanded listing |
| `/software/obs-studio/` | Preserved | Expanded listing |
| `/software/keepassxc/` | Preserved | Expanded listing; version verified |
| `/categories/` | Preserved | |
| `/categories/security/` | Preserved | |
| `/categories/graphics/` | Preserved | |
| `/categories/audio-video/` | Preserved | |
| `/categories/system-utilities/` | Preserved | Previously empty; now lists 7-Zip |
| `/categories/developer-tools/` | Preserved | Previously empty; now lists Notepad++ |
| `/search/` | Preserved | `noindex, follow` |
| `/windows-7/` | Preserved | `noindex` until threshold met |
| `/windows-10/` | Preserved | `noindex` until threshold met |
| `/windows-11/` | Preserved | `noindex` until threshold met |
| `/about/` | Preserved | Rewritten |
| `/contact/` | Preserved | `noindex` until placeholders completed |
| `/privacy-policy/` | Preserved | `noindex` until placeholders completed |
| `/terms-and-conditions/` | Preserved | `noindex` until placeholders completed |
| `/disclaimer/` | Preserved | |
| `/editorial-policy/` | Preserved | |
| `/dmca/` | Preserved | `noindex` until placeholders completed |
| `/404.html` | Preserved | |

## New URLs

| URL | Purpose |
|---|---|
| `/windows/` | Compatibility overview and methodology (target of the "Windows compatibility" menu item) |
| `/software/7-zip/` | New listing |
| `/software/notepad-plus-plus/` | New listing |

## Removed or replaced files

| Starter file | Status |
|---|---|
| `assets/css/style.css` | Replaced by generated `assets/css/site.css`. Not a page URL; no redirect needed. |
| `assets/js/site.js` | Rewritten at the same path. |
| `data/software.json` | Same path, new extended schema (old fields `platforms`, `version`, `repo`, `website`, `download`, `category_slug` were replaced). Anything outside this site that read the old JSON must be updated. |

No pages were removed, so no redirects are required for the starter.

## Old live site (action needed)

If a previous version of codehimblog.github.io was live (for example a blog with posts), do this before replacing the repository contents:

1. Export its URLs: download the current `sitemap.xml`, or list pages from Search Console (**Indexing → Pages**) and any backlinks you know about.
2. For each URL, decide: keep (recreate the content at the same path), redirect to the closest new page, or let it return 404 (only when there is no equivalent).
3. Add redirects to `data/redirects.json`, for example:

   ```json
   [
     { "from": "/2023/05/best-screenshot-tools/", "to": "/categories/graphics/" },
     { "from": "/p/about-us.html/", "to": "/about/" }
   ]
   ```

   Each entry generates `<from>/index.html` with an instant meta-refresh + JavaScript redirect, a canonical link to the target and `noindex`. GitHub Pages cannot send real HTTP 301 redirects, so this is the closest compatible option. `from` must be a directory-style path ending in `/`. For old URLs ending in `.html`, create that exact file manually or keep the old file with a redirect.
4. Rebuild, deploy, and spot-check each old URL.

Search engines usually follow meta-refresh redirects, but there is **no guarantee** that rankings, indexing or link value transfer to the new pages. Expect some fluctuation after the switch.
