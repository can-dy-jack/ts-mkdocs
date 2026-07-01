import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import type { IconService } from '../icons.js'

interface TabOptions {
  alternate_style?: boolean
  icons?: IconService
}

interface ContentLine {
  shift: number
  text: string
}

const TAB_HEADER_RE = /^={3}\s+"([^"]+)"\s*$/

function lineText(state: StateBlock, line: number): string {
  const pos = state.bMarks[line] + state.tShift[line]
  const max = state.eMarks[line]
  return state.src.slice(pos, max)
}

function isTabHeader(state: StateBlock, line: number): boolean {
  return state.tShift[line] === 0 && TAB_HEADER_RE.test(lineText(state, line))
}

function tabLabel(state: StateBlock, line: number): string {
  const match = TAB_HEADER_RE.exec(lineText(state, line))
  return match?.[1] ?? ''
}

/** Unindented non-tab line ends the tab block (headings, paragraphs, etc.). */
function shouldEndTabBlock(state: StateBlock, line: number): boolean {
  if (line >= state.lineMax) return false
  if (state.tShift[line] !== 0) return false
  const text = lineText(state, line)
  if (text.trim() === '') return false
  return !TAB_HEADER_RE.test(text)
}

function skipBlankLines(state: StateBlock, line: number, endLine: number): number {
  while (line < endLine && lineText(state, line).trim() === '') line++
  return line
}

/** Preserve relative indentation when dedenting tab panel content for nested Markdown. */
function normalizeTabContent(lines: ContentLine[]): string {
  if (lines.length === 0) return ''

  const nonEmpty = lines.filter((l) => l.text.trim() !== '')
  const minShift = nonEmpty.length > 0 ? Math.min(...nonEmpty.map((l) => l.shift)) : 0

  return lines
    .map((line) => {
      if (line.text.trim() === '') return ''
      const pad = Math.max(0, line.shift - minShift)
      return `${' '.repeat(pad)}${line.text}`
    })
    .join('\n')
    .trimEnd()
}

export function contentTabsPlugin(md: MarkdownIt, options: TabOptions = {}): void {
  const alternate = options.alternate_style !== false
  const icons = options.icons

  md.block.ruler.before(
    'fence',
    'content_tabs',
    (state, startLine, endLine, silent) => {
      if (!isTabHeader(state, startLine)) return false
      if (silent) return true

      const tabs: { label: string; content: string }[] = []
      let line = startLine

      while (line < endLine && isTabHeader(state, line)) {
        const label = tabLabel(state, line)
        line++
        const contentLines: ContentLine[] = []

        while (line < endLine) {
          if (isTabHeader(state, line)) break
          if (shouldEndTabBlock(state, line)) break

          const text = lineText(state, line)
          if (text.trim() === '') {
            if (line + 1 >= endLine) break
            if (isTabHeader(state, line + 1)) break
            if (shouldEndTabBlock(state, line + 1)) break
            contentLines.push({ shift: state.tShift[line], text: '' })
            line++
            continue
          }

          contentLines.push({ shift: state.tShift[line], text })
          line++
        }

        tabs.push({ label, content: normalizeTabContent(contentLines) })

        line = skipBlankLines(state, line, endLine)
        if (line >= endLine || !isTabHeader(state, line)) break
      }

      if (tabs.length === 0) return false

      const wrapperClass = alternate ? 'tabbed-set tabbed-alternate' : 'tabbed-set'
      const tokenOpen = state.push('tabs_open', 'div', 1)
      tokenOpen.attrSet('class', wrapperClass)
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

  md.renderer.rules.tabs_open = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'tabbed-set'
    return `<div class="${cls}">\n`
  }
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
    const raw = tokens[idx].content ?? ''
    const labelHtml = icons
      ? icons.replaceShortcodes(md.utils.escapeHtml(raw))
      : md.utils.escapeHtml(raw)
    return `<label for="${forId}" class="tabbed-label">${labelHtml}</label>\n`
  }
  md.renderer.rules.tab_content = (tokens, idx) =>
    `<div class="tabbed-content">${md.render(tokens[idx].content)}</div>\n`
}
