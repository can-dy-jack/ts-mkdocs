declare module 'markdown-it-emoji' {
  import type MarkdownIt from 'markdown-it'

  export const full: MarkdownIt.PluginWithOptions<Record<string, unknown>>
  export const light: MarkdownIt.PluginWithOptions<Record<string, unknown>>
  export const bare: MarkdownIt.PluginWithOptions<Record<string, unknown>>
}
