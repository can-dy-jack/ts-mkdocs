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
