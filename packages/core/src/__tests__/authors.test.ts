import { describe, expect, it } from 'vitest'
import {
  parseAuthorRegistry,
  resolveAssetUrl,
  resolveAuthorLinks,
  resolvePageAuthors,
  shouldShowPageAuthors,
} from '../authors.js'

const renderIcon = (ref: string) => `<i data-icon="${ref}"></i>`

describe('authors', () => {
  it('parses author registry from extra config', () => {
    const registry = parseAuthorRegistry({
      authors: {
        alice: {
          name: 'Alice Doe',
          title: 'Maintainer',
          avatar: 'assets/alice.jpg',
          url: {
            x: 'alice',
            website: 'https://example.com',
          },
        },
        team: {
          name: 'Team',
          description: 'Contributors',
          url: 'https://example.com/team',
        },
      },
    })

    expect(registry.alice.name).toBe('Alice Doe')
    expect(registry.alice.avatar).toBe('assets/alice.jpg')
    expect(registry.alice.url).toEqual({ x: 'alice', website: 'https://example.com' })
    expect(registry.team.url).toBe('https://example.com/team')
    expect(registry.team.title).toBe('Contributors')
  })

  it('resolves page authors with avatar and social links', () => {
    const registry = parseAuthorRegistry({
      authors: {
        alice: {
          name: 'Alice Doe',
          title: 'Writer',
          avatar: 'assets/alice.jpg',
          url: {
            x: 'alice',
            bilibili: '12345',
            wechat: 'wxid_alice',
          },
        },
      },
    })

    const authors = resolvePageAuthors(['alice', 'unknown'], registry, '../../', renderIcon)
    expect(authors).toHaveLength(2)
    expect(authors[0].avatar).toBe('../../assets/alice.jpg')
    expect(authors[0].links).toHaveLength(3)
    expect(authors[0].links[0]).toMatchObject({
      platform: 'x',
      href: 'https://x.com/alice',
    })
    expect(authors[0].links[1]).toMatchObject({
      platform: 'bilibili',
      href: 'https://space.bilibili.com/12345',
    })
    expect(authors[0].links[2]).toMatchObject({
      platform: 'wechat',
      href: undefined,
    })
    expect(authors[1].name).toBe('unknown')
    expect(authors[1].avatar).toBeUndefined()
  })

  it('resolves legacy website url string', () => {
    const links = resolveAuthorLinks('example.com', renderIcon)
    expect(links).toHaveLength(1)
    expect(links[0].platform).toBe('website')
    expect(links[0].href).toBe('https://example.com')
    expect(links[0].iconHtml).toContain('material/language')
  })

  it('resolves asset urls', () => {
    expect(resolveAssetUrl('../../', 'assets/logo.svg')).toBe('../../assets/logo.svg')
    expect(resolveAssetUrl('./', 'https://example.com/a.png')).toBe('https://example.com/a.png')
  })

  it('respects hide flags for author display', () => {
    expect(shouldShowPageAuthors(['alice'], undefined)).toBe(true)
    expect(shouldShowPageAuthors(['alice'], ['authors'])).toBe(false)
    expect(shouldShowPageAuthors(['alice'], ['meta'])).toBe(false)
    expect(shouldShowPageAuthors([], undefined)).toBe(false)
  })
})
