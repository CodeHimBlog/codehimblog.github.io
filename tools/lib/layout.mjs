// Shared layout and UI components for generated pages.
import { icon } from './icons.mjs';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function jsonLd(obj) {
  // Escape "<" so the JSON can never close the script element.
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function ctx(site) {
  const abs = (path) => `${site.url}${path}`;

  function head({ title, description, path, robots = 'index, follow', ogType = 'website', ogImage, schema = [], extraHead = '' }) {
    const fullTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
    const img = abs(ogImage || site.default_og_image);
    return `<!doctype html>
<html lang="${site.language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${abs(path)}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.name)} – ${esc(site.tagline)}">
<meta property="og:locale" content="${site.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${site.theme_color}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} – new software listings" href="/feed.xml">
<link rel="stylesheet" href="/assets/css/site.css">
<script>document.documentElement.classList.add('js')</script>
<script src="/assets/js/site.js" defer></script>
${schema.map(jsonLd).join('\n')}${extraHead}
</head>`;
  }

  const navItems = [
    { href: '/software/', label: 'Software', key: 'software' },
    { href: '/categories/', label: 'Categories', key: 'categories' },
    { href: '/windows/', label: 'Windows compatibility', key: 'windows' },
    { href: '/about/', label: 'About', key: 'about' },
  ];

  function brand(dark = false) {
    return `<a href="/" class="inline-flex items-center gap-2.5 font-bold text-lg tracking-tight ${dark ? 'text-white' : 'text-slate-900'}">
<span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-base font-bold" aria-hidden="true">C</span>
<span>${esc(site.name)}</span></a>`;
  }

  function searchForm(id, size = 'sm') {
    const big = size === 'lg';
    return `<form action="/search/" method="get" role="search" class="relative w-full">
<label for="${id}" class="sr-only">Search software</label>
<span class="pointer-events-none absolute left-0 top-0 flex h-full items-center pl-3.5 text-slate-500">${icon('search', big ? '' : 'icon-sm')}</span>
<input id="${id}" name="q" type="search" autocomplete="off" placeholder="${big ? 'Search apps, e.g. password manager, screen recorder…' : 'Search software'}" class="search-input${big ? ' text-lg' : ' text-sm'}"${big ? '' : ' style="padding-top:.5rem;padding-bottom:.5rem;padding-left:2.5rem"'}>
${big ? `<button type="submit" class="absolute right-0 top-0 m-1.5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Search</button>` : ''}
</form>`;
  }

  function header(active) {
    const link = (n, mobile) => `<a href="${n.href}" class="${mobile ? 'block rounded-lg px-3 py-2.5 text-base' : 'rounded-lg px-3 py-2 text-sm'} font-medium ${active === n.key ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}"${active === n.key ? ' aria-current="page"' : ''}>${n.label}</a>`;
    return `<a class="skip-link" href="#main">Skip to content</a>
<header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
<div class="container">
<div class="flex h-16 items-center gap-4">
${brand()}
<nav aria-label="Main" class="ml-4 hidden lg:flex items-center gap-1">${navItems.map((n) => link(n, false)).join('')}</nav>
<div class="ml-auto hidden md:block w-64">${active === 'home' ? '' : searchForm('header-search')}</div>
<button type="button" class="nav-toggle ml-auto md:ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 lg:hidden" aria-expanded="false" aria-controls="mobile-nav" hidden>
<span class="nav-open-icon">${icon('menu', 'icon-sm')}</span><span class="nav-close-icon" hidden>${icon('x', 'icon-sm')}</span><span>Menu</span></button>
</div>
</div>
<div id="mobile-nav" class="site-nav border-t border-slate-200 bg-white lg:hidden">
<div class="container py-3">
<div class="md:hidden pb-3">${searchForm('mobile-search')}</div>
<nav aria-label="Main (mobile)" class="space-y-1">${navItems.map((n) => link(n, true)).join('')}</nav>
</div>
</div>
</header>`;
  }

  function footer(categories) {
    const col = (title, links) => `<div><h2 class="text-sm font-semibold text-white">${title}</h2>
<ul class="mt-3 space-y-2 text-sm">${links.map(([h, l]) => `<li><a href="${h}" class="text-slate-300 hover:text-white">${esc(l)}</a></li>`).join('')}</ul></div>`;
    return `<footer class="mt-16 bg-slate-900 text-slate-300">
<div class="container py-12">
<div class="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
<div class="lg:col-span-2">
${brand(true)}
<p class="mt-4 max-w-sm text-sm leading-6 text-slate-300">${esc(site.name)} is an independent directory of free and open-source software for Windows. We describe each application, record which Windows versions its official sources support, and link to official download pages. We do not host or modify software.</p>
<p class="mt-4"><a href="/feed.xml" class="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">${icon('rss', 'icon-sm')} RSS feed of new listings</a></p>
</div>
${col('Software directory', [['/software/', 'All software'], ['/windows/', 'Windows compatibility'], ['/windows-11/', 'Windows 11 software'], ['/windows-10/', 'Windows 10 software'], ['/windows-7/', 'Windows 7 software'], ['/search/', 'Search']])}
${col('Categories', [...categories.map((c) => [`/categories/${c.slug}/`, c.name]), ['/categories/', 'All categories']])}
${col('Information', [['/about/', 'About'], ['/editorial-policy/', 'Editorial policy'], ['/contact/', 'Contact'], ['/privacy-policy/', 'Privacy policy'], ['/terms-and-conditions/', 'Terms and conditions'], ['/disclaimer/', 'Disclaimer'], ['/dmca/', 'Copyright & DMCA']])}
</div>
<div class="mt-10 border-t border-slate-700 pt-6 text-xs leading-5 text-slate-400">
<p>© ${site.build_date.slice(0, 4)} ${esc(site.name)}. All rights reserved.</p>
<p class="mt-2">Software names, logos and trademarks belong to their respective owners. ${esc(site.name)} is not affiliated with, endorsed by or sponsored by the projects listed. Downloads are provided by the official project sources linked on each page.</p>
</div>
</div>
</footer>`;
  }

  function page({ active, main, categories, ...h }) {
    return `${head(h)}
<body class="min-h-screen">
${header(active)}
<main id="main" tabindex="-1">
${main}
</main>
${footer(categories)}
</body>
</html>
`;
  }

  function breadcrumbs(items) {
    // items: [[label, path|null], ...] — last item is current page
    const html = `<nav aria-label="Breadcrumb" class="text-sm text-slate-500">
<ol class="breadcrumb flex flex-wrap items-center">${items.map(([l, p], i) => i === items.length - 1
    ? `<li><span aria-current="page" class="text-slate-700">${esc(l)}</span></li>`
    : `<li><a href="${p}" class="hover:text-blue-700 hover:underline">${esc(l)}</a></li>`).join('')}</ol>
</nav>`;
    const schema = {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map(([l, p], i) => ({ '@type': 'ListItem', position: i + 1, name: l, ...(p ? { item: abs(p) } : {}) })),
    };
    return { html, schema };
  }

  return { abs, head, header, footer, page, breadcrumbs, brand, searchForm };
}

export function appIcon(s, size = 'md') {
  const sizes = { sm: 'h-9 w-9 text-sm', md: 'h-11 w-11 text-base', lg: 'h-16 w-16 text-2xl' };
  return `<span class="app-icon ${sizes[size]}" style="--app-color:${esc(s.icon.color)}" role="img" aria-label="${esc(s.name)} icon (letter placeholder)">${esc(s.icon.text)}</span>`;
}

export function badge(text, tone = 'slate', iconName) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
  };
  return `<span class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}">${iconName ? icon(iconName, 'icon-xs') : ''}${esc(text)}</span>`;
}

export const STATUS = {
  supported: { label: 'Supported', tone: 'green', icon: 'circle-check' },
  legacy: { label: 'Older version only', tone: 'amber', icon: 'history' },
  runs_unsupported: { label: 'Runs, not supported', tone: 'amber', icon: 'triangle-alert' },
  reported: { label: 'Reported, not yet verified', tone: 'slate', icon: 'circle-help' },
  not_listed: { label: 'Not listed by project', tone: 'slate', icon: 'circle-minus' },
  unknown: { label: 'Not confirmed', tone: 'slate', icon: 'circle-help' },
};

export const isVerifiedSupport = (s, osSlug) => {
  const e = s.supported_operating_systems?.[osSlug];
  return !!e && e.status === 'supported' && e.verified === true;
};
