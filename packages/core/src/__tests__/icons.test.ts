import { describe, expect, it } from 'vitest'
import { parseIconRef, renderIconRef, createIconService, buildThemeIcons } from '../icons'

describe('icons', () => {
  it('parses material shortcode', () => {
    const parsed = parseIconRef('material-home', 'material')
    expect(parsed.library).toBe('material')
    expect(parsed.parts).toEqual(['home'])
  })

  it('parses fontawesome brands', () => {
    const parsed = parseIconRef('fontawesome-brands-github', 'material')
    expect(parsed.library).toBe('fontawesome')
    expect(parsed.parts).toEqual(['brands', 'github'])
  })

  it('parses slash notation', () => {
    const parsed = parseIconRef('bootstrap/heart', 'material')
    expect(parsed.library).toBe('bootstrap')
    expect(parsed.parts).toEqual(['heart'])
  })

  it('renders material icon html', () => {
    const html = renderIconRef('material-home', 'material')
    expect(html).toContain('material-symbols-outlined')
    expect(html).toContain('home')
  })

  it('replaces shortcodes in text', () => {
    const icons = createIconService({
      theme: { icons: { default: 'material', libraries: ['material'] } },
    } as any)
    const out = icons.replaceShortcodes('Click :material-home: to start')
    expect(out).toContain('material-symbols-outlined')
    expect(out).not.toContain(':material-home:')
  })

  it('maps zap alias to bolt for material', () => {
    const html = renderIconRef('material-zap', 'material')
    expect(html).toContain('bolt')
    expect(html).not.toContain('>zap<')
  })

  it('maps folder-outline alias to folder_open for material', () => {
    const html = renderIconRef('material/folder-outline', 'material')
    expect(html).toContain('folder_open')
    expect(html).not.toContain('folder_outline')
  })

  it('uses admonition icon overrides', () => {
    const icons = createIconService({
      theme: {
        icons: { default: 'material', libraries: ['material'] },
        icon: { admonition: { note: 'material/star' } },
      },
    } as any)
    const html = icons.getAdmonitionIcon('note')
    expect(html).toContain('star')
  })

  it('builds theme toggle icons with defaults and overrides', () => {
    const icons = createIconService({
      theme: {
        icons: { default: 'material', libraries: ['material'] },
        icon: { theme: { light: 'material/star' } },
      },
    } as any)
    const themeIcons = buildThemeIcons(
      { theme: { icons: { default: 'material', libraries: ['material'] }, icon: { theme: { light: 'material/star' } } } } as any,
      icons.renderRef.bind(icons),
    )
    expect(themeIcons.light).toContain('star')
    expect(themeIcons.dark).toContain('dark_mode')
    expect(themeIcons.system).toContain('brightness_auto')
  })
})
