import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import nunjucks from 'nunjucks'
import type { Config } from './config.js'
import { collectFiles } from './files.js'
import { buildNavigation, setActivePage } from './nav.js'
import type { NavPage } from './nav.js'
import { initMarkdown, renderMarkdown } from './markdown.js'
import { parseAuthorRegistry, resolvePageAuthors, shouldShowPageAuthors } from './authors.js'
import { resolveEditUrl } from './frontmatter.js'
import {
  resolveDocumentTitle,
  resolvePageAuthor,
  resolvePageHtmlMetaTags,
} from './html-meta.js'
import { buildMetaBarItems } from './page-meta.js'
import {
  aggregateTags,
  buildTagCloudData,
  getTagsPluginConfig,
  hasTagsPlugin,
  resolvePageTags,
  shouldShowPageTags,
  type TagEntry,
  type TagIndex,
} from './tags.js'
import {
  computeReadingTime,
  injectAfterFirstH1,
  isReadingTimeEnabled,
  resolveReadingTimeConfig,
} from './reading-time.js'
import { resolveLicenseConfig, resolvePageLicense, buildCanonicalPageUrl, formatLicenseDate, resolveLicenseAuthor } from './license.js'
import { loadPage } from './page.js'
import type { Page } from './page.js'
import { loadPlugins } from './plugins.js'
import { buildSearchIndex, writeSearchIndex } from './search.js'
import { ensureDir, walkDir, log, success, joinUrl, formatCopyright, resolveSiteRootBaseUrl } from './utils.js'
import { buildFeatureContext, getTabItems, getSidebarNav, getFeatures } from './features.js'
import type { FeatureContext } from './features.js'
import { rewriteContentImages } from './content-images.js'
import { getI18n } from './i18n.js'
import { getIconStylesheets, createIconService, buildThemeIcons } from './icons.js'
import { buildShareItems } from './share.js'
import { parseRepoSource, buildRepoSourceIcons, fetchRepoStats } from './github.js'
import type { RepoStats } from './github.js'
import { buildPaletteStyles, resolveColor } from './palette.js'
import { buildAdmonitionTypesStyles } from './admonition-types.js'
import { copyExtraAssets, resolveExtraScripts, resolveExtraStylesheets } from './extra-assets.js'
import { resolveMathConfig } from './md/arithmatex.js'
import { resolveMermaidConfig } from './md/mermaid.js'
import { resolveCommentsConfig } from './comments.js'
import {
  buildAlternateMap,
  getI18nConfig,
  getPageAlternates,
  getSiteAlternates,
  hasI18nPlugin,
  prefixNavConfig,
  setBuildLocale,
} from './plugins/i18n.js'
import { canonicalPageKey, isSharedAsset } from './files.js'

let nunjucksEnv: nunjucks.Environment | null = null

export function initNunjucks(config: Config, templatesDir: string): nunjucks.Environment {
  const dirs = [templatesDir]
  if (config.theme.custom_dir) {
    dirs.unshift(config.theme.custom_dir)
  }

  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(dirs, { noCache: true }),
    { autoescape: true, trimBlocks: true, lstripBlocks: true },
  )

  env.addFilter('url', (path: string) => path)
  env.addFilter('tojson', (val: unknown) => JSON.stringify(val))
  env.addGlobal('range', (n: number) => Array.from({ length: n }, (_, i) => i))
  env.addGlobal('feature', (name: string, ctx: { feature?: { has?: Record<string, boolean> } }) =>
    ctx.feature?.has?.[name] ?? false,
  )

  return env
}

