# ts-mkdocs

<!--pnpm example:build   # 构建示例站点
pnpm example:serve   # 启动 dev server，改动文件自动刷新-->

A TypeScript implementation of [MkDocs](https://github.com/mkdocs/mkdocs) with a built-in [Material](https://squidfunk.github.io/mkdocs-material/) theme. Takes a directory of Markdown files and a `ts-mkdocs.yml` config, outputs a complete static HTML site.

## Features

- **Material theme** — responsive two-column layout, dark/light mode toggle, sticky header
- **Navigation** — explicit `nav:` config or auto-inferred from the file tree, prev/next page links
- **Table of contents** — per-page TOC extracted from headings, sticky sidebar on desktop
- **Syntax highlighting** — powered by [Shiki](https://shiki.style/), dual light/dark themes, copy button on every code block
- **Admonitions** — `!!!` / `???` callout blocks with top border, tinted headers, icons, and collapse toggles ([syntax guide](example/docs/guide/admonitions.md))
- **Icons** — Material / Font Awesome / Bootstrap icon shortcodes in Markdown and admonitions
- **Client-side search** — [Lunr.js](https://lunrjs.com/) index built at compile time, instant in-browser search
- **Live reload dev server** — file watcher + SSE push, browser auto-refreshes on change
- **Plugin system** — event hooks (`on_config`, `on_files`, `on_nav`, `on_page_markdown`, `on_page_content`, `on_post_build`)
- **Frontmatter** — per-page `title`, `description`, `tags`, search boost/exclude via YAML frontmatter

## Installation

```bash
npm install -g ts-mkdocs
# or
pnpm add -g ts-mkdocs
```

## Quick start

```bash
# Create a new project
ts-mkdocs new my-docs
cd my-docs

# Start the dev server (auto-reloads on change)
ts-mkdocs serve

# Build the static site
ts-mkdocs build
```

The dev server listens at `http://127.0.0.1:8000` by default.

## Project layout

```
my-docs/
├── ts-mkdocs.yml       # site configuration
├── docs/            # source Markdown files
│   ├── index.md
│   └── guide/
│       └── setup.md
└── site/            # generated output (gitignore this)
```

## Configuration (`ts-mkdocs.yml`)

```yaml
site_name: My Documentation
site_description: Optional description shown in meta tags
site_url: https://example.com/
repo_url: https://github.com/you/repo
# repo_token: ghp_xxx   # optional — or set GITHUB_TOKEN/GH_TOKEN env var.
                        # Used server-side to fetch stars/forks/latest
                        # release with a higher GitHub API rate limit.
copyright: Copyright &copy; 2024 You

docs_dir: docs       # default
site_dir: site       # default

# Explicit navigation (optional — inferred from filesystem if omitted)
nav:
  - Home: index.md
  - Getting Started: guide/setup.md
  - Reference:
    - API: reference/api.md
    - Config: reference/config.md
  - External: https://example.com

theme:
  name: material
  language: en
  logo: assets/logo.svg    # relative to docs_dir
  favicon: assets/favicon.png
  palette:
    # Single palette (no toggle)
    - scheme: default
      primary: indigo
      accent: indigo
    # Or two palettes with a light/dark toggle:
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
  # Icon libraries (CDN). Default library used for shorthand :icon-name: syntax.
  icons:
    default: material
    libraries:
      - material
      - fontawesome
      - bootstrap
  # Per-type admonition icon overrides (library/icon-path notation)
  icon:
    admonition:
      note: material/info
      warning: material/warning

plugins:
  - search            # built-in, enabled by default

extra_css:
  - assets/custom.css

extra_javascript:
  - assets/custom.js

extra:
  version: 1.0.0
```

### Theme palette colours

Standard Material colour names accepted for `primary` / `accent`:

`red` `pink` `purple` `deep-purple` `indigo` `blue` `light-blue` `cyan` `teal`
`green` `light-green` `lime` `yellow` `amber` `orange` `deep-orange` `brown`
`grey` `blue-grey` `white` `black`

## Writing pages

### Frontmatter

Add a YAML block at the top of any Markdown file:

```markdown
---
title: Custom Page Title
description: Used in the HTML meta description tag
tags:
  - guide
  - setup
search:
  boost: 2        # boost this page in search results
  exclude: false  # set true to hide from search
---

# Page heading
```

### Admonitions

Callout blocks with a colored top border, tinted title bar, icon, and expand/collapse toggle. Full syntax: [Admonitions guide](example/docs/guide/admonitions.md).

```markdown
!!! note
    Expanded by default.

!!!- warning "Starts collapsed"
    Use `-` after `!!!` to force closed; `+` forces open.

??? note "Details block"
    Collapsed by default when `md.details` is enabled.
```

Configure default open/closed state in `ts-mkdocs.yml`:

```yaml
markdown_extensions:
  - admonition:
      default_collapsed: false
  - md.details:
      default_collapsed: true
```

Supported types: `note` `abstract` `info` `tip` `success` `question` `warning` `failure` `danger` `bug` `example` `quote`

Each admonition type shows a default icon in its title bar. Override icons in `theme.icon.admonition` (see Configuration above).

### Icons

ts-mkdocs supports **Material Symbols**, **Font Awesome 6**, and **Bootstrap Icons** via `:shortcode:` syntax — compatible with Material for MkDocs naming conventions.

#### Configuration

```yaml
theme:
  icons:
    default: material          # used when no library prefix is given
    libraries:                 # CDN stylesheets loaded into every page
      - material
      - fontawesome
      - bootstrap
      # - octicons             # optional: GitHub Octicons
  icon:
    admonition:                # override default admonition title icons
      note: material/info
      tip: material/lightbulb
      warning: material/warning
```

| Library | Shortcode example | Config path example |
|---------|-------------------|---------------------|
| Material (default) | `:material-home:` or `:home:` | `material/home` |
| Font Awesome Solid | `:fontawesome-solid-heart:` | `fontawesome/solid/heart` |
| Font Awesome Brands | `:fontawesome-brands-github:` | `fontawesome/brands/github` |
| Bootstrap Icons | `:bootstrap-heart:` | `bootstrap/heart` |
| Octicons | `:octicons-mark-github:` | `octicons/mark-github` |

#### In Markdown

```markdown
Visit :material-home: home or :fontawesome-brands-github: GitHub.

# :material-settings: Settings

!!! tip ":material-lightbulb: Remember"
    Icon shortcodes also work in admonition titles.
```

**Naming rules:**

- Use **hyphens** in shortcodes: `:material-check-circle:` → Material icon `check_circle`
- Full **slash notation** in config: `fontawesome/brands/github`
- With `default: material`, shorthand `:home:` equals `:material-home:`

### Code blocks

Fenced code blocks with language tags get syntax highlighting:

````markdown
```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```
````

A copy button appears on hover.

### Linking between pages

Use relative Markdown paths:

```markdown
See the [setup guide](guide/setup.md) for details.
```

## CLI reference

### `ts-mkdocs new <directory>`

Scaffold a new project with a starter `ts-mkdocs.yml` and `docs/index.md`.

### `ts-mkdocs build`

Build the static site into `site_dir`.

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --config-file <path>` | `ts-mkdocs.yml` | Path to config file |
| `-d, --site-dir <path>` | from config | Override output directory |
| `--strict` | `false` | Exit with error on warnings |

### `ts-mkdocs serve`

Start the development server with live reload.

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --config-file <path>` | `ts-mkdocs.yml` | Path to config file |
| `-a, --dev-addr <host:port>` | `127.0.0.1:8000` | Server address |
| `--open` | `false` | Open browser on start |

## Plugin development

Plugins implement any subset of the event hooks:

```typescript
import type { Plugin } from 'ts-mkdocs'

const myPlugin: Plugin = {
  name: 'my-plugin',

  on_config(config) {
    // modify and return config, or return nothing
  },

  on_page_markdown(markdown, page, config) {
    // transform raw markdown before rendering
    return markdown.replace(/\bTODO\b/g, '**TODO**')
  },

  on_page_content(html, page, config) {
    // transform rendered HTML
    return html
  },

  on_post_build(config) {
    console.log('Build done, site at:', config.site_dir)
  },
}
```

Register plugins programmatically via the `PluginManager`, or configure built-in ones in `ts-mkdocs.yml`.

## Development (contributing)

```bash
git clone https://github.com/can-dy-jack/ts-mkdocs
cd ts-mkdocs
pnpm install
pnpm build        # compile TypeScript
```

To test with the example site:

```bash
cd packages/core
node dist/cli.js new /tmp/test-docs
node dist/cli.js serve -f /tmp/test-docs/ts-mkdocs.yml
```

### Monorepo structure

```
packages/
├── core/            TypeScript build engine + CLI
│   └── src/
│       ├── cli.ts       CLI commands (new / build / serve)
│       ├── config.ts    ts-mkdocs.yml loader + Zod schema
│       ├── files.ts     Markdown file discovery
│       ├── nav.ts       Navigation tree builder
│       ├── markdown.ts  markdown-it renderer + admonitions
│       ├── page.ts      Page class (frontmatter, TOC)
│       ├── build.ts     Main build orchestrator
│       ├── serve.ts     Dev server + hot reload
│       ├── search.ts    Lunr index generation
│       └── plugins.ts   Plugin event bus
└── theme-material/  Material theme
    ├── templates/   Nunjucks templates (base, main, partials)
    └── assets/      CSS + JS
```

## Publishing to npm

### Prerequisites

1. **npm account** — register at [npmjs.com](https://www.npmjs.com)
2. **Login** in your terminal:
   ```bash
   npm login
   ```
3. **2FA** — npm requires two-factor authentication to publish. Enable it:
   ```bash
   npm profile enable-2fa auth-and-writes
   ```

### Release workflow

This is a pnpm monorepo with two packages (`ts-mkdocs` and `ts-mkdocs-theme-material`). `pnpm publish` automatically replaces `workspace:*` with the actual version and publishes in dependency order.

**1. Bump version** (choose one):

```bash
pnpm release:version patch   # 0.1.0 → 0.1.1
pnpm release:version minor   # 0.1.0 → 0.2.0
pnpm release:version major   # 0.1.0 → 1.0.0
```

**2. Preview what will be published** (dry-run):

```bash
pnpm release:dry-run
```

**3. Publish:**

```bash
pnpm release
```

This runs `build → test → publish` in sequence. Both packages are published to the public npm registry.

### Available scripts

| Script | Description |
|--------|-------------|
| `pnpm release:dry-run` | Build + preview publish (no actual upload) |
| `pnpm release` | Build + test + publish to npm |
| `pnpm release:version <bump>` | Bump version across all packages |

## License

MIT
