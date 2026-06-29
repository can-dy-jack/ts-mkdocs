import { basename, extname, dirname, sep } from 'path'
import type { Config } from './config.js'
import type { DocFile } from './files.js'
import { titleFromFilename } from './utils.js'

export interface NavPage {
  type: 'page'
  title: string
  file: DocFile
  url: string
  active: boolean
  prev?: NavPage
  next?: NavPage
  parent?: NavSection
}

export interface NavSection {
  type: 'section'
  title: string
  children: NavItem[]
  parent?: NavSection
}

export interface NavLink {
  type: 'link'
  title: string
  url: string
}

export type NavItem = NavPage | NavSection | NavLink

export interface Navigation {
  items: NavItem[]
  pages: NavPage[]
}

export function buildNavigation(config: Config, files: DocFile[]): Navigation {
  const mdFiles = files.filter((f) => f.isMarkdown)
  const fileMap = new Map(mdFiles.map((f) => [f.srcUri, f]))

  let items: NavItem[]

  if (config.nav && config.nav.length > 0) {
    items = buildExplicitNav(config.nav, fileMap)
  } else {
    items = buildInferredNav(mdFiles)
  }

  const pages = flattenPages(items)
  linkPages(pages)
  setParents(items, undefined)

  return { items, pages }
}

function buildExplicitNav(
  navConfig: any[],
  fileMap: Map<string, DocFile>,
): NavItem[] {
  const items: NavItem[] = []

  for (const entry of navConfig) {
    if (typeof entry === 'string') {
      const file = fileMap.get(entry)
      if (file) {
        items.push({
          type: 'page',
          title: titleForFile(file),
          file,
          url: file.url,
          active: false,
        })
      }
      continue
    }

    for (const [title, value] of Object.entries(entry)) {
      if (typeof value === 'string') {
        if (value.startsWith('http://') || value.startsWith('https://')) {
          items.push({ type: 'link', title, url: value })
        } else {
          const file = fileMap.get(value)
          if (file) {
            items.push({ type: 'page', title, file, url: file.url, active: false })
          }
        }
      } else if (Array.isArray(value)) {
        items.push({
          type: 'section',
          title,
          children: buildExplicitNav(value, fileMap),
        })
      }
    }
  }

  return items
}

function buildInferredNav(files: DocFile[]): NavItem[] {
  const tree = new Map<string, NavItem[]>()
  const root: NavItem[] = []

  const sorted = [...files].sort((a, b) => {
    const aIsIndex = isIndexFile(a.srcUri)
    const bIsIndex = isIndexFile(b.srcUri)
    if (aIsIndex && !bIsIndex) return -1
    if (!aIsIndex && bIsIndex) return 1
    return a.srcUri.localeCompare(b.srcUri)
  })

  for (const file of sorted) {
    const parts = file.srcUri.split('/')
    if (parts.some((p) => p.startsWith('_'))) continue

    if (parts.length === 1) {
      root.push({ type: 'page', title: titleForFile(file), file, url: file.url, active: false })
    } else {
      const sectionPath = parts.slice(0, -1).join('/')
      ensureSectionPath(root, tree, parts.slice(0, -1))
      const sectionItems = tree.get(sectionPath)!
      sectionItems.push({ type: 'page', title: titleForFile(file), file, url: file.url, active: false })
    }
  }

  return root
}

function ensureSectionPath(
  root: NavItem[],
  tree: Map<string, NavItem[]>,
  parts: string[],
): void {
  for (let i = 1; i <= parts.length; i++) {
    const path = parts.slice(0, i).join('/')
    if (!tree.has(path)) {
      const title = titleFromFilename(parts[i - 1])
      const children: NavItem[] = []
      tree.set(path, children)

      const section: NavSection = { type: 'section', title, children }

      if (i === 1) {
        root.push(section)
      } else {
        const parentPath = parts.slice(0, i - 1).join('/')
        tree.get(parentPath)!.push(section)
      }
    }
  }
}

function flattenPages(items: NavItem[]): NavPage[] {
  const pages: NavPage[] = []
  for (const item of items) {
    if (item.type === 'page') {
      pages.push(item)
    } else if (item.type === 'section') {
      pages.push(...flattenPages(item.children))
    }
  }
  return pages
}

function linkPages(pages: NavPage[]): void {
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pages[i].prev = pages[i - 1]
    if (i < pages.length - 1) pages[i].next = pages[i + 1]
  }
}

function setParents(items: NavItem[], parent: NavSection | undefined): void {
  for (const item of items) {
    if (item.type === 'section') {
      item.parent = parent
      setParents(item.children, item)
    } else if (item.type === 'page') {
      item.parent = parent
    }
  }
}

function isIndexFile(srcUri: string): boolean {
  const name = basename(srcUri, extname(srcUri)).toLowerCase()
  return name === 'index' || name === 'readme'
}

function titleForFile(file: DocFile): string {
  const name = basename(file.srcUri, extname(file.srcUri))
  if (name === 'index' || name === 'README') {
    const dir = dirname(file.srcUri)
    if (dir === '.') return 'Home'
    return titleFromFilename(basename(dir))
  }
  return titleFromFilename(name)
}

export function setActivePage(nav: Navigation, currentPage: NavPage): void {
  for (const page of nav.pages) {
    page.active = page === currentPage
  }
}
