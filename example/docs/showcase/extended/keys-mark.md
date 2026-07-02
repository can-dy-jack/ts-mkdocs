---
title: Keyboard & Mark
description: Keyboard shortcuts and highlighted text extensions
tags:
  - Keyboard
  - Highlight
  - Showcase
groups:
  - Showcase
date: 2026-07-01
updated: 2026-07-02
authors:
  - kartjim
---

# Keyboard & Mark

Two small inline extensions for UI documentation and emphasis.

## Configuration

```yaml
markdown_extensions:
  - pymdownx.keys
  - pymdownx.mark
```

## Keyboard shortcuts (`pymdownx.keys`)

### Basic syntax

Wrap keys in `++` delimiters. Separate chord parts with `+`:

```markdown
Press ++Enter++ to confirm.

Copy with ++Ctrl+C++ (or ++Cmd+C++ on macOS).

Force quit: ++Ctrl+Alt+Del++.
```

### Rendered output

Press ++Enter++ to confirm.

Copy with ++Ctrl+C++ (or ++Cmd+C++ on macOS).

Force quit: ++Ctrl+Alt+Del++.

## Highlighted text (`pymdownx.mark`)

### Basic syntax

Wrap text in `==` (like highlight marker):

```markdown
==Important== details stand out from **bold** emphasis.
```

### Rendered output

==Important== details stand out from **bold** emphasis.

## Advanced usage

### Keys in lists

1. Press ++Ctrl+Shift+P++
2. Type "build"
3. Press ++Enter++

### Mark inside admonitions

!!! warning
    ==Do not== commit secrets to `mkdocs.yml`.

## Combining with other syntax

| Input | Result |
|-------|--------|
| `++Esc++` | ++Esc++ |
| `==beta==` | ==beta== |

Keys + icons in prose:

Press ++Ctrl+C++ after selecting :material-content-copy: from the toolbar (if shown).

See [Text & Links](../basic/text.md) for standard bold/italic and [Combinations](../nesting/combinations.md) for larger layouts.
