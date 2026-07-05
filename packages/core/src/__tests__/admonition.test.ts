import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { admonitionPlugin, detailsPlugin } from '../md/admonition.js'

function renderAdmonition(
  markdown: string,
  defaultCollapsed = false,
  types?: Set<string>,
  typeDefaults?: Record<string, { title?: string }>,
): string {
  const md = new MarkdownIt()
  md.use(admonitionPlugin, { defaultCollapsed, types, typeDefaults })
  return md.render(markdown)
}

function renderDetails(markdown: string, defaultCollapsed = true): string {
  const md = new MarkdownIt()
  md.use(detailsPlugin, { defaultCollapsed })
  return md.render(markdown)
}

describe('admonition', () => {
  it('renders collapsible details with top-level summary toggle', () => {
    const html = renderAdmonition('!!! note\n    Hello world\n')
    expect(html).toContain('<details class="admonition note" open>')
    expect(html).toContain('<summary class="admonition-title">')
    expect(html).toContain('admonition-toggle')
    expect(html).toContain('Hello world')
  })

  it('respects default_collapsed config', () => {
    const html = renderAdmonition('!!! note\n    Hidden by default\n', true)
    expect(html).toContain('<details class="admonition note">')
    expect(html).not.toContain('<details class="admonition note" open>')
  })

  it('supports inline +/- modifiers', () => {
    const forcedOpen = renderAdmonition('!!!+ note\n    Force open\n', true)
    expect(forcedOpen).toContain('<details class="admonition note" open>')

    const forcedClosed = renderAdmonition('!!!- note\n    Force closed\n', false)
    expect(forcedClosed).toContain('<details class="admonition note">')
    expect(forcedClosed).not.toContain(' open>')
  })

  it('renders pymdownx.details collapsed by default', () => {
    const html = renderDetails('??? tip "More info"\n    Collapsed content\n')
    expect(html).toContain('<details class="admonition tip">')
    expect(html).not.toContain('<details class="admonition tip" open>')
  })

  it('renders custom admonition types when registered', () => {
    const types = new Set(['note', 'todo'])
    const html = renderAdmonition('!!! todo\n    Custom type content\n', false, types)
    expect(html).toContain('<details class="admonition todo" open>')
    expect(html).toContain('Custom type content')
  })

  it('rejects unregistered custom types', () => {
    const html = renderAdmonition('!!! todo\n    Should not render\n')
    expect(html).not.toContain('admonition todo')
    expect(html).toContain('<p>!!! todo')
  })

  it('uses configured default title for custom types', () => {
    const types = new Set(['note', 'experimental'])
    const html = renderAdmonition(
      '!!! experimental\n    Content\n',
      false,
      types,
      { experimental: { title: 'Experimental feature' } },
    )
    expect(html).toContain('Experimental feature')
  })
})
