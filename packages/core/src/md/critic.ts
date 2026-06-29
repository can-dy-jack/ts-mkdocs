import type MarkdownIt from 'markdown-it'

export function criticPlugin(md: MarkdownIt): void {
  const rules: [RegExp, string][] = [
    [/\{\+\+([^+]+)\+\+\}/g, '<ins>$1</ins>'],
    [/\{--([^-]+)--\}/g, '<del>$1</del>'],
    [/\{~~([^~]+)~=>([^}]+)~~\}/g, '<del>$1</del><ins>$2</ins>'],
    [/\{==([^=]+)==\}/g, '<mark>$1</mark>'],
    [/\{>>([^}]+)<<\}/g, '<span class="critic comment">$1</span>'],
  ]

  md.core.ruler.after('inline', 'critic', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline') continue
      for (const token of block.children ?? []) {
        if (token.type !== 'text') continue
        let content = token.content
        for (const [re, repl] of rules) {
          content = content.replace(re, repl)
        }
        if (content !== token.content) {
          token.type = 'html_inline'
          token.content = content
        }
      }
    }
  })
}
