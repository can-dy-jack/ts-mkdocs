import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { abbrPlugin } from '../md/abbr.js'
import { deflistPlugin } from '../md/deflist.js'

describe('abbr', () => {
  function render(md: string): string {
    return new MarkdownIt().use(abbrPlugin).render(md)
  }

  it('wraps defined abbreviations in abbr tags', () => {
    const html = render('*[HTML]: Hyper Text Markup Language\n\nThe HTML specification is maintained by the W3C.')
    expect(html).toContain('<abbr title="Hyper Text Markup Language">HTML</abbr>')
  })

  it('supports multiple abbreviations', () => {
    const html = render(
      '*[HTML]: Hyper Text Markup Language\n*[W3C]: World Wide Web Consortium\n\nThe HTML specification is maintained by the W3C.',
    )
    expect(html).toContain('<abbr title="Hyper Text Markup Language">HTML</abbr>')
    expect(html).toContain('<abbr title="World Wide Web Consortium">W3C</abbr>')
  })
})

describe('def_list', () => {
  function render(md: string): string {
    return new MarkdownIt().use(deflistPlugin).render(md)
  }

  it('renders a basic definition list', () => {
    const html = render('Term 1\n:   Definition 1\n\nTerm 2\n:   Definition 2a\n:   Definition 2b')
    expect(html).toContain('<dl>')
    expect(html).toContain('<dt>Term 1</dt>')
    expect(html).toContain('<dd>Definition 1</dd>')
    expect(html).toContain('<dt>Term 2</dt>')
    expect(html).toContain('<dd>Definition 2a</dd>')
    expect(html).toContain('<dd>Definition 2b</dd>')
  })

  it('supports inline formatting in definitions', () => {
    const html = render('API\n:   An **Application Programming Interface**')
    expect(html).toContain('<dt>API</dt>')
    expect(html).toContain('<strong>Application Programming Interface</strong>')
  })
})
