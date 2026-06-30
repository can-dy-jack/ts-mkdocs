import type MarkdownIt from 'markdown-it'
import type { IconService } from '../icons.js'

const ADMONITION_TYPES = new Set([
  'note', 'abstract', 'info', 'tip', 'success', 'question',
  'warning', 'failure', 'danger', 'bug', 'example', 'quote',
])

const ADMONITION_RE = /^(!{3})([+-])?\s+(\w+)(?:\s+"([^"]*)")?\s*$/
const DETAILS_RE = /^(\?{3})([+-])?\s+(\w+)(?:\s+"([^"]*)")?\s*$/

const TOGGLE_SVG =
  '<svg class="admonition-toggle__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>'

export interface AdmonitionPluginOptions {
  icons?: IconService
  defaultCollapsed?: boolean
}

function resolveCollapsed(modifier: string | undefined, defaultCollapsed: boolean): boolean {
  if (modifier === '+') return false
  if (modifier === '-') return true
  return defaultCollapsed
}

function renderSummary(
  md: MarkdownIt,
  icons: IconService | undefined,
  type: string,
  rawTitle: string,
): string {
  const titleHtml = icons
    ? icons.replaceShortcodes(md.utils.escapeHtml(rawTitle))
    : md.utils.escapeHtml(rawTitle)
  const iconHtml = icons ? icons.getAdmonitionIcon(type) : ''
  const iconPart = iconHtml ? `<span class="admonition-icon">${iconHtml}</span>` : ''
  return `<summary class="admonition-title">
<span class="admonition-title__label">${iconPart}<span class="admonition-title__text">${titleHtml}</span></span>
<span class="admonition-toggle">${TOGGLE_SVG}</span>
</summary>\n`
}

function registerAdmonitionBlock(
  md: MarkdownIt,
  name: string,
  re: RegExp,
  validateType: boolean,
  defaultCollapsed: boolean,
  icons?: IconService,
): void {
  md.block.ruler.before(
    'fence',
    name,
    (state, startLine, endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const lineText = state.src.slice(pos, max)
      const match = re.exec(lineText)
      if (!match) return false
      if (silent) return true

      const modifier = match[2]
      const type = match[3].toLowerCase()
      if (validateType && !ADMONITION_TYPES.has(type)) return false
      const title = match[4] ?? type.charAt(0).toUpperCase() + type.slice(1)
      const collapsed = resolveCollapsed(modifier, defaultCollapsed)

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

      const tokenOpen = state.push(`${name}_open`, 'details', 1)
      tokenOpen.attrSet('class', `admonition ${type}`)
      tokenOpen.meta = { type, collapsed }
      tokenOpen.map = [startLine, nextLine]

      const tokenTitle = state.push(`${name}_summary`, 'summary', 0)
      tokenTitle.content = title
      tokenTitle.meta = { type }

      const tokenContent = state.push(`${name}_content`, 'div', 0)
      tokenContent.attrSet('class', 'admonition-content')
      tokenContent.content = contentLines.join('\n')

      state.push(`${name}_close`, 'details', -1)
      state.line = nextLine
      return true
    },
    { alt: ['paragraph', 'reference'] },
  )

  md.renderer.rules[`${name}_open`] = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition'
    const collapsed = Boolean(tokens[idx].meta?.collapsed)
    return `<details class="${cls}"${collapsed ? '' : ' open'}>\n`
  }
  md.renderer.rules[`${name}_close`] = () => '</details>\n'
  md.renderer.rules[`${name}_summary`] = (tokens, idx) => {
    const type = (tokens[idx].meta?.type as string) ?? ''
    return renderSummary(md, icons, type, tokens[idx].content ?? '')
  }
  md.renderer.rules[`${name}_content`] = (tokens, idx) => {
    const cls = tokens[idx].attrGet('class') ?? 'admonition-content'
    return `<div class="${cls}">${md.render(tokens[idx].content)}</div>\n`
  }
}

export function admonitionPlugin(md: MarkdownIt, opts: AdmonitionPluginOptions = {}): void {
  registerAdmonitionBlock(
    md,
    'admonition',
    ADMONITION_RE,
    true,
    opts.defaultCollapsed ?? false,
    opts.icons,
  )
}

/** Collapsible admonitions: ??? note "Title" */
export function detailsPlugin(md: MarkdownIt, opts: AdmonitionPluginOptions = {}): void {
  registerAdmonitionBlock(
    md,
    'details',
    DETAILS_RE,
    false,
    opts.defaultCollapsed ?? true,
    opts.icons,
  )
}
