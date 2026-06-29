import { readFileSync } from 'fs'
import matter from 'gray-matter'
import type { DocFile } from './files.js'
import type { TocEntry } from './markdown.js'

export interface PageMeta {
  title?: string
  description?: string
  tags?: string[]
  hide?: string[]
  search?: { boost?: number; exclude?: boolean }
  hero?: { title?: string; tagline?: string }
  [key: string]: unknown
}

export interface Page {
  file: DocFile
  meta: PageMeta
  title: string
  content: string
  toc: TocEntry[]
  rawMarkdown: string
}

export function loadPage(file: DocFile): Page {
  const raw = readFileSync(file.srcPath, 'utf-8')
  const { data: meta, content: markdown } = matter(raw)
  const title = (meta.title as string) ?? extractFirstH1(markdown) ?? file.srcUri

  return {
    file,
    meta: meta as PageMeta,
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
