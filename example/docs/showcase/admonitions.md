---
title: Admonitions
description: Callout blocks — note, tip, warning, collapsible details
---

# Admonitions

Callout blocks with colored headers, icons, and optional collapse. Requires `admonition` and optionally `pymdownx.details`.

Full reference: [Admonitions guide](../guide/admonitions.md).

## Configuration

```yaml
markdown_extensions:
  - admonition:
      default_collapsed: false
  - pymdownx.details:
      default_collapsed: true
```

## Basic syntax

Three exclamation marks, type name, indented body (four spaces):

```markdown
!!! note
    General information goes here.
```

## All types (rendered)

!!! note
    **note** — general information.

!!! tip "Pro tip"
    **tip** — helpful suggestion with a custom title.

!!! info
    **info** — neutral context.

!!! success
    **success** — positive outcome.

!!! warning "中文测试"
    **warning** — needs attention.

!!! danger "Danger zone"
    **danger** — risky or destructive action.

!!! bug
    **bug** — known issue.

!!! example
    **example** — sample usage.

!!! quote
    **quote** — citation or quotation.

## Extended syntax

### Custom titles

```markdown
!!! warning "Before you deploy"
    Double-check `site_url` in production.
```

### Collapsible (`???`)

`???` blocks default to **collapsed** (when `pymdownx.details` is enabled):

```markdown
??? note "Click to expand"
    Hidden until opened.
```

??? note "Collapsible (default collapsed)"
    Use `???` for content that can stay tucked away. Add `+` after `???` to start expanded: `???+ note`.

### Force open with `+`

```markdown
???+ tip "Starts expanded"
    The `+` suffix overrides default_collapsed for one block.
```

???+ tip "Collapsible (forced expanded)"
    The `+` suffix overrides `default_collapsed` for a single block.

### Force closed with `-`

```markdown
!!!- note "Starts collapsed"
    The `-` suffix on `!!!` forces collapse.
```

## Advanced usage

### Icons in titles

```markdown
!!! tip ":material-lightbulb: Remember"
    Icon shortcodes work inside quoted titles.
```

!!! tip ":material-lightbulb: Remember"
    Icon shortcodes work inside quoted titles.

### Tables and code inside admonitions

!!! example "Mixed content"
    | Step | Command |
    |------|---------|
    | Build | `pnpm build` |

    ```bash
    pnpm example:serve
    ```

## Combining with other syntax

Admonitions inside tab panels — see [Combinations](combinations.md).

Use `quote` admonition vs plain blockquote — see [Blockquotes](blockquote.md).
