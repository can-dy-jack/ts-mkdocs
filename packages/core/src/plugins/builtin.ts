import type { Plugin } from '../plugins.js'

export const searchPlugin: Plugin = {
  name: 'search',
}

export const offlinePlugin: Plugin = {
  name: 'offline',
  on_post_build(config) {
    void config
  },
}

export const privacyPlugin: Plugin = {
  name: 'privacy',
}

export const typesetPlugin: Plugin = {
  name: 'typeset',
}

export const groupPlugin: Plugin = {
  name: 'group',
}

export const infoPlugin: Plugin = {
  name: 'info',
}
