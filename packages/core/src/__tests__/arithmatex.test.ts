import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { arithmatexPlugin, resolveMathConfig } from '../md/arithmatex.js'

describe('arithmatex', () => {
  const md = new MarkdownIt({ html: true }).use(arithmatexPlugin)

  it('renders inline dollar math', () => {
    expect(md.renderInline('$E=mc^2$')).toBe(
      '<span class="arithmatex">\\(E=mc^2\\)</span>',
    )
  })

  it('renders inline paren math', () => {
    expect(md.renderInline(String.raw`\(\alpha + \beta\)`)).toBe(
      '<span class="arithmatex">\\(\\alpha + \\beta\\)</span>',
    )
  })

  it('skips currency amounts with smart dollar', () => {
    expect(md.renderInline('Costs $5 and $10 each.')).toBe('Costs $5 and $10 each.')
  })

  it('renders block dollar math', () => {
    const html = md.render('$$\nE = mc^2\n$$')
    expect(html).toContain('<div class="arithmatex">\\[E = mc^2\\]</div>')
  })

  it('renders single-line block math', () => {
    const html = md.render('$$\\int_0^1 x\\,dx$$')
    expect(html).toContain('<div class="arithmatex">\\[\\int_0^1 x\\,dx\\]</div>')
  })

  it('does not parse math inside inline code', () => {
    expect(md.renderInline('`$x$`')).toBe('<code>$x$</code>')
  })
})

describe('resolveMathConfig', () => {
  it('returns null when extension is disabled', () => {
    expect(resolveMathConfig({ markdown_extensions: [] } as any)).toBeNull()
  })

  it('defaults to katex', () => {
    expect(resolveMathConfig({
      markdown_extensions: ['pymdownx.arithmatex'],
    } as any)).toEqual({
      enabled: true,
      provider: 'katex',
      version: '0.16.22',
      cdn: {
        stylesheet: 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css',
        javascript: 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js',
        auto_render: 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js',
      },
    })
  })

  it('supports mathjax provider and custom version', () => {
    expect(resolveMathConfig({
      markdown_extensions: [{
        'pymdownx.arithmatex': { provider: 'mathjax', version: '3.2.2' },
      }],
    } as any)).toEqual({
      enabled: true,
      provider: 'mathjax',
      version: '3.2.2',
      cdn: {
        javascript: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
      },
    })
  })

  it('supports custom cdn urls', () => {
    expect(resolveMathConfig({
      markdown_extensions: [{
        'pymdownx.arithmatex': {
          provider: 'katex',
          cdn: {
            stylesheet: 'https://example.com/katex.css',
            javascript: 'https://example.com/katex.js',
            auto_render: 'https://example.com/auto-render.js',
          },
        },
      }],
    } as any)).toMatchObject({
      cdn: {
        stylesheet: 'https://example.com/katex.css',
        javascript: 'https://example.com/katex.js',
        auto_render: 'https://example.com/auto-render.js',
      },
    })
  })

  it('supports cdn base shorthand for katex', () => {
    expect(resolveMathConfig({
      markdown_extensions: [{
        'pymdownx.arithmatex': {
          cdn: { base: 'https://cdn.example.com/katex/dist/' },
        },
      }],
    } as any)).toMatchObject({
      cdn: {
        stylesheet: 'https://cdn.example.com/katex/dist/katex.min.css',
        javascript: 'https://cdn.example.com/katex/dist/katex.min.js',
        auto_render: 'https://cdn.example.com/katex/dist/contrib/auto-render.min.js',
      },
    })
  })
})
