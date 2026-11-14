#!/usr/bin/env node
// Codehimblog static site generator.
//
// Usage (from the repository root):   node tools/build.mjs
//
// Reads data/*.json and content/pages/*.html, then writes every HTML page,
// sitemap.xml, feed.xml, robots.txt, 404.html and assets/css/site.css.
// Requires Node.js 18+ and has no npm dependencies. Re-run it whenever you
// add or edit a software record so pages, the sitemap and the feed stay in sync.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icon } from './lib/icons.mjs';
import { ctx, esc, appIcon, badge, STATUS, isVerifiedSupport, formatDate } from './lib/layout.mjs';
import { compileUtilities, collectClasses, collectScriptClasses } from './lib/utilities.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const site = json('data/site.json');
const software = json('data/software.json');
const categories = json('data/categories.json');
const osList = json('data/os.json');
const redirects = existsSync(join(ROOT, 'data/redirects.json')) ? json('data/redirects.json') : [];

const { abs, page, breadcrumbs, searchForm } = ctx(site);
const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
const swBySlug = Object.fromEntries(software.map((s) => [s.slug, s]));
const osBySlug = Object.fromEntries(osList.map((o) => [o.slug, o]));
const landingOs = osList.filter((o) => o.landing_page);

// ---------------------------------------------------------------- validation
const problems = [];
for (const s of software) {
  for (const f of ['id', 'name', 'slug', 'summary', 'category', 'official_website', 'seo_title', 'meta_description']) {
    if (!s[f]) problems.push(`${s.slug || '?'}: missing ${f}`);
  }
  if (!catBySlug[s.category]) problems.push(`${s.slug}: unknown category ${s.category}`);
  for (const c of s.categories) if (!catBySlug[c]) problems.push(`${s.slug}: unknown category ${c}`);
  for (const r of s.related_software) if (!swBySlug[r]) problems.push(`${s.slug}: unknown related ${r}`);
  for (const k of Object.keys(s.supported_operating_systems)) if (!osBySlug[k]) problems.push(`${s.slug}: unknown OS ${k}`);
  if (s.latest_version && !s.version_verified) problems.push(`${s.slug}: latest_version set but version_verified is false`);
  if (s.canonical_url !== `${site.url}/software/${s.slug}/`) problems.push(`${s.slug}: canonical_url mismatch`);
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

// ---------------------------------------------------------------- output
const pages = [];      // { path, html }
const sitemap = [];    // { path, lastmod }
function emit(path, html, { indexable, lastmod = site.build_date } = {}) {
  pages.push({ path, html });
  if (indexable) sitemap.push({ path, lastmod });
}
const robotsFor = (indexable) => (indexable ? 'index, follow' : 'noindex, follow');

// ---------------------------------------------------------------- helpers
const sorted = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));
const inCategory = (slug) => sorted(software.filter((s) => s.categories.includes(slug)));
const verifiedOs = (s) => osList.filter((o) => isVerifiedSupport(s, o.slug));
const hasPortable = (s) => s.download_assets.some((a) => a.kind === 'portable');
const extLink = (href, label, cls = 'text-blue-700 hover:underline') =>
  `<a href="${esc(href)}" class="${cls}" rel="noopener" target="_blank">${esc(label)}<span class="sr-only"> (opens official site in a new tab)</span></a>`;

function osBadges(s) {
  const v = verifiedOs(s).filter((o) => o.landing_page);
  if (!v.length) return badge('Windows support: see details', 'slate', 'circle-help');
  return v.map((o) => badge(o.short, 'green', 'check')).join('');
}

function softwareCard(s, headingLevel = 3) {
  const cat = catBySlug[s.category];
  const data = {
    slug: s.slug, cats: s.categories.join(' '), os: verifiedOs(s).map((o) => o.slug).join(' '),
    license: s.license_family || '', types: [...new Set(s.download_assets.map((a) => a.kind))].join(' '),
    kw: s.keywords.join(' '),
  };
  const dataAttrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<article class="card-link group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md" ${dataAttrs}>
<div class="flex items-start gap-3">
${appIcon(s)}
<div class="min-w-0">
<h${headingLevel} class="card-title font-semibold text-slate-900 transition-colors"><a href="/software/${s.slug}/" class="stretched-link">${esc(s.name)}</a></h${headingLevel}>
<p class="text-xs text-slate-500">${esc(cat.name)}</p>
</div>
</div>
<p class="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">${esc(s.summary)}</p>
<div class="mt-auto flex flex-wrap gap-1.5 pt-4">
${s.is_open_source ? badge('Open source', 'blue') : s.is_free ? badge('Free', 'blue') : ''}${osBadges(s)}
</div>
</article>`;
}

const grid = (items, cols = 'sm:grid-cols-2 lg:grid-cols-3') => `<div class="grid gap-4 ${cols}">${items.join('\n')}</div>`;

function sectionHead(title, intro, link) {
  return `<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
<div><h2 class="text-2xl font-bold tracking-tight text-slate-900">${title}</h2>${intro ? `<p class="mt-1 text-slate-600">${intro}</p>` : ''}</div>
${link ? `<a href="${link[0]}" class="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">${link[1]} ${icon('arrow-right', 'icon-sm')}</a>` : ''}
</div>`;
}

function categoryCard(c) {
  const n = inCategory(c.slug).length;
  return `<a href="/categories/${c.slug}/" class="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md">
<span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">${icon(c.icon)}</span>
<span class="min-w-0">
<span class="block font-semibold text-slate-900 group-hover:text-blue-700">${esc(c.name)}</span>
<span class="mt-1 block text-sm text-slate-600">${esc(c.short)}</span>
<span class="mt-2 block text-xs text-slate-500">${n} ${n === 1 ? 'application' : 'applications'}</span>
</span>
</a>`;
}

function itemListSchema(name, list) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', name,
    numberOfItems: list.length,
    itemListElement: list.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/software/${s.slug}/`), name: s.name })),
  };
}
const collectionSchema = (name, description, path) => ({
  '@context': 'https://schema.org', '@type': 'CollectionPage', name, description, url: abs(path),
  isPartOf: { '@type': 'WebSite', name: site.name, url: `${site.url}/` },
});

