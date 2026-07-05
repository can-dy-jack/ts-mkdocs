import { execFileSync } from 'child_process'
import { statSync } from 'fs'
import { dirname, relative } from 'path'
import type { Config } from './config.js'
import { normalizePageMeta } from './frontmatter.js'
import type { Page } from './page.js'

export type RevisionDateSource = 'git' | 'filesystem'

export interface RevisionDateConfig {
  enabled?: boolean
  source?: RevisionDateSource
  enable_creation_date?: boolean
  fallback_to_build_date?: boolean
  exclude?: string[]
}

export interface ResolvedRevisionDates {
  created?: string
  updated?: string
}

const DEFAULT_CONFIG: RevisionDateConfig = {
  enabled: true,
  source: 'git',
  enable_creation_date: true,
  fallback_to_build_date: false,
  exclude: [],
}

const dateCache = new Map<string, ResolvedRevisionDates>()
let cachedGitRoot: string | undefined | null = null

export function resolveRevisionDateConfig(
  options: Record<string, unknown> = {},
): RevisionDateConfig {
  const source = options.source === 'filesystem' ? 'filesystem' : 'git'
  const exclude = Array.isArray(options.exclude)
    ? options.exclude.map(String).filter(Boolean)
    : DEFAULT_CONFIG.exclude

  return {
    enabled: options.enabled !== false,
    source,
    enable_creation_date: options.enable_creation_date !== false,
    fallback_to_build_date: options.fallback_to_build_date === true,
    exclude,
  }
}

export function getGitRevisionDatePluginConfig(config: Config): RevisionDateConfig {
  for (const entry of config.plugins) {
    if (entry === 'git-revision-date') {
      return resolveRevisionDateConfig()
    }
    if (typeof entry === 'object' && 'git-revision-date' in entry) {
      return resolveRevisionDateConfig(
        (entry['git-revision-date'] ?? {}) as Record<string, unknown>,
      )
    }
  }
  return { ...DEFAULT_CONFIG, enabled: false }
}

export function hasGitRevisionDatePlugin(config: Config): boolean {
  return getGitRevisionDatePluginConfig(config).enabled === true
    && config.plugins.some((entry) => {
      const name = typeof entry === 'string' ? entry : Object.keys(entry)[0]
      return name === 'git-revision-date'
    })
}

export function clearRevisionDateCache(): void {
  dateCache.clear()
  cachedGitRoot = null
}

function runGit(args: string[], cwd: string): string | undefined {
  try {
    const output = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const value = output.trim()
    return value || undefined
  } catch {
    return undefined
  }
}

function findGitRoot(filePath: string): string | undefined {
  if (cachedGitRoot !== null) {
    return cachedGitRoot || undefined
  }

  let dir = dirname(filePath)
  for (let i = 0; i < 32; i++) {
    const inside = runGit(['rev-parse', '--is-inside-work-tree'], dir)
    if (inside === 'true') {
      const root = runGit(['rev-parse', '--show-toplevel'], dir)
      cachedGitRoot = root ?? ''
      return root
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  cachedGitRoot = ''
  return undefined
}

function getGitDates(filePath: string): ResolvedRevisionDates {
  const repoRoot = findGitRoot(filePath)
  if (!repoRoot) return {}

  const relativePath = relative(repoRoot, filePath)
  const updated = runGit(['log', '-1', '--format=%cI', '--', relativePath], repoRoot)
  const created = runGit(
    ['log', '--follow', '--diff-filter=A', '-1', '--format=%cI', '--', relativePath],
    repoRoot,
  )

  return { updated, created }
}

function getFilesystemDates(filePath: string): ResolvedRevisionDates {
  try {
    const stat = statSync(filePath)
    const updated = stat.mtime.toISOString()
    const created =
      stat.birthtimeMs > 0 && stat.birthtime.getTime() !== stat.mtime.getTime()
        ? stat.birthtime.toISOString()
        : updated
    return { updated, created }
  } catch {
    return {}
  }
}

function getBuildDate(): string {
  return new Date().toISOString()
}

export function resolveRevisionDates(
  filePath: string,
  config: RevisionDateConfig,
): ResolvedRevisionDates {
  const cached = dateCache.get(filePath)
  if (cached) return cached

  let dates: ResolvedRevisionDates = {}

  if (config.source === 'filesystem') {
    dates = getFilesystemDates(filePath)
  } else {
    dates = getGitDates(filePath)
    if (!dates.updated && !dates.created) {
      dates = getFilesystemDates(filePath)
    }
  }

  if (config.fallback_to_build_date) {
    const fallback = getBuildDate()
    dates = {
      created: dates.created ?? fallback,
      updated: dates.updated ?? fallback,
    }
  }

  dateCache.set(filePath, dates)
  return dates
}

function isExcluded(srcUri: string, exclude: string[] | undefined): boolean {
  if (!exclude?.length) return false
  return exclude.some((pattern) => srcUri === pattern || srcUri.endsWith(`/${pattern}`))
}

export function applyRevisionDatesToPage(
  page: Page,
  config: RevisionDateConfig,
  language: string,
): void {
  if (config.enabled === false) return
  if (isExcluded(page.file.srcUri, config.exclude)) return

  const needsDate = config.enable_creation_date && page.meta.date === undefined
  const needsUpdated = page.meta.updated === undefined
  if (!needsDate && !needsUpdated) return

  const dates = resolveRevisionDates(page.file.srcPath, config)
  const patch: Record<string, unknown> = { ...page.meta }

  if (needsDate && dates.created) {
    patch.date = dates.created
  }
  if (needsUpdated && dates.updated) {
    patch.updated = dates.updated
  }

  Object.assign(page.meta, normalizePageMeta(patch, language))
}
