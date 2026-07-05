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
export type { Page } from './page.js'
export type { PageMeta } from './frontmatter.js'
export {
  normalizePageMeta,
  mergePageMeta,
  loadInheritedMeta,
  resolveEditUrl,
} from './frontmatter.js'
export {
  parseHtmlMetaTags,
  resolveDocumentTitle,
  resolvePageAuthor,
  resolvePageHtmlMetaTags,
} from './html-meta.js'
export type { HtmlMetaTag } from './html-meta.js'
export {
  computeReadingTime,
  resolveReadingTimeConfig,
  injectAfterFirstH1,
} from './reading-time.js'
export {
  buildCanonicalPageUrl,
  formatLicenseDate,
  resolveLicenseAuthor,
  resolveLicenseConfig,
  resolvePageLicense,
  shouldShowPageLicense,
} from './license.js'
export type { LicenseConfig, LicensePageContext, ResolvedPageLicense } from './license.js'
export { buildMetaBarItems } from './page-meta.js'
export {
  parseAuthorRegistry,
  resolvePageAuthors,
  resolveAssetUrl,
  resolveAuthorLinks,
  shouldShowPageAuthors,
} from './authors.js'
export type { AuthorDefinition, ResolvedAuthor, ResolvedAuthorLink } from './authors.js'
export {
  aggregateTags,
  buildTagCloudData,
  getTagArchiveUrl,
  getTagIndexUrl,
  getTagsPluginConfig,
  hasTagsPlugin,
  resolvePageTags,
  shouldShowPageTags,
  slugifyTag,
} from './tags.js'
export type { ResolvedTag, TagEntry, TagIndex, TagPageRef, TagsPluginConfig } from './tags.js'
export {
  applyRevisionDatesToPage,
  getGitRevisionDatePluginConfig,
  hasGitRevisionDatePlugin,
  resolveRevisionDateConfig,
  resolveRevisionDates,
} from './revision-date.js'
export type { RevisionDateConfig, RevisionDateSource, ResolvedRevisionDates } from './revision-date.js'
export { slugify } from './utils.js'
export { PluginManager, loadPlugins } from './plugins.js'
export type { Plugin, PluginEvents } from './plugins.js'
export { buildSearchIndex, writeSearchIndex } from './search.js'
export { buildFeatureContext, getFeatures, hasFeature } from './features.js'
export { getI18n } from './i18n.js'
export {
  resolveCommentsConfig,
  shouldShowComments,
} from './comments.js'
export type {
  CommentsConfig,
  CommentsProvider,
  GiscusCommentsConfig,
  UtterancesCommentsConfig,
} from './comments.js'
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
