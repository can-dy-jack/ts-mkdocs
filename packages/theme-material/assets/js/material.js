/* ts-mkdocs Material Theme JS */
(function () {
  'use strict';

  const CFG = window.__TS_MKDOCS__ || { features: [], i18n: {}, baseUrl: './' };
  const FEATURES = new Set(CFG.features || []);
  const I18N = CFG.i18n || {};
  const t = (key, fallback) => I18N[key] || fallback || key;

  const THEME_MODE_KEY = 'ts-mkdocs-theme-mode';
  const THEME_KEY_LEGACY = 'ts-mkdocs-theme';
  const html = document.documentElement;
  const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');

  function hasFeature(name) { return FEATURES.has(name); }

  function getSystemTheme() {
    return systemMedia.matches ? 'dark' : 'light';
  }

  function resolveTheme(mode) {
    return mode === 'system' ? getSystemTheme() : mode;
  }

  const THEME_CYCLE = ['light', 'dark', 'system'];

  function setTooltipLabel(triggerId, label) {
    const trigger = document.getElementById(triggerId);
    if (!trigger) return;
    const bubble = document.getElementById(triggerId + '-tooltip');
    if (bubble) bubble.textContent = label;
    trigger.setAttribute('aria-label', label);
  }

  function updateThemeToggle(mode) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    document.querySelectorAll('.theme-icon').forEach(function (el) {
      el.classList.toggle('is-active', el.classList.contains('theme-icon--' + mode));
    });
    const labels = {
      light: t('theme.light', 'Light mode'),
      dark: t('theme.dark', 'Dark mode'),
      system: t('theme.system', 'Follow system'),
    };
    const label = labels[mode] || t('theme.toggle', 'Toggle theme');
    setTooltipLabel('theme-toggle', label);
  }

  function applyThemeMode(mode) {
    html.setAttribute('data-theme', resolveTheme(mode));
    localStorage.setItem(THEME_MODE_KEY, mode);
    updateThemeToggle(mode);
  }

  function nextThemeMode(mode) {
    const idx = THEME_CYCLE.indexOf(mode);
    return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
  }

  function loadThemeMode() {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    const legacy = localStorage.getItem(THEME_KEY_LEGACY);
    if (legacy === 'light' || legacy === 'dark') return legacy;
    return 'system';
  }

  function initTheme() {
    const mode = loadThemeMode();
    html.setAttribute('data-theme', resolveTheme(mode));
    systemMedia.addEventListener('change', function () {
      if (loadThemeMode() === 'system') {
        html.setAttribute('data-theme', getSystemTheme());
      }
    });
  }

  initTheme();
  if (document.getElementById('theme-toggle')) {
    updateThemeToggle(loadThemeMode());
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateThemeToggle(loadThemeMode());

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        applyThemeMode(nextThemeMode(loadThemeMode()));
      });
    }

    initSearch();
    if (hasFeature('content.code.copy')) initCopyButtons();
    initAnchorScrolling();
    if (hasFeature('toc.follow') || !FEATURES.size) initTocHighlight();
    initHeaderTopic();
    if (hasFeature('navigation.instant')) initInstantLoading();
    if (hasFeature('navigation.top')) initScrollTop();
    if (hasFeature('header.autohide')) initHeaderAutohide();
    initAnnounce();
    initMermaid();
    initStickyTabs();
    initHomeHero();
    initFooterCopyright();
    initSourceRepo();
  });

  function getBaseUrl() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      if (href.includes('assets/css/material.css')) {
        return href.replace('assets/css/material.css', '');
      }
    }
    return CFG.baseUrl || './';
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function highlightText(text, query) {
    if (!hasFeature('search.highlight') || !query) return escHtml(text);
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let out = escHtml(text);
    for (const term of terms) {
      const re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark class="md-search-result__highlight">$1</mark>');
    }
    return out;
  }

  function initSearch() {
    const input = document.getElementById('search-input');
    const resultList = document.getElementById('search-result-list');
    const meta = document.getElementById('search-meta');
    const searchEl = document.querySelector('.md-search');
    if (!input || !resultList || !meta || !searchEl) return;

    let index = null;
    let docs = null;
    let debounceTimer = null;

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') closeSearch();
    });

    document.querySelectorAll('label[for="__search"]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
    });

    const overlay = document.querySelector('.md-search__overlay');
    if (overlay) overlay.addEventListener('click', closeSearch);

    function openSearch() {
      searchEl.classList.add('md-search--active');
      input.focus();
      loadIndex();
    }

    function closeSearch() {
      searchEl.classList.remove('md-search--active');
      input.value = '';
      resultList.innerHTML = '';
      meta.textContent = t('search.type', 'Type to search');
    }

    function loadIndex() {
      if (index) return;
      fetch(getBaseUrl() + 'search/search_index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          docs = data.docs;
          if (data.index && window.lunr) {
            try { index = window.lunr.Index.load(data.index); }
            catch (_) { index = buildFallbackIndex(docs); }
          } else {
            index = buildFallbackIndex(docs);
          }
          meta.textContent = docs.length + ' ' + t('search.documents', 'documents indexed');
        })
        .catch(function () {
          meta.textContent = t('search.unavailable', 'Search index not available');
        });
    }

    function buildFallbackIndex(docList) {
      return {
        search: function (query) {
          const terms = query.toLowerCase().replace(/[+\-*~^:]/g, ' ').trim().split(/\s+/).filter(Boolean);
          return docList.map(function (doc) {
            const text = (doc.title + ' ' + doc.text).toLowerCase();
            const score = terms.reduce(function (acc, term) { return acc + (text.split(term).length - 1); }, 0);
            return { ref: doc.location, score: score };
          }).filter(function (r) { return r.score > 0; })
            .sort(function (a, b) { return b.score - a.score; }).slice(0, 20);
        }
      };
    }

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () { doSearch(input.value.trim()); }, hasFeature('search.suggest') ? 80 : 150);
    });

    function doSearch(query) {
      resultList.innerHTML = '';
      if (!query) { meta.textContent = t('search.type', 'Type to search'); return; }
      if (!index || !docs) { meta.textContent = t('search.loading', 'Loading index…'); return; }

      let results;
      try { results = index.search(query + ' ' + query + '*'); }
      catch (_) { try { results = index.search(query); } catch (__) { results = []; } }

      if (results.length === 0) {
        meta.textContent = t('search.no_results', 'No results for') + ' "' + query + '"';
        return;
      }

      const label = results.length > 1 ? t('search.results', 'results for') : t('search.result', 'result for');
      meta.textContent = results.length + ' ' + label + ' "' + query + '"';

      const docMap = {};
      docs.forEach(function (d) { docMap[d.location] = d; });
      const base = getBaseUrl();

      results.slice(0, 20).forEach(function (r) {
        const doc = docMap[r.ref];
        if (!doc) return;
        const li = document.createElement('li');
        li.className = 'md-search-result__item';
        const teaser = doc.text ? doc.text.slice(0, 120) + (doc.text.length > 120 ? '…' : '') : '';
        const href = base + doc.location;
        li.innerHTML =
          '<a class="md-search-result__link" href="' + href + '">' +
          '<div class="md-search-result__title">' + highlightText(doc.title, query) + '</div>' +
          (teaser ? '<div class="md-search-result__teaser">' + highlightText(teaser, query) + '</div>' : '') +
          '</a>';
        li.querySelector('a').addEventListener('click', function (e) {
          if (hasFeature('navigation.instant')) {
            e.preventDefault();
            navigateInstant(href);
            closeSearch();
          } else {
            closeSearch();
          }
        });
        resultList.appendChild(li);
      });

      if (hasFeature('search.share') && query) {
        const shareUrl = location.origin + location.pathname + '?q=' + encodeURIComponent(query);
        history.replaceState(null, '', shareUrl);
      }
    }

    const params = new URLSearchParams(location.search);
    if (params.get('q')) {
      openSearch();
      input.value = params.get('q');
      setTimeout(function () { doSearch(input.value); }, 300);
    }
  }

  function initCopyButtons() {
    const COPY_ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg>';
    const SUCCESS_ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7 9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7z"/></svg>';
    const copyLabel = t('clipboard.copy', 'Copy to clipboard');
    const copiedLabel = t('clipboard.copied', 'Copied!');

    document.querySelectorAll('.md-typeset pre:not(.mermaid)').forEach(function (block) {
      const wrapper = block.closest('.md-codeblock');
      const head = wrapper ? wrapper.querySelector('.md-codeblock__head') : null;
      const mount = head ?? block;
      if (mount.querySelector('.md-clipboard')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-clipboard';
      btn.setAttribute('aria-label', copyLabel);
      btn.innerHTML =
        '<span class="md-clipboard__tooltip" data-copy-label="' + copyLabel + '" data-copied-label="' + copiedLabel + '">' +
        copyLabel +
        '</span>' +
        '<span class="md-clipboard__icon md-clipboard__icon--copy">' + COPY_ICON + '</span>' +
        '<span class="md-clipboard__icon md-clipboard__icon--success">' + SUCCESS_ICON + '</span>';

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const code = block.querySelector('code') || block;
        const text = code.textContent || '';
        const tooltip = btn.querySelector('.md-clipboard__tooltip');
        const flashTarget = wrapper ?? block;

        function showSuccess() {
          btn.classList.add('md-clipboard--success', 'md-clipboard--pop');
          flashTarget.classList.add('md-codeblock--copied');
          btn.setAttribute('aria-label', copiedLabel);
          if (tooltip) tooltip.textContent = copiedLabel;

          clearTimeout(btn._copyResetTimer);
          btn._copyResetTimer = setTimeout(function () {
            btn.classList.remove('md-clipboard--success', 'md-clipboard--pop');
            btn.setAttribute('aria-label', copyLabel);
            if (tooltip) tooltip.textContent = copyLabel;
            flashTarget.classList.remove('md-codeblock--copied');
          }, 1800);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(showSuccess).catch(function () {
            fallbackCopy(text, showSuccess);
          });
        } else {
          fallbackCopy(text, showSuccess);
        }
      });

      mount.appendChild(btn);
    });
  }

  function fallbackCopy(text, onSuccess) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (_err) {
      /* ignore */
    }
    document.body.removeChild(textarea);
  }

  let anchorScrollingInit = false;

  function getScrollOffset() {
    const header = document.querySelector('.md-header');
    const tabs = document.querySelector('.md-tabs');
    let offset = header ? header.offsetHeight : 48;
    if (tabs && !tabs.classList.contains('md-tabs--hidden')) {
      offset += tabs.offsetHeight;
    }
    return offset + 8;
  }

  function scrollToAnchor(id, updateHash) {
    const target = document.getElementById(id);
    if (!target) return false;
    const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    if (updateHash !== false) {
      history.pushState(null, '', '#' + id);
    }
    return true;
  }

  function initAnchorScrolling() {
    function scrollFromLocation() {
      const hash = window.location.hash;
      if (!hash || hash === '#') return;
      const id = decodeURIComponent(hash.slice(1));
      scrollToAnchor(id, false);
    }

    if (anchorScrollingInit) {
      scrollFromLocation();
      return;
    }
    anchorScrollingInit = true;

    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = decodeURIComponent(href.slice(1));
      if (!document.getElementById(id)) return;
      e.preventDefault();
      scrollToAnchor(id);
    });

    scrollFromLocation();
    window.addEventListener('hashchange', scrollFromLocation);
  }

  function initTocHighlight() {
    const tocNav = document.querySelector('.md-nav--secondary, .md-nav--integrated');
    const tocLinks = document.querySelectorAll('.md-nav--secondary .md-nav__link, .md-nav--integrated .md-nav__link');
    if (!tocLinks.length) return;
    const headings = Array.from(document.querySelectorAll('.md-content h1, .md-content h2, .md-content h3, .md-content h4'));
    if (!headings.length) return;

    function onScroll() {
      let current = '';
      let currentIndex = -1;
      const offset = getScrollOffset();
      headings.forEach(function (h, i) {
        if (h.getBoundingClientRect().top <= offset + 4) {
          current = h.id;
          currentIndex = i;
        }
      });
      tocLinks.forEach(function (link) {
        const href = link.getAttribute('href') || '';
        const isActive = href === '#' + current;
        link.classList.toggle('md-nav__link--active', isActive);
        const linkId = href.slice(1);
        const linkIndex = headings.findIndex(function (h) { return h.id === linkId; });
        link.classList.toggle('md-nav__link--passed', linkIndex >= 0 && linkIndex < currentIndex);
      });

      if (hasFeature('toc.follow') && tocNav) {
        const active = tocNav.querySelector('.md-nav__link--active');
        const sidebar = active && active.closest('.md-sidebar');
        if (active && sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          const activeRect = active.getBoundingClientRect();
          const relativeTop = activeRect.top - sidebarRect.top + sidebar.scrollTop;
          const viewTop = sidebar.scrollTop;
          const viewBottom = viewTop + sidebar.clientHeight;
          const linkBottom = relativeTop + active.offsetHeight;
          if (relativeTop < viewTop + 40 || linkBottom > viewBottom - 40) {
            sidebar.scrollTo({ top: relativeTop - sidebar.clientHeight / 3, behavior: 'smooth' });
          }
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initHeaderTopic() {
    const topics = document.querySelectorAll('.md-header__topic');
    if (topics.length < 2) return;
    const h1 = document.querySelector('.md-content h1');
    const threshold = h1 ? h1.offsetTop + h1.offsetHeight : 80;
    function update() {
      const past = window.scrollY > threshold;
      topics[0].classList.toggle('md-header__topic--hidden', past);
      topics[1].classList.toggle('md-header__topic--active', past);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  const prefetchCache = new Map();

  function initInstantLoading() {
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a');
      if (!a || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      if (a.closest('.md-search')) return;
      e.preventDefault();
      navigateInstant(a.href);
    });

    if (hasFeature('navigation.instant.prefetch')) {
      document.addEventListener('mouseover', function (e) {
        const a = e.target.closest('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http')) return;
        prefetchPage(a.href);
      });
    }
  }

  function prefetchPage(url) {
    if (prefetchCache.has(url)) return;
    prefetchCache.set(url, fetch(url).then(function (r) { return r.text(); }));
  }

  function showProgress() {
    if (!hasFeature('navigation.instant.progress')) return;
    const bar = document.getElementById('md-progress');
    if (bar) { bar.hidden = false; bar.style.width = '30%'; }
  }

  function hideProgress() {
    const bar = document.getElementById('md-progress');
    if (bar) { bar.style.width = '100%'; setTimeout(function () { bar.hidden = true; bar.style.width = '0'; }, 200); }
  }

  function navigateInstant(url) {
    showProgress();
    const load = prefetchCache.get(url) || fetch(url).then(function (r) { return r.text(); });
    load.then(function (html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContent = doc.querySelector('.md-content');
      const newTitle = doc.querySelector('title');
      const newFooter = doc.querySelector('.md-footer');
      const curContent = document.querySelector('.md-content');
      const curFooter = document.querySelector('.md-footer');
      if (newContent && curContent) {
        curContent.innerHTML = newContent.innerHTML;
        if (newTitle) document.title = newTitle.textContent;
        if (newFooter && curFooter) {
          curFooter.replaceWith(newFooter.cloneNode(true));
        }
        history.pushState({}, '', url);
        initCopyButtons();
        initAnchorScrolling();
        initTocHighlight();
        initMermaid();
        window.scrollTo(0, 0);
      } else {
        location.href = url;
      }
      hideProgress();
    }).catch(function () { location.href = url; hideProgress(); });
  }

  window.addEventListener('popstate', function () { location.reload(); });

  function initScrollTop() {
    const btn = document.getElementById('md-top');
    if (!btn) return;
    const showAt = 480;

    function update() {
      btn.classList.toggle('md-top--visible', window.scrollY >= showAt);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initHeaderAutohide() {
    let lastY = window.scrollY;
    const minScroll = 80;
    const delta = 10;

    window.addEventListener('scroll', function () {
      const cur = window.scrollY;
      const diff = cur - lastY;

      if (cur <= minScroll) {
        document.body.classList.remove('md-header--hidden');
      } else if (diff > delta) {
        document.body.classList.add('md-header--hidden');
      } else if (diff < -delta) {
        document.body.classList.remove('md-header--hidden');
      }

      lastY = cur;
    }, { passive: true });
  }

  function initTabsAutohide(tabs) {
    let hidden = false;
    const topZone = 120;
    const delta = 8;
    let revealTimer = null;
    let lastY = window.scrollY;

    function playReveal() {
      const items = tabs.querySelectorAll('.md-tabs__item');
      items.forEach(function (item, i) {
        item.style.animationDelay = (0.02 + i * 0.03) + 's';
      });
      tabs.classList.add('md-tabs--reveal');
      clearTimeout(revealTimer);
      revealTimer = setTimeout(function () {
        tabs.classList.remove('md-tabs--reveal');
        items.forEach(function (item) {
          item.style.animationDelay = '';
        });
      }, 380 + items.length * 30);
    }

    function showTabs() {
      if (!hidden) return;
      hidden = false;
      tabs.classList.remove('md-tabs--hidden');
      playReveal();
    }

    function hideTabs() {
      if (hidden) return;
      hidden = true;
      clearTimeout(revealTimer);
      tabs.classList.remove('md-tabs--reveal');
      tabs.classList.add('md-tabs--hidden');
    }

    window.addEventListener('scroll', function () {
      const cur = window.scrollY;
      const diff = cur - lastY;

      if (cur <= topZone) {
        showTabs();
      } else if (diff > delta) {
        hideTabs();
      }

      lastY = cur;
    }, { passive: true });
  }

  function initAnnounce() {
    const bar = document.getElementById('md-announce');
    const btn = document.getElementById('announce-dismiss');
    if (!bar || !btn) return;
    if (localStorage.getItem('ts-mkdocs-announce-dismissed')) bar.style.display = 'none';
    btn.addEventListener('click', function () {
      bar.style.display = 'none';
      localStorage.setItem('ts-mkdocs-announce-dismissed', '1');
    });
  }

  function initMermaid() {
    const blocks = document.querySelectorAll('pre.mermaid');
    if (!blocks.length) return;
    if (!window.mermaid) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      s.onload = function () {
        window.mermaid.initialize({ startOnLoad: false, theme: html.getAttribute('data-theme') === 'dark' ? 'dark' : 'default' });
        window.mermaid.run({ nodes: blocks });
      };
      document.head.appendChild(s);
    } else {
      window.mermaid.run({ nodes: blocks });
    }
  }

  function formatCopyright(template) {
    const year = String(new Date().getFullYear());
    return template
      .replace(/\{year\}/gi, year)
      .replace(/&copy;/gi, '\u00A9')
      .replace(/&#169;/gi, '\u00A9')
      .replace(/\b20\d{2}\b/, year);
  }

  function initFooterCopyright() {
    const el = document.querySelector('[data-copyright-template]');
    if (!el) return;
    const template = el.dataset.copyrightTemplate;
    if (!template) return;
    el.textContent = formatCopyright(template);
  }

  function formatCount(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '';
    if (n >= 1000000) {
      const scaled = n / 1000000;
      return (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, '')) + 'M';
    }
    if (n >= 1000) {
      const scaled = n / 1000;
      return (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1).replace(/\.0$/, '')) + 'k';
    }
    return String(n);
  }

  function applySourceFacts(source, facts) {
    if (!source || !facts) return;
    if (facts.version) showSourceFact(source, 'version', facts.version);
    if (facts.stars != null) showSourceFact(source, 'stars', formatCount(facts.stars));
    if (facts.forks != null) showSourceFact(source, 'forks', formatCount(facts.forks));
  }

  function showSourceFact(source, type, value) {
    const el = source.querySelector('[data-md-source="' + type + '"]');
    if (!el || !value) return;
    const valueEl = el.querySelector('.md-source__fact-value');
    if (valueEl) valueEl.textContent = value;
    el.hidden = false;
  }

  var SOURCE_CACHE_TTL = 1000 * 60 * 60; // 1 hour

  function readSourceCache(cacheKey) {
    try {
      var raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (!entry || typeof entry.ts !== 'number' || !entry.facts) return null;
      if (Date.now() - entry.ts > SOURCE_CACHE_TTL) return null;
      return entry.facts;
    } catch (_) {
      return null;
    }
  }

  function writeSourceCache(cacheKey, facts) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), facts: facts }));
    } catch (_) {}
  }

  function initSourceRepo() {
    const source = document.querySelector('[data-md-component="source"]');
    const cfg = CFG.repoSource;
    if (!source || !cfg || cfg.provider !== 'github' || !cfg.owner || !cfg.repo) return;

    // Facts fetched server-side at build time (optionally using a repo_token
    // from mkdocs.yml) take priority: no client request, no exposed token.
    if (CFG.repoSourceFacts) {
      applySourceFacts(source, CFG.repoSourceFacts);
      return;
    }

    const cacheKey = 'ts-mkdocs-source-v2-' + cfg.owner + '/' + cfg.repo;
    const cached = readSourceCache(cacheKey);
    if (cached) {
      applySourceFacts(source, cached);
      return;
    }

    const repoPath = cfg.owner + '/' + cfg.repo;
    fetch('https://api.github.com/repos/' + repoPath, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return;
        const facts = {
          stars: data.stargazers_count,
          forks: data.forks_count,
        };
        return fetch('https://api.github.com/repos/' + repoPath + '/releases/latest', {
          headers: { Accept: 'application/vnd.github+json' },
        })
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (release) {
            if (release && release.tag_name) {
              facts.version = String(release.tag_name).replace(/^v/, '');
              writeSourceCache(cacheKey, facts);
              applySourceFacts(source, facts);
              return;
            }
            return fetch('https://api.github.com/repos/' + repoPath + '/tags', {
              headers: { Accept: 'application/vnd.github+json' },
            })
              .then(function (res) { return res.ok ? res.json() : null; })
              .then(function (tags) {
                if (Array.isArray(tags) && tags[0] && tags[0].name) {
                  facts.version = String(tags[0].name).replace(/^v/, '');
                }
                writeSourceCache(cacheKey, facts);
                applySourceFacts(source, facts);
              });
          });
      })
      .catch(function () {});
  }

  function initHomeHero() {
    const hero = document.querySelector('.home-hero');
    if (!hero) return;

    const orbs = hero.querySelector('.home-hero__orbs');
    if (orbs) {
      hero.addEventListener('mousemove', function (e) {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        orbs.style.transform = 'translate(' + (x * 24) + 'px, ' + (y * 18) + 'px)';
      }, { passive: true });
      hero.addEventListener('mouseleave', function () {
        orbs.style.transform = '';
      });
    }

    const scrollBtn = hero.querySelector('.home-hero__scroll');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', function () {
        const next = hero.nextElementSibling;
        if (next) {
          next.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    const content = document.querySelector('.home-content');
    if (content && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('home-reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      observer.observe(content);
    } else if (content) {
      content.classList.add('home-reveal--visible');
    }
  }

  function initStickyTabs() {
    if (!hasFeature('navigation.tabs.sticky')) return;
    const tabs = document.querySelector('.md-tabs');
    if (!tabs) return;
    tabs.classList.add('md-tabs--sticky');
    initTabsAutohide(tabs);
  }

  const style = document.createElement('style');
  style.textContent = '.md-header__topic--hidden{opacity:0;}';
  document.head.appendChild(style);
})();
