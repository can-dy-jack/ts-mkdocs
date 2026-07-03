---
title: Text & Links
description: Inline emphasis, code, strikethrough, and hyperlinks
tags:
  - Markdown
  - Text
  - Links
  - Showcase
groups:
  - Showcase
date: 2026-07-01
updated: 2026-07-02
authors:
  - kartjim
---

# Text & Links

Standard Markdown inline constructs for emphasis and navigation. No extra extension is required.

## Basic syntax

```markdown
Normal text.

**Bold** and __also bold__.

*Italic* and _also italic_.

***Bold italic***.

~~Strikethrough~~.

`inline code`

[Relative link](../index.md)

[External link](https://github.com/can-dy-jack/ts-mkdocs)
```

## Rendered output

Normal text.

**Bold** and __also bold__.

*Italic* and _also italic_.

***Bold italic***.

~~Strikethrough~~.

`inline code`

A [relative link](../../index.md) and an [external link](https://github.com/can-dy-jack/ts-mkdocs).

## Extended syntax

### Line breaks

End a line with two spaces for a hard break, or separate paragraphs with a blank line.

```markdown
Line one  
Line two (hard break).

New paragraph.
```

Line one  
Line two (hard break).

New paragraph.

### Autolinks

Bare URLs are linkified when `linkify` is enabled (default in ts-mkdocs):

https://example.com

## Advanced usage

### Inline code in emphasis

```markdown
Press **`:material-check:`** after editing `mkdocs.yml`.
```

Press **`:material-check:`** after editing `mkdocs.yml`.

### Highlighted text (`pymdownx.mark`)

Requires `pymdownx.mark` in `markdown_extensions`:

```markdown
==Marked text== stands out without bold weight.
```

==Marked text== stands out without bold weight.

### Emoji (`pymdownx.emoji`)

Requires `pymdownx.emoji` in `markdown_extensions`:

```markdown
:smile: :heart: :thumbsup: :rocket:

Emoticon shortcuts work too: :) :-)
```

:smile: :heart: :thumbsup: :rocket:

Emoticon shortcuts work too: :) :-)

Icon shortcodes still use a library prefix, e.g. `:material-home:`.

## Combining with other syntax

Inline elements work inside tables, admonitions, and footnotes:

| Style | Example |
|-------|---------|
| Bold in table | **Important** |
| Link in table | [Configuration](../../guide/configuration.md) |

!!! tip
    Use **bold** for UI labels and `code` for file names inside callouts.
