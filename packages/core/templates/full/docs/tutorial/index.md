---
title: What is ts-mkdocs?
description: Introduction to ts-mkdocs - a TypeScript static site generator for documentation
tags:
  - Introduction
  - Overview
groups:
  - Tutorial
authors:
  - kartjim
---

# What is ts-mkdocs?

**ts-mkdocs** is a TypeScript implementation of [MkDocs](https://www.mkdocs.org/) with a built-in [Material](https://squidfunk.github.io/mkdocs-material/) theme. It converts Markdown files into beautiful, static HTML documentation sites.

## Why ts-mkdocs?

If you love MkDocs but prefer a Node.js/TypeScript toolchain, ts-mkdocs is for you:

- **No Python required** — runs on Node.js 20+, installs via npm/pnpm
- **Full Material theme** — responsive layout, dark/light mode, sticky header, search
- **Familiar config** — `ts-mkdocs.yml` uses the same YAML structure as MkDocs
- **Fast builds** — TypeScript-native, optimized for speed
- **Extensible** — plugin system with lifecycle hooks

## Key Features

| Feature | Description |
|---------|-------------|
| Material theme | Responsive two-column layout, dark/light mode toggle, sticky header |
| Navigation | Explicit `nav:` config or auto-inferred from file tree |
| Table of contents | Per-page TOC extracted from headings, sticky sidebar |
| Syntax highlighting | Powered by Shiki, dual light/dark themes, copy button |
| Admonitions | `!!!` / `???` callout blocks with icons and collapse |
| Icons | Material / Font Awesome / Bootstrap icon shortcodes |
| Client-side search | Lunr.js index built at compile time |
| Live reload | File watcher + SSE push, browser auto-refreshes |
| Plugin system | Event hooks for build customization |
| Frontmatter | Per-page metadata via YAML frontmatter |

## How It Works

1. You write content in Markdown files
2. Configure the site in `ts-mkdocs.yml`
3. Run `ts-mkdocs build` to generate static HTML
4. Deploy the output to any static hosting

```
my-docs/
├── ts-mkdocs.yml    # site configuration
├── docs/            # source Markdown files
│   ├── index.md
│   └── guide/
│       └── setup.md
└── site/            # generated output
```

## Next Steps

- [Quick Start](quick-start.md) — Install and build your first site in 5 minutes
- [Features](features.md) — Detailed overview of all features
- [Basic Configuration](basic-config.md) — Essential config options to get started
