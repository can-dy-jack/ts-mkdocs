import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs'
import { join, dirname, relative } from 'path'
import nunjucks from 'nunjucks'
import type { Config } from './config.js'
import { collectFiles } from './files.js'
import { buildNavigation, setActivePage } from './nav.js'
import type { NavPage } from './nav.js'
import { initMarkdown, renderMarkdown } from './markdown.js'
import { loadPage } from './page.js'
import type { Page } from './page.js'
import { loadPlugins } from './plugins.js'
import { buildSearchIndex, writeSearchIndex } from './search.js'
import { ensureDir, walkDir, log, success, joinUrl, formatCopyright } from './utils.js'
import { buildFeatureContext, getTabItems, getSidebarNav, getFeatures } from './features.js'
import type { FeatureContext } from './features.js'
import { getI18n } from './i18n.js'
import { getIconStylesheets, createIconService, buildThemeIcons } from './icons.js'
import { parseRepoSource, buildRepoSourceIcons, fetchRepoStats } from './github.js'
import type { RepoStats } from './github.js'
import { buildPaletteStyles } from './palette.js'
import { resolveMathConfig } from './md/arithmatex.js'

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

  let files = collectFiles(resolvedConfig)
  files = await plugins.runOnFiles(files, resolvedConfig)

  let nav = buildNavigation(resolvedConfig, files)
  nav = await plugins.runOnNav(nav, resolvedConfig)

  const pages: Page[] = []

  for (const file of files) {
    if (!file.isMarkdown) {
      ensureDir(dirname(file.destPath))
      copyFileSync(file.srcPath, file.destPath)
      continue
    }

    log(`Building page: ${file.srcUri}`)
    let page = loadPage(file)

    const navPage = nav.pages.find((p) => p.file.srcUri === file.srcUri)
    if (navPage && !page.title && navPage.title) page.title = navPage.title

    page.rawMarkdown = await plugins.runOnPageMarkdown(page.rawMarkdown, page, resolvedConfig)
    const rendered = renderMarkdown(page.rawMarkdown)
    page.content = await plugins.runOnPageContent(rendered.html, page, resolvedConfig)
    page.toc = rendered.toc

    pages.push(page)
  }

  for (const page of pages) {
    const navPage = nav.pages.find((p) => p.file.srcUri === page.file.srcUri)
    if (navPage) setActivePage(nav, navPage)

    const html = renderPage(resolvedConfig, page, nav, navPage, repoStats)
    ensureDir(dirname(page.file.destPath))
    writeFileSync(page.file.destPath, html, 'utf-8')
  }

  copyThemeAssets(assetsDir, resolvedConfig.site_dir)
  writeSiteBootstrap(resolvedConfig, repoStats)

  await syncStaticAssets(resolvedConfig)

  const searchEnabled = resolvedConfig.plugins.some((p) =>
    p === 'search' || (typeof p === 'object' && 'search' in p),
  )
  if (searchEnabled) {
    const searchIndex = buildSearchIndex(pages, resolvedConfig)
    writeSearchIndex(searchIndex, resolvedConfig.site_dir)
  }

  try {
    const html404 = nunjucksEnv!.render('404.html', buildBaseContext(resolvedConfig, './', repoStats))
    writeFileSync(join(resolvedConfig.site_dir, '404.html'), html404)
  } catch {}

  await plugins.runOnPostBuild(resolvedConfig)

  success(`Site built to: ${resolvedConfig.site_dir}`)
  return pages
}

/** Copy theme and extra static assets without rebuilding pages. */
export async function syncStaticAssets(config: Config): Promise<void> {
  const themeModule = await import('ts-mkdocs-theme-material')
  copyThemeAssets(themeModule.assetsDir, config.site_dir)

  for (const cssPath of config.extra_css) {
    const src = join(config.docs_dir, cssPath)
    if (existsSync(src)) {
      const dest = join(config.site_dir, cssPath)
      ensureDir(dirname(dest))
      copyFileSync(src, dest)
    }
  }

  for (const jsPath of config.extra_javascript) {
    const src = join(config.docs_dir, jsPath)
    if (existsSync(src)) {
      const dest = join(config.site_dir, jsPath)
      ensureDir(dirname(dest))
      copyFileSync(src, dest)
    }
  }
}

function computeBaseUrl(destUri: string): string {
  const depth = destUri.split('/').length - 1
  return depth === 0 ? './' : '../'.repeat(depth)
}

function isHomePage(page: Page): boolean {
  return (
    page.meta.template === 'home' ||
    page.file.srcUri === 'index.md' ||
    page.file.srcUri === 'README.md'
  )
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

function buildEditUrl(config: Config, srcUri: string): string | undefined {
  if (!config.repo_url) return undefined
  const editPath = config.edit_uri ?? 'edit/main/docs/'
  return `${config.repo_url}/${editPath.replace(/^\//, '')}${srcUri}`
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
): string {
  const baseUrl = computeBaseUrl(page.file.destUri)
  const isHome = isHomePage(page)
  const feature = buildFeatureContext(config)
  const i18n = getI18n(config.theme.language)
  const showFooterNav = shouldShowFooterNav(feature, page)

  const rewrittenContent = rewriteDocLinks(page.content, config.use_directory_urls)
  const toc = feature.toc_integrate ? [] : page.toc
  const navToc = feature.toc_integrate ? page.toc : []

  const ctx = {
    ...buildBaseContext(config, baseUrl, repoStats),
    feature,
    i18n,
    page: {
      ...page,
      content: rewrittenContent,
      url: page.file.url,
      edit_url: buildEditUrl(config, page.file.srcUri),
      prev_page: showFooterNav ? buildFooterPageRef(navPage?.prev, baseUrl) : undefined,
      next_page: showFooterNav ? buildFooterPageRef(navPage?.next, baseUrl) : undefined,
      is_homepage: isHome,
    },
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

function buildBaseContext(config: Config, baseUrl = './', repoStats?: RepoStats): Record<string, unknown> {
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

function writeSiteBootstrap(config: Config, repoStats?: RepoStats): void {
  const paletteCss = buildPaletteStyles(config)
  if (paletteCss) {
    const palettePath = join(config.site_dir, 'assets/css/palette.css')
    ensureDir(dirname(palettePath))
    writeFileSync(palettePath, paletteCss, 'utf-8')
  }

  const repoSource = config.repo_url
    ? parseRepoSource(config.repo_url, config.repo_name)
    : undefined

  const payload = {
    features: [...getFeatures(config)],
    i18n: getI18n(config.theme.language),
    repoSource: repoSource ?? null,
    repoSourceFacts: repoSource ? (repoStats ?? null) : null,
  }

  const configPath = join(config.site_dir, 'assets/js/ts-mkdocs-config.js')
  ensureDir(dirname(configPath))
  writeFileSync(configPath, `window.__TS_MKDOCS__=${JSON.stringify(payload)};\n`, 'utf-8')
}
