import type { Config } from './config.js'
import type { PageMeta } from './frontmatter.js'
import type { Page } from './page.js'
import { joinUrl, slugify } from './utils.js'

export interface TagPageRef {
  title: string
  url: string
  description?: string
  date?: string
}

export interface TagEntry {
  name: string
  slug: string
  count: number
  pages: TagPageRef[]
  weight: number
}

export interface TagIndex {
  tags: TagEntry[]
  totalPages: number
  totalTaggedPages: number
}

export interface ResolvedTag {
  name: string
  slug: string
  url: string
}

export interface TagsPluginConfig {
  enabled: boolean
  sort_by: 'count' | 'name'
}

const TAGS_BASE_PATH = 'tags'

export function slugifyTag(name: string): string {
  return slugify(name)
}

export function getTagsPluginConfig(config: Config): TagsPluginConfig {
  for (const entry of config.plugins) {
    if (typeof entry === 'object' && 'tags' in entry) {
      const options = (entry.tags ?? {}) as Record<string, unknown>
      return {
        enabled: options.enabled !== false,
        sort_by: options.sort_by === 'name' ? 'name' : 'count',
      }
    }
    if (entry === 'tags') {
      return { enabled: true, sort_by: 'count' }
    }
  }
  return { enabled: false, sort_by: 'count' }
}

export function hasTagsPlugin(config: Config): boolean {
  const pluginConfig = getTagsPluginConfig(config)
  return pluginConfig.enabled && config.plugins.some((entry) => {
    const name = typeof entry === 'string' ? entry : Object.keys(entry)[0]
    return name === 'tags'
  })
}

export function getTagIndexUrl(baseUrl: string): string {
  return joinUrl(baseUrl, `${TAGS_BASE_PATH}/`)
}

export function getTagArchiveUrl(baseUrl: string, slug: string): string {
  return joinUrl(baseUrl, `${TAGS_BASE_PATH}/${slug}/`)
}

export function resolvePageTags(
  tags: string[] | undefined,
  baseUrl: string,
): ResolvedTag[] {
  if (!tags?.length) return []

  return tags.map((name) => {
    const slug = slugifyTag(name)
    return {
      name,
      slug,
      url: getTagArchiveUrl(baseUrl, slug),
    }
  })
}

export function shouldShowPageTags(meta: PageMeta): boolean {
  const hide = meta.hide ?? []
  return !!(meta.tags?.length && !hide.includes('tags'))
}

function computeTagWeights(counts: number[]): number[] {
  if (counts.length === 0) return []
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  const range = max - min || 1
  return counts.map((count) => 1 + ((count - min) / range) * 4)
}

export function buildTagCloudData(
  tagIndex: TagIndex,
): Array<{ name: string; slug: string; count: number; weight: number }> {
  return tagIndex.tags.map((tag) => ({
    name: tag.name,
    slug: tag.slug,
    count: tag.count,
    weight: tag.weight,
  }))
}

export function aggregateTags(
  pages: Page[],
  _baseUrl: string,
  options: Pick<TagsPluginConfig, 'sort_by'> = { sort_by: 'count' },
): TagIndex {
  const tagMap = new Map<string, { name: string; pages: TagPageRef[] }>()
  const taggedPageUris = new Set<string>()

  for (const page of pages) {
    if (page.meta.search?.exclude) continue
    if (!page.meta.tags?.length) continue

    taggedPageUris.add(page.file.srcUri)

    const pageRef: TagPageRef = {
      title: page.title,
      url: page.file.url,
      description: typeof page.meta.description === 'string' ? page.meta.description : undefined,
      date: page.meta.date_formatted,
    }

    for (const tagName of page.meta.tags) {
      const slug = slugifyTag(tagName)
      const existing = tagMap.get(slug)
      if (existing) {
        if (!existing.pages.some((p) => p.url === pageRef.url)) {
          existing.pages.push(pageRef)
        }
      } else {
        tagMap.set(slug, { name: tagName, pages: [pageRef] })
      }
    }
  }

  let tags: TagEntry[] = [...tagMap.entries()].map(([slug, { name, pages: tagPages }]) => ({
    name,
    slug,
    count: tagPages.length,
    pages: [...tagPages].sort((a, b) => a.title.localeCompare(b.title)),
    weight: 1,
  }))

  const weights = computeTagWeights(tags.map((t) => t.count))
  tags = tags.map((tag, index) => ({ ...tag, weight: weights[index] ?? 1 }))

  if (options.sort_by === 'name') {
    tags.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    tags.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }

  return {
    tags,
    totalPages: pages.filter((p) => !p.meta.search?.exclude).length,
    totalTaggedPages: taggedPageUris.size,
  }
}
