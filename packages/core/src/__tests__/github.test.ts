import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseRepoSource, buildRepoSourceIcons, fetchRepoStats } from '../github'
import { renderIconRef } from '../icons'

describe('parseRepoSource', () => {
  it('parses GitHub repo URL', () => {
    const source = parseRepoSource('https://github.com/squidfunk/mkdocs-material')
    expect(source).toEqual({
      url: 'https://github.com/squidfunk/mkdocs-material',
      name: 'squidfunk/mkdocs-material',
      provider: 'github',
      owner: 'squidfunk',
      repo: 'mkdocs-material',
    })
  })

  it('prefers repo_name from config', () => {
    const source = parseRepoSource(
      'https://github.com/can-dy-jack/ts-mkdocs',
      'can-dy-jack/ts-mkdocs',
    )
    expect(source?.name).toBe('can-dy-jack/ts-mkdocs')
  })

  it('strips trailing slash and .git suffix', () => {
    const source = parseRepoSource('https://github.com/foo/bar.git/')
    expect(source?.repo).toBe('bar')
    expect(source?.url).toBe('https://github.com/foo/bar.git')
  })

  it('returns undefined for invalid URL', () => {
    expect(parseRepoSource('not-a-url')).toBeUndefined()
  })
})

describe('buildRepoSourceIcons', () => {
  const render = (ref: string) => renderIconRef(ref, 'material')

  it('renders provider and fact icons via icon library', () => {
    const source = parseRepoSource('https://github.com/foo/bar')!
    const icons = buildRepoSourceIcons(render, source)!
    expect(icons.repo).toContain('fa-brands')
    expect(icons.repo).toContain('fa-github')
    expect(icons.version).toContain('material-symbols-outlined')
    expect(icons.version).toContain('sell')
    expect(icons.stars).toContain('star')
    expect(icons.forks).toContain('fork_right')
  })

  it('returns undefined without repo source', () => {
    expect(buildRepoSourceIcons(render, undefined)).toBeUndefined()
  })
})

describe('fetchRepoStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns undefined for a non-github repo source', async () => {
    const source = { url: 'https://gitlab.com/foo/bar', name: 'foo/bar', provider: 'gitlab' as const }
    expect(await fetchRepoStats(source, undefined)).toBeUndefined()
  })

  it('returns undefined without a repo source', async () => {
    expect(await fetchRepoStats(undefined, undefined)).toBeUndefined()
  })

  it('sends the token as an Authorization header when provided', async () => {
    const seenHeaders: Record<string, string>[] = []
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      seenHeaders.push((init?.headers ?? {}) as Record<string, string>)
      return {
        ok: true,
        json: async () => ({ stargazers_count: 42, forks_count: 7 }),
      } as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const source = parseRepoSource(`https://github.com/foo/token-${Date.now()}`)!
    const stats = await fetchRepoStats(source, 'my-token')

    expect(stats?.stars).toBe(42)
    expect(stats?.forks).toBe(7)
    expect(seenHeaders[0]?.Authorization).toBe('Bearer my-token')
  })
})
