import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import type { Config } from './config.js'
import { applyMarkdownExtensions } from './markdown-extensions.js'
import {
  hasLineNumbersFeature,
  hasLangLabelFeature,
  renderPlainCodeHtml,
  renderShikiHtml,
} from './md/code-highlight.js'

export interface TocEntry {
  id: string
  title: string
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

export async function initMarkdown(config: Config): Promise<void> {
  const hl = config.theme.highlight
  activeThemes = { light: hl.theme_light, dark: hl.theme_dark }
  lineNumbersEnabled = hasLineNumbersFeature(config)
  langLabelEnabled = hasLangLabelFeature(config)
  siteLocale = config.theme.language

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
  mdInstance.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
    const token = tokens[idx]
    const level = parseInt(token.tag.slice(1))
    const inlineToken = tokens[idx + 1]
    const titleText = inlineToken.children?.map((t) => t.content).join('') ?? ''
    const id = token.attrGet('id') ?? slugify(titleText)

    if (level === 1) {
      stack.length = 0
      return originalRender ? originalRender(tokens, idx, options, _env, self) : self.renderToken(tokens, idx, options)
    }

    const entry: TocEntry = { id, title: titleText, level, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      toc.push(entry)
    } else {
      stack[stack.length - 1].children.push(entry)
    }
    stack.push(entry)

    return originalRender ? originalRender(tokens, idx, options, _env, self) : self.renderToken(tokens, idx, options)
  }

  const html = mdInstance.render(content)
  mdInstance.renderer.rules.heading_open = originalRender

  return { html, toc }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
