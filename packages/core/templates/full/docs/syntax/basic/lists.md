---
title: Lists
description: Unordered, ordered, and nested lists
tags:
  - Markdown
  - Lists
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Lists

Lists organize steps, options, and hierarchies. Standard Markdown list syntax is built in.

## Unordered lists

### Basic syntax

```markdown
- Item one
- Item two
- Item three
```

### Rendered output

- Item one
- Item two
- Item three

### Nested items

Indent nested bullets by four spaces (or one tab):

```markdown
- Item one
    - Nested A
    - Nested B
- Item two
```

- Item one
    - Nested A
    - Nested B
- Item two

## Ordered lists

### Basic syntax

```markdown
1. First step
2. Second step
3. Third step
```

### Rendered output

1. First step
2. Second step
3. Third step

### Nested ordered lists

```markdown
1. Build
    1. Run `pnpm install`
    2. Run `pnpm build`
2. Serve
```

1. Build
    1. Run `pnpm install`
    2. Run `pnpm build`
2. Serve

## Advanced usage

### Mixed list types

```markdown
1. Ordered parent
    - Unordered child
    - Another child
2. Next step
```

1. Ordered parent
    - Unordered child
    - Another child
2. Next step

### List items with multiple paragraphs

Indent continuation lines by four spaces:

```markdown
- First paragraph of the item.

    Second paragraph still belongs to the same bullet.
```

- First paragraph of the item.

    Second paragraph still belongs to the same bullet.

## Combining with other syntax

- **Bold** and `code` inline
- Links: [Configuration](../../guide/configuration.md)
- Nested admonition:

    !!! note
        Lists can contain admonitions when indented as part of the item.

See also [Task Lists](../extended/tasklist.md) for checkbox lists.
