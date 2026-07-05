import { copyFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import type { Config } from './config.js'
import { isExternalAssetUrl } from './asset-url.js'
import { ensureDir, joinUrl, warn } from './utils.js'

export type ExtraCssEntry = string | { path: string; media?: string }
export type ExtraJsEntry =
  | string
  | { path: string; type?: 'module' | 'text/javascript'; defer?: boolean; async?: boolean }

export interface ResolvedExtraStylesheet {
  href: string
  media?: string
}

export interface ResolvedExtraScript {
  href: string
  type?: 'module' | 'text/javascript'
  defer?: boolean
  async?: boolean
}

export function normalizeExtraCssEntry(entry: ExtraCssEntry): { path: string; media?: string } {
  if (typeof entry === 'string') return { path: entry }
  return { path: entry.path, media: entry.media }
}

export function normalizeExtraJsEntry(entry: ExtraJsEntry): {
  path: string
  type?: 'module' | 'text/javascript'
  defer?: boolean
  async?: boolean
} {
  if (typeof entry === 'string') return { path: entry }
  return {
    path: entry.path,
    type: entry.type,
    defer: entry.defer,
    async: entry.async,
  }
}

function isSiteAbsolutePath(path: string): boolean {
  return path.startsWith('/')
}

function shouldCopyExtraAsset(path: string): boolean {
  return !isExternalAssetUrl(path) && !isSiteAbsolutePath(path)
}

export function resolveExtraAssetHref(baseUrl: string, path: string): string {
  return joinUrl(baseUrl, path.replace(/^\.\//, ''))
}

export function resolveExtraStylesheets(
  config: Config,
  baseUrl: string,
): ResolvedExtraStylesheet[] {
  return config.extra_css.map((entry) => {
    const { path, media } = normalizeExtraCssEntry(entry)
    return {
      href: resolveExtraAssetHref(baseUrl, path),
      media,
    }
  })
}

export function resolveExtraScripts(config: Config, baseUrl: string): ResolvedExtraScript[] {
  return config.extra_javascript.map((entry) => {
    const { path, type, defer, async } = normalizeExtraJsEntry(entry)
    return {
      href: resolveExtraAssetHref(baseUrl, path),
      type,
      defer,
      async,
    }
  })
}

export function copyExtraAssets(config: Config): void {
  const missing: string[] = []

  for (const entry of config.extra_css) {
    const { path } = normalizeExtraCssEntry(entry)
    if (!shouldCopyExtraAsset(path)) continue

    const src = join(config.docs_dir, path)
    if (!existsSync(src)) {
      missing.push(path)
      continue
    }

    const dest = join(config.site_dir, path)
    ensureDir(dirname(dest))
    copyFileSync(src, dest)
  }

  for (const entry of config.extra_javascript) {
    const { path } = normalizeExtraJsEntry(entry)
    if (!shouldCopyExtraAsset(path)) continue

    const src = join(config.docs_dir, path)
    if (!existsSync(src)) {
      missing.push(path)
      continue
    }

    const dest = join(config.site_dir, path)
    ensureDir(dirname(dest))
    copyFileSync(src, dest)
  }

  if (missing.length === 0) return

  const message = `Extra asset(s) not found under docs_dir:\n${missing.map((p) => `  - ${p}`).join('\n')}`
  if (config.strict) {
    throw new Error(message)
  }
  warn(message)
}
