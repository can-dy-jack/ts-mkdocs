import type MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'

export function footnotesPlugin(md: MarkdownIt): void {
  md.use(footnote)

  const defaultRef = md.renderer.rules.footnote_ref
  if (defaultRef) {
    md.renderer.rules.footnote_ref = (tokens, idx, options, env, self) => {
      const html = defaultRef(tokens, idx, options, env, self)
      // Material-style superscript: show "1" instead of "[1]"
      return html.replace(/>\[(\d+)\]</, '>$1<')
    }
  }
}
