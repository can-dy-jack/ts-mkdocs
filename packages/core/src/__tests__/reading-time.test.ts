import { describe, expect, it } from 'vitest'
import { buildMetaBarItems, shouldShowPageTags } from '../page-meta.js'
import {
  computeReadingTime,
  injectAfterFirstH1,
  isReadingTimeEnabled,
  resolveReadingTimeConfig,
} from '../reading-time.js'
import { getI18n } from '../i18n.js'

describe('reading-time', () => {
  it('computes reading time from words and CJK characters', () => {
    const english = computeReadingTime(
      '# Hello\n\n'.repeat(50) + 'word '.repeat(300),
      { words_per_minute: 265 },
      'en',
    )
    expect(english?.minutes).toBeGreaterThanOrEqual(1)
    expect(english?.formatted).toContain('min read')

    const chinese = computeReadingTime(
      '# 标题\n\n' + '中文内容'.repeat(200),
      { cjk_chars_per_minute: 500 },
      'zh',
    )
    expect(chinese?.minutes).toBeGreaterThanOrEqual(1)
    expect(chinese?.formatted).toContain('分钟')
  })

  it('respects readtime frontmatter override', () => {
    const result = computeReadingTime('short text', {}, 'en', 12)
    expect(result?.minutes).toBe(12)
    expect(result?.formatted).toBe('12 min read')
  })

  it('excludes fenced code blocks when configured', () => {
    const withCode = computeReadingTime(
      '# Title\n\n```js\n' + 'console.log("x");'.repeat(100) + '\n```\n\nHello world',
      { exclude_code: true, words_per_minute: 265 },
      'en',
    )
    const withoutCode = computeReadingTime(
      '# Title\n\nHello world',
      { words_per_minute: 265 },
      'en',
    )
    expect(withCode?.minutes).toBe(withoutCode?.minutes)
  })

  it('injects meta bar after the first h1', () => {
    const html = injectAfterFirstH1(
      '<h1 id="title">Title</h1><p>Body</p>',
      '<div class="meta">info</div>',
    )
    expect(html).toBe(
      '<h1 id="title">Title</h1><div class="meta">info</div><p>Body</p>',
    )
  })

  it('resolves reading time config from extra', () => {
    expect(resolveReadingTimeConfig({ reading_time: { words_per_minute: 300 } }).words_per_minute).toBe(300)
    expect(isReadingTimeEnabled({ enabled: false }, {})).toBe(false)
    expect(isReadingTimeEnabled({ enabled: true }, { readtime: 5 })).toBe(true)
    expect(isReadingTimeEnabled({ enabled: true }, { reading_time: false })).toBe(false)
  })
})

describe('page-meta', () => {
  it('builds meta bar items in order', () => {
    const i18n = getI18n('en')
    const items = buildMetaBarItems(
      {
        date: '2024-06-01T00:00:00.000Z',
        date_formatted: 'June 1, 2024',
        updated: '2024-12-01T00:00:00.000Z',
        updated_formatted: 'December 1, 2024',
        groups: ['Guide'],
      },
      i18n,
      {
        groupIconHtml: '<svg></svg>',
        dateIconHtml: '<i>date</i>',
        updatedIconHtml: '<i>updated</i>',
        readtimeIconHtml: '<i>time</i>',
        readtimeFormatted: '3 min read',
      },
    )

    expect(items.map((item) => item.type)).toEqual([
      'date',
      'updated',
      'groups',
      'readtime',
    ])
    expect(items[0].icon).toBe('<i>date</i>')
    expect(items[1].value).toBe('December 1, 2024')
    expect(items[1].icon).toBe('<i>updated</i>')
    expect(items[2].icon).toBe('<svg></svg>')
    expect(items[3].icon).toBe('<i>time</i>')
  })

  it('respects hide flags', () => {
    expect(
      shouldShowPageTags({ tags: ['A'], hide: ['tags'] }),
    ).toBe(false)
    expect(
      buildMetaBarItems({ date_formatted: 'June 1, 2024', hide: ['meta'] }, getI18n('en')),
    ).toEqual([])
  })

  it('does not include authors in meta bar', () => {
    const items = buildMetaBarItems(
      { authors: ['alice'], date_formatted: 'June 1, 2024' },
      getI18n('en'),
    )
    expect(items.some((item) => item.type === 'authors')).toBe(false)
  })
})
