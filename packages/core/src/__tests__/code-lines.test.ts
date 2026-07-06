import { describe, expect, it, beforeAll } from 'vitest'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { createHighlighter, type Highlighter } from 'shiki'
import { superfencesPlugin } from '../md/superfences.js'
import {
  applyDiffLineDecorations,
  injectHlLines,
  injectLineClasses,
  parseDiffLang,
  parseDiffLines,
  parseHlLines,
  renderDiffCodeHtml,
  stripFenceHlLines,
} from '../md/code-lines.js'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

describe('parseHlLines', () => {
  it('parses individual lines and ranges (1-based)', () => {
    expect(parseHlLines('python hl_lines="1 3-5"')).toEqual(new Set([1, 3, 4, 5]))
  })

  it('prefers attr_list hl_lines over fence info', () => {
    expect(parseHlLines('python hl_lines="9"', '2 4')).toEqual(new Set([2, 4]))
  })

  it('returns empty set when absent', () => {
    expect(parseHlLines('python')).toEqual(new Set())
  })
})

describe('stripFenceHlLines', () => {
  it('removes hl_lines from fence info', () => {
    expect(stripFenceHlLines('python hl_lines="2 3"')).toBe('python')
    expect(stripFenceHlLines('{ .python hl_lines="1" .annotate }')).toBe('{ .python .annotate }')
  })
})

describe('injectHlLines', () => {
  it('adds hll class to matching lines', () => {
    const html =
      '<pre><code>' +
      '<span class="line">a</span>\n' +
      '<span class="line">b</span>\n' +
      '<span class="line">c</span>' +
      '</code></pre>'
    const out = injectHlLines(html, new Set([2]))
    expect(out).toContain('<span class="line">a</span>')
    expect(out).toContain('<span class="line hll">b</span>')
    expect(out).toContain('<span class="line">c</span>')
  })
})

describe('injectLineClasses', () => {
  it('merges multiple classes onto existing line classes', () => {
    const html = '<pre><code><span class="line gi">x</span></code></pre>'
    const map = new Map([[1, ['hll']]])
    const out = injectLineClasses(html, map)
    expect(out).toContain('<span class="line gi hll">')
  })
})

describe('parseDiffLang', () => {
  it('recognizes diff and diff-lang variants', () => {
    expect(parseDiffLang('diff')).toEqual({ isDiff: true, lang: undefined })
    expect(parseDiffLang('diff-python')).toEqual({ isDiff: true, lang: 'python' })
    expect(parseDiffLang('typescript')).toEqual({ isDiff: false })
  })
})

describe('parseDiffLines', () => {
  it('classifies add, delete, and context lines', () => {
    const lines = parseDiffLines('- old\n+ new\n  ctx\nplain')
    expect(lines[0]).toEqual({ prefix: '-', content: ' old', type: 'del' })
    expect(lines[1]).toEqual({ prefix: '+', content: ' new', type: 'add' })
    expect(lines[2]).toEqual({ prefix: ' ', content: ' ctx', type: 'context' })
    expect(lines[3]).toEqual({ prefix: '', content: 'plain', type: 'context' })
  })

  it('does not treat --- / +++ headers as diff lines', () => {
    const lines = parseDiffLines('--- a.txt\n+++ b.txt')
    expect(lines[0].type).toBe('context')
    expect(lines[1].type).toBe('context')
  })
})

describe('applyDiffLineDecorations', () => {
  it('adds gd/gi classes and prepends +/- markers', () => {
    const html =
      '<pre><code>' +
      '<span class="line"><span>old</span></span>\n' +
      '<span class="line"><span>new</span></span>' +
      '</code></pre>'
    const diffLines = parseDiffLines('- old\n+ new')
    const out = applyDiffLineDecorations(html, diffLines, esc)
    expect(out).toContain('class="line gd"')
    expect(out).toContain('class="line gi"')
    expect(out).toContain('>-<span>old</span>')
    expect(out).toContain('>+<span>new</span>')
  })
})

describe('renderDiffCodeHtml', () => {
  let highlighter: Highlighter

  beforeAll(async () => {
    highlighter = await createHighlighter({
      themes: ['github-light'],
      langs: ['python', 'diff'],
    })
  })

  it('highlights underlying language and applies diff decorations', () => {
    const code = '- def old():\n+ def new():\n  pass'
    const html = renderDiffCodeHtml(
      highlighter as any,
      code,
      { isDiff: true, lang: 'python' },
      { light: 'github-light', dark: 'github-light' },
      { escape: esc },
    )
    expect(html).toContain('class="line gd"')
    expect(html).toContain('class="line gi"')
    expect(html).toContain('class="line gd">-')
    expect(html).toContain('class="line gi">+')
    expect(html).toContain('new')
    expect(html).toContain('old')
  })

  it('falls back to plain diff when no underlying language', () => {
    const code = '- removed\n+ added'
    const html = renderDiffCodeHtml(
      highlighter as any,
      code,
      { isDiff: true },
      { light: 'github-light', dark: 'github-light' },
      { escape: esc },
    )
    expect(html).toContain('class="line gd"')
    expect(html).toContain('class="line gi"')
  })
})

describe('superfencesPlugin hl_lines and diff', () => {
  let highlighter: Highlighter

  beforeAll(async () => {
    highlighter = await createHighlighter({
      themes: ['github-light'],
      langs: ['python', 'diff'],
    })
  })

  function renderFence(markdown: string): string {
    const md = new MarkdownIt({ html: true })
    md.use(attrs)
    md.use(superfencesPlugin, {
      highlighter,
      themes: { light: 'github-light', dark: 'github-light' },
      md,
      lineNumbers: false,
      langLabel: false,
      locale: 'en',
      codeAnnotate: false,
    })
    return md.render(markdown)
  }

  it('highlights lines via hl_lines on fence info', () => {
    const html = renderFence('```python hl_lines="2"\nline1\nline2\nline3\n```\n')
    expect(html).toContain('class="line">')
    expect(html).toContain('class="line hll">')
    expect(html.match(/class="line hll"/g)?.length).toBe(1)
  })

  it('highlights lines via attr_list hl_lines', () => {
    const html = renderFence('``` { .python hl_lines="1 3" }\na\nb\nc\n```\n')
    expect(html.match(/class="line hll"/g)?.length).toBe(2)
  })

  it('renders diff-python blocks with syntax highlighting', () => {
    const html = renderFence('```diff-python\n- x = 1\n+ x = 2\n```\n')
    expect(html).toContain('class="line gd"')
    expect(html).toContain('class="line gi"')
    expect(html).toContain('class="line gd">-')
    expect(html).toContain('class="line gi">+')
    expect(html).toContain('> 2</span>')
    expect(html).toContain('> 1</span>')
  })

  it('renders plain diff blocks', () => {
    const html = renderFence('```diff\n- old\n+ new\n```\n')
    expect(html).toContain('class="line gd"')
    expect(html).toContain('class="line gi"')
  })

  it('renders md-codeblock head for diff when lang label is enabled', () => {
    const md = new MarkdownIt({ html: true })
    md.use(attrs)
    md.use(superfencesPlugin, {
      highlighter,
      themes: { light: 'github-light', dark: 'github-light' },
      md,
      lineNumbers: false,
      langLabel: true,
      locale: 'en',
      codeAnnotate: false,
    })
    const html = md.render('```diff\n- old\n+ new\n```\n')
    expect(html).toContain('class="md-codeblock"')
    expect(html).toContain('class="md-codeblock__head"')
    expect(html).toContain('class="md-codeblock__lang">Diff</span>')
  })
})
