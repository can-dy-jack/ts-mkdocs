import { describe, expect, it } from 'vitest'
import { initMarkdown, renderMarkdown, resolveTocOptions } from '../markdown.js'

const baseConfig = {
  site_name: 'Test',
  docs_dir: '/tmp',
  site_dir: '/tmp/site',
  theme: {
    name: 'material',
    language: 'en',
    highlight: { theme_light: 'github-light', theme_dark: 'github-dark' },
  },
} as const

describe('resolveTocOptions', () => {
  it('defaults to depth 3 (h2 and h3)', () => {
    expect(resolveTocOptions({ ...baseConfig, markdown_extensions: [] } as any).depth).toBe(3)
  })

  it('reads toc_depth from markdown_extensions', () => {
    const config = {
      ...baseConfig,
      markdown_extensions: [{ toc: { permalink: true, toc_depth: 4 } }],
    } as any
    expect(resolveTocOptions(config).depth).toBe(4)
  })

  it('clamps toc_depth to 1–6', () => {
    expect(resolveTocOptions({
      ...baseConfig,
      markdown_extensions: [{ toc: { toc_depth: 0 } }],
    } as any).depth).toBe(1)
    expect(resolveTocOptions({
      ...baseConfig,
      markdown_extensions: [{ toc: { toc_depth: 9 } }],
    } as any).depth).toBe(6)
  })
})

describe('toc rendering', () => {
  const sample = [
    '# Title',
    '',
    '## Section A',
    '',
    '### Subsection A1',
    '',
    '#### Detail A1a',
    '',
    '## Section B',
    '',
    '### Subsection B1',
  ].join('\n')

  it('includes only h2 and h3 by default', async () => {
    await initMarkdown({ ...baseConfig, markdown_extensions: [{ toc: { permalink: true } }] } as any)
    const { toc } = renderMarkdown(sample)
    expect(toc.map((e) => e.title)).toEqual(['Section A', 'Section B'])
    expect(toc[0].children.map((e) => e.title)).toEqual(['Subsection A1'])
    expect(toc[0].children[0].children).toHaveLength(0)
  })

  it('respects custom toc_depth', async () => {
    await initMarkdown({
      ...baseConfig,
      markdown_extensions: [{ toc: { toc_depth: 4 } }],
    } as any)
    const { toc } = renderMarkdown(sample)
    expect(toc[0].children[0].children.map((e) => e.title)).toEqual(['Detail A1a'])
  })

  it('limits to h2 only when toc_depth is 2', async () => {
    await initMarkdown({
      ...baseConfig,
      markdown_extensions: [{ toc: { toc_depth: 2 } }],
    } as any)
    const { toc } = renderMarkdown(sample)
    expect(toc.map((e) => e.title)).toEqual(['Section A', 'Section B'])
    expect(toc[0].children).toHaveLength(0)
    expect(toc[1].children).toHaveLength(0)
  })

  it('renders icons in toc title_html', async () => {
    await initMarkdown({
      ...baseConfig,
      markdown_extensions: [{ toc: { permalink: true } }],
      theme: {
        ...baseConfig.theme,
        icons: { default: 'material', libraries: ['material'] },
      },
    } as any)
    const { toc } = renderMarkdown('## :material-rocket: Quick start\n')
    expect(toc[0].title).toBe('Quick start')
    expect(toc[0].title_html).toContain('md-icon')
    expect(toc[0].title_html).toContain('Quick start')
    expect(toc[0].title_html).not.toContain('header-anchor')
  })
})
