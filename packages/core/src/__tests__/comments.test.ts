import { describe, it, expect } from 'vitest'
import { resolveCommentsConfig, shouldShowComments } from '../comments.js'
import type { Config } from '../config.js'

const baseConfig = {
  site_name: 'Test',
  theme: { language: 'en' },
} as Config

describe('resolveCommentsConfig', () => {
  it('returns null when comments are not configured', () => {
    expect(resolveCommentsConfig(baseConfig)).toBeNull()
    expect(resolveCommentsConfig({ ...baseConfig, extra: {} })).toBeNull()
  })

  it('returns null for giscus when required fields are missing', () => {
    const config = {
      ...baseConfig,
      extra: {
        comments: {
          provider: 'giscus',
          repo: 'owner/repo',
        },
      },
    } as Config
    expect(resolveCommentsConfig(config)).toBeNull()
  })

  it('parses a complete giscus config with defaults', () => {
    const config = {
      ...baseConfig,
      extra: {
        comments: {
          provider: 'giscus',
          repo: 'owner/repo',
          repo_id: 'R_test',
          category: 'General',
          category_id: 'DIC_test',
        },
      },
    } as Config

    const resolved = resolveCommentsConfig(config)
    expect(resolved).toMatchObject({
      provider: 'giscus',
      repo: 'owner/repo',
      repo_id: 'R_test',
      category: 'General',
      category_id: 'DIC_test',
      mapping: 'pathname',
      reactions_enabled: true,
      emit_metadata: false,
      input_position: 'bottom',
      lang: 'en',
      loading: 'lazy',
      strict: '0',
      theme: 'light',
    })
  })

  it('supports theme, lang, and input_position from yml', () => {
    const config = {
      ...baseConfig,
      extra: {
        comments: {
          provider: 'giscus',
          repo: 'owner/repo',
          repo_id: 'R_test',
          category: 'General',
          category_id: 'DIC_test',
          theme: 'gruvbox_light',
          theme_dark: 'gruvbox_dark',
          lang: 'zh-CN',
          input_position: 'bottom',
        },
      },
    } as Config

    const resolved = resolveCommentsConfig(config)
    expect(resolved).toMatchObject({
      theme: 'gruvbox_light',
      theme_dark: 'gruvbox_dark',
      lang: 'zh-CN',
      input_position: 'bottom',
    })
  })

  it('parses a complete utterances config', () => {
    const config = {
      ...baseConfig,
      extra: {
        comments: {
          provider: 'utterances',
          repo: 'owner/repo',
          issue_term: 'pathname',
          label: 'comments',
          theme: 'github-light',
        },
      },
    } as Config

    const resolved = resolveCommentsConfig(config)
    expect(resolved).toMatchObject({
      provider: 'utterances',
      repo: 'owner/repo',
      issue_term: 'pathname',
      label: 'comments',
      theme: 'github-light',
    })
  })

  it('requires issue_number when issue_term is issue-number', () => {
    const config = {
      ...baseConfig,
      extra: {
        comments: {
          provider: 'utterances',
          repo: 'owner/repo',
          issue_term: 'issue-number',
        },
      },
    } as Config
    expect(resolveCommentsConfig(config)).toBeNull()

    const withNumber = {
      ...baseConfig,
      extra: {
        comments: {
          provider: 'utterances',
          repo: 'owner/repo',
          issue_term: 'issue-number',
          issue_number: 42,
        },
      },
    } as Config
    expect(resolveCommentsConfig(withNumber)).toMatchObject({
      provider: 'utterances',
      issue_number: 42,
    })
  })
})

describe('shouldShowComments', () => {
  const giscusConfig = resolveCommentsConfig({
    ...baseConfig,
    extra: {
      comments: {
        provider: 'giscus',
        repo: 'owner/repo',
        repo_id: 'R_test',
        category: 'General',
        category_id: 'DIC_test',
      },
    },
  } as Config)

  it('returns true when config is valid and page enables comments', () => {
    expect(shouldShowComments({ comments: true }, giscusConfig)).toBe(true)
  })

  it('returns false when comments are disabled or config is missing', () => {
    expect(shouldShowComments({ comments: false }, giscusConfig)).toBe(false)
    expect(shouldShowComments({}, giscusConfig)).toBe(false)
    expect(shouldShowComments({ comments: true }, null)).toBe(false)
    expect(shouldShowComments(undefined, giscusConfig)).toBe(false)
  })
})
