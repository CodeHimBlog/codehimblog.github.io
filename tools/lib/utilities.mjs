// Codehimblog utility CSS compiler.
//
// Generates a purged, Tailwind-compatible utility stylesheet from the class
// names actually used in the generated HTML. Class names and values follow
// Tailwind CSS v3 defaults (see tailwind.config.js), so the same HTML can be
// rebuilt with the official Tailwind CLI later without changing markup.
// No dependencies: runs on plain Node.js 18+.

export const colors = {
  white: '#ffffff', black: '#000000', transparent: 'transparent', current: 'currentColor',
  'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
  'slate-800': '#1e293b', 'slate-900': '#0f172a',
  'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
  'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8', 'blue-800': '#1e40af',
  'green-50': '#f0fdf4', 'green-100': '#dcfce7', 'green-200': '#bbf7d0', 'green-600': '#16a34a',
  'green-700': '#15803d', 'green-800': '#166534',
  'amber-50': '#fffbeb', 'amber-100': '#fef3c7', 'amber-200': '#fde68a', 'amber-700': '#b45309',
  'amber-800': '#92400e', 'amber-900': '#78350f',
  'red-50': '#fef2f2', 'red-200': '#fecaca', 'red-700': '#b91c1c',
};

const screens = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' };
const screenOrder = ['', 'sm', 'md', 'lg', 'xl'];