const notice = (html, tone = 'blue', iconName = 'info') => {
  const tones = { blue: 'border-blue-200 bg-blue-50 text-slate-700', amber: 'border-amber-200 bg-amber-50 text-amber-900', slate: 'border-slate-200 bg-slate-50 text-slate-700' };
  const ic = { blue: 'text-blue-700', amber: 'text-amber-700', slate: 'text-slate-500' };
  return `<div class="flex gap-3 rounded-lg border p-4 text-sm leading-6 ${tones[tone]}"><span class="${ic[tone]} mt-0.5">${icon(iconName, 'icon-sm')}</span><div>${html}</div></div>`;
};

const pageHeader = (crumbs, title, lead, extra = '') => `<div class="border-b border-slate-200 bg-white">
<div class="container py-8 sm:py-10">
${crumbs}
<h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">${title}</h1>
${lead ? `<p class="mt-3 max-w-3xl text-lg leading-7 text-slate-600">${lead}</p>` : ''}
${extra}
</div>
</div>`;

// ================================================================ HOME
{
  const featured = sorted(software.filter((s) => s.featured)).slice(0, 6);
  const recent = [...software].sort((a, b) => b.date_added.localeCompare(a.date_added) || a.name.localeCompare(b.name)).slice(0, 4);
  const portable = sorted(software.filter(hasPortable)).slice(0, 4);
  const win7 = sorted(software.filter((s) => isVerifiedSupport(s, 'windows-7'))).slice(0, 4);
  const osChip = (href, label) => `<a href="${href}" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">${icon('monitor', 'icon-sm')}${label}</a>`;
  const miniList = (list, empty) => list.length ? `<ul class="divide-y">${list.map((s) => `<li><a href="/software/${s.slug}/" class="flex items-center gap-3 py-3 hover:text-blue-700">${appIcon(s, 'sm')}<span class="min-w-0"><span class="block font-medium text-slate-900">${esc(s.name)}</span><span class="block truncate text-sm text-slate-500">${esc(catBySlug[s.category].name)}</span></span><span class="ml-auto text-slate-400">${icon('chevron-right', 'icon-sm')}</span></a></li>`).join('')}</ul>` : `<p class="text-sm text-slate-600">${empty}</p>`;

  const steps = [
    ['search', 'Find an application', 'Browse by category or search the catalogue. Every listing describes what the software does in plain language.'],
    ['monitor', 'Check Windows support', 'We mark a Windows version as supported only when the project’s own website or release notes say so.'],
    ['external-link', 'Download from the source', 'Download buttons open the official project website or release page. We never host or repackage installers.'],
    ['shield-check', 'Verify before installing', 'Check the publisher, release notes and any published checksum or signature before you run a file.'],
  ];

  const main = `
<section class="border-b border-slate-200 bg-white">
<div class="container py-12 sm:py-16">
<div class="max-w-3xl">
<p class="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">${icon('package', 'icon-xs')} ${esc(site.tagline)}</p>
<h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Useful free software for your Windows PC</h1>
<p class="mt-4 text-lg leading-8 text-slate-600">Discover free and open-source Windows applications, see which Windows versions they officially support, and go straight to the official download source.</p>
<div class="mt-8 max-w-2xl">${searchForm('home-search', 'lg')}</div>
<div class="mt-6">
<p class="text-sm font-medium text-slate-700">Browse by Windows version</p>
<div class="mt-2 flex flex-wrap gap-2">
${landingOs.map((o) => osChip(`/${o.slug}/`, o.name)).join('\n')}
${osChip('/windows/', 'Compatibility overview')}
</div>
</div>
</div>
</div>
</section>

<section class="container py-12">
${sectionHead('Browse by category', 'Start with what you need to get done.', ['/categories/', 'All categories'])}
${grid(categories.map(categoryCard))}
</section>

<section class="container pb-12">
${sectionHead('Featured software', 'Well-established projects with official Windows downloads.', ['/software/', 'Browse all software'])}
${grid(featured.map((s) => softwareCard(s)))}
</section>

<section class="container pb-12">
${sectionHead('Recently added', 'The newest listings in the directory.', ['/feed.xml', 'RSS feed'])}
${grid(recent.map((s) => softwareCard(s)), 'sm:grid-cols-2 lg:grid-cols-4')}
</section>

<section class="container pb-12">
<div class="grid gap-4 md:grid-cols-2">
<div class="rounded-xl border border-slate-200 bg-white p-6">
<div class="flex items-center gap-2 text-slate-900"><span class="text-blue-700">${icon('usb')}</span><h2 class="text-lg font-semibold">Portable options</h2></div>
<p class="mt-1 text-sm text-slate-600">Applications whose official downloads include a portable package that runs without a full installation.</p>
<div class="mt-3">${miniList(portable, 'No portable packages listed yet.')}</div>
</div>
<div class="rounded-xl border border-slate-200 bg-white p-6">
<div class="flex items-center gap-2 text-slate-900"><span class="text-blue-700">${icon('history')}</span><h2 class="text-lg font-semibold">Still supported on Windows 7</h2></div>
<p class="mt-1 text-sm text-slate-600">Current releases whose official sources still state Windows 7 support.</p>
<div class="mt-3">${miniList(win7, 'No applications with verified Windows 7 support yet.')}</div>
<p class="mt-3"><a href="/windows-7/" class="text-sm font-semibold text-blue-700 hover:underline">Windows 7 software</a></p>
</div>
</div>
</section>

<section class="container pb-4">
<div class="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
<h2 class="text-2xl font-bold tracking-tight text-slate-900">How listings and official downloads work</h2>
<p class="mt-2 max-w-3xl text-slate-600">${esc(site.name)} is a guide, not a download mirror. Here is what you can expect from every listing.</p>
<ol class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
${steps.map(([ic, t, d], i) => `<li><span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">${icon(ic)}</span><h3 class="mt-3 font-semibold text-slate-900"><span class="sr-only">Step ${i + 1}: </span>${t}</h3><p class="mt-1 text-sm leading-6 text-slate-600">${d}</p></li>`).join('\n')}
</ol>
<p class="mt-6 text-sm"><a href="/editorial-policy/" class="font-semibold text-blue-700 hover:underline">Read our editorial policy</a></p>
</div>
</section>`;

  const schema = [
    {
      '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: `${site.url}/`, description: site.description,
      inLanguage: site.language,
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
    },
    { '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: `${site.url}/`, logo: abs('/assets/img/logo-512.png') },
  ];
  emit('/', page({
    active: 'home', categories, path: '/', schema,
    title: `${site.name} – Free & Open-Source Software for Windows`,
    description: 'Discover free and open-source Windows software. Check verified Windows 11, 10 and 7 compatibility and download from official project sources.',
    main,
  }), { indexable: true });
}

// ================================================================ SOFTWARE INDEX
{
  const list = sorted(software);
  const bc = breadcrumbs([['Home', '/'], ['Software', null]]);
  const sel = (id, label, options) => `<div><label for="${id}" class="block text-xs font-semibold text-slate-600">${label}</label>
<select id="${id}" class="select mt-1">${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></div>`;
  const filterBar = `<form id="catalogue-filters" class="mb-6 rounded-xl border border-slate-200 bg-white p-4" hidden aria-label="Filter software">
<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
<div class="sm:col-span-2 lg:col-span-1"><label for="f-q" class="block text-xs font-semibold text-slate-600">Name or keyword</label><input id="f-q" type="search" class="search-input mt-1 text-sm" style="padding:.5rem .75rem" placeholder="Filter list"></div>
${sel('f-os', 'Windows version', [['', 'Any version'], ...landingOs.map((o) => [o.slug, `${o.name} (verified)`])])}
${sel('f-cat', 'Category', [['', 'All categories'], ...categories.map((c) => [c.slug, c.name])])}
${sel('f-license', 'License type', [['', 'Any license'], ['copyleft', 'Copyleft (GPL, LGPL)'], ['permissive', 'Permissive (MIT, BSD, Apache)']])}
${sel('f-type', 'Package type', [['', 'Any package'], ['installer', 'Installer (EXE/MSI)'], ['portable', 'Portable package']])}
</div>
<div class="mt-3 flex items-center justify-between gap-3 text-sm"><p id="f-count" class="text-slate-600" aria-live="polite"></p><button type="reset" class="font-semibold text-blue-700 hover:underline">Clear filters</button></div>
</form>`;
  const main = `${pageHeader(bc.html, 'Free &amp; open-source Windows software', `Every application in the ${esc(site.name)} directory, in alphabetical order. Windows badges appear only where the project’s official sources confirm support.`)}
<div class="container py-10">
${filterBar}
<div id="catalogue-grid">${grid(list.map((s) => softwareCard(s, 2)))}</div>
<p id="catalogue-empty" class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600" hidden>No software matches these filters. <button type="button" class="font-semibold text-blue-700 hover:underline" data-reset-filters>Clear filters</button></p>
</div>`;
  emit('/software/', page({
    active: 'software', categories, path: '/software/', main,
    title: 'Free & Open-Source Windows Software Directory',
    description: `Browse all free and open-source Windows applications listed on ${site.name}, with verified Windows compatibility and links to official downloads.`,
    schema: [collectionSchema('Free & open-source Windows software', 'All software listed on Codehimblog.', '/software/'), itemListSchema('All software', list), bc.schema],
  }), { indexable: true });
}

// ================================================================ SOFTWARE DETAIL
for (const s of software) {
  const cat = catBySlug[s.category];
  const bc = breadcrumbs([['Home', '/'], ['Software', '/software/'], [s.name, null]]);
  const v = verifiedOs(s);
  const versionText = s.version_verified && s.latest_version ? s.latest_version : null;
  const lastChecked = s.last_verified_at ? formatDate(s.last_verified_at) : null;

  const kinds = [
    ['installer', 'Installers', 'Standard setup programs (EXE or MSI) that install the application for you.'],
    ['portable', 'Portable packages', 'Archives you extract and run without a full installation. Some still need runtime components.'],
    ['other', 'Other packages', ''],
    ['source', 'Source code', 'Source code archives are for developers and are <strong>not ready-to-install software</strong>.'],
  ];
  const assetRows = (list) => list.map((a) => `<tr>
<td><span class="font-medium text-slate-900">${esc(a.label)}</span>${a.note ? `<span class="mt-0.5 block text-xs text-slate-500">${esc(a.note)}</span>` : ''}</td>
<td class="whitespace-nowrap">${esc(a.format)}</td>
<td class="whitespace-nowrap">${esc(a.architecture)}</td>
<td class="whitespace-nowrap"><a href="${esc(a.url)}" class="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline" rel="noopener" target="_blank">Official page ${icon('external-link', 'icon-xs')}<span class="sr-only"> for ${esc(a.label)} (opens in a new tab)</span></a></td>
</tr>`).join('');
  const downloads = kinds.map(([k, title, desc]) => {
    const list = s.download_assets.filter((a) => a.kind === k);
    if (!list.length) return '';
    return `<div class="mt-6">
<h3 class="font-semibold text-slate-900">${title}</h3>
${desc ? `<p class="mt-1 text-sm text-slate-600">${desc}</p>` : ''}
<div class="relative mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white"><table class="data-table"><thead><tr><th scope="col">Package</th><th scope="col">Format</th><th scope="col">Architecture</th><th scope="col">Source</th></tr></thead><tbody>${assetRows(list)}</tbody></table></div>
</div>`;
  }).join('');
  const anyUnverifiedAssets = s.download_assets.some((a) => !a.verified);

  const compatRows = osList.map((o) => {
    const e = s.supported_operating_systems[o.slug] || { status: 'unknown', verified: false, note: 'No information recorded.' };
    const st = (e.status === 'supported' && !e.verified) ? STATUS.reported : STATUS[e.status] || STATUS.unknown;
    return `<tr><th scope="row" class="whitespace-nowrap font-medium text-slate-900" style="text-transform:none;letter-spacing:0;font-size:.875rem;background:transparent">${o.name}</th>
<td>${badge(st.label, st.tone, st.icon)}</td>
<td class="text-slate-600">${esc(e.note || '')}${e.source && e.verified ? ` <a href="${esc(e.source)}" class="text-blue-700 hover:underline" rel="noopener" target="_blank">Source<span class="sr-only"> (opens in a new tab)</span></a>` : ''}</td></tr>`;
  }).join('');

  const related = s.related_software.map((r) => swBySlug[r]).filter(Boolean);
  const officialLinks = [
    ['globe', 'Official website', s.official_website],
    ['download', 'Official download page', s.download_page],
    ['tag', 'Release page', s.release_url],
    ['git-branch', 'Source repository', s.repository_url],
  ].filter(([, , u]) => u);

  const fact = (label, value) => `<div class="flex justify-between gap-4 py-2.5 text-sm"><dt class="text-slate-500">${label}</dt><dd class="text-right font-medium text-slate-900">${value}</dd></div>`;
  const notVerified = '<span class="font-normal text-slate-500">Check official source</span>';

  const sec = (id, title, body) => `<section id="${id}" class="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6">
<h2 class="text-xl font-bold text-slate-900">${title}</h2>
<div class="mt-3">${body}</div>
</section>`;

  const main = `<div class="border-b border-slate-200 bg-white">
<div class="container py-8 sm:py-10">
${bc.html}
<div class="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
${appIcon(s, 'lg')}
<div class="min-w-0 flex-1">
<h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">${esc(s.name)} for Windows</h1>
<p class="mt-2 max-w-3xl text-lg leading-7 text-slate-600">${esc(s.summary)}</p>
<div class="mt-4 flex flex-wrap items-center gap-1.5">
<a href="/categories/${cat.slug}/" class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">${icon(cat.icon, 'icon-xs')}${esc(cat.name)}</a>
${s.is_free ? badge('Free', 'blue') : ''}${s.is_open_source ? badge(`Open source · ${s.license_short}`, 'blue', 'scale') : ''}
${versionText ? badge(`Version ${versionText}`, 'slate', 'tag') : ''}
</div>
<div class="mt-4 flex flex-wrap items-center gap-2 text-sm">
<span class="font-medium text-slate-700">Verified Windows support:</span>
${v.length ? v.map((o) => badge(o.name, 'green', 'check')).join('') : `<span class="text-slate-600">Not yet verified – <a href="#compatibility" class="text-blue-700 hover:underline">see compatibility notes</a></span>`}
</div>
<div class="mt-6 flex flex-wrap items-center gap-3">
<a href="${esc(s.download_page)}" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700" rel="noopener" target="_blank">${icon('download', 'icon-sm')} Go to official download page<span class="sr-only"> (opens in a new tab)</span></a>
<a href="#downloads" class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Compare download options</a>
</div>
<p class="mt-3 flex items-center gap-1.5 text-xs text-slate-500">${icon('shield-check', 'icon-xs')} Opens ${esc(new URL(s.download_page).hostname)}. ${esc(site.name)} does not host or modify this software.</p>
</div>
</div>
</div>
</div>

<div class="container py-10">
<div class="grid gap-8 lg:grid-cols-3">
<div class="min-w-0 space-y-6 lg:col-span-2">
${sec('about', `About ${esc(s.name)}`, `<div class="prose">${s.description.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`)}
${sec('features', 'Key features', `<ul class="grid gap-2 sm:grid-cols-2">${s.features.map((f) => `<li class="flex gap-2 text-slate-700"><span class="mt-0.5 shrink-0 text-green-700">${icon('check', 'icon-sm')}</span><span>${esc(f)}</span></li>`).join('')}</ul>`)}
${sec('screenshots', 'Screenshots', s.screenshots.length
    ? `<div class="grid gap-4 sm:grid-cols-2">${s.screenshots.map((sh) => `<figure><img src="${esc(sh.src)}" alt="${esc(sh.alt)}" width="${sh.width}" height="${sh.height}" loading="lazy" decoding="async" class="rounded-lg border border-slate-200"><figcaption class="mt-1 text-xs text-slate-500">${esc(sh.caption || '')}</figcaption></figure>`).join('')}</div>`
    : `<p class="text-slate-600">We have not added screenshots for this listing yet. The <a href="${esc(s.official_website)}" class="text-blue-700 hover:underline" rel="noopener" target="_blank">official ${esc(s.name)} website<span class="sr-only"> (opens in a new tab)</span></a> shows the current interface.</p>`)}
${sec('compatibility', 'Windows compatibility', `<p class="text-slate-600">A version is marked <strong class="text-slate-900">Supported</strong> only when the project’s official sources state it for the current release. Support can change between releases, so always check the release notes.</p>
<div class="relative mt-4 overflow-x-auto rounded-lg border border-slate-200"><table class="data-table"><thead><tr><th scope="col">Windows</th><th scope="col">Status</th><th scope="col">Notes</th></tr></thead><tbody>${compatRows}</tbody></table></div>
<p class="mt-3 text-sm text-slate-600">Architectures${s.architectures_verified ? '' : ' (reported)'}: <strong class="text-slate-900">${esc(s.supported_architectures.join(', '))}</strong>. <a href="/windows/" class="text-blue-700 hover:underline">How we check compatibility</a></p>`)}
${sec('requirements', 'System requirements', `<div class="prose"><ul>${s.requirements.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div><p class="mt-3 text-sm text-slate-600">Hardware and runtime requirements can change with each release. Check the <a href="${esc(s.release_url)}" class="text-blue-700 hover:underline" rel="noopener" target="_blank">official release notes<span class="sr-only"> (opens in a new tab)</span></a> before installing.</p>`)}
${sec('downloads', 'Available download formats', `<p class="text-slate-600">All links go to official ${esc(s.name)} sources. Choose the package that matches your Windows version and architecture.</p>
${downloads}
${s.checksums_published ? `<div class="mt-6">${notice(esc(s.checksums_note), 'blue', 'shield-check')}</div>` : ''}
${anyUnverifiedAssets ? `<div class="mt-4">${notice('Some package types above are based on recent releases and have not been re-checked for the newest version. The official page is the authority on which files are currently offered.', 'slate', 'info')}</div>` : ''}
<div class="mt-4">${notice('<strong>Before you install:</strong> confirm you are on the official project domain, check that the publisher and release notes match, and compare any published checksum or signature with the file you downloaded. Do not download installers from unofficial mirrors.', 'amber', 'triangle-alert')}</div>`)}
${sec('installation', 'How to install', `<div class="prose"><ol>${s.installation_instructions.map((i) => `<li>${esc(i)}</li>`).join('')}</ol></div>`)}
${sec('license', 'License', `<p class="text-slate-700">${esc(s.name)} is ${s.is_free ? 'free to download and use' : 'not free'}${s.is_open_source ? ' and its source code is publicly available' : ''}. License: <strong class="text-slate-900">${esc(s.license)}</strong>.</p>
<p class="mt-2 text-sm text-slate-600">${s.license_verified ? 'Read the full terms' : 'Confirm the current terms'} in the ${extLink(s.license_url, 'official license information')} before redistributing or modifying the software.</p>`)}
${sec('release-history', 'Release history and changelog', `<dl class="divide-y rounded-lg border border-slate-200 px-4">
${fact('Latest verified version', versionText ? esc(versionText) : notVerified)}
${fact('Release date', s.release_date && s.version_verified ? esc(formatDate(s.release_date)) : notVerified)}
</dl>
${s.changelog.entries.length ? `<ul class="mt-4 space-y-3">${s.changelog.entries.map((e) => `<li><strong>${esc(e.version)}</strong> <span class="text-sm text-slate-500">${esc(formatDate(e.date))}</span><p class="text-sm text-slate-600">${esc(e.summary)}</p></li>`).join('')}</ul>` : `<p class="mt-4 text-slate-600">${esc(site.name)} does not copy changelogs. Read the full history of changes on the ${extLink(s.changelog.url, `official ${s.name} changelog`)}.</p>`}`)}
${sec('official-links', 'Official links', `<ul class="grid gap-2 sm:grid-cols-2">${officialLinks.map(([ic, l, u]) => `<li class="min-w-0"><a href="${esc(u)}" class="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50" rel="noopener" target="_blank"><span class="text-blue-700">${icon(ic, 'icon-sm')}</span><span class="min-w-0"><span class="block text-sm font-semibold text-slate-900">${l}</span><span class="block truncate text-xs text-slate-500">${esc(u.replace(/^https?:\/\//, ''))}</span></span><span class="sr-only"> (opens in a new tab)</span></a></li>`).join('')}</ul>`)}
</div>

<aside class="space-y-6" aria-label="${esc(s.name)} summary">
<div class="rounded-xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
<h2 class="text-base font-semibold text-slate-900">At a glance</h2>
<dl class="mt-2 divide-y">
${fact('Category', `<a href="/categories/${cat.slug}/" class="text-blue-700 hover:underline">${esc(cat.name)}</a>`)}
${fact('Price', s.is_free ? 'Free' : notVerified)}
${fact('License', esc(s.license_short))}
${fact('Latest version', versionText ? esc(versionText) : notVerified)}
${fact('Windows (verified)', v.length ? esc(v.map((o) => o.short).join(', ')) : notVerified)}
${fact('Architectures', esc(s.supported_architectures.join(', ')))}
${fact('Portable option', hasPortable(s) ? 'Yes' : 'No')}
</dl>
<a href="${esc(s.download_page)}" class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" rel="noopener" target="_blank">${icon('download', 'icon-sm')} Official download page<span class="sr-only"> (opens in a new tab)</span></a>
<p class="mt-4 text-xs leading-5 text-slate-500">${s.verification_status === 'verified' && lastChecked ? `Listing details checked against official sources on ${esc(lastChecked)}.` : 'Some details on this page are awaiting verification against official sources. Rely on the official project pages for the latest information.'} <a href="/editorial-policy/" class="text-blue-700 hover:underline">Editorial policy</a></p>
</div>
</aside>
</div>

${related.length ? `<section class="mt-12" aria-labelledby="related-heading">
<h2 id="related-heading" class="mb-4 text-2xl font-bold tracking-tight text-slate-900">Related software</h2>
${grid(related.map((r) => softwareCard(r)))}
</section>` : ''}
</div>`;

  const app = {
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: s.name, description: s.summary, url: abs(`/software/${s.slug}/`),
    applicationCategory: cat.schema_category,
    operatingSystem: v.length ? v.map((o) => o.name).join(', ') : 'Windows',
    downloadUrl: s.download_page,
    isAccessibleForFree: s.is_free,
    sameAs: [s.official_website, s.repository_url].filter(Boolean),
  };
  if (versionText) app.softwareVersion = versionText;
  if (s.license_verified && s.license_url) app.license = s.license_url;
  if (s.release_date && s.version_verified) app.datePublished = s.release_date;

  emit(`/software/${s.slug}/`, page({
    active: 'software', categories, path: `/software/${s.slug}/`, main,
    title: s.seo_title, description: s.meta_description, ogImage: s.og_image,
    schema: [app, bc.schema],
  }), { indexable: true, lastmod: s.last_verified_at || s.date_added });
}

// ================================================================ CATEGORIES
{
  const bc = breadcrumbs([['Home', '/'], ['Categories', null]]);
  const main = `${pageHeader(bc.html, 'Software categories', 'Browse free and open-source Windows software by what it helps you do.')}
<div class="container py-10">${grid(categories.map(categoryCard))}</div>`;
  emit('/categories/', page({
    active: 'categories', categories, path: '/categories/', main,
    title: 'Windows Software Categories',
    description: 'Browse free and open-source Windows software by category: security, graphics, audio and video, system utilities and developer tools.',
    schema: [collectionSchema('Software categories', 'All software categories on Codehimblog.', '/categories/'), bc.schema],
  }), { indexable: true });

  for (const c of categories) {
    const list = inCategory(c.slug);
    const indexable = list.length >= site.index_rules.category_min_items;
    const cbc = breadcrumbs([['Home', '/'], ['Categories', '/categories/'], [c.name, null]]);
    const others = categories.filter((o) => o.slug !== c.slug);
    const main = `${pageHeader(cbc.html, `${esc(c.name)} software for Windows`, esc(c.description))}
<div class="container py-10">
<div class="mb-8 max-w-3xl">${notice(esc(c.intro), 'slate', 'info')}</div>
${list.length ? `<h2 class="sr-only">Applications in ${esc(c.name)}</h2>${grid(list.map((s) => softwareCard(s)))}` : `<div class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><p class="font-semibold text-slate-900">No applications listed yet</p><p class="mt-1 text-slate-600">We are reviewing software for this category. Meanwhile, <a href="/software/" class="text-blue-700 hover:underline">browse the full directory</a>.</p></div>`}
<section class="mt-12" aria-labelledby="other-cats">
<h2 id="other-cats" class="mb-4 text-xl font-bold text-slate-900">Other categories</h2>
<ul class="flex flex-wrap gap-2">${others.map((o) => `<li><a href="/categories/${o.slug}/" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">${icon(o.icon, 'icon-sm')}${esc(o.name)}</a></li>`).join('')}</ul>
</section>
</div>`;
    emit(`/categories/${c.slug}/`, page({
      active: 'categories', categories, path: `/categories/${c.slug}/`, main, robots: robotsFor(indexable),
      title: c.seo_title, description: c.meta_description,
      schema: [collectionSchema(c.name, c.description, `/categories/${c.slug}/`), itemListSchema(c.name, list), cbc.schema],
    }), { indexable });
  }
}

// ================================================================ WINDOWS HUB
{
  const bc = breadcrumbs([['Home', '/'], ['Windows compatibility', null]]);
  const legend = ['supported', 'legacy', 'runs_unsupported', 'reported', 'unknown'].map((k) => `<li class="flex items-start gap-3"><span class="w-44 shrink-0">${badge(STATUS[k].label, STATUS[k].tone, STATUS[k].icon)}</span><span class="text-sm text-slate-600">${{
    supported: 'The project’s official website, download page or release notes state support for the current release.',
    legacy: 'Only an older release supports this Windows version. Older releases may lack security fixes.',
    runs_unsupported: 'The project says the software runs, but it does not provide support for this Windows version.',
    reported: 'Support is reported by a secondary source and has not yet been checked against official sources.',
    unknown: 'We have not found reliable information for this Windows version.',
  }[k]}</span></li>`).join('');
  const cell = (s, o) => {
    const e = s.supported_operating_systems[o.slug];
    const st = !e ? STATUS.unknown : (e.status === 'supported' && !e.verified) ? STATUS.reported : STATUS[e.status] || STATUS.unknown;
    return `<td>${badge(st.label, st.tone, st.icon)}</td>`;
  };
  const list = sorted(software);
  const main = `${pageHeader(bc.html, 'Windows compatibility', 'Which free and open-source applications officially support Windows 11, 10, 8.1, 8 and 7 – and how we decide.')}
<div class="container py-10 space-y-8">
<section class="grid gap-4 sm:grid-cols-3" aria-label="Windows versions">
${landingOs.map((o) => { const n = software.filter((s) => isVerifiedSupport(s, o.slug)).length; return `<a href="/${o.slug}/" class="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"><span class="flex items-center gap-2 font-semibold text-slate-900 group-hover:text-blue-700">${icon('monitor')} ${o.name}</span><span class="mt-1 block text-sm text-slate-600">${n} ${n === 1 ? 'application' : 'applications'} with verified support</span></a>`; }).join('')}
</section>
<section class="rounded-xl border border-slate-200 bg-white p-6">
<h2 class="text-xl font-bold text-slate-900">Compatibility overview</h2>
<p class="mt-1 text-slate-600">Status of each listed application’s current release.</p>
<div class="relative mt-4 overflow-x-auto rounded-lg border border-slate-200"><table class="data-table"><thead><tr><th scope="col">Application</th>${osList.map((o) => `<th scope="col" class="whitespace-nowrap">${o.name}</th>`).join('')}</tr></thead>
<tbody>${list.map((s) => `<tr><th scope="row" class="whitespace-nowrap" style="text-transform:none;letter-spacing:0;font-size:.875rem;background:transparent"><a href="/software/${s.slug}/" class="font-semibold text-blue-700 hover:underline">${esc(s.name)}</a></th>${osList.map((o) => cell(s, o)).join('')}</tr>`).join('')}</tbody></table></div>
</section>
<section class="grid gap-6 lg:grid-cols-2">
<div class="rounded-xl border border-slate-200 bg-white p-6">
<h2 class="text-xl font-bold text-slate-900">What the labels mean</h2>
<ul class="mt-4 space-y-3">${legend}</ul>
</div>
<div class="rounded-xl border border-slate-200 bg-white p-6">
<h2 class="text-xl font-bold text-slate-900">How we check compatibility</h2>
<div class="prose mt-3">
<p>We do not test every application on every Windows version. Instead, we record what each project’s <strong>official</strong> website, download page or release notes say about the <strong>current release</strong>.</p>
<p>Third-party download sites often list Windows versions that a project no longer supports, so we do not treat them as evidence.</p>
<p>Windows 7 and 8.1 no longer receive regular security updates from Microsoft. If you still use them, prefer software that is actively supported and keep your data backed up.</p>
<p>Spotted an outdated status? <a href="/contact/">Let us know</a>.</p>
</div>
</div>
</section>
</div>`;
  emit('/windows/', page({
    active: 'windows', categories, path: '/windows/', main,
    title: 'Windows 11, 10 and 7 Software Compatibility',
    description: 'Check which free and open-source applications officially support Windows 11, 10, 8.1, 8 and 7, and learn how Codehimblog verifies compatibility.',
    schema: [collectionSchema('Windows compatibility', 'Windows compatibility of listed software.', '/windows/'), bc.schema],
  }), { indexable: true });
}

// ================================================================ OS LANDING PAGES
for (const o of landingOs) {
  const list = sorted(software.filter((s) => isVerifiedSupport(s, o.slug)));
  const indexable = list.length >= site.index_rules.os_min_items;
  const bc = breadcrumbs([['Home', '/'], ['Windows compatibility', '/windows/'], [o.name, null]]);
  const others = landingOs.filter((x) => x.slug !== o.slug);
  const main = `${pageHeader(bc.html, `Free &amp; open-source software for ${o.name}`, esc(o.intro))}
<div class="container py-10">
<div class="mb-8 max-w-3xl">${notice(`Only applications whose <strong>official</strong> sources state support for ${o.name} in the current release are listed here. <a href="/windows/" class="font-semibold text-blue-700 hover:underline">See the full compatibility overview</a>.`)}</div>
${list.length ? `<h2 class="sr-only">Applications verified for ${o.name}</h2>${grid(list.map((s) => softwareCard(s)))}` : `<div class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><p class="font-semibold text-slate-900">No verified applications yet</p><p class="mt-1 text-slate-600">We have not yet confirmed ${o.name} support for any listed application.</p></div>`}
<p class="mt-8 text-sm text-slate-600">Other Windows versions: ${others.map((x) => `<a href="/${x.slug}/" class="font-semibold text-blue-700 hover:underline">${x.name}</a>`).join(' · ')}</p>
</div>`;
  emit(`/${o.slug}/`, page({
    active: 'windows', categories, path: `/${o.slug}/`, main, robots: robotsFor(indexable),
    title: `Free Software for ${o.name} – Verified Compatibility`,
    description: `Free and open-source applications with officially stated ${o.name} support, with links to official download pages.`,
    schema: [collectionSchema(`Software for ${o.name}`, o.intro, `/${o.slug}/`), itemListSchema(`Software for ${o.name}`, list), bc.schema],
  }), { indexable });
}

// ================================================================ SEARCH
{
  const bc = breadcrumbs([['Home', '/'], ['Search', null]]);
  const sel = (id, name, label, options) => `<div><label for="${id}" class="block text-xs font-semibold text-slate-600">${label}</label>
<select id="${id}" name="${name}" class="select mt-1">${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></div>`;
  const main = `${pageHeader(bc.html, 'Search software', 'Search by name, purpose, category or keyword.')}
<div class="container py-10">
<form id="search-page-form" action="/search/" method="get" role="search" class="rounded-xl border border-slate-200 bg-white p-4">
<div class="relative">
<label for="search-q" class="sr-only">Search software</label>
<span class="pointer-events-none absolute left-0 top-0 flex h-full items-center pl-3.5 text-slate-500">${icon('search')}</span>
<input id="search-q" name="q" type="search" autocomplete="off" class="search-input" placeholder="e.g. password manager, screen recorder, zip">
</div>
<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
${sel('search-os', 'os', 'Windows version', [['', 'Any version'], ...landingOs.map((x) => [x.slug, `${x.name} (verified)`])])}
${sel('search-cat', 'category', 'Category', [['', 'All categories'], ...categories.map((c) => [c.slug, c.name])])}
${sel('search-license', 'license', 'License type', [['', 'Any license'], ['copyleft', 'Copyleft (GPL, LGPL)'], ['permissive', 'Permissive (MIT, BSD, Apache)']])}
${sel('search-type', 'type', 'Package type', [['', 'Any package'], ['installer', 'Installer (EXE/MSI)'], ['portable', 'Portable package']])}
</div>
<div class="mt-3 flex justify-end"><button type="submit" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">${icon('search', 'icon-sm')} Search</button></div>
</form>
<p id="search-status" class="mt-6 text-sm text-slate-600" aria-live="polite"></p>
<div id="search-results" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>
<noscript><div class="mt-6">${notice('Search needs JavaScript. You can still <a href="/software/" class="font-semibold text-blue-700 hover:underline">browse the full software directory</a> or <a href="/categories/" class="font-semibold text-blue-700 hover:underline">browse by category</a>.', 'slate')}</div></noscript>
</div>`;
  emit('/search/', page({
    active: 'search', categories, path: '/search/', main, robots: 'noindex, follow',
    title: 'Search Windows Software',
    description: `Search the ${site.name} catalogue of free and open-source Windows software.`,
    schema: [bc.schema],
  }), { indexable: false });
}

// ================================================================ CONTENT PAGES
const contentDir = join(ROOT, 'content/pages');
for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.html')).sort()) {
  const raw = readFileSync(join(contentDir, file), 'utf8');
  const m = /^<!--\s*(\{[\s\S]*?\})\s*-->\s*/.exec(raw);
  if (!m) throw new Error(`${file}: missing JSON front matter`);
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length)
    .replace(/\{\{site\.name\}\}/g, esc(site.name))
    .replace(/\{\{site\.url\}\}/g, site.url)
    .replace(/\{\{PLACEHOLDER:([^}]+)\}\}/g, (_, t) => `<mark class="placeholder">[${esc(t.trim())}]</mark>`);
  const hasPlaceholder = body.includes('class="placeholder"');
  const indexable = !hasPlaceholder && meta.index !== false;
  const path = `/${file.replace(/\.html$/, '')}/`;
  const bc = breadcrumbs([['Home', '/'], [meta.breadcrumb || meta.h1, null]]);
  const main = `${pageHeader(bc.html, esc(meta.h1), meta.lead ? esc(meta.lead) : '', meta.updated ? `<p class="mt-3 text-sm text-slate-500">Last updated: ${esc(formatDate(meta.updated))}</p>` : '')}
<div class="container py-10">
${hasPlaceholder ? `<div class="mb-6 max-w-3xl">${notice('<strong>Site owner:</strong> this page contains highlighted placeholders that must be completed before launch. It is set to <code>noindex</code> until they are removed.', 'amber', 'triangle-alert')}</div>` : ''}
<article class="prose max-w-3xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
${body}
</article>
</div>`;
  emit(path, page({
    active: meta.active || '', categories, path, main, robots: robotsFor(indexable),
    title: meta.title, description: meta.description,
    schema: [{ '@context': 'https://schema.org', '@type': meta.schema_type || 'WebPage', name: meta.h1, url: abs(path), description: meta.description, ...(meta.updated ? { dateModified: meta.updated } : {}) }, bc.schema],
  }), { indexable, lastmod: meta.updated || site.build_date });
}

// ================================================================ 404
{
  const main = `<div class="container py-16 sm:py-24">
<div class="mx-auto max-w-2xl text-center">
<p class="text-sm font-semibold text-blue-700">Error 404</p>
<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">We couldn’t find that page</h1>
<p class="mt-4 text-lg text-slate-600">The page may have moved, or the link may be mistyped. Try searching the directory instead.</p>
<div class="mx-auto mt-8 max-w-xl text-left">${searchForm('notfound-search', 'lg')}</div>
<ul class="mt-8 flex flex-wrap justify-center gap-2 text-sm">
${[['/', 'Home'], ['/software/', 'All software'], ['/categories/', 'Categories'], ['/windows/', 'Windows compatibility']].map(([h, l]) => `<li><a href="${h}" class="inline-flex rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">${l}</a></li>`).join('')}
</ul>
</div>
</div>`;
  pages.push({ file: '404.html', html: page({ active: '', categories, path: '/404.html', main, robots: 'noindex, follow', title: 'Page not found', description: 'The requested page could not be found.' }) });
}

// ================================================================ REDIRECT PAGES
// data/redirects.json: [{ "from": "/old-path/", "to": "/new-path/" }]
for (const r of redirects) {
  const to = abs(r.to);
  pages.push({ path: r.from, html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved – ${esc(site.name)}</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(r.to)} + location.hash)</script></head><body><p>This page has moved to <a href="${to}">${to}</a>.</p></body></html>\n` });
}

// ================================================================ WRITE PAGES
for (const p of pages) {
  const out = p.file ? join(ROOT, p.file) : join(ROOT, p.path, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, p.html);
}
// Remove pages of software that no longer exists in the catalogue.
const swDir = join(ROOT, 'software');
for (const d of readdirSync(swDir, { withFileTypes: true })) {
  if (d.isDirectory() && !swBySlug[d.name]) { rmSync(join(swDir, d.name), { recursive: true }); console.log(`removed stale /software/${d.name}/`); }
}

// ================================================================ SITEMAP, FEED, ROBOTS
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${abs(u.path)}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}
</urlset>
`);

const rfc822 = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString();
const feedItems = [...software].sort((a, b) => b.date_added.localeCompare(a.date_added) || a.name.localeCompare(b.name));
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
writeFileSync(join(ROOT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xmlEsc(site.name)} – New software listings</title>
<link>${site.url}/</link>
<description>${xmlEsc(site.description)}</description>
<language>en</language>
<lastBuildDate>${rfc822(site.build_date)}</lastBuildDate>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${feedItems.map((s) => `<item>
<title>${xmlEsc(s.name)} – ${xmlEsc(catBySlug[s.category].name)}</title>
<link>${abs(`/software/${s.slug}/`)}</link>
<guid isPermaLink="true">${abs(`/software/${s.slug}/`)}</guid>
<pubDate>${rfc822(s.date_added)}</pubDate>
<category>${xmlEsc(catBySlug[s.category].name)}</category>
<description>${xmlEsc(s.summary)}</description>
</item>`).join('\n')}
</channel>
</rss>
`);

writeFileSync(join(ROOT, 'robots.txt'), `# ${site.name} – ${site.url}/
User-agent: *
Allow: /
Disallow: /tools/
Disallow: /content/
Disallow: /docs/

Sitemap: ${site.url}/sitemap.xml
`);

// ================================================================ CSS
const base = read('tools/src/base.css');
const componentClasses = new Set([...base.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const classes = new Set();
for (const p of pages) collectClasses(p.html, classes);
collectScriptClasses(read('assets/js/site.js'), classes);
for (const c of [...classes]) if (componentClasses.has(c) || ['group', 'nav-toggle', 'nav-open-icon', 'nav-close-icon'].includes(c)) classes.delete(c);
const { css, unknown } = compileUtilities(classes);
if (unknown.length) { console.error(`Unknown utility classes: ${unknown.join(', ')}`); process.exit(1); }
const minify = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n/g, '\n').replace(/^\s+/gm, '').trim();
mkdirSync(join(ROOT, 'assets/css'), { recursive: true });
writeFileSync(join(ROOT, 'assets/css/site.css'), `/*! Codehimblog – generated by tools/build.mjs. Do not edit by hand: edit tools/src/base.css or the templates and rebuild. */\n${minify(base)}\n/* utilities */\n${css}`);

console.log(`Built ${pages.length} pages, ${sitemap.length} sitemap URLs, ${classes.size} utility classes.`);
