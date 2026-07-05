import type MarkdownIt from 'markdown-it'
import abbr from 'markdown-it-abbr'

export function abbrPlugin(md: MarkdownIt): void {
  md.use(abbr)
}
