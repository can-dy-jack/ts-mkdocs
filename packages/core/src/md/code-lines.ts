import {
  type CodeHighlightThemes,
  renderPlainCodeHtml,
  renderShikiHtml,
} from './code-highlight.js'

// ---------------------------------------------------------------------------
// hl_lines parsing
// ---------------------------------------------------------------------------

const FENCE_HL_LINES_RE = /\bhl_lines\s*=\s*(?:"([^"]*)"|'([^']*)')/

/** Parse `hl_lines="1 3-5"` from fence info or attr_list. Returns 1-based line numbers. */
export function parseHlLines(info: string, attrHlLines?: string | null): Set<number> {
  const fromAttr = attrHlLines?.trim()
  const match = fromAttr ? null : FENCE_HL_LINES_RE.exec(info)
  const raw = fromAttr || (match?.[1] ?? match?.[2])
  if (!raw) return new Set()

  const lines = new Set<number>()
  for (const part of raw.split(/\s+/).filter(Boolean)) {
    const range = part.split('-').map((n) => parseInt(n, 10))
    if (range.length === 2 && !Number.isNaN(range[0]) && !Number.isNaN(range[1])) {
      const [start, end] = range[0] <= range[1] ? range : [range[1], range[0]]
      for (let i = start; i <= end; i++) lines.add(i)
    } else {
      const n = parseInt(part, 10)
      if (!Number.isNaN(n)) lines.add(n)
    }
  }
  return lines
}

/** Remove `hl_lines="..."` tokens from fence info before language parsing. */
export function stripFenceHlLines(info: string): string {
  return info.replace(FENCE_HL_LINES_RE, '').replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// Line span HTML manipulation
// ---------------------------------------------------------------------------

const LINE_SPAN_RE = /<span class="line([^"]*)">/g

interface CloseTagMatch {
  start: number
  end: number
}

function findMatchingCloseTag(html: string, tagName: string, fromIndex: number): CloseTagMatch | null {
  const re = new RegExp(`<(/?)${tagName}\\b[^>]*?(/?)>`, 'gi')
  re.lastIndex = fromIndex
  let depth = 1
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const isClose = m[1] === '/'
    const selfClosing = !isClose && m[2] === '/'
    if (selfClosing) continue
    if (isClose) {
      depth--
      if (depth === 0) return { start: m.index, end: m.index + m[0].length }
    } else {
      depth++
    }
  }
  return null
}

function findNextLineOpen(html: string, fromIndex: number): { start: number; end: number; extraClasses: string } | null {
  LINE_SPAN_RE.lastIndex = fromIndex
  const m = LINE_SPAN_RE.exec(html)
  if (!m) return null
  return { start: m.index, end: m.index + m[0].length, extraClasses: m[1] }
}

/** Add classes to specific 1-based line numbers in Shiki/plain code HTML. */
export function injectLineClasses(html: string, lineClasses: Map<number, string[]>): string {
  if (lineClasses.size === 0) return html

  let result = ''
  let cursor = 0
  let lineIndex = 0

  while (true) {
    const open = findNextLineOpen(html, cursor)
    if (!open) {
      result += html.slice(cursor)
      break
    }

    const close = findMatchingCloseTag(html, 'span', open.end)
    if (!close) {
      result += html.slice(cursor, open.end)
      cursor = open.end
      continue
    }

    const lineNum = lineIndex + 1
    const classes = lineClasses.get(lineNum)
    lineIndex++

    result += html.slice(cursor, open.start)
    if (classes?.length) {
      const parts = ['line', open.extraClasses.trim(), ...classes].filter(Boolean)
      result += `<span class="${parts.join(' ')}">`
    } else {
      result += html.slice(open.start, open.end)
    }

    result += html.slice(open.end, close.start)
    result += html.slice(close.start, close.end)
    cursor = close.end
  }

  return result
}

/** Highlight specific 1-based lines with the `hll` class. */
export function injectHlLines(html: string, hlLines: Set<number>): string {
  if (hlLines.size === 0) return html
  const map = new Map<number, string[]>()
  for (const n of hlLines) map.set(n, ['hll'])
  return injectLineClasses(html, map)
}

// ---------------------------------------------------------------------------
// Diff parsing & rendering
// ---------------------------------------------------------------------------

