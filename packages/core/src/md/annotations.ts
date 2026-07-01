import type { IconService } from '../icons.js'

const MAX_ANNOTATION_DEPTH = 8
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
])

/** Private-use markers used to smuggle code-block annotation ids through Shiki's HTML output. */
const PLACEHOLDER_OPEN = '\uE000'
const PLACEHOLDER_CLOSE = '\uE001'

// ---------------------------------------------------------------------------
// Fence info parsing
// ---------------------------------------------------------------------------

export interface FenceInfo {
  lang: string
  annotate: boolean
}

const BRACE_FENCE_RE = /^\{([^}]*)\}$/

function parseClassTokens(raw: string): FenceInfo {
  const tokens = raw.trim().split(/\s+/).filter(Boolean)
  let lang = ''
  let annotate = false
  for (const token of tokens) {
    const name = token.startsWith('.') ? token.slice(1) : token
    if (name === 'annotate') {
      annotate = true
    } else if (!lang) {
      lang = name
    }
  }
  return { lang, annotate }
}

/**
 * Parses `yaml` or `{ .yaml .annotate }` style fence info strings. When
 * `attr_list` (markdown-it-attrs) is also enabled, it consumes the brace
 * syntax before our fence renderer runs and moves it into `token.attrs`
 * instead (clearing `info`) — pass that resolved `class` attribute as
 * `attrClass` so the language/annotate flag can still be recovered.
 */
export function parseAnnotateFenceInfo(info: string, attrClass?: string | null): FenceInfo {
  const trimmed = (info || '').trim()
  const braceMatch = BRACE_FENCE_RE.exec(trimmed)
  if (braceMatch) return parseClassTokens(braceMatch[1])
  if (attrClass) return parseClassTokens(attrClass)
  return { lang: trimmed.split(/\s+/)[0] ?? '', annotate: false }
}

// ---------------------------------------------------------------------------
// Code block annotation markers (# (1)! style)
// ---------------------------------------------------------------------------

export interface CodeAnnotationMarker {
  line: number
  id: number
}

export interface ExtractedCodeAnnotations {
  code: string
  markers: CodeAnnotationMarker[]
}

/** A comment leader must immediately precede the marker to avoid matching ordinary `(N)` expressions in code. */
const TRAILING_MARKER_RE = /(#|\/\/|--|;|%)[ \t]*\((\d+)\)(!)?[ \t]*$/

/**
 * Strips trailing `(N)` / `(N)!` markers that follow a comment leader
 * (#, //, --, ;, %). `!` also removes the leader itself; without it, only
 * the digits (and surrounding parens/whitespace) are removed and the
 * leader is preserved so the line still reads as a comment.
 */
export function extractCodeAnnotations(code: string): ExtractedCodeAnnotations {
  const lines = code.split('\n')
  const markers: CodeAnnotationMarker[] = []

  const stripped = lines.map((rawLine, idx) => {
    const match = TRAILING_MARKER_RE.exec(rawLine)
    if (!match) return rawLine

    const id = parseInt(match[2], 10)
    const strip = match[3] === '!'
    const cut = strip ? match.index : match.index + match[1].length
    const line = rawLine.slice(0, cut)

    markers.push({ line: idx, id })
    return line.replace(/[ \t]+$/, '')
  })

  return { code: stripped.join('\n'), markers }
}

const LINE_SPAN_OPEN = '<span class="line">'

/**
 * Inserts placeholder tokens at the true end of each matching Shiki/plain
 * `<span class="line">` element. Highlighted lines usually contain several
 * nested `<span>` tokens, so the matching close tag must be found via
 * depth-aware scanning rather than a naive "first `</span>`" match.
 */
export function injectCodeAnnotationMarkers(html: string, markers: CodeAnnotationMarker[]): string {
  if (markers.length === 0) return html
  const byLine = new Map<number, number>()
  for (const marker of markers) byLine.set(marker.line, marker.id)

  let result = ''
  let cursor = 0
  let lineIndex = 0

  while (true) {
    const openStart = html.indexOf(LINE_SPAN_OPEN, cursor)
    if (openStart === -1) {
      result += html.slice(cursor)
      break
    }

    const openEnd = openStart + LINE_SPAN_OPEN.length
    const close = findMatchingCloseTag(html, 'span', openEnd)
    if (!close) {
      result += html.slice(cursor, openEnd)
      cursor = openEnd
      continue
    }

    const id = byLine.get(lineIndex)
    lineIndex++

    result += html.slice(cursor, openStart)
    result += html.slice(openStart, close.start)
    if (id !== undefined) result += `${PLACEHOLDER_OPEN}${id}${PLACEHOLDER_CLOSE}`
    result += html.slice(close.start, close.end)
    cursor = close.end
  }

  return result
}

/** Ensures the rendered code block has an `annotate` class so the generic post-processor can find its `<ol>`. */
export function ensureCodeAnnotateWrapper(html: string): string {
  if (html.startsWith('<div class="md-codeblock"')) {
    return html.replace('<div class="md-codeblock"', '<div class="md-codeblock annotate"')
  }
  return `<div class="annotate">${html.trimEnd()}</div>\n`
}

// ---------------------------------------------------------------------------
// Generic block/text annotations ({ .annotate } + trailing <ol>)
// ---------------------------------------------------------------------------

function hasAnnotateClass(attrs: string): boolean {
  const match = /class\s*=\s*"([^"]*)"|class\s*=\s*'([^']*)'/.exec(attrs)
  if (!match) return false
  const value = match[1] ?? match[2] ?? ''
  return value.split(/\s+/).includes('annotate')
}

