import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { footnotesPlugin } from '../md/footnotes.js'

function render(md: string): string {
  const parser = new MarkdownIt().use(footnotesPlugin)
  return parser.render(md)
}

describe('footnotes', () => {
  it('renders inline reference and footnote list', () => {
    const html = render('Here is a footnote[^1].\n\n[^1]: This is the first footnote.')
    expect(html).toContain('class="footnote-ref"')
    expect(html).toContain('This is the first footnote.')
    expect(html).toContain('class="footnotes"')
    expect(html).toMatch(/>\s*1\s*</)
    expect(html).not.toContain('[1]')
  })

  it('supports multi-paragraph footnotes with indentation', () => {
    const html = render(
      'See[^note]\n\n[^note]: First paragraph.\n\n    Second indented paragraph.',
    )
    expect(html).toContain('First paragraph.')
    expect(html).toContain('Second indented paragraph.')
    expect(html).toContain('footnote-backref')
  })

  it('numbers multiple footnotes sequentially', () => {
    const html = render('A[^a] B[^b]\n\n[^a]: One.\n\n[^b]: Two.')
    expect(html).toContain('id="fnref1"')
    expect(html).toContain('id="fnref2"')
  })
})
