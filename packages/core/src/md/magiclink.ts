import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import { parseRepoSource, type RepoProvider } from '../github.js'

export interface MagiclinkOptions {
  hide_protocol?: boolean
  repo_url_shortener?: boolean
  social_url_shortener?: boolean
  repo_url_shorthand?: boolean
  social_url_shorthand?: boolean
  provider?: string
  user?: string
  repo?: string
  labels?: Record<string, string>
  normalize_issue_symbols?: boolean
  shortener_user_exclude?: Record<string, string[]>
  custom?: Record<string, { type: RepoProvider | 'github' | 'gitlab' | 'bitbucket'; host: string; label: string; www?: boolean }>
}

interface RepoProviderInfo {
  name: string
  label: string
  baseUrl: string
  supportsDiscussions: boolean
  issuePath: (user: string, repo: string, num: string) => string
  pullPath: (user: string, repo: string, num: string) => string
  discussionPath?: (user: string, repo: string, num: string) => string
  commitPath: (user: string, repo: string, hash: string) => string
  comparePath: (user: string, repo: string, h1: string, h2: string) => string
  userPath: (user: string) => string
  repoPath: (user: string, repo: string) => string
}

interface ResolvedMagiclinkConfig {
  repoUrlShortener: boolean
  socialUrlShortener: boolean
  repoUrlShorthand: boolean
  socialUrlShorthand: boolean
  provider: string
  user: string
  repo: string
  labels: Record<string, string>
  normalizeIssueSymbols: boolean
  shortenerUserExclude: Record<string, Set<string>>
  providers: Record<string, RepoProviderInfo>
  isSocial: boolean
}

const DEFAULT_LABELS: Record<string, string> = {
  commit: 'Commit',
  compare: 'Compare',
  issue: 'Issue',
  pull: 'Pull Request',
  mention: 'User',
  repository: 'Repository',
}

const DEFAULT_EXCLUDES: Record<string, string[]> = {
  bitbucket: ['dashboard', 'account', 'plans', 'support', 'repo'],
  github: ['marketplace', 'notifications', 'issues', 'pull', 'sponsors', 'settings', 'support'],
  gitlab: ['dashboard', '-', 'explore', 'help', 'projects'],
  twitter: ['i', 'messages', 'bookmarks', 'home'],
  x: ['i', 'messages', 'bookmarks', 'home'],
}

const SOCIAL_PROVIDERS = new Set(['x', 'twitter'])
const HASH = '[0-9a-f]{7,40}'
const USER = '[\\w.-]+'
const REPO = '[\\w.-]+'

function createRepoProvider(name: string, label: string, baseUrl: string, type: 'github' | 'gitlab' | 'bitbucket'): RepoProviderInfo {
  const base = baseUrl.replace(/\/$/, '')
  if (type === 'gitlab') {
    return {
      name,
      label,
      baseUrl: base,
      supportsDiscussions: false,
      issuePath: (user, repo, num) => `${base}/${user}/${repo}/-/issues/${num}`,
      pullPath: (user, repo, num) => `${base}/${user}/${repo}/-/merge_requests/${num}`,
      commitPath: (user, repo, hash) => `${base}/${user}/${repo}/-/commit/${hash}`,
      comparePath: (user, repo, h1, h2) => `${base}/${user}/${repo}/-/compare/${h1}...${h2}`,
      userPath: (user) => `${base}/${user}`,
      repoPath: (user, repo) => `${base}/${user}/${repo}`,
    }
  }
  if (type === 'bitbucket') {
    return {
      name,
      label,
      baseUrl: base,
      supportsDiscussions: false,
      issuePath: (user, repo, num) => `${base}/${user}/${repo}/issues/${num}`,
      pullPath: (user, repo, num) => `${base}/${user}/${repo}/pull-requests/${num}`,
      commitPath: (user, repo, hash) => `${base}/${user}/${repo}/commits/${hash}`,
      comparePath: (user, repo, h1, h2) => `${base}/${user}/${repo}/commits/${h1}..${h2}`,
      userPath: (user) => `${base}/${user}`,
      repoPath: (user, repo) => `${base}/${user}/${repo}`,
    }
  }
  return {
    name,
    label,
    baseUrl: base,
    supportsDiscussions: true,
    issuePath: (user, repo, num) => `${base}/${user}/${repo}/issues/${num}`,
    pullPath: (user, repo, num) => `${base}/${user}/${repo}/pull/${num}`,
    discussionPath: (user, repo, num) => `${base}/${user}/${repo}/discussions/${num}`,
    commitPath: (user, repo, hash) => `${base}/${user}/${repo}/commit/${hash}`,
    comparePath: (user, repo, h1, h2) => `${base}/${user}/${repo}/compare/${h1}...${h2}`,
    userPath: (user) => `${base}/${user}`,
    repoPath: (user, repo) => `${base}/${user}/${repo}`,
  }
}

