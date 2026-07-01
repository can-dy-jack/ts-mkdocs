import type MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import type { Config } from './config.js'
import { createIconService } from './icons.js'
import { admonitionPlugin, detailsPlugin } from './md/admonition.js'
import { iconsPlugin } from './md/icons.js'
import { contentTabsPlugin } from './md/tabs.js'
import { superfencesPlugin } from './md/superfences.js'
import { tasklistPlugin } from './md/tasklist.js'
import { keysPlugin } from './md/keys.js'
import { markPlugin } from './md/mark.js'
import { criticPlugin } from './md/critic.js'
import { footnotesPlugin } from './md/footnotes.js'
import { snippetsPlugin } from './md/snippets.js'
import { hasCodeAnnotateFeature, hasLangLabelFeature, hasLineNumbersFeature } from './md/code-highlight.js'

export type ExtensionEntry = string | Record<string, unknown>

function parseExtension(entry: ExtensionEntry): { name: string; options: Record<string, unknown> } {
  if (typeof entry === 'string') return { name: entry, options: {} }
  const name = Object.keys(entry)[0]
  const options = (entry[name] as Record<string, unknown>) ?? {}
  return { name, options }
}

export function applyMarkdownExtensions(
  md: MarkdownIt,
  config: Config,
  highlighter: any,
  themes: { light: string; dark: string },
): void {
  const extensions = config.markdown_extensions ?? []
  const enabled = new Set<string>()
  const options = new Map<string, Record<string, unknown>>()

  if (extensions.length === 0) {
    // Defaults matching Material for MkDocs
    enabled.add('admonition')
    enabled.add('pymdownx.tabbed')
    enabled.add('pymdownx.superfences')
    enabled.add('attr_list')
    enabled.add('tables')
    enabled.add('md_in_html')
    enabled.add('pymdownx.tasklist')
    options.set('pymdownx.tabbed', { alternate_style: true })
  } else {
    for (const ext of extensions) {
      const { name, options: opts } = parseExtension(ext)
      enabled.add(name)
      if (Object.keys(opts).length) options.set(name, opts)
    }
  }

  const icons = createIconService(config)
  md.use(iconsPlugin, icons)

  if (enabled.has('attr_list')) md.use(attrs)
  if (enabled.has('admonition') || enabled.has('pymdownx.details')) {
    const admonitionOpts = options.get('admonition') ?? {}
    const detailsOpts = options.get('pymdownx.details') ?? {}
    md.use(admonitionPlugin, {
      icons,
      defaultCollapsed: Boolean(admonitionOpts.default_collapsed ?? admonitionOpts.collapse ?? false),
    })
    if (enabled.has('pymdownx.details')) {
      md.use(detailsPlugin, {
        icons,
        defaultCollapsed: detailsOpts.default_collapsed !== undefined
          ? Boolean(detailsOpts.default_collapsed)
          : Boolean(detailsOpts.collapse ?? true),
      })
    }
  }
  if (enabled.has('pymdownx.tabbed')) {
    md.use(contentTabsPlugin, {
      ...(options.get('pymdownx.tabbed') ?? { alternate_style: true }),
      icons,
    })
  }
  if (enabled.has('pymdownx.superfences')) {
    md.use(superfencesPlugin, {
      highlighter,
      themes,
      md,
      lineNumbers: hasLineNumbersFeature(config),
      langLabel: hasLangLabelFeature(config),
      locale: config.theme.language,
      codeAnnotate: hasCodeAnnotateFeature(config),
    })
  }
  if (enabled.has('pymdownx.tasklist')) md.use(tasklistPlugin)
  if (enabled.has('pymdownx.keys')) md.use(keysPlugin)
  if (enabled.has('pymdownx.mark')) md.use(markPlugin)
  if (enabled.has('pymdownx.critic')) md.use(criticPlugin)
  if (enabled.has('footnotes')) md.use(footnotesPlugin)
  if (enabled.has('pymdownx.snippets')) {
    md.use(snippetsPlugin, { docsDir: config.docs_dir, ...options.get('pymdownx.snippets') })
  }
}
