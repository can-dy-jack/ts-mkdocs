import { existsSync } from 'fs'
import { join, relative, extname, basename, dirname, sep } from 'path'
import type { Config } from './config.js'
import { walkDir, isMarkdown } from './utils.js'

export interface DocFile {
  srcPath: string
  srcUri: string
  destPath: string
  destUri: string
  url: string
  isMarkdown: boolean
}

export function collectFiles(config: Config): DocFile[] {
  const files: DocFile[] = []
  const { docs_dir, site_dir, use_directory_urls } = config

  for (const absPath of walkDir(docs_dir)) {
    const srcUri = relative(docs_dir, absPath).split(sep).join('/')
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
