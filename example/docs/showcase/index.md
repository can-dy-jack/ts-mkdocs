---
title: Overview
description: Visual reference for every supported Markdown and theme element
---

# Feature Showcase

Each page in this section documents **one syntax family**: how to write it, what it looks like when rendered, and how it behaves in advanced or combined scenarios.

Use these pages as a visual regression checklist while developing ts-mkdocs.

## Pages

| Page | What it covers |
|------|----------------|
| [Headings](headings.md) | `#` heading levels, anchor links, TOC |
| [Text & Links](text.md) | Bold, italic, strikethrough, inline code, links |
| [Blockquotes](blockquote.md) | `>` quoted blocks, nesting |
| [Lists](lists.md) | Unordered, ordered, nested lists |
| [Tables](tables.md) | GFM pipe tables, alignment |
| [Code Blocks](code-blocks.md) | Fenced code, Shiki highlighting, copy / line numbers / language label |
| [Admonitions](admonitions.md) | `!!!` / `???` callouts, all types, collapse |
| [Content Tabs](tabs.md) | `===` tabbed content (`pymdownx.tabbed`) |
| [Annotations](annotations.md) | Code and text annotations (`content.code.annotate`) |
| [Math](math.md) | LaTeX math with KaTeX or MathJax (`pymdownx.arithmatex`) |
| [Task Lists](tasklist.md) | `- [ ]` checkboxes (`pymdownx.tasklist`) |
| [Icons](icons.md) | `:material-home:` shortcodes |
| [Footnotes](footnotes.md) | `[^1]` references and definitions |
| [Attributes](attributes.md) | `{: .class #id}` on block elements (`attr_list`) |
| [Keyboard & Mark](keys-mark.md) | `++key++` and `==highlight==` (`pymdownx.keys` / `pymdownx.mark`) |
| [Combinations](combinations.md) | Mixing syntaxes in real-world layouts |

## Configuration baseline

Most examples on these pages assume the example site's `mkdocs.yml`:

```yaml
markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.tabbed
  - pymdownx.superfences
  - pymdownx.tasklist
  - pymdownx.keys
  - pymdownx.mark
  - attr_list
  - tables
  - footnotes
  - pymdownx.arithmatex:
      provider: katex
      version: "0.16.22"
      cdn:
        base: https://cdn.jsdelivr.net/npm/katex@0.16.22/dist
  - toc:
      permalink: true

theme:
  features:
    - content.code.copy
    - content.code.linenumbers
    - content.code.lang
```

Individual pages call out when an extension or theme feature is required.
