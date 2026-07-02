export interface ReadingTimeConfig {
  enabled?: boolean
  words_per_minute?: number
  cjk_chars_per_minute?: number
  exclude_code?: boolean
  min_minutes?: number
}

export interface ReadingTimeResult {
  minutes: number
  formatted: string
}

const DEFAULT_WPM = 265
const DEFAULT_CJK_CPM = 500
const CJK_RE = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g

export function resolveReadingTimeConfig(extra: Record<string, unknown> | undefined): ReadingTimeConfig {
  const raw = extra?.reading_time
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { enabled: true }
  }
  return raw as ReadingTimeConfig
}

export function isReadingTimeEnabled(
  config: ReadingTimeConfig,
  pageMeta: Record<string, unknown>,
): boolean {
  if (pageMeta.readtime !== undefined) return true
  if (pageMeta.reading_time === false) return false
  return config.enabled !== false
}

export function computeReadingTime(
  markdown: string,
  config: ReadingTimeConfig,
  language: string,
  overrideMinutes?: number,
): ReadingTimeResult | undefined {
  if (overrideMinutes !== undefined) {
    const minutes = Math.max(1, Math.round(Number(overrideMinutes)) || 1)
    return { minutes, formatted: formatReadingTime(minutes, language) }
  }

  if (config.enabled === false) return undefined

  const wpm = config.words_per_minute ?? DEFAULT_WPM
  const cjkCpm = config.cjk_chars_per_minute ?? DEFAULT_CJK_CPM
  const minMinutes = config.min_minutes ?? 1
  const excludeCode = config.exclude_code !== false

  let text = markdown
  if (excludeCode) {
    text = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/<!--.*?-->/gs, ' ')
  }

  text = text
    .replace(/^---[\s\S]*?---/m, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_~\-+`|]/g, ' ')

  const cjkCount = text.match(CJK_RE)?.length ?? 0
  const withoutCjk = text.replace(CJK_RE, ' ')
  const wordCount = withoutCjk.split(/\s+/).filter(Boolean).length

  const minutes = Math.max(minMinutes, Math.ceil(wordCount / wpm + cjkCount / cjkCpm))
  return { minutes, formatted: formatReadingTime(minutes, language) }
}

function formatReadingTime(minutes: number, language: string): string {
  const lang = language.split('-')[0].toLowerCase()
  if (lang === 'zh') {
    return `约 ${minutes} 分钟`
  }
  return minutes === 1 ? '1 min read' : `${minutes} min read`
}

export function injectAfterFirstH1(html: string, injection: string): string {
  if (!injection) return html
  const match = /<\/h1>/i.exec(html)
  if (!match || match.index === undefined) {
    return injection + html
  }
  const insertAt = match.index + match[0].length
  return html.slice(0, insertAt) + injection + html.slice(insertAt)
}
