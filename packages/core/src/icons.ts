import type { Config } from './config.js'

export type IconLibrary = 'material' | 'fontawesome' | 'bootstrap' | 'octicons'

export interface IconsConfig {
  default: IconLibrary
  libraries: IconLibrary[]
}

export interface ParsedIcon {
  library: IconLibrary
  parts: string[]
}

export const ICON_LIBRARY_STYLES: Record<IconLibrary, string> = {
  material: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
  fontawesome: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  bootstrap: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  octicons: 'https://cdn.jsdelivr.net/npm/@primer/octicons@19.8.0/build/build.css',
}

export const DEFAULT_ADMONITION_ICONS: Record<string, string> = {
  note: 'material/note',
  abstract: 'material/lightbulb',
  info: 'material/info',
  tip: 'material/fire',
  success: 'material/check_circle',
  question: 'material/help',
  warning: 'material/warning',
  failure: 'material/cancel',
  danger: 'material/bolt',
  bug: 'material/bug_report',
  example: 'material/science',
  quote: 'material/format_quote',
}

const LIBRARY_PREFIXES = [
  'fontawesome-brands',
  'fontawesome-solid',
  'fontawesome-regular',
  'octicons',
  'material',
  'bootstrap',
] as const

export function getIconsConfig(config: Config): IconsConfig {
  const icons = (config.theme as { icons?: Partial<IconsConfig> }).icons
  return {
    default: (icons?.default as IconLibrary) ?? 'material',
    libraries: icons?.libraries?.length
      ? (icons.libraries as IconLibrary[])
      : ['material', 'fontawesome', 'bootstrap'],
  }
}

export function getIconStylesheets(config: Config): string[] {
  const { libraries } = getIconsConfig(config)
  return libraries.map((lib) => ICON_LIBRARY_STYLES[lib]).filter(Boolean)
}

function normalizeLibrary(name: string): IconLibrary {
  if (name === 'material' || name === 'fontawesome' || name === 'bootstrap' || name === 'octicons') {
    return name
  }
  return 'material'
}

export function parseIconRef(input: string, defaultLib: IconLibrary): ParsedIcon {
  const trimmed = input.trim()
  if (trimmed.includes('/')) {
    const [library, ...rest] = trimmed.split('/')
    return { library: normalizeLibrary(library), parts: rest }
  }

  for (const prefix of LIBRARY_PREFIXES) {
    if (trimmed === prefix) {
      return { library: normalizeLibrary(prefix.split('-')[0]), parts: [] }
    }
    if (trimmed.startsWith(prefix + '-')) {
      const remainder = trimmed.slice(prefix.length + 1)
      if (prefix.startsWith('fontawesome-')) {
        const style = prefix.replace('fontawesome-', '')
        return { library: 'fontawesome', parts: [style, ...remainder.split('-')] }
      }
      return { library: normalizeLibrary(prefix), parts: remainder.split('-') }
    }
  }

  return { library: defaultLib, parts: trimmed.split('-') }
}

/** Material Symbols name aliases (MkDocs/Material names → valid ligature names) */
const MATERIAL_ALIASES: Record<string, string> = {
  zap: 'bolt',
  'check-circle': 'check_circle',
  'format-quote': 'format_quote',
  'bug-report': 'bug_report',
}

function materialSymbolName(parts: string[]): string {
  const raw = parts.join('-').replace(/-/g, '_')
  return MATERIAL_ALIASES[raw] ?? MATERIAL_ALIASES[parts.join('-')] ?? raw
}

function fontAwesomeClass(parts: string[]): string | null {
  if (parts.length < 2) return null
  const [style, ...nameParts] = parts
  const name = nameParts.join('-')
  const styleMap: Record<string, string> = {
    brands: 'fa-brands',
    solid: 'fa-solid',
    regular: 'fa-regular',
  }
  const faStyle = styleMap[style]
  if (!faStyle) return null
  return `${faStyle} fa-${name}`
}

function bootstrapClass(parts: string[]): string {
  return `bi bi-${parts.join('-')}`
}

export function renderIconHtml(parsed: ParsedIcon): string {
  const { library, parts } = parsed

  if (library === 'material') {
    const name = materialSymbolName(parts)
    return `<span class="md-icon md-icon--material" aria-hidden="true"><span class="material-symbols-outlined">${name}</span></span>`
  }

  if (library === 'fontawesome') {
    const cls = fontAwesomeClass(parts)
    if (cls) {
      return `<span class="md-icon md-icon--fontawesome" aria-hidden="true"><i class="${cls}"></i></span>`
    }
  }

  if (library === 'bootstrap') {
    return `<span class="md-icon md-icon--bootstrap" aria-hidden="true"><i class="${bootstrapClass(parts)}"></i></span>`
  }

  if (library === 'octicons') {
    const name = parts.join('-')
    return `<span class="md-icon md-icon--octicons" aria-hidden="true"><span class="octicon octicon-${name}"></span></span>`
  }

  return `<span class="md-icon" aria-hidden="true">${parts.join('-')}</span>`
}

export function renderIconRef(ref: string, defaultLib: IconLibrary): string {
  return renderIconHtml(parseIconRef(ref, defaultLib))
}

export interface IconService {
  defaultLibrary: IconLibrary
  renderRef(ref: string): string
  renderShortcode(name: string): string
  getAdmonitionIcon(type: string): string
  replaceShortcodes(text: string): string
}

function getAdmonitionOverrides(config: Config): Record<string, string> {
  const icon = config.theme.icon
  if (!icon) return {}
  if (typeof icon === 'object' && 'admonition' in icon) {
    const admonition = (icon as { admonition?: Record<string, string> }).admonition
    return admonition ?? {}
  }
  const flat: Record<string, string> = {}
  for (const [key, value] of Object.entries(icon)) {
    if (key.startsWith('admonition/') || key.startsWith('admonition.')) {
      const type = key.replace(/^admonition[./]/, '')
      flat[type] = value as string
    }
  }
  return flat
}

const SHORTCODE_RE = /:([a-z][a-z0-9-]*):/gi

export function createIconService(config: Config): IconService {
  const { default: defaultLibrary } = getIconsConfig(config)
  const admonitionOverrides = getAdmonitionOverrides(config)

  const service: IconService = {
    defaultLibrary,

    renderRef(ref: string) {
      return renderIconRef(ref, defaultLibrary)
    },

    renderShortcode(name: string) {
      return renderIconRef(name, defaultLibrary)
    },

    getAdmonitionIcon(type: string) {
      const ref = admonitionOverrides[type] ?? DEFAULT_ADMONITION_ICONS[type] ?? `material/${type}`
      return service.renderRef(ref)
    },

    replaceShortcodes(text: string) {
      return text.replace(SHORTCODE_RE, (match, name: string) => {
        try {
          return service.renderShortcode(name)
        } catch {
          return match
        }
      })
    },
  }

  return service
}
