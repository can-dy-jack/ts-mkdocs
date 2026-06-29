import type MarkdownIt from 'markdown-it'
import type { IconService } from '../icons.js'

export function iconsPlugin(md: MarkdownIt, icons: IconService): void {
  md.inline.ruler.before('text', 'icons', (state, silent) => {
    const pos = state.pos
    const max = state.posMax
    if (state.src.charCodeAt(pos) !== 0x3a /* : */) return false

    const rest = state.src.slice(pos + 1, max)
    const close = rest.indexOf(':')
    if (close <= 0) return false

    const name = rest.slice(0, close)
    if (!/^[a-z][a-z0-9-]*$/i.test(name)) return false

    if (silent) return true

    const token = state.push('html_inline', '', 0)
    token.content = icons.renderShortcode(name)
    state.pos = pos + name.length + 2
    return true
  })
}