export async function build(config: Config): Promise<Page[]> {
  log(`Building documentation: ${config.site_name}`)

  const themeModule = await import('ts-mkdocs-theme-material')
  const templatesDir: string = themeModule.templatesDir
  const assetsDir: string = themeModule.assetsDir

  const plugins = await loadPlugins(config)
  let resolvedConfig = await plugins.runOnConfig(config)

  await initMarkdown(resolvedConfig)
  nunjucksEnv = initNunjucks(resolvedConfig, templatesDir)

  ensureDir(resolvedConfig.site_dir)

  const repoSource = resolvedConfig.repo_url
    ? parseRepoSource(resolvedConfig.repo_url, resolvedConfig.repo_name)
    : undefined
  const repoStats = await fetchRepoStats(repoSource, resolvedConfig.repo_token)

  const allFiles = collectFiles(resolvedConfig)
  const i18nConfig = getI18nConfig()
  const useI18n = hasI18nPlugin(resolvedConfig) && i18nConfig

  if (useI18n) {
    buildAlternateMap(allFiles, i18nConfig, resolvedConfig.use_directory_urls)
  }

  const allPages: Page[] = []
  const locales = useI18n ? i18nConfig.languages.map((l) => l.locale) : [null]
  let sharedAssetsCopied = false

  for (const locale of locales) {
    if (locale) setBuildLocale(locale)

    const localeConfig = locale
      ? { ...resolvedConfig, theme: { ...resolvedConfig.theme, language: locale } }
      : resolvedConfig

    const localeNav = locale
      ? prefixNavConfig(resolvedConfig.nav, locale)
      : resolvedConfig.nav

    let files = useI18n ? allFiles : collectFiles(resolvedConfig)
    files = await plugins.runOnFiles(files, localeConfig)

    let nav = buildNavigation({ ...localeConfig, nav: localeNav as typeof localeConfig.nav }, files)
    nav = await plugins.runOnNav(nav, localeConfig)

    const pages: Page[] = []

    for (const file of files) {
      if (!file.isMarkdown) {
        const isShared = useI18n && isSharedAsset(file.srcUri, i18nConfig!.locales)
        if (isShared && sharedAssetsCopied) continue
        ensureDir(dirname(file.destPath))
        copyFileSync(file.srcPath, file.destPath)
        if (isShared) sharedAssetsCopied = true
        continue
      }

      log(`Building page: ${file.srcUri}`)
      let page = loadPage(file, {
        docsDir: localeConfig.docs_dir,
        language: localeConfig.theme.language,
        inheritMeta: hasMetaPlugin(localeConfig),
      })

      const navPage = nav.pages.find((p) => p.file.srcUri === file.srcUri)
      if (navPage && !page.title && navPage.title) page.title = navPage.title

      page.rawMarkdown = await plugins.runOnPageMarkdown(page.rawMarkdown, page, localeConfig)
      const rendered = renderMarkdown(page.rawMarkdown)
      page.content = await plugins.runOnPageContent(rendered.html, page, localeConfig)
      page.toc = rendered.toc

      pages.push(page)
    }

    const tagsEnabled = hasTagsPlugin(localeConfig)
    const tagsConfig = getTagsPluginConfig(localeConfig)
    const tagIndex = tagsEnabled
      ? aggregateTags(pages, locale ? `${locale}/` : './', { sort_by: tagsConfig.sort_by })
      : null

    for (const page of pages) {
      const navPage = nav.pages.find((p) => p.file.srcUri === page.file.srcUri)
      if (navPage) setActivePage(nav, navPage)

      const html = renderPage(localeConfig, page, nav, navPage, repoStats, tagsEnabled, locale ?? undefined)
      ensureDir(dirname(page.file.destPath))
      writeFileSync(page.file.destPath, html, 'utf-8')
    }

    if (tagsEnabled && tagIndex) {
      generateTagPages(localeConfig, tagIndex, nav, repoStats, locale ?? undefined)
    }

    const searchEnabled = localeConfig.plugins.some((p) =>
      p === 'search' || (typeof p === 'object' && 'search' in p),
    )
    if (searchEnabled) {
      const searchIndex = buildSearchIndex(pages, localeConfig)
      writeSearchIndex(searchIndex, localeConfig.site_dir, locale ?? undefined)
    }

    if (locale) {
      try {
        const html404 = nunjucksEnv!.render('404.html', build404Context(localeConfig, repoStats, locale))
        const notFoundPath = join(localeConfig.site_dir, locale, '404.html')
        ensureDir(dirname(notFoundPath))
        writeFileSync(notFoundPath, html404, 'utf-8')
      } catch {}
    }

    allPages.push(...pages)
    if (useI18n) setBuildLocale(null)
  }

  copyThemeAssets(assetsDir, resolvedConfig.site_dir)
  writeSiteBootstrap(resolvedConfig, repoStats, useI18n ? i18nConfig : null)

  await syncStaticAssets(resolvedConfig)

  if (!useI18n) {
    try {
      const html404 = nunjucksEnv!.render('404.html', build404Context(resolvedConfig, repoStats))
      writeFileSync(join(resolvedConfig.site_dir, '404.html'), html404)
    } catch {}
  }

  await plugins.runOnPostBuild(resolvedConfig)

  success(`Site built to: ${resolvedConfig.site_dir}`)
  return allPages
}

