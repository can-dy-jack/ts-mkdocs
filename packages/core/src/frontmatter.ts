import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import yaml from 'js-yaml'

export interface PageMeta {
  title?: string
  description?: string
  subtitle?: string
  template?: string
  icon?: string
  status?: string
  tags?: string[]
  groups?: string[]
  authors?: string[]
  hide?: string[]
  /** Publish / creation date (ISO 8601). Aliases: `created`, `published`, `date`. */
  date?: string
  /** Last updated date (ISO 8601). Aliases: `modified`, `updated`. */
  updated?: string
  /** Locale-formatted publish date for templates. */
  date_formatted?: string
  /** Locale-formatted update date for templates. */
  updated_formatted?: string
  /** Full edit link override (absolute URL or path appended to `repo_url`). */
  edit_url?: string
  /** Edit path override relative to `repo_url` (replaces global `edit_uri` + source path). */
  edit_uri?: string
  search?: { boost?: number; exclude?: boolean }
  hero?: { title?: string; tagline?: string }
  robots?: string
  /** Reading time override in minutes. */
  readtime?: number
  /** Disable automatic reading time for this page. */
  reading_time?: boolean
  /** Locale-formatted reading time label for templates. */
  readtime_formatted?: string
  /** OG/Twitter card image (absolute URL or path relative to docs_dir). */
  image?: string
  /** Page license declaration override (`false` to hide). */
  license?:
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
  [key: string]: unknown
}

const ARRAY_MERGE_KEYS = new Set(['tags', 'groups', 'authors', 'hide'])

const DATE_ALIASES: Record<string, 'date' | 'updated'> = {
  created: 'date',
  published: 'date',
  modified: 'updated',
}

export function isMetaFile(srcUri: string): boolean {
  return srcUri === '.meta.yml' || srcUri.endsWith('/.meta.yml')
}

export function loadInheritedMeta(docsDir: string, srcUri: string): Record<string, unknown> {
  const layers: Record<string, unknown>[] = []

  const rootMeta = join(docsDir, '.meta.yml')
  if (existsSync(rootMeta)) {
    layers.push(readMetaYaml(rootMeta))
  }

  const dirParts = dirname(srcUri).split('/').filter((part) => part !== '.')
  for (let i = 0; i < dirParts.length; i++) {
    const metaPath = join(docsDir, ...dirParts.slice(0, i + 1), '.meta.yml')
    if (existsSync(metaPath)) {
      layers.push(readMetaYaml(metaPath))
    }
  }

  return mergeInheritedMeta(layers)
}

function readMetaYaml(path: string): Record<string, unknown> {
  const raw = readFileSync(path, 'utf-8')
  const parsed = yaml.load(raw)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {}
}

function mergeInheritedMeta(layers: Record<string, unknown>[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const layer of layers) {
    mergeMetaLayer(result, layer)
  }
  return result
}

export function mergePageMeta(
  inherited: Record<string, unknown>,
  page: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...inherited }
  mergeMetaLayer(merged, page)
  return merged
}

function mergeMetaLayer(target: Record<string, unknown>, layer: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(layer)) {
    if (ARRAY_MERGE_KEYS.has(key) && Array.isArray(value)) {
      const existing = Array.isArray(target[key]) ? (target[key] as unknown[]) : []
      target[key] = [...existing, ...value]
    } else {
      target[key] = value
    }
  }
}

export function normalizePageMeta(raw: Record<string, unknown>, language = 'en'): PageMeta {
  const meta: Record<string, unknown> = { ...raw }

  for (const [alias, target] of Object.entries(DATE_ALIASES)) {
    if (meta[target] === undefined && meta[alias] !== undefined) {
      meta[target] = meta[alias]
    }
  }

  for (const key of ['tags', 'groups', 'authors', 'hide'] as const) {
    if (meta[key] !== undefined) {
      meta[key] = dedupeArray(normalizeStringArray(meta[key]))
    }
  }

  if (meta.date !== undefined) {
    const normalized = normalizeDate(meta.date)
    if (normalized) {
      meta.date = normalized
      meta.date_formatted = formatDate(normalized, language)
    }
  }

  if (meta.updated !== undefined) {
    const normalized = normalizeDate(meta.updated)
    if (normalized) {
      meta.updated = normalized
      meta.updated_formatted = formatDate(normalized, language)
    }
  }

  if (meta.edit_url === undefined && meta.edit_uri !== undefined) {
    const editUri = String(meta.edit_uri)
    if (/^https?:\/\//.test(editUri)) {
      meta.edit_url = editUri
      delete meta.edit_uri
    }
  }

  return meta as PageMeta
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function dedupeArray(values: string[]): string[] {
  return [...new Set(values)]
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
    return value
  }
  return undefined
}

function formatDate(isoDate: string, language: string): string {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  const locale = language.replace('_', '-')
  try {
    return parsed.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return parsed.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

export function resolveEditUrl(
  config: { repo_url?: string; edit_uri?: string },
  srcUri: string,
  meta: PageMeta,
): string | undefined {
  if (meta.edit_url) {
    const url = String(meta.edit_url)
    if (/^https?:\/\//.test(url)) return url
    if (config.repo_url) return `${config.repo_url}/${url.replace(/^\//, '')}`
    return url
  }

  if (!config.repo_url) return undefined

  if (meta.edit_uri) {
    return `${config.repo_url}/${String(meta.edit_uri).replace(/^\//, '')}`
  }

  const editPath = config.edit_uri ?? 'edit/main/docs/'
  return `${config.repo_url}/${editPath.replace(/^\//, '')}${srcUri}`
}
