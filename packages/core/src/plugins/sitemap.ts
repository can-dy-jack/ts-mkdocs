import { writeFileSync, statSync, existsSync } from 'fs'
import { join, relative, extname } from 'path'
import type { Plugin } from '../plugins.js'
import { walkDir } from '../utils.js'

interface SitemapConfig {
  hostname: string
  changefreq: string
  priority: number
  exclude: string[]
}

const DEFAULT_CONFIG: Omit<SitemapConfig, 'hostname'> = {
  changefreq: 'weekly',
  priority: 0.8,
  exclude: [],
}

/** Patterns to skip (non-document pages). */
const SKIP_PATTERNS = [
  '404.html',
  'search/',
  'assets/',
  'tags/',
]

function isDocumentPage(filePath: string, siteDir: string): boolean {
  const rel = relative(siteDir, filePath).replace(/\\/g, '/')

  // Skip non-HTML files
  if (extname(rel) !== '.html') return false

  // Skip known non-document paths
  for (const pattern of SKIP_PATTERNS) {
    if (rel === pattern || rel.startsWith(pattern)) return false
  }

  return true
}

function toUrl(filePath: string, siteDir: string, hostname: string): string {
  const rel = relative(siteDir, filePath).replace(/\\/g, '/')
  const urlPath = rel === 'index.html' ? '' : rel.replace(/\/index\.html$/, '/')
  const base = hostname.replace(/\/+$/, '')
  return `${base}/${urlPath}`
}

function getLastMod(filePath: string): string {
  try {
    const stat = statSync(filePath)
    return stat.mtime.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const sitemapPlugin: Plugin = {
  name: 'sitemap',

  configure(options: Record<string, unknown>) {
    const cfg = options as Partial<SitemapConfig>
    if (cfg.hostname) {
      sitemapPlugin._config = {
        ...DEFAULT_CONFIG,
        hostname: cfg.hostname.replace(/\/+$/, ''),
        changefreq: cfg.changefreq ?? DEFAULT_CONFIG.changefreq,
        priority: cfg.priority ?? DEFAULT_CONFIG.priority,
        exclude: Array.isArray(cfg.exclude) ? cfg.exclude : DEFAULT_CONFIG.exclude,
      }
    }
  },

  _config: null as SitemapConfig | null,

  on_post_build(config) {
    const sitemapCfg = sitemapPlugin._config
    if (!sitemapCfg) return

    const { site_dir } = config
    const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number }> = []

    for (const filePath of walkDir(site_dir)) {
      if (!isDocumentPage(filePath, site_dir)) continue

      const url = toUrl(filePath, site_dir, sitemapCfg.hostname)

      // Check exclude patterns
      const rel = relative(site_dir, filePath).replace(/\\/g, '/')
      const excluded = sitemapCfg.exclude.some((pattern) => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
          return regex.test(rel)
        }
        return rel === pattern || rel.startsWith(pattern)
      })
      if (excluded) continue

      urls.push({
        loc: escapeXml(url),
        lastmod: getLastMod(filePath),
        changefreq: sitemapCfg.changefreq,
        priority: sitemapCfg.priority,
      })
    }

    // Sort by URL for deterministic output
    urls.sort((a, b) => a.loc.localeCompare(b.loc))

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
      ),
      '</urlset>',
      '',
    ].join('\n')

    const outPath = join(site_dir, 'sitemap.xml')
    writeFileSync(outPath, xml, 'utf-8')
  },
}
