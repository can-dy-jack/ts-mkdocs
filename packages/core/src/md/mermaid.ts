import type { Config } from '../config.js'

export type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral' | 'base' | 'null'
export type MermaidThemeMode = MermaidTheme | 'auto'
export type MermaidSecurityLevel = 'strict' | 'loose' | 'antiscript' | 'sandbox'

export interface MermaidCdnOptions {
  base?: string
  javascript?: string
}

export interface MermaidOptions {
  version?: string
  cdn?: MermaidCdnOptions
  theme?: MermaidThemeMode
  themeVariables?: Record<string, string>
  securityLevel?: MermaidSecurityLevel
  flowchart?: {
    curve?: 'basis' | 'bumpX' | 'bumpY' | 'cardinal' | 'catmullRom' | 'linear' | 'monotoneX' | 'monotoneY' | 'natural' | 'step' | 'stepAfter' | 'stepBefore'
    useMaxWidth?: boolean
    htmlLabels?: boolean
    diagramPadding?: number
  }
  sequence?: {
    useMaxWidth?: boolean
    diagramMarginX?: number
    diagramMarginY?: number
    actorMargin?: number
    width?: number
    height?: number
    boxMargin?: number
    boxTextMargin?: number
    noteMargin?: number
    messageMargin?: number
  }
  gantt?: {
    useMaxWidth?: boolean
    titleTopMargin?: number
    barHeight?: number
    barGap?: number
    topPadding?: number
    leftPadding?: number
    gridLineStartPadding?: number
    fontSize?: number
  }
}

export interface MermaidCdnAssets {
  javascript: string
}

export interface MermaidConfig {
  enabled: boolean
  version: string
  cdn: MermaidCdnAssets
  theme: MermaidThemeMode
  themeVariables?: Record<string, string>
  securityLevel?: MermaidSecurityLevel
  flowchart?: MermaidOptions['flowchart']
  sequence?: MermaidOptions['sequence']
  gantt?: MermaidOptions['gantt']
}

const DEFAULT_MERMAID_VERSION = '11'
const DEFAULT_CDN_ORIGIN = 'https://cdn.jsdelivr.net/npm'

function parseExtension(entry: string | Record<string, unknown>): { name: string; options: Record<string, unknown> } {
  if (typeof entry === 'string') return { name: entry, options: {} }
  const name = Object.keys(entry)[0]
  const options = (entry[name] as Record<string, unknown>) ?? {}
  return { name, options }
}

