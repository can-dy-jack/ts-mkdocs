import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { contentTabsPlugin } from '../md/tabs.js'
import { admonitionPlugin } from '../md/admonition.js'
import { createIconService } from '../icons.js'

function render(md: string, withIcons = false): string {
  const parser = new MarkdownIt()
  const icons = withIcons
    ? createIconService({ theme: { icons: { default: 'material', libraries: ['material'] } } } as any)
    : undefined
  if (withIcons) parser.use(admonitionPlugin, { icons })
  parser.use(contentTabsPlugin, { alternate_style: true, icons })
  return parser.render(md)
}

describe('content tabs', () => {
  it('groups consecutive tab headers into one tabbed set', () => {
    const html = render(`=== "Tab A"

    Content A

=== "Tab B"

    Content B
`)
    expect(html.match(/class="tabbed-set/g)?.length).toBe(1)
    expect(html).toContain('Content A')
    expect(html).toContain('Content B')
  })

  it('ends tab content before unindented markdown', () => {
    const html = render(`=== "Tab A"

    Content A

=== "Tab B"

    Content B

## Next section

Body text
`)
    expect(html).toContain('Content B')
    expect(html).toContain('<h2')
    expect(html).toContain('Next section')
    expect(html.indexOf('Content B')).toBeLessThan(html.indexOf('<h2'))
  })

  it('starts a new tab set after headings', () => {
    const html = render(`=== "One"

    First

## Heading

=== "Two"

    Second
`)
    expect(html.match(/class="tabbed-set/g)?.length).toBe(2)
  })

  it('renders fenced code inside tabs', () => {
    const html = render(`=== "TypeScript"

    \`\`\`typescript
    const x = 1
    \`\`\`

=== "Python"

    \`\`\`python
    x = 1
    \`\`\`
`)
    expect(html).toContain('const x = 1')
    expect(html).toContain('x = 1')
  })

  it('preserves blank lines between indented paragraphs', () => {
    const html = render(`=== "Install"

    First paragraph.

    Second paragraph.
`)
    expect(html.match(/<p>/g)?.length).toBe(2)
  })

  it('renders admonitions inside tab panels with correct indent', () => {
    const html = render(`=== "Legacy"

    !!! warning
        \`.html\` suffix URLs still work when disabled.
`, true)
    expect(html).toContain('admonition-content"><p>')
    expect(html).not.toMatch(/<\/details>\s*<p>/)
  })

  it('renders icon shortcodes in tab labels', () => {
    const html = render(`=== ":material-code-braces: API"

    Table cell
`, true)
    expect(html).toContain('class="md-icon md-icon--material"')
    expect(html).not.toContain(':material-code-braces:')
  })
})
