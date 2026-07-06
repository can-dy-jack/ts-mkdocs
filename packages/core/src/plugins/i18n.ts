import { join } from 'path'
import { writeFileSync } from 'fs'
import type { Config } from '../config.js'
import type { DocFile } from '../files.js'
import {
  canonicalPageKey,
  isSharedAsset,
  stripLocalePrefix,
} from '../files.js'
import type { Navigation, NavItem } from '../nav.js'
import type { Plugin } from '../plugins.js'
import { ensureDir, log, warn } from '../utils.js'

export interface I18nLanguage {
  locale: string
  name: string
  build?: boolean
}

export interface I18nPluginOptions {
  default_language?: string
  languages?: I18nLanguage[] | Record<string, string>
  fallback_to_default?: boolean
  redirect_default?: boolean
  nav_translations?: Record<string, Record<string, string>>
}

export interface ResolvedI18nConfig {
  defaultLanguage: string
  languages: I18nLanguage[]
  locales: string[]
  fallbackToDefault: boolean
  redirectDefault: boolean
  navTranslations: Record<string, Record<string, string>>
}

export interface AlternateLink {
  name: string
  /** Site-root path for navigation, e.g. `/en/tutorial/foo/`. */
  link: string
  /** Full URL for hreflang meta tags when `site_url` is set. */
  hreflang?: string
  lang: string
  active: boolean
}

interface AlternateEntry {
  name: string
  lang: string
  url: string
}

let resolvedConfig: ResolvedI18nConfig | null = null
let currentLocale: string | null = null
const alternateMap = new Map<string, Record<string, AlternateEntry>>()

function parseLanguages(raw: I18nPluginOptions['languages']): I18nLanguage[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((entry) => ({
      locale: entry.locale,
      name: entry.name,
      build: entry.build ?? true,
    }))
  }
  return Object.entries(raw).map(([locale, name]) => ({
    locale,
    name: String(name),
    build: true,
  }))
}

function resolvePluginConfig(options: I18nPluginOptions): ResolvedI18nConfig {
  const languages = parseLanguages(options.languages).filter((l) => l.build !== false)
  if (languages.length === 0) {
    throw new Error('i18n plugin: at least one language with build: true is required')
  }

  const locales = languages.map((l) => l.locale)
  const defaultLanguage =
    options.default_language && locales.includes(options.default_language)
      ? options.default_language
      : languages[0].locale

  return {
    defaultLanguage,
    languages,
    locales,
    fallbackToDefault: options.fallback_to_default ?? true,
    redirectDefault: options.redirect_default ?? true,
    navTranslations: options.nav_translations ?? {},
  }
}

export function isI18nEnabled(): boolean {
  return resolvedConfig !== null
}

export function getI18nConfig(): ResolvedI18nConfig | null {
  return resolvedConfig
}

export function setBuildLocale(locale: string | null): void {
  currentLocale = locale
}

export function getBuildLocale(): string | null {
  return currentLocale
}

export function hasI18nPlugin(config: Config): boolean {
  return config.plugins.some((entry) => {
    const name = typeof entry === 'string' ? entry : Object.keys(entry)[0]
    return name === 'i18n'
  })
}

/** Build global alternate URL map from all collected files. */
export function buildAlternateMap(
  files: DocFile[],
  i18n: ResolvedI18nConfig,
  useDirectoryUrls: boolean,
): void {
  alternateMap.clear()

  for (const file of files) {
    if (!file.isMarkdown) continue
    const { locale, path } = stripLocalePrefix(file.srcUri, i18n.locales)
    if (!locale || !path) continue

    const key = canonicalPageKey(path, useDirectoryUrls)
    const lang = i18n.languages.find((l) => l.locale === locale)
    if (!lang) continue

    const bucket = alternateMap.get(key) ?? {}
    bucket[locale] = { name: lang.name, lang: locale, url: file.url }
    alternateMap.set(key, bucket)
  }
}

export function getPageAlternates(
  canonicalKey: string,
  locale: string,
  siteUrl?: string,
): AlternateLink[] {
  if (!resolvedConfig) return []

  const bucket = alternateMap.get(canonicalKey) ?? {}
  const links: AlternateLink[] = []

  for (const lang of resolvedConfig.languages) {
    const entry = bucket[lang.locale]
    if (entry) {
      links.push({
        name: entry.name,
        lang: entry.lang,
        link: resolveSiteLink(entry.url),
        hreflang: resolveHreflangLink(entry.url, siteUrl),
        active: lang.locale === locale,
      })
      continue
    }

    if (resolvedConfig.fallbackToDefault && lang.locale !== locale) {
      const fallback = bucket[resolvedConfig.defaultLanguage]
      if (fallback) {
        const fallbackUrl = swapLocaleInUrl(
          fallback.url,
          lang.locale,
          resolvedConfig.defaultLanguage,
        )
        links.push({
          name: lang.name,
          lang: lang.locale,
          link: resolveSiteLink(fallbackUrl),
          hreflang: resolveHreflangLink(fallbackUrl, siteUrl),
          active: false,
        })
      }
    }
  }

  return links
}

