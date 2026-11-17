/*! Codehimblog – site.js (vanilla JavaScript, no dependencies).
   Progressive enhancement only: every page is usable without JavaScript. */
(function () {
  'use strict';

  /* ---------------- Mobile navigation ---------------- */
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('mobile-nav');
  if (toggle && panel) {
    toggle.hidden = false;
    var openIcon = toggle.querySelector('.nav-open-icon');
    var closeIcon = toggle.querySelector('.nav-close-icon');
    var setOpen = function (open) {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (openIcon) openIcon.hidden = open;
      if (closeIcon) closeIcon.hidden = !open;
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------------- Shared helpers ---------------- */
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  }
  function tokens(q) {
    return norm(q).split(/[^a-z0-9+#.]+/).filter(Boolean);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- Search page (/search/) ---------------- */
  var searchForm = document.getElementById('search-page-form');
  var results = document.getElementById('search-results');
  if (searchForm && results) {
    var status = document.getElementById('search-status');
    var fields = {
      q: document.getElementById('search-q'),
      os: document.getElementById('search-os'),
      category: document.getElementById('search-cat'),
      license: document.getElementById('search-license'),
      type: document.getElementById('search-type')
    };
    var params = new URLSearchParams(location.search);
    Object.keys(fields).forEach(function (k) {
      if (params.get(k)) fields[k].value = params.get(k);
    });

    var CHECK = '<svg class="icon icon-xs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>';
    var HELP = '<svg class="icon icon-xs" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>';
    var badge = function (text, tone, ic) {
      var tones = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-800 border-green-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200'
      };
      return '<span class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ' + tones[tone] + '">' + (ic || '') + esc(text) + '</span>';
    };

    Promise.all(['/data/software.json', '/data/categories.json', '/data/os.json'].map(function (u) {
      return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); });
    })).then(function (data) {
      var software = data[0];
      var cats = {};
      data[1].forEach(function (c) { cats[c.slug] = c; });
      var osList = data[2];
      var verifiedOs = function (s) {
        return osList.filter(function (o) {
          var e = s.supported_operating_systems[o.slug];
          return e && e.status === 'supported' && e.verified === true;
        });
      };

      var score = function (s, words) {
        if (!words.length) return 1;
        var name = norm(s.name);
        var kw = norm(s.keywords.join(' '));
        var cat = norm(s.categories.map(function (c) { return cats[c] ? cats[c].name : c; }).join(' '));
        var summary = norm(s.summary);
        var desc = norm(s.description.join(' ') + ' ' + s.features.join(' '));
        var total = 0;
        for (var i = 0; i < words.length; i++) {
          var w = words[i];
          var p = 0;
          if (name === w) p += 30;
          else if (name.indexOf(w) === 0) p += 15;
          else if (name.indexOf(w) !== -1) p += 10;
          if (kw.indexOf(w) !== -1) p += 6;
          if (cat.indexOf(w) !== -1) p += 4;
          if (summary.indexOf(w) !== -1) p += 3;
          if (desc.indexOf(w) !== -1) p += 1;
          if (!p) return 0;
          total += p;
        }
        return total;
      };

      var card = function (s) {
        var c = cats[s.category];
        var v = verifiedOs(s);
        var osHtml = v.length
          ? v.map(function (o) { return badge(o.short, 'green', CHECK); }).join('')
          : badge('Windows support: see details', 'slate', HELP);
        return '<article class="card-link group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md">' +
          '<div class="flex items-start gap-3">' +
          (s.icon.logo ? '<img src="' + esc(s.icon.logo) + '" width="44" height="44" alt="' + esc(s.name) + ' logo" class="h-11 w-11" style="object-fit:contain;flex-shrink:0;border-radius:10px" loading="lazy" decoding="async">'
            : '<span class="app-icon h-11 w-11 text-base" style="--app-color:' + esc(s.icon.color) + '" role="img" aria-label="' + esc(s.name) + ' icon (letter placeholder)">' + esc(s.icon.text) + '</span>') +
          '<div class="min-w-0"><h2 class="card-title font-semibold text-slate-900 transition-colors"><a href="/software/' + esc(s.slug) + '/" class="stretched-link">' + esc(s.name) + '</a></h2>' +
          '<p class="text-xs text-slate-500">' + esc(c ? c.name : '') + '</p></div></div>' +
          '<p class="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">' + esc(s.summary) + '</p>' +
          '<div class="mt-auto flex flex-wrap gap-1.5 pt-4">' + (s.is_open_source ? badge('Open source', 'blue') : '') + osHtml + '</div>' +
          '</article>';
      };

      var run = function () {
        var words = tokens(fields.q.value);
        var os = fields.os.value, cat = fields.category.value, lic = fields.license.value, type = fields.type.value;
        var list = software.map(function (s) { return { s: s, score: score(s, words) }; })
          .filter(function (r) {
            var s = r.s;
            if (!r.score) return false;
            if (os && !verifiedOs(s).some(function (o) { return o.slug === os; })) return false;
            if (cat && s.categories.indexOf(cat) === -1) return false;
            if (lic && s.license_family !== lic) return false;
            if (type && !s.download_assets.some(function (a) { return a.kind === type; })) return false;
            return true;
          })
          .sort(function (a, b) { return b.score - a.score || a.s.name.localeCompare(b.s.name); });

        results.innerHTML = list.map(function (r) { return card(r.s); }).join('');
        var q = fields.q.value.trim();
        if (list.length) {
          status.textContent = list.length + (list.length === 1 ? ' application' : ' applications') + (q ? ' found for “' + q + '”' : ' match your filters');
        } else {
          status.innerHTML = 'No applications found' + (q ? ' for “' + esc(q) + '”' : '') + '. Try fewer words, or <a href="/software/" class="font-semibold text-blue-700 hover:underline">browse all software</a>.';
        }
        var next = new URLSearchParams();
        Object.keys(fields).forEach(function (k) { if (fields[k].value) next.set(k, fields[k].value); });
        var qs = next.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      };

      searchForm.addEventListener('submit', function (e) { e.preventDefault(); run(); });
      searchForm.addEventListener('change', run);
      var timer;
      fields.q.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 150); });
      run();
    }).catch(function () {
      status.innerHTML = 'Search is unavailable right now. <a href="/software/" class="font-semibold text-blue-700 hover:underline">Browse all software</a> instead.';
    });
  }
})();