/** Copy theme and extra static assets without rebuilding pages. */
export async function syncStaticAssets(config: Config): Promise<void> {
  const themeModule = await import('ts-mkdocs-theme-material')
  copyThemeAssets(themeModule.assetsDir, config.site_dir)
  copyExtraAssets(config)
}

function hasMetaPlugin(config: Config): boolean {
  return config.plugins.some((entry) => {
    const name = typeof entry === 'string' ? entry : Object.keys(entry)[0]
    return name === 'meta'
  })
}

function computeBaseUrl(destUri: string): string {
  const depth = destUri.split('/').length - 1
  return depth === 0 ? './' : '../'.repeat(depth)
}

function isHomePage(page: Page): boolean {
  if (page.meta.template === 'home') return true
  const uri = page.file.canonicalUri ?? page.file.srcUri
  return uri === 'index.md' || uri === 'README.md'
}

function firstDocUrl(navItems: NavItem[]): string | undefined {
  for (const item of navItems) {
    if (item.type === 'page' && item.url && item.url !== './' && item.url !== '') {
      return item.url
    }
    if (item.type === 'section' && item.children?.length) {
      const found = firstDocUrl(item.children)
      if (found) return found
    }
  }
  return undefined
}

type NavItem = { type: string; url?: string; children?: NavItem[] }

function rewriteDocLinks(html: string, useDirectoryUrls: boolean): string {
  return html.replace(/href="([^"#?]+\.md)([#?][^"]*)?">/g, (_, mdPath, suffix = '') => {
    const base = mdPath.slice(0, -3)
    const url = useDirectoryUrls ? base + '/' : base + '.html'
    return `href="${url}${suffix}">`
  })
}

function buildEditUrl(
  config: Config,
  srcUri: string,
  meta: Page['meta'],
): string | undefined {
  return resolveEditUrl(config, srcUri, meta)
}

function shouldShowFooterNav(feature: FeatureContext, page: Page): boolean {
  if (feature.features.length > 0 && !feature.has['navigation.footer']) return false
  const hide = page.meta.hide
  return !(Array.isArray(hide) && hide.includes('footer'))
}

function buildFooterPageRef(
  navPage: NavPage | undefined,
  baseUrl: string,
): { title: string; url: string } | undefined {
  if (!navPage) return undefined
  return { title: navPage.title, url: joinUrl(baseUrl, navPage.url) }
}

