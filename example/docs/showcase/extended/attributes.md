---
title: Attributes
description: Add CSS classes and IDs to block elements with attr_list
tags:
  - Attributes
  - CSS
  - Showcase
groups:
  - Showcase
date: 2026-07-01
updated: 2026-07-02
authors:
  - kartjim
---

# Attributes

Attach CSS classes and HTML ids to headings, fences, and other blocks. Requires `attr_list` (via `markdown-it-attrs`).

## Configuration

```yaml
markdown_extensions:
  - attr_list
```

## Basic syntax

Append attributes in curly braces at the end of a block line:

```markdown
## Custom heading {: #my-id }

Paragraph with a class. {: .lead }
```

## Rendered output

Inspect the heading below — it has `id="my-id"`:

## Custom heading {: #my-id }

This paragraph has class `lead` applied. {: .lead }

## Extended syntax

### Multiple classes

```markdown
!!! note "Styled callout" {: .extra-class }
    Body text.
```

!!! note "Styled callout" {: .extra-class }
    Admonition titles can carry attribute blocks when placed correctly.

### On fenced code

````markdown
``` { .language-bash .copyable }
echo hello
```
````

``` { .language-bash .copyable }
echo "Attributes attach to the pre element"
```

## Advanced usage

Combine with [Headings](../basic/headings.md) TOC anchors:

```markdown
## Section title {: #section-title .premium }
```

## Combining with other syntax

Attributes do not replace theme features — use `content.code.copy` for copy buttons rather than a custom class alone.

Tables with alignment already use GFM syntax; `attr_list` is for extra HTML hooks:

| Name | Value |
|------|-------|
| A | 1 |

{: .custom-table-wrapper }

> Wrapper attributes on block elements may require block-level placement on the preceding line in some parsers.