export function getSiteAlternates(siteUrl?: string): AlternateLink[] {
  if (!resolvedConfig) return []
  return resolvedConfig.languages.map((lang) => ({
    name: lang.name,
    lang: lang.locale,
    link: resolveSiteLink(`${lang.locale}/`),
    hreflang: resolveHreflangLink(`${lang.locale}/`, siteUrl),
    active: lang.locale === currentLocale,
  }))
}

function swapLocaleInUrl(url: string, targetLocale: string, sourceLocale: string): string {
  if (url.startsWith(`${sourceLocale}/`)) {
    return `${targetLocale}/${url.slice(sourceLocale.length + 1)}`
  }
  if (url === `${sourceLocale}/`) return `${targetLocale}/`
  return url
}

/** Site-root absolute path for in-app navigation (works on any host). */
function resolveSiteLink(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url.startsWith('/') ? url : `/${url}`
}

/** Full URL for hreflang / SEO when site_url is configured. */
function resolveHreflangLink(url: string, siteUrl?: string): string | undefined {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (!siteUrl) return undefined
  const path = url.startsWith('/') ? url : `/${url}`
  return `${siteUrl.replace(/\/+$/, '')}${path}`
}

/** Prefix nav config paths with the current locale. */
export function prefixNavConfig(nav: unknown[] | undefined, locale: string): unknown[] | undefined {
  if (!nav) return nav
  return nav.map((entry) => prefixNavEntry(entry, locale))
}

function prefixNavEntry(entry: unknown, locale: string): unknown {
  if (typeof entry === 'string') {
    return `${locale}/${entry}`
  }
  if (entry && typeof entry === 'object') {
    const result: Record<string, unknown> = {}
    for (const [title, value] of Object.entries(entry)) {
      if (typeof value === 'string') {
        result[title] =
          value.startsWith('http://') || value.startsWith('https://')
            ? value
            : `${locale}/${value}`
      } else if (Array.isArray(value)) {
        result[title] = value.map((child) => prefixNavEntry(child, locale))
      } else {
        result[title] = value
      }
    }
    return result
  }
  return entry
}

function applyNavTranslations(items: NavItem[], locale: string): NavItem[] {
  const translations = resolvedConfig?.navTranslations[locale]
  if (!translations) return items

  return items.map((item) => {
    if (item.type === 'section') {
      const title = translations[item.title] ?? item.title
      return { ...item, title, children: applyNavTranslations(item.children, locale) }
    }
    if (item.type === 'page' || item.type === 'link') {
      const title = translations[item.title] ?? item.title
      return { ...item, title }
    }
    return item
  })
}

function filterFilesForLocale(
  files: DocFile[],
  locale: string,
  i18n: ResolvedI18nConfig,
): DocFile[] {
  return files
    .filter((file) => {
      if (isSharedAsset(file.srcUri, i18n.locales)) return true
      return file.srcUri.startsWith(`${locale}/`)
    })
    .map((file) => {
      if (isSharedAsset(file.srcUri, i18n.locales)) return file

      const { path } = stripLocalePrefix(file.srcUri, i18n.locales)
      return {
        ...file,
        locale,
        canonicalUri: path,
      }
    })
}

function warnMissingTranslations(i18n: ResolvedI18nConfig): void {
  const defaultBucket = new Map<string, string[]>()
  for (const [key, entries] of alternateMap) {
    if (entries[i18n.defaultLanguage]) {
      defaultBucket.set(key, Object.keys(entries))
    }
  }

  for (const lang of i18n.languages) {
    if (lang.locale === i18n.defaultLanguage) continue
    for (const [key] of defaultBucket) {
      const entries = alternateMap.get(key)
      if (entries && !entries[lang.locale]) {
        warn(`Missing ${lang.locale} translation for: ${key}`)
      }
    }
  }
}

function writeDefaultRedirect(config: Config, i18n: ResolvedI18nConfig): void {
  if (!i18n.redirectDefault) return
  const target = `${i18n.defaultLanguage}/`
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><link rel="canonical" href="${target}"><script>location.replace("${target}")</script></head><body><p><a href="${target}">Redirecting…</a></p></body></html>\n`
  const indexPath = join(config.site_dir, 'index.html')
  ensureDir(config.site_dir)
  writeFileSync(indexPath, html, 'utf-8')
}

export const i18nPlugin: Plugin = {
  name: 'i18n',

  configure(options: Record<string, unknown>) {
    resolvedConfig = resolvePluginConfig(options as I18nPluginOptions)
  },

  on_config(config) {
    if (!resolvedConfig) return config

    if (config.theme.features?.includes('navigation.instant')) {
      warn('i18n plugin: navigation.instant is incompatible with the language switcher')
    }

    return config
  },

  on_files(files, config) {
    if (!resolvedConfig || !currentLocale) return files
    return filterFilesForLocale(files, currentLocale, resolvedConfig)
  },

  on_nav(nav, _config) {
    if (!resolvedConfig || !currentLocale) return nav
    return { ...nav, items: applyNavTranslations(nav.items, currentLocale) }
  },

  on_post_build(config) {
    if (!resolvedConfig) return
    warnMissingTranslations(resolvedConfig)
    writeDefaultRedirect(config, resolvedConfig)
  },
}

/** Reset module state (for tests). */
export function resetI18nState(): void {
  resolvedConfig = null
  currentLocale = null
  alternateMap.clear()
}
