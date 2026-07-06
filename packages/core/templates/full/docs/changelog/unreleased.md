---
title: Unreleased
description: Development changes not yet released
tags:
  - Changelog
  - Unreleased
groups:
  - Reference
authors:
  - kartjim
---

# Unreleased

Development changes not yet released.

## Changed

- Renamed configuration file from `mkdocs.yml` to `ts-mkdocs.yml`
- Simplified extension names: `pymdownx.*` → `md.*` (e.g., `pymdownx.tabbed` → `md.tabs`)
- Reorganized documentation into Tutorial, Syntax, Reference, and Changelog sections

## Added

- `md.caret` — superscript (`^text^`) and insert (`^^text^^`)
- `md.tilde` — subscript (`~text~`) and delete (`~~text~~`)
- Markdown images with docs-relative path rewriting and optional `content.image.lightbox` (GLightbox gallery)
- Code blocks: diff syntax support and enhanced highlighting
- Table extensions: column width settings and cell merging
- MagicLink support for auto-linking repository references
- Comments system: Giscus and Utterances integration
- Abbreviations and Definition Lists extensions
- Page-level meta tags support
- Custom admonition types with icon preview
- Custom CSS and JavaScript support
- Mobile responsive design improvements
- Automatic reading of file creation and update times from Git
- Mermaid diagram support
- Robots plugin for generating robots.txt
- Sitemap plugin for generating sitemap.xml
- Emoji support with shortcodes
- Page sharing functionality with multi-platform support
- Open Graph meta data support
- System settings panel
- Image lightbox functionality
- Superscript and subscript syntax support
- Tags system with serve port error handling
- Article license declarations (default CC BY-NC-SA 4.0)
- Author profiles with avatars and social links
- Frontmatter support
- Math formula support with `\(...\)` and `\[...\]` syntax
- Code block title functionality
- Code block traffic light indicators with click events
- Code block wrap button
- Annotations functionality
- Admonitions style optimization
- TOC functionality improvements
- Version settings
- GitHub description files
- Tab syntax support
- Task list syntax support
- Example documentation split and expansion
- Footnote support
- Code block blank line overlap fix
- Overall style optimization and theme toggle adjustments
- Code block functionality adjustments
- Copyright dynamic year generation
- Icon generation
- Admonition design adjustments
- Code block copy button interaction
- Style optimizations
- Top menu area animations
- TOC functionality implementation
- Basic architecture refactoring
