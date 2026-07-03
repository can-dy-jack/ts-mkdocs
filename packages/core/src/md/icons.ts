import type MarkdownIt from 'markdown-it'
import type { IconService } from '../icons.js'

const ICON_PREFIX_RE = /^(material|fontawesome-brands|fontawesome-solid|fontawesome-regular|bootstrap|octicons)-/

export function isPrefixedIconShortcode(name: string): boolean {
  return ICON_PREFIX_RE.test(name)
}

export function iconsPlugin(
  md: MarkdownIt,
  icons: IconService,
  opts?: { emojiEnabled?: boolean },
): void {
  md.inline.ruler.before('text', 'icons', (state, silent) => {
    const pos = state.pos
    const max = state.posMax
    if (state.src.charCodeAt(pos) !== 0x3a /* : */) return false

    if (pos > 0 && state.src.charCodeAt(pos - 1) === 0x5b /* [ */) return false

    const rest = state.src.slice(pos + 1, max)
    const close = rest.indexOf(':')
    if (close <= 0) return false

    const name = rest.slice(0, close)
    if (!/^[a-z][a-z0-9-]*$/i.test(name)) return false
    if (opts?.emojiEnabled && !isPrefixedIconShortcode(name)) return false

    if (silent) return true

    const token = state.push('html_inline', '', 0)
    token.content = icons.renderShortcode(name)
    state.pos = pos + name.length + 2
    return true
  })
}
