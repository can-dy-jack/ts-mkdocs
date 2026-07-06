import { describe, expect, it, beforeEach } from 'vitest'
import { join } from 'path'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import {
  canonicalPageKey,
  isSharedAsset,
  prefixDestUri,
  prefixUrl,
  stripLocalePrefix,
  collectFiles,
  buildDocFile,
} from '../files.js'
import {
  buildAlternateMap,
  getPageAlternates,
  prefixNavConfig,
  resetI18nState,
  setBuildLocale,
  i18nPlugin,
} from '../plugins/i18n.js'
import type { ResolvedI18nConfig } from '../plugins/i18n.js'

const locales = ['en', 'zh']

describe('files i18n helpers', () => {
  it('stripLocalePrefix removes locale segment', () => {
    expect(stripLocalePrefix('en/tutorial/foo.md', locales)).toEqual({
      locale: 'en',
      path: 'tutorial/foo.md',
    })
    expect(stripLocalePrefix('assets/logo.svg', locales)).toEqual({
      locale: null,
      path: 'assets/logo.svg',
    })
  })

  it('isSharedAsset detects files outside locale dirs', () => {
    expect(isSharedAsset('assets/logo.svg', locales)).toBe(true)
    expect(isSharedAsset('en/index.md', locales)).toBe(false)
  })

  it('prefixDestUri and prefixUrl add locale segment', () => {
    expect(prefixDestUri('tutorial/index.html', 'en')).toBe('en/tutorial/index.html')
    expect(prefixUrl('tutorial/', 'en')).toBe('en/tutorial/')
    expect(prefixUrl('./', 'en')).toBe('en/')
  })

  it('canonicalPageKey normalizes markdown paths', () => {
    expect(canonicalPageKey('tutorial/quick-start.md', true)).toBe('tutorial/quick-start/')
    expect(canonicalPageKey('index.md', true)).toBe('./')
  })
})

describe('i18n plugin', () => {
  beforeEach(() => {
    resetI18nState()
  })

  it('prefixNavConfig adds locale to nav paths', () => {
    const nav = [
      'index.md',
      { Tutorial: [{ Overview: 'tutorial/index.md' }, 'tutorial/quick-start.md'] },
      { External: 'https://example.com' },
    ]
    expect(prefixNavConfig(nav, 'en')).toEqual([
      'en/index.md',
      { Tutorial: [{ Overview: 'en/tutorial/index.md' }, 'en/tutorial/quick-start.md'] },
      { External: 'https://example.com' },
    ])
  })

  it('filters files for locale and sets canonicalUri', () => {
    i18nPlugin.configure({
      default_language: 'en',
      languages: [
        { locale: 'en', name: 'English' },
        { locale: 'zh', name: '简体中文' },
      ],
    })

    const docsDir = '/docs'
    const siteDir = '/site'
    const files = [
      buildDocFile('assets/logo.svg', docsDir, siteDir, true),
      buildDocFile('en/index.md', docsDir, siteDir, true),
      buildDocFile('en/tutorial/foo.md', docsDir, siteDir, true),
      buildDocFile('zh/index.md', docsDir, siteDir, true),
    ]

    i18nPlugin.configure({
      default_language: 'en',
      languages: [
        { locale: 'en', name: 'English' },
        { locale: 'zh', name: '简体中文' },
      ],
    })

    setBuildLocale('en')
    const filtered = i18nPlugin.on_files!(files, { docs_dir: docsDir, site_dir: siteDir } as any)!

    expect(filtered).toHaveLength(3)
    expect(filtered.find((f) => f.srcUri === 'zh/index.md')).toBeUndefined()
    const page = filtered.find((f) => f.srcUri === 'en/tutorial/foo.md')
    expect(page?.canonicalUri).toBe('tutorial/foo.md')
    expect(page?.locale).toBe('en')
    expect(page?.url).toBe('en/tutorial/foo/')
  })

  it('builds alternate map and page alternates', () => {
    i18nPlugin.configure({
      default_language: 'en',
      languages: [
        { locale: 'en', name: 'English' },
        { locale: 'zh', name: '简体中文' },
      ],
      fallback_to_default: true,
      redirect_default: true,
    })

    const i18n: ResolvedI18nConfig = {
      defaultLanguage: 'en',
      locales: ['en', 'zh'],
      languages: [
        { locale: 'en', name: 'English' },
        { locale: 'zh', name: '简体中文' },
      ],
      fallbackToDefault: true,
      redirectDefault: true,
      navTranslations: {},
    }

    const docsDir = '/docs'
    const siteDir = '/site'
    const files = [
      buildDocFile('en/tutorial/foo.md', docsDir, siteDir, true),
      buildDocFile('zh/tutorial/foo.md', docsDir, siteDir, true),
      buildDocFile('en/index.md', docsDir, siteDir, true),
    ]

    buildAlternateMap(files, i18n, true)

    const alternates = getPageAlternates('tutorial/foo/', 'en', 'https://example.com')
    expect(alternates).toHaveLength(2)
    expect(alternates.find((a) => a.lang === 'en')?.active).toBe(true)
    expect(alternates.find((a) => a.lang === 'en')?.link).toBe('/en/tutorial/foo/')
    expect(alternates.find((a) => a.lang === 'zh')?.link).toBe('/zh/tutorial/foo/')
    expect(alternates.find((a) => a.lang === 'zh')?.hreflang).toBe(
      'https://example.com/zh/tutorial/foo/',
    )
  })

  it('falls back to default locale path when translation is missing', () => {
    i18nPlugin.configure({
      default_language: 'en',
      languages: [
        { locale: 'en', name: 'English' },
        { locale: 'zh', name: '简体中文' },
      ],
      fallback_to_default: true,
    })

    const i18n: ResolvedI18nConfig = {
      defaultLanguage: 'en',
      locales: ['en', 'zh'],
      languages: [
        { locale: 'en', name: 'English' },
        { locale: 'zh', name: '简体中文' },
      ],
      fallbackToDefault: true,
      redirectDefault: true,
      navTranslations: {},
    }

    const docsDir = '/docs'
    const siteDir = '/site'
    const files = [buildDocFile('en/reference/i18n.md', docsDir, siteDir, true)]

    buildAlternateMap(files, i18n, true)

    const alternates = getPageAlternates('reference/i18n/', 'en', 'https://example.com')
    expect(alternates.find((a) => a.lang === 'zh')?.link).toBe('/zh/reference/i18n/')
    expect(alternates.find((a) => a.lang === 'zh')?.hreflang).toBe(
      'https://example.com/zh/reference/i18n/',
    )
  })
})

describe('i18n integration build', () => {
  let tmpDir: string

  beforeEach(() => {
    resetI18nState()
    tmpDir = join(tmpdir(), `ts-mkdocs-i18n-${Date.now()}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  it('collects locale-prefixed files from docs tree', () => {
    const docsDir = join(tmpDir, 'docs')
    const siteDir = join(tmpDir, 'site')
    mkdirSync(join(docsDir, 'en'), { recursive: true })
    mkdirSync(join(docsDir, 'assets'), { recursive: true })
    writeFileSync(join(docsDir, 'en/index.md'), '# Home\n')
    writeFileSync(join(docsDir, 'assets/logo.svg'), '<svg></svg>')

    const files = collectFiles({
      docs_dir: docsDir,
      site_dir: siteDir,
      use_directory_urls: true,
    } as any)

    expect(files.map((f) => f.srcUri).sort()).toEqual(['assets/logo.svg', 'en/index.md'])
    const home = files.find((f) => f.srcUri === 'en/index.md')
    expect(home?.url).toBe('en/')
  })
})
