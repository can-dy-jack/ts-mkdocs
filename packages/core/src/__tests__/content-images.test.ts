import { describe, expect, it } from 'vitest'
import {
  computePageRelativeAssetUrl,
  isExternalAssetUrl,
  resolveDocAssetUrl,
  resolveDocRelativePath,
} from '../asset-url.js'
import { rewriteContentImages } from '../content-images.js'

describe('asset-url', () => {
  it('detects external URLs', () => {
    expect(isExternalAssetUrl('https://example.com/a.png')).toBe(true)
    expect(isExternalAssetUrl('//cdn.example.com/a.png')).toBe(true)
    expect(isExternalAssetUrl('data:image/png;base64,abc')).toBe(true)
    expect(isExternalAssetUrl('assets/logo.svg')).toBe(false)
  })

  it('resolves paths relative to the source Markdown file', () => {
    expect(resolveDocRelativePath('index.md', 'assets/logo.svg')).toBe('assets/logo.svg')
    expect(resolveDocRelativePath('index.md', './assets/logo.svg')).toBe('assets/logo.svg')
    expect(resolveDocRelativePath('guide/page.md', '../assets/logo.svg')).toBe('assets/logo.svg')
    expect(resolveDocRelativePath('showcase/extended/images.md', '../../assets/logo.svg')).toBe(
      'assets/logo.svg',
    )
    expect(resolveDocRelativePath('showcase/extended/images.md', './logo.svg')).toBe(
      'showcase/extended/logo.svg',
    )
  })

  it('keeps absolute and external paths unchanged', () => {
    expect(resolveDocRelativePath('guide/page.md', '/assets/logo.svg')).toBe('/assets/logo.svg')
    expect(resolveDocAssetUrl('guide/page.md', 'https://example.com/a.png', 'guide/page/index.html')).toBe(
      'https://example.com/a.png',
    )
  })

  it('builds URLs relative to the rendered HTML file', () => {
    expect(
      resolveDocAssetUrl(
        'showcase/extended/images.md',
        '../../assets/logo.svg',
        'showcase/extended/images/index.html',
      ),
    ).toBe('../../../assets/logo.svg')
    expect(
      resolveDocAssetUrl(
        'showcase/extended/images.md',
        './logo.svg',
        'showcase/extended/images/index.html',
      ),
    ).toBe('../logo.svg')
    expect(resolveDocAssetUrl('index.md', 'assets/logo.svg', 'index.html')).toBe('./assets/logo.svg')
    expect(resolveDocAssetUrl('guide/page.md', '/assets/logo.svg', 'guide/page/index.html')).toBe(
      '/assets/logo.svg',
    )
  })

  it('computes relative paths between output page and asset', () => {
    expect(
      computePageRelativeAssetUrl('showcase/extended/images/index.html', 'showcase/extended/logo.svg'),
    ).toBe('../logo.svg')
  })
})

describe('rewriteContentImages', () => {
  it('rewrites bare image src paths', () => {
    const html = '<p><img src="../../assets/logo.svg" alt="Logo"></p>'
    const out = rewriteContentImages(
      html,
      'showcase/extended/images.md',
      'showcase/extended/images/index.html',
    )
    expect(out).toContain('src="../../../assets/logo.svg"')
  })

  it('rewrites same-folder references for nested output pages', () => {
    const html = '<p><img src="./logo.svg" alt="Logo"></p>'
    const out = rewriteContentImages(
      html,
      'showcase/extended/images.md',
      'showcase/extended/images/index.html',
    )
    expect(out).toContain('src="../logo.svg"')
  })

  it('wraps images for lightbox when enabled', () => {
    const html = '<p><img src="assets/a.png" alt="One"></p><p><img src="assets/b.png" alt="Two"></p>'
    const out = rewriteContentImages(html, 'index.md', 'index.html', { lightbox: true })
    expect(out).toContain('<a href="./assets/a.png" class="glightbox" data-gallery="page-content" data-title="One">')
    expect(out).toContain('<a href="./assets/b.png" class="glightbox" data-gallery="page-content" data-title="Two">')
  })

  it('adds glightbox to linked images instead of double-wrapping', () => {
    const html = '<a href="assets/full.png"><img src="assets/thumb.png" alt="Linked"></a>'
    const out = rewriteContentImages(html, 'index.md', 'index.html', { lightbox: true })
    expect(out).toBe(
      '<a href="./assets/full.png" class="glightbox" data-gallery="page-content"><img src="./assets/thumb.png" alt="Linked"></a>',
    )
    expect(out.match(/<a\b/g)?.length).toBe(1)
  })

  it('respects data-no-lightbox', () => {
    const html = '<img src="assets/logo.svg" alt="Skip" data-no-lightbox>'
    const out = rewriteContentImages(html, 'index.md', 'index.html', { lightbox: true })
    expect(out).not.toContain('glightbox')
    expect(out).toContain('src="./assets/logo.svg"')
  })
})
