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
    syncCommentsTheme();
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
        syncCommentsTheme();
      }
    });
  }

  /* ── Comments (Giscus / Utterances) theme sync ──────────────── */
  var commentsConfig = null;

  function getEffectiveSiteTheme() {
    return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function readCommentsConfig() {
    var el = document.getElementById('ts-mkdocs-comments-config');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent || '');
    } catch (err) {
      return null;
    }
  }

  function resolveCommentsTheme(config) {
    if (!config || !config.theme_dark) return config.theme;
    return getEffectiveSiteTheme() === 'dark' ? config.theme_dark : config.theme;
  }

  function injectGiscusWidget(container, config) {
    if (container.dataset.widgetInjected === '1') return;
    container.dataset.widgetInjected = '1';
    var script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.setAttribute('data-repo', config.repo);
    script.setAttribute('data-repo-id', config.repo_id);
    script.setAttribute('data-category', config.category);
    script.setAttribute('data-category-id', config.category_id);
    script.setAttribute('data-mapping', config.mapping);
    script.setAttribute('data-strict', config.strict);
    script.setAttribute('data-reactions-enabled', config.reactions_enabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', config.emit_metadata ? '1' : '0');
    script.setAttribute('data-input-position', config.input_position);
    script.setAttribute('data-theme', resolveCommentsTheme(config));
    script.setAttribute('data-lang', config.lang);
    script.setAttribute('data-loading', config.loading);
    container.appendChild(script);
  }

  function injectUtterancesWidget(container, config) {
    if (container.dataset.widgetInjected === '1') return;
    container.dataset.widgetInjected = '1';
    var script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.setAttribute('repo', config.repo);
    script.setAttribute('issue-term', config.issue_term);
    if (config.issue_number != null) {
      script.setAttribute('issue-number', String(config.issue_number));
    }
    if (config.label) script.setAttribute('label', config.label);
    script.setAttribute('theme', resolveCommentsTheme(config));
    container.appendChild(script);
  }

  function syncGiscusTheme(theme) {
    var frame = document.querySelector('iframe.giscus-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: theme } } },
        'https://giscus.app'
      );
    }
  }

  function syncUtterancesTheme(theme) {
    var frame = document.querySelector('iframe.utterances-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage(
        { type: 'set-theme', theme: theme },
        'https://utteranc.es'
      );
    }
  }

  function syncCommentsTheme() {
    if (!commentsConfig || !commentsConfig.theme_dark) return;
    var theme = resolveCommentsTheme(commentsConfig);
    if (commentsConfig.provider === 'giscus') syncGiscusTheme(theme);
    else if (commentsConfig.provider === 'utterances') syncUtterancesTheme(theme);
  }

  function initComments() {
    commentsConfig = readCommentsConfig();
    if (!commentsConfig || !commentsConfig.theme_dark) return;

    var container = document.querySelector('.md-comments');
    if (!container) return;

    if (commentsConfig.provider === 'giscus') {
      injectGiscusWidget(container, commentsConfig);
    } else if (commentsConfig.provider === 'utterances') {
      injectUtterancesWidget(container, commentsConfig);
    }

    window.addEventListener('message', function (event) {
      if (event.origin !== 'https://giscus.app') return;
      if (!event.data || typeof event.data !== 'object' || !event.data.giscus) return;
      if ('resizeHeight' in event.data.giscus) syncCommentsTheme();
    });
  }

  initTheme();
  if (document.getElementById('theme-toggle')) {
    updateThemeToggle(loadThemeMode());
  }

  /* ── Settings (apply early to prevent FOUC) ─────────────────── */
  var SETTINGS_KEY = 'ts-mkdocs-settings';
  var settingsConfig = (CFG.settings || {});
  var settingsEnabled = settingsConfig.enabled !== false;

  function lightenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.round(r + (255 - r) * amount));
    g = Math.min(255, Math.round(g + (255 - g) * amount));
    b = Math.min(255, Math.round(b + (255 - b) * amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function darkenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.round(r * (1 - amount)));
    g = Math.max(0, Math.round(g * (1 - amount)));
    b = Math.max(0, Math.round(b * (1 - amount)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function computeColorScheme(baseColor) {
    return {
      light: lightenColor(baseColor, 0.18),
      dark: darkenColor(baseColor, 0.28),
      accent: lightenColor(baseColor, 0.3)
    };
  }

  function getFontFamily(fontIndex) {
    var fonts = settingsConfig.fonts || [];
    var idx = parseInt(fontIndex, 10);
    if (idx >= 0 && idx < fonts.length && fonts[idx].family) {
      return fonts[idx].family;
    }
    return '';
  }

  function getFontUrl(fontIndex) {
    var fonts = settingsConfig.fonts || [];
    var idx = parseInt(fontIndex, 10);
    if (idx >= 0 && idx < fonts.length && fonts[idx].url) {
      return fonts[idx].url;
    }
    return '';
  }

  function getAllowedColors() {
    return (settingsConfig.colors || []).map(function (c) { return c.color; });
  }

  function getAllowedFontSizes() {
    return (settingsConfig.font_sizes || []).map(function (s) { return s.value; });
  }

  function defaultSettings() {
    return {
      color: settingsConfig.default_color || '#3f51b5',
      fontIndex: 0,
      fontSize: settingsConfig.default_font_size || 115
    };
  }

  function normalizeSettings(parsed) {
    var def = defaultSettings();
    if (!parsed || typeof parsed !== 'object') return def;

    var allowedColors = getAllowedColors();
    var color = typeof parsed.color === 'string' && allowedColors.indexOf(parsed.color) !== -1
      ? parsed.color
      : def.color;

    var fonts = settingsConfig.fonts || [];
    var fontIndex = typeof parsed.fontIndex === 'number' && parsed.fontIndex >= 0 && parsed.fontIndex < fonts.length
      ? parsed.fontIndex
      : 0;

    var allowedSizes = getAllowedFontSizes();
    var fontSize = typeof parsed.fontSize === 'number' && allowedSizes.indexOf(parsed.fontSize) !== -1
      ? parsed.fontSize
      : def.fontSize;

    return { color: color, fontIndex: fontIndex, fontSize: fontSize };
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return normalizeSettings(JSON.parse(raw));
    } catch (_) {}
    return defaultSettings();
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
  }

  function clearSettings() {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (_) {}
  }

  function applySettings(settings) {
    var root = document.documentElement;

    var scheme = computeColorScheme(settings.color);
    root.style.setProperty('--md-primary-fg-color', settings.color);
    root.style.setProperty('--md-primary-fg-color--light', scheme.light);
    root.style.setProperty('--md-primary-fg-color--dark', scheme.dark);
    root.style.setProperty('--md-accent-fg-color', scheme.accent);

    var family = getFontFamily(settings.fontIndex);
    if (family) {
      root.style.setProperty('--md-font-text', family);
    } else {
      root.style.removeProperty('--md-font-text');
    }

    root.style.fontSize = settings.fontSize + '%';
  }

  function loadExtraFont(fontIndex) {
    var url = getFontUrl(fontIndex);
    if (!url) return;
    var id = 'settings-font-' + fontIndex;
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  function bootstrapSettings() {
    var settings = loadSettings();
    applySettings(settings);
    if (settings.fontIndex > 0) {
      loadExtraFont(settings.fontIndex);
    }
  }

  if (settingsEnabled) {
    bootstrapSettings();
  }

  function initDrawer() {
    const drawer = document.getElementById('__drawer');
    const menuToggle = document.getElementById('menu-toggle');
    if (!drawer) return function () {};

    const mq = window.matchMedia('(max-width: 76.1875em)');

    function syncDrawerState() {
      const open = drawer.checked && mq.matches;
      document.body.classList.toggle('md-drawer--open', open);
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuToggle.setAttribute('aria-label', open ? t('menu.close', 'Close menu') : t('menu.open', 'Open menu'));
      }
    }

    function closeDrawer() {
      if (!drawer.checked) return;
      drawer.checked = false;
      syncDrawerState();
    }

    drawer.addEventListener('change', syncDrawerState);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.checked) closeDrawer();
    });

    document.querySelectorAll('.md-sidebar--primary .md-nav__link[href]').forEach(function (link) {
      link.addEventListener('click', closeDrawer);
    });

    mq.addEventListener('change', function () {
      if (!mq.matches) drawer.checked = false;
      syncDrawerState();
    });

    syncDrawerState();
    return closeDrawer;
  }

  let closeDrawer = function () {};

  document.addEventListener('DOMContentLoaded', function () {
    updateThemeToggle(loadThemeMode());

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        applyThemeMode(nextThemeMode(loadThemeMode()));
      });
    }

    initSearch();
    closeDrawer = initDrawer();
    initTrafficLights();
    if (hasFeature('content.code.copy')) initCopyButtons();
    if (hasFeature('content.code.wrap')) initWrapButtons();
    initAnchorScrolling();
    if (hasFeature('toc.follow') || !FEATURES.size) initTocHighlight();
    initHeaderTopic();
    if (hasFeature('navigation.instant')) initInstantLoading();
    if (hasFeature('navigation.top')) initScrollTop();
    if (hasFeature('header.autohide')) initHeaderAutohide();
    initAnnounce();
    initMermaid();
    initAnnotations();
    initStickyTabs();
    initHomeHero();
    initFooterCopyright();
    initSourceRepo();
    initTagsFilter();
    initLightbox();
    if (settingsEnabled) initSettings();
    initPageShare();
    initComments();
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

  function getCodeblockToolbar(wrapper, block) {
    const head = wrapper ? wrapper.querySelector('.md-codeblock__head') : null;
    if (!head) return block;
    const mount = head.querySelector('.md-codeblock__head-end') || head;
    let actions = mount.querySelector('.md-codeblock__actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'md-codeblock__actions';
      const existing = mount.querySelector('.md-clipboard');
      mount.appendChild(actions);
      if (existing) actions.appendChild(existing);
    }
    return actions;
  }

  function getCodeblockTarget(block) {
    return block.closest('.md-codeblock') || block;
  }

  const CODE_WRAP_KEY = 'ts-mkdocs-code-wrap';

  function loadCodeWrapPreference() {
    try {
      return localStorage.getItem(CODE_WRAP_KEY) === '1';
    } catch (_err) {
      return false;
    }
  }

  function saveCodeWrapPreference(enabled) {
    try {
      localStorage.setItem(CODE_WRAP_KEY, enabled ? '1' : '0');
    } catch (_err) {
      /* ignore */
    }
  }

  function applyCodeWrap(target, enabled) {
    target.classList.toggle('md-codeblock--wrap', enabled);
  }

  function flashTrafficDot(btn) {
    btn.classList.add('md-codeblock__traffic-dot--pressed');
    clearTimeout(btn._pressTimer);
    btn._pressTimer = setTimeout(function () {
      btn.classList.remove('md-codeblock__traffic-dot--pressed');
    }, 160);
  }

  function setCodeblockCollapsed(block, collapsed) {
    block.classList.toggle('md-codeblock--collapsed', collapsed);
    block.setAttribute('data-md-collapsed', collapsed ? 'true' : 'false');
    block.querySelectorAll('.md-codeblock__traffic-dot').forEach(function (btn) {
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
    if (typeof repositionActiveAnnotations === 'function') {
      repositionActiveAnnotations();
    }
  }

  function initTrafficLights() {
    const closeLabel = t('code.traffic.close', 'Collapse code block');
    const toggleLabel = t('code.traffic.toggle', 'Toggle code block');
    const expandLabel = t('code.traffic.expand', 'Expand code block');

    document.querySelectorAll('.md-codeblock .md-codeblock__traffic:not([data-md-traffic-init])').forEach(function (traffic) {
      traffic.setAttribute('data-md-traffic-init', '1');
      const block = traffic.closest('.md-codeblock');
      if (!block) return;

      const closeBtn = traffic.querySelector('.md-codeblock__traffic-dot--close');
      const toggleBtn = traffic.querySelector('.md-codeblock__traffic-dot--minimize');
      const expandBtn = traffic.querySelector('.md-codeblock__traffic-dot--maximize');

      if (closeBtn) {
        closeBtn.setAttribute('aria-label', closeLabel);
        closeBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          flashTrafficDot(closeBtn);
          setCodeblockCollapsed(block, true);
        });
      }

      if (toggleBtn) {
        toggleBtn.setAttribute('aria-label', toggleLabel);
        toggleBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          flashTrafficDot(toggleBtn);
          setCodeblockCollapsed(block, !block.classList.contains('md-codeblock--collapsed'));
        });
      }

      if (expandBtn) {
        expandBtn.setAttribute('aria-label', expandLabel);
        expandBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          flashTrafficDot(expandBtn);
          setCodeblockCollapsed(block, false);
        });
      }
    });
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
      const mount = getCodeblockToolbar(wrapper, block);
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

  function initWrapButtons() {
    const wrapLabel = t('code.wrap.enable', 'Enable line wrap');
    const unwrapLabel = t('code.wrap.disable', 'Disable line wrap');
    const wrapEnabled = loadCodeWrapPreference();

    document.querySelectorAll('.md-typeset pre:not(.mermaid)').forEach(function (block) {
      const wrapper = block.closest('.md-codeblock');
      const mount = getCodeblockToolbar(wrapper, block);
      if (mount.querySelector('.md-code-wrap')) return;

      const target = getCodeblockTarget(block);
      applyCodeWrap(target, wrapEnabled);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'md-code-wrap';
      btn.setAttribute('aria-pressed', wrapEnabled ? 'true' : 'false');
      btn.setAttribute('aria-label', wrapEnabled ? unwrapLabel : wrapLabel);
      btn.innerHTML =
        '<span class="md-code-wrap__tooltip" data-wrap-label="' + wrapLabel + '" data-unwrap-label="' + unwrapLabel + '">' +
        (wrapEnabled ? unwrapLabel : wrapLabel) +
        '</span>' +
        '<span class="md-code-wrap__icon" aria-hidden="true">' +
        '<span class="material-symbols-outlined">wrap_text</span></span>';

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const next = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', next ? 'true' : 'false');
        btn.setAttribute('aria-label', next ? unwrapLabel : wrapLabel);
        const tooltip = btn.querySelector('.md-code-wrap__tooltip');
        if (tooltip) tooltip.textContent = next ? unwrapLabel : wrapLabel;
        applyCodeWrap(target, next);
        saveCodeWrapPreference(next);
        if (typeof repositionActiveAnnotations === 'function') {
          repositionActiveAnnotations();
        }
      });

      const existingClipboard = mount.querySelector('.md-clipboard');
      if (existingClipboard) {
        mount.insertBefore(btn, existingClipboard);
      } else {
        mount.appendChild(btn);
      }
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

  let annotationsDocBound = false;

  function annotationTrigger(wrapper) {
    return wrapper.querySelector(':scope > .md-annotation__index');
  }

  function annotationTooltip(wrapper) {
    return wrapper.querySelector(':scope > .md-annotation__tooltip');
  }

  function clearAnnotationTooltipPosition(tooltip) {
    if (!tooltip) return;
    tooltip.classList.remove('md-annotation__tooltip--flip-x', 'md-annotation__tooltip--flip-y', 'md-annotation__tooltip--fixed');
    tooltip.style.removeProperty('--md-annotation-fixed-top');
    tooltip.style.removeProperty('--md-annotation-fixed-left');
  }

  function closeAnnotation(wrapper) {
    if (!wrapper) return;
    wrapper.querySelectorAll('.md-annotation--active').forEach(function (nested) {
      if (nested !== wrapper) closeAnnotation(nested);
    });
    wrapper.classList.remove('md-annotation--active');
    const trigger = annotationTrigger(wrapper);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    // Keep flip/fixed classes through the fade-out so the tooltip does not jump position.
    // positionAnnotationTooltip() clears them on the next open.
  }

  function closeAllAnnotations(except) {
    document.querySelectorAll('.md-annotation--active').forEach(function (wrapper) {
      if (wrapper === except) return;
      // Keep ancestor annotations open so nested markers inside a tooltip stay clickable.
      if (except && wrapper.contains(except)) return;
      closeAnnotation(wrapper);
    });
  }

  function positionAnnotationTooltip(wrapper) {
    const tooltip = annotationTooltip(wrapper);
    const trigger = annotationTrigger(wrapper);
    if (!tooltip || !trigger) return;
    clearAnnotationTooltipPosition(tooltip);

    // Nested markers live inside a parent tooltip – open downward to avoid clipping.
    if (wrapper.closest('.md-annotation__tooltip-inner')) {
      tooltip.classList.add('md-annotation__tooltip--flip-y');
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const gap = 8;

    // Code blocks scroll on <pre>; escape the clipping box with fixed positioning.
    if (wrapper.closest('pre')) {
      tooltip.classList.add('md-annotation__tooltip--fixed');
      const tooltipRect = tooltip.getBoundingClientRect();
      let flipY = false;
      let top = triggerRect.top - tooltipRect.height - gap;
      if (top < gap) {
        top = triggerRect.bottom + gap;
        flipY = true;
      }
      tooltip.style.setProperty('--md-annotation-fixed-top', top + 'px');
      tooltip.style.setProperty('--md-annotation-fixed-left', (triggerRect.left + triggerRect.width / 2) + 'px');
      if (flipY) tooltip.classList.add('md-annotation__tooltip--flip-y');

      const updated = tooltip.getBoundingClientRect();
      if (updated.left < gap || updated.right > window.innerWidth - gap) {
        tooltip.classList.add('md-annotation__tooltip--flip-x');
        const anchorX = updated.right > window.innerWidth - gap ? triggerRect.right : triggerRect.left;
        tooltip.style.setProperty('--md-annotation-fixed-left', anchorX + 'px');
      }
      return;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    if (wrapperRect.top - tooltipRect.height < gap) {
      tooltip.classList.add('md-annotation__tooltip--flip-y');
    }

    const updated = tooltip.getBoundingClientRect();
    if (updated.left < gap || updated.right > window.innerWidth - gap) {
      tooltip.classList.add('md-annotation__tooltip--flip-x');
    }
  }

  function repositionActiveAnnotations() {
    document.querySelectorAll('.md-annotation--active').forEach(positionAnnotationTooltip);
  }

  function toggleAnnotation(wrapper) {
    const willOpen = !wrapper.classList.contains('md-annotation--active');
    closeAllAnnotations(wrapper);
    if (willOpen) {
      wrapper.classList.add('md-annotation--active');
      const trigger = annotationTrigger(wrapper);
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      positionAnnotationTooltip(wrapper);
    } else {
      closeAnnotation(wrapper);
    }
  }

  function initAnnotations() {
    document.querySelectorAll('.md-annotation__index').forEach(function (trigger) {
      if (trigger.dataset.mdAnnotationBound) return;
      trigger.dataset.mdAnnotationBound = '1';

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = trigger.closest('.md-annotation');
        if (wrapper) toggleAnnotation(wrapper);
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const wrapper = trigger.closest('.md-annotation');
          if (wrapper) toggleAnnotation(wrapper);
        }
      });
    });

    if (annotationsDocBound) return;
    annotationsDocBound = true;

    document.addEventListener('click', function (e) {
      if (e.target.closest('.md-annotation')) return;
      closeAllAnnotations();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllAnnotations();
    });

    window.addEventListener('scroll', repositionActiveAnnotations, { passive: true });
    window.addEventListener('resize', repositionActiveAnnotations);

    document.querySelectorAll('pre').forEach(function (pre) {
      pre.addEventListener('scroll', repositionActiveAnnotations, { passive: true });
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
        initTrafficLights();
        initCopyButtons();
        if (hasFeature('content.code.wrap')) initWrapButtons();
        initAnchorScrolling();
        initTocHighlight();
        initMermaid();
        initAnnotations();
        initLightbox();
        closeDrawer();
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

  function resolveMermaidTheme(cfg) {
    if (cfg && cfg.theme && cfg.theme !== 'auto') return cfg.theme;
    return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'default';
  }

  function buildMermaidInitOptions(cfg) {
    const opts = {
      startOnLoad: false,
      theme: resolveMermaidTheme(cfg),
    };
    if (cfg) {
      if (cfg.themeVariables) opts.themeVariables = cfg.themeVariables;
      if (cfg.securityLevel) opts.securityLevel = cfg.securityLevel;
      if (cfg.flowchart) opts.flowchart = cfg.flowchart;
      if (cfg.sequence) opts.sequence = cfg.sequence;
      if (cfg.gantt) opts.gantt = cfg.gantt;
    }
    return opts;
  }

  let mermaidApi = null;

  function getMermaidApi() {
    if (mermaidApi) return mermaidApi;
    return window.mermaid && typeof window.mermaid.initialize === 'function'
      ? window.mermaid
      : null;
  }

  function loadMermaidScript(scriptUrl) {
    if (scriptUrl.endsWith('.mjs')) {
      return import(scriptUrl).then(function (mod) {
        return mod.default || mod;
      });
    }
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = scriptUrl;
      s.crossOrigin = 'anonymous';
      s.onload = function () {
        const api = getMermaidApi();
        if (api) resolve(api);
        else reject(new Error('Mermaid failed to load'));
      };
      s.onerror = function () { reject(new Error('Mermaid failed to load')); };
      document.head.appendChild(s);
    });
  }

  function initMermaid() {
    const blocks = document.querySelectorAll('pre.mermaid');
    if (!blocks.length) return;

    const cfg = CFG.mermaid;
    const scriptUrl = (cfg && cfg.cdn && cfg.cdn.javascript)
      || 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

    function runMermaid(api) {
      const m = api || getMermaidApi();
      if (!m || typeof m.initialize !== 'function') return;
      mermaidApi = m;
      m.initialize(buildMermaidInitOptions(cfg));
      m.run({ nodes: blocks });
    }

    const existing = getMermaidApi();
    if (existing) {
      runMermaid(existing);
    } else {
      loadMermaidScript(scriptUrl).then(runMermaid).catch(function (err) {
        console.error('Failed to load Mermaid:', err);
      });
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

  function initTagsFilter() {
    var root = document.querySelector('[data-md-component="tags-index"]');
    if (!root) return;

    var input = document.getElementById('tags-filter-input');
    var emptyMsg = document.getElementById('tags-filter-empty');
    var cloudTags = root.querySelectorAll('.md-tags-cloud__tag');
    var sections = root.querySelectorAll('.md-tags-listing__section');

    function applyFilter(query) {
      var q = query.trim().toLowerCase();
      var visible = 0;

      cloudTags.forEach(function (el) {
        var name = el.getAttribute('data-tag-name') || '';
        var match = !q || name.indexOf(q) !== -1;
        el.classList.toggle('is-hidden', !match);
        if (match) visible++;
      });

      sections.forEach(function (el) {
        var name = el.getAttribute('data-tag-name') || '';
        var match = !q || name.indexOf(q) !== -1;
        el.classList.toggle('is-hidden', !match);
      });

      if (emptyMsg) {
        emptyMsg.hidden = visible > 0 || !q;
      }
    }

    function highlightFromHash() {
      var hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      sections.forEach(function (el) {
        el.classList.toggle('is-highlighted', el.id === hash);
      });
      var target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    if (input) {
      input.addEventListener('input', function () {
        applyFilter(input.value);
      });
    }

    window.addEventListener('hashchange', highlightFromHash);
    highlightFromHash();
  }

  let lightboxInstance = null;

  function initLightbox() {
    if (!hasFeature('content.image.lightbox')) return;
    if (typeof GLightbox !== 'function') return;

    if (lightboxInstance && typeof lightboxInstance.destroy === 'function') {
      lightboxInstance.destroy();
      lightboxInstance = null;
    }

    lightboxInstance = GLightbox({
      selector: '.md-content .glightbox',
      touchNavigation: true,
      loop: true,
      zoomable: true,
      draggable: true,
    });
  }

  function syncSettingsUI(settings) {
    var colorsContainer = document.getElementById('settings-colors');
    var fontsContainer = document.getElementById('settings-fonts');
    var sizesContainer = document.getElementById('settings-sizes');

    if (colorsContainer) {
      colorsContainer.querySelectorAll('.md-settings__color-swatch').forEach(function (el) {
        el.classList.toggle('is-active', el.dataset.color === settings.color);
      });
    }
    if (fontsContainer) {
      fontsContainer.querySelectorAll('.md-settings__font-btn').forEach(function (el) {
        el.classList.toggle('is-active', el.dataset.font === String(settings.fontIndex));
      });
    }
    if (sizesContainer) {
      sizesContainer.querySelectorAll('.md-settings__size-btn').forEach(function (el) {
        el.classList.toggle('is-active', parseInt(el.dataset.size, 10) === settings.fontSize);
      });
    }
  }

  function initSettings() {
    var panel = document.getElementById('__settings');
    var toggleBtn = document.getElementById('settings-toggle');
    var closeBtn = document.getElementById('settings-close');
    var resetBtn = document.getElementById('settings-reset');
    var colorsContainer = document.getElementById('settings-colors');
    var fontsContainer = document.getElementById('settings-fonts');
    var sizesContainer = document.getElementById('settings-sizes');

    if (!panel || !toggleBtn) return;

    var settings = loadSettings();
    syncSettingsUI(settings);

    function setPanelOpen(isOpen) {
      panel.classList.toggle('md-settings--active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function openSettings() {
      setPanelOpen(true);
    }

    function closeSettings() {
      setPanelOpen(false);
    }

    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.classList.contains('md-settings--active')) {
        closeSettings();
      } else {
        openSettings();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeSettings();
      });
    }

    document.addEventListener('click', function (e) {
      if (!panel.classList.contains('md-settings--active')) return;
      if (e.target.closest('.md-settings') || e.target.closest('#settings-toggle')) return;
      closeSettings();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('md-settings--active')) {
        closeSettings();
      }
    });

    if (colorsContainer) {
      colorsContainer.addEventListener('click', function (e) {
        var swatch = e.target.closest('.md-settings__color-swatch');
        if (!swatch) return;
        settings.color = swatch.dataset.color;
        applySettings(settings);
        saveSettings(settings);
        syncSettingsUI(settings);
      });
    }

    if (fontsContainer) {
      fontsContainer.addEventListener('click', function (e) {
        var btn = e.target.closest('.md-settings__font-btn');
        if (!btn) return;
        settings.fontIndex = parseInt(btn.dataset.font, 10);
        if (settings.fontIndex > 0) loadExtraFont(settings.fontIndex);
        applySettings(settings);
        saveSettings(settings);
        syncSettingsUI(settings);
      });
    }

    if (sizesContainer) {
      sizesContainer.addEventListener('click', function (e) {
        var btn = e.target.closest('.md-settings__size-btn');
        if (!btn) return;
        settings.fontSize = parseInt(btn.dataset.size, 10);
        applySettings(settings);
        saveSettings(settings);
        syncSettingsUI(settings);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        clearSettings();
        settings = defaultSettings();
        applySettings(settings);
        if (settings.fontIndex > 0) {
          loadExtraFont(settings.fontIndex);
        } else {
          document.documentElement.style.removeProperty('--md-font-text');
        }
        syncSettingsUI(settings);
      });
    }
  }

  function initPageShare() {
    const shareEl = document.querySelector('.md-page-share');
    if (!shareEl) return;

    const shareUrl = shareEl.dataset.shareUrl || location.href;
    const toast = shareEl.querySelector('.md-page-share__toast');
    const copiedLabel = t('share.copied', 'Link copied!');
    const wechatTitle = t('share.wechat_title', 'Scan with WeChat');
    const wechatHint = t('share.wechat_hint', 'Scan the QR code to share');
    let popover = null;
    let popoverAnchor = null;
    let toastTimer = null;

    function positionSharePopup(popup, anchor, gap) {
      const offset = gap != null ? gap : 10;
      const padding = 8;
      popup.hidden = false;
      popup.style.visibility = 'hidden';
      popup.style.left = '0';
      popup.style.top = '0';

      const anchorRect = anchor.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const anchorCenter = anchorRect.left + anchorRect.width / 2;

      let left = anchorCenter - popupRect.width / 2;
      let top = anchorRect.top - popupRect.height - offset;

      left = Math.max(padding, Math.min(left, window.innerWidth - popupRect.width - padding));
      if (top < padding) {
        top = anchorRect.bottom + offset;
      }

      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
      popup.style.visibility = '';

      const arrowLeft = Math.max(14, Math.min(anchorCenter - left, popupRect.width - 14));
      popup.style.setProperty('--md-share-arrow-left', arrowLeft + 'px');
    }

    function showToast(message, anchor) {
      if (!toast || !anchor) return;
      toast.textContent = message;
      toast.style.animation = 'none';
      positionSharePopup(toast, anchor);
      void toast.offsetWidth;
      toast.style.animation = '';
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.hidden = true;
      }, 2200);
    }

    function copyShareUrl(anchor) {
      function onSuccess() {
        showToast(copiedLabel, anchor);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(onSuccess).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          onSuccess();
        } catch (e) { /* ignore */ }
        document.body.removeChild(ta);
      }
    }

    function closePopover() {
      if (popover) {
        popover.remove();
        popover = null;
        popoverAnchor = null;
      }
    }

    function openWechatPopover(anchor) {
      closePopover();
      popoverAnchor = anchor;
      popover = document.createElement('div');
      popover.className = 'md-page-share__popover';
      popover.setAttribute('role', 'dialog');
      popover.setAttribute('aria-label', wechatTitle);

      const title = document.createElement('p');
      title.className = 'md-page-share__popover-title';
      title.textContent = wechatTitle;

      const img = document.createElement('img');
      img.className = 'md-page-share__qr';
      img.alt = wechatTitle;
      img.width = 152;
      img.height = 152;
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=152x152&data=' + encodeURIComponent(shareUrl);
      img.addEventListener('load', function () {
        if (popover && popoverAnchor) {
          positionSharePopup(popover, popoverAnchor, 20);
        }
      });

      const hint = document.createElement('p');
      hint.className = 'md-page-share__popover-hint';
      hint.textContent = wechatHint;

      popover.appendChild(title);
      popover.appendChild(img);
      popover.appendChild(hint);
      document.body.appendChild(popover);
      positionSharePopup(popover, anchor, 20);
    }

    shareEl.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-share-action]');
      if (!btn) return;
      e.preventDefault();

      const action = btn.dataset.shareAction;
      if (action === 'copy') {
        copyShareUrl(btn);
      } else if (action === 'wechat') {
        if (popover) {
          closePopover();
        } else {
          openWechatPopover(btn);
        }
      }
    });

    document.addEventListener('click', function (e) {
      if (!popover) return;
      if (e.target.closest('.md-page-share__popover') || e.target.closest('[data-share-action="wechat"]')) return;
      closePopover();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePopover();
    });

    window.addEventListener('scroll', function () {
      if (popover && popoverAnchor) {
        positionSharePopup(popover, popoverAnchor, 20);
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (popover && popoverAnchor) {
        positionSharePopup(popover, popoverAnchor, 20);
      }
    });
  }

  const style = document.createElement('style');
  style.textContent = '.md-header__topic--hidden{opacity:0;}';
  document.head.appendChild(style);
})();
