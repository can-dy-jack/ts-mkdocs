import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { admonitionPlugin } from '../md/admonition.js'
import { contentTabsPlugin } from '../md/tabs.js'
import { superfencesPlugin } from '../md/superfences.js'
import { processTextAnnotations, extractCodeAnnotations, parseAnnotateFenceInfo, parseFenceTitle, stripFenceTitle } from '../md/annotations.js'
import { createIconService } from '../icons.js'

const TEST_CONFIG = { theme: { icons: { default: 'material', libraries: ['material'] } } } as any

function render(markdown: string, use: (md: MarkdownIt) => void = () => {}): string {
  const md = new MarkdownIt({ html: true })
  md.use(attrs)
  use(md)
  const html = md.render(markdown)
  const icons = createIconService(TEST_CONFIG)
  return processTextAnnotations(html, icons)
}

describe('processTextAnnotations', () => {
  it('converts a marker + trailing list into a clickable annotation', () => {
    const html = render('Lorem ipsum (1) dolor.\n{ .annotate }\n\n1. Hello annotation\n')
    expect(html).toContain('<p class="annotate">')
    expect(html).toContain('class="md-annotation" data-md-annotation-id="1"')
    expect(html).toContain('class="md-annotation__tooltip"')
    expect(html).toContain('Hello annotation')
    expect(html).toContain('class="md-annotation-list" hidden')
    expect(html).not.toContain('(1)')
  })

  it('supports multiple markers mapped to the right list item', () => {
    const html = render('First (1) and second (2).\n{ .annotate }\n\n1. First note\n2. Second note\n')
    const idx1 = html.indexOf('data-md-annotation-id="1"')
    const idx2 = html.indexOf('data-md-annotation-id="2"')
    expect(idx1).toBeGreaterThan(-1)
    expect(idx2).toBeGreaterThan(idx1)
    expect(html).toContain('First note')
    expect(html).toContain('Second note')
  })

  it('leaves markers untouched when no matching list follows', () => {
    const html = render('Lorem ipsum (1) dolor.\n{ .annotate }\n\nNo list here.\n')
    expect(html).toContain('(1)')
    expect(html).not.toContain('md-annotation')
  })

  it('supports nested annotations', () => {
    const markdown = `Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
{ .annotate }

1.  <div class="annotate">I'm an annotation! (1)</div>

    1.  I'm an annotation as well!
`
    const html = render(markdown)
    expect(html).not.toMatch(/\(\d+\)/)

    const outerTooltip = html.match(
      /<span class="md-annotation__tooltip-inner">([\s\S]*?)<\/span><\/span><\/span> consectetur/,
    )
    expect(outerTooltip).toBeTruthy()
    expect(outerTooltip![1]).toContain('<span class="annotate">')
    expect(outerTooltip![1]).not.toContain('<div class="annotate">')
    expect(outerTooltip![1]).toContain("I'm an annotation!")
    expect(outerTooltip![1]).toMatch(/md-annotation__index/)
    expect(outerTooltip![1]).toContain("I'm an annotation as well!")
    expect(outerTooltip![1]).not.toContain('md-annotation-list')
  })

  it('works inside admonitions with the annotate modifier', () => {
    const md = new MarkdownIt({ html: true })
    md.use(attrs)
    md.use(admonitionPlugin)
    const html0 = md.render(
      '!!! note annotate "Title (1)"\n    Body text (2)\n\n1.  Title note\n2.  Body note\n',
    )
    const icons = createIconService(TEST_CONFIG)
    const html = processTextAnnotations(html0, icons)
    expect(html).toContain('class="admonition note annotate"')
    expect(html).toContain('Title note')
    expect(html).toContain('Body note')
    expect(html.match(/md-annotation__index/g)?.length).toBe(2)
  })

  it('works inside content tabs', () => {
    const md = new MarkdownIt({ html: true })
    md.use(attrs)
    md.use(contentTabsPlugin, { alternate_style: true })
    const html0 = md.render(
      '=== "Tab A"\n\n    Text (1) here.\n    { .annotate }\n\n    1.  Tab annotation\n',
    )
    const icons = createIconService(TEST_CONFIG)
    const html = processTextAnnotations(html0, icons)
    expect(html).toContain('tabbed-content')
    expect(html).toContain('Tab annotation')
    expect(html).toContain('md-annotation')
  })
})

describe('parseAnnotateFenceInfo', () => {
  it('parses plain language info strings', () => {
    expect(parseAnnotateFenceInfo('python')).toEqual({ lang: 'python', annotate: false })
  })

  it('parses brace attribute-list style info strings', () => {
    expect(parseAnnotateFenceInfo('{ .yaml .annotate }')).toEqual({ lang: 'yaml', annotate: true })
  })

  it('handles brace info without a language', () => {
    expect(parseAnnotateFenceInfo('{ .annotate }')).toEqual({ lang: '', annotate: true })
  })
})

