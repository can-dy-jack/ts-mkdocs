import type MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import type { Config } from './config.js'
import { buildAdmonitionTypeDefaults, resolveAdmonitionTypes } from './admonition-types.js'
import { createIconService } from './icons.js'
import { admonitionPlugin, detailsPlugin } from './md/admonition.js'
import { iconsPlugin } from './md/icons.js'
import { contentTabsPlugin } from './md/tabs.js'
import { superfencesPlugin } from './md/superfences.js'
import { tasklistPlugin } from './md/tasklist.js'
import { keysPlugin } from './md/keys.js'
import { markPlugin } from './md/mark.js'
import { caretPlugin } from './md/caret.js'
import { tildePlugin } from './md/tilde.js'
import { criticPlugin } from './md/critic.js'
import { footnotesPlugin } from './md/footnotes.js'
import { abbrPlugin } from './md/abbr.js'
import { deflistPlugin } from './md/deflist.js'
import { snippetsPlugin } from './md/snippets.js'
import { arithmatexPlugin } from './md/arithmatex.js'
import { emojiPlugin } from './md/emoji.js'
import { magiclinkPlugin } from './md/magiclink.js'
import { tablesPlugin } from './md/tables.js'
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
    enabled.add('md.tabs')
    enabled.add('md.fences')
    enabled.add('attr_list')
    enabled.add('tables')
    enabled.add('md_in_html')
    enabled.add('md.tasklist')
    options.set('md.tabs', { alternate_style: true })
  } else {
    for (const ext of extensions) {
      const { name, options: opts } = parseExtension(ext)
      enabled.add(name)
      if (Object.keys(opts).length) options.set(name, opts)
    }
  }

  const admonitionTypes = resolveAdmonitionTypes(config)
  const icons = createIconService(config, admonitionTypes.icons)
  const emojiEnabled = enabled.has('md.emoji')
  if (emojiEnabled) {
    md.use(emojiPlugin, options.get('md.emoji') ?? {})
  }
  md.use(iconsPlugin, icons, { emojiEnabled })

  if (enabled.has('attr_list')) md.use(attrs)
  if (enabled.has('admonition') || enabled.has('md.details')) {
    const admonitionOpts = options.get('admonition') ?? {}
    const detailsOpts = options.get('md.details') ?? {}
    const typeDefaults = buildAdmonitionTypeDefaults(admonitionTypes.custom)
    const sharedOpts = {
      icons,
      types: admonitionTypes.allowed,
      typeDefaults,
    }
    md.use(admonitionPlugin, {
      ...sharedOpts,
      defaultCollapsed: Boolean(admonitionOpts.default_collapsed ?? admonitionOpts.collapse ?? false),
    })
    if (enabled.has('md.details')) {
      md.use(detailsPlugin, {
        ...sharedOpts,
        defaultCollapsed: detailsOpts.default_collapsed !== undefined
          ? Boolean(detailsOpts.default_collapsed)
          : Boolean(detailsOpts.collapse ?? true),
      })
    }
  }
  if (enabled.has('md.tabs')) {
    md.use(contentTabsPlugin, {
      ...(options.get('md.tabs') ?? { alternate_style: true }),
      icons,
    })
  }
  if (enabled.has('md.fences')) {
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
  if (enabled.has('md.tasklist')) md.use(tasklistPlugin)
  if (enabled.has('md.keys')) md.use(keysPlugin)
  if (enabled.has('md.mark')) md.use(markPlugin)
  if (enabled.has('md.caret')) md.use(caretPlugin, options.get('md.caret') ?? {})
  if (enabled.has('md.tilde')) md.use(tildePlugin, options.get('md.tilde') ?? {})
  if (enabled.has('md.critic')) md.use(criticPlugin)
  if (enabled.has('footnotes')) md.use(footnotesPlugin)
  if (enabled.has('abbr')) md.use(abbrPlugin)
  if (enabled.has('def_list')) md.use(deflistPlugin)
  if (enabled.has('md.snippets')) {
    md.use(snippetsPlugin, { docsDir: config.docs_dir, ...options.get('md.snippets') })
  }
  if (enabled.has('md.math')) {
    md.use(arithmatexPlugin, options.get('md.math') ?? {})
  }
  if (enabled.has('md.links')) {
    magiclinkPlugin(md, options.get('md.links') ?? {}, {
      repo_url: config.repo_url,
      repo_name: config.repo_name,
    })
  }
  if (enabled.has('tables')) md.use(tablesPlugin)
}
