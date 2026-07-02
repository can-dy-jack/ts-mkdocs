import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import { caretPlugin } from '../md/caret.js'
import { tildePlugin } from '../md/tilde.js'

describe('caret', () => {
  it('renders insert and superscript', () => {
    const md = new MarkdownIt().use(caretPlugin)
    expect(md.renderInline('^^Inserted^^')).toBe('<ins>Inserted</ins>')
    expect(md.renderInline('X^2^ + 4x - 8')).toBe('X<sup>2</sup> + 4x - 8')
    expect(md.renderInline('text^a\\ superscript^')).toBe('text<sup>a superscript</sup>')
  })

  it('respects feature flags', () => {
    const md = new MarkdownIt().use(caretPlugin, { insert: false, superscript: true })
    expect(md.renderInline('^^Inserted^^')).toBe('^<sup>Inserted</sup>^')
    expect(md.renderInline('X^2^')).toBe('X<sup>2</sup>')
  })
})

describe('tilde', () => {
  it('renders delete and subscript', () => {
    const md = new MarkdownIt().use(tildePlugin)
    expect(md.renderInline('~~Deleted~~')).toBe('<del>Deleted</del>')
    expect(md.renderInline('H~2~O')).toBe('H<sub>2</sub>O')
    expect(md.renderInline('CH~3~CH~2~OH')).toBe('CH<sub>3</sub>CH<sub>2</sub>OH')
    expect(md.renderInline('text~a\\ subscript~')).toBe('text<sub>a subscript</sub>')
  })

  it('replaces default strikethrough when delete is enabled', () => {
    const md = new MarkdownIt().use(tildePlugin)
    expect(md.renderInline('~~strike~~')).toBe('<del>strike</del>')
  })

  it('respects feature flags', () => {
    const md = new MarkdownIt().use(tildePlugin, { delete: false, subscript: true })
    expect(md.renderInline('~~Deleted~~')).toBe('<s>Deleted</s>')
    expect(md.renderInline('H~2~O')).toBe('H<sub>2</sub>O')
  })
})

describe('caret and tilde with footnotes', () => {
  it('renders footnote references', () => {
    const md = new MarkdownIt({ html: true, linkify: true })
      .use(footnote)
      .use(caretPlugin)
      .use(tildePlugin)
    expect(() => md.render('Text[^demo].\n\n[^demo]: Note body.')).not.toThrow()
  })

  it('renders adjacent footnote references with caret enabled', () => {
    expect(() => new MarkdownIt().use(footnote).use(caretPlugin).renderInline('[^reuse][^reuse]')).not.toThrow()
  })
})