describe('extractCodeAnnotations', () => {
  it('strips the whole comment when the marker ends with !', () => {
    const { code, markers } = extractCodeAnnotations('x = 1  # (1)!\ny = 2\n')
    expect(code).toBe('x = 1\ny = 2\n')
    expect(markers).toEqual([{ line: 0, id: 1 }])
  })

  it('keeps the comment leader when the marker has no !', () => {
    const { code, markers } = extractCodeAnnotations('pnpm build   # (1)\n')
    expect(code).toBe('pnpm build   #\n')
    expect(markers).toEqual([{ line: 0, id: 1 }])
  })

  it('supports // comment leaders', () => {
    const { code, markers } = extractCodeAnnotations('foo(); // (2)!\n')
    expect(code).toBe('foo();\n')
    expect(markers).toEqual([{ line: 0, id: 2 }])
  })

  it('does not touch a bare parenthesized expression without a comment leader', () => {
    const { code, markers } = extractCodeAnnotations('const x = f(1)\n')
    expect(code).toBe('const x = f(1)\n')
    expect(markers).toEqual([])
  })
})

describe('superfencesPlugin code annotations', () => {
  function renderFence(markdown: string, codeAnnotate: boolean): string {
    const md = new MarkdownIt({ html: true })
    md.use(attrs)
    md.use(superfencesPlugin, {
      highlighter: null,
      themes: { light: 'x', dark: 'x' },
      md,
      lineNumbers: false,
      langLabel: false,
      locale: 'en',
      codeAnnotate,
    })
    const html0 = md.render(markdown)
    const icons = createIconService(TEST_CONFIG)
    return processTextAnnotations(html0, icons)
  }

  it('annotates every block when content.code.annotate is enabled globally', () => {
    const html = renderFence(
      '```python\nx = 1  # (1)!\n```\n\n1.  Sets x to one.\n',
      true,
    )
    expect(html).toContain('class="annotate"')
    expect(html).toContain('md-annotation')
    expect(html).toContain('Sets x to one.')
  })

  it('does not annotate markdown/text illustration blocks under the global feature', () => {
    const html = renderFence(
      '```markdown\nsome text ending in a comment # (1)!\n```\n\n1.  Should not be consumed.\n',
      true,
    )
    expect(html).not.toContain('md-annotation')
    expect(html).toContain('# (1)!')
  })

  it('supports opting in per block with { .lang .annotate } regardless of global feature', () => {
    const html = renderFence(
      '```{ .yaml .annotate }\nkey: value # (1)!\n```\n\n1.  A key/value pair.\n',
      false,
    )
    expect(html).toContain('class="annotate"')
    expect(html).toContain('md-annotation')
    expect(html).toContain('A key/value pair.')
  })

  it('leaves ordinary code blocks untouched when annotations are disabled', () => {
    const html = renderFence('```python\nx = 1  # (1)!\n```\n', false)
    expect(html).not.toContain('md-annotation')
    expect(html).toContain('# (1)!')
  })

  it('does not leak placeholder characters when no annotation list follows', () => {
    const html = renderFence(
      '```python\nx = 1  # (1)!\n```\n\nNo list follows this block.\n',
      true,
    )
    expect(html).not.toMatch(/[\uE000\uE001]/)
  })

  it('renders a centered title from fence info', () => {
    const html = renderFence('```typescript title="src/build.ts"\nconst x = 1\n```\n', false)
    expect(html).toContain('md-codeblock__head--titled')
    expect(html).toContain('class="md-codeblock__title">src/build.ts</span>')
  })

  it('renders a title from attr_list on the opening fence', () => {
    const html = renderFence('``` { .typescript title="src/build.ts" }\nconst x = 1\n```\n', false)
    expect(html).toContain('class="md-codeblock__title">src/build.ts</span>')
  })
})

describe('fence title parsing', () => {
  it('extracts title from fence info', () => {
    expect(parseFenceTitle('typescript title="src/build.ts"')).toBe('src/build.ts')
    expect(parseFenceTitle("python title='app.py'")).toBe('app.py')
    expect(stripFenceTitle('typescript title="src/build.ts"')).toBe('typescript')
  })

  it('prefers attr_list title over fence info', () => {
    expect(parseFenceTitle('typescript title="ignored"', 'src/build.ts')).toBe('src/build.ts')
  })

  it('strips title from brace fence info before language parsing', () => {
    const info = stripFenceTitle('{ .yaml .annotate title="values.yaml" }')
    expect(parseAnnotateFenceInfo(info)).toEqual({ lang: 'yaml', annotate: true })
  })
})
