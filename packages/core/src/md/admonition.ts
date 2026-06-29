import type MarkdownIt from 'markdown-it'
import type { IconService } from '../icons.js'

const ADMONITION_TYPES = new Set([
  'note', 'abstract', 'info', 'tip', 'success', 'question',
  'warning', 'failure', 'danger', 'bug', 'example', 'quote',
])

export function admonitionPlugin(md: MarkdownIt, icons?: IconService): void {
  const admonitionRe = /^(!{3})\s+(\w+)(?:\s+"([^"]*)")?\s*$/

  md.block.ruler.before(
    'fence',
    'admonition',
    (state, startLine, endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const lineText = state.src.slice(pos, max)
      const match = admonitionRe.exec(lineText)
      if (!match) return false
      if (silent) return true

      const type = match[2].toLowerCase()
      if (!ADMONITION_TYPES.has(type)) return false
      const title = match[3] ?? type.charAt(0).toUpperCase() + type.slice(1)

      let nextLine = startLine + 1
      while (nextLine < endLine) {
        const linePos = state.bMarks[nextLine] + state.tShift[nextLine]
        const lineMax = state.eMarks[nextLine]
        const line = state.src.slice(linePos, lineMax)
        if (state.tShift[nextLine] < 4 && line.trim() !== '') break
        nextLine++
      }

      const contentLines: string[] = []
      for (let i = startLine + 1; i < nextLine; i++) {
        const linePos = state.bMarks[i] + state.tShift[i]
        const lineMax = state.eMarks[i]
        contentLines.push(state.src.slice(linePos, lineMax).replace(/^ {4}/, ''))
      }

      const tokenOpen = state.push('admonition_open', 'div', 1)
      tokenOpen.attrSet('class', `admonition ${type}`)
      tokenOpen.meta = { type }
      tokenOpen.map = [startLine, nextLine]

      const tokenTitle = state.push('admonition_title', 'p', 0)
      tokenTitle.attrSet('class', 'admonition-title')
      tokenTitle.content = title
      tokenTitle.meta = { type }

      const tokenContent = state.push('admonition_content', 'div', 0)
      tokenContent.attrSet('class', 'admonition-content')
      tokenContent.content = contentLines.join('\n')

      state.push('admonition_close', 'div', -1)
      state.line = nextLine
      return true
    },
    { alt: ['paragraph', 'reference'] },
  )

  md.renderer.rules.admonition_open = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition'
    return `<div class="${cls}">\n`
  }
  md.renderer.rules.admonition_close = () => '</div>\n'
  md.renderer.rules.admonition_title = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition-title'
    const type = (tokens[idx].meta?.type as string) ?? ''
    const rawTitle = tokens[idx].content ?? ''
    const titleHtml = icons ? icons.replaceShortcodes(md.utils.escapeHtml(rawTitle)) : md.utils.escapeHtml(rawTitle)
    const iconHtml = icons ? icons.getAdmonitionIcon(type) : ''
    const iconPart = iconHtml ? `<span class="admonition-icon">${iconHtml}</span>` : ''
    return `<p class="${cls}">${iconPart}${titleHtml}</p>\n`
  }
  md.renderer.rules.admonition_content = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition-content'
    return `<div class="${cls}">${md.render(tokens[idx].content)}</div>\n`
  }
}

/** Collapsible admonitions: ??? note "Title" */
export function detailsPlugin(md: MarkdownIt, icons?: IconService): void {
  const detailsRe = /^(\?{3})\s+(\w+)(?:\s+"([^"]*)")?\s*$/

  md.block.ruler.before(
    'fence',
    'details',
    (state, startLine, endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const lineText = state.src.slice(pos, max)
      const match = detailsRe.exec(lineText)
      if (!match) return false
      if (silent) return true

      const type = match[2].toLowerCase()
      const title = match[3] ?? type.charAt(0).toUpperCase() + type.slice(1)

      let nextLine = startLine + 1
      while (nextLine < endLine) {
        const linePos = state.bMarks[nextLine] + state.tShift[nextLine]
        const lineMax = state.eMarks[nextLine]
        const line = state.src.slice(linePos, lineMax)
        if (state.tShift[nextLine] < 4 && line.trim() !== '') break
        nextLine++
      }

      const contentLines: string[] = []
      for (let i = startLine + 1; i < nextLine; i++) {
        const linePos = state.bMarks[i] + state.tShift[i]
        const lineMax = state.eMarks[i]
        contentLines.push(state.src.slice(linePos, lineMax).replace(/^ {4}/, ''))
      }

      const tokenOpen = state.push('details_open', 'details', 1)
      tokenOpen.attrSet('class', `admonition ${type}`)
      tokenOpen.meta = { type }
      tokenOpen.map = [startLine, nextLine]

      const tokenSummary = state.push('details_summary', 'summary', 0)
      tokenSummary.content = title
      tokenSummary.meta = { type }

      const tokenContent = state.push('details_content', 'div', 0)
      tokenContent.attrSet('class', 'admonition-content')
      tokenContent.content = contentLines.join('\n')

      state.push('details_close', 'details', -1)
      state.line = nextLine
      return true
    },
    { alt: ['paragraph', 'reference'] },
  )

  md.renderer.rules.details_open = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition'
    return `<details class="${cls}">\n`
  }
  md.renderer.rules.details_close = () => '</details>\n'
  md.renderer.rules.details_summary = (tokens, idx) => {
    const type = (tokens[idx].meta?.type as string) ?? ''
    const rawTitle = tokens[idx].content ?? ''
    const titleHtml = icons ? icons.replaceShortcodes(md.utils.escapeHtml(rawTitle)) : md.utils.escapeHtml(rawTitle)
    const iconHtml = icons ? icons.getAdmonitionIcon(type) : ''
    const iconPart = iconHtml ? `<span class="admonition-icon">${iconHtml}</span>` : ''
    return `<summary class="admonition-title">${iconPart}${titleHtml}</summary>\n`
  }
  md.renderer.rules.details_content = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition-content'
    return `<div class="${cls}">${md.render(tokens[idx].content)}</div>\n`
  }
}
