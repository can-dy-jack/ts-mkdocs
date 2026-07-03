---
title: Configuration
description: Full reference for mkdocs.yml configuration options
tags:
  - Configuration
  - Setup
  - Guide
groups:
  - Guide
date: 2026-07-01
updated: 2026-07-02
authors:
  - kartjim
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
  settings:          # reader panel: accent colour, font, font size (see below)
    enabled: true
    colors:
      - name: Blue
        color: "#2196f3"
    fonts:
      - name: System
    font_sizes:
      - name: Default
        value: 115
    default_font_size: 115
  share:             # page-level share buttons (see below)
    enabled: true
    platforms:
      - x
      - weibo
      - wechat
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
  - sitemap:
      hostname: https://example.com  # required for sitemap generation
  - robots               # generates robots.txt for search engine crawlers

# ── Markdown extensions ─────────────────────────────────────
markdown_extensions:
  - admonition:
      default_collapsed: false   # !!! blocks: false = expanded by default
  - pymdownx.details:
      default_collapsed: true    # ??? blocks: true = collapsed by default
  - pymdownx.tabbed
  - pymdownx.superfences
  - pymdownx.emoji
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

## Reader settings

The header can show a **settings** button (gear icon) that opens a panel where visitors customise theme accent colour, body font, and font size. Choices are saved in `localStorage` and applied on the next visit.

Set `theme.settings.enabled` to `false` to hide the panel and ignore any saved reader preferences. Configure the available options under `theme.settings`. Omit the whole block to use built-in defaults (enabled, eight preset colours, four fonts, four font sizes). Labels follow `theme.language` when you rely on defaults.

The initial accent colour is derived automatically from the light-mode `theme.palette` `primary` value (not set directly in `settings`).

```yaml
theme:
  palette:
    - scheme: default
      primary: blue
      accent: blue
  settings:
    enabled: true
    colors:
      - name: Blue
        color: "#2196f3"
      - name: Teal
        color: "#009688"
      - name: Green
        color: "#4caf50"
      - name: Purple
        color: "#9c27b0"
    fonts:
      - name: System
      - name: Serif
        family: '"Noto Serif", Georgia, serif'
        url: https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&display=swap
      - name: Mono
        family: '"JetBrains Mono", "Fira Code", monospace'
    font_sizes:
      - name: Small
        value: 90
      - name: Default
        value: 115
      - name: Large
        value: 135
      - name: Extra large
        value: 160
    default_font_size: 115
```

| Field | Description |
|-------|-------------|
| `enabled` | Show the settings panel and apply saved reader preferences. Default `true`. |
| `colors` | Swatches in the panel. Each entry needs `name` (tooltip) and `color` (hex). |
| `fonts` | Font choices. `name` is the button label. Optional `family` sets the CSS `font-family`; optional `url` loads a web font stylesheet when selected. The first entry is the default. |
| `font_sizes` | Size presets. Each entry needs `name` and `value` (root `font-size` percentage, 50–300). |
| `default_font_size` | Which `font_sizes` entry is active on first visit. Defaults to `115` when present in the list. |

## Page share buttons

Each article can show social share icons at the bottom (after tags and license). Icons use Font Awesome (and brand SVGs for platforms not in the icon library), colored with each platform's brand color. Each icon shows a tooltip like "Share to Weibo".

Configure under `theme.share`:

```yaml
theme:
  share:
    enabled: true
    platforms:
      - x
      - facebook
      - weibo
      - linkedin
      - wechat
      - bilibili
      - zhihu
      - reddit
      - telegram
      - whatsapp
      - email
      - mastodon
      - pinterest
      - threads
      - bluesky
```

| Field | Description |
|-------|-------------|
| `enabled` | Show share buttons on article pages. Default `true`. |
| `platforms` | Ordered list of platforms to display. Omit to use the built-in default (`x`, `facebook`, `weibo`). |

Supported platform IDs:

