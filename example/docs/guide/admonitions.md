---
title: Admonitions
description: Callout blocks with colored headers, icons, and collapsible content
tags:
  - Admonitions
  - Markdown
  - Guide
groups:
  - Guide
authors:
  - kartjim
---

# Admonitions

Admonitions are highlighted callout blocks for notes, warnings, tips, and similar content. Each block has a **colored top border**, a **tinted title bar** with an icon, and a **collapse toggle** on the right.

Enable them in `mkdocs.yml`:

```yaml
markdown_extensions:
  - admonition:
      default_collapsed: false
  - pymdownx.details:
      default_collapsed: true
```

## Basic syntax

Use three exclamation marks, the type name, and an indented body (four spaces or one tab):

```markdown
!!! note
    This is a note admonition.
```

Custom title:

```markdown
!!! tip "Pro tip"
    Use a quoted string after the type for a custom heading.
```


## sticky

!!! tip ":material-lightbulb: Remember"
    Icon shortcodes work inside quoted titles.
    | Option | Extension | Default | Description |
    |--------|-----------|---------|-------------|
    | `default_collapsed` | `admonition` | `false` | Initial state for `!!!` blocks |
    | `default_collapsed` | `pymdownx.details` | `true` | Initial state for `???` blocks |
    | `collapse` | both | — | Alias for `default_collapsed` |
    | `+` / `-` suffix | per block | — | Force open / closed for one block |
    ---
    | Type | Typical use |
    |------|-------------|
    | `note` | General information |
    | `abstract`, `info` | Summaries, metadata |
    | `tip` | Helpful suggestions |
    | `success` | Positive outcomes |
    | `question` | FAQs, open questions |
    | `warning` | Something needs attention |
    | `failure`, `danger` | Errors, risky actions |
    | `bug` | Known issues |
    | `example` | Sample usage |
    | `quote` | Citations, quotations |



## Supported types

| Type | Typical use |
|------|-------------|
| `note` | General information |
| `abstract`, `info` | Summaries, metadata |
| `tip` | Helpful suggestions |
| `success` | Positive outcomes |
| `question` | FAQs, open questions |
| `warning` | Something needs attention |
| `failure`, `danger` | Errors, risky actions |
| `bug` | Known issues |
| `example` | Sample usage |
| `quote` | Citations, quotations |

See all types rendered in the [Admonitions showcase](../showcase/advanced/admonitions.md).

## Collapsible blocks

All admonitions can be expanded or collapsed by clicking the title bar.

### `!!!` — standard admonitions

By default, `!!!` blocks start **expanded**. Configure the default in `mkdocs.yml`:

```yaml
markdown_extensions:
  - admonition:
      default_collapsed: false   # true = start collapsed
```

Override for a single block with `+` (force open) or `-` (force closed) immediately after `!!!`:

```markdown
!!!+ note "Always open"
    The `+` suffix expands this block even when `default_collapsed: true`.

!!!- warning "Always closed"
    The `-` suffix collapses this block even when `default_collapsed: false`.
```

### `???` — details-style admonitions

Use `???` when you want collapsible callouts that **start collapsed** by default (requires `pymdownx.details` in `markdown_extensions`):

```markdown
??? note "Click to expand"
    Hidden until the reader opens the block.
```

Configure the default:

```yaml
markdown_extensions:
  - pymdownx.details:
      default_collapsed: true    # false = start expanded
```

The `collapse` key is accepted as an alias for `default_collapsed`.

Per-block overrides work the same way:

```markdown
???+ tip "Expanded details block"
    Starts open despite `default_collapsed: true`.

???- info "Collapsed details block"
    Starts closed despite `default_collapsed: false`.
```

## Icons in titles

Admonition titles show a type icon by default. Override icons globally in `theme.icon.admonition`, or embed icon shortcodes in the title string:

```yaml
theme:
  icon:
    admonition:
      note: material/info
      tip: material/lightbulb
```

```markdown
!!! tip ":material-lightbulb: Remember"
    Icon shortcodes work inside quoted titles.
```

See [Configuration](configuration.md) for the full `theme.icon` reference.

## Custom types

Register additional admonition types under `markdown_extensions.admonition.types`. Each type can set a default title, icon, and color (`#hex`, `rgb()`, `rgba()`, `hsl()`, or `hsla()` — not palette keyword names). Colors are emitted to `assets/css/admonition-types.css` at build time.

```yaml
markdown_extensions:
  - admonition:
      types:
        # Object map — recommended
        todo:
          title: Todo
          icon: material/checklist
          color: '#795548'
        experimental:
          title: Experimental
          icon: material/science
          color: 'rgba(103, 58, 183, 0.95)'
        # Or a simple list of type names (uses default blue + material/{type} icon)
        - draft
```

```markdown
!!! todo
    Track unfinished work with a custom callout.

!!! experimental "Try it out"
    Override the configured default title per block.
```

Icon overrides in `theme.icon.admonition` still take precedence over `types.*.icon`.

## Configuration summary

| Option | Extension | Default | Description |
|--------|-----------|---------|-------------|
| `default_collapsed` | `admonition` | `false` | Initial state for `!!!` blocks |
| `default_collapsed` | `pymdownx.details` | `true` | Initial state for `???` blocks |
| `collapse` | both | — | Alias for `default_collapsed` |
| `types` | `admonition` | — | Custom admonition type definitions |
| `+` / `-` suffix | per block | — | Force open / closed for one block |



