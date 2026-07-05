import { describe, expect, it } from 'vitest'
import {
  buildAdmonitionTypeDefaults,
  buildAdmonitionTypesStyles,
  parseAdmonitionTypes,
  resolveAdmonitionColor,
  resolveAdmonitionTypes,
} from '../admonition-types.js'

describe('admonition-types', () => {
  it('includes built-in types by default', () => {
    const resolved = parseAdmonitionTypes(undefined)
    expect(resolved.allowed.has('note')).toBe(true)
    expect(resolved.allowed.has('warning')).toBe(true)
    expect(resolved.custom.size).toBe(0)
  })

  it('parses string array entries', () => {
    const resolved = parseAdmonitionTypes(['todo', 'experimental'])
    expect(resolved.allowed.has('todo')).toBe(true)
    expect(resolved.allowed.has('experimental')).toBe(true)
    expect(resolved.custom.get('todo')).toEqual({})
  })

  it('parses object map entries with color and icon', () => {
    const resolved = parseAdmonitionTypes({
      todo: { title: 'Todo', icon: 'material/checklist', color: '#795548' },
    })
    expect(resolved.custom.get('todo')).toEqual({
      title: 'Todo',
      icon: 'material/checklist',
      color: '#795548',
    })
    expect(resolved.icons.todo).toBe('material/checklist')
  })

  it('parses array object entries', () => {
    const resolved = parseAdmonitionTypes([
      { name: 'experimental', title: 'Experimental', color: '#673ab7' },
    ])
    expect(resolved.custom.get('experimental')).toEqual({
      title: 'Experimental',
      color: '#673ab7',
    })
  })

  it('builds default titles for custom types', () => {
    const resolved = parseAdmonitionTypes({
      todo: { title: 'Todo item' },
    })
    expect(buildAdmonitionTypeDefaults(resolved.custom)).toEqual({
      todo: { title: 'Todo item' },
    })
  })

  it('generates CSS for hex colors', () => {
    const css = buildAdmonitionTypesStyles({
      markdown_extensions: [
        {
          admonition: {
            types: {
              todo: { color: '#795548' },
            },
          },
        },
      ],
    } as any)
    expect(css).toContain('.admonition.todo')
    expect(css).toContain('--admonition-color: #795548')
  })

  it('generates CSS for rgba colors', () => {
    const css = buildAdmonitionTypesStyles({
      markdown_extensions: [
        {
          admonition: {
            types: {
              draft: { color: 'rgba(121, 85, 72, 0.9)' },
            },
          },
        },
      ],
    } as any)
    expect(css).toContain('--admonition-color: rgba(121, 85, 72, 0.9)')
  })

  it('rejects palette keyword colors', () => {
    expect(resolveAdmonitionColor('brown')).toBeUndefined()
    expect(resolveAdmonitionColor('deep-purple')).toBeUndefined()
    const css = buildAdmonitionTypesStyles({
      markdown_extensions: [
        { admonition: { types: { todo: { color: 'brown' } } } },
      ],
    } as any)
    expect(css).toBe('')
  })

  it('accepts rgb and hsl formats', () => {
    expect(resolveAdmonitionColor('rgb(121, 85, 72)')).toBe('rgb(121, 85, 72)')
    expect(resolveAdmonitionColor('hsl(270, 50%, 40%)')).toBe('hsl(270, 50%, 40%)')
  })

  it('resolves types from markdown_extensions config', () => {
    const resolved = resolveAdmonitionTypes({
      markdown_extensions: [{ admonition: { types: ['todo'] } }],
    } as any)
    expect(resolved.allowed.has('todo')).toBe(true)
  })
})