interface OpenTagMatch {
  tagName: string
  matchStart: number
  matchEnd: number
}

function findNextAnnotateOpenTag(html: string, fromIndex: number): OpenTagMatch | null {
  const re = /<([a-zA-Z][\w-]*)\b([^>]*)>/g
  re.lastIndex = fromIndex
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const tagName = m[1].toLowerCase()
    if (VOID_TAGS.has(tagName)) continue
    if (hasAnnotateClass(m[2])) {
      return { tagName, matchStart: m.index, matchEnd: m.index + m[0].length }
    }
  }
  return null
}

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

function findNextOpenTagNamed(html: string, tagName: string, fromIndex: number): OpenTagMatch | null {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'i')
  const slice = html.slice(fromIndex)
  const m = re.exec(slice)
  if (!m) return null
  const matchStart = fromIndex + m.index
  return { tagName, matchStart, matchEnd: matchStart + m[0].length }
}

function parseListItems(olInnerHtml: string): string[] {
  const items: string[] = []
  let cursor = 0
  while (true) {
    const open = findNextOpenTagNamed(olInnerHtml, 'li', cursor)
    if (!open) break
    const close = findMatchingCloseTag(olInnerHtml, 'li', open.matchEnd)
    if (!close) break
    items.push(olInnerHtml.slice(open.matchEnd, close.start))
    cursor = close.end
  }
  return items
}

const ANNOTATION_LIST_RE = /<ol class="md-annotation-list" hidden>[\s\S]*?<\/ol>/gi

/** Block wrappers are invalid inside inline tooltip markup; use spans instead. */
function normalizeBlockAnnotateWrappers(html: string): string {
  return html.replace(/<div(\s+class="annotate"[^>]*)>([\s\S]*?)<\/div>/gi, '<span$1>$2</span>')
}

/** Tooltip bodies must not include print-fallback lists produced while resolving nested annotations. */
function annotationTooltipContent(html: string): string {
  return normalizeBlockAnnotateWrappers(html.replace(ANNOTATION_LIST_RE, '').trim())
}

function buildMarkerHtml(id: number, tooltipContent: string, iconHtml: string): string {
  return (
    `<span class="md-annotation" data-md-annotation-id="${id}">` +
    `<span class="md-annotation__index" tabindex="0" role="button" aria-expanded="false">` +
    `${iconHtml}<span class="md-visually-hidden">${id}</span>` +
    `</span>` +
    `<span class="md-annotation__tooltip" role="tooltip">` +
    `<span class="md-annotation__tooltip-inner">${tooltipContent}</span>` +
    `</span>` +
    `</span>`
  )
}

const PLACEHOLDER_RE = new RegExp(`${PLACEHOLDER_OPEN}(\\d+)${PLACEHOLDER_CLOSE}`, 'g')
const PLACEHOLDER_STRIP_RE = new RegExp(`${PLACEHOLDER_OPEN}\\d+${PLACEHOLDER_CLOSE}`, 'g')
const PAREN_MARKER_RE = /\((\d+)\)/g
const CODE_OR_PRE_TAG_RE = /^<\/?(code|pre)\b/i

function substituteMarkers(innerHtml: string, liContents: string[], iconHtml: string): string {
  let out = innerHtml.replace(PLACEHOLDER_RE, (match, idStr: string) => {
    const id = parseInt(idStr, 10)
    const content = liContents[id - 1]
    return content === undefined ? '' : buildMarkerHtml(id, content, iconHtml)
  })

  const parts = out.split(/(<[^>]+>)/g)
  let codeDepth = 0
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue
    if (part.startsWith('<')) {
      if (CODE_OR_PRE_TAG_RE.test(part)) {
        if (part.startsWith('</')) codeDepth = Math.max(0, codeDepth - 1)
        else if (!part.endsWith('/>')) codeDepth++
      }
      continue
    }
    if (codeDepth > 0) continue
    parts[i] = part.replace(PAREN_MARKER_RE, (match, numStr: string) => {
      const id = parseInt(numStr, 10)
      const content = liContents[id - 1]
      return content === undefined ? match : buildMarkerHtml(id, content, iconHtml)
    })
  }
  return parts.join('')
}

