import type { PageMeta } from './frontmatter.js'
import type { I18nStrings } from './i18n.js'

export interface PageMetaBarItem {
  type: 'date' | 'updated' | 'groups' | 'readtime'
  value: string
  datetime?: string
  icon?: string
  label?: string
}

export function buildMetaBarItems(
  meta: PageMeta,
  i18n: I18nStrings,
  options: {
    dateIconHtml?: string
    updatedIconHtml?: string
    groupIconHtml?: string
    readtimeIconHtml?: string
    readtimeFormatted?: string
  } = {},
): PageMetaBarItem[] {
  const hide = meta.hide ?? []
  if (hide.includes('meta')) return []

  const items: PageMetaBarItem[] = []

  if (meta.date_formatted && !hide.includes('dates')) {
    items.push({
      type: 'date',
      value: meta.date_formatted,
      datetime: meta.date,
      icon: options.dateIconHtml,
      label: i18n['meta.published'],
    })
  }

  if (meta.updated_formatted && !hide.includes('dates')) {
    items.push({
      type: 'updated',
      value: meta.updated_formatted,
      datetime: meta.updated,
      icon: options.updatedIconHtml,
      label: i18n['meta.updated'],
    })
  }

  if (meta.groups?.length && !hide.includes('groups')) {
    items.push({
      type: 'groups',
      value: meta.groups.join(', '),
      icon: options.groupIconHtml,
      label: i18n['meta.groups'],
    })
  }

  if (options.readtimeFormatted && !hide.includes('readtime')) {
    items.push({
      type: 'readtime',
      value: options.readtimeFormatted,
      icon: options.readtimeIconHtml,
      label: i18n['meta.readtime'],
    })
  }

  return items
}

export function shouldShowPageTags(meta: PageMeta): boolean {
  const hide = meta.hide ?? []
  return !!(meta.tags?.length && !hide.includes('tags'))
}
