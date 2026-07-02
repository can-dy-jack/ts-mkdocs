import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

export interface TildeOptions {
  smart_delete?: boolean
  delete?: boolean
  subscript?: boolean
}

function findClosingDelimiter(src: string, start: number, delimiter: string): number {
  let i = start
  while (i < src.length) {
    if (src[i] === '\\') {
      i += 2
      continue
    }
    if (src.startsWith(delimiter, i)) return i
    i++
  }
  return -1
}

function unescapeContent(content: string): string {
  return content.replace(/\\(.)/g, '$1')
}

function parseDoubleTilde(
  md: MarkdownIt,
  state: StateInline,
  silent: boolean,
  char: string,
  tag: string,
): boolean {
  const pos = state.pos
  if (state.src.charCodeAt(pos) !== char.charCodeAt(0)) return false
  if (state.src.charCodeAt(pos + 1) !== char.charCodeAt(0)) return false

  const close = state.src.indexOf(char + char, pos + 2)
  if (close === -1) return false
  if (silent) return true

  const content = state.src.slice(pos + 2, close)
  const token = state.push('html_inline', '', 0)
  token.content = `<${tag}>${md.utils.escapeHtml(content)}</${tag}>`
  state.pos = close + 2
  return true
}

function parseSingleTilde(
  md: MarkdownIt,
  state: StateInline,
  silent: boolean,
  char: string,
  tag: string,
): boolean {
  const pos = state.pos
  if (state.src.charCodeAt(pos) !== char.charCodeAt(0)) return false
  if (state.src.charCodeAt(pos + 1) === char.charCodeAt(0)) return false

  const close = findClosingDelimiter(state.src, pos + 1, char)
  if (close === -1) return false
  if (silent) return true

  const raw = state.src.slice(pos + 1, close)
  const content = unescapeContent(raw)
  const token = state.push('html_inline', '', 0)
  token.content = `<${tag}>${md.utils.escapeHtml(content)}</${tag}>`
  state.pos = close + 1
  return true
}

export function tildePlugin(md: MarkdownIt, opts: TildeOptions = {}): void {
  const deleteEnabled = opts.delete !== false
  const subscriptEnabled = opts.subscript !== false

  if (deleteEnabled) {
    md.disable('strikethrough', true)
    md.inline.ruler.before('emphasis', 'tilde_delete', (state, silent) =>
      parseDoubleTilde(md, state, silent, '~', 'del'),
    )
  }

  if (subscriptEnabled) {
    md.inline.ruler.before('emphasis', 'tilde_subscript', (state, silent) =>
      parseSingleTilde(md, state, silent, '~', 'sub'),
    )
  }
}
