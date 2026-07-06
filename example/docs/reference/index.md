---
title: Configuration Reference
description: Complete reference for ts-mkdocs configuration options
tags:
  - Configuration
  - Reference
groups:
  - Reference
authors:
  - kartjim
---

# Configuration Reference

All configuration lives in `ts-mkdocs.yml` at the root of your project. This section covers every available option.

## Configuration Sections

| Section | Description |
|---------|-------------|
| [Complete Config Reference](config.md) | All top-level configuration options |
| [Theme Configuration](theme.md) | Material theme options (palette, fonts, features, settings) |
| [Markdown Extensions](extensions.md) | Extension configuration and options |
| [Plugins](plugins.md) | Built-in and external plugin configuration |
| [CLI Reference](cli.md) | Command-line interface |
| [Plugin API](plugin-api.md) | Writing custom plugins |
| [Frontmatter](frontmatter.md) | Per-page metadata options |

## Minimal Example

```yaml
site_name: My Documentation
```

## Full Example

```yaml
site_name: My Documentation
site_description: Built with ts-mkdocs
site_url: https://example.com/
repo_url: https://github.com/you/repo
copyright: Copyright &copy; 2024 My Team

docs_dir: docs
site_dir: site

nav:
  - Home: index.md
  - Guide:
    - Getting Started: guide/start.md

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
  features:
    - navigation.tabs
    - navigation.footer
    - search.suggest
    - content.code.copy

markdown_extensions:
  - admonition
  - md.details
  - md.tabs
  - md.fences
  - tables
  - footnotes
  - toc:
      permalink: true

plugins:
  - search
  - tags
  - sitemap:
      hostname: https://example.com

extra_css:
  - assets/custom.css

extra_javascript:
  - assets/custom.js
```

## Configuration Tips

!!! tip "Environment Variables"
    Use environment variables for sensitive values like tokens:
    ```yaml
    # Set GITHUB_TOKEN or GH_TOKEN environment variable
    # ts-mkdocs will use it automatically for repo_token
    ```

!!! tip "Validation"
    ts-mkdocs validates your configuration at build time. If there's an error, it will show exactly which field is invalid.

!!! tip "Defaults"
    Most options have sensible defaults. You only need to specify values you want to override.
