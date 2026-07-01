import { describe, expect, it } from 'vitest'
import MarkdownIt from 'markdown-it'
import { tasklistPlugin } from '../md/tasklist.js'

function render(md: string): string {
  const parser = new MarkdownIt().use(tasklistPlugin)
  return parser.render(md)
}

describe('tasklist', () => {
  it('renders checkbox inputs instead of escaped HTML', () => {
    const html = render('- [ ] Todo\n- [x] Done')
    expect(html).toContain('<input type="checkbox" class="task-list-item-checkbox" disabled> Todo')
    expect(html).toContain('<input type="checkbox" class="task-list-item-checkbox" checked disabled> Done')
    expect(html).not.toContain('&lt;input')
  })

  it('adds task-list classes to list elements', () => {
    const html = render('- [ ] Item')
    expect(html).toContain('<ul class="task-list">')
    expect(html).toContain('<li class="task-list-item">')
  })

  it('supports ordered task lists', () => {
    const html = render('1. [ ] First\n2. [x] Second')
    expect(html).toContain('<ol class="task-list">')
    expect(html).toContain('checked disabled> Second')
  })

  it('supports nested task lists', () => {
    const html = render('- [ ] Parent\n    - [x] Child')
    expect(html).toContain('task-list-item')
    expect(html.match(/task-list-item/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('does not treat non-list checkbox patterns as tasks', () => {
    const html = render('See [x] in prose.')
    expect(html).not.toContain('task-list-item-checkbox')
  })
})
