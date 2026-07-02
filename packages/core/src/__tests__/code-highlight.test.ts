import { describe, expect, it } from 'vitest'
import {
  formatLangLabel,
  hasLangLabelFeature,
  hasLineNumbersFeature,
  wrapCodeblockWithHead,
  renderPlainCodeHtml,
  stripTrailingEmptyLineSpans,
  ensureNonemptyLineSpans,
} from '../md/code-highlight.js'

const esc = (s: string) => s

describe('code-highlight', () => {
  it('detects content.code.linenumbers feature', () => {
    expect(hasLineNumbersFeature({ theme: { features: ['content.code.linenumbers'] } } as any)).toBe(true)
    expect(hasLineNumbersFeature({ theme: { features: [] } } as any)).toBe(false)
  })

  it('detects content.code.lang feature', () => {
    expect(hasLangLabelFeature({ theme: { features: ['content.code.lang'] } } as any)).toBe(true)
    expect(hasLangLabelFeature({ theme: { features: [] } } as any)).toBe(false)
  })

  it('formats common language labels', () => {
    expect(formatLangLabel('typescript')).toBe('TypeScript')
    expect(formatLangLabel('json')).toBe('JSON')
    expect(formatLangLabel('dockerfile')).toBe('Dockerfile')
  })

  it('defaults empty language to plain text label', () => {
    expect(formatLangLabel('')).toBe('Plain text')
    expect(formatLangLabel('text')).toBe('Plain text')
    expect(formatLangLabel('', 'zh')).toBe('纯文本')
    expect(formatLangLabel('text', 'zh-CN')).toBe('纯文本')
  })

  it('adds plain text label when language is omitted', () => {
    const html = renderPlainCodeHtml('hello', esc, { langLabel: true })
    expect(html).toContain('class="md-codeblock__lang">Plain text</span>')
    expect(html).toContain('data-md-lang="text"')
  })

  it('adds localized plain text label when language is omitted', () => {
    const html = renderPlainCodeHtml('hello', esc, { langLabel: true, locale: 'zh' })
    expect(html).toContain('class="md-codeblock__lang">纯文本</span>')
  })

  it('wraps plain code lines when line numbers are enabled', () => {
    const html = renderPlainCodeHtml('a\nb', esc, { lineNumbers: true })
    expect(html).toContain('<span class="line">a</span>')
    expect(html).toContain('<span class="line">b</span>')
  })

  it('adds language label to plain code blocks', () => {
    const html = renderPlainCodeHtml('x', esc, { lang: 'bash', langLabel: true })
    expect(html).toContain('class="md-codeblock"')
    expect(html).toContain('class="md-codeblock__head"')
    expect(html).toContain('class="md-codeblock__traffic"')
    expect(html).toContain('<button type="button" class="md-codeblock__traffic-dot md-codeblock__traffic-dot--close"')
    expect(html).toContain('class="md-codeblock__body"')
    expect(html).toContain('class="md-codeblock__lang">Bash</span>')
    expect(html).toContain('data-md-lang="bash"')
  })

  it('keeps plain code unchanged when line numbers are disabled', () => {
    const html = renderPlainCodeHtml('a\nb', esc, { lineNumbers: false })
    expect(html).toBe('<pre><code>a\nb</code></pre>\n')
  })

  it('strips trailing newlines before rendering', () => {
    const html = renderPlainCodeHtml('a\nb\n\n', esc, { lineNumbers: true })
    expect(html.match(/class="line"/g)?.length).toBe(2)
  })

  it('removes trailing empty shiki line spans', () => {
    const html = stripTrailingEmptyLineSpans(
      '<pre><code><span class="line">a</span><span class="line"></span></code></pre>',
    )
    expect(html).toBe('<pre><code><span class="line">a</span></code></pre>')
  })

  it('fills empty shiki line spans with a space', () => {
    const html = ensureNonemptyLineSpans(
      '<pre><code><span class="line">a</span><span class="line"></span><span class="line">b</span></code></pre>',
    )
    expect(html).toContain('<span class="line"> </span>')
    expect(html).not.toMatch(/<span class="line"><\/span>/)
  })

  it('wraps shiki html with language head', () => {
    const html = wrapCodeblockWithHead('<pre class="shiki"><code>x</code></pre>', 'typescript', esc)
    expect(html).toContain('class="md-codeblock" data-md-lang="typescript"')
    expect(html).toContain('class="md-codeblock__head"')
    expect(html).toContain('md-codeblock__traffic-dot--close')
    expect(html).toContain('class="md-codeblock__lang">TypeScript</span>')
    expect(html).toContain('<pre class="shiki">')
  })
})
