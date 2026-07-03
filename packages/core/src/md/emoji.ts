import type MarkdownIt from 'markdown-it'
import { full as emojiFull, light as emojiLight } from 'markdown-it-emoji'

export interface EmojiOptions {
  /** pymdownx.emoji emoji_index — 'full' (default) or 'light' */
  emoji_index?: 'full' | 'light'
  defs?: Record<string, string>
  shortcuts?: Record<string, string | string[]>
  enabled?: string[]
}

export function emojiPlugin(md: MarkdownIt, opts: EmojiOptions = {}): void {
  const plugin = opts.emoji_index === 'light' ? emojiLight : emojiFull
  const { emoji_index: _index, ...pluginOpts } = opts
  md.use(plugin, pluginOpts)
}
