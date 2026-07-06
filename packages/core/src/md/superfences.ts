import type MarkdownIt from 'markdown-it'
import { renderPlainCodeHtml, renderShikiHtml } from './code-highlight.js'
import {
  ensureCodeAnnotateWrapper,
  extractCodeAnnotations,
  injectCodeAnnotationMarkers,
  parseAnnotateFenceInfo,
  parseFenceTitle,
  stripFenceTitle,
} from './annotations.js'
import {
  injectHlLines,
  parseDiffLang,
  parseHlLines,
  renderDiffCodeHtml,
  stripFenceHlLines,
} from './code-lines.js'

interface SuperfencesOptions {
  highlighter: any
  themes: { light: string; dark: string }
  md: MarkdownIt
  lineNumbers?: boolean
  langLabel?: boolean
  locale?: string
  codeAnnotate?: boolean
}

/** Languages without a comment syntax; excluded from the *global* content.code.annotate feature. */
const NO_COMMENT_LANGS = new Set(['', 'markdown', 'md', 'text', 'plaintext', 'plain', 'txt', 'diff'])

export function superfencesPlugin(md: MarkdownIt, opts: SuperfencesOptions): void {
  const {
    highlighter,
    themes,
    md: mdInst,
    lineNumbers = false,
    langLabel = false,
    locale = 'en',
    codeAnnotate = false,
  } = opts
  const defaultFence = md.renderer.rules.fence!

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const attrClass = token.attrGet('class')
    const title = parseFenceTitle(token.info || '', token.attrGet('title'))
    let infoRaw = stripFenceTitle(token.info || '')
    const hlLines = parseHlLines(infoRaw, token.attrGet('hl_lines'))
    infoRaw = stripFenceHlLines(infoRaw)
    const { lang: fenceLang, annotate: blockAnnotate } = parseAnnotateFenceInfo(infoRaw, attrClass)
    const infoLang = fenceLang || infoRaw.trim().split(/\s+/).filter(Boolean)[0] || ''
    const diffInfo = parseDiffLang(infoLang)
    const displayLang = langLabel ? (infoLang || 'text') : infoLang
    const showHead = langLabel || Boolean(title)
    const needsLineSpans = lineNumbers || hlLines.size > 0
    const shouldAnnotate =
      !diffInfo.isDiff &&
      (blockAnnotate || (codeAnnotate && !NO_COMMENT_LANGS.has((infoLang || '').toLowerCase())))

    if (infoLang === 'mermaid') {
      return `<pre class="mermaid">${mdInst.utils.escapeHtml(token.content)}</pre>\n`
    }

    let codeContent = token.content
    let markers: ReturnType<typeof extractCodeAnnotations>['markers'] = []
    if (shouldAnnotate) {
      const extracted = extractCodeAnnotations(token.content)
      codeContent = extracted.code
      markers = extracted.markers
    }

    const renderOpts = {
      lineNumbers: needsLineSpans || markers.length > 0,
      lang: displayLang || undefined,
      langLabel,
      title,
      locale,
    }

    let html: string | null = null

    if (diffInfo.isDiff) {
      html = renderDiffCodeHtml(highlighter, codeContent, diffInfo, themes, {
        escape: mdInst.utils.escapeHtml,
        langLabel,
        title,
        locale,
        displayLang: displayLang || undefined,
      })
    } else if (infoLang && highlighter) {
      try {
        html = renderShikiHtml(highlighter, codeContent, infoLang, themes, {
          langLabel,
          title,
          escape: mdInst.utils.escapeHtml,
          locale,
        })
      } catch {
        html = null
      }
    }

    if (html === null) {
      if (needsLineSpans || showHead || markers.length > 0) {
        html = renderPlainCodeHtml(codeContent, mdInst.utils.escapeHtml, renderOpts)
      } else {
        return defaultFence(tokens, idx, options, env, self)
      }
    }

    if (hlLines.size > 0) {
      html = injectHlLines(html, hlLines)
    }

    if (markers.length > 0) {
      html = ensureCodeAnnotateWrapper(injectCodeAnnotationMarkers(html, markers))
    }

    return html
  }
}
