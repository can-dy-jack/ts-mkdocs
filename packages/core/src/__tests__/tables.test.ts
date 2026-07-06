import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { tablesPlugin } from '../md/tables.js'
import { magiclinkPlugin } from '../md/magiclink.js'

function render(md: string, withAttrs = false, withMagiclink = false): string {
  const parser = new MarkdownIt()
  if (withAttrs) parser.use(attrs)
  if (withMagiclink) {
    magiclinkPlugin(parser, { repo_url_shorthand: true }, { repo_url: 'https://github.com/foo/bar' })
  }
  parser.use(tablesPlugin)
  return parser.render(md)
}

describe('table enhancements', () => {
  it('applies explicit colspan via @span', () => {
    const html = render(`| A | B | C |
|---|---|---|
| x @span=2 | | 3 |`)
    expect(html).toContain('colspan="2"')
    expect(html).toContain('>x</td>')
    expect(html).not.toMatch(/>\s*<\/td>\s*<td>3<\/td>/)
    expect(html).toContain('>3</td>')
  })

  it('applies explicit rowspan via @span', () => {
    const html = render(`| A | B |
|---|---|
| x @span=1:2 | y |
| | z |`)
    expect(html).toContain('rowspan="2"')
    expect(html).toContain('>x</td>')
    expect(html).toContain('>y</td>')
    expect(html).toContain('>z</td>')
    expect(html.match(/<tr/g)?.length).toBe(3)
  })

  it('auto-expands @span across adjacent empty cells', () => {
    const html = render(`| A | B | C |
|---|---|---|
| merged @span | | next |`)
    expect(html).toContain('colspan="2"')
    expect(html).toContain('>merged</td>')
    expect(html).toContain('>next</td>')
  })

  it('removes ghost cells for attr_list rowspan', () => {
    const html = render(
      `| fruit | definition |
|-------|------------|
| Apple | Pomaceous fruit {: rowspan=2 } |
| Also Apple | placeholder |`,
      true,
    )
    expect(html).toContain('rowspan="2"')
    expect(html).toContain('>Apple</td>')
    expect(html).toContain('>Also Apple</td>')
    expect(html).not.toContain('placeholder')
    expect(html).not.toContain(':=""')
  })

  it('removes ghost cells for attr_list colspan', () => {
    const html = render(
      `| A | B | C |
|---|---|---|
| 1 | 2 {: colspan=2 } | ghost |`,
      true,
    )
    expect(html).toContain('colspan="2"')
    expect(html).toContain('>2</td>')
    expect(html).not.toContain('ghost')
  })

  it('renders colgroup from header width attributes', () => {
    const html = render(
      `| Name {: width=30% } | Age {: width=70px } |
| --- | --- |
| Alice | 30 |`,
      true,
    )
    expect(html).toContain('<colgroup>')
    expect(html).toContain('width: 30%')
    expect(html).toContain('width: 70px')
    expect(html).not.toContain('{: width')
  })

  it('preserves inline formatting when stripping @span', () => {
    const html = render(`| A | B |
|---|---|
| **bold** @span=2 | |`)
    expect(html).toContain('<strong>bold</strong>')
    expect(html).not.toContain('@span')
  })

  it('strips @span when magiclink is enabled', () => {
    const html = render(
      `| Item | Notes |
| --- | --- |
| Alpha @span=1:2 | First row |
| | Second row |`,
      false,
      true,
    )
    expect(html).toContain('rowspan="2"')
    expect(html).toContain('>Alpha</td>')
    expect(html).not.toContain('@span')
    expect(html).not.toContain('magiclink-mention')
  })

  it('applies header width style for column control', () => {
    const html = render(
      `| Name {: width=30% } | Description {: width=70% } |
| --- | --- |
| ts-mkdocs | TypeScript MkDocs implementation |`,
      true,
    )
    expect(html).toContain('style="width: 30%"')
    expect(html).toContain('style="width: 70%"')
  })

  it('keeps trailing cells when explicit colspan skips only adjacent empties', () => {
    const html = render(
      `| Region | Q1 | Q2 |
| --- | --- | --- |
| North @span=2 | | 120 |
| South | 80 | 95 |`,
      true,
    )
    expect(html).toContain('colspan="2"')
    expect(html).toContain('>North</td>')
    expect(html).toContain('>120</td>')
    expect(html).toContain('>South</td>')
  })

  it('works with initMarkdown and magiclink like the example site', async () => {
    const { initMarkdown, renderMarkdown } = await import('../markdown.js')
    await initMarkdown({
      site_name: 'Test',
      docs_dir: '/tmp',
      site_dir: '/tmp/site',
      repo_url: 'https://github.com/can-dy-jack/ts-mkdocs',
      theme: {
        name: 'material',
        language: 'en',
        highlight: { theme_light: 'github-light', theme_dark: 'github-dark' },
      },
      markdown_extensions: [
        'attr_list',
        'tables',
        { 'md.links': { repo_url_shorthand: true } },
      ],
    } as any)

    const { html } = renderMarkdown(`| Item | Notes |
| --- | --- |
| Alpha @span=1:2 | First row |
| | Second row |`)

    expect(html).toContain('rowspan="2"')
    expect(html).toContain('>Alpha</td>')
    expect(html).not.toContain('@span')
    expect(html).not.toContain('magiclink-mention')
  })
})
