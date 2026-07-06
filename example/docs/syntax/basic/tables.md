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

### Column width

Set column widths on header cells with `attr_list` (requires `attr_list` in `markdown_extensions`):

```markdown
| Name {: width=30% } | Description {: width=70% } |
| --- | --- |
| ts-mkdocs | TypeScript MkDocs implementation |
```

| Name {: width=30% } | Description {: width=70% } |
| --- | --- |
| ts-mkdocs | TypeScript MkDocs implementation |

### Cell merging

Use `@span` placeholders in cells to merge columns and rows. Requires `tables` in `markdown_extensions`.

```markdown
| Region | Q1 | Q2 |
| --- | --- | --- |
| North @span=2 | | 120 |
| South | 80 | 95 |
```

| Region | Q1 | Q2 |
| --- | --- | --- |
| North @span=2 | | 120 |
| South | 80 | 95 |

Explicit spans:

- `@span` — auto-expand into adjacent empty cells (colspan takes precedence over rowspan)
- `@span=2` — colspan of 2
- `@span=2:3` — colspan 2 and rowspan 3

Rowspan example:

```markdown
| Item | Notes |
| --- | --- |
| Alpha @span=1:2 | First row |
| | Second row |
```

| Item | Notes |
| --- | --- |
| Alpha @span=1:2 | First row |
| | Second row |

You can also use `attr_list` attributes (`{: rowspan=2 }`, `{: colspan=2 }`) — ghost cells in merged rows/columns are removed automatically.

```markdown
| Fruit | Definition |
| --- | --- |
| Apple | Pomaceous fruit {: rowspan=2 } |
| Also Apple | |
```

| Fruit | Definition |
| --- | --- |
| Apple | Pomaceous fruit {: rowspan=2 } |
| Also Apple | |

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
