import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'

export interface CaretOptions {
  smart_insert?: boolean
  insert?: boolean
  superscript?: boolean
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

function parseDoubleCaret(
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

function parseSingleCaret(
  md: MarkdownIt,
  state: StateInline,
  silent: boolean,
  char: string,
  tag: string,
): boolean {
  const pos = state.pos
  if (state.src.charCodeAt(pos) !== char.charCodeAt(0)) return false
  if (state.src.charCodeAt(pos + 1) === char.charCodeAt(0)) return false
  // Footnote references [^label] and inline footnotes ^[label]
  if (pos > 0 && state.src.charCodeAt(pos - 1) === 0x5b /* [ */) return false
  if (state.src.charCodeAt(pos + 1) === 0x5b /* [ */) return false

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

export function caretPlugin(md: MarkdownIt, opts: CaretOptions = {}): void {
  const insertEnabled = opts.insert !== false
  const superscriptEnabled = opts.superscript !== false

  if (insertEnabled) {
    md.inline.ruler.before('emphasis', 'caret_insert', (state, silent) =>
      parseDoubleCaret(md, state, silent, '^', 'ins'),
    )
  }

  if (superscriptEnabled) {
    md.inline.ruler.before('emphasis', 'caret_superscript', (state, silent) =>
      parseSingleCaret(md, state, silent, '^', 'sup'),
    )
  }
}