function renderPage(
  config: Config,
  page: Page,
  nav: { items: NavItem[] },
  navPage: NavPage | undefined,
  repoStats?: RepoStats,
  tagsEnabled = false,
  locale?: string,
): string {
  const baseUrl = computeBaseUrl(page.file.destUri)
  const isHome = isHomePage(page)
  const feature = buildFeatureContext(config)
  const i18n = getI18n(config.theme.language)
  const showFooterNav = shouldShowFooterNav(feature, page)

  const rewrittenContent = rewriteContentImages(
    rewriteDocLinks(page.content, config.use_directory_urls),
    page.file.srcUri,
    page.file.destUri,
    { lightbox: feature.has['content.image.lightbox'] },
  )
  const toc = feature.toc_integrate ? [] : page.toc
  const navToc = feature.toc_integrate ? page.toc : []

  const icons = createIconService(config)
  const readingTimeConfig = resolveReadingTimeConfig(config.extra)
  const licenseConfig = resolveLicenseConfig(config.extra)
  const authorAvatarIconHtml = icons.renderRef('material/account_circle')
  const readtimeOverride =
    typeof page.meta.readtime === 'number' ? page.meta.readtime : undefined
  const readtimeResult =
    isReadingTimeEnabled(readingTimeConfig, page.meta) &&
    !page.meta.hide?.includes('readtime') &&
    !page.meta.hide?.includes('meta')
      ? computeReadingTime(
          page.rawMarkdown,
          readingTimeConfig,
          config.theme.language,
          readtimeOverride,
        )
      : undefined

  if (readtimeResult) {
    page.meta.readtime = readtimeResult.minutes
    page.meta.readtime_formatted = readtimeResult.formatted
  }

  const metaBarItems = buildMetaBarItems(page.meta, i18n, {
    dateIconHtml: icons.renderRef('material/calendar_today'),
    updatedIconHtml: icons.renderRef('material/update'),
    groupIconHtml: icons.renderRef('material/folder-outline'),
    readtimeIconHtml: icons.renderRef('material/schedule'),
    readtimeFormatted: readtimeResult?.formatted,
  })

  const authorRegistry = parseAuthorRegistry(config.extra)
  const pageAuthors = shouldShowPageAuthors(page.meta.authors, page.meta.hide)
    ? resolvePageAuthors(page.meta.authors, authorRegistry, baseUrl, icons.renderRef.bind(icons))
    : []

  let content = rewrittenContent
  if (!isHome) {
    let injection = ''
    if (metaBarItems.length > 0) {
      injection += nunjucksEnv!.render('partials/page-meta-bar.html', {
        items: metaBarItems,
      })
    }
    if (pageAuthors.length > 0) {
      injection += nunjucksEnv!.render('partials/page-authors.html', {
        authors: pageAuthors,
        i18n,
        avatar_icon_html: authorAvatarIconHtml,
      })
    }
    if (injection) {
      content = injectAfterFirstH1(content, injection)
    }
  }

  const resolvedTags =
    tagsEnabled && shouldShowPageTags(page.meta)
      ? resolvePageTags(page.meta.tags, baseUrl)
      : []

  const pageLicense = resolvePageLicense(
    licenseConfig,
    page.meta,
    i18n,
    {
      title: page.title,
      pageUrl: buildCanonicalPageUrl(config.site_url, page.file.url),
      author: resolveLicenseAuthor(page.meta, authorRegistry, licenseConfig, config.site_author),
      date: formatLicenseDate(page.meta.date),
    },
  )

  const sharePageUrl = buildCanonicalPageUrl(config.site_url, page.file.url) ?? page.file.url
  const shareItems = buildShareItems(
    config.theme.share?.platforms,
    config.theme.share?.enabled,
    sharePageUrl,
    page.title,
    i18n,
    icons,
    page.file.url.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'page',
  )

  const documentTitle = resolveDocumentTitle({
    siteName: config.site_name,
    pageTitle: page.title,
    metaTitle: typeof page.meta.title === 'string' ? page.meta.title : undefined,
    isHomepage: isHome,
  })

  const canonicalKey = page.file.canonicalUri
    ? canonicalPageKey(page.file.canonicalUri, config.use_directory_urls)
    : canonicalPageKey(page.file.srcUri, config.use_directory_urls)

  const alternates = locale
    ? getPageAlternates(canonicalKey, locale, config.site_url)
    : []

  const ctx = {
    ...buildBaseContext(config, baseUrl, repoStats, locale, alternates),
    feature,
    i18n,
    page: {
      ...page,
      content,
      url: page.file.url,
      edit_url: buildEditUrl(config, page.file.srcUri, page.meta),
      prev_page: showFooterNav ? buildFooterPageRef(navPage?.prev, baseUrl) : undefined,
      next_page: showFooterNav ? buildFooterPageRef(navPage?.next, baseUrl) : undefined,
      is_homepage: isHome,
      resolved_tags: resolvedTags,
      tags_enabled: tagsEnabled,
      license: pageLicense,
    },
    share_items: shareItems,
    share_page_url: sharePageUrl,
    nav: nav.items,
    sidebar_nav: getSidebarNav(
      nav.items,
      navPage?.file.url,
      feature.has['navigation.tabs'],
    ),
    nav_toc: navToc,
    toc,
    tab_items: getTabItems(nav.items),
    first_doc_url: isHome ? firstDocUrl(nav.items) : undefined,
    document_title: documentTitle,
    og_title: documentTitle,
    og_description: (typeof page.meta.description === 'string' ? page.meta.description : '') || config.site_description || '',
    og_image: resolveOgImage(
      (typeof page.meta.image === 'string' ? page.meta.image : undefined) ?? config.site_image,
      config.site_url,
    ),
    html_meta_tags: resolvePageHtmlMetaTags(page.meta),
    page_author: resolvePageAuthor(page.meta, config.site_author),
    page_canonical: canonicalKey,
    alternates,
    current_locale: locale ?? null,
  }

  const template = isHome ? 'home.html' : 'main.html'
  return nunjucksEnv!.render(template, ctx)
}

