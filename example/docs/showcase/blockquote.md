---
title: Blockquotes
description: Quoted passages with optional attribution
---

# Blockquotes

Blockquotes offset quoted text with a colored left border and muted background.

## Basic syntax

Prefix each line with `>`:

```markdown
> "Any sufficiently advanced technology is indistinguishable from magic."
>
> — Arthur C. Clarke
```

## Rendered output

> "Any sufficiently advanced technology is indistinguishable from magic."
>
> — Arthur C. Clarke

## Extended syntax

### Multi-line quotes

Only the first line needs `>` if paragraphs are separated by `>` on blank lines:

```markdown
> First paragraph of the quote.
>
> Second paragraph continues the quote.
```

> First paragraph of the quote.
>
> Second paragraph continues the quote.

### Nested blockquotes

```markdown
> Outer quote
>
> > Nested quote
```

> Outer quote
>
> > Nested quote

## Advanced usage

### Blockquote with inline formatting

```markdown
> Use **`ts-mkdocs build`** for production output.
> See the [CLI reference](../reference/cli.md) for flags.
```

> Use **`ts-mkdocs build`** for production output.
> See the [CLI reference](../reference/cli.md) for flags.

## Combining with other syntax

Admonition type `quote` is styled differently from a plain blockquote — compare:

!!! quote "Admonition quote"
    Callout quotes have a title bar and icon.

> Plain blockquotes are simpler and need no extension.