| Platform | Behaviour |
|----------|-----------|
| `x` | Opens X (Twitter) compose dialog |
| `facebook` | Opens Facebook share dialog |
| `weibo` | Opens Weibo share dialog |
| `linkedin` | Opens LinkedIn share dialog |
| `reddit` | Opens Reddit submit dialog |
| `telegram` | Opens Telegram share dialog |
| `whatsapp` | Opens WhatsApp share dialog |
| `email` | Opens default mail client |
| `mastodon` | Opens Mastodon share (mastodon.social) |
| `pinterest` | Opens Pinterest pin creator |
| `threads` | Opens Threads compose dialog |
| `bluesky` | Opens Bluesky compose dialog |
| `wechat` | Shows a QR code popover (scan to share) |
| `bilibili` | Copies the page link to clipboard |
| `zhihu` | Copies the page link to clipboard |

Set `enabled: false` or pass an empty `platforms` list to hide share buttons entirely.

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

## Math

Enable LaTeX math with the `pymdownx.arithmatex` extension. ts-mkdocs loads the renderer (KaTeX or MathJax) from a CDN — you do not need to add scripts under `extra_javascript`.

### Basic setup

```yaml
markdown_extensions:
  - pymdownx.arithmatex:
      provider: katex    # default — fast, self-contained
      # provider: mathjax  # alternative renderer
```

### KaTeX with CDN base URL

This is the configuration used by the example site:

```yaml
markdown_extensions:
  - pymdownx.arithmatex:
      provider: katex
      version: "0.16.22"
      cdn:
        base: https://cdn.jsdelivr.net/npm/katex@0.16.22/dist
```

`cdn.base` expands to `{base}/katex.min.css`, `{base}/katex.min.js`, and `{base}/contrib/auto-render.min.js`.

### MathJax

```yaml
markdown_extensions:
  - pymdownx.arithmatex:
      provider: mathjax
      version: "3.2.2"
      cdn:
        javascript: https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js
```

### Custom CDN mirrors

Override individual asset URLs when self-hosting or using a private CDN:

```yaml
markdown_extensions:
  - pymdownx.arithmatex:
      provider: katex
      cdn:
        stylesheet: https://cdn.example.com/katex.min.css
        javascript: https://cdn.example.com/katex.min.js
        auto_render: https://cdn.example.com/auto-render.min.js
```

When `cdn` is omitted, defaults are built from `provider` + `version` on jsDelivr.

| Option | Default | Description |
|--------|---------|-------------|
| `provider` | `katex` | Math renderer: `katex` or `mathjax` |
| `generic` | `true` | Output `\(...\)` / `\[...\]` wrappers compatible with both renderers |
| `smart_dollar` | `true` | Skip `$5`-style currency amounts |
| `version` | `0.16.22` / `3.2.2` | CDN package version when using built-in defaults (depends on `provider`) |
| `cdn.base` | — | KaTeX only: base URL for default asset paths (`katex.min.css`, `katex.min.js`, `contrib/auto-render.min.js`) |
| `cdn.stylesheet` | jsDelivr KaTeX CSS | Full URL override for the stylesheet |
| `cdn.javascript` | jsDelivr KaTeX / MathJax JS | Full URL override for the main library script |
| `cdn.auto_render` | jsDelivr KaTeX auto-render | Full URL override for KaTeX auto-render helper |

### Writing math in Markdown

| Style | Syntax | Example |
|-------|--------|---------|
| Inline | `$...$` or `\(...\)` | `$E = mc^2$` |
| Block | `$$...$$` on one or more lines | see below |

````markdown
Inline: $E = mc^2$

Block:

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$
````

See [showcase/math](../showcase/advanced/math.md) for live examples and more detail.

## Mermaid diagrams

Mermaid diagrams are rendered from ` ```mermaid ` code fences when `pymdownx.superfences` is enabled (included by default). ts-mkdocs loads the Mermaid library from a CDN at build time — you do not need to add scripts under `extra_javascript`.

### Basic setup

```yaml
markdown_extensions:
  - pymdownx.superfences:
      mermaid:
        version: "10.9.3"
        cdn:
          base: https://cdn.jsdelivr.net/npm/mermaid@10.9.3/dist
```

`cdn.base` expands to `{base}/mermaid.min.js`.

### Custom CDN mirrors

Override the script URL when self-hosting or using a private CDN:

```yaml
markdown_extensions:
  - pymdownx.superfences:
      mermaid:
        cdn:
          javascript: https://cdn.example.com/mermaid.min.js
