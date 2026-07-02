import { describe, expect, it } from 'vitest'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { build } from '../build.js'
import { getDefaultConfig } from '../config.js'
import { getI18n } from '../i18n.js'
import {
  buildCanonicalPageUrl,
  formatLicenseDate,
  resolveLicenseAuthor,
  resolveLicenseConfig,
  resolvePageLicense,
  shouldShowPageLicense,
} from '../license.js'

describe('license', () => {
  const i18nEn = getI18n('en')
  const i18nZh = getI18n('zh')

  const baseContext = {
    title: 'Sample Article',
    pageUrl: 'https://example.com/post/sample/',
    author: 'Sukka',
    date: '2026-02-16',
  }

  it('resolves global license config from extra', () => {
    expect(resolveLicenseConfig(undefined)).toEqual({ enabled: false })
    expect(
      resolveLicenseConfig({
        license: { enabled: true, preset: 'cc-by-nc-sa-4.0' },
      }),
    ).toEqual({ enabled: true, preset: 'cc-by-nc-sa-4.0' })
  })

  it('renders CC BY-NC-SA 4.0 card fields from global config', () => {
    const license = resolvePageLicense(
      { enabled: true, preset: 'cc-by-nc-sa-4.0' },
      {},
      i18nEn,
      baseContext,
    )
    expect(license).toMatchObject({
      title: 'Sample Article',
      page_url: 'https://example.com/post/sample/',
      author: 'Sukka',
      date: '2026-02-16',
      name: 'CC BY-NC-SA 4.0',
      license_url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      notice:
        'When reprinting or citing this article, please comply with the license agreement, indicate the source, and do not use it for commercial purposes.',
    })
  })

  it('localizes CC BY-NC-SA 4.0 notice', () => {
    const license = resolvePageLicense({ enabled: true }, {}, i18nZh, baseContext)
    expect(license?.notice).toContain('转载或引用本文时')
    expect(license?.notice).toContain('不得用于商业用途')
  })

  it('uses default preset when enabled without preset', () => {
    const license = resolvePageLicense({ enabled: true }, {}, i18nEn, baseContext)
    expect(license?.name).toBe('CC BY-NC-SA 4.0')
  })

  it('supports custom global notice', () => {
    const license = resolvePageLicense(
      {
        enabled: true,
        notice: 'All rights reserved unless noted otherwise.',
      },
      {},
      i18nEn,
      baseContext,
    )
    expect(license?.notice).toBe('All rights reserved unless noted otherwise.')
  })

  it('supports per-page preset override', () => {
    const license = resolvePageLicense(
      { enabled: true },
      { license: 'cc-by-nc-sa-4.0' },
      i18nEn,
      baseContext,
    )
    expect(license?.name).toBe('CC BY-NC-SA 4.0')
  })

  it('supports per-page custom license object', () => {
    const license = resolvePageLicense(
      { enabled: true },
      {
        license: {
          notice: 'Custom declaration for this page.',
          author: 'Alice',
        },
      },
      i18nEn,
      baseContext,
    )
    expect(license?.notice).toBe('Custom declaration for this page.')
    expect(license?.author).toBe('Alice')
  })

  it('disables license via page frontmatter or hide list', () => {
    expect(shouldShowPageLicense({ enabled: true }, { license: false })).toBe(false)
    expect(shouldShowPageLicense({ enabled: true }, { hide: ['license'] })).toBe(false)
    expect(resolvePageLicense({ enabled: true }, { license: false }, i18nEn, baseContext)).toBeUndefined()
  })

  it('disables license when global config is off', () => {
    expect(shouldShowPageLicense({ enabled: false }, {})).toBe(false)
    expect(resolvePageLicense({ enabled: false }, {}, i18nEn, baseContext)).toBeUndefined()
  })

  it('formats license dates as YYYY-MM-DD', () => {
    expect(formatLicenseDate('2026-02-16T08:00:00.000Z')).toBe('2026-02-16')
    expect(formatLicenseDate(undefined)).toBeUndefined()
  })

  it('builds canonical page urls from site_url', () => {
    expect(buildCanonicalPageUrl('https://example.com', 'guide/installation/')).toBe(
      'https://example.com/guide/installation/',
    )
    expect(buildCanonicalPageUrl(undefined, 'guide/installation/')).toBeUndefined()
  })

  it('resolves author from page authors and fallbacks', () => {
    expect(
      resolveLicenseAuthor(
        { authors: ['alice'] },
        { alice: { name: 'Alice' } },
        {},
      ),
    ).toBe('Alice')
    expect(resolveLicenseAuthor({}, {}, { author: 'Site Author' })).toBe('Site Author')
    expect(resolveLicenseAuthor({}, {}, {}, 'Default Author')).toBe('Default Author')
  })
})

describe('license build integration', () => {
  const dir = join(tmpdir(), 'ts-mkdocs-license-' + Date.now())

  it('renders license card above tags in built pages', async () => {
    const docsDir = join(dir, 'docs')
    const siteDir = join(dir, 'site')
    mkdirSync(docsDir, { recursive: true })

    writeFileSync(
      join(docsDir, 'licensed.md'),
      `---
title: Licensed Page
date: 2026-02-16
authors:
  - kartjim
tags:
  - Docs
---
# Licensed Page
`,
    )
    writeFileSync(
      join(docsDir, 'hidden.md'),
      `---
title: Hidden License
license: false
tags:
  - Docs
---
# Hidden License
`,
    )

    const config = {
      ...getDefaultConfig(dir),
      site_name: 'License Test',
      site_url: 'https://example.com/',
      docs_dir: docsDir,
      site_dir: siteDir,
      plugins: ['search'],
      extra: {
        authors: {
          kartjim: { name: 'Kart Jim' },
        },
        license: {
          enabled: true,
          preset: 'cc-by-nc-sa-4.0',
        },
      },
    }

    await build(config)

    const licensedHtml = readFileSync(join(siteDir, 'licensed', 'index.html'), 'utf-8')
    const hiddenHtml = readFileSync(join(siteDir, 'hidden', 'index.html'), 'utf-8')
    const licenseIndex = licensedHtml.indexOf('md-page-license')
    const tagsIndex = licensedHtml.indexOf('md-page-tags')

    expect(licenseIndex).toBeGreaterThan(-1)
    expect(tagsIndex).toBeGreaterThan(licenseIndex)
    expect(licensedHtml).toContain('md-page-license__title')
    expect(licensedHtml).toContain('Licensed Page')
    expect(licensedHtml).toContain('https://example.com/licensed/')
    expect(licensedHtml).toContain('Kart Jim')
    expect(licensedHtml).toContain('2026-02-16')
    expect(licensedHtml).toContain('CC BY-NC-SA 4.0')
    expect(licensedHtml).toContain('https://creativecommons.org/licenses/by-nc-sa/4.0/')
    expect(licensedHtml).toContain('md-page-license__notice')
    expect(hiddenHtml).not.toContain('md-page-license')
  })
})
