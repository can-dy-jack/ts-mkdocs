---
title: Basic Configuration
description: Essential configuration options to get started with ts-mkdocs
tags:
  - Configuration
  - Setup
  - Guide
groups:
  - Tutorial
authors:
  - kartjim
---

# Basic Configuration

This page covers the essential configuration options to get your site up and running. For a complete reference, see [Configuration Reference](../reference/config.md).

## Minimal Configuration

The only required field is `site_name`:

```yaml
site_name: My Documentation
```

That's it! Every other option has a sensible default.

## Site Information

Add basic site metadata:

```yaml
site_name: My Documentation
site_description: A documentation site built with ts-mkdocs
site_url: https://example.com/
repo_url: https://github.com/you/repo
```

| Field | Description |
|-------|-------------|
| `site_name` | **Required.** Site title shown in header and meta tags |
| `site_description` | Shown in meta tags and search results |
| `site_url` | Canonical URL for sitemap and Open Graph |
| `repo_url` | Repository link shown in header |
| `repo_name` | Display name for repo link (auto-detected from URL) |

## Theme Configuration

Customize the Material theme:

```yaml
theme:
  name: material
  language: en
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
```

### Color Schemes

- `default` — Light theme
- `slate` — Dark theme

### Primary Colors

Available colors: `red`, `pink`, `purple`, `deep-purple`, `indigo`, `blue`, `light-blue`, `cyan`, `teal`, `green`, `light-green`, `lime`, `yellow`, `amber`, `orange`, `deep-orange`, `brown`, `grey`, `blue-grey`

Or use a hex value: `primary: "#4f46e5"`

### Dark/Light Toggle

Use an array of palette entries to enable the toggle:

```yaml
palette:
  - scheme: default
    primary: blue
    toggle:
      icon: material/brightness-7
      name: Switch to dark mode
  - scheme: slate
    primary: indigo
    toggle:
      icon: material/brightness-4
      name: Switch to light mode
```

## Navigation

Define the site structure:

```yaml
nav:
  - Home: index.md
  - Getting Started:
    - Installation: guide/installation.md
    - Configuration: guide/configuration.md
  - Reference:
    - CLI: reference/cli.md
    - API: reference/api.md
```

If `nav` is omitted, the navigation is auto-inferred from the file tree.

## Features

Enable theme features:

```yaml
theme:
  features:
    - navigation.tabs          # top-level sections as tabs
    - navigation.tabs.sticky   # tabs stay visible on scroll
    - navigation.footer        # prev/next links
    - navigation.top           # back-to-top button
    - toc.follow               # TOC follows scroll
    - search.suggest           # search suggestions
    - search.highlight         # highlight search terms
    - content.code.copy        # copy button on code blocks
```

## Markdown Extensions

Enable Markdown extensions:

```yaml
markdown_extensions:
  - admonition           # !!! callout blocks
  - md.details           # ??? collapsible blocks
  - md.tabs              # === content tabs
  - md.fences            # enhanced code blocks
  - md.tasklist           # - [ ] checkboxes
  - md.keys              # ++key++ syntax
  - md.mark              # ==highlight==
  - tables               # table support
  - footnotes            # [^1] footnotes
  - toc:                 # table of contents
      permalink: true
```

## Plugins

Enable plugins:

```yaml
plugins:
  - search               # client-side search (default)
  - tags                 # tag system
  - sitemap:             # sitemap.xml generation
      hostname: https://example.com
  - robots               # robots.txt generation
```

## Extra Assets

Add custom CSS and JavaScript:

```yaml
extra_css:
  - assets/custom.css

extra_javascript:
  - assets/custom.js
```

## Complete Example

Here's a complete starter configuration:

```yaml
site_name: My Documentation
site_description: Built with ts-mkdocs
site_url: https://example.com/
repo_url: https://github.com/you/repo

nav:
  - Home: index.md
  - Guide:
    - Getting Started: guide/getting-started.md
    - Configuration: guide/configuration.md

theme:
  name: material
  language: en
  palette:
    - scheme: default
      primary: blue
      accent: blue
    - scheme: slate
      primary: indigo
      accent: indigo
  features:
    - navigation.tabs
    - navigation.footer
    - search.suggest
    - content.code.copy

markdown_extensions:
  - admonition
  - md.details
  - tables
  - footnotes
  - toc:
      permalink: true

plugins:
  - search
```

## Next Steps

- [Configuration Reference](../reference/config.md) — All configuration options
- [Theme Configuration](../reference/theme.md) — Detailed theme options
- [Markdown Extensions](../reference/extensions.md) — Extension configuration
