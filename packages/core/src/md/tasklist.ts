import type MarkdownIt from 'markdown-it'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'
import type Token from 'markdown-it/lib/token.mjs'

const TASK_RE = /^\[([ xX])\]\s([\s\S]*)$/

function addClass(token: Token, className: string): void {
  const idx = token.attrIndex('class')
  if (idx < 0) {
    token.attrPush(['class', className])
    return
  }
  const current = token.attrs![idx][1]
  if (!current.split(/\s+/).includes(className)) {
    token.attrs![idx][1] = `${current} ${className}`
  }
}

function transformTaskListInline(inline: Token, TokenCtor: typeof Token): boolean {
  const children = inline.children
  if (!children?.length || children[0].type !== 'text') return false

  const match = TASK_RE.exec(children[0].content)
  if (!match) return false

  const checked = match[1] !== ' '
  const html = new TokenCtor('html_inline', '', 0)
  html.content = `<input type="checkbox" class="task-list-item-checkbox"${checked ? ' checked' : ''} disabled> `

  const next: Token[] = [html]
  if (match[2]) {
    const text = new TokenCtor('text', '', 0)
    text.content = match[2]
    next.push(text)
  }
  next.push(...children.slice(1))
  inline.children = next
  return true
}

function markParentTaskList(tokens: Token[], listItemIndex: number): void {
  for (let j = listItemIndex - 1; j >= 0; j--) {
    const type = tokens[j].type
    if (type === 'bullet_list_open' || type === 'ordered_list_open') {
      addClass(tokens[j], 'task-list')
      return
    }
  }
}

export function tasklistPlugin(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'tasklist', (state: StateCore) => {
    const { tokens, Token: TokenCtor } = state

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'list_item_open') continue

      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'list_item_close') break
        if (tokens[j].type !== 'inline') continue

        if (transformTaskListInline(tokens[j], TokenCtor)) {
          addClass(tokens[i], 'task-list-item')
          markParentTaskList(tokens, i)
        }
      }
    }
  })
}