```

### Theme and diagram options

```yaml
markdown_extensions:
  - pymdownx.superfences:
      mermaid:
        theme: auto          # auto | default | dark | forest | neutral | base | null
        securityLevel: strict
        themeVariables:
          primaryColor: "#4f46e5"
        flowchart:
          curve: basis
          useMaxWidth: true
        sequence:
          actorMargin: 80
        gantt:
          barHeight: 24
```

When `theme` is `auto` (default), diagrams follow the site light/dark palette.

| Option | Default | Description |
|--------|---------|-------------|
| `version` | `10.9.3` | CDN package version when using built-in defaults |
| `cdn.base` | — | Base URL for default asset path (`mermaid.min.js`) |
| `cdn.javascript` | jsDelivr Mermaid JS | Full URL override for the main library script |
| `theme` | `auto` | Mermaid theme; `auto` follows site light/dark mode |
| `themeVariables` | — | Custom theme color variables |
| `securityLevel` | — | `strict`, `loose`, `antiscript`, or `sandbox` |
| `flowchart` | — | Flowchart-specific options (`curve`, `useMaxWidth`, `htmlLabels`, `diagramPadding`) |
| `sequence` | — | Sequence diagram layout options |
| `gantt` | — | Gantt chart layout options |

See [showcase/mermaid](../showcase/advanced/mermaid.md) for live examples and more detail.

## Sitemap

Generate a `sitemap.xml` file to help search engines index your documentation.

### Basic setup

```yaml
plugins:
  - sitemap:
      hostname: https://example.com  # required
```

### Full configuration

```yaml
plugins:
  - sitemap:
      hostname: https://example.com   # required — your site's root URL
      changefreq: weekly               # optional — default: weekly
      priority: 0.8                    # optional — default: 0.8
      exclude:                         # optional — pages to skip
        - draft-*.html
        - private/**
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hostname` | string | *(required)* | Site root URL, e.g. `https://example.com` |
| `changefreq` | string | `weekly` | How often pages change: `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never` |
| `priority` | number | `0.8` | Page priority for crawlers, range 0.0–1.0 |
| `exclude` | string[] | `[]` | File path patterns to exclude, supports `*` wildcard |

### Generated output

The plugin creates `sitemap.xml` in your site root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-07-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/guide/installation/</loc>
    <lastmod>2026-07-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... -->
</urlset>
```

### Notes

- Sitemap is only generated when `hostname` is configured
- Non-document pages are automatically excluded: `404.html`, `search/`, `assets/`, `tags/`
- `<lastmod>` is derived from file modification time
- URLs are sorted alphabetically for deterministic output

## Robots.txt

Generate a `robots.txt` file to control search engine crawler access.

### Basic setup

```yaml
plugins:
  - robots
```

This generates a minimal `robots.txt` that allows all crawlers and includes a `Sitemap:` directive if `site_url` is configured.

### Full configuration

```yaml
plugins:
  - robots:
      rules:
        - user_agent: '*'
          disallow:
            - /api/
            - /admin/
          allow:
            - /api/public/
        - user_agent: Googlebot
          disallow:
            - /drafts/
      sitemap: https://example.com/sitemap.xml
      extra:
        - Crawl-delay: 10
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rules` | object[] | `[{user_agent: '*', disallow: [], allow: []}]` | Crawler access rules |
| `rules[].user_agent` | string | `*` | Target crawler name (`*` = all) |
| `rules[].disallow` | string[] | `[]` | URL paths to block |
| `rules[].allow` | string[] | `[]` | URL paths to allow (overrides disallow) |
| `sitemap` | string | auto from `site_url` | Full URL to sitemap.xml |
| `extra` | string[] | `[]` | Additional directives (e.g. `Crawl-delay`) |

### Generated output

The plugin creates `robots.txt` in your site root:

```
User-agent: *
Disallow: /api/
Disallow: /admin/
Allow: /api/public/

Sitemap: https://example.com/sitemap.xml
```

### Notes

- When `sitemap` is not set, the plugin auto-generates it from `site_url` + `/sitemap.xml`
- Use shorthand `disallow`/`allow` at the top level for a quick `User-agent: *` rule
- The `extra` array accepts any raw directive lines
