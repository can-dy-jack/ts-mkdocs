import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { magiclinkPlugin, resolveMagiclinkConfig } from '../md/magiclink.js'

function createParser(opts: Record<string, unknown>, site: { repo_url?: string; repo_name?: string } = {}): MarkdownIt {
  const md = new MarkdownIt({ linkify: true })
  magiclinkPlugin(md, opts, site)
  return md
}

describe('resolveMagiclinkConfig', () => {
  it('infers user and repo from repo_url', () => {
    const cfg = resolveMagiclinkConfig(
      { repo_url_shorthand: true },
      { repo_url: 'https://github.com/facelessuser/pymdown-extensions' },
    )
    expect(cfg.user).toBe('facelessuser')
    expect(cfg.repo).toBe('pymdown-extensions')
    expect(cfg.provider).toBe('github')
  })

  it('rejects invalid custom provider names', () => {
    expect(() =>
      resolveMagiclinkConfig({ custom: { 'bad-name': { type: 'github', host: 'http://test.com', label: 'Test' } } }, {}),
    ).toThrow(/not allowed/)
  })
})

describe('magiclink shorthand', () => {
  const site = { repo_url: 'https://github.com/facelessuser/pymdown-extensions' }
  const opts = { repo_url_shorthand: true }

  it('links default issue, pull, and discussion refs', () => {
    const md = createParser(opts, site)
    expect(md.renderInline('#2')).toContain('href="https://github.com/facelessuser/pymdown-extensions/issues/2"')
    expect(md.renderInline('#2')).toContain('>#2</a>')
    expect(md.renderInline('!13')).toContain('/pull/13')
    expect(md.renderInline('?1173')).toContain('/discussions/1173')
  })

  it('links external repo refs', () => {
    const md = createParser(opts, site)
    expect(md.renderInline('Python-Markdown/markdown#1')).toContain('Python-Markdown/markdown/issues/1')
    expect(md.renderInline('Python-Markdown/markdown!598')).toContain('/pull/598')
  })

  it('links commit and compare refs', () => {
    const md = createParser({ ...opts, user: 'facelessuser', repo: 'pymdown-extensions' }, site)
    const hash = '3f6b07a8eeaa9d606115758d90f55fec565d4e2a'
    expect(md.renderInline(hash)).toContain('>3f6b07a</a>')
    expect(md.renderInline(`${hash}...90b6fb8711e75732f987982cc024e9bb0111beac`)).toContain('>3f6b07a...90b6fb8</a>')
  })

  it('links mentions and repository mentions', () => {
    const md = createParser(opts, site)
    expect(md.renderInline('@facelessuser')).toContain('href="https://github.com/facelessuser"')
    expect(md.renderInline('@facelessuser/pymdown-extensions')).toContain('facelessuser/pymdown-extensions</a>')
    expect(md.renderInline('@facelessuser/pymdown-extensions')).not.toContain('@facelessuser/pymdown-extensions</a>')
  })

  it('normalizes issue symbols when configured', () => {
    const md = createParser({ ...opts, normalize_issue_symbols: true }, site)
    expect(md.renderInline('!13')).toContain('>#13</a>')
  })
})

describe('magiclink shortener', () => {
  it('shortens repository links to shorthand text', () => {
    const md = createParser({ repo_url_shortener: true })
    expect(md.render('https://github.com/facelessuser')).toContain('>@facelessuser</a>')
    expect(md.render('https://github.com/facelessuser/pymdown-extensions')).toContain(
      '>facelessuser/pymdown-extensions</a>',
    )
  })

  it('shortens default repo issue and commit links', () => {
    const md = createParser(
      { repo_url_shortener: true, user: 'facelessuser', repo: 'pymdown-extensions', provider: 'github' },
      { repo_url: 'https://github.com/facelessuser/pymdown-extensions' },
    )
    expect(md.render('https://github.com/facelessuser/pymdown-extensions/issues/2')).toContain('>#2</a>')
    expect(md.render('https://github.com/facelessuser/pymdown-extensions/pull/13')).toContain('>!13</a>')
    expect(
      md.render('https://github.com/facelessuser/pymdown-extensions/commit/3f6b07a8eeaa9d606115758d90f55fec565d4e2a'),
    ).toContain('>3f6b07a</a>')
  })

  it('does not shorten excluded users', () => {
    const md = createParser({ repo_url_shortener: true })
    expect(md.render('https://github.com/support')).toContain('https://github.com/support')
    expect(md.render('https://github.com/support')).not.toContain('>@support</a>')
  })

  it('shortens social links when enabled', () => {
    const md = createParser({ social_url_shortener: true })
    expect(md.render('https://x.com/someuser')).toContain('>@someuser</a>')
  })
})
