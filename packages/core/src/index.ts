export { loadConfig, getDefaultConfig, ConfigSchema } from './config.js'
export type { Config, ThemeConfig } from './config.js'
export { build } from './build.js'
export { serve } from './serve.js'
export { collectFiles } from './files.js'
export type { DocFile } from './files.js'
export { buildNavigation } from './nav.js'
export type { NavItem, NavPage, NavSection, NavLink, Navigation } from './nav.js'
export { initMarkdown, renderMarkdown } from './markdown.js'
export type { TocEntry, MarkdownResult } from './markdown.js'
export { loadPage } from './page.js'
export type { Page, PageMeta } from './page.js'
export { PluginManager, loadPlugins } from './plugins.js'
export type { Plugin, PluginEvents } from './plugins.js'
export { buildSearchIndex, writeSearchIndex } from './search.js'
export { buildFeatureContext, getFeatures, hasFeature } from './features.js'
export { getI18n } from './i18n.js'
export { resolveColor, shadeColor, buildPaletteStyles, buildPaletteCssVars } from './palette.js'
export {
  createIconService,
  getIconsConfig,
  getIconStylesheets,
  parseIconRef,
  renderIconRef,
  DEFAULT_ADMONITION_ICONS,
} from './icons.js'
export type { IconService, IconLibrary, IconsConfig } from './icons.js'