const BUILTIN_PROVIDERS: Record<string, RepoProviderInfo> = {
  github: createRepoProvider('github', 'GitHub', 'https://github.com', 'github'),
  gitlab: createRepoProvider('gitlab', 'GitLab', 'https://gitlab.com', 'gitlab'),
  bitbucket: createRepoProvider('bitbucket', 'Bitbucket', 'https://bitbucket.org', 'bitbucket'),
  x: {
    name: 'x',
    label: 'X',
    baseUrl: 'https://x.com',
    supportsDiscussions: false,
    issuePath: () => '',
    pullPath: () => '',
    commitPath: () => '',
    comparePath: () => '',
    userPath: (user) => `https://x.com/${user}`,
    repoPath: () => '',
  },
  twitter: {
    name: 'twitter',
    label: 'X',
    baseUrl: 'https://twitter.com',
    supportsDiscussions: false,
    issuePath: () => '',
    pullPath: () => '',
    commitPath: () => '',
    comparePath: () => '',
    userPath: (user) => `https://twitter.com/${user}`,
    repoPath: () => '',
  },
}

function escapeHostForRegex(host: string): string {
  const url = host.includes('://') ? host : `https://${host}`
  const parsed = new URL(url)
  const hostname = parsed.hostname.replace(/^www\./, '')
  const escaped = hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `(?:www\\.)?${escaped}`
}

function shortHash(hash: string): string {
  return hash.slice(0, 7)
}

