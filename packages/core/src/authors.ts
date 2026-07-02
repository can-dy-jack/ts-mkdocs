import { joinUrl } from './utils.js'

export interface AuthorDefinition {
  name: string
  title?: string
  description?: string
  avatar?: string
  /** Website URL string, or a map of platform → username / URL. */
  url?: string | Record<string, string>
  links?: Record<string, string>
}

export interface ResolvedAuthorLink {
  platform: string
  label: string
  href?: string
  iconHtml: string
}

export interface ResolvedAuthor {
  id?: string
  name: string
  title?: string
  avatar?: string
  links: ResolvedAuthorLink[]
}

interface SocialPlatform {
  label: string
  icon: string
  buildUrl?: (value: string) => string | undefined
}

const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  x: {
    label: 'X',
    icon: 'fontawesome/brands/x-twitter',
    buildUrl: (value) => `https://x.com/${stripAt(value)}`,
  },
  reddit: {
    label: 'Reddit',
    icon: 'fontawesome/brands/reddit',
    buildUrl: (value) => `https://reddit.com/user/${stripAt(value)}`,
  },
  youtube: {
    label: 'YouTube',
    icon: 'fontawesome/brands/youtube',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      const user = stripAt(value)
      return user.startsWith('channel/') || user.startsWith('c/')
        ? `https://youtube.com/${user}`
        : `https://youtube.com/@${user}`
    },
  },
  wechat: {
    label: 'WeChat',
    icon: 'fontawesome/brands/weixin',
  },
  qq: {
    label: 'QQ',
    icon: 'bootstrap/tencent-qq',
    buildUrl: (value) => `https://w.qq.com/kiweb/pc/index?uin=${encodeURIComponent(value)}`,
  },
  bilibili: {
    label: 'Bilibili',
    icon: 'material/ondemand_video',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      return `https://space.bilibili.com/${value}`
    },
  },
  github: {
    label: 'GitHub',
    icon: 'fontawesome/brands/github',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      return `https://github.com/${stripAt(value)}`
    },
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'fontawesome/brands/linkedin',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      return `https://linkedin.com/in/${stripAt(value)}`
    },
  },
  discord: {
    label: 'Discord',
    icon: 'fontawesome/brands/discord',
    buildUrl: (value) => (isAbsoluteUrl(value) ? value : undefined),
  },
  facebook: {
    label: 'Facebook',
    icon: 'fontawesome/brands/facebook',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      return `https://facebook.com/${stripAt(value)}`
    },
  },
  instagram: {
    label: 'Instagram',
    icon: 'fontawesome/brands/instagram',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      return `https://instagram.com/${stripAt(value)}`
    },
  },
  tiktok: {
    label: 'TikTok',
    icon: 'fontawesome/brands/tiktok',
    buildUrl: (value) => {
      if (isAbsoluteUrl(value)) return value
      return `https://tiktok.com/@${stripAt(value)}`
    },
  },
  website: {
    label: 'Website',
    icon: 'material/language',
    buildUrl: (value) => normalizeWebsiteUrl(value),
  },
}

const PLATFORM_ALIASES: Record<string, string> = {
  twitter: 'x',
  weixin: 'wechat',
  homepage: 'website',
  web: 'website',
  home: 'website',
  b站: 'bilibili',
  'bilibili.com': 'bilibili',
}

export function parseAuthorRegistry(
  extra: Record<string, unknown> | undefined,
): Record<string, AuthorDefinition> {
  const raw = extra?.authors
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const registry: Record<string, AuthorDefinition> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const entry = value as Record<string, unknown>
    const name = typeof entry.name === 'string' ? entry.name : id
    const url = parseAuthorUrlField(entry.url, entry.links)

    registry[id] = {
      name,
      title:
        typeof entry.title === 'string'
          ? entry.title
          : typeof entry.description === 'string'
            ? entry.description
            : undefined,
      description: typeof entry.description === 'string' ? entry.description : undefined,
      avatar: typeof entry.avatar === 'string' ? entry.avatar.trim() : undefined,
      url,
    }
  }
  return registry
}

function parseAuthorUrlField(
  url: unknown,
  links: unknown,
): string | Record<string, string> | undefined {
  if (typeof url === 'string' && url.trim()) return url.trim()
  if (url && typeof url === 'object' && !Array.isArray(url)) {
    return normalizeLinkMap(url as Record<string, unknown>)
  }
  if (links && typeof links === 'object' && !Array.isArray(links)) {
    return normalizeLinkMap(links as Record<string, unknown>)
  }
  return undefined
}

function normalizeLinkMap(raw: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim()
    }
  }
  return result
}

export function resolveAssetUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path
  if (path.startsWith('/')) return path
  return joinUrl(baseUrl, path.replace(/^\.\//, ''))
}

export function resolvePageAuthors(
  authorRefs: string[] | undefined,
  registry: Record<string, AuthorDefinition>,
  baseUrl: string,
  renderIcon: (ref: string) => string,
): ResolvedAuthor[] {
  if (!authorRefs?.length) return []

  return authorRefs.map((ref) => {
    const def = registry[ref]
    if (def) {
      return {
        id: ref,
        name: def.name,
        title: def.title ?? def.description,
        avatar: def.avatar ? resolveAssetUrl(baseUrl, def.avatar) : undefined,
        links: resolveAuthorLinks(def.url, renderIcon),
      }
    }

    return {
      id: ref,
      name: ref,
      links: [],
    }
  })
}

export function resolveAuthorLinks(
  url: string | Record<string, string> | undefined,
  renderIcon: (ref: string) => string,
): ResolvedAuthorLink[] {
  if (!url) return []

  if (typeof url === 'string') {
    return [
      {
        platform: 'website',
        label: SOCIAL_PLATFORMS.website.label,
        href: normalizeWebsiteUrl(url),
        iconHtml: renderIcon(SOCIAL_PLATFORMS.website.icon),
      },
    ]
  }

  const links: ResolvedAuthorLink[] = []
  for (const [rawPlatform, value] of Object.entries(url)) {
    const platform = normalizePlatform(rawPlatform)
    const config = SOCIAL_PLATFORMS[platform]
    if (!config) continue

    const href = isAbsoluteUrl(value)
      ? value
      : config.buildUrl?.(value)

    links.push({
      platform,
      label: href ? `${config.label}: ${value}` : `${config.label}: ${value}`,
      href,
      iconHtml: renderIcon(config.icon),
    })
  }
  return links
}

function normalizePlatform(platform: string): string {
  const key = platform.trim().toLowerCase()
  return PLATFORM_ALIASES[key] ?? key
}

function stripAt(value: string): string {
  return value.replace(/^@+/, '').trim()
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim()
  if (isAbsoluteUrl(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function shouldShowPageAuthors(
  authorRefs: string[] | undefined,
  hide: string[] | undefined,
): boolean {
  if (!authorRefs?.length) return false
  return !(hide?.includes('authors') || hide?.includes('meta'))
}
