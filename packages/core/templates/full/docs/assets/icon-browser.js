(function () {
  const PAGE_SIZE = 120

  const LIBRARIES = {
    material: { label: 'Material', group: 'material' },
    'fa-solid': { label: 'FA Solid', group: 'fontawesome', style: 'solid' },
    'fa-regular': { label: 'FA Regular', group: 'fontawesome', style: 'regular' },
    'fa-brands': { label: 'FA Brands', group: 'fontawesome', style: 'brands' },
    bootstrap: { label: 'Bootstrap', group: 'bootstrap' },
  }

  const SOURCES = {
    material: 'https://cdn.jsdelivr.net/gh/google/material-design-icons@master/variablefont/MaterialSymbolsOutlined%5BFILL,GRAD,opsz,wght%5D.codepoints',
    fontawesomeMeta: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/metadata/icon-families.json',
    fontawesomeCss: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css',
    bootstrap: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.json',
  }

  /** @type {Record<string, { shortcode: string, search: string, library: string, style?: string, ligature?: string, cssName?: string }[]>} */
  const catalog = {}
  let activeLibrary = 'material'
  let query = ''
  let visibleCount = PAGE_SIZE
  let debounceTimer = 0

  const root = document.getElementById('icon-browser-app')
  if (!root) return

  const searchInput = root.querySelector('.icon-browser__search')
  const tabsEl = root.querySelector('.icon-browser__tabs')
  const metaEl = root.querySelector('.icon-browser__meta')
  const gridEl = root.querySelector('.icon-browser__grid')
  if (!searchInput || !tabsEl || !metaEl || !gridEl) return
  const toastEl = document.createElement('div')
  toastEl.className = 'icon-browser__toast'
  toastEl.setAttribute('role', 'status')
  document.body.appendChild(toastEl)

  function materialShortcode(name) {
    return `:material-${name.replace(/_/g, '-')}:`
  }

  function fontAwesomeShortcode(style, name) {
    return `:fontawesome-${style}-${name}:`
  }

  function bootstrapShortcode(name) {
    return `:bootstrap-${name}:`
  }

  function parseMaterial(text) {
    return text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const name = line.split(/\s+/)[0]
        return {
          shortcode: materialShortcode(name),
          search: name.replace(/_/g, ' '),
          library: 'material',
          ligature: name.replace(/-/g, '_'),
        }
      })
  }

  function parseBootstrap(json) {
    return Object.keys(json).map((name) => ({
      shortcode: bootstrapShortcode(name),
      search: name.replace(/-/g, ' '),
      library: 'bootstrap',
      cssName: name,
    }))
  }

  function parseFontAwesome(metaText, cssText) {
    /** @type {Record<string, string>} */
    const byUnicode = {}
    const re = /\.fa-([a-z0-9-]+):before\{content:"\\([0-9a-f]+)"/g
    let match
    while ((match = re.exec(cssText)) !== null) {
      byUnicode[match[2]] = match[1]
    }

    /** @type {Record<string, typeof catalog[string]>} */
    const grouped = { 'fa-solid': [], 'fa-regular': [], 'fa-brands': [] }

    const meta = JSON.parse(metaText)
    for (const entry of Object.values(meta)) {
      if (!entry || typeof entry !== 'object') continue
      const styles = entry.familyStylesByLicense?.free
      if (!styles?.length) continue
      const cssName = byUnicode[(entry.unicode || '').toLowerCase()]
      if (!cssName) continue
      const terms = entry.search?.terms?.join(' ') ?? ''
      const label = entry.label ?? cssName
      for (const { style } of styles) {
        const key = `fa-${style}`
        if (!grouped[key]) continue
        grouped[key].push({
          shortcode: fontAwesomeShortcode(style, cssName),
          search: `${cssName} ${label} ${terms}`.toLowerCase(),
          library: key,
          style,
          cssName,
        })
      }
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.cssName.localeCompare(b.cssName))
    }
    return grouped
  }

  function renderPreview(item) {
    if (item.library === 'material') {
      return `<span class="md-icon md-icon--material" aria-hidden="true"><span class="material-symbols-outlined">${item.ligature}</span></span>`
    }
    if (item.library.startsWith('fa-')) {
      const styleClass = item.style === 'brands' ? 'fa-brands' : item.style === 'regular' ? 'fa-regular' : 'fa-solid'
      return `<span class="md-icon md-icon--fontawesome" aria-hidden="true"><i class="${styleClass} fa-${item.cssName}"></i></span>`
    }
    return `<span class="md-icon md-icon--bootstrap" aria-hidden="true"><i class="bi bi-${item.cssName}"></i></span>`
  }

  function filteredItems() {
    const items = catalog[activeLibrary] ?? []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.search.toLowerCase().includes(q) || item.shortcode.includes(q))
  }

  function showToast(text) {
    toastEl.textContent = text
    toastEl.classList.add('is-visible')
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 1600)
  }

  async function copyShortcode(shortcode) {
    try {
      await navigator.clipboard.writeText(shortcode)
      showToast(`Copied ${shortcode}`)
    } catch {
      showToast('Copy failed')
    }
  }

  function renderGrid() {
    const items = filteredItems()
    const slice = items.slice(0, visibleCount)

    metaEl.textContent = query.trim()
      ? `${items.length} match${items.length === 1 ? '' : 'es'} · showing ${Math.min(slice.length, items.length)}`
      : `${items.length} icons · showing ${Math.min(slice.length, items.length)}`

    if (!catalog[activeLibrary]) {
      gridEl.innerHTML = '<div class="icon-browser__loading">Loading icons…</div>'
      return
    }

    if (items.length === 0) {
      gridEl.innerHTML = '<div class="icon-browser__empty">No icons match your search.</div>'
      return
    }

    gridEl.innerHTML = slice
      .map(
        (item) => `
      <button type="button" class="icon-browser__card" data-shortcode="${item.shortcode.replace(/"/g, '&quot;')}" title="Click to copy">
        <span class="icon-browser__preview">${renderPreview(item)}</span>
        <span class="icon-browser__name">${item.shortcode}</span>
      </button>`,
      )
      .join('')

    if (items.length > visibleCount) {
      const more = document.createElement('button')
      more.type = 'button'
      more.className = 'icon-browser__tab'
      more.style.gridColumn = '1 / -1'
      more.style.justifySelf = 'center'
      more.textContent = `Show ${Math.min(PAGE_SIZE, items.length - visibleCount)} more`
      more.addEventListener('click', () => {
        visibleCount += PAGE_SIZE
        renderGrid()
      })
      gridEl.appendChild(more)
    }
  }

  function buildTabs() {
    tabsEl.innerHTML = Object.entries(LIBRARIES)
      .map(
        ([key, lib]) =>
          `<button type="button" class="icon-browser__tab${key === activeLibrary ? ' is-active' : ''}" data-library="${key}">${lib.label}</button>`,
      )
      .join('')
  }

  async function loadCatalog() {
    metaEl.textContent = 'Loading icon metadata…'
    gridEl.innerHTML = '<div class="icon-browser__loading">Loading icons…</div>'

    const [materialText, faMeta, faCss, bootstrapJson] = await Promise.all([
      fetch(SOURCES.material).then((r) => r.text()),
      fetch(SOURCES.fontawesomeMeta).then((r) => r.text()),
      fetch(SOURCES.fontawesomeCss).then((r) => r.text()),
      fetch(SOURCES.bootstrap).then((r) => r.json()),
    ])

    catalog.material = parseMaterial(materialText)
    catalog.bootstrap = parseBootstrap(bootstrapJson)
    const faGroups = parseFontAwesome(faMeta, faCss)
    catalog['fa-solid'] = faGroups['fa-solid']
    catalog['fa-regular'] = faGroups['fa-regular']
    catalog['fa-brands'] = faGroups['fa-brands']

    visibleCount = PAGE_SIZE
    renderGrid()
  }

  tabsEl.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-library]')
    if (!btn) return
    activeLibrary = btn.dataset.library
    visibleCount = PAGE_SIZE
    buildTabs()
    renderGrid()
  })

  searchInput.addEventListener('input', () => {
    window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      query = searchInput.value
      visibleCount = PAGE_SIZE
      renderGrid()
    }, 180)
  })

  gridEl.addEventListener('click', (event) => {
    const card = event.target.closest('[data-shortcode]')
    if (!card) return
    copyShortcode(card.dataset.shortcode)
  })

  buildTabs()
  loadCatalog().catch(() => {
    metaEl.textContent = 'Failed to load icon metadata.'
    gridEl.innerHTML = '<div class="icon-browser__empty">Could not fetch icon lists. Check your network connection and reload.</div>'
  })
})()
