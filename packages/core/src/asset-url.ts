import { dirname, posix, relative, sep } from 'path'

/** Whether a URL should be left unchanged (external, data URI, fragment, etc.). */
export function isExternalAssetUrl(url: string): boolean {
  return /^(?:https?:)?\/\//.test(url)
    || url.startsWith('data:')
    || url.startsWith('mailto:')
    || url.startsWith('#')
}

/** Resolve a reference relative to the source Markdown file within docs_dir. */
export function resolveDocRelativePath(srcUri: string, ref: string): string {
  if (isExternalAssetUrl(ref) || ref.startsWith('/')) return ref

  const pageDir = dirname(srcUri)
  const joined = pageDir === '.' ? ref : posix.join(pageDir, ref)
  return posix.normalize(joined)
}

/** Build a URL relative to the rendered HTML file location. */
export function computePageRelativeAssetUrl(destUri: string, assetSitePath: string): string {
  if (isExternalAssetUrl(assetSitePath) || assetSitePath.startsWith('/')) return assetSitePath

  const pageDir = dirname(destUri)
  let rel = relative(pageDir, assetSitePath).split(sep).join('/')
  if (rel === '' || rel === '.') return './'
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
}

/** Resolve a docs-relative asset to a URL relative to the rendered HTML page. */
export function resolveDocAssetUrl(srcUri: string, ref: string, destUri: string): string {
  if (isExternalAssetUrl(ref)) return ref
  if (ref.startsWith('/')) return ref
  const assetSitePath = resolveDocRelativePath(srcUri, ref)
  return computePageRelativeAssetUrl(destUri, assetSitePath)
}
