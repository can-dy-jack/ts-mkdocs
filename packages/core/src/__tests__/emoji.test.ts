import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { createIconService } from '../icons.js'
import { emojiPlugin } from '../md/emoji.js'
import { iconsPlugin } from '../md/icons.js'

const ICON_CONFIG = { theme: { icons: { default: 'material', libraries: ['material'] } } } as const

function createParser(withEmoji: boolean): MarkdownIt {
  const md = new MarkdownIt()
  const icons = createIconService(ICON_CONFIG as any)
  if (withEmoji) md.use(emojiPlugin)
  md.use(iconsPlugin, icons, { emojiEnabled: withEmoji })
  return md
}

describe('emoji', () => {
  it('renders short names as unicode emoji', () => {
    const md = createParser(true)
    expect(md.renderInline(':smile:')).toBe('😄')
    expect(md.renderInline(':heart:')).toBe('❤️')
    expect(md.renderInline('Hello :wave: world')).toBe('Hello 👋 world')
  })

  it('renders emoticon shortcuts', () => {
    const md = createParser(true)
    expect(md.renderInline(':)')).toBe('😃')
    expect(md.renderInline(':-)')).toBe('😃')
  })

  it('keeps prefixed icon shortcodes when emoji is enabled', () => {
    const md = createParser(true)
    const html = md.renderInline('Click :material-home: to start')
    expect(html).toContain('material-symbols-outlined')
    expect(html).toContain('home')
    expect(html).not.toContain(':material-home:')
  })

  it('does not treat unprefixed names as icons when emoji is enabled', () => {
    const md = createParser(true)
    const html = md.renderInline(':smile:')
    expect(html).not.toContain('material-symbols-outlined')
    expect(html).toBe('😄')
  })

  it('still renders unprefixed names as icons when emoji is disabled', () => {
    const md = createParser(false)
    const html = md.renderInline(':material-home:')
    expect(html).toContain('material-symbols-outlined')
  })
})
