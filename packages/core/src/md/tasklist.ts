import type MarkdownIt from 'markdown-it'

export function tasklistPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'tasklist', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline') continue
      for (const token of block.children ?? []) {
        if (token.type !== 'text') continue
        token.content = token.content.replace(
          /\[([ xX])\]\s/g,
          (_, checked) =>
            `<input type="checkbox" class="task-list-item-checkbox" ${checked !== ' ' ? 'checked' : ''} disabled> `,
        )
      }
    }
  })
}