export interface DiffLangInfo {
  isDiff: boolean
  lang?: string
}

const DIFF_LANG_RE = /^diff(?:-(.+))?$/

/** Recognize `diff`, `diff-python`, `diff-typescript`, etc. */
export function parseDiffLang(lang: string): DiffLangInfo {
  const match = DIFF_LANG_RE.exec(lang.trim())
  if (!match) return { isDiff: false }
  return { isDiff: true, lang: match[1] || undefined }
}

export type DiffLineType = 'add' | 'del' | 'context'

export interface DiffLine {
  prefix: string
  content: string
  type: DiffLineType
}

/** Parse unified-diff style +/- prefixes on each line. */
export function parseDiffLines(code: string): DiffLine[] {
  return code.replace(/\n+$/, '').split('\n').map((raw) => {
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      return { prefix: '+', content: raw.slice(1), type: 'add' as const }
    }
    if (raw.startsWith('-') && !raw.startsWith('---')) {
      return { prefix: '-', content: raw.slice(1), type: 'del' as const }
    }
    if (raw.startsWith(' ')) {
      return { prefix: ' ', content: raw.slice(1), type: 'context' as const }
    }
    return { prefix: '', content: raw, type: 'context' as const }
  })
}

function diffClassForType(type: DiffLineType): string | undefined {
  if (type === 'add') return 'gi'
  if (type === 'del') return 'gd'
  return undefined
}

/** Prepend diff marker text to the inner HTML of a line span. */
function prependDiffMarker(innerHtml: string, prefix: string, escape: (s: string) => string): string {
  if (!prefix) return innerHtml
  return `${escape(prefix)}${innerHtml}`
}

/** Inject diff classes and +/- prefixes into rendered line HTML. */
export function applyDiffLineDecorations(
  html: string,
  diffLines: DiffLine[],
  escape: (s: string) => string,
): string {
  let result = ''
  let cursor = 0
  let lineIndex = 0

  while (lineIndex < diffLines.length) {
    const open = findNextLineOpen(html, cursor)
    if (!open) break

    const close = findMatchingCloseTag(html, 'span', open.end)
    if (!close) break

    const diffLine = diffLines[lineIndex]
    const diffClass = diffClassForType(diffLine.type)

    result += html.slice(cursor, open.start)
    if (diffClass) {
      const parts = ['line', open.extraClasses.trim(), diffClass].filter(Boolean)
      result += `<span class="${parts.join(' ')}">`
    } else {
      result += html.slice(open.start, open.end)
    }

    const inner = html.slice(open.end, close.start)
    result += prependDiffMarker(inner, diffLine.prefix, escape)
    result += html.slice(close.start, close.end)
    cursor = close.end
    lineIndex++
  }

  result += html.slice(cursor)
  return result
}

export function renderDiffCodeHtml(
  highlighter: { codeToHtml: (code: string, opts: Record<string, unknown>) => string } | null,
  code: string,
  diffLang: DiffLangInfo,
  themes: CodeHighlightThemes,
  options: {
    escape: (value: string) => string
    langLabel?: boolean
    title?: string
    locale?: string
    displayLang?: string
  },
): string {
  const { escape, langLabel, title, locale, displayLang } = options
  const diffLines = parseDiffLines(code)
  const strippedCode = diffLines.map((l) => l.content).join('\n')
  const underlyingLang = diffLang.lang
  const labelLang = displayLang || (underlyingLang ? `diff-${underlyingLang}` : 'diff')

  let html: string | null = null

  if (underlyingLang && highlighter) {
    try {
      html = renderShikiHtml(highlighter, strippedCode, underlyingLang, themes, {
        langLabel,
        title,
        escape,
        locale,
        headLang: labelLang,
      })
    } catch {
      html = null
    }
  }

  if (html === null && highlighter) {
    try {
      html = renderShikiHtml(highlighter, strippedCode, 'diff', themes, {
        langLabel,
        title,
        escape,
        locale,
        headLang: labelLang,
      })
    } catch {
      html = null
    }
  }

  if (html === null) {
    html = renderPlainCodeHtml(strippedCode, escape, {
      lineNumbers: true,
      lang: labelLang,
      langLabel,
      title,
      locale,
    })
  }

  return applyDiffLineDecorations(html, diffLines, escape)
}
