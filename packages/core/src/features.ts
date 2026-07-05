import type { Config } from './config.js'
import { buildAdmonitionTypesStyles } from './admonition-types.js'
import { buildPaletteStyles } from './palette.js'

export type FeatureSet = Set<string>

export function getFeatures(config: Config): FeatureSet {
  return new Set(config.theme.features ?? [])
}

export function hasFeature(features: FeatureSet, name: string): boolean {
  return features.has(name)
}

export interface FeatureContext {
  features: string[]
  has: Record<string, boolean>
  palette_css: string
  has_palette: boolean
  admonition_types_css: string
  has_admonition_types: boolean
  navigation_footer: boolean
  toc_integrate: boolean
  instant_loading: boolean
  instant_prefetch: boolean
  instant_progress: boolean
}

export function buildFeatureContext(config: Config): FeatureContext {
  const features = getFeatures(config)
  const list = [...features]

  const has: Record<string, boolean> = {}
  for (const f of list) has[f] = true

  const paletteCss = buildPaletteStyles(config)
  const admonitionTypesCss = buildAdmonitionTypesStyles(config)

  return {
    features: list,
    has,
    palette_css: paletteCss,
    has_palette: paletteCss.length > 0,
    admonition_types_css: admonitionTypesCss,
    has_admonition_types: admonitionTypesCss.length > 0,
    navigation_footer: features.has('navigation.footer'),
    toc_integrate: features.has('toc.integrate'),
    instant_loading: features.has('navigation.instant'),
    instant_prefetch: features.has('navigation.instant.prefetch'),
    instant_progress: features.has('navigation.instant.progress'),
  }
}

/** Top-level nav items for tabs (sections + top-level pages) */
export function getTabItems(navItems: any[]): any[] {
  return navItems.filter((item) => item.type === 'section' || item.type === 'page')
}

/**
 * With navigation.tabs, the sidebar shows only the active tab's subtree
 * (children of a top-level section, or a single top-level page).
 */
export function getSidebarNav(
  navItems: any[],
  currentUrl: string | undefined,
  tabsEnabled: boolean,
): any[] {
  if (!tabsEnabled || !currentUrl) {
    return navItems
  }

  for (const item of navItems) {
    if (item.type === 'section') {
      if (containsUrl(item.children ?? [], currentUrl)) {
        return item.children ?? []
      }
    } else if (item.type === 'page' && item.url === currentUrl) {
      return []
    }
  }

  return navItems
}

export function isTabActive(item: any, page: { file?: { url?: string } } | undefined): boolean {
  if (!page?.file?.url) return false
  const url = page.file.url
  if (item.type === 'page') return item.url === url
  if (item.type === 'section') {
    return containsUrl(item.children ?? [], url)
  }
  return false
}

function containsUrl(items: any[], url: string): boolean {
  for (const item of items) {
    if (item.type === 'page' && item.url === url) return true
    if (item.type === 'section' && containsUrl(item.children ?? [], url)) return true
  }
  return false
}
