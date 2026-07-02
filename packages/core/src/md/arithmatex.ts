import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type { Config } from '../config.js'

export type MathProvider = 'katex' | 'mathjax'

export interface ArithmatexOptions {
  provider?: MathProvider
  generic?: boolean
  smart_dollar?: boolean
  version?: string
  cdn?: {
    base?: string
    stylesheet?: string
    javascript?: string
    auto_render?: string
  }
}

export interface MathCdnAssets {
  stylesheet?: string
  javascript: string
  auto_render?: string
}

export interface MathConfig {
  enabled: boolean
  provider: MathProvider
  version: string
  cdn: MathCdnAssets
}

const DEFAULT_KATEX_VERSION = '0.16.22'
const DEFAULT_MATHJAX_VERSION = '3.2.2'
const DEFAULT_CDN_ORIGIN = 'https://cdn.jsdelivr.net/npm'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function wrapInline(content: string, generic: boolean): string {
  const body = escapeHtml(content)
  if (generic) return `<span class="arithmatex">\\(${body}\\)</span>`
  return `<script type="math/tex">${body}</script>`
}

function wrapBlock(content: string, generic: boolean): string {
  const body = escapeHtml(content.trim())
  if (generic) return `<div class="arithmatex">\\[${body}\\]</div>\n`
  return `<script type="math/tex; mode=display">${body}</script>\n`
}

function isCurrencyStart(src: string, start: number): boolean {
  const next = src.charCodeAt(start + 1)
  return next >= 0x30 && next <= 0x39
}

function parseInlineMath(state: StateInline, start: number, silent: boolean, smartDollar: boolean): boolean {
  const src = state.src
  if (src.charCodeAt(start) !== 0x24 /* $ */) return false
  if (src.charCodeAt(start + 1) === 0x24) return false
  if (start > 0 && src.charCodeAt(start - 1) === 0x5c /* \ */) return false
  if (smartDollar && isCurrencyStart(src, start)) return false

  let pos = start + 1
  while (pos < src.length) {
    if (src.charCodeAt(pos) === 0x24 && src.charCodeAt(pos - 1) !== 0x5c) break
    pos++
  }
  if (pos >= src.length) return false

  const content = src.slice(start + 1, pos)
  if (!content.trim()) return false
  if (silent) return true

  const token = state.push('html_inline', '', 0)
  token.content = wrapInline(content, true)
  state.pos = pos + 1
  return true
}

function parseParenInlineMath(state: StateInline, start: number, silent: boolean): boolean {
  const src = state.src
  if (src.slice(start, start + 2) !== '\\(') return false

  let pos = start + 2
  while (pos < src.length) {
    if (src.slice(pos, pos + 2) === '\\)') break
    pos++
  }
  if (pos >= src.length) return false

  const content = src.slice(start + 2, pos)
  if (!content.trim()) return false
  if (silent) return true

  const token = state.push('html_inline', '', 0)
  token.content = wrapInline(content, true)
  state.pos = pos + 2
  return true
}

function parseBlockMath(
  state: StateBlock,
  startLine: number,
  _endLine: number,
  silent: boolean,
  generic: boolean,
): boolean {
  const pos = state.bMarks[startLine] + state.tShift[startLine]
  const max = state.eMarks[startLine]
  let line = state.src.slice(pos, max).trim()

  if (line.startsWith('\\[')) {
    if (line.endsWith('\\]') && line.length > 4) {
      const content = line.slice(2, -2)
      if (!content.trim()) return false
      if (silent) return true
      const token = state.push('html_block', '', 0)
      token.content = wrapBlock(content, generic)
      token.map = [startLine, startLine + 1]
      state.line = startLine + 1
      return true
    }

    let nextLine = startLine + 1
    const lines: string[] = [line.slice(2)]
    while (nextLine < state.lineMax) {
      const lp = state.bMarks[nextLine] + state.tShift[nextLine]
      const lm = state.eMarks[nextLine]
      const current = state.src.slice(lp, lm).trim()
      if (current.endsWith('\\]')) {
        lines.push(current.slice(0, -2))
        if (silent) return true
        const token = state.push('html_block', '', 0)
        token.content = wrapBlock(lines.join('\n'), generic)
        token.map = [startLine, nextLine + 1]
        state.line = nextLine + 1
        return true
      }
      lines.push(current)
      nextLine++
    }
    return false
  }

  if (!line.startsWith('$$')) return false

  if (line.length > 4 && line.endsWith('$$')) {
    const content = line.slice(2, -2)
    if (!content.trim()) return false
    if (silent) return true
    const token = state.push('html_block', '', 0)
    token.content = wrapBlock(content, generic)
    token.map = [startLine, startLine + 1]
    state.line = startLine + 1
    return true
  }

  let nextLine = startLine + 1
  const lines: string[] = []
  if (line.length > 2) lines.push(line.slice(2))

  while (nextLine < state.lineMax) {
    const lp = state.bMarks[nextLine] + state.tShift[nextLine]
    const lm = state.eMarks[nextLine]
    const current = state.src.slice(lp, lm).trim()
    if (current === '$$' || current.endsWith('$$')) {
      if (current !== '$$') lines.push(current.slice(0, -2))
      if (silent) return true
      const token = state.push('html_block', '', 0)
      token.content = wrapBlock(lines.join('\n'), generic)
      token.map = [startLine, nextLine + 1]
      state.line = nextLine + 1
      return true
    }
    lines.push(current)
    nextLine++
  }

  return false
}