function isBoundaryChar(ch: string | undefined): boolean {
  return !ch || /[\s([{<"'`]/.test(ch)
}

function pushLink(
  state: StateInline,
  href: string,
  text: string,
  classes: string[],
  title: string,
): void {
  const tokenOpen = state.push('link_open', 'a', 1)
  tokenOpen.attrs = [
    ['href', href],
    ['class', classes.join(' ')],
    ['title', title],
  ]
  const tokenText = state.push('text', '', 0)
  tokenText.content = text
  state.push('link_close', 'a', -1)
}

function resolveProviderName(name: string): string {
  if (name === 'twitter') return 'x'
  return name
}

export function resolveMagiclinkConfig(
  opts: MagiclinkOptions,
  site: { repo_url?: string; repo_name?: string },
): ResolvedMagiclinkConfig {
  const repoSource = site.repo_url ? parseRepoSource(site.repo_url, site.repo_name) : undefined
  let provider = resolveProviderName(String(opts.provider ?? repoSource?.provider ?? 'github'))
  if (provider === 'unknown') provider = 'github'

  const providers: Record<string, RepoProviderInfo> = { ...BUILTIN_PROVIDERS }
  for (const [name, entry] of Object.entries(opts.custom ?? {})) {
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
      throw new Error(`Name '${name}' not allowed, provider name must contain only letters and numbers`)
    }
    const type = entry.type === 'unknown' ? 'github' : entry.type
    providers[name] = createRepoProvider(name, entry.label, entry.host, type)
  }

  if (!(provider in providers)) provider = 'github'

  const shortenerUserExclude: Record<string, Set<string>> = {}
  for (const [key, values] of Object.entries(DEFAULT_EXCLUDES)) {
    shortenerUserExclude[key] = new Set(values.map((v) => v.toLowerCase()))
  }
  for (const [key, values] of Object.entries(opts.shortener_user_exclude ?? {})) {
    if (Array.isArray(values)) {
      shortenerUserExclude[key] = new Set(values.map((v) => String(v).toLowerCase()))
    }
  }

  return {
    repoUrlShortener: Boolean(opts.repo_url_shortener),
    socialUrlShortener: Boolean(opts.social_url_shortener),
    repoUrlShorthand: Boolean(opts.repo_url_shorthand),
    socialUrlShorthand: Boolean(opts.social_url_shorthand),
    provider,
    user: String(opts.user ?? repoSource?.owner ?? ''),
    repo: String(opts.repo ?? repoSource?.repo ?? ''),
    labels: { ...DEFAULT_LABELS, ...(opts.labels ?? {}) },
    normalizeIssueSymbols: Boolean(opts.normalize_issue_symbols),
    shortenerUserExclude,
    providers,
    isSocial: SOCIAL_PROVIDERS.has(provider),
  }
}

function issueDisplay(prefix: '#' | '!' | '?', num: string, cfg: ResolvedMagiclinkConfig): string {
  if (cfg.normalizeIssueSymbols) return `#${num}`
  return `${prefix}${num}`
}

function issueTitle(
  provider: RepoProviderInfo,
  kind: 'issue' | 'pull' | 'discussion',
  info: string,
  cfg: ResolvedMagiclinkConfig,
): string {
  const label = cfg.labels[kind === 'discussion' ? 'issue' : kind] ?? DEFAULT_LABELS[kind]
  return `${provider.label} ${label}: ${info}`
}

function linkClasses(provider: string, kind: string): string[] {
  return ['magiclink', `magiclink-${provider}`, `magiclink-${kind}`]
}

function parseScopedUser(raw: string, defaultProvider: string): { provider: string; user: string } {
  const idx = raw.indexOf(':')
  if (idx > 0) return { provider: resolveProviderName(raw.slice(0, idx)), user: raw.slice(idx + 1) }
  return { provider: defaultProvider, user: raw }
}

interface RefTarget {
  provider: string
  user: string
  repo: string
}

function resolveRefTarget(cfg: ResolvedMagiclinkConfig, scope?: string): RefTarget | null {
  if (!scope) {
    if (!cfg.user || !cfg.repo) return null
    return { provider: cfg.provider, user: cfg.user, repo: cfg.repo }
  }

  let provider = cfg.provider
  let rest = scope
  const colonIdx = scope.indexOf(':')
  if (colonIdx > 0) {
    provider = resolveProviderName(scope.slice(0, colonIdx))
    rest = scope.slice(colonIdx + 1)
  }

  const parts = rest.split('/').filter(Boolean)
  if (parts.length === 1) {
    if (!cfg.user) return null
    return { provider, user: cfg.user, repo: parts[0] }
  }
  if (parts.length >= 2) {
    return { provider, user: parts.slice(0, -1).join('/'), repo: parts[parts.length - 1] }
  }
  return null
}

function handleIssueRef(
  state: StateInline,
  cfg: ResolvedMagiclinkConfig,
  prefix: '#' | '!' | '?',
  num: string,
  scope?: string,
): boolean {
  const target = resolveRefTarget(cfg, scope)
  if (!target) return false
  const provider = cfg.providers[target.provider]
  if (!provider || cfg.isSocial) return false
  if (prefix === '?' && !provider.supportsDiscussions) return false

  let href = ''
  if (prefix === '#') href = provider.issuePath(target.user, target.repo, num)
  else if (prefix === '!') href = provider.pullPath(target.user, target.repo, num)
  else href = provider.discussionPath?.(target.user, target.repo, num) ?? ''
  if (!href) return false

  const isDefault =
    target.provider === cfg.provider && target.user === cfg.user && target.repo === cfg.repo
  const text = isDefault
    ? issueDisplay(prefix, num, cfg)
    : `${target.user}/${target.repo}${issueDisplay(prefix, num, cfg)}`
  const kind = prefix === '!' ? 'pull' : 'issue'
  const title = issueTitle(provider, prefix === '!' ? 'pull' : prefix === '?' ? 'discussion' : 'issue', num, cfg)
  pushLink(state, href, text, linkClasses(provider.name, kind), title)
  return true
}

function handleCommitRef(state: StateInline, cfg: ResolvedMagiclinkConfig, hash: string, scope?: string): boolean {
  const target = resolveRefTarget(cfg, scope)
  if (!target) return false
  const provider = cfg.providers[target.provider]
  if (!provider || cfg.isSocial) return false

  const href = provider.commitPath(target.user, target.repo, hash)
  const isDefault =
    target.provider === cfg.provider && target.user === cfg.user && target.repo === cfg.repo
  const text = isDefault ? shortHash(hash) : `${target.user}/${target.repo}@${shortHash(hash)}`
  const title = `${provider.label} ${cfg.labels.commit}: ${hash}`
  pushLink(state, href, text, linkClasses(provider.name, 'commit'), title)
  return true
}

function handleCompareRef(
  state: StateInline,
  cfg: ResolvedMagiclinkConfig,
  h1: string,
  h2: string,
  scope?: string,
): boolean {
  const target = resolveRefTarget(cfg, scope)
  if (!target) return false
  const provider = cfg.providers[target.provider]
  if (!provider || cfg.isSocial) return false

  const href = provider.comparePath(target.user, target.repo, h1, h2)
  const short = `${shortHash(h1)}...${shortHash(h2)}`
  const isDefault =
    target.provider === cfg.provider && target.user === cfg.user && target.repo === cfg.repo
  const text = isDefault ? short : `${target.user}/${target.repo}@${short}`
  const title = `${provider.label} ${cfg.labels.compare}: ${h1}...${h2}`
  pushLink(state, href, text, linkClasses(provider.name, 'compare'), title)
  return true
}

function registerShorthandRules(md: MarkdownIt, cfg: ResolvedMagiclinkConfig): void {
  const tryMatch = (
    state: StateInline,
    silent: boolean,
    pattern: RegExp,
    handler: (match: RegExpMatchArray) => boolean,
  ): boolean => {
    const src = state.src.slice(state.pos)
    const match = src.match(pattern)
    if (!match) return false
    if (!isBoundaryChar(state.src[state.pos - 1])) return false
    if (silent) return true
    if (!handler(match)) return false
    state.pos += match[0].length
    return true
  }

  if (cfg.repoUrlShorthand && !cfg.isSocial) {
    md.inline.ruler.before('text', 'magiclink-int-issue', (state, silent) =>
      tryMatch(state, silent, /^([#!?])(\d+)/, (m) => handleIssueRef(state, cfg, m[1] as '#' | '!' | '?', m[2])),
    )

    md.inline.ruler.before('text', 'magiclink-ext-issue', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^((?:[\\w.-]+:)?[\\w.-]+(?:\\/${REPO})?)((?:[#!?])(?:\\d+))`), (m) => {
        const scope = m[1]
        const ref = m[2]
        const prefix = ref[0] as '#' | '!' | '?'
        const num = ref.slice(1)
        return handleIssueRef(state, cfg, prefix, num, scope)
      }),
    )

    md.inline.ruler.before('text', 'magiclink-int-compare', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^(${HASH})\\.\\.\\.(${HASH})(?![\\w-])`), (m) =>
        handleCompareRef(state, cfg, m[1], m[2]),
      ),
    )

    md.inline.ruler.before('text', 'magiclink-ext-compare', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^((?:[\\w.-]+:)?[\\w.-]+(?:\\/${REPO})?)@(${HASH})\\.\\.\\.(${HASH})`), (m) =>
        handleCompareRef(state, cfg, m[2], m[3], m[1]),
      ),
    )

    md.inline.ruler.before('text', 'magiclink-ext-commit', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^((?:[\\w.-]+:)?[\\w.-]+(?:\\/${REPO})?)@(${HASH})(?!\\.\\.\\.)`), (m) =>
        handleCommitRef(state, cfg, m[2], m[1]),
      ),
    )

    md.inline.ruler.before('text', 'magiclink-int-commit', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^(${HASH})(?![\\w-])`), (m) => handleCommitRef(state, cfg, m[1])),
    )

    md.inline.ruler.before('text', 'magiclink-repo-mention', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^@((?:${USER})(?::${USER})?)\\/(${REPO})`), (m) => {
        const scoped = parseScopedUser(m[1], cfg.provider)
        const provider = cfg.providers[scoped.provider]
        if (!provider?.repoPath) return false
        const href = provider.repoPath(scoped.user, m[2])
        const text = `${scoped.user}/${m[2]}`
        const title = `${provider.label} ${cfg.labels.repository}: ${text}`
        pushLink(state, href, text, linkClasses(provider.name, 'repository'), title)
        return true
      }),
    )
  }

  if (cfg.repoUrlShorthand || cfg.socialUrlShorthand) {
    md.inline.ruler.before('text', 'magiclink-mention', (state, silent) =>
      tryMatch(state, silent, new RegExp(`^@((?:${USER})(?::${USER})?)(?!\\/)`), (m) => {
        const scoped = parseScopedUser(m[1], cfg.provider)
        const provider = cfg.providers[scoped.provider]
        if (!provider) return false
        const href = provider.userPath(scoped.user)
        const text = `@${scoped.user}`
        const title = `${provider.label} ${cfg.labels.mention}: ${scoped.user}`
        pushLink(state, href, text, linkClasses(provider.name, 'mention'), title)
        return true
      }),
    )
  }
}

function renderAnchor(href: string, text: string, classes: string[], title: string): string {
  const esc = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<a href="${esc(href)}" class="${esc(classes.join(' '))}" title="${esc(title)}">${esc(text)}</a>`
}

function renderIssueAnchor(
  provider: RepoProviderInfo,
  providerName: string,
  user: string,
  repo: string,
  prefix: '#' | '!' | '?',
  num: string,
  cfg: ResolvedMagiclinkConfig,
): string {
  const isDefault = providerName === cfg.provider && user === cfg.user && repo === cfg.repo
  const display = isDefault
    ? issueDisplay(prefix, num, cfg)
    : `${user}/${repo}${issueDisplay(prefix, num, cfg)}`
  let href = ''
  if (prefix === '#') href = provider.issuePath(user, repo, num)
  else if (prefix === '!') href = provider.pullPath(user, repo, num)
  else href = provider.discussionPath?.(user, repo, num) ?? ''
  const kind = prefix === '!' ? 'pull' : 'issue'
  const title = issueTitle(provider, prefix === '!' ? 'pull' : prefix === '?' ? 'discussion' : 'issue', num, cfg)
  return renderAnchor(href, display, linkClasses(providerName, kind), title)
}

function shortenRepoAnchor(href: string, cfg: ResolvedMagiclinkConfig): string | null {
  for (const [providerName, provider] of Object.entries(cfg.providers)) {
    if (SOCIAL_PROVIDERS.has(providerName)) continue
    const hostPattern = escapeHostForRegex(provider.baseUrl)

    const userMatch = href.match(new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/?$`, 'i'))
    if (userMatch) {
      const user = userMatch[1]
      if (cfg.shortenerUserExclude[providerName]?.has(user.toLowerCase())) return null
      const title = `${provider.label} ${cfg.labels.mention}: ${user}`
      return renderAnchor(provider.userPath(user), `@${user}`, linkClasses(providerName, 'mention'), title)
    }

    const repoMatch = href.match(new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/(${REPO})\\/?$`, 'i'))
    if (repoMatch) {
      const user = repoMatch[1]
      const repo = repoMatch[2]
      if (cfg.shortenerUserExclude[providerName]?.has(user.toLowerCase())) return null
      const display = `${user}/${repo}`
      const title = `${provider.label} ${cfg.labels.repository}: ${display}`
      return renderAnchor(provider.repoPath(user, repo), display, linkClasses(providerName, 'repository'), title)
    }

    const issueMatch = href.match(new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/(${REPO})\\/issues\\/(\\d+)\\/?$`, 'i'))
    if (issueMatch) {
      return renderIssueAnchor(provider, providerName, issueMatch[1], issueMatch[2], '#', issueMatch[3], cfg)
    }

    const pullMatch = href.match(
      new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/(${REPO})\\/(?:pull|merge_requests|pull-requests)\\/(\\d+)\\/?$`, 'i'),
    )
    if (pullMatch) {
      return renderIssueAnchor(provider, providerName, pullMatch[1], pullMatch[2], '!', pullMatch[3], cfg)
    }

    const discussMatch = href.match(
      new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/(${REPO})\\/discussions\\/(\\d+)\\/?$`, 'i'),
    )
    if (discussMatch && provider.supportsDiscussions) {
      return renderIssueAnchor(provider, providerName, discussMatch[1], discussMatch[2], '?', discussMatch[3], cfg)
    }

    const commitMatch = href.match(
      new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/(${REPO})\\/(?:commit|commits)\\/(${HASH})\\/?$`, 'i'),
    )
    if (commitMatch) {
      const hash = commitMatch[3]
      const isDefault =
        providerName === cfg.provider && commitMatch[1] === cfg.user && commitMatch[2] === cfg.repo
      const display = isDefault ? shortHash(hash) : `${commitMatch[1]}/${commitMatch[2]}@${shortHash(hash)}`
      const title = `${provider.label} ${cfg.labels.commit}: ${hash}`
      return renderAnchor(
        provider.commitPath(commitMatch[1], commitMatch[2], hash),
        display,
        linkClasses(providerName, 'commit'),
        title,
      )
    }

    const compareMatch = href.match(
      new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/(${REPO})\\/(?:compare|commits)\\/(${HASH})(?:\\.\\.\\.|\\.\\.)(${HASH})\\/?$`, 'i'),
    )
    if (compareMatch) {
      const h1 = compareMatch[3]
      const h2 = compareMatch[4]
      const short = `${shortHash(h1)}...${shortHash(h2)}`
      const isDefault =
        providerName === cfg.provider && compareMatch[1] === cfg.user && compareMatch[2] === cfg.repo
      const display = isDefault ? short : `${compareMatch[1]}/${compareMatch[2]}@${short}`
      const title = `${provider.label} ${cfg.labels.compare}: ${h1}...${h2}`
      return renderAnchor(
        provider.comparePath(compareMatch[1], compareMatch[2], h1, h2),
        display,
        linkClasses(providerName, 'compare'),
        title,
      )
    }
  }
  return null
}

function shortenSocialAnchor(href: string, cfg: ResolvedMagiclinkConfig): string | null {
  for (const providerName of ['x', 'twitter'] as const) {
    const provider = cfg.providers[providerName]
    if (!provider) continue
    const hostPattern = escapeHostForRegex(provider.baseUrl)
    const match = href.match(new RegExp(`^https?:\\/\\/${hostPattern}\\/(${USER})\\/?$`, 'i'))
    if (!match) continue
    const user = match[1]
    if (cfg.shortenerUserExclude[providerName]?.has(user.toLowerCase())) return null
    const resolvedName = providerName === 'twitter' ? 'x' : providerName
    const title = `${provider.label} ${cfg.labels.mention}: ${user}`
    return renderAnchor(provider.userPath(user), `@${user}`, linkClasses(resolvedName, 'mention'), title)
  }
  return null
}

function shortenHtmlLinks(html: string, cfg: ResolvedMagiclinkConfig): string {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs, content) => {
    if (/\bclass="[^"]*\bmagiclink\b/.test(attrs)) return full
    const hrefMatch = attrs.match(/\bhref="([^"]+)"/)
    if (!hrefMatch) return full
    const href = hrefMatch[1]
    const plainText = content.replace(/<[^>]+>/g, '').trim()
    if (plainText !== href && !/^https?:\/\//.test(plainText)) return full

    let replacement: string | null = null
    if (cfg.repoUrlShortener) replacement = shortenRepoAnchor(href, cfg)
    if (!replacement && cfg.socialUrlShortener) replacement = shortenSocialAnchor(href, cfg)
    return replacement ?? full
  })
}

export function magiclinkPlugin(
  md: MarkdownIt,
  opts: MagiclinkOptions = {},
  site: { repo_url?: string; repo_name?: string } = {},
): void {
  const cfg = resolveMagiclinkConfig(opts, site)

  if (cfg.repoUrlShorthand || cfg.socialUrlShorthand) {
    registerShorthandRules(md, cfg)
  }

  if (cfg.repoUrlShortener || cfg.socialUrlShortener) {
    const defaultRender = md.render.bind(md)
    md.render = (src, env) => shortenHtmlLinks(defaultRender(src, env), cfg)
  }
}