/* Screenshot viewer: click a screenshot to see it large; arrows, Esc and swipe work. */
(function () {
  var grid = document.querySelector('[data-shots]');
  if (!grid) return;
  var links = Array.prototype.slice.call(grid.querySelectorAll('a[data-shot]'));
  if (!links.length) return;
  var box, img, cap, count, idx = 0, opener = null, touchX = null;
  function btn(label, text, css) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', label); b.textContent = text;
    b.style.cssText = 'position:absolute;border:0;border-radius:999px;width:44px;height:44px;font-size:22px;line-height:44px;cursor:pointer;background:rgba(255,255,255,.15);color:#fff;' + css;
    return b;
  }
  function build() {
    box = document.createElement('div');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Screenshot viewer');
    box.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 16px 24px';
    img = document.createElement('img');
    img.style.cssText = 'max-width:100%;max-height:calc(100vh - 140px);border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.5);background:#fff';
    cap = document.createElement('p');
    cap.style.cssText = 'color:#e2e8f0;margin:12px 0 0;font-size:14px;text-align:center;max-width:60rem';
    count = document.createElement('p');
    count.style.cssText = 'position:absolute;top:18px;left:20px;margin:0;color:#cbd5e1;font-size:14px';
    var close = btn('Close', '×', 'top:10px;right:12px');
    var prev = btn('Previous screenshot', '‹', 'left:12px;top:50%;margin-top:-22px');
    var next = btn('Next screenshot', '›', 'right:12px;top:50%;margin-top:-22px');
    if (links.length < 2) { prev.style.display = 'none'; next.style.display = 'none'; }
    close.addEventListener('click', hide);
    prev.addEventListener('click', function () { show(idx - 1); });
    next.addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) hide(); });
    box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
    box.appendChild(count); box.appendChild(close); box.appendChild(prev); box.appendChild(next); box.appendChild(img); box.appendChild(cap);
    box.closeBtn = close;
  }
  function show(i) {
    idx = (i + links.length) % links.length;
    var a = links[idx], thumb = a.querySelector('img');
    img.src = a.getAttribute('href');
    img.alt = thumb ? thumb.alt : '';
    cap.textContent = a.getAttribute('data-caption') || '';
    count.textContent = links.length > 1 ? (idx + 1) + ' / ' + links.length : '';
  }
  function key(e) {
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  }
  function hide() {
    if (!box || !box.parentNode) return;
    box.parentNode.removeChild(box);
    document.removeEventListener('keydown', key);
    document.documentElement.style.overflow = '';
    if (opener) opener.focus();
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      if (!box) build();
      opener = a;
      show(i);
      document.body.appendChild(box);
      document.documentElement.style.overflow = 'hidden';
      document.addEventListener('keydown', key);
      box.closeBtn.focus();
    });
  });
})();
