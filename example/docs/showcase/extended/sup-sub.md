---
title: Superscript & Subscript
description: Superscript, subscript, insert, and delete inline formatting
tags:
  - Superscript
  - Subscript
  - Formatting
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Superscript & Subscript

Inline superscript and subscript via `pymdownx.caret` and `pymdownx.tilde` — compatible with [Material for MkDocs formatting](https://squidfunk.github.io/mkdocs-material/reference/formatting/).

## Configuration

```yaml
markdown_extensions:
  - pymdownx.caret
  - pymdownx.tilde
```

Both extensions are optional. Disable individual features when needed:

```yaml
markdown_extensions:
  - pymdownx.caret:
      insert: true
      superscript: true
  - pymdownx.tilde:
      delete: true
      subscript: true
```

## Superscript (`pymdownx.caret`)

Wrap text in single `^` delimiters:

```markdown
E = mc^2^

x^n^ + y^n^ = z^n^

text^a\ superscript^
```

### Rendered output

E = mc^2^

x^n^ + y^n^ = z^n^

text^a\ superscript^

Use a backslash before spaces inside the delimiter (`\ `) when the superscript contains spaces.

## Subscript (`pymdownx.tilde`)

Wrap text in single `~` delimiters:

```markdown
H~2~O

CH~3~CH~2~OH

text~a\ subscript~
```

### Rendered output

H~2~O

CH~3~CH~2~OH

text~a\ subscript~

## Insert & delete (optional)

The same extensions also support tracked changes syntax used by Material for MkDocs:

```markdown
^^Inserted text^^

~~Deleted text~~
```

### Rendered output

^^Inserted text^^

~~Deleted text~~

When `pymdownx.tilde` is enabled with `delete: true` (default), `~~…~~` renders as `<del>` instead of the built-in GFM strikethrough (`<s>`).

## Advanced usage

### In tables

| Formula | Meaning |
|---------|---------|
| H~2~O | Water |
| CO~2~ | Carbon dioxide |
| m^2^ | Square metres |

### With other inline syntax

Combine with **bold**, ==mark==, and footnotes[^chem]:

Water is H~2~O[^chem].

[^chem]: Subscripts work inside footnote bodies too: H~2~SO~4~.

## Combining with other syntax

| Input | Result |
|-------|--------|
| `X^2^` | X^2^ |
| `H~2~O` | H~2~O |
| `^^new^^` | ^^new^^ |
| `~~old~~` | ~~old~~ |

See [Keyboard & Mark](keys-mark.md) for `++keys++` and `==highlight==`, and [Text & Links](../basic/text.md) for standard emphasis.
