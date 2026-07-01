import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { keysPlugin } from '../md/keys.js'

describe('keys', () => {
  it('renders single and chord shortcuts', () => {
    const md = new MarkdownIt().use(keysPlugin)
    expect(md.renderInline('++Enter++')).toBe('<kbd>Enter</kbd>')
    expect(md.renderInline('++Ctrl+C++')).toBe('<kbd>Ctrl</kbd>+<kbd>C</kbd>')
    expect(md.renderInline('Press ++Shift+Enter++ to submit.')).toBe(
      'Press <kbd>Shift</kbd>+<kbd>Enter</kbd> to submit.',
    )
  })
})
