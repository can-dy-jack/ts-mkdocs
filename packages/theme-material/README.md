# ts-mkdocs-theme-material

Material Design theme for [ts-mkdocs](https://www.npmjs.com/package/ts-mkdocs). A TypeScript port of the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme.

## Installation

This theme is included by default with `ts-mkdocs`. You don't need to install it separately.

To use it in a custom setup:

```bash
npm install ts-mkdocs-theme-material
```

## What's Included

```
ts-mkdocs-theme-material/
├── templates/    # Nunjucks templates (base, page, nav, search, etc.)
├── assets/       # CSS & JS (material.css, material.js, search index, etc.)
└── brand/        # Default logo.svg and favicon.svg
```

## Exports

```js
import { templatesDir, assetsDir, brandDir } from 'ts-mkdocs-theme-material'
```

| Export | Description |
|--------|-------------|
| `templatesDir` | Path to the Nunjucks template directory |
| `assetsDir` | Path to the static assets directory (CSS, JS) |
| `brandDir` | Path to the brand assets directory (logo, favicon) |

## Features

- **Dark / Light mode** — Automatic switching with system preference detection
- **Navigation** — Tabs, sections, back-to-top, footer navigation
- **Search** — Full-text search with suggestions and highlighting
- **Code blocks** — Syntax highlighting (Shiki), copy button, line numbers, annotations
- **Content components** — Admonitions, content tabs, task lists, annotations, math, Mermaid
- **Responsive** — Mobile-friendly layout with collapsible sidebar
- **Customizable** — Palette colors, fonts, icons, and feature toggles via config

## Configuration

Use this theme in your `ts-mkdocs.yml`:

```yaml
theme:
  name: material
  language: en
  logo: assets/logo.svg
  favicon: assets/favicon.svg
  palette:
    - scheme: default
      primary: blue
      accent: blue
    - scheme: slate
      primary: indigo
      accent: indigo
  font:
    text: Inter
    code: JetBrains Mono
  features:
    - navigation.tabs
    - navigation.sections
    - toc.follow
    - search.suggest
    - search.highlight
    - content.code.copy
```

See the [theme reference](https://ts-mkdocs.example.com/reference/theme/) for all configuration options.

## License

MIT
