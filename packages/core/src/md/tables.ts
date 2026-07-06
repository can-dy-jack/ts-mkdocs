import type MarkdownIt from 'markdown-it'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'

const SPAN_RE = /@span(?:=\d+(?::\d+)?)?/
const SPAN_INLINE_RE = /^@span(?:=(\d+)(?::(\d+))?)?(?![\w-])/
const WIDTH_ATTR_RE = /\{:\s*width\s*=\s*([^}\s]+)\s*\}/i
const ATTR_BLOCK_RE = /\{:[^}]*\}/g

interface TableCell {
  open: Token
  inline: Token
  close: Token
  openIndex: number
  inlineIndex: number
  closeIndex: number
  row: number
  col: number
}

interface SpanInfo {
  colspan: number
  rowspan: number
  skip: boolean
}

function inlinePlainText(inline: Token): string {
  if (!inline.children?.length) return inline.content
  return inline.children
    .filter((child) => child.type === 'text')
    .map((child) => child.content)
    .join('')
}

function stripFromInline(inline: Token, pattern: RegExp): void {
  if (!inline.children?.length) {
    inline.content = inline.content.replace(pattern, '').trimEnd()
    return
  }

  for (const child of inline.children) {
    if (child.type !== 'text') continue
    child.content = child.content.replace(pattern, '').trimEnd()
  }

  inline.children = inline.children.filter((child) => child.type !== 'text' || child.content.length > 0)
}

function stripSpanMarkup(inline: Token): void {
  stripFromInline(inline, SPAN_RE)
  stripFromInline(inline, ATTR_BLOCK_RE)
  stripFromInline(inline, /^=\d+(?::\d+)?$/)

  if (!inline.children?.length) return

  const cleaned: Token[] = []
  for (let i = 0; i < inline.children.length; i++) {
    const child = inline.children[i]
    if (child.type === 'link_open' && inline.children[i + 1]?.type === 'text' && inline.children[i + 2]?.type === 'link_close') {
      const linkText = inline.children[i + 1].content
      if (linkText === '@span' || linkText.startsWith('@span')) {
        i += 2
        continue
      }
    }
    if (child.type === 'text') {
      child.content = child.content.replace(/^=\d+(?::\d+)?$/, '').trimEnd()
      if (!child.content) continue
    }
    cleaned.push(child)
  }

  inline.children = cleaned
}

function getAttr(token: Token, name: string): string | undefined {
  if (!token.attrs) return undefined
  const entry = token.attrs.find(([key]) => key === name)
  return entry?.[1]
}

function setAttr(token: Token, name: string, value: string): void {
  const idx = token.attrIndex(name)
  if (idx >= 0) token.attrs![idx][1] = value
  else token.attrPush([name, value])
}

function removeAttr(token: Token, name: string): void {
  if (!token.attrs) return
  token.attrs = token.attrs.filter(([key]) => key !== name)
}

function cleanCellAttrs(token: Token): void {
  removeAttr(token, ':')
}

function parseWidth(inline: Token, open: Token): string | undefined {
  const fromAttr = getAttr(open, 'width')
  if (fromAttr) return fromAttr

  const match = WIDTH_ATTR_RE.exec(inlinePlainText(inline))
  return match?.[1]
}

function autoColspan(values: string[], startIndex: number): number {
  let span = 1
  for (let i = startIndex; i < values.length; i++) {
    if (!values[i].trim()) span++
    else break
  }
  return span
}

function autoRowspan(rows: string[][], rowIndex: number, colStart: number, colSpan: number): number {
  let span = 1
  for (let i = rowIndex + 1; i < rows.length; i++) {
    const slice = rows[i].slice(colStart, colStart + colSpan)
    if (slice.every((value) => !value.trim())) span++
    else break
  }
  return span
}

function computeSpanMatrix(
  rows: string[][],
  attrGrid: Array<Array<{ colspan: number; rowspan: number }>>,
): SpanInfo[][] {
  const matrix: SpanInfo[][] = rows.map((row) =>
    row.map(() => ({ colspan: 1, rowspan: 1, skip: false })),
  )

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    for (let colIndex = 0; colIndex < rows[rowIndex].length; colIndex++) {
      if (matrix[rowIndex][colIndex].skip) continue

      const value = rows[rowIndex][colIndex]
      const attrSpan = attrGrid[rowIndex][colIndex]
      const spanMatch = value.match(/@span(?:=(\d+)(?::(\d+))?)?/)
      let colspan = 1
      let rowspan = 1

      if (spanMatch) {
        if (spanMatch[1] === undefined) {
          colspan = autoColspan(rows[rowIndex], colIndex + 1)
          rowspan = autoRowspan(rows, rowIndex, colIndex, colspan)
        } else {
          colspan = Math.max(parseInt(spanMatch[1], 10), 1)
          rowspan = Math.max(parseInt(spanMatch[2] || '1', 10), 1)
        }
      } else if (attrSpan.colspan > 1 || attrSpan.rowspan > 1) {
        colspan = attrSpan.colspan
        rowspan = attrSpan.rowspan
      } else {
        continue
      }

      for (let y = 0; y < rowspan; y++) {
        for (let x = 0; x < colspan; x++) {
          const targetRow = rowIndex + y
          const targetCol = colIndex + x
          if (targetRow >= rows.length || targetCol >= rows[targetRow].length) continue
          if (y === 0 && x === 0) {
            matrix[targetRow][targetCol] = { colspan, rowspan, skip: false }
          } else {
            matrix[targetRow][targetCol] = { colspan: 1, rowspan: 1, skip: true }
          }
        }
      }
    }
  }

  return matrix
}