function buildSocialLinks(config: Config, baseUrl: string): Array<{ href: string; icon_html: string; label: string }> {
  const social = config.extra?.social
  if (!Array.isArray(social)) return []

  const icons = createIconService(config)
  return social
    .filter((item): item is Record<string, string> => !!item && typeof item === 'object')
    .map((item) => {
      const rawUrl = item.link ?? item.url ?? ''
      const href = rawUrl.includes('://') ? rawUrl : baseUrl + rawUrl.replace(/^\//, '')
      const iconRef = item.icon ?? 'material/link'
      const label =
        item.name ??
        item.label ??
        iconRef.split('/').pop()?.replace(/-/g, ' ') ??
        'Link'
      return { href, icon_html: icons.renderRef(iconRef), label }
    })
    .filter((item) => item.href.length > 0)
}

function resolveDefaultPaletteColor(config: Config): string {
  const palette = config.theme.palette
  if (!palette) return '#3f51b5'
  if (Array.isArray(palette)) {
    const first = palette.find((e) => (e.scheme ?? 'default') !== 'slate') ?? palette[0]
    return resolveColor(first?.primary, '#3f51b5')
  }
  return resolveColor((palette as { primary?: string }).primary, '#3f51b5')
}

function buildSettingsConfig(config: Config): Record<string, unknown> {
  const themeSettings = config.theme.settings
  const defaultColor = resolveDefaultPaletteColor(config)
  const i18n = getI18n(config.theme.language)
  const lang = config.theme.language.split('-')[0].toLowerCase()

  const defaultColors = [
    { name: 'Indigo', color: '#3f51b5' },
    { name: 'Blue', color: '#2196f3' },
    { name: 'Teal', color: '#009688' },
    { name: 'Green', color: '#4caf50' },
    { name: 'Purple', color: '#9c27b0' },
    { name: 'Red', color: '#ef5350' },
    { name: 'Deep Orange', color: '#ff5722' },
    { name: 'Brown', color: '#795548' },
  ]

  const defaultFonts =
    lang === 'zh'
      ? [
          { name: '系统字体' },
          {
            name: 'Serif',
            family: '"Noto Serif SC", "Noto Serif", Georgia, serif',
            url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
          },
          { name: 'Mono', family: '"JetBrains Mono", "Fira Code", monospace' },
          {
            name: '圆体',
            family: '"Nunito", "Varela Round", sans-serif',
            url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
          },
        ]
      : [
          { name: 'System' },
          {
            name: 'Serif',
            family: '"Noto Serif", Georgia, serif',
            url: 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&display=swap',
          },
          { name: 'Mono', family: '"JetBrains Mono", "Fira Code", monospace' },
          {
            name: 'Rounded',
            family: '"Nunito", "Varela Round", sans-serif',
            url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap',
          },
        ]

  const defaultFontSizes = [
    { name: i18n['settings.size.small'], value: 90 },
    { name: i18n['settings.size.default'], value: 115 },
    { name: i18n['settings.size.large'], value: 135 },
    { name: i18n['settings.size.xlarge'], value: 160 },
  ]

  const fontSizes = themeSettings?.font_sizes ?? defaultFontSizes
  const defaultFontSize =
    themeSettings?.default_font_size ??
    fontSizes.find((s) => s.value === 115)?.value ??
    fontSizes[Math.min(1, fontSizes.length - 1)]?.value ??
    115

  return {
    enabled: themeSettings?.enabled ?? true,
    default_color: defaultColor,
    default_font_size: defaultFontSize,
    colors: themeSettings?.colors ?? defaultColors,
    fonts: themeSettings?.fonts ?? defaultFonts,
    font_sizes: fontSizes,
  }
}

function resolveOgImage(imageRaw: string | undefined, siteUrl?: string): string | undefined {
  if (!imageRaw) return undefined
  if (/^https?:\/\//.test(imageRaw)) return imageRaw
  if (siteUrl) return `${siteUrl}/${imageRaw.replace(/^\//, '')}`
  return imageRaw
}

function build404Context(
  config: Config,
  repoStats?: RepoStats,
  locale?: string,
): Record<string, unknown> {
  const baseUrl = locale ? '../' : resolveSiteRootBaseUrl(config.site_url)
  const feature = buildFeatureContext(config)
  const i18n = getI18n(config.theme.language)
  const icons = createIconService(config)
  const alternates = locale ? getSiteAlternates(config.site_url) : []

  return {
    ...buildBaseContext(config, baseUrl, repoStats, locale, alternates),
    feature,
    i18n,
    page: {
      title: i18n['404.title'],
      content: '',
      is_homepage: false,
      is_not_found: true,
    },
    not_found_icon_html: icons.renderRef('material/travel_explore'),
    home_icon_html: icons.renderRef('material/home'),
    search_icon_html: icons.renderRef('material/search'),
    nav_toc: [],
    toc: [],
    document_title: resolveDocumentTitle({
      siteName: config.site_name,
      pageTitle: i18n['404.title'],
    }),
    og_title: resolveDocumentTitle({
      siteName: config.site_name,
      pageTitle: `404 - ${i18n['404.title']}`,
    }),
    og_description: config.site_description ?? '',
    og_image: resolveOgImage(config.site_image, config.site_url),
    html_meta_tags: [],
    current_locale: locale ?? null,
    alternates,
  }
}

function buildBaseContext(
  config: Config,
  baseUrl = './',
  repoStats?: RepoStats,
  locale?: string,
  alternates: ReturnType<typeof getPageAlternates> = [],
): Record<string, unknown> {
  const feature = buildFeatureContext(config)
  const i18n = getI18n(config.theme.language)
  const icons = createIconService(config)
  const repo_source = config.repo_url
    ? parseRepoSource(config.repo_url, config.repo_name)
    : undefined
  return {
    config,
    base_url: baseUrl,
    extra: config.extra ?? {},
    feature,
    i18n,
    icon_stylesheets: getIconStylesheets(config),
    social_links: buildSocialLinks(config, baseUrl),
    copyright_html: config.copyright ? formatCopyright(config.copyright) : undefined,
    repo_source,
    repo_source_icons: buildRepoSourceIcons(icons.renderRef.bind(icons), repo_source),
    repo_source_facts: repo_source ? repoStats : undefined,
    theme_icons: buildThemeIcons(config, icons.renderRef.bind(icons)),
    versions: config.extra?.version?.provider ? config.extra.version : null,
    math: resolveMathConfig(config),
    mermaid: resolveMermaidConfig(config),
    comments: resolveCommentsConfig(config),
    settings_config: buildSettingsConfig(config),
    extra_stylesheets: resolveExtraStylesheets(config, baseUrl),
    extra_scripts: resolveExtraScripts(config, baseUrl),
    document_title: config.site_name,
    html_meta_tags: [],
    og_title: config.site_name,
    og_description: config.site_description ?? '',
    og_image: resolveOgImage(config.site_image, config.site_url),
    current_locale: locale ?? null,
    alternates,
    i18n_languages: getI18nConfig()?.languages ?? null,
  }
}

function copyThemeAssets(assetsDir: string, siteDir: string): void {
  if (!existsSync(assetsDir)) return
  const dest = join(siteDir, 'assets')
  ensureDir(dest)

  for (const src of walkDir(assetsDir)) {
    const rel = relative(assetsDir, src)
    const destFile = join(dest, rel)
    ensureDir(dirname(destFile))
    copyFileSync(src, destFile)
  }
}

function writeSiteBootstrap(
  config: Config,
  repoStats?: RepoStats,
  i18nConfig?: ReturnType<typeof getI18nConfig> | null,
): void {
  const paletteCss = buildPaletteStyles(config)
  if (paletteCss) {
    const palettePath = join(config.site_dir, 'assets/css/palette.css')
    ensureDir(dirname(palettePath))
    writeFileSync(palettePath, paletteCss, 'utf-8')
  }

  const admonitionTypesCss = buildAdmonitionTypesStyles(config)
  if (admonitionTypesCss) {
    const admonitionTypesPath = join(config.site_dir, 'assets/css/admonition-types.css')
    ensureDir(dirname(admonitionTypesPath))
    writeFileSync(admonitionTypesPath, admonitionTypesCss, 'utf-8')
  }

  const repoSource = config.repo_url
    ? parseRepoSource(config.repo_url, config.repo_name)
    : undefined

  const mermaid = resolveMermaidConfig(config)
  const payload: Record<string, unknown> = {
    features: [...getFeatures(config)],
    i18n: getI18n(config.theme.language),
    repoSource: repoSource ?? null,
    repoSourceFacts: repoSource ? (repoStats ?? null) : null,
    settings: buildSettingsConfig(config),
    mermaid: mermaid?.enabled ? mermaid : null,
  }

  if (i18nConfig) {
    payload.i18nLocales = i18nConfig.languages.map((l) => ({
      locale: l.locale,
      name: l.name,
    }))
    payload.defaultLocale = i18nConfig.defaultLanguage
  }

  const configPath = join(config.site_dir, 'assets/js/ts-mkdocs-config.js')
  ensureDir(dirname(configPath))
  writeFileSync(configPath, `window.__TS_MKDOCS__=${JSON.stringify(payload)};\n`, 'utf-8')
}

function generateTagPages(
  config: Config,
  tagIndex: TagIndex,
  nav: { items: NavItem[] },
  repoStats?: RepoStats,
  locale?: string,
): void {
  const feature = buildFeatureContext(config)
  const i18n = getI18n(config.theme.language)

  const indexBaseUrl = locale ? '../../' : '../'
  const tagIndexTitle = i18n['tags.title']
  const tagIndexDocumentTitle = resolveDocumentTitle({
    siteName: config.site_name,
    pageTitle: tagIndexTitle,
  })
  const tagsPrefix = locale ? `${locale}/tags/` : 'tags/'
  const indexCtx = {
    ...buildBaseContext(config, indexBaseUrl, repoStats, locale),
    feature,
    i18n,
    page: {
      title: tagIndexTitle,
      meta: { description: i18n['tags.description'] },
      url: tagsPrefix,
      is_homepage: false,
      is_tags_index: true,
    },
    tag_index: tagIndex,
    tag_cloud_tags: buildTagCloudData(tagIndex),
    nav: nav.items,
    sidebar_nav: [],
    nav_toc: [],
    toc: [],
    tab_items: getTabItems(nav.items),
    document_title: tagIndexDocumentTitle,
    og_title: tagIndexDocumentTitle,
    og_description: i18n['tags.description'],
  }

  const indexPath = join(config.site_dir, ...(locale ? [locale] : []), 'tags', 'index.html')
  ensureDir(dirname(indexPath))
  writeFileSync(indexPath, nunjucksEnv!.render('tags-index.html', indexCtx), 'utf-8')

  for (const tag of tagIndex.tags) {
    renderTagArchivePage(config, tag, nav, repoStats, feature, i18n, locale)
  }
}

function renderTagArchivePage(
  config: Config,
  tag: TagEntry,
  nav: { items: NavItem[] },
  repoStats: RepoStats | undefined,
  feature: FeatureContext,
  i18n: ReturnType<typeof getI18n>,
  locale?: string,
): void {
  const baseUrl = locale ? '../../../' : '../../'
  const tagsPrefix = locale ? `${locale}/tags/` : 'tags/'
  const archiveDocumentTitle = resolveDocumentTitle({
    siteName: config.site_name,
    pageTitle: tag.name,
  })
  const ctx = {
    ...buildBaseContext(config, baseUrl, repoStats, locale),
    feature,
    i18n,
    page: {
      title: tag.name,
      meta: {},
      url: `${tagsPrefix}${tag.slug}/`,
      is_homepage: false,
      is_tags_archive: true,
    },
    tag,
    nav: nav.items,
    sidebar_nav: [],
    nav_toc: [],
    toc: [],
    tab_items: getTabItems(nav.items),
    document_title: archiveDocumentTitle,
    og_title: archiveDocumentTitle,
  }

  const archivePath = join(config.site_dir, ...(locale ? [locale] : []), 'tags', tag.slug, 'index.html')
  ensureDir(dirname(archivePath))
  writeFileSync(archivePath, nunjucksEnv!.render('tags-archive.html', ctx), 'utf-8')
}
