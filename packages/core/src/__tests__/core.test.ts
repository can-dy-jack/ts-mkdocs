import { describe, expect, it } from 'vitest'
import { ConfigSchema } from '../config'
import { buildFeatureContext, getTabItems, getSidebarNav } from '../features'
import { getI18n } from '../i18n'
import { resolveColor, buildPaletteStyles } from '../palette'
import { buildNavigation } from '../nav'
import { collectFiles } from '../files'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('config', () => {
  it('parses minimal config', () => {
    const result = ConfigSchema.safeParse({ site_name: 'Test' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.theme.name).toBe('material')
      expect(result.data.use_directory_urls).toBe(true)
    }
  })
})

describe('features', () => {
  it('detects navigation.tabs', () => {
    const ctx = buildFeatureContext({
      theme: { features: ['navigation.tabs', 'toc.integrate'] },
    } as any)
    expect(ctx.has['navigation.tabs']).toBe(true)
    expect(ctx.toc_integrate).toBe(true)
  })

  it('extracts tab items', () => {
    const items = getTabItems([
      { type: 'page', title: 'Home', url: './' },
      { type: 'section', title: 'Guide', children: [] },
    ])
    expect(items).toHaveLength(2)
  })

  it('scopes sidebar to active tab children', () => {
    const nav = [
      { type: 'page', title: 'Home', url: './' },
      {
        type: 'section',
        title: 'Guide',
        children: [
          { type: 'page', title: 'Install', url: 'guide/installation/' },
          { type: 'page', title: 'Config', url: 'guide/configuration/' },
        ],
      },
      { type: 'page', title: 'Changelog', url: 'changelog/' },
    ]
    expect(getSidebarNav(nav, 'guide/installation/', true)).toEqual([
      { type: 'page', title: 'Install', url: 'guide/installation/' },
      { type: 'page', title: 'Config', url: 'guide/configuration/' },
    ])
    expect(getSidebarNav(nav, './', true)).toEqual([])
    expect(getSidebarNav(nav, 'guide/installation/', false)).toBe(nav)
  })
})

describe('i18n', () => {
  it('returns Chinese strings', () => {
    const i18n = getI18n('zh')
    expect(i18n['search.placeholder']).toBe('搜索')
  })
})

describe('palette', () => {
  it('resolves indigo', () => {
    expect(resolveColor('indigo', '#000')).toBe('#3f51b5')
  })

  it('builds separate light and dark palette rules', () => {
    const css = buildPaletteStyles({
      theme: {
        palette: [
          { scheme: 'default', primary: 'orange', accent: 'orange' },
          { scheme: 'slate', primary: 'indigo', accent: 'indigo' },
        ],
      },
    })
    expect(css).toContain(':root')
    expect(css).toContain('[data-theme="dark"]')
    expect(css).toContain('--md-primary-fg-color: #ff9800')
    expect(css).toContain('--md-primary-fg-color--dark:')
    expect(css).toContain('--md-primary-fg-color: #3f51b5')
  })
})

describe('nav', () => {
  const dir = join(tmpdir(), 'ts-mkdocs-test-' + Date.now())

  it('builds inferred navigation', () => {
    mkdirSync(join(dir, 'docs'), { recursive: true })
    writeFileSync(join(dir, 'docs', 'index.md'), '# Home\n')
    writeFileSync(join(dir, 'docs', 'about.md'), '# About\n')

    const config = {
      site_name: 'Test',
      docs_dir: join(dir, 'docs'),
      site_dir: join(dir, 'site'),
      use_directory_urls: true,
    } as any

    const files = collectFiles(config)
    const nav = buildNavigation(config, files)
    expect(nav.pages.length).toBe(2)
    rmSync(dir, { recursive: true, force: true })
  })
})
