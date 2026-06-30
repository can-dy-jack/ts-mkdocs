import type MarkdownIt from 'markdown-it'
import { renderPlainCodeHtml, renderShikiHtml } from './code-highlight.js'

interface SuperfencesOptions {
  highlighter: any
  themes: { light: string; dark: string }
  md: MarkdownIt
  lineNumbers?: boolean
  langLabel?: boolean
  locale?: string
}

export function superfencesPlugin(md: MarkdownIt, opts: SuperfencesOptions): void {
  const { highlighter, themes, md: mdInst, lineNumbers = false, langLabel = false, locale = 'en' } = opts
  const defaultFence = md.renderer.rules.fence!

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const infoLang = (token.info || '').trim().split(/\s+/)[0]
    const displayLang = langLabel ? (infoLang || 'text') : infoLang

    if (infoLang === 'mermaid') {
      return `<pre class="mermaid">${mdInst.utils.escapeHtml(token.content)}</pre>\n`
    }

    const renderOpts = { lineNumbers, lang: displayLang || undefined, langLabel, locale }

    if (infoLang && highlighter) {
      try {
        return renderShikiHtml(highlighter, token.content, infoLang, themes, {
          langLabel,
          escape: mdInst.utils.escapeHtml,
          locale,
        })
      } catch {
        // fall through
      }
    }

    if (lineNumbers || langLabel) {
      return renderPlainCodeHtml(token.content, mdInst.utils.escapeHtml, renderOpts)
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}
