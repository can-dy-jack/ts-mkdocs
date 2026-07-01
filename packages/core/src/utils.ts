import { mkdirSync, cpSync, existsSync, statSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'
import pc from 'picocolors'

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true })
}

export function copyDir(src: string, dest: string): void {
  if (!existsSync(src)) return
  ensureDir(dest)
  cpSync(src, dest, { recursive: true })
}

export function* walkDir(dir: string): Generator<string> {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkDir(full)
    } else {
      yield full
    }
  }
}

export function isMarkdown(filePath: string): boolean {
  return extname(filePath).toLowerCase() === '.md'
}

export function titleFromFilename(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Join a page-relative base URL (e.g. `../../`) with a site-relative path (e.g. `./` or `guide/`). */
export function joinUrl(base: string, path: string): string {
  if (!path) return base || './'
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith('/')) return path
  if (path === './') return base || './'
  return (base || './') + path.replace(/^\.\//, '')
}

export function formatCopyright(template: string): string {
  const year = String(new Date().getFullYear())
  return template.replace(/\{year\}/gi, year)
}

export function log(message: string): void {
  console.log(pc.cyan('INFO') + ' - ' + message)
}

export function warn(message: string): void {
  console.warn(pc.yellow('WARNING') + ' - ' + message)
}

export function error(message: string): void {
  console.error(pc.red('ERROR') + ' - ' + message)
}

export function success(message: string): void {
  console.log(pc.green('SUCCESS') + ' - ' + message)
}
