import { writeFileSync } from 'fs'
import { join } from 'path'
import type { Plugin } from '../plugins.js'

interface RobotsRule {
  user_agent: string
  disallow: string[]
  allow: string[]
}

interface RobotsConfig {
  rules: RobotsRule[]
  sitemap: string | null
  extra: string[]
}

const DEFAULT_RULES: RobotsRule[] = [
  {
    user_agent: '*',
    disallow: [],
    allow: [],
  },
]

const DEFAULT_CONFIG: RobotsConfig = {
  rules: DEFAULT_RULES,
  sitemap: null,
  extra: [],
}

export const robotsPlugin: Plugin = {
  name: 'robots',

  configure(options: Record<string, unknown>) {
    const rules: RobotsRule[] = []

    if (options.rules && Array.isArray(options.rules)) {
      for (const rule of options.rules) {
        if (rule && typeof rule === 'object') {
          rules.push({
            user_agent: (rule as Record<string, unknown>).user_agent as string ?? '*',
            disallow: Array.isArray((rule as Record<string, unknown>).disallow)
              ? (rule as Record<string, unknown>).disallow as string[]
              : [],
            allow: Array.isArray((rule as Record<string, unknown>).allow)
              ? (rule as Record<string, unknown>).allow as string[]
              : [],
          })
        }
      }
    }

    // Support simple shorthand: disallow/allow at top level (applies to User-agent: *)
    if (options.disallow || options.allow) {
      rules.unshift({
        user_agent: '*',
        disallow: Array.isArray(options.disallow) ? options.disallow as string[] : [],
        allow: Array.isArray(options.allow) ? options.allow as string[] : [],
      })
    }

    robotsPlugin._config = {
      rules: rules.length > 0 ? rules : DEFAULT_RULES,
      sitemap: typeof options.sitemap === 'string' ? options.sitemap : null,
      extra: Array.isArray(options.extra) ? options.extra as string[] : [],
    }
  },

  _config: null as RobotsConfig | null,

  on_post_build(config) {
    const robotsCfg = robotsPlugin._config ?? DEFAULT_CONFIG
    const lines: string[] = []

    for (const rule of robotsCfg.rules) {
      lines.push(`User-agent: ${rule.user_agent}`)
      for (const path of rule.disallow) {
        lines.push(`Disallow: ${path}`)
      }
      for (const path of rule.allow) {
        lines.push(`Allow: ${path}`)
      }
      lines.push('')
    }

    // Sitemap directive
    let sitemapUrl = robotsCfg.sitemap
    if (!sitemapUrl && config.site_url) {
      const base = config.site_url.replace(/\/+$/, '')
      sitemapUrl = `${base}/sitemap.xml`
    }
    if (sitemapUrl) {
      lines.push(`Sitemap: ${sitemapUrl}`)
      lines.push('')
    }

    // Extra directives
    for (const line of robotsCfg.extra) {
      lines.push(line)
    }

    const outPath = join(config.site_dir, 'robots.txt')
    writeFileSync(outPath, lines.join('\n'), 'utf-8')
  },
}
