import { existsSync } from 'fs'
import { join, relative, extname, basename, dirname, sep } from 'path'
import type { Config } from './config.js'
import { isMetaFile } from './frontmatter.js'
import { walkDir, isMarkdown } from './utils.js'

export interface DocFile {
  srcPath: string
  srcUri: string
  destPath: string
  destUri: string
  url: string
  isMarkdown: boolean
  /** Set by the i18n plugin: locale code (e.g. `en`). */
  locale?: string
  /** Set by the i18n plugin: source path without locale prefix. */
  canonicalUri?: string
}

export function collectFiles(config: Config): DocFile[] {
  const files: DocFile[] = []
  const { docs_dir, site_dir, use_directory_urls } = config

  for (const absPath of walkDir(docs_dir)) {
    const srcUri = relative(docs_dir, absPath).split(sep).join('/')
    if (isMetaFile(srcUri)) continue
    const file = buildDocFile(srcUri, docs_dir, site_dir, use_directory_urls)
    files.push(file)
  }

  return files
}

export function buildDocFile(
  srcUri: string,
  docsDir: string,
  siteDir: string,
  useDirectoryUrls: boolean,
): DocFile {
  const srcPath = join(docsDir, srcUri)
  const md = isMarkdown(srcUri)

  let destUri: string
  let url: string

  if (md) {
    const base = basename(srcUri, extname(srcUri))
    const dir = dirname(srcUri)
    const normalDir = dir === '.' ? '' : dir + '/'

    if (base === 'index' || base === 'README') {
      destUri = normalDir + 'index.html'
      url = normalDir || './'
    } else if (useDirectoryUrls) {
      destUri = normalDir + base + '/index.html'
      url = normalDir + base + '/'
    } else {
      destUri = normalDir + base + '.html'
      url = normalDir + base + '.html'
    }
  } else {
    destUri = srcUri
    url = srcUri
  }

  return {
    srcPath,
    srcUri,
    destPath: join(siteDir, destUri),
    destUri,
    url,
    isMarkdown: md,
  }
}

export function getFileForSrcUri(files: DocFile[], srcUri: string): DocFile | undefined {
  return files.find((f) => f.srcUri === srcUri)
}

/** Strip a locale directory prefix from a source URI. */
export function stripLocalePrefix(
  srcUri: string,
  locales: string[],
): { locale: string | null; path: string } {
  const first = srcUri.split('/')[0]
  if (locales.includes(first)) {
    return { locale: first, path: srcUri.slice(first.length + 1) }
  }
  return { locale: null, path: srcUri }
}

/** Prepend a locale segment to a destination URI. */
export function prefixDestUri(destUri: string, locale: string): string {
  return `${locale}/${destUri}`
}

/** Prepend a locale segment to a page URL. */
export function prefixUrl(url: string, locale: string): string {
  if (url === './') return `${locale}/`
  return `${locale}/${url}`
}

/** True when the file lives outside any locale directory (shared assets). */
export function isSharedAsset(srcUri: string, locales: string[]): boolean {
  const first = srcUri.split('/')[0]
  return !locales.includes(first)
}

/** Derive a canonical page key from a markdown source URI (without locale prefix). */
export function canonicalPageKey(srcUri: string, useDirectoryUrls: boolean): string {
  const base = basename(srcUri, extname(srcUri))
  const dir = dirname(srcUri)
  const normalDir = dir === '.' ? '' : dir + '/'

  if (base === 'index' || base === 'README') {
    return normalDir || './'
  }
  if (useDirectoryUrls) {
    return normalDir + base + '/'
  }
  return normalDir + base + '.html'
}
