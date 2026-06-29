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

export function resolveColor(name: string | undefined, fallback: string): string {
  if (!name) return fallback
  if (name.startsWith('#')) return name
  return PALETTE_COLORS[name.toLowerCase()] ?? fallback
}

export function buildPaletteCssVars(config: {
  theme: { palette?: unknown }
}): Record<string, string> {
  const palette = config.theme.palette
  let primary = '#3f51b5'
  let accent = '#3f51b5'

  if (Array.isArray(palette) && palette.length > 0) {
    const first = palette[0] as { primary?: string; accent?: string }
    primary = resolveColor(first.primary, primary)
    accent = resolveColor(first.accent ?? first.primary, accent)
  } else if (palette && typeof palette === 'object' && !Array.isArray(palette)) {
    const p = palette as { primary?: string; accent?: string }
    primary = resolveColor(p.primary, primary)
    accent = resolveColor(p.accent ?? p.primary, accent)
  }

  return {
    '--md-primary-fg-color': primary,
    '--md-primary-fg-color--light': primary,
    '--md-accent-fg-color': accent,
  }
}