function collectTableCells(tokens: Token[], tableStart: number, tableEnd: number): TableCell[] {
  const cells: TableCell[] = []
  let row = -1
  let col = -1

  for (let i = tableStart + 1; i < tableEnd; i++) {
    const token = tokens[i]
    if (token.type === 'thead_open' || token.type === 'tbody_open' || token.type === 'thead_close' || token.type === 'tbody_close') {
      continue
    }
    if (token.type === 'tr_open') {
      row++
      col = -1
      continue
    }
    if (token.type === 'tr_close') continue

    if (token.type === 'th_open' || token.type === 'td_open') {
      col++
      const inline = tokens[i + 1]
      const close = tokens[i + 2]
      if (inline?.type === 'inline' && (close?.type === 'th_close' || close?.type === 'td_close')) {
        cells.push({
          open: token,
          inline,
          close,
          openIndex: i,
          inlineIndex: i + 1,
          closeIndex: i + 2,
          row,
          col,
        })
      }
    }
  }

  return cells
}

function processTable(tokens: Token[], tableStart: number, tableEnd: number): void {
  const cells = collectTableCells(tokens, tableStart, tableEnd)
  if (!cells.length) return

  const colCount = Math.max(...cells.map((cell) => cell.col)) + 1
  const rowCount = Math.max(...cells.map((cell) => cell.row)) + 1
  const grid: string[][] = Array.from({ length: rowCount }, () => Array(colCount).fill(''))
  const attrGrid: Array<Array<{ colspan: number; rowspan: number }>> = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ colspan: 1, rowspan: 1 })),
  )

  for (const cell of cells) {
    const text = cell.inline.content.trim()
    grid[cell.row][cell.col] = text
    attrGrid[cell.row][cell.col] = {
      colspan: Math.max(parseInt(getAttr(cell.open, 'colspan') || '1', 10), 1),
      rowspan: Math.max(parseInt(getAttr(cell.open, 'rowspan') || '1', 10), 1),
    }
  }

  const spanMatrix = computeSpanMatrix(grid, attrGrid)
  const headerWidths: string[] = []
  const removeIndices = new Set<number>()

  for (const cell of cells) {
    const span = spanMatrix[cell.row]?.[cell.col]
    if (!span) continue

    if (cell.row === 0 && cell.open.type === 'th_open') {
      const width = parseWidth(cell.inline, cell.open)
      if (width) {
        headerWidths[cell.col] = width
        const existingStyle = getAttr(cell.open, 'style')
        const widthStyle = `width: ${width}`
        setAttr(cell.open, 'style', existingStyle ? `${existingStyle}; ${widthStyle}` : widthStyle)
      }
    }

    cleanCellAttrs(cell.open)
    stripSpanMarkup(cell.inline)
    removeAttr(cell.open, 'width')

    if (span.skip) {
      removeIndices.add(cell.openIndex)
      removeIndices.add(cell.inlineIndex)
      removeIndices.add(cell.closeIndex)
      continue
    }

    if (span.colspan > 1) setAttr(cell.open, 'colspan', String(span.colspan))
    if (span.rowspan > 1) setAttr(cell.open, 'rowspan', String(span.rowspan))
  }

  if (headerWidths.some(Boolean)) {
    tokens[tableStart].meta = { ...(tokens[tableStart].meta ?? {}), colWidths: headerWidths }
  }

  if (removeIndices.size) {
    const filtered = tokens.filter((_, index) => !removeIndices.has(index))
    tokens.length = 0
    tokens.push(...filtered)
  }
}

function enhanceTables(state: StateCore): void {
  const { tokens } = state

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].type !== 'table_open') continue

    const tableStart = i
    let tableEnd = i
    for (let j = i + 1; j < tokens.length; j++) {
      if (tokens[j].type === 'table_close') {
        tableEnd = j
        break
      }
    }

    processTable(tokens, tableStart, tableEnd)
  }
}

export function tablesPlugin(md: MarkdownIt): void {
  // Registered after magiclink so this runs before mention/link rules on `@`.
  const guardSpan = (state: StateInline, silent: boolean): boolean => {
    if (state.src.charCodeAt(state.pos) !== 0x40 /* @ */) return false
    const match = SPAN_INLINE_RE.exec(state.src.slice(state.pos))
    if (!match) return false
    if (silent) return true
    const token = state.push('text', '', 0)
    token.content = match[0]
    state.pos += match[0].length
    return true
  }

  if (md.inline.ruler.__find__('magiclink-mention') >= 0) {
    md.inline.ruler.before('magiclink-mention', 'table-span-guard', guardSpan)
  } else {
    md.inline.ruler.before('text', 'table-span-guard', guardSpan)
  }
  // Run after markdown-it-attrs tbody/colspan handling — otherwise attrs hides
  // legitimate cells when we set colspan from @span syntax.
  if (md.core.ruler.__find__('curly_attributes') >= 0) {
    md.core.ruler.after('curly_attributes', 'table_enhance', enhanceTables)
  } else {
    md.core.ruler.before('linkify', 'table_enhance', enhanceTables)
  }

  const defaultTableOpen = md.renderer.rules.table_open
  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    const colWidths = tokens[idx].meta?.colWidths as string[] | undefined
    const base = defaultTableOpen
      ? defaultTableOpen(tokens, idx, options, env, self)
      : '<table>\n'

    if (!colWidths?.some(Boolean)) return base

    const cols = colWidths
      .map((width) => (width ? `  <col style="width: ${md.utils.escapeHtml(width)}">` : '  <col>'))
      .join('\n')

    return base.replace('<table>', `<table>\n<colgroup>\n${cols}\n</colgroup>`)
  }
}
