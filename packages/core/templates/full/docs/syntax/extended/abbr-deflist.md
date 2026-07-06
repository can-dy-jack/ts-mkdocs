---
title: Abbreviations & Definition Lists
description: Inline abbreviations and term/definition pairs with abbr and def_list
tags:
  - Abbreviations
  - Definition Lists
  - Markdown
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Abbreviations & Definition Lists

Two Python-Markdown-compatible extensions: **abbreviations** add hover tooltips for short forms, and **definition lists** pair terms with their descriptions.

## Configuration

```yaml
markdown_extensions:
  - abbr
  - def_list
```

## Abbreviations

Define abbreviations anywhere in the document, then use the short form in text. Matching terms are wrapped in `<abbr>` with a `title` attribute.

### Syntax

```markdown
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

The HTML specification is maintained by the W3C.
```

### Rendered output

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

The HTML specification is maintained by the W3C.

## Definition lists

Definition lists render as `<dl>` / `<dt>` / `<dd>`. Each term is followed by one or more lines starting with `:` (optionally indented).

### Basic syntax

```markdown
Apple
:   Pomaceous fruit of plants of the genus Malus in
    the family Rosaceae.

Orange
:   The fruit of an evergreen tree of the genus Citrus.
```

### Rendered output

Apple
:   Pomaceous fruit of plants of the genus Malus in
    the family Rosaceae.

Orange
:   The fruit of an evergreen tree of the genus Citrus.

### Multiple definitions

A term can have several definitions — each on its own `:` line:

```markdown
Term
:   First definition
:   Second definition
```

Term
:   First definition
:   Second definition

### Inline formatting

Definitions support standard inline Markdown:

```markdown
API
:   An **Application Programming Interface** for software integration.
```

API
:   An **Application Programming Interface** for software integration.

## Combining with other syntax

Definition lists work inside admonitions:

!!! note "Glossary snippet"
    HTTP
    :   Hypertext Transfer Protocol

    HTTPS
    :   HTTP secured with TLS

Abbreviations can appear in tables — see [Tables](../basic/tables.md).
