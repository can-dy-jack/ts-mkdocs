import type { Config } from '../config.js'

export interface CodeHighlightThemes {
  light: string
  dark: string
}

export interface CodeRenderOptions {
  lineNumbers?: boolean
  lang?: string
  langLabel?: boolean
  locale?: string
}

const PLAIN_TEXT_LABELS: Record<string, string> = {
  en: 'Plain text',
  zh: '纯文本',
}

const LANG_LABELS: Record<string, string> = {
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  css: 'CSS',
  dockerfile: 'Dockerfile',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  markdown: 'Markdown',
  md: 'Markdown',
  nginx: 'Nginx',
  php: 'PHP',
  python: 'Python',
  py: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  shell: 'Shell',
  sh: 'Shell',
  sql: 'SQL',
  toml: 'TOML',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  yaml: 'YAML',
  yml: 'YAML',
  text: 'Plain text',
  plaintext: 'Plain text',
  plain: 'Plain text',
}

export function resolveCodeLang(lang: string | undefined): string {
  return lang?.trim() || 'text'
}

function plainTextLabel(locale = 'en'): string {
  const key = locale.split('-')[0].toLowerCase()
  return PLAIN_TEXT_LABELS[key] ?? PLAIN_TEXT_LABELS.en
}

export function hasLineNumbersFeature(config: Config): boolean {
  return config.theme.features?.includes('content.code.linenumbers') ?? false
}

export function hasLangLabelFeature(config: Config): boolean {
  return config.theme.features?.includes('content.code.lang') ?? false
}

export function formatLangLabel(lang: string, locale = 'en'): string {
  const key = lang.toLowerCase()
  if (!key || key === 'text' || key === 'plaintext' || key === 'plain') {
    return plainTextLabel(locale)
  }
  if (LANG_LABELS[key]) return LANG_LABELS[key]
  return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
}

/** Remove trailing newlines that Shiki would render as an extra empty line. */
export function normalizeCodeContent(code: string): string {
  return code.replace(/\n+$/, '')
}

/** Drop trailing empty Shiki line spans left after normalization. */
export function stripTrailingEmptyLineSpans(html: string): string {
  return html.replace(/(?:\s*<span class="line"><\/span>)+\s*(?=<\/code>)/, '')
}

/** Ensure empty line spans keep height (matches plain-code `|| ' '` behavior). */
export function ensureNonemptyLineSpans(html: string): string {
  return html.replace(/<span class="line"><\/span>/g, '<span class="line"> </span>')
}

export function wrapCodeblockWithHead(
  html: string,
  lang: string,
  escape: (value: string) => string,
  locale = 'en',
): string {
  const codeLang = resolveCodeLang(lang)
  const label = escape(formatLangLabel(codeLang, locale))
  const pre = html.trimEnd()
  return (
    `<div class="md-codeblock" data-md-lang="${escape(codeLang)}">` +
    `<div class="md-codeblock__head"><span class="md-codeblock__lang">${label}</span></div>` +
    `${pre}</div>\n`
  )
}

export function renderPlainCodeHtml(
  code: string,
  escape: (value: string) => string,
  options: CodeRenderOptions = {},
): string {
  const { lineNumbers = false, lang, langLabel = false, locale = 'en' } = options
  const normalized = normalizeCodeContent(code)
  const body = lineNumbers
    ? normalized.split('\n').map((line) => `<span class="line">${escape(line) || ' '}</span>`).join('\n')
    : escape(normalized)
  const codeLang = langLabel ? resolveCodeLang(lang) : lang
  const langAttr = codeLang ? ` data-md-lang="${escape(codeLang)}"` : ''
  const preHtml = `<pre${langAttr}><code>${body}</code></pre>`
  if (langLabel) {
    return wrapCodeblockWithHead(preHtml, codeLang!, escape, locale)
  }
  return `${preHtml}\n`
}

export function renderShikiHtml(
  highlighter: { codeToHtml: (code: string, opts: Record<string, unknown>) => string },
  code: string,
  lang: string,
  themes: CodeHighlightThemes,
  options: { langLabel?: boolean; escape?: (value: string) => string; locale?: string } = {},
): string {
  const normalized = normalizeCodeContent(code)
  let html: string
  if (themes.light === themes.dark) {
    html = highlighter.codeToHtml(normalized, { lang, theme: themes.light })
  } else {
    html = highlighter.codeToHtml(normalized, {
      lang,
      themes: { light: themes.light, dark: themes.dark },
    })
  }
  html = stripTrailingEmptyLineSpans(html)
  html = ensureNonemptyLineSpans(html)
  if (options.langLabel) {
    const escape = options.escape ?? ((value: string) => value)
    html = wrapCodeblockWithHead(html, lang, escape, options.locale)
  }
  return html
}
