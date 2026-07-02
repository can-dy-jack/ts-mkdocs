---
title: Footnotes
description: Inline references with definitions rendered at page bottom
---

# Footnotes

Add supplemental detail without interrupting the main text. Definitions can appear anywhere in the file; they render at the **bottom of the page**.

## Configuration

```yaml
markdown_extensions:
  - footnotes
```

## Basic syntax

Reference inline, define anywhere:

```markdown
Here is a footnote[^1].

[^1]: This is the first footnote.
```

## Rendered output

Footnotes add supplemental detail without breaking the reading flow[^demo].

[^demo]: Enable with `markdown_extensions: [footnotes]`. References use `[^id]`; definitions use `[^id]: text`.

## Extended syntax

### Named identifiers

Identifiers can be words or numbers — output is numbered sequentially:

```markdown
See RFC 9110[^http] for details.

[^http]: Hypertext Transfer Protocol (HTTP/1.1)
```

See RFC 9110[^http] for details.

[^http]: Hypertext Transfer Protocol (HTTP/1.1)

### Multi-paragraph footnotes

Indent continuation paragraphs with four spaces:

```markdown
[^long]:
    First paragraph of a longer note.

    Second paragraph, indented with four spaces.
```

Multi-paragraph footnotes are supported[^long]:

[^long]:
    First paragraph of a longer note.

    Second paragraph, indented with four spaces.

## Advanced usage

### Footnotes with formatting

[^fmt]: Supports **bold**, `code`, and [links](https://example.com).

Use rich content[^fmt] in footnotes.

### Multiple references

One definition can be referenced multiple times[^reuse][^reuse].

[^reuse]: Same footnote linked twice maps to one entry.

## Combining with other syntax

Footnotes in tables — see [Tables](../basic/tables.md).

Footnotes inside admonitions:

!!! note
    Admonitions can mention footnotes[^adm] inline.

[^adm]: The footnote list still appears at page bottom, outside the admonition box.
