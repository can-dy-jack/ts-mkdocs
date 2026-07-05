import type { PageMeta } from './frontmatter.js'

export interface HtmlMetaTag {
  name?: string
  property?: string
  http_equiv?: string
  charset?: string
  content?: string
}

const HTML_META_MERGE_KEYS = new Set(['html_meta'])

export function isHtmlMetaMergeKey(key: string): boolean {
  return HTML_META_MERGE_KEYS.has(key)
}

export function parseHtmlMetaTags(raw: unknown): HtmlMetaTag[] {
  if (!Array.isArray(raw)) return []

  const tags: HtmlMetaTag[] = []
  for (const entry of raw) {
    const tag = normalizeHtmlMetaTag(entry)
    if (tag) tags.push(tag)
  }
  return tags
}

function normalizeHtmlMetaTag(raw: unknown): HtmlMetaTag | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined

  const source = raw as Record<string, unknown>
  const tag: HtmlMetaTag = {}

  if (typeof source.name === 'string' && source.name) tag.name = source.name
  if (typeof source.property === 'string' && source.property) tag.property = source.property

  const httpEquiv = source['http-equiv'] ?? source.http_equiv
  if (typeof httpEquiv === 'string' && httpEquiv) tag.http_equiv = httpEquiv

  if (typeof source.charset === 'string' && source.charset) tag.charset = source.charset
  if (source.content !== undefined && source.content !== null) {
    tag.content = String(source.content)
  }

  if (!tag.name && !tag.property && !tag.http_equiv && !tag.charset) return undefined
  if ((tag.name || tag.property || tag.http_equiv) && tag.content === undefined) return undefined

  return tag
}

export function resolvePageHtmlMetaTags(meta: PageMeta): HtmlMetaTag[] {
  return parseHtmlMetaTags(meta.html_meta)
}

export function resolvePageAuthor(meta: PageMeta, siteAuthor?: string): string | undefined {
  if (typeof meta.author === 'string' && meta.author) return meta.author
  if (siteAuthor) return siteAuthor
  return undefined
}

export function resolveDocumentTitle(
  options: {
    siteName: string
    pageTitle?: string
    metaTitle?: string
    isHomepage?: boolean
  },
): string {
  const { siteName, pageTitle, metaTitle, isHomepage } = options
  if (metaTitle) return `${metaTitle} - ${siteName}`
  if (pageTitle && !isHomepage) return `${pageTitle} - ${siteName}`
  return siteName
}
