import type { Plugin } from '../plugins.js'

export const blogPlugin: Plugin = {
  name: 'blog',
  on_post_build(config) {
    // Blog archive placeholder — full blog requires post_dir scanning
    void config
  },
}
