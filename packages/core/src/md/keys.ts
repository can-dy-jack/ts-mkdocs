import type MarkdownIt from 'markdown-it'

export function keysPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('text', 'keys', (state, silent) => {
    const pos = state.pos
    const max = state.posMax
    if (state.src.charCodeAt(pos) !== 0x2b /* + */) return false
    if (state.src.charCodeAt(pos + 1) !== 0x2b) return false

    let end = pos + 2
    while (end < max && state.src.charCodeAt(end) === 0x2b) end++
    if (end >= max || state.src.charCodeAt(end) !== 0x2b) return false

    const close = state.src.indexOf('++', end + 1)
    if (close === -1) return false

    const keys = state.src.slice(end + 1, close).split('+').map((k) => k.trim()).filter(Boolean)
    if (keys.length === 0) return false
    if (silent) return true

    const html = keys.map((k) => `<kbd>${md.utils.escapeHtml(k)}</kbd>`).join('+')
    const token = state.push('html_inline', '', 0)
    token.content = html
    state.pos = close + 2
    return true
  })
}
