import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import lunr from 'lunr'
import type { Config } from './config.js'
import type { Page } from './page.js'

export interface SearchDocument {
  location: string
  title: string
  text: string
}

export interface SearchIndex {
  config: { lang: string[]; separator: string; pipeline: string[] }
  docs: SearchDocument[]
  index: object
}

const CJK_LANGS = new Set(['zh', 'ja', 'ko', 'th'])

function getSearchLang(config: Config): string {
  return config.theme.language.split('-')[0].toLowerCase()
}

function tokenizeCjk(text: string): string[] {
  const tokens: string[] = []
  const words = text.split(/\s+/).filter(Boolean)
  for (const word of words) {
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(word)) {
      for (const char of word) tokens.push(char)
    } else {
      tokens.push(word)
    }
  }
  return tokens
}

export function buildSearchIndex(pages: Page[], config: Config): SearchIndex {
  const docs: SearchDocument[] = []
  const lang = getSearchLang(config)
  const isCjk = CJK_LANGS.has(lang)

  for (const page of pages) {
    if (page.meta.search?.exclude) continue

    const text = stripHtml(page.content)
    docs.push({
      location: page.file.url,
      title: page.title,
      text: isCjk ? tokenizeCjk(text + ' ' + page.title).join(' ') : text,
    })

    for (const section of page.toc) {
      if (section.id) {
        docs.push({
          location: `${page.file.url}#${section.id}`,
          title: section.title,
          text: '',
        })
      }
    }
  }

  const idx = lunr(function () {
    this.ref('location')
    this.field('title', { boost: 10 })
    this.field('text')

    if (isCjk) {
      this.pipeline.remove(lunr.stopWordFilter)
      this.pipeline.remove(lunr.stemmer)
    }

    for (const doc of docs) {
      this.add(doc)
    }
  })

  const pipeline = isCjk ? [] : ['stopWordFilter', 'stemmer']

  return {
    config: { lang: [lang], separator: isCjk ? '' : '[\\s\\-]+', pipeline },
    docs,
    index: idx.toJSON(),
  }
}

export function writeSearchIndex(searchIndex: SearchIndex, siteDir: string): void {
  const searchDir = join(siteDir, 'search')
  mkdirSync(searchDir, { recursive: true })
  writeFileSync(join(searchDir, 'search_index.json'), JSON.stringify(searchIndex))
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
