export type RepoProvider = 'github' | 'gitlab' | 'bitbucket' | 'unknown'

export interface RepoSource {
  url: string
  name: string
  provider: RepoProvider
  owner?: string
  repo?: string
}

export interface RepoSourceIcons {
  repo: string
  version: string
  stars: string
  forks: string
}

const REPO_ICON_REFS: Record<RepoProvider, string> = {
  github: 'fontawesome/brands/github',
  gitlab: 'fontawesome/brands/gitlab',
  bitbucket: 'fontawesome/brands/bitbucket',
  unknown: 'material/fork_right',
}

function stripGitSuffix(value: string): string {
  return value.replace(/\.git$/, '')
}

function parsePathSegments(pathname: string): string[] {
  return pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
}

export function parseRepoSource(repoUrl: string, repoName?: string): RepoSource | undefined {
  let url: URL
  try {
    url = new URL(repoUrl)
  } catch {
    return undefined
  }

  const hostname = url.hostname.replace(/^www\./, '')
  let provider: RepoProvider = 'unknown'
  let owner: string | undefined
  let repo: string | undefined

  const segments = parsePathSegments(url.pathname)

  if (hostname === 'github.com' && segments.length >= 2) {
    provider = 'github'
    owner = segments[0]
    repo = stripGitSuffix(segments[1])
  } else if (hostname === 'gitlab.com' && segments.length >= 2) {
    provider = 'gitlab'
    repo = stripGitSuffix(segments[segments.length - 1])
    owner = segments.slice(0, -1).join('/')
  } else if (hostname === 'bitbucket.org' && segments.length >= 2) {
    provider = 'bitbucket'
    owner = segments[0]
    repo = stripGitSuffix(segments[1])
  }

  const inferredName =
    owner && repo
      ? provider === 'gitlab'
        ? `${owner}/${repo}`
        : `${owner}/${repo}`
      : stripGitSuffix(segments.join('/'))

  const name = repoName?.trim() || inferredName
  if (!name) return undefined

  return {
    url: repoUrl.replace(/\/$/, ''),
    name,
    provider,
    owner,
    repo,
  }
}

export interface RepoStats {
  stars?: number
  forks?: number
  version?: string
}

interface RepoStatsCacheEntry {
  ts: number
  stats: RepoStats
}

const REPO_STATS_CACHE = new Map<string, RepoStatsCacheEntry>()
const REPO_STATS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes, keeps `serve` rebuilds from re-fetching every time
const REPO_STATS_FETCH_TIMEOUT_MS = 5000

async function fetchGithubJson(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REPO_STATS_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetches star/fork counts and the latest release version for a GitHub repo
 * server-side (at build time), so the token never ships to the browser and
 * visitors never hit GitHub's anonymous rate limit. Results are cached in
 * memory for `REPO_STATS_CACHE_TTL` to avoid refetching on every `serve` rebuild.
 */
export async function fetchRepoStats(
  repoSource: RepoSource | undefined,
  token?: string,
): Promise<RepoStats | undefined> {
  if (!repoSource || repoSource.provider !== 'github' || !repoSource.owner || !repoSource.repo) {
    return undefined
  }

  const cacheKey = `${repoSource.owner}/${repoSource.repo}`
  const cached = REPO_STATS_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < REPO_STATS_CACHE_TTL) {
    return cached.stats
  }

  const repoPath = cacheKey
  const data = await fetchGithubJson(`https://api.github.com/repos/${repoPath}`, token)
  if (!data) return cached?.stats

  const stats: RepoStats = {
    stars: data.stargazers_count,
    forks: data.forks_count,
  }

  const release = await fetchGithubJson(`https://api.github.com/repos/${repoPath}/releases/latest`, token)
  if (release?.tag_name) {
    stats.version = String(release.tag_name).replace(/^v/, '')
  } else {
    const tags = await fetchGithubJson(`https://api.github.com/repos/${repoPath}/tags`, token)
    if (Array.isArray(tags) && tags[0]?.name) {
      stats.version = String(tags[0].name).replace(/^v/, '')
    }
  }

  REPO_STATS_CACHE.set(cacheKey, { ts: Date.now(), stats })
  return stats
}

export function buildRepoSourceIcons(
  renderIcon: (ref: string) => string,
  repoSource?: RepoSource,
): RepoSourceIcons | undefined {
  if (!repoSource) return undefined

  return {
    repo: renderIcon(REPO_ICON_REFS[repoSource.provider]),
    version: renderIcon('material/sell'),
    stars: renderIcon('material/star'),
    forks: renderIcon('material/fork_right'),
  }
}
