import type { Config } from './config.js'
import type { PageMeta } from './frontmatter.js'

export type CommentsProvider = 'giscus' | 'utterances'

export interface CommentsConfigBase {
  provider: CommentsProvider
  repo: string
  theme: string
  theme_dark?: string
}

export interface GiscusCommentsConfig extends CommentsConfigBase {
  provider: 'giscus'
  repo_id: string
  category: string
  category_id: string
  mapping: string
  reactions_enabled: boolean
  emit_metadata: boolean
  input_position: 'top' | 'bottom'
  lang: string
  loading: 'lazy' | 'eager'
  strict: string
}

export interface UtterancesCommentsConfig extends CommentsConfigBase {
  provider: 'utterances'
  issue_term: string
  issue_number?: number
  label?: string
}

export type CommentsConfig = GiscusCommentsConfig | UtterancesCommentsConfig

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase()
    if (lower === 'true' || lower === '1') return true
    if (lower === 'false' || lower === '0') return false
  }
  return fallback
}

export function resolveCommentsConfig(config: Config): CommentsConfig | null {
  const extra = config.extra?.comments
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return null

  const raw = extra as Record<string, unknown>
  const provider = readString(raw.provider)
  if (provider !== 'giscus' && provider !== 'utterances') return null

  const repo = readString(raw.repo)
  if (!repo) return null

  const theme =
    readString(raw.theme) ??
    readString(raw.theme_light) ??
    (provider === 'utterances' ? 'github-light' : 'light')
  const themeDark = readString(raw.theme_dark)

  if (provider === 'giscus') {
    const repoId = readString(raw.repo_id)
    const category = readString(raw.category)
    const categoryId = readString(raw.category_id)
    if (!repoId || !category || !categoryId) return null

    const inputPosition = readString(raw.input_position)
    const loading = readString(raw.loading)

    return {
      provider: 'giscus',
      repo,
      repo_id: repoId,
      category,
      category_id: categoryId,
      mapping: readString(raw.mapping) ?? 'pathname',
      reactions_enabled: readBoolean(raw.reactions_enabled, true),
      emit_metadata: readBoolean(raw.emit_metadata, false),
      input_position: inputPosition === 'top' ? 'top' : 'bottom',
      lang: readString(raw.lang) ?? config.theme.language.replace('_', '-'),
      loading: loading === 'eager' ? 'eager' : 'lazy',
      strict: readString(raw.strict) ?? '0',
      theme,
      theme_dark: themeDark,
    }
  }

  const issueTerm = readString(raw.issue_term) ?? readString(raw.mapping) ?? 'pathname'
  let issueNumber: number | undefined
  if (issueTerm === 'issue-number' || issueTerm === 'number') {
    const num = raw.issue_number
    if (typeof num === 'number' && Number.isFinite(num)) {
      issueNumber = num
    } else if (typeof num === 'string' && num.trim()) {
      const parsed = Number.parseInt(num, 10)
      if (Number.isFinite(parsed)) issueNumber = parsed
    }
    if (issueNumber === undefined) return null
  }

  const label = readString(raw.label)

  return {
    provider: 'utterances',
    repo,
    issue_term: issueTerm === 'number' ? 'issue-number' : issueTerm,
    issue_number: issueNumber,
    label,
    theme,
    theme_dark: themeDark,
  }
}

export function shouldShowComments(
  pageMeta: PageMeta | undefined,
  commentsConfig: CommentsConfig | null,
): boolean {
  if (!commentsConfig || !pageMeta) return false
  return pageMeta.comments === true
}