function resolveCdnUrl(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isSuperfencesEnabled(config: Config): boolean {
  const extensions = config.markdown_extensions ?? []
  if (extensions.length === 0) return true
  for (const ext of extensions) {
    const { name } = parseExtension(ext)
    if (name === 'md.fences') return true
  }
  return false
}

function getSuperfencesOptions(config: Config): Record<string, unknown> {
  const extensions = config.markdown_extensions ?? []
  for (const ext of extensions) {
    const { name, options } = parseExtension(ext)
    if (name === 'md.fences') return options
  }
  return {}
}

function defaultMermaidCdn(version: string): MermaidCdnAssets {
  return {
    javascript: `${DEFAULT_CDN_ORIGIN}/mermaid@${version}/dist/mermaid.min.js`,
  }
}

function resolveMermaidCdn(
  version: string,
  cdnOptions: Record<string, unknown> | undefined,
): MermaidCdnAssets {
  const defaults = defaultMermaidCdn(version)
  const opts = cdnOptions ?? {}
  const base = resolveCdnUrl(opts.base)
  if (base) {
    const normalized = base.replace(/\/$/, '')
    defaults.javascript = /\.m?js$/i.test(normalized)
      ? normalized
      : `${normalized}/mermaid.min.js`
  }

  return {
    javascript: resolveCdnUrl(opts.javascript) ?? defaults.javascript,
  }
}

function pickRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function pickStringRecord(value: unknown): Record<string, string> | undefined {
  const record = pickRecord(value)
  if (!record) return undefined
  const entries = Object.entries(record).filter(([, v]) => typeof v === 'string') as [string, string][]
  return entries.length ? Object.fromEntries(entries) : undefined
}

function pickBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function pickNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const MERMAID_THEMES = new Set<MermaidTheme>(['default', 'dark', 'forest', 'neutral', 'base', 'null'])

function resolveTheme(value: unknown): MermaidThemeMode {
  if (value === 'auto') return 'auto'
  if (typeof value === 'string' && MERMAID_THEMES.has(value as MermaidTheme)) {
    return value as MermaidTheme
  }
  return 'auto'
}

const SECURITY_LEVELS = new Set<MermaidSecurityLevel>(['strict', 'loose', 'antiscript', 'sandbox'])

function resolveSecurityLevel(value: unknown): MermaidSecurityLevel | undefined {
  if (typeof value === 'string' && SECURITY_LEVELS.has(value as MermaidSecurityLevel)) {
    return value as MermaidSecurityLevel
  }
  return undefined
}

function resolveFlowchartOptions(value: unknown): MermaidOptions['flowchart'] | undefined {
  const opts = pickRecord(value)
  if (!opts) return undefined

  const curve = pickString(opts.curve)
  const flowchart: NonNullable<MermaidOptions['flowchart']> = {}
  if (curve) flowchart.curve = curve as NonNullable<MermaidOptions['flowchart']>['curve']
  const useMaxWidth = pickBoolean(opts.useMaxWidth)
  if (useMaxWidth !== undefined) flowchart.useMaxWidth = useMaxWidth
  const htmlLabels = pickBoolean(opts.htmlLabels)
  if (htmlLabels !== undefined) flowchart.htmlLabels = htmlLabels
  const diagramPadding = pickNumber(opts.diagramPadding)
  if (diagramPadding !== undefined) flowchart.diagramPadding = diagramPadding

  return Object.keys(flowchart).length ? flowchart : undefined
}

function resolveSequenceOptions(value: unknown): MermaidOptions['sequence'] | undefined {
  const opts = pickRecord(value)
  if (!opts) return undefined

  const sequence: NonNullable<MermaidOptions['sequence']> = {}
  const useMaxWidth = pickBoolean(opts.useMaxWidth)
  if (useMaxWidth !== undefined) sequence.useMaxWidth = useMaxWidth

  for (const key of [
    'diagramMarginX',
    'diagramMarginY',
    'actorMargin',
    'width',
    'height',
    'boxMargin',
    'boxTextMargin',
    'noteMargin',
    'messageMargin',
  ] as const) {
    const num = pickNumber(opts[key])
    if (num !== undefined) sequence[key] = num
  }

  return Object.keys(sequence).length ? sequence : undefined
}

function resolveGanttOptions(value: unknown): MermaidOptions['gantt'] | undefined {
  const opts = pickRecord(value)
  if (!opts) return undefined

  const gantt: NonNullable<MermaidOptions['gantt']> = {}
  const useMaxWidth = pickBoolean(opts.useMaxWidth)
  if (useMaxWidth !== undefined) gantt.useMaxWidth = useMaxWidth
  for (const key of [
    'titleTopMargin',
    'barHeight',
    'barGap',
    'topPadding',
    'leftPadding',
    'gridLineStartPadding',
    'fontSize',
  ] as const) {
    const num = pickNumber(opts[key])
    if (num !== undefined) gantt[key] = num
  }

  return Object.keys(gantt).length ? gantt : undefined
}

export function resolveMermaidConfig(config: Config): MermaidConfig | null {
  if (!isSuperfencesEnabled(config)) return null

  const superfencesOptions = getSuperfencesOptions(config)
  const options = pickRecord(superfencesOptions.mermaid) ?? {}

  const version = pickString(options.version) ?? DEFAULT_MERMAID_VERSION
  const cdnOptions = pickRecord(options.cdn)

  const resolved: MermaidConfig = {
    enabled: true,
    version,
    cdn: resolveMermaidCdn(version, cdnOptions),
    theme: resolveTheme(options.theme),
  }

  const themeVariables = pickStringRecord(options.themeVariables)
  if (themeVariables) resolved.themeVariables = themeVariables

  const securityLevel = resolveSecurityLevel(options.securityLevel)
  if (securityLevel) resolved.securityLevel = securityLevel

  const flowchart = resolveFlowchartOptions(options.flowchart)
  if (flowchart) resolved.flowchart = flowchart

  const sequence = resolveSequenceOptions(options.sequence)
  if (sequence) resolved.sequence = sequence

  const gantt = resolveGanttOptions(options.gantt)
  if (gantt) resolved.gantt = gantt

  return resolved
}
