---
title: Headings
description: ATX heading syntax, anchor permalinks, and table of contents
---

# Headings

Headings structure the page and feed the **table of contents** (right sidebar). With `toc.permalink: true`, each heading gets a hover anchor link.

## Basic syntax

Prefix a line with one to six `#` characters. A space after `#` is required.

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

## Rendered output

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Configuration

```yaml
markdown_extensions:
  - toc:
      permalink: true   # hover link icon on headings
      toc_depth: 3      # max heading level in TOC (default: 3 → h2 and h3)
```

`toc_depth` controls which heading levels appear in the page table of contents. Level 1 (`#`) is always excluded. The default is `3`, so only **h2** and **h3** are listed unless you raise the limit (e.g. `toc_depth: 4` to include h4).

## Advanced usage

### Custom heading IDs

With `attr_list` enabled, attach an explicit id:

```markdown
## Install the CLI {: #install-cli }
```

Hover the heading above — it should appear in the TOC as **Install the CLI** with a stable `#install-cli` anchor.

### Headings with inline formatting

```markdown
## Use `ts-mkdocs` with **confidence**
```

## Use `ts-mkdocs` with **confidence**

### Headings with icons

Icon shortcodes work inside headings when the icons extension is active:

```markdown
## :material-rocket: Quick start
```

## :material-rocket: Quick start

## Combining with other syntax

Headings can introduce admonitions, code blocks, or tabs directly below — the TOC only lists headings, not those blocks:

### Section with a note

!!! note "Under this heading"
    Admonitions directly under a heading stay grouped in the document flow.
