/** Material for MkDocs color name → hex mapping */
export const PALETTE_COLORS: Record<string, string> = {
  red: '#ef5350',
  pink: '#e91e63',
  purple: '#9c27b0',
  'deep-purple': '#673ab7',
  indigo: '#3f51b5',
  blue: '#2196f3',
  'light-blue': '#03a9f4',
  cyan: '#00bcd4',
  teal: '#009688',
  green: '#4caf50',
  'light-green': '#8bc34a',
  lime: '#cddc39',
  yellow: '#ffeb3b',
  amber: '#ffc107',
  orange: '#ff9800',
  'deep-orange': '#ff5722',
  brown: '#795548',
  grey: '#9e9e9e',
  'blue-grey': '#607d8b',
  black: '#000000',
  white: '#ffffff',
}

export interface PaletteEntry {
  scheme?: string
  primary?: string
  accent?: string
}

export function resolveColor(name: string | undefined, fallback: string): string {
  if (!name) return fallback
  if (name.startsWith('#')) return name
  return PALETTE_COLORS[name.toLowerCase()] ?? fallback
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
  return `#${[clamp(r), clamp(g), clamp(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** Lighten (amount > 0) or darken (amount < 0) a hex colour. */
export function shadeColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const [r, g, b] = rgb.map((channel) =>
    amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount,
  ) as [number, number, number]
  return rgbToHex(r, g, b)
}

export function entryToCssVars(entry: PaletteEntry | undefined): Record<string, string> {
  const primary = resolveColor(entry?.primary, '#3f51b5')
  const accent = resolveColor(entry?.accent ?? entry?.primary, primary)
  return {
    '--md-primary-fg-color': primary,
    '--md-primary-fg-color--light': shadeColor(primary, 0.18),
    '--md-primary-fg-color--dark': shadeColor(primary, -0.28),
    '--md-accent-fg-color': accent,
  }
}

function varsToBlock(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  return `${selector} {\n${body}\n}`
}

function splitPaletteEntries(palette: unknown): { light?: PaletteEntry; dark?: PaletteEntry } {
  if (!palette) return {}

  if (Array.isArray(palette)) {
    let light: PaletteEntry | undefined
    let dark: PaletteEntry | undefined

    for (const entry of palette as PaletteEntry[]) {
      const scheme = (entry.scheme ?? 'default').toLowerCase()
      if (scheme === 'slate') dark = entry
      else light = entry
    }

    if (!light && palette.length > 0) {
      const first = palette[0] as PaletteEntry
      light = first.scheme === 'slate' ? undefined : first
    }
    if (!dark && palette.length > 1) {
      const second = palette[1] as PaletteEntry
      dark = second.scheme === 'slate' ? second : (palette[1] as PaletteEntry)
    }
    if (!dark) dark = light
    if (!light) light = dark

    return { light, dark }
  }

  if (typeof palette === 'object') {
    const entry = palette as PaletteEntry
    return { light: entry, dark: entry }
  }

  return {}
}

/** Build CSS rules for light (:root) and dark ([data-theme="dark"]) palettes. */
export function buildPaletteStyles(config: { theme: { palette?: unknown } }): string {
  const { light, dark } = splitPaletteEntries(config.theme.palette)
  if (!light && !dark) return ''

  const blocks: string[] = []
  if (light) blocks.push(varsToBlock(':root', entryToCssVars(light)))
  if (dark) blocks.push(varsToBlock('[data-theme="dark"]', entryToCssVars(dark)))
  return blocks.join('\n')
}

/** @deprecated Use buildPaletteStyles — kept for tests that import the old name. */
export function buildPaletteCssVars(config: { theme: { palette?: unknown } }): Record<string, string> {
  const { light } = splitPaletteEntries(config.theme.palette)
  return entryToCssVars(light)
}
