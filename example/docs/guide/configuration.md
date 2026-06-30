---
title: Configuration
description: Full reference for mkdocs.yml configuration options
---

# Configuration

All configuration lives in `mkdocs.yml` at the root of your project.

## Minimal example

```yaml
site_name: My Docs
```

That is the only required field. Every other option has a sensible default.

## Full reference

```yaml
# ── Site metadata ────────────────────────────────────────────
site_name: My Documentation        # required
site_description: Optional tagline
site_url: https://example.com/
site_author: Your Name

# ── Repository link (shown in header) ───────────────────────
repo_url: https://github.com/you/repo
repo_name: you/repo

# ── Directories ─────────────────────────────────────────────
docs_dir: docs     # default — where your .md files live
site_dir: site     # default — generated HTML output

# ── Navigation ──────────────────────────────────────────────
# Omit entirely to infer from the file tree.
nav:
  - Home: index.md
  - Guide:
    - Installation: guide/installation.md
    - Configuration: guide/configuration.md
  - External link: https://example.com

# ── Theme ───────────────────────────────────────────────────
theme:
  name: material
  language: en          # ISO 639-1 code
  logo: assets/logo.svg
  favicon: assets/favicon.png
  palette:
    # Single colour scheme (no toggle button)
    - scheme: default
      primary: indigo
      accent: indigo
    # Two schemes — adds a light/dark toggle
    - scheme: default
      primary: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  font:
    text: Roboto
    code: Roboto Mono
  features:
    - navigation.tabs
    - navigation.sections
    - toc.follow
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.linenumbers
    - content.code.lang

# ── Plugins ─────────────────────────────────────────────────
plugins:
  - search           # built-in, enabled by default

# ── Markdown extensions ─────────────────────────────────────
markdown_extensions:
  - admonition:
      default_collapsed: false   # !!! blocks: false = expanded by default
  - pymdownx.details:
      default_collapsed: true    # ??? blocks: true = collapsed by default
  - pymdownx.tabbed
  - pymdownx.superfences
  - attr_list
  - tables

# See guide/admonitions.md for syntax, types, and +/- overrides.

# ── Extra assets ────────────────────────────────────────────
extra_css:
  - assets/custom.css

extra_javascript:
  - assets/custom.js

# ── Template variables ───────────────────────────────────────
extra:
  version: 1.0.0
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/you/repo

# ── Other ───────────────────────────────────────────────────
copyright: Copyright &copy; 2024 You
strict: false
use_directory_urls: true   # /guide/ instead of /guide.html
```

## Navigation modes

### Explicit nav

When `nav:` is present, the sidebar exactly follows that order. Pages not listed are still built but not shown in the sidebar.

### Inferred nav

When `nav:` is absent, ts-mkdocs walks the `docs_dir` alphabetically. Files starting with `_` are skipped. `index.md` / `README.md` inside a directory become the section's root page.

## Palette colours

Any of the standard Material colour names work for `primary` and `accent`:

`red` · `pink` · `purple` · `deep-purple` · `indigo` · `blue` · `light-blue`
`cyan` · `teal` · `green` · `light-green` · `lime` · `yellow` · `amber`
`orange` · `deep-orange` · `brown` · `grey` · `blue-grey` · `white` · `black`

## Code block features

Enable optional code block UI via `theme.features`:

| Feature | Description |
|---------|-------------|
| `content.code.copy` | Hover copy button on fenced code blocks |
| `content.code.linenumbers` | Gutter line numbers on fenced code blocks |
| `content.code.lang` | Language label badge on fenced code blocks |

```yaml
theme:
  features:
    - content.code.copy
    - content.code.linenumbers
    - content.code.lang
```

Syntax highlighting themes are configured separately under `theme.highlight.theme_light` / `theme_dark`.
