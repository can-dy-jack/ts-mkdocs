import type MarkdownIt from 'markdown-it'

interface TabOptions {
  alternate_style?: boolean
}

export function contentTabsPlugin(md: MarkdownIt, options: TabOptions = {}): void {
  const tabRe = /^={3}\s+"([^"]+)"\s*$/
  const alternate = options.alternate_style !== false

  md.block.ruler.before(
    'fence',
    'content_tabs',
    (state, startLine, endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const firstLine = state.src.slice(pos, max)
      if (!tabRe.test(firstLine)) return false
      if (silent) return true

      const tabs: { label: string; content: string }[] = []
      let line = startLine

      while (line < endLine) {
        const p = state.bMarks[line] + state.tShift[line]
        const m = state.eMarks[line]
        const text = state.src.slice(p, m)
        const match = tabRe.exec(text)
        if (!match) break

        const label = match[1]
        line++
        const contentLines: string[] = []

        while (line < endLine) {
          const lp = state.bMarks[line] + state.tShift[line]
          const lm = state.eMarks[line]
          const ltext = state.src.slice(lp, lm)
          if (tabRe.test(ltext)) break
          if (ltext.trim() === '' && line + 1 < endLine) {
            const np = state.bMarks[line + 1] + state.tShift[line + 1]
            const nm = state.eMarks[line + 1]
            if (tabRe.test(state.src.slice(np, nm))) break
          }
          contentLines.push(ltext)
          line++
        }

        tabs.push({ label, content: contentLines.join('\n') })
      }

      if (tabs.length === 0) return false

      const tokenOpen = state.push('tabs_open', 'div', 1)
      tokenOpen.attrSet('class', alternate ? 'tabbed-set tabbed-alternate' : 'tabbed-set')
      tokenOpen.map = [startLine, line]

      tabs.forEach((tab, i) => {
        const id = `tab-${startLine}-${i}`
        const input = state.push('tab_input', 'input', 0)
        input.attrSet('type', 'radio')
        input.attrSet('name', `tabs-${startLine}`)
        input.attrSet('id', id)
        if (i === 0) input.attrSet('checked', 'checked')

        const labelTok = state.push('tab_label', 'label', 0)
        labelTok.attrSet('for', id)
        labelTok.content = tab.label

        const contentTok = state.push('tab_content', 'div', 0)
        contentTok.attrSet('class', 'tabbed-content')
        contentTok.content = tab.content
      })

      state.push('tabs_close', 'div', -1)
      state.line = line
      return true
    },
    { alt: ['paragraph', 'reference'] },
  )

  md.renderer.rules.tabs_open = () => '<div class="tabbed-set tabbed-alternate">\n'
  md.renderer.rules.tabs_close = () => '</div>\n'
  md.renderer.rules.tab_input = (tokens, idx) => {
    const t = tokens[idx]
    const attrs = ['type="radio"']
    if (t.attrGet('name')) attrs.push(`name="${t.attrGet('name')}"`)
    if (t.attrGet('id')) attrs.push(`id="${t.attrGet('id')}"`)
    if (t.attrGet('checked')) attrs.push('checked="checked"')
    return `<input ${attrs.join(' ')} class="tabbed-input" />\n`
  }
  md.renderer.rules.tab_label = (tokens, idx) => {
    const forId = tokens[idx].attrGet('for')
    return `<label for="${forId}" class="tabbed-label">${md.utils.escapeHtml(tokens[idx].content)}</label>\n`
  }
  md.renderer.rules.tab_content = (tokens, idx) =>
    `<div class="tabbed-content">${md.render(tokens[idx].content)}</div>\n`
}
