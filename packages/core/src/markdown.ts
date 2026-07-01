import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import anchor from 'markdown-it-anchor'
import type { Config } from './config.js'
import { applyMarkdownExtensions } from './markdown-extensions.js'
import { createIconService, type IconService } from './icons.js'
import { processTextAnnotations } from './md/annotations.js'
import {
  hasLineNumbersFeature,
  hasLangLabelFeature,
  renderPlainCodeHtml,
  renderShikiHtml,
} from './md/code-highlight.js'

export interface TocEntry {
  id: string
  title: string
  title_html: string
  level: number
  children: TocEntry[]
}

export interface MarkdownResult {
  html: string
  toc: TocEntry[]
}

let mdInstance: MarkdownIt | null = null
let highlighter: any = null
let activeThemes = { light: 'github-light', dark: 'github-dark' }
let lineNumbersEnabled = false
let langLabelEnabled = false
let siteLocale = 'en'
let tocDepth = 3
let iconService: IconService | null = null

/** Resolve TOC options from markdown_extensions (MkDocs-compatible). */
export function resolveTocOptions(config: Config): { depth: number } {
  for (const ext of config.markdown_extensions ?? []) {
    if (typeof ext === 'string') {
      if (ext === 'toc') return { depth: 3 }
      continue
    }
    const opts = ext.toc
    if (opts && typeof opts === 'object') {
      const depth = (opts as Record<string, unknown>).toc_depth
      if (typeof depth === 'number') {
        return { depth: Math.min(6, Math.max(1, depth)) }
      }
      return { depth: 3 }
    }
  }
  return { depth: 3 }
}

export async function initMarkdown(config: Config): Promise<void> {
  const hl = config.theme.highlight
  activeThemes = { light: hl.theme_light, dark: hl.theme_dark }
  lineNumbersEnabled = hasLineNumbersFeature(config)
  langLabelEnabled = hasLangLabelFeature(config)
  siteLocale = config.theme.language
  tocDepth = resolveTocOptions(config).depth
  iconService = createIconService(config)

  const { createHighlighter } = await import('shiki')
  const themes = [...new Set([hl.theme_light, hl.theme_dark])]
  highlighter = await createHighlighter({
    themes,
    langs: [
      'javascript', 'typescript', 'python', 'bash', 'shell', 'json',
      'yaml', 'toml', 'html', 'css', 'markdown', 'sql', 'go', 'rust',
      'java', 'cpp', 'c', 'ruby', 'php', 'dockerfile', 'nginx', 'mermaid',
    ],
  })

  mdInstance = new MarkdownIt({
    html: true,
    xhtmlOut: false,
    breaks: false,
    linkify: true,
    typographer: true,
    highlight(code, lang) {
      const renderOpts = {
        lineNumbers: lineNumbersEnabled,
        lang: langLabelEnabled ? (lang || 'text') : (lang || undefined),
        langLabel: langLabelEnabled,
        locale: siteLocale,
      }
      if (!lang || !highlighter) {
        return renderPlainCodeHtml(code, mdInstance!.utils.escapeHtml, renderOpts)
      }
      try {
        return renderShikiHtml(highlighter, code, lang, activeThemes, {
          langLabel: langLabelEnabled,
          locale: siteLocale,
        })
      } catch {
        return renderPlainCodeHtml(code, mdInstance!.utils.escapeHtml, renderOpts)
      }
    },
  })

  mdInstance.use(anchor, {
    permalink: anchor.permalink.headerLink({ safariReaderFix: true }),
    slugify,
  })

  applyMarkdownExtensions(mdInstance, config, highlighter, activeThemes)
}

export function renderMarkdown(content: string): MarkdownResult {
  if (!mdInstance) throw new Error('Markdown not initialized. Call initMarkdown() first.')

  const toc: TocEntry[] = []
  const stack: TocEntry[] = []

  const originalRender = mdInstance.renderer.rules.heading_open
  mdInstance.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const level = parseInt(token.tag.slice(1))
    const inlineToken = tokens[idx + 1]
    const children = inlineToken.children ?? []
    const contentChildren = tocInlineChildren(children)
    const titleText = inlinePlainText(contentChildren)
    const titleHtml = self.renderInline(contentChildren, options, env)
    const id = token.attrGet('id') ?? slugify(titleText)

    if (level === 1) {
      stack.length = 0
      return originalRender ? originalRender(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
    }

    if (level > tocDepth) {
      return originalRender ? originalRender(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
    }

    const entry: TocEntry = { id, title: titleText, title_html: titleHtml, level, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      toc.push(entry)
    } else {
      stack[stack.length - 1].children.push(entry)
    }
    stack.push(entry)

    return originalRender ? originalRender(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
  }

  let html = mdInstance.render(content)
  mdInstance.renderer.rules.heading_open = originalRender

  if (iconService) html = processTextAnnotations(html, iconService)

  return { html, toc }
}

function inlinePlainText(children: Token[]): string {
  return children
    .map((t) => (t.type === 'text' || t.type === 'code_inline' ? t.content : ''))
    .join('')
    .trim()
}

/** Strip header-anchor wrapper injected by markdown-it-anchor permalink.headerLink. */
function tocInlineChildren(children: Token[]): Token[] {
  if (
    children.length >= 3 &&
    children[0].type === 'link_open' &&
    children[0].attrs?.some(([k, v]) => k === 'class' && v.includes('header-anchor'))
  ) {
    let start = 1
    let end = children.length - 1
    if (children[end].type === 'link_close') end -= 1
    if (children[start]?.type === 'span_open' && children[end]?.type === 'span_close') {
      return children.slice(start + 1, end)
    }
    return children.slice(start, end + 1)
  }
  return children
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
