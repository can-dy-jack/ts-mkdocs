import { describe, expect, it, beforeEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'
import { buildDocFile } from '../files.js'
import { loadPage } from '../page.js'
import { buildMetaBarItems } from '../page-meta.js'
import { getI18n } from '../i18n.js'
import {
  applyRevisionDatesToPage,
  clearRevisionDateCache,
  getGitRevisionDatePluginConfig,
  hasGitRevisionDatePlugin,
  resolveRevisionDateConfig,
  resolveRevisionDates,
} from '../revision-date.js'

function makeTempDocs(): string {
  const dir = join(tmpdir(), 'ts-mkdocs-revision-date-' + Date.now() + '-' + Math.random())
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('revision-date', () => {
  beforeEach(() => {
    clearRevisionDateCache()
  })

  it('resolves plugin config from ts-mkdocs.yml entries', () => {
    expect(
      getGitRevisionDatePluginConfig({
        plugins: ['git-revision-date'],
      } as never).enable_creation_date,
    ).toBe(true)

    expect(
      getGitRevisionDatePluginConfig({
        plugins: [{ 'git-revision-date': { enable_creation_date: false, source: 'filesystem' } }],
      } as never),
    ).toEqual({
      enabled: true,
      source: 'filesystem',
      enable_creation_date: false,
      fallback_to_build_date: false,
      exclude: [],
    })

    expect(hasGitRevisionDatePlugin({ plugins: ['search'] } as never)).toBe(false)
    expect(hasGitRevisionDatePlugin({ plugins: ['git-revision-date'] } as never)).toBe(true)
  })

  it('reads filesystem dates for a markdown file', () => {
    const docsDir = makeTempDocs()
    const filePath = join(docsDir, 'page.md')
    writeFileSync(filePath, '# Hello\n')

    const dates = resolveRevisionDates(filePath, resolveRevisionDateConfig({ source: 'filesystem' }))
    expect(dates.updated).toBeTruthy()
    expect(dates.created).toBeTruthy()

    rmSync(docsDir, { recursive: true, force: true })
  })

  it('fills missing page meta without overriding frontmatter dates', () => {
    const docsDir = makeTempDocs()
    const filePath = join(docsDir, 'page.md')
    writeFileSync(filePath, '---\ntitle: Example\nupdated: 2024-01-15\n---\n# Hello\n')

    const file = buildDocFile('page.md', docsDir, join(docsDir, 'site'), true)
    const page = loadPage(file, { docsDir, language: 'en' })

    applyRevisionDatesToPage(
      page,
      resolveRevisionDateConfig({ source: 'filesystem', enable_creation_date: true }),
      'en',
    )

    expect(page.meta.updated).toContain('2024-01-15')
    expect(page.meta.date).toBeTruthy()
    expect(page.meta.date_formatted).toBeTruthy()

    const items = buildMetaBarItems(page.meta, getI18n('en'), {
      readtimeFormatted: undefined,
    })
    expect(items.some((item) => item.type === 'date')).toBe(true)
    expect(items.some((item) => item.type === 'updated')).toBe(true)

    rmSync(docsDir, { recursive: true, force: true })
  })

  it('respects exclude patterns', () => {
    const docsDir = makeTempDocs()
    const filePath = join(docsDir, 'index.md')
    writeFileSync(filePath, '# Home\n')

    const file = buildDocFile('index.md', docsDir, join(docsDir, 'site'), true)
    const page = loadPage(file, { docsDir, language: 'en' })

    applyRevisionDatesToPage(
      page,
      resolveRevisionDateConfig({ source: 'filesystem', exclude: ['index.md'] }),
      'en',
    )

    expect(page.meta.date).toBeUndefined()
    expect(page.meta.updated).toBeUndefined()

    rmSync(docsDir, { recursive: true, force: true })
  })

  it('reads git dates for tracked files in this repository', () => {
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..')
    const filePath = join(repoRoot, 'packages/core/src/frontmatter.ts')
    const dates = resolveRevisionDates(filePath, resolveRevisionDateConfig({ source: 'git' }))

    expect(dates.updated).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(dates.created).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
