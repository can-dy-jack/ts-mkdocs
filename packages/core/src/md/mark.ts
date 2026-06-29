import type MarkdownIt from 'markdown-it'

export function markPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('emphasis', 'mark', (state, silent) => {
    const pos = state.pos
    if (state.src.charCodeAt(pos) !== 0x3d /* = */) return false
    if (state.src.charCodeAt(pos + 1) !== 0x3d) return false

    const close = state.src.indexOf('==', pos + 2)
    if (close === -1) return false
    if (silent) return true

    const content = state.src.slice(pos + 2, close)
    const token = state.push('html_inline', '', 0)
    token.content = `<mark>${md.utils.escapeHtml(content)}</mark>`
    state.pos = close + 2
    return true
  })
}