export function arithmatexPlugin(md: MarkdownIt, options: ArithmatexOptions = {}): void {
  const generic = options.generic !== false
  const smartDollar = options.smart_dollar !== false

  md.inline.ruler.before('escape', 'math_inline_paren', (state, silent) => {
    return parseParenInlineMath(state, state.pos, silent)
  })

  md.inline.ruler.after('escape', 'math_inline_dollar', (state, silent) => {
    return parseInlineMath(state, state.pos, silent, smartDollar)
  })

  md.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
    return parseBlockMath(state, startLine, endLine, silent, generic)
  })
}

function parseExtension(entry: string | Record<string, unknown>): { name: string; options: Record<string, unknown> } {
  if (typeof entry === 'string') return { name: entry, options: {} }
  const name = Object.keys(entry)[0]
  const options = (entry[name] as Record<string, unknown>) ?? {}
  return { name, options }
}

function resolveCdnUrl(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function defaultKatexCdn(version: string): MathCdnAssets {
  const base = `${DEFAULT_CDN_ORIGIN}/katex@${version}/dist`
  return {
    stylesheet: `${base}/katex.min.css`,
    javascript: `${base}/katex.min.js`,
    auto_render: `${base}/contrib/auto-render.min.js`,
  }
}

function defaultMathjaxCdn(version: string): MathCdnAssets {
  return {
    javascript: `${DEFAULT_CDN_ORIGIN}/mathjax@${version}/es5/tex-mml-chtml.js`,
  }
}

function resolveMathCdn(
  provider: MathProvider,
  version: string,
  cdnOptions: Record<string, unknown> | undefined,
): MathCdnAssets {
  const defaults = provider === 'mathjax'
    ? defaultMathjaxCdn(version)
    : defaultKatexCdn(version)

  const opts = cdnOptions ?? {}
  const base = resolveCdnUrl(opts.base)
  if (base && provider === 'katex') {
    const normalized = base.replace(/\/$/, '')
    defaults.stylesheet = `${normalized}/katex.min.css`
    defaults.javascript = `${normalized}/katex.min.js`
    defaults.auto_render = `${normalized}/contrib/auto-render.min.js`
  }

  const cdn: MathCdnAssets = {
    javascript: resolveCdnUrl(opts.javascript) ?? defaults.javascript,
  }

  const stylesheet = resolveCdnUrl(opts.stylesheet) ?? defaults.stylesheet
  if (stylesheet) cdn.stylesheet = stylesheet

  const autoRender = resolveCdnUrl(opts.auto_render) ?? defaults.auto_render
  if (autoRender) cdn.auto_render = autoRender

  return cdn
}

export function resolveMathConfig(config: Config): MathConfig | null {
  for (const ext of config.markdown_extensions ?? []) {
    const { name, options } = parseExtension(ext)
    if (name !== 'pymdownx.arithmatex') continue

    const provider = options.provider === 'mathjax' ? 'mathjax' : 'katex'
    const defaultVersion = provider === 'mathjax' ? DEFAULT_MATHJAX_VERSION : DEFAULT_KATEX_VERSION
    const version = typeof options.version === 'string' && options.version.trim()
      ? options.version.trim()
      : defaultVersion
    const cdnOptions = options.cdn && typeof options.cdn === 'object'
      ? options.cdn as Record<string, unknown>
      : undefined

    return {
      enabled: true,
      provider,
      version,
      cdn: resolveMathCdn(provider, version, cdnOptions),
    }
  }
  return null
}
