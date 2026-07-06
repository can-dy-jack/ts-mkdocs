---
title: Features
description: Comprehensive overview of ts-mkdocs features
tags:
  - Features
  - Overview
groups:
  - Tutorial
authors:
  - kartjim
---

# Features

ts-mkdocs provides a rich set of features for building documentation sites. This page gives you a high-level overview of what's available.

## Material Theme

The built-in Material theme provides a professional, responsive design:

- **Dark/light mode** — Automatic detection or manual toggle
- **Responsive layout** — Works on desktop, tablet, and mobile
- **Sticky header** — Navigation stays visible while scrolling
- **Customizable colors** — Primary and accent colors via palette config
- **Font options** — Choose from system fonts or Google Fonts
- **Settings panel** — Reader can adjust colors, fonts, and font size

## Navigation

Flexible navigation options to organize your content:

- **Explicit nav** — Define structure in `ts-mkdocs.yml`
- **Auto-inferred** — Build nav from file tree automatically
- **Tabs** — Top-level sections as tabs
- **Sections** — Group pages within sections
- **Footer navigation** — Previous/next page links
- **Back-to-top** — Floating button for long pages

## Content Features

Rich Markdown extensions for expressive documentation:

### Basic Syntax

- Headings, paragraphs, links, images
- Bold, italic, strikethrough
- Blockquotes, lists (ordered, unordered)
- Tables with column alignment

### Extended Syntax

- **Code blocks** — Syntax highlighting via Shiki, line numbers, copy button, language labels
- **Task lists** — GitHub-style checkboxes `- [ ]` / `- [x]`
- **Footnotes** — Reference notes with `[^1]` syntax
- **Abbreviations** — Tooltips for terms with `*[ABBR]:` definitions
- **Definition lists** — Term/definition pairs
- **Icons** — Shortcodes like `:material-home:` for 10,000+ icons
- **Keyboard keys** — `++Ctrl+C++` syntax for key combinations
- **Highlight** — `==marked text==` for emphasis
- **Superscript/subscript** — `^sup^` and `~sub~` syntax
- **Insert/delete** — `^^inserted^^` and `~~deleted~~` for tracked changes
- **MagicLink** — Auto-link issues, PRs, commits, and URLs
- **Images** — Relative paths, lightbox zoom

### Advanced Components

- **Admonitions** — Callout blocks (note, tip, warning, etc.) with icons and collapse
- **Content tabs** — Switch between alternatives (languages, platforms)
- **Annotations** — Code and text annotations
- **Math** — LaTeX equations via KaTeX or MathJax
- **Mermaid** — Diagrams from code fences (flowcharts, sequences, Gantt)
- **Comments** — Giscus or Utterances integration

## Search

Client-side search powered by Lunr.js:

- Index built at compile time
- Instant in-browser search
- Search suggestions and highlighting
- No external service required

## SEO & Metadata

Built-in SEO features:

- **Open Graph** — Social media preview cards
- **Sitemap** — Auto-generated `sitemap.xml`
- **Robots.txt** — Configurable crawler rules
- **Meta tags** — Per-page HTML meta tags
- **Canonical URLs** — Proper URL canonicalization

## Developer Features

Tools for documentation authors:

- **Frontmatter** — Per-page metadata (title, description, tags, authors, dates)
- **Reading time** — Automatic calculation
- **Revision dates** — Git-based creation/update dates
- **Article license** — CC license declarations
- **Tags** — Categorize and filter pages
- **Authors** — Author profiles with avatars and social links

## Plugin System

Extend ts-mkdocs with plugins:

- **Built-in plugins** — search, tags, social, meta, sitemap, robots, git-revision-date
- **Event hooks** — on_config, on_files, on_nav, on_page_markdown, on_page_content, on_post_build
- **External plugins** — npm packages with `ts-mkdocs-plugin-` prefix

## Next Steps

- [Quick Start](quick-start.md) — Get up and running in 5 minutes
- [Basic Configuration](basic-config.md) — Essential config options
- [Syntax Reference](../syntax/index.md) — Detailed syntax documentation
