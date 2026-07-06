---
title: Theme Configuration
description: Detailed configuration for the Material theme
tags:
  - Theme
  - Configuration
  - Reference
groups:
  - Reference
authors:
  - kartjim
---

# Theme Configuration

The Material theme is configured under the `theme` key in `ts-mkdocs.yml`.

## Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `material` | Theme name (always `material`) |
| `language` | string | `en` | Language code for UI strings |
| `logo` | string | — | Path to logo image (relative to docs) |
| `favicon` | string | — | Path to favicon (relative to docs) |
| `custom_dir` | string | — | Directory for custom template overrides |

## Palette

Configure light/dark mode and colors.

### Single Palette

```yaml
theme:
  palette:
    primary: blue
    accent: blue
```

### Light/Dark Toggle

```yaml
theme:
  palette:
    - scheme: default
      primary: blue
      accent: blue
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
```

### Palette Options

| Option | Type | Description |
|--------|------|-------------|
| `scheme` | string | Color scheme: `default` (light) or `slate` (dark) |
| `primary` | string | Primary color name or hex value |
| `accent` | string | Accent color name or hex value |
| `toggle` | object | Toggle button configuration |

### Available Colors

| Color | Hex |
|-------|-----|
| `red` | `#ef5350` |
| `pink` | `#e91e63` |
| `purple` | `#9c27b0` |
| `deep-purple` | `#673ab7` |
| `indigo` | `#3f51b5` |
| `blue` | `#2196f3` |
| `light-blue` | `#03a9f4` |
| `cyan` | `#00bcd4` |
| `teal` | `#009688` |
| `green` | `#4caf50` |
| `light-green` | `#8bc34a` |
| `lime` | `#cddc39` |
| `yellow` | `#ffeb3b` |
| `amber` | `#ffc107` |
| `orange` | `#ff9800` |
| `deep-orange` | `#ff5722` |
| `brown` | `#795548` |
| `grey` | `#9e9e9e` |
| `blue-grey` | `#607d8b` |

Or use a hex value directly: `primary: "#4f46e5"`

## Fonts

```yaml
theme:
  font:
    text: Inter
    code: JetBrains Mono
```

| Option | Type | Description |
|--------|------|-------------|
| `text` | string | Body text font name |
| `code` | string | Code font name |

Set to `false` to use system fonts:

```yaml
theme:
  font: false
```

## Syntax Highlighting

Configure Shiki syntax highlighting themes:

```yaml
theme:
  highlight:
    theme_light: catppuccin-latte
    theme_dark: github-dark
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme_light` | string | `github-light` | Light mode syntax theme |
| `theme_dark` | string | `github-dark` | Dark mode syntax theme |

### Available Themes

**Light themes:** `github-light`, `catppuccin-latte`, `solarized-light`, `min-light`, `slack-ochin`, `rose-pine-dawn`

**Dark themes:** `github-dark`, `dracula`, `nord`, `one-dark-pro`, `catppuccin-mocha`, `rose-pine`, `night-owl`, `material-theme-palenight`

## Icons

```yaml
theme:
  icons:
    default: material
    libraries:
      - material
      - fontawesome
      - bootstrap
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `default` | string | `material` | Default icon library |
| `libraries` | array | `[material, fontawesome, bootstrap]` | Enabled icon libraries |

### Available Libraries

- `material` — Material Design icons (10,000+)
- `fontawesome` — Font Awesome 6 icons
- `bootstrap` — Bootstrap Icons
- `octicons` — GitHub Octicons

### Admonition Icons

Override default icons for admonition types:

```yaml
theme:
  icon:
    admonition:
      note: material/information
      tip: material/lightbulb
      warning: material/alert
```

## Features

Enable theme features:

```yaml
theme:
  features:
    - navigation.tabs
    - navigation.tabs.sticky
    - navigation.sections
    - navigation.footer
    - navigation.top
    - toc.follow
    - toc.integrate
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.linenumbers
    - content.code.lang
    - content.code.wrap
    - content.code.annotate
    - content.image.lightbox
    - navigation.instant
    - navigation.instant.prefetch
    - navigation.instant.progress
```

### Navigation Features

| Feature | Description |
|---------|-------------|
| `navigation.tabs` | Show top-level sections as tabs |
| `navigation.tabs.sticky` | Tabs stay visible on scroll |
| `navigation.sections` | Group pages in sidebar sections |
| `navigation.footer` | Show prev/next page links |
| `navigation.top` | Show back-to-top button |
| `navigation.instant` | SPA-like instant page transitions |
| `navigation.instant.prefetch` | Prefetch pages on hover |
| `navigation.instant.progress` | Show progress bar on navigation |

### TOC Features

| Feature | Description |
|---------|-------------|
| `toc.follow` | TOC follows scroll position |
| `toc.integrate` | Integrate TOC into sidebar |

### Search Features

| Feature | Description |
|---------|-------------|
| `search.suggest` | Show search suggestions |
| `search.highlight` | Highlight search terms on page |

### Content Features

| Feature | Description |
|---------|-------------|
| `content.code.copy` | Add copy button to code blocks |
| `content.code.linenumbers` | Show line numbers |
| `content.code.lang` | Show language label |
| `content.code.wrap` | Enable code wrapping |
| `content.code.annotate` | Enable code annotations |
| `content.image.lightbox` | Enable image lightbox zoom |

## Settings Panel

Configure the reader settings panel (gear icon in header):

```yaml
theme:
  settings:
    enabled: true
    colors:
      - name: Blue
        color: "#2196f3"
      - name: Teal
        color: "#009688"
      - name: Green
        color: "#4caf50"
    fonts:
      - name: System
      - name: Serif
        family: '"Noto Serif", Georgia, serif'
        url: https://fonts.googleapis.com/css2?family=Noto+Serif
    font_sizes:
      - name: Small
        value: 90
      - name: Default
        value: 115
      - name: Large
        value: 135
    default_font_size: 115
```

| Option | Type | Description |
|--------|------|-------------|
| `enabled` | boolean | Enable/disable settings panel |
| `colors` | array | Available accent colors |
| `fonts` | array | Available fonts |
| `font_sizes` | array | Available font sizes (50-300) |
| `default_font_size` | number | Default font size percentage |

## Share Buttons

Configure page-level share buttons:

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
      - threads
      - bluesky
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable share buttons |
| `platforms` | array | `[x, facebook, weibo]` | Platforms to show |

## See Also

- [Configuration Reference](config.md) — All configuration options
- [Markdown Extensions](extensions.md) — Extension configuration
