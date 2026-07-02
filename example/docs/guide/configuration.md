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
# Optional GitHub token, used server-side at build time to fetch
# stars/forks/latest release with a higher rate limit. Never shipped to
# the browser. Avoid committing it here — set the TS_MKDOCS_GITHUB_TOKEN,
# GITHUB_TOKEN, or GH_TOKEN env var instead and omit this field.
# repo_token: ghp_xxx

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
    # Colour schemes (light + dark). Theme mode is switched via header icons.
    - scheme: default
      primary: indigo
      accent: indigo
    - scheme: slate
      primary: indigo
      accent: indigo
  font:
    text: Roboto
    code: Roboto Mono
  icon:
    theme:
      light: material/wb_sunny      # sun — light mode
      dark: material/dark_mode      # moon — dark mode
      system: material/brightness_auto  # auto — follow OS
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

`theme.palette` controls the site chrome (header, footer, links, buttons). You can pass a single object or an array of two entries for light and dark mode.

| Field | Purpose |
|-------|---------|
| `scheme` | Which colour mode this entry applies to. `default` = light mode (`:root`), `slate` = dark mode (`[data-theme="dark"]`). |
| `primary` | Main brand colour — header background, footer background (via a darker shade), primary buttons, link colour. |
| `accent` | Secondary highlight colour — scroll-to-top button, some badges and gradients. Defaults to `primary` when omitted. |

```yaml
theme:
  palette:
  - scheme: default      # light mode
    primary: orange
    accent: orange
  - scheme: slate        # dark mode
    primary: indigo
    accent: indigo
```

Footer uses `--md-primary-fg-color--dark`, a shade derived automatically from `primary`, so changing `primary` updates the footer as well.

Any of the standard Material colour names work for `primary` and `accent` (hex values like `#e65100` are also supported):

`red` · `pink` · `purple` · `deep-purple` · `indigo` · `blue` · `light-blue`
`cyan` · `teal` · `green` · `light-green` · `lime` · `yellow` · `amber`
`orange` · `deep-orange` · `brown` · `grey` · `blue-grey` · `white` · `black`

## Theme mode toggle

The header shows a **single icon button** that cycles **light → dark → follow system**. Only the icon for the current mode is visible. Icons are configurable under `theme.icon.theme`:

```yaml
theme:
  icon:
    theme:
      light: material/wb_sunny
      dark: material/dark_mode
      system: material/brightness_auto
```

## Footer

The site footer shows copyright text, social links, and optional previous/next page navigation.

### Copyright

Set `copyright` in `mkdocs.yml`. Use `{year}` as a placeholder for the current year:

```yaml
copyright: Copyright &copy; {year} Your Name
```

### Social links

Add icons under `extra.social` (see the example `mkdocs.yml` in this repo).

### Previous / next navigation

Enable footer page links with `navigation.footer`:

```yaml
theme:
  features:
    - navigation.footer
```

Hide them on a specific page via front matter:

```yaml
---
hide:
  - footer
---
```

---

## Footnotes

Markdown footnotes let you add supplemental information without interrupting the main text. Enable the extension in `mkdocs.yml`:

```yaml
markdown_extensions:
  - footnotes
```

Reference a footnote inline with `[^identifier]` and define it anywhere in the document:

```markdown
Here is a footnote[^1].

[^1]: This is the first footnote.
```

Multi-paragraph footnotes use four-space indentation:

```markdown
[^note]:
    First paragraph.

    Second paragraph.
```

Footnotes are rendered at the bottom of the page with backlinks to the reference.

## Code block features

Enable optional code block UI via `theme.features`:

| Feature | Description |
|---------|-------------|
| `content.code.copy` | Hover copy button on fenced code blocks |
| `content.code.wrap` | Toggle line wrap on fenced code blocks |
| `content.code.linenumbers` | Gutter line numbers on fenced code blocks |
| `content.code.lang` | Language label badge on fenced code blocks |

Fenced code blocks also support an optional `title="..."` attribute on the fence info line (or via `attr_list`) to show a centered title in the code block head.

```yaml
theme:
  features:
    - content.code.copy
    - content.code.wrap
    - content.code.linenumbers
    - content.code.lang
```

````markdown
```typescript title="src/build.ts"
export function build(): void {}
```
````

Syntax highlighting themes are configured separately under `theme.highlight.theme_light` / `theme_dark`.
