import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { build } from '../build.js'
import { getDefaultConfig } from '../config.js'
import type { Config } from '../config.js'
import type { Page } from '../page.js'
import type { DocFile } from '../files.js'
import {
  aggregateTags,
  buildTagCloudData,
  getTagArchiveUrl,
  getTagIndexUrl,
  getTagsPluginConfig,
  hasTagsPlugin,
  resolvePageTags,
  shouldShowPageTags,
  slugifyTag,
} from '../tags.js'

function makePage(
  srcUri: string,
  title: string,
  tags?: string[],
  options: { exclude?: boolean; hide?: string[] } = {},
): Page {
  return {
    file: {
      srcPath: `/docs/${srcUri}`,
      srcUri,
      destPath: `/site/${srcUri.replace(/\.md$/, '/index.html')}`,
      destUri: srcUri.replace(/\.md$/, '/index.html'),
      url: srcUri.replace(/\.md$/, '/'),
      isMarkdown: true,
    } as DocFile,
    meta: {
      tags,
      hide: options.hide,
      search: options.exclude ? { exclude: true } : undefined,
    },
    title,
    content: '',
    toc: [],
    rawMarkdown: '',
  }
}

describe('tags', () => {
  it('slugifies tag names', () => {
    expect(slugifyTag('API Reference')).toBe('api-reference')
    expect(slugifyTag('配置指南')).toBe('')
    expect(slugifyTag('C++')).toBe('c')
  })

  it('resolves page tag URLs', () => {
    const tags = resolvePageTags(['API', 'Guide'], '../../')
    expect(tags).toEqual([
      { name: 'API', slug: 'api', url: '../../tags/api/' },
      { name: 'Guide', slug: 'guide', url: '../../tags/guide/' },
    ])
    expect(getTagIndexUrl('../')).toBe('../tags/')
    expect(getTagArchiveUrl('../', 'api')).toBe('../tags/api/')
  })

  it('aggregates tags across pages', () => {
    const pages = [
      makePage('a.md', 'Alpha', ['API', 'Guide']),
      makePage('b.md', 'Beta', ['API']),
      makePage('c.md', 'Hidden', ['Secret'], { exclude: true }),
      makePage('d.md', 'No Tags'),
    ]

    const index = aggregateTags(pages, './')
    expect(index.totalTaggedPages).toBe(2)
    expect(index.tags).toHaveLength(2)
    expect(index.tags[0]).toMatchObject({ name: 'API', slug: 'api', count: 2 })
    expect(index.tags[1]).toMatchObject({ name: 'Guide', slug: 'guide', count: 1 })
    expect(index.tags[0].pages.map((p) => p.title)).toEqual(['Alpha', 'Beta'])
    expect(index.tags[0].weight).toBeGreaterThanOrEqual(1)
  })

  it('builds tag cloud data from aggregated unique tags', () => {
    const pages = [
      makePage('a.md', 'Alpha', ['API', 'Guide']),
      makePage('b.md', 'Beta', ['API']),
    ]
    const index = aggregateTags(pages, './')
    const cloud = buildTagCloudData(index)
    expect(cloud).toEqual([
      { name: 'API', slug: 'api', count: 2, weight: 5 },
      { name: 'Guide', slug: 'guide', count: 1, weight: 1 },
    ])
  })

  it('sorts tags by name when configured', () => {
    const pages = [
      makePage('a.md', 'Alpha', ['Zebra']),
      makePage('b.md', 'Beta', ['Alpha']),
    ]
    const index = aggregateTags(pages, './', { sort_by: 'name' })
    expect(index.tags.map((t) => t.name)).toEqual(['Alpha', 'Zebra'])
  })

  it('respects hide tags', () => {
    expect(shouldShowPageTags({ tags: ['API'] })).toBe(true)
    expect(shouldShowPageTags({ tags: ['API'], hide: ['tags'] })).toBe(false)
    expect(shouldShowPageTags({})).toBe(false)
  })

  it('reads tags plugin config', () => {
    const enabled = {
      plugins: ['tags'],
    } as Config
    expect(hasTagsPlugin(enabled)).toBe(true)
    expect(getTagsPluginConfig(enabled)).toEqual({ enabled: true, sort_by: 'count' })

    const disabled = {
      plugins: [{ tags: { enabled: false } }],
    } as Config
    expect(hasTagsPlugin(disabled)).toBe(false)
  })
})

describe('tags build integration', () => {
  const dir = join(tmpdir(), 'ts-mkdocs-tags-' + Date.now())

  it('generates tag index and archive pages', async () => {
    const docsDir = join(dir, 'docs')
    const siteDir = join(dir, 'site')
    mkdirSync(docsDir, { recursive: true })

    writeFileSync(
      join(docsDir, 'index.md'),
      `---
title: Home
tags:
  - Home
---
# Home
`,
    )
    writeFileSync(
      join(docsDir, 'api.md'),
      `---
title: API Docs
description: API reference
tags:
  - API
  - Reference
---
# API
`,
    )
    writeFileSync(
      join(docsDir, 'guide.md'),
      `---
title: Guide
tags:
  - Guide
  - API
---
# Guide
`,
    )

    const config = {
      ...getDefaultConfig(dir),
      site_name: 'Tags Test',
      docs_dir: docsDir,
      site_dir: siteDir,
      plugins: ['search', 'tags'],
      theme: {
        name: 'material',
        language: 'en',
        highlight: { theme_light: 'github-light', theme_dark: 'github-dark' },
      },
    } as Config

    await build(config)

    const indexPath = join(siteDir, 'tags', 'index.html')
    const apiPath = join(siteDir, 'tags', 'api', 'index.html')
    const guidePath = join(siteDir, 'tags', 'guide', 'index.html')

    expect(existsSync(indexPath)).toBe(true)
    expect(existsSync(apiPath)).toBe(true)
    expect(existsSync(guidePath)).toBe(true)

    const indexHtml = readFileSync(indexPath, 'utf-8')
    expect(indexHtml).toContain('md-tags-cloud__tag')
    expect(indexHtml).toContain('data-md-component="tags-index"')
    expect(indexHtml).toContain('API')

    const apiHtml = readFileSync(apiPath, 'utf-8')
    expect(apiHtml).toContain('API Docs')
    expect(apiHtml).toContain('Guide')

    const apiPageHtml = readFileSync(join(siteDir, 'api', 'index.html'), 'utf-8')
    expect(apiPageHtml).toContain('href="../tags/api/"')
    expect(apiPageHtml).toContain('href="../tags/reference/"')

    rmSync(dir, { recursive: true, force: true })
  })
})
