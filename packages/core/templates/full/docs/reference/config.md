---
title: Configuration Reference
description: Complete reference for all ts-mkdocs configuration options
tags:
  - Configuration
  - Reference
groups:
  - Reference
authors:
  - kartjim
---

# Configuration Reference

All configuration lives in `ts-mkdocs.yml` at the root of your project. This page documents every available option.

## Top-Level Options

### Site Metadata

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `site_name` | string | **required** | Site title shown in header, meta tags, and search |
| `site_description` | string | — | Shown in meta tags and search results |
| `site_url` | string | — | Canonical URL for sitemap and Open Graph |
| `site_author` | string | — | Default author for meta tags |
| `site_image` | string | — | Default Open Graph image |
| `copyright` | string | — | Copyright notice in footer. `{year}` is replaced with current year |

### Repository

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `repo_url` | string | — | Repository URL shown in header |
| `repo_name` | string | auto | Display name for repo link (auto-detected from URL) |
| `repo_token` | string | env | GitHub API token for repo stats. Falls back to `TS_MKDOCS_GITHUB_TOKEN`, `GITHUB_TOKEN`, or `GH_TOKEN` env vars |
| `edit_uri` | string | — | Path appended to `repo_url` for edit links |

### Directories

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `docs_dir` | string | `docs` | Source directory for Markdown files |
| `site_dir` | string | `site` | Output directory for built site |

### URL Handling

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `use_directory_urls` | boolean | `true` | Output `path/index.html` instead of `path.html` |

### Build

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strict` | boolean | `false` | Exit with error on warnings |
| `dev_addr` | string | `127.0.0.1:8000` | Dev server address |
| `watch` | string[] | — | Extra paths to watch during `serve` |

### Navigation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `nav` | array | — | Explicit navigation structure. Omit to auto-infer from file tree |

### Extensions & Plugins

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `markdown_extensions` | array | `[]` | Markdown extensions to enable. See [Markdown Extensions](extensions.md) |
| `plugins` | array | `['search']` | Plugins to enable. See [Plugins](plugins.md) |

### Assets

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `extra_css` | array | `[]` | Custom CSS files to include |
| `extra_javascript` | array | `[]` | Custom JavaScript files to include |

### Theme

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | object | `{name: 'material'}` | Theme configuration. See [Theme Configuration](theme.md) |

### Extra Data

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `extra` | object | — | Custom data accessible in templates and frontmatter |

## Example Configuration

```yaml
site_name: My Documentation
site_description: A documentation site
site_url: https://example.com/
repo_url: https://github.com/you/repo
copyright: Copyright &copy; {year} My Team

docs_dir: docs
site_dir: site
use_directory_urls: true

nav:
  - Home: index.md
  - Guide:
    - Getting Started: guide/start.md
    - Configuration: guide/config.md

theme:
  name: material
  language: en
  palette:
    - scheme: default
      primary: blue
      accent: blue
  features:
    - navigation.tabs
    - search.suggest

markdown_extensions:
  - admonition
  - tables
  - toc:
      permalink: true

plugins:
  - search
  - tags

extra_css:
  - assets/custom.css

extra_javascript:
  - assets/custom.js

extra:
  version: 1.0.0
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/you/repo
```

## See Also

- [Theme Configuration](theme.md) — Detailed theme options
- [Markdown Extensions](extensions.md) — Extension configuration
- [Plugins](plugins.md) — Plugin configuration
- [Frontmatter](frontmatter.md) — Per-page metadata
