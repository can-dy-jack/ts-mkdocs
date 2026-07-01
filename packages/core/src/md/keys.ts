import type MarkdownIt from 'markdown-it'

export function keysPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('text', 'keys', (state, silent) => {
    const pos = state.pos
    if (state.src.charCodeAt(pos) !== 0x2b /* + */) return false
    if (state.src.charCodeAt(pos + 1) !== 0x2b) return false

    const close = state.src.indexOf('++', pos + 2)
    if (close === -1) return false

    const inner = state.src.slice(pos + 2, close)
    if (!inner) return false

    const keys = inner.split('+').map((k) => k.trim()).filter(Boolean)
    if (keys.length === 0) return false
    if (silent) return true

    const html = keys.map((k) => `<kbd>${md.utils.escapeHtml(k)}</kbd>`).join('+')
    const token = state.push('html_inline', '', 0)
    token.content = html
    state.pos = close + 2
    return true
  })
}
