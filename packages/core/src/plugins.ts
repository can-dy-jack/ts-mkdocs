import type { Config } from './config.js'
import type { DocFile } from './files.js'
import type { Navigation } from './nav.js'
import type { Page } from './page.js'
import { blogPlugin } from './plugins/blog.js'
import { searchPlugin, offlinePlugin, privacyPlugin, typesetPlugin, groupPlugin, infoPlugin } from './plugins/builtin.js'
import { metaPlugin, socialPlugin } from './plugins/social.js'
import { tagsPlugin } from './plugins/tags.js'
import { sitemapPlugin } from './plugins/sitemap.js'
import { robotsPlugin } from './plugins/robots.js'

export interface PluginEvents {
  on_config?: (config: Config) => Config | void
  on_files?: (files: DocFile[], config: Config) => DocFile[] | void
  on_nav?: (nav: Navigation, config: Config) => Navigation | void
  on_page_markdown?: (markdown: string, page: Page, config: Config) => string | void
  on_page_content?: (html: string, page: Page, config: Config) => string | void
  on_post_build?: (config: Config) => void | Promise<void>
}

export interface Plugin extends PluginEvents {
  name: string
  configure?: (options: Record<string, unknown>) => void
}

const BUILTIN_PLUGINS: Record<string, Plugin> = {
  search: searchPlugin,
  tags: tagsPlugin,
  social: socialPlugin,
  meta: metaPlugin,
  blog: blogPlugin,
  offline: offlinePlugin,
  privacy: privacyPlugin,
  typeset: typesetPlugin,
  group: groupPlugin,
  info: infoPlugin,
  sitemap: sitemapPlugin,
  robots: robotsPlugin,
}

export class PluginManager {
  private plugins: Plugin[] = []

  register(plugin: Plugin): void {
    this.plugins.push(plugin)
  }

  async runOnConfig(config: Config): Promise<Config> {
    let result = config
    for (const p of this.plugins) {
      const out = p.on_config?.(result)
      if (out) result = out
    }
    return result
  }

  async runOnFiles(files: DocFile[], config: Config): Promise<DocFile[]> {
    let result = files
    for (const p of this.plugins) {
      const out = p.on_files?.(result, config)
      if (out) result = out
    }
    return result
  }

  async runOnNav(nav: Navigation, config: Config): Promise<Navigation> {
    let result = nav
    for (const p of this.plugins) {
      const out = p.on_nav?.(result, config)
      if (out) result = out
    }
    return result
  }

  async runOnPageMarkdown(markdown: string, page: Page, config: Config): Promise<string> {
    let result = markdown
    for (const p of this.plugins) {
      const out = p.on_page_markdown?.(result, page, config)
      if (out) result = out
    }
    return result
  }

  async runOnPageContent(html: string, page: Page, config: Config): Promise<string> {
    let result = html
    for (const p of this.plugins) {
      const out = p.on_page_content?.(result, page, config)
      if (out) result = out
    }
    return result
  }

  async runOnPostBuild(config: Config): Promise<void> {
    for (const p of this.plugins) {
      await p.on_post_build?.(config)
    }
  }
}

function getPluginName(entry: string | Record<string, unknown>): string {
  return typeof entry === 'string' ? entry : Object.keys(entry)[0]
}

async function loadExternalPlugin(name: string, options: Record<string, unknown>): Promise<Plugin | null> {
  const moduleName = (options.module as string) ?? `ts-mkdocs-plugin-${name}`
  try {
    const mod = await import(moduleName)
    const plugin = mod.default ?? mod.plugin ?? mod[name]
    if (plugin && typeof plugin === 'object') {
      return { name, ...plugin } as Plugin
    }
  } catch {
    // External plugin not installed
  }
  return null
}

export async function loadPlugins(config: Config): Promise<PluginManager> {
  const manager = new PluginManager()

  for (const pluginEntry of config.plugins) {
    const name = getPluginName(pluginEntry)
    const options = typeof pluginEntry === 'object' ? (pluginEntry[name] as Record<string, unknown>) ?? {} : {}

    if (BUILTIN_PLUGINS[name]) {
      const plugin = BUILTIN_PLUGINS[name]
      plugin.configure?.(options)
      manager.register(plugin)
      continue
    }

    const external = await loadExternalPlugin(name, options)
    if (external) {
      manager.register(external)
    }
  }

  return manager
}
