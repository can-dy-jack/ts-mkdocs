---
title: Tables
description: GitHub-Flavored Markdown pipe tables
tags:
  - Markdown
  - Tables
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Tables

Pipe tables align columns and support inline formatting. Enable with `tables` in `markdown_extensions` (included in the example site).

## Basic syntax

```markdown
| Language   | Type system | Primary use   |
|------------|-------------|---------------|
| TypeScript | Static      | Web / Node.js |
| Python     | Dynamic     | Data / ML     |
| Rust       | Static      | Systems       |
```

## Rendered output

| Language   | Type system | Primary use   |
|------------|-------------|---------------|
| TypeScript | Static      | Web / Node.js |
| Python     | Dynamic     | Data / ML     |
| Rust       | Static      | Systems       |

## Extended syntax

### Column alignment

Colons in the separator row control alignment:

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| a    | b      | c     |
```

| Left | Center | Right |
|:-----|:------:|------:|
| a    | b      | c     |

### Inline formatting in cells

```markdown
| Feature | Status |
|---------|--------|
| **Search** | Built-in |
| `content.code.copy` | Theme feature |
```

| Feature | Status |
|---------|--------|
| **Search** | Built-in |
| `content.code.copy` | Theme feature |

## Advanced usage

Wide tables scroll horizontally on narrow viewports — add many columns to test overflow:

| Col A | Col B | Col C | Col D | Col E |
|-------|-------|-------|-------|-------|
| 1 | 2 | 3 | 4 | 5 |

## Combining with other syntax

Footnotes inside table cells[^table]:

| Term | Meaning |
|------|---------|
| TOC | Table of contents[^table] |

[^table]: Rendered at the bottom of the page, not inside the table.

Icons in headers:

| Icon | Name |
|------|------|
| :material-home: | Home |
| :material-search: | Search |
