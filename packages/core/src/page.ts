import { readFileSync } from 'fs'
import matter from 'gray-matter'
import type { DocFile } from './files.js'
import {
  loadInheritedMeta,
  mergePageMeta,
  normalizePageMeta,
  type PageMeta,
} from './frontmatter.js'
import type { TocEntry } from './markdown.js'

export type { PageMeta } from './frontmatter.js'

export interface LoadPageOptions {
  docsDir: string
  language?: string
  inheritMeta?: boolean
}

export interface Page {
  file: DocFile
  meta: PageMeta
  title: string
  content: string
  toc: TocEntry[]
  rawMarkdown: string
}

export function loadPage(file: DocFile, options?: LoadPageOptions): Page {
  const raw = readFileSync(file.srcPath, 'utf-8')
  const { data: frontmatter, content: markdown } = matter(raw)

  const inherited =
    options?.inheritMeta && options.docsDir
      ? loadInheritedMeta(options.docsDir, file.srcUri)
      : {}

  const merged = mergePageMeta(inherited, frontmatter as Record<string, unknown>)
  const meta = normalizePageMeta(merged, options?.language ?? 'en')
  const title = meta.title ?? extractFirstH1(markdown) ?? file.srcUri

  return {
    file,
    meta,
    title,
    content: '',
    toc: [],
    rawMarkdown: markdown,
  }
}

function extractFirstH1(markdown: string): string | undefined {
  const match = /^#\s+(.+)$/m.exec(markdown)
  return match?.[1]?.trim()
}
