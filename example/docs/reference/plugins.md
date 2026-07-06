---
title: Plugin API
description: How to write a custom ts-mkdocs plugin
tags:
  - Plugins
  - API
  - Reference
  - TypeScript
groups:
  - Reference
authors:
  - kartjim
---

# Plugin API

Plugins are plain objects (or classes) that implement any subset of the lifecycle hooks.

## Interface

```typescript
import type { Plugin } from 'ts-mkdocs'

const myPlugin: Plugin = {
  name: 'my-plugin',

  // Called after ts-mkdocs.yml is loaded and validated.
  on_config(config) {
    config.extra ??= {}
    config.extra.build_time = new Date().toISOString()
    return config           // return the modified config
  },

  // Called after files are collected.
  // Return a filtered/augmented list.
  on_files(files, config) {
    return files.filter(f => !f.srcUri.startsWith('drafts/'))
  },

  // Called after the navigation tree is built.
  on_nav(nav, config) {
    return nav
  },

  // Called with the raw Markdown string for each page,
  // before rendering to HTML.
  on_page_markdown(markdown, page, config) {
    return markdown.replace(/\bTODO\b/g, '**TODO**')
  },

  // Called with the rendered HTML for each page.
  on_page_content(html, page, config) {
    return html
  },

  // Called once after all pages are written.
  on_post_build(config) {
    console.log('Built to:', config.site_dir)
  },
}
```

## Hook reference

| Hook | Arguments | Return | Purpose |
|------|-----------|--------|---------|
| `on_config` | `config` | `Config \| void` | Mutate or replace the config |
| `on_files` | `files, config` | `DocFile[] \| void` | Filter or add files |
| `on_nav` | `nav, config` | `Navigation \| void` | Reorder or prune navigation |
| `on_page_markdown` | `markdown, page, config` | `string \| void` | Transform raw Markdown |
| `on_page_content` | `html, page, config` | `string \| void` | Transform rendered HTML |
| `on_post_build` | `config` | `void` | Side-effects after build |

When a hook returns `void` (or `undefined`), the previous value is kept unchanged.

## Registering a plugin programmatically

```typescript
import { PluginManager } from 'ts-mkdocs'

const manager = new PluginManager()
manager.register(myPlugin)
```

Built-in plugins (`search`) are wired up automatically based on the `plugins:` list in `ts-mkdocs.yml`.
