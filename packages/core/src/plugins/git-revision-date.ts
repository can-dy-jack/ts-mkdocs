import type { Plugin } from '../plugins.js'
import {
  applyRevisionDatesToPage,
  resolveRevisionDateConfig,
  type RevisionDateConfig,
} from '../revision-date.js'

let pluginConfig: RevisionDateConfig = resolveRevisionDateConfig()

export const gitRevisionDatePlugin: Plugin = {
  name: 'git-revision-date',
  configure(options) {
    pluginConfig = resolveRevisionDateConfig(options)
  },
  on_page_markdown(markdown, page, config) {
    applyRevisionDatesToPage(page, pluginConfig, config.theme.language)
    return markdown
  },
}
