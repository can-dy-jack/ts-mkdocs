import type { AuthorDefinition } from './authors.js'
import type { PageMeta } from './frontmatter.js'
import type { I18nStrings } from './i18n.js'

export interface LicenseConfig {
  enabled?: boolean
  preset?: string
  /** Footer notice text override. */
  notice?: string
  /** @deprecated Use `notice` instead. */
  text?: string
  url?: string
  name?: string
  author?: string
  show_url?: boolean
  show_author?: boolean
  show_date?: boolean
}

export interface LicensePageContext {
  title: string
  pageUrl?: string
  author?: string
  date?: string
}

export interface ResolvedPageLicense {
  title: string
  page_url?: string
  author?: string
  date?: string
  name: string
  license_url: string
  notice: string
  show_url: boolean
  show_author: boolean
  show_date: boolean
}

type PageLicenseValue =
  | boolean
  | string
  | {
      preset?: string
      notice?: string
      text?: string
      url?: string
      name?: string
      author?: string
      title?: string
      page_url?: string
      date?: string
    }

const LICENSE_PRESETS: Record<string, { name: string; url: string; i18nKey: string }> = {
  'cc-by-nc-sa-4.0': {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    i18nKey: 'license.cc-by-nc-sa-4.0',
  },
}

const DEFAULT_PRESET = 'cc-by-nc-sa-4.0'

export function resolveLicenseConfig(extra: Record<string, unknown> | undefined): LicenseConfig {
  const raw = extra?.license
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { enabled: false }
  }
  return raw as LicenseConfig
}

export function formatLicenseDate(isoDate: string | undefined): string | undefined {
  if (!isoDate) return undefined
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) {
    return isoDate.slice(0, 10) || isoDate
  }
  return parsed.toISOString().slice(0, 10)
}

export function shouldShowPageLicense(
  globalConfig: LicenseConfig,
  pageMeta: PageMeta,
): boolean {
  if (pageMeta.hide?.includes('license')) return false
  if (pageMeta.license === false) return false
  if (pageMeta.license !== undefined) return true
  if (globalConfig.enabled === false) return false
  return globalConfig.enabled === true || !!(globalConfig.preset || globalConfig.notice || globalConfig.text || globalConfig.name)
}

export function resolvePageLicense(
  globalConfig: LicenseConfig,
  pageMeta: PageMeta,
  i18n: I18nStrings,
  pageContext: LicensePageContext,
): ResolvedPageLicense | undefined {
  if (!shouldShowPageLicense(globalConfig, pageMeta)) return undefined

  const pageLicense = pageMeta.license
  const pageOverride =
    pageLicense !== undefined && pageLicense !== false
      ? normalizePageLicenseOverride(pageLicense)
      : undefined

  const presetKey =
    pageOverride?.preset ?? globalConfig.preset ?? DEFAULT_PRESET
  const preset = resolvePreset(presetKey, i18n)
  if (!preset) return undefined

  const notice =
    pageOverride?.notice ??
    globalConfig.notice ??
    globalConfig.text ??
    preset.notice

  return {
    title: pageOverride?.title ?? pageContext.title,
    page_url: pageOverride?.page_url ?? pageContext.pageUrl,
    author: pageOverride?.author ?? pageContext.author ?? globalConfig.author,
    date: pageOverride?.date ?? pageContext.date,
    name: pageOverride?.name ?? globalConfig.name ?? preset.name,
    license_url: pageOverride?.url ?? globalConfig.url ?? preset.url,
    notice,
    show_url: globalConfig.show_url !== false,
    show_author: globalConfig.show_author !== false,
    show_date: globalConfig.show_date !== false,
  }
}

function normalizePageLicenseOverride(
  value: Exclude<PageLicenseValue, false>,
): {
  preset?: string
  notice?: string
  url?: string
  name?: string
  author?: string
  title?: string
  page_url?: string
  date?: string
} {
  if (value === true) return {}
  if (typeof value === 'string') return { preset: value }
  return {
    preset: value.preset,
    notice: value.notice ?? value.text,
    url: value.url,
    name: value.name,
    author: value.author,
    title: value.title,
    page_url: value.page_url,
    date: value.date,
  }
}

function resolvePreset(
  preset: string,
  i18n: I18nStrings,
): { name: string; url: string; notice: string } | undefined {
  const definition = LICENSE_PRESETS[preset]
  if (!definition) return undefined

  return {
    name: definition.name,
    url: definition.url,
    notice: i18n[`${definition.i18nKey}.notice`] ?? '',
  }
}

export function resolveLicenseAuthor(
  pageMeta: PageMeta,
  registry: Record<string, AuthorDefinition>,
  globalConfig: LicenseConfig,
  siteAuthor?: string,
): string | undefined {
  if (pageMeta.authors?.length) {
    return pageMeta.authors.map((id) => registry[id]?.name ?? id).join(', ')
  }
  if (globalConfig.author) return globalConfig.author
  if (siteAuthor) return siteAuthor
  return undefined
}

export function buildCanonicalPageUrl(
  siteUrl: string | undefined,
  pageUrl: string,
): string | undefined {
  if (!siteUrl) return undefined
  const base = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
  return base + pageUrl.replace(/^\//, '')
}
