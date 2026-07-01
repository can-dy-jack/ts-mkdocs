---
title: Content Tabs
description: Tabbed content blocks with pymdownx.tabbed
---

# Content Tabs

Switch between alternative content (languages, platforms, versions) without leaving the page.

## Configuration

```yaml
markdown_extensions:
  - pymdownx.tabbed:
      alternate_style: true
```

`alternate_style: true` uses the Material **alternate** tab style (underline labels).

## Basic syntax

Each tab starts with `===` and a quoted label. Content follows until the next tab header or end of block:

````markdown
=== "Tab A"

    Content for tab A (indented four spaces).

=== "Tab B"

    Content for tab B.
````

## Rendered output

=== "Tab A"

    First tab content with **Markdown** support.

=== "Tab B"

    Second tab content. Click the label to switch.

## Extended syntax

### Code in tabs

=== "TypeScript"

    ```typescript
    const site = await build(config)
  ```

=== "Python"

    ```python
    site = build(config)
    ```

### Multiple paragraphs

=== "Install"

    Run `pnpm install` at the repo root.

    Then run `pnpm build` before serving.

=== "Serve"

    ```bash
    pnpm example:serve
    ```

## Advanced usage

### Tabs with admonitions

=== "Recommended"

    !!! tip
        Use directory URLs for cleaner paths.

=== "Legacy"

    !!! warning
        `.html` suffix URLs still work when disabled.

## Combining with other syntax

Tabs + tables + icons:

=== ":material-code: API"

    | Method | Path |
    |--------|------|
    | GET | `/health` |

=== ":material-terminal: CLI"

    ```bash
    ts-mkdocs serve -f mkdocs.yml
    ```

See also [Code Blocks](code-blocks.md) and [Combinations](combinations.md).
