import type { IconService } from './icons.js'
import type { I18nStrings } from './i18n.js'

export interface SharePlatformDef {
  icon: string
  color: string
  nameKey: string
}

export const SHARE_PLATFORM_DEFS: Record<string, SharePlatformDef> = {
  x: { icon: 'fontawesome/brands/x-twitter', color: '#000000', nameKey: 'share.platform.x' },
  facebook: { icon: 'fontawesome/brands/facebook', color: '#1877F2', nameKey: 'share.platform.facebook' },
  weibo: { icon: 'fontawesome/brands/weibo', color: '#E6162D', nameKey: 'share.platform.weibo' },
  linkedin: { icon: 'fontawesome/brands/linkedin', color: '#0A66C2', nameKey: 'share.platform.linkedin' },
  reddit: { icon: 'fontawesome/brands/reddit', color: '#FF4500', nameKey: 'share.platform.reddit' },
  wechat: { icon: 'custom/wechat', color: '#07C160', nameKey: 'share.platform.wechat' },
  bilibili: { icon: 'custom/bilibili', color: '#00A1D6', nameKey: 'share.platform.bilibili' },
  zhihu: { icon: 'custom/zhihu', color: '#1296DB', nameKey: 'share.platform.zhihu' },
  telegram: { icon: 'fontawesome/brands/telegram', color: '#26A5E4', nameKey: 'share.platform.telegram' },
  whatsapp: { icon: 'fontawesome/brands/whatsapp', color: '#25D366', nameKey: 'share.platform.whatsapp' },
  email: { icon: 'fontawesome/solid/envelope', color: '#6366F1', nameKey: 'share.platform.email' },
  mastodon: { icon: 'fontawesome/brands/mastodon', color: '#6364FF', nameKey: 'share.platform.mastodon' },
  pinterest: { icon: 'fontawesome/brands/pinterest', color: '#E60023', nameKey: 'share.platform.pinterest' },
  threads: { icon: 'fontawesome/brands/threads', color: '#000000', nameKey: 'share.platform.threads' },
  bluesky: { icon: 'fontawesome/brands/bluesky', color: '#0085FF', nameKey: 'share.platform.bluesky' },
}

export interface ShareItem {
  id: string
  icon_html: string
  color: string
  tooltip: string
  href?: string
  action?: 'wechat' | 'copy'
  trigger_id: string
}

function renderCustomShareIcon(name: string): string {
  const svgWrap = (paths: string | string[], viewBox = '0 0 24 24') => {
    const dList = Array.isArray(paths) ? paths : [paths]
    const pathEls = dList.map((d) => `<path d="${d}"/>`).join('')
    return `<span class="md-icon md-icon--brand" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="1em" height="1em" fill="currentColor">${pathEls}</svg></span>`
  }

  if (name === 'wechat') {
    return svgWrap(
      'M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .165.13.295.295.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z',
    )
  }

  if (name === 'bilibili') {
    return svgWrap(
      'M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.509-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.509-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.349v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.264-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.188.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.658-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.249-.56.373-.933.373s-.684-.124-.933-.373c-.25-.249-.383-.569-.4-.96v-1.173c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.249-.56.373-.933.373s-.684-.124-.933-.373c-.25-.249-.383-.569-.4-.96v-1.173c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z',
    )
  }

  if (name === 'zhihu') {
    return svgWrap(
      'M564.7 230.1V803h60l25.2 71.4L756.3 803h131.5V230.1H564.7z m247.7 497h-59.9l-75.1 50.4-17.8-50.4h-18V308.3h170.7v418.8zM526.1 486.9H393.3c2.1-44.9 4.3-104.3 6.6-172.9h130.9l-0.1-8.1c0-0.6-0.2-14.7-2.3-29.1-2.1-15-6.6-34.9-21-34.9H287.8c4.4-20.6 15.7-69.7 29.4-93.8l6.4-11.2-12.9-0.7c-0.8 0-19.6-0.9-41.4 10.6-35.7 19-51.7 56.4-58.7 84.4-18.4 73.1-44.6 123.9-55.7 145.6-3.3 6.4-5.3 10.2-6.2 12.8-1.8 4.9-0.8 9.8 2.8 13 10.5 9.5 38.2-2.9 38.5-3 0.6-0.3 1.3-0.6 2.2-1 13.9-6.3 55.1-25 69.8-84.5h56.7c0.7 32.2 3.1 138.4 2.9 172.9h-141l-2.1 1.5c-23.1 16.9-30.5 63.2-30.8 65.2l-1.4 9.2h167c-12.3 78.3-26.5 113.4-34 127.4-3.7 7-7.3 14-10.7 20.8-21.3 42.2-43.4 85.8-126.3 153.6-3.6 2.8-7 8-4.8 13.7 2.4 6.3 9.3 9.1 24.6 9.1 5.4 0 11.8-0.3 19.4-1 49.9-4.4 100.8-18 135.1-87.6 17-35.1 31.7-71.7 43.9-108.9L497 850l5-12c0.8-1.9 19-46.3 5.1-95.9l-0.5-1.8-108.1-123-22 16.6c6.4-26.1 10.6-49.9 12.5-71.1h158.7v-8c0-40.1-18.5-63.9-19.2-64.9l-2.4-3z',
      '0 0 1024 1024',
    )
  }

  return `<span class="md-icon" aria-hidden="true">${name}</span>`
}

export function buildShareUrl(platform: string, pageUrl: string, pageTitle: string): string | undefined {
  const encodedUrl = encodeURIComponent(pageUrl)
  const encodedTitle = encodeURIComponent(pageTitle)
  const shareText = encodeURIComponent(`${pageTitle} ${pageUrl}`)

  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    case 'weibo':
      return `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`
    case 'linkedin':
      return `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    case 'whatsapp':
      return `https://api.whatsapp.com/send?text=${shareText}`
    case 'email':
      return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
    case 'mastodon':
      return `https://mastodon.social/share?text=${shareText}`
    case 'pinterest':
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`
    case 'threads':
      return `https://www.threads.net/intent/post?text=${shareText}`
    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${shareText}`
    default:
      return undefined
  }
}

export function buildShareItems(
  platforms: string[] | undefined,
  enabled: boolean | undefined,
  pageUrl: string,
  pageTitle: string,
  i18n: I18nStrings,
  icons: IconService,
  pageSlug: string,
): ShareItem[] {
  if (!enabled || !platforms?.length) return []

  const toPlatform = i18n['share.to_platform'] ?? 'Share to {platform}'

  return platforms.flatMap((id, index) => {
    const def = SHARE_PLATFORM_DEFS[id]
    if (!def) return []

    const platformName = i18n[def.nameKey] ?? id
    const tooltip = toPlatform.replace('{platform}', platformName)
    const action =
      id === 'wechat' ? 'wechat' : id === 'bilibili' || id === 'zhihu' ? 'copy' : undefined
    const href = action ? undefined : buildShareUrl(id, pageUrl, pageTitle)
    const icon_html = def.icon.startsWith('custom/')
      ? renderCustomShareIcon(def.icon.slice('custom/'.length))
      : icons.renderRef(def.icon)

    return [{
      id,
      icon_html,
      color: def.color,
      tooltip,
      href,
      action,
      trigger_id: `share-${pageSlug}-${id}-${index}`,
    }]
  })
}
