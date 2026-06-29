import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import type MarkdownIt from 'markdown-it'

interface SnippetsOptions {
  docsDir: string
  base_path?: string
}

export function snippetsPlugin(md: MarkdownIt, options: SnippetsOptions): void {
  const basePath = options.base_path ?? options.docsDir

  md.core.ruler.before('block', 'snippets', (state) => {
    state.src = state.src.replace(/--8<--\s+"([^"]+)"/g, (_, file: string) => {
      const absPath = resolve(basePath, file)
      if (!existsSync(absPath)) return `<!-- snippet not found: ${file} -->`
      return readFileSync(absPath, 'utf-8')
    })
  })
}
