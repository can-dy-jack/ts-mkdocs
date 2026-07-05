---
title: Changelog
description: ts-mkdocs version history
tags:
  - Changelog
  - Release
authors:
  - kartjim
---

# Changelog

## Unreleased

### Added

- `pymdownx.caret` — superscript (`^text^`) and insert (`^^text^^`)
- `pymdownx.tilde` — subscript (`~text~`) and delete (`~~text~~`)
- Markdown images with docs-relative path rewriting and optional `content.image.lightbox` (GLightbox gallery)

## 0.1.0 — 2024-06-25

Initial release.

### Added

- `ts-mkdocs new` — project scaffolding
- `ts-mkdocs build` — static site generation
- `ts-mkdocs serve` — dev server with live reload
- Material theme with dark/light mode toggle
- Sidebar navigation (explicit `nav:` and auto-inferred)
- Per-page table of contents
- Syntax highlighting via Shiki
- Copy button on code blocks
- Admonition blocks (`!!! note/tip/warning/…`)
- Client-side search via Lunr.js (index pre-built at compile time)
- Frontmatter support (`title`, `description`, `tags`, `search`)
- Plugin event system (`on_config`, `on_files`, `on_nav`, `on_page_markdown`, `on_page_content`, `on_post_build`)
- Prev / next page footer links
