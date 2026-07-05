import type { Config } from './config.js'

export const BUILTIN_ADMONITION_TYPES = new Set([
  'note', 'abstract', 'info', 'tip', 'success', 'question',
  'warning', 'failure', 'danger', 'bug', 'example', 'quote',
])

export interface AdmonitionTypeConfig {
  title?: string
  icon?: string
  color?: string
}

export interface ResolvedAdmonitionTypes {
  allowed: Set<string>
  custom: Map<string, AdmonitionTypeConfig>
  icons: Record<string, string>
}

/** Accept hex, rgb/rgba, hsl/hsla — not palette keyword names. */
const CSS_COLOR_RE = /^(#[0-9a-f]{3,8}|(?:rgba?|hsla?)\([^)]+\))$/i

export function resolveAdmonitionColor(color: string): string | undefined {
  const trimmed = color.trim()
  return CSS_COLOR_RE.test(trimmed) ? trimmed : undefined
}

export function getAdmonitionExtensionOptions(config: Config): Record<string, unknown> {
  for (const ext of config.markdown_extensions ?? []) {
    if (typeof ext === 'object' && ext.admonition) {
      return (ext.admonition as Record<string, unknown>) ?? {}
    }
  }
  return {}
}

function parseTypeEntry(name: string, value: unknown): AdmonitionTypeConfig {
  const config: AdmonitionTypeConfig = {}
  if (!value || typeof value !== 'object') return config
  const obj = value as Record<string, unknown>
  if (typeof obj.title === 'string') config.title = obj.title
  if (typeof obj.icon === 'string') config.icon = obj.icon
  if (typeof obj.color === 'string') config.color = obj.color
  return config
}

export function parseAdmonitionTypes(raw: unknown): ResolvedAdmonitionTypes {
  const custom = new Map<string, AdmonitionTypeConfig>()
  const icons: Record<string, string> = {}

  if (raw) {
    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (typeof entry === 'string') {
          if (!BUILTIN_ADMONITION_TYPES.has(entry)) custom.set(entry, {})
          continue
        }
        if (typeof entry === 'object' && entry !== null) {
          const obj = entry as Record<string, unknown>
          const name = obj.name
          if (typeof name !== 'string') continue
          const config = parseTypeEntry(name, entry)
          if (config.icon) icons[name] = config.icon
          if (!BUILTIN_ADMONITION_TYPES.has(name)) custom.set(name, config)
        }
      }
    } else if (typeof raw === 'object') {
      for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
        const config = parseTypeEntry(name, value)
        if (config.icon) icons[name] = config.icon
        if (!BUILTIN_ADMONITION_TYPES.has(name)) custom.set(name, config)
      }
    }
  }

  const allowed = new Set([...BUILTIN_ADMONITION_TYPES, ...custom.keys()])
  return { allowed, custom, icons }
}

export function resolveAdmonitionTypes(config: Config): ResolvedAdmonitionTypes {
  const opts = getAdmonitionExtensionOptions(config)
  return parseAdmonitionTypes(opts.types)
}

export function buildAdmonitionTypeDefaults(
  custom: Map<string, AdmonitionTypeConfig>,
): Record<string, { title?: string }> {
  const defaults: Record<string, { title?: string }> = {}
  for (const [name, config] of custom) {
    if (config.title) defaults[name] = { title: config.title }
  }
  return defaults
}

/** Build CSS rules for custom admonition type colors. */
export function buildAdmonitionTypesStyles(config: Config): string {
  const { custom } = resolveAdmonitionTypes(config)
  const rules: string[] = []

  for (const [name, typeConfig] of custom) {
    if (!typeConfig.color) continue
    const color = resolveAdmonitionColor(typeConfig.color)
    if (!color) continue
    rules.push(`.admonition.${name} {\n  --admonition-color: ${color};\n}`)
  }

  return rules.join('\n')
}