/**
 * markdown-it-attrs promotes a `{ .annotate }` attribute placed under a list
 * item to the *enclosing* `<ol>`/`<ul>` rather than that specific `<li>`. In
 * that case the annotation list ends up nested at the tail of the block
 * (`<li>marker text<ol>...</ol></li>`) instead of as a sibling after it.
 * This finds that trailing nested `<ol>`, if any.
 */
function findTrailingNestedOl(
  blockInnerHtml: string,
): { before: string; olOpenEnd: number; olClose: CloseTagMatch; after: string } | null {
  let searchFrom = 0
  let candidate: OpenTagMatch | null = null
  while (true) {
    const open = findNextOpenTagNamed(blockInnerHtml, 'ol', searchFrom)
    if (!open) break
    candidate = open
    searchFrom = open.matchEnd
  }
  if (!candidate) return null

  const close = findMatchingCloseTag(blockInnerHtml, 'ol', candidate.matchEnd)
  if (!close) return null

  const after = blockInnerHtml.slice(close.end)
  if (!/^(\s*<\/[a-zA-Z][\w-]*>)*\s*$/.test(after)) return null

  return { before: blockInnerHtml.slice(0, candidate.matchStart), olOpenEnd: candidate.matchEnd, olClose: close, after }
}

/**
 * Resolves `{ .annotate }` blocks + trailing ordered lists into clickable
 * annotation markers with popover tooltips. Operates on the fully rendered
 * HTML string so that nested content (admonitions, tabs, code blocks) is
 * already inlined. Recurses into list items to support nested annotations.
 */
export function processTextAnnotations(html: string, icons: IconService, depth = 0): string {
  if (depth > MAX_ANNOTATION_DEPTH) return html

  const iconHtml = icons.getAnnotationIcon()
  let result = ''
  let cursor = 0

  while (true) {
    const tag = findNextAnnotateOpenTag(html, cursor)
    if (!tag) {
      result += html.slice(cursor)
      break
    }

    const close = findMatchingCloseTag(html, tag.tagName, tag.matchEnd)
    if (!close) {
      result += html.slice(cursor, tag.matchEnd)
      cursor = tag.matchEnd
      continue
    }

    const blockOpenTag = html.slice(tag.matchStart, tag.matchEnd)
    const blockInnerHtml = html.slice(tag.matchEnd, close.start)
    const blockCloseTag = html.slice(close.start, close.end)

    const afterBlock = html.slice(close.end)
    const leadingWs = /^\s*/.exec(afterBlock)![0]
    const olStartsAt = close.end + leadingWs.length

    let processedInner = blockInnerHtml
    let trailer = ''
    let consumedEnd = close.end

    if (/^<ol\b/i.test(html.slice(olStartsAt))) {
      const olOpenMatch = /^<ol\b[^>]*>/i.exec(html.slice(olStartsAt))!
      const olOpenEnd = olStartsAt + olOpenMatch[0].length
      const olClose = findMatchingCloseTag(html, 'ol', olOpenEnd)
      if (olClose) {
        const olInnerHtml = html.slice(olOpenEnd, olClose.start)
        const rawItems = parseListItems(olInnerHtml)
        const liContents = rawItems.map((item) => processTextAnnotations(item, icons, depth + 1))
        const tooltipContents = liContents.map(annotationTooltipContent)
        processedInner = substituteMarkers(blockInnerHtml, tooltipContents, iconHtml)
        trailer =
          leadingWs +
          `<ol class="md-annotation-list" hidden>` +
          liContents.map((c) => `<li>${c}</li>`).join('') +
          `</ol>`
        consumedEnd = olClose.end
      }
    } else {
      const nested = findTrailingNestedOl(blockInnerHtml)
      if (nested) {
        const olInnerHtml = blockInnerHtml.slice(nested.olOpenEnd, nested.olClose.start)
        const rawItems = parseListItems(olInnerHtml)
        const liContents = rawItems.map((item) => processTextAnnotations(item, icons, depth + 1))
        const tooltipContents = liContents.map(annotationTooltipContent)
        const hiddenOl =
          `<ol class="md-annotation-list" hidden>` + liContents.map((c) => `<li>${c}</li>`).join('') + `</ol>`
        processedInner = substituteMarkers(nested.before, tooltipContents, iconHtml) + hiddenOl + nested.after
      }
    }

    // No matching list (or a code block whose markers never got claimed): drop any
    // leftover placeholder tokens so private-use characters never leak into the output.
    processedInner = processedInner.replace(PLACEHOLDER_STRIP_RE, '')

    result += html.slice(cursor, tag.matchStart)
    result += blockOpenTag + processedInner + blockCloseTag + trailer
    cursor = consumedEnd
  }

  return result
}
