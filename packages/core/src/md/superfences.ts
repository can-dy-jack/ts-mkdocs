import type MarkdownIt from 'markdown-it'

interface SuperfencesOptions {
  highlighter: any
  themes: { light: string; dark: string }
  md: MarkdownIt
}

export function superfencesPlugin(md: MarkdownIt, opts: SuperfencesOptions): void {
  const { highlighter, themes, md: mdInst } = opts
  const defaultFence = md.renderer.rules.fence!

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const lang = (token.info || '').trim().split(/\s+/)[0]

    if (lang === 'mermaid') {
      return `<pre class="mermaid">${mdInst.utils.escapeHtml(token.content)}</pre>\n`
    }

    if (lang && highlighter) {
      try {
        if (themes.light === themes.dark) {
          return highlighter.codeToHtml(token.content, { lang, theme: themes.light })
        }
        return highlighter.codeToHtml(token.content, {
          lang,
          themes: { light: themes.light, dark: themes.dark },
        })
      } catch {
        // fall through
      }
    }

    return defaultFence(tokens, idx, options, env, self)
  }
}
