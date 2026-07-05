import type MarkdownIt from 'markdown-it'
import deflist from 'markdown-it-deflist'

export function deflistPlugin(md: MarkdownIt): void {
  md.use(deflist)
}
