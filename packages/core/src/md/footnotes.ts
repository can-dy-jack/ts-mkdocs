import type MarkdownIt from 'markdown-it'

export function footnotesPlugin(md: MarkdownIt): void {
  const refs = new Map<string, string>()

  md.inline.ruler.before('link', 'footnote_ref', (state, silent) => {
    const pos = state.pos
    if (state.src.charCodeAt(pos) !== 0x5b /* [ */) return false
    if (state.src.charCodeAt(pos + 1) !== 0x5e /* ^ */) return false

    const close = state.src.indexOf(']', pos + 2)
    if (close === -1) return false
    const id = state.src.slice(pos + 2, close)
    if (silent) return true

    const token = state.push('footnote_ref', '', 0)
    token.meta = { id }
    state.pos = close + 1
    return true
  })

  md.block.ruler.before('fence', 'footnote_def', (state, startLine, _endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const line = state.src.slice(pos, max)
    const match = /^\[\^(\w+)\]:\s*(.*)$/.exec(line)
    if (!match) return false
    if (silent) return true

    refs.set(match[1], match[2])
    state.line = startLine + 1
    return true
  })

  md.renderer.rules.footnote_ref = (tokens, idx) => {
    const id = tokens[idx].meta?.id ?? ''
    return `<sup class="footnote-ref"><a href="#fn-${id}" id="fnref-${id}">${id}</a></sup>`
  }

  const origClose = md.renderer.rules.paragraph_close
  md.renderer.rules.paragraph_close = (tokens, idx, options, env, self) => {
    if (idx === tokens.length - 1 && refs.size > 0) {
      let html = '<section class="footnotes"><ol>'
      for (const [id, text] of refs) {
        html += `<li id="fn-${id}">${md.renderInline(text)} <a href="#fnref-${id}">↩</a></li>`
      }
      html += '</ol></section>'
      refs.clear()
      return (origClose ? origClose(tokens, idx, options, env, self) : '') + html
    }
    return origClose ? origClose(tokens, idx, options, env, self) : ''
  }
}