const fontSize = {
  xs: ['0.75rem', '1rem'], sm: ['0.875rem', '1.25rem'], base: ['1rem', '1.5rem'],
  lg: ['1.125rem', '1.75rem'], xl: ['1.25rem', '1.75rem'], '2xl': ['1.5rem', '2rem'],
  '3xl': ['1.875rem', '2.25rem'], '4xl': ['2.25rem', '2.5rem'], '5xl': ['3rem', '1'],
};
const maxW = {
  none: 'none', xs: '20rem', sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem', '2xl': '42rem',
  '3xl': '48rem', '4xl': '56rem', '5xl': '64rem', '6xl': '72rem', '7xl': '80rem', prose: '65ch', full: '100%',
};
const radius = { '': '0.25rem', none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' };
const shadow = {
  'shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'shadow-none': '0 0 #0000',
};
const fontWeight = { normal: 400, medium: 500, semibold: 600, bold: 700 };
const leading = { none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', '5': '1.25rem', '6': '1.5rem', '7': '1.75rem', '8': '2rem' };
const tracking = { tight: '-0.025em', normal: '0', wide: '0.025em', wider: '0.05em' };

function space(v) {
  if (v === 'px') return '1px';
  if (v === '0') return '0px';
  if (v === 'auto') return 'auto';
  if (/^\d+(\.5)?$/.test(v)) return `${parseFloat(v) * 0.25}rem`;
  return null;
}
function frac(v) {
  const m = /^(\d+)\/(\d+)$/.exec(v);
  return m ? `${(parseInt(m[1]) / parseInt(m[2]) * 100).toFixed(6).replace(/\.?0+$/, '')}%` : null;
}

const statics = {
  block: 'display:block', 'inline-block': 'display:inline-block', inline: 'display:inline',
  flex: 'display:flex', 'inline-flex': 'display:inline-flex', grid: 'display:grid', hidden: 'display:none',
  table: 'display:table',
  'sr-only': 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0',
  'not-sr-only': 'position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;white-space:normal',
  'flex-row': 'flex-direction:row', 'flex-col': 'flex-direction:column', 'flex-wrap': 'flex-wrap:wrap',
  'flex-1': 'flex:1 1 0%', 'flex-none': 'flex:none', 'flex-auto': 'flex:1 1 auto', 'shrink-0': 'flex-shrink:0', grow: 'flex-grow:1',
  'items-start': 'align-items:flex-start', 'items-center': 'align-items:center', 'items-end': 'align-items:flex-end',
  'items-baseline': 'align-items:baseline', 'items-stretch': 'align-items:stretch',
  'justify-start': 'justify-content:flex-start', 'justify-center': 'justify-content:center',
  'justify-end': 'justify-content:flex-end', 'justify-between': 'justify-content:space-between',
  'self-start': 'align-self:flex-start', 'self-center': 'align-self:center',
  'text-left': 'text-align:left', 'text-center': 'text-align:center', 'text-right': 'text-align:right',
  uppercase: 'text-transform:uppercase', 'normal-case': 'text-transform:none',
  underline: 'text-decoration-line:underline', 'no-underline': 'text-decoration-line:none',
  'underline-offset-2': 'text-underline-offset:2px', 'underline-offset-4': 'text-underline-offset:4px',
  truncate: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
  'break-words': 'overflow-wrap:break-word', 'break-all': 'word-break:break-all',
  'whitespace-nowrap': 'white-space:nowrap',
  'line-clamp-2': 'overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2',
  'line-clamp-3': 'overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3',
  border: 'border-width:1px', 'border-0': 'border-width:0', 'border-2': 'border-width:2px',
  'border-t': 'border-top-width:1px', 'border-b': 'border-bottom-width:1px', 'border-l': 'border-left-width:1px',
  'border-r': 'border-right-width:1px', 'border-l-4': 'border-left-width:4px',
  'border-dashed': 'border-style:dashed', 'border-solid': 'border-style:solid',
  'overflow-hidden': 'overflow:hidden', 'overflow-x-auto': 'overflow-x:auto', 'overflow-auto': 'overflow:auto',
  relative: 'position:relative', absolute: 'position:absolute', sticky: 'position:sticky', fixed: 'position:fixed', static: 'position:static',
  'inset-0': 'inset:0px', 'top-0': 'top:0px', 'right-0': 'right:0px', 'left-0': 'left:0px', 'bottom-0': 'bottom:0px',
  'z-10': 'z-index:10', 'z-20': 'z-index:20', 'z-40': 'z-index:40', 'z-50': 'z-index:50',
  'list-disc': 'list-style-type:disc', 'list-decimal': 'list-style-type:decimal', 'list-none': 'list-style-type:none',
  'list-inside': 'list-style-position:inside',
  'transition-colors': 'transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms',
  transition: 'transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms',
  'cursor-pointer': 'cursor:pointer',
  'object-cover': 'object-fit:cover', 'object-contain': 'object-fit:contain',
  'w-full': 'width:100%', 'w-auto': 'width:auto', 'h-full': 'height:100%', 'h-auto': 'height:auto',
  'min-h-screen': 'min-height:100vh', 'min-w-0': 'min-width:0px',
  'mx-auto': 'margin-left:auto;margin-right:auto',
  'not-italic': 'font-style:normal', italic: 'font-style:italic',
  'font-mono': 'font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
  'tabular-nums': 'font-variant-numeric:tabular-nums',
  'align-middle': 'vertical-align:middle', 'align-top': 'vertical-align:top',
  'opacity-0': 'opacity:0', 'opacity-60': 'opacity:0.6', 'opacity-100': 'opacity:1',
  'pointer-events-none': 'pointer-events:none',
  'aspect-video': 'aspect-ratio:16/9',
  'scroll-mt-24': 'scroll-margin-top:6rem',
  'table-auto': 'table-layout:auto', 'border-collapse': 'border-collapse:collapse',
  ...Object.fromEntries(Object.entries(shadow).map(([k, v]) => [k, `box-shadow:${v}`])),
};

const spacingProps = {
  p: ['padding'], px: ['padding-left', 'padding-right'], py: ['padding-top', 'padding-bottom'],
  pt: ['padding-top'], pr: ['padding-right'], pb: ['padding-bottom'], pl: ['padding-left'],
  m: ['margin'], mx: ['margin-left', 'margin-right'], my: ['margin-top', 'margin-bottom'],
  mt: ['margin-top'], mr: ['margin-right'], mb: ['margin-bottom'], ml: ['margin-left'],
  gap: ['gap'], 'gap-x': ['column-gap'], 'gap-y': ['row-gap'],
  w: ['width'], h: ['height'], 'min-h': ['min-height'], 'max-h': ['max-height'], 'min-w': ['min-width'],
  top: ['top'], left: ['left'], right: ['right'], bottom: ['bottom'],
};

// Returns { decl, childSelector? } or null when the utility is unknown.
function resolve(u) {
  if (statics[u]) return { decl: statics[u] };
  let m;
  if ((m = /^grid-cols-(\d+)$/.exec(u))) return { decl: `grid-template-columns:repeat(${m[1]},minmax(0,1fr))` };
  if ((m = /^col-span-(\d+|full)$/.exec(u))) return { decl: m[1] === 'full' ? 'grid-column:1 / -1' : `grid-column:span ${m[1]} / span ${m[1]}` };
  if (u === 'divide-y') return { decl: 'border-top-width:1px;border-bottom-width:0', child: ' > :not([hidden]) ~ :not([hidden])' };
  if ((m = /^space-([xy])-(.+)$/.exec(u))) {
    const v = space(m[2]); if (!v) return null;
    return { decl: m[1] === 'y' ? `margin-top:${v}` : `margin-left:${v}`, child: ' > :not([hidden]) ~ :not([hidden])' };
  }
  if ((m = /^(-?)(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|w|h|min-h|max-h|min-w|top|left|right|bottom)-(.+)$/.exec(u))) {
    let v = space(m[3]) ?? (['w', 'h'].includes(m[2]) ? frac(m[3]) : null);
    if (!v) return null;
    if (m[1]) v = `-${v}`;
    return { decl: spacingProps[m[2]].map((p) => `${p}:${v}`).join(';') };
  }
  if ((m = /^max-w-(.+)$/.exec(u)) && maxW[m[1]]) return { decl: `max-width:${maxW[m[1]]}` };
  if ((m = /^text-(.+)$/.exec(u))) {
    if (fontSize[m[1]]) return { decl: `font-size:${fontSize[m[1]][0]};line-height:${fontSize[m[1]][1]}` };
    if (colors[m[1]]) return { decl: `color:${colors[m[1]]}` };
    return null;
  }
  if ((m = /^bg-(.+)$/.exec(u)) && colors[m[1]]) return { decl: `background-color:${colors[m[1]]}` };
  if ((m = /^border-(.+)$/.exec(u)) && colors[m[1]]) return { decl: `border-color:${colors[m[1]]}` };
  if ((m = /^decoration-(.+)$/.exec(u)) && colors[m[1]]) return { decl: `text-decoration-color:${colors[m[1]]}` };
  if ((m = /^font-(.+)$/.exec(u)) && fontWeight[m[1]]) return { decl: `font-weight:${fontWeight[m[1]]}` };
  if ((m = /^leading-(.+)$/.exec(u)) && leading[m[1]]) return { decl: `line-height:${leading[m[1]]}` };
  if ((m = /^tracking-(.+)$/.exec(u)) && tracking[m[1]]) return { decl: `letter-spacing:${tracking[m[1]]}` };
  if ((m = /^rounded(?:-(.+))?$/.exec(u))) {
    const k = m[1] ?? ''; if (radius[k] === undefined) return null;
    return { decl: `border-radius:${radius[k]}` };
  }
  if ((m = /^ring-(.+)$/.exec(u)) && colors[m[1]]) return { decl: `box-shadow:0 0 0 2px ${colors[m[1]]}` };
  return null;
}

function escapeClass(c) {
  return c.replace(/([:/.\[\]%])/g, '\\$1');
}

const variantOrder = ['', 'group-hover', 'hover', 'focus', 'focus-visible'];

export function compileUtilities(classSet) {
  const rules = []; const unknown = [];
  for (const cls of classSet) {
    const parts = cls.split(':');
    const util = parts.pop();
    let screen = ''; let variant = '';
    let ok = true;
    for (const p of parts) {
      if (screens[p]) screen = p;
      else if (variantOrder.includes(p)) variant = p;
      else ok = false;
    }
    const r = ok ? resolve(util) : null;
    if (!r) { unknown.push(cls); continue; }
    let sel = `.${escapeClass(cls)}`;
    if (variant === 'hover') sel += ':hover';
    else if (variant === 'focus') sel += ':focus';
    else if (variant === 'focus-visible') sel += ':focus-visible';
    else if (variant === 'group-hover') sel = `.group:hover ${sel}`;
    if (r.child) sel += r.child;
    rules.push({ screen, variant, sel, decl: r.decl, util });
  }
  rules.sort((a, b) =>
    screenOrder.indexOf(a.screen) - screenOrder.indexOf(b.screen) ||
    variantOrder.indexOf(a.variant) - variantOrder.indexOf(b.variant) ||
    a.sel.localeCompare(b.sel));
  let css = ''; let current = null;
  for (const r of rules) {
    if (r.screen !== current) {
      if (current) css += '}\n';
      if (r.screen) css += `@media (min-width:${screens[r.screen]}){\n`;
      current = r.screen;
    }
    css += `${r.sel}{${r.decl}}\n`;
  }
  if (current) css += '}\n';
  return { css, unknown };
}

// Collects utility-looking tokens from string literals in a script.
export function collectScriptClasses(js, set = new Set()) {
  const re = /'([^'\n]*)'/g; let m;
  while ((m = re.exec(js))) for (const c of m[1].split(/\s+/)) if (/^[a-z][a-z0-9:.\/-]*$/.test(c) && compileUtilities([c]).unknown.length === 0) set.add(c);
  return set;
}

export function collectClasses(html, set = new Set()) {
  const re = /class="([^"]*)"/g; let m;
  while ((m = re.exec(html))) for (const c of m[1].split(/\s+/)) if (c) set.add(c);
  return set;
}
