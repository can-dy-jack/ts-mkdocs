import { resolveDocAssetUrl } from './asset-url.js'

export interface ContentImageOptions {
  lightbox?: boolean
  galleryId?: string
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function addLightboxAttrs(attrs: string, galleryId: string): string {
  if (/\bclass="/i.test(attrs)) {
    return attrs.replace(/\bclass="([^"]*)"/i, (_, classes) =>
      classes.includes('glightbox') ? attrs : `class="${classes} glightbox"`,
    )
  }
  let next = `${attrs} class="glightbox"`
  if (!/\bdata-gallery="/i.test(next)) {
    next += ` data-gallery="${escapeHtmlAttr(galleryId)}"`
  }
  return next
}

function rewriteImgTag(
  attrs: string,
  srcUri: string,
  destUri: string,
  options: ContentImageOptions,
): string {
  const srcMatch = attrs.match(/\bsrc="([^"]+)"/i)
  if (!srcMatch) return `<img${attrs}>`

  const resolved = resolveDocAssetUrl(srcUri, srcMatch[1], destUri)
  let nextAttrs = attrs.replace(/\bsrc="[^"]+"/i, `src="${escapeHtmlAttr(resolved)}"`)

  if (!options.lightbox || /\bdata-no-lightbox\b/i.test(nextAttrs)) {
    return `<img${nextAttrs}>`
  }

  const altMatch = nextAttrs.match(/\balt="([^"]*)"/i)
  const titleAttr = altMatch?.[1]
    ? ` data-title="${escapeHtmlAttr(altMatch[1])}"`
    : ''
  const galleryId = options.galleryId ?? 'page-content'

  return `<a href="${escapeHtmlAttr(resolved)}" class="glightbox" data-gallery="${escapeHtmlAttr(galleryId)}"${titleAttr}><img${nextAttrs}></a>`
}

/** Rewrite image src paths and optionally wrap images for lightbox galleries. */
export function rewriteContentImages(
  html: string,
  srcUri: string,
  destUri: string,
  options: ContentImageOptions = {},
): string {
  const galleryId = options.galleryId ?? 'page-content'

  // Images already linked: add glightbox to the anchor and rewrite both href/src.
  html = html.replace(
    /<a\b([^>]*?)href="([^"]+)"([^>]*?)>\s*<img\b([^>]*?)>\s*<\/a>/gi,
    (match, beforeHref, href, afterHref, imgAttrs) => {
      if (/\bdata-no-lightbox\b/i.test(beforeHref + afterHref + imgAttrs)) return match
      const resolved = resolveDocAssetUrl(srcUri, href, destUri)
      let anchorAttrs = `${beforeHref}href="${escapeHtmlAttr(resolved)}"${afterHref}`
      if (options.lightbox) {
        anchorAttrs = addLightboxAttrs(anchorAttrs, galleryId)
      }
      const srcMatch = imgAttrs.match(/\bsrc="([^"]+)"/i)
      const imgSrc = srcMatch ? srcMatch[1] : href
      const resolvedImg = resolveDocAssetUrl(srcUri, imgSrc, destUri)
      const nextImgAttrs = srcMatch
        ? imgAttrs.replace(/\bsrc="[^"]+"/i, `src="${escapeHtmlAttr(resolvedImg)}"`)
        : `${imgAttrs} src="${escapeHtmlAttr(resolvedImg)}"`
      const markedImgAttrs = /\bdata-ts-img="/i.test(nextImgAttrs)
        ? nextImgAttrs
        : `${nextImgAttrs} data-ts-img="linked"`
      return `<a${anchorAttrs}><img${markedImgAttrs}></a>`
    },
  )

  html = html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    if (/\bdata-ts-img="linked"/i.test(attrs)) {
      const cleaned = attrs.replace(/\s*data-ts-img="linked"/i, '')
      return `<img${cleaned}>`
    }
    if (/\bdata-no-lightbox\b/i.test(attrs)) {
      const srcMatch = attrs.match(/\bsrc="([^"]+)"/i)
      if (!srcMatch) return match
      const resolved = resolveDocAssetUrl(srcUri, srcMatch[1], destUri)
      const nextAttrs = attrs.replace(/\bsrc="[^"]+"/i, `src="${escapeHtmlAttr(resolved)}"`)
      return `<img${nextAttrs}>`
    }
    return rewriteImgTag(attrs, srcUri, destUri, options)
  })

  return html
}
