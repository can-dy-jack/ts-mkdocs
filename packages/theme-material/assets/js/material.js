/* ts-mkdocs Material Theme JS */
(function () {
  'use strict';

  const CFG = window.__TS_MKDOCS__ || { features: [], i18n: {}, baseUrl: './' };
  const FEATURES = new Set(CFG.features || []);
  const I18N = CFG.i18n || {};
  const t = (key, fallback) => I18N[key] || fallback || key;

  const THEME_KEY = 'ts-mkdocs-theme';
  const html = document.documentElement;

  function hasFeature(name) { return FEATURES.has(name); }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const lightIcon = document.querySelector('.icon-light');
    const darkIcon = document.querySelector('.icon-dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = theme === 'dark' ? 'none' : '';
      darkIcon.style.display = theme === 'dark' ? '' : 'none';
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
  }

  initTheme();

  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
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
    document.querySelectorAll('pre, .shiki').forEach(function (pre) {
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.title = 'Copy';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg>';
      btn.addEventListener('click', function () {
        const code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.textContent || '');
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
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
      const curContent = document.querySelector('.md-content');
      if (newContent && curContent) {
        curContent.innerHTML = newContent.innerHTML;
        if (newTitle) document.title = newTitle.textContent;
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
    window.addEventListener('scroll', function () {
      btn.hidden = window.scrollY < 400;
    }, { passive: true });
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

  function initStickyTabs() {
    if (!hasFeature('navigation.tabs.sticky')) return;
    const tabs = document.querySelector('.md-tabs');
    if (!tabs) return;
    tabs.classList.add('md-tabs--sticky');
    initTabsAutohide(tabs);
  }

  const style = document.createElement('style');
  style.textContent = [
    '.copy-btn{position:absolute;top:.4rem;right:.4rem;width:1.8rem;height:1.8rem;',
    'display:flex;align-items:center;justify-content:center;border:none;border-radius:.2rem;',
    'cursor:pointer;opacity:0;transition:opacity .15s;background:rgba(0,0,0,.15);color:#fff;}',
    'pre:hover .copy-btn,.shiki:hover .copy-btn{opacity:1;}',
    '.md-header__topic--hidden{opacity:0;}',
  ].join('');
  document.head.appendChild(style);
})();
