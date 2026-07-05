import { describe, expect, it } from 'vitest'
import {
  parseHtmlMetaTags,
  resolveDocumentTitle,
  resolvePageAuthor,
  resolvePageHtmlMetaTags,
} from '../html-meta.js'
import { mergePageMeta, normalizePageMeta } from '../frontmatter.js'

describe('html-meta', () => {
  it('parses html_meta tag entries', () => {
    expect(
      parseHtmlMetaTags([
        { name: 'keywords', content: 'docs, mkdocs' },
        { property: 'article:section', content: 'Guide' },
        { 'http-equiv': 'refresh', content: '30' },
      ]),
    ).toEqual([
      { name: 'keywords', content: 'docs, mkdocs' },
      { property: 'article:section', content: 'Guide' },
      { http_equiv: 'refresh', content: '30' },
    ])
  })

  it('skips invalid html_meta entries', () => {
    expect(parseHtmlMetaTags([{ name: 'keywords' }, 'invalid', null])).toEqual([])
  })

  it('resolves document title like Material for MkDocs', () => {
    expect(
      resolveDocumentTitle({
        siteName: 'Docs',
        pageTitle: 'Install',
        isHomepage: false,
      }),
    ).toBe('Install - Docs')

    expect(
      resolveDocumentTitle({
        siteName: 'Docs',
        pageTitle: 'Welcome',
        isHomepage: true,
      }),
    ).toBe('Docs')

    expect(
      resolveDocumentTitle({
        siteName: 'Docs',
        pageTitle: 'Install',
        metaTitle: 'Setup Guide',
        isHomepage: false,
      }),
    ).toBe('Setup Guide - Docs')
  })

  it('prefers page author over site author', () => {
    expect(resolvePageAuthor({ author: 'Alice' }, 'Site Author')).toBe('Alice')
    expect(resolvePageAuthor({}, 'Site Author')).toBe('Site Author')
    expect(resolvePageAuthor({})).toBeUndefined()
  })

  it('merges and normalizes html_meta from inherited meta', () => {
    const merged = mergePageMeta(
      {
        html_meta: [{ name: 'keywords', content: 'shared' }],
      },
      {
        html_meta: [{ name: 'keywords', content: 'page' }],
      },
    )

    const meta = normalizePageMeta(merged)
    expect(resolvePageHtmlMetaTags(meta)).toEqual([
      { name: 'keywords', content: 'shared' },
      { name: 'keywords', content: 'page' },
    ])
  })
})
