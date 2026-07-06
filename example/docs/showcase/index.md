---
title: Overview
description: Visual reference for every supported Markdown and theme element
tags:
  - Showcase
  - Reference
groups:
  - Showcase
authors:
  - kartjim
---

# Feature Showcase

Each page in this section documents **one syntax family**: how to write it, what it looks like when rendered, and how it behaves in advanced or combined scenarios.

Use these pages as a visual regression checklist while developing ts-mkdocs.

## Basic Syntax

Standard Markdown and GFM building blocks — no extra extensions required beyond `tables` and `toc`.

| Page | What it covers |
|------|----------------|
| [Headings](basic/headings.md) | `#` heading levels, anchor links, TOC |
| [Text & Links](basic/text.md) | Bold, italic, strikethrough, inline code, links |
| [Blockquotes](basic/blockquote.md) | `>` quoted blocks, nesting |
| [Lists](basic/lists.md) | Unordered, ordered, nested lists |
| [Tables](basic/tables.md) | GFM pipe tables, alignment |

## Extended Syntax

Markdown extensions that add inline or block elements on top of standard syntax.

| Page | What it covers | Extension |
|------|----------------|-----------|
| [Code Blocks](extended/code-blocks.md) | Fenced code, Shiki highlighting, copy / line numbers / language label | `md.fences` + theme features |
| [Task Lists](extended/tasklist.md) | `- [ ]` checkboxes | `md.tasklist` |
| [Footnotes](extended/footnotes.md) | `[^1]` references and definitions | `footnotes` |
| [Abbreviations & Definition Lists](extended/abbr-deflist.md) | `*[ABBR]:` tooltips and `term : definition` pairs | `abbr` / `def_list` |
| [Icons](extended/icons.md) | `:material-home:` shortcodes | built-in icon service |
| [Keyboard & Mark](extended/keys-mark.md) | `++key++` and `==highlight==` | `md.keys` / `md.mark` |
| [MagicLink](extended/magiclink.md) | `#1`, `@user`, commit hashes | `md.links` |
| [Superscript & Subscript](extended/sup-sub.md) | `^sup^`, `~sub~`, `^^ins^^`, `~~del~~` | `md.caret` / `md.tilde` |
| [Images](extended/images.md) | `![alt](path)`, lightbox zoom | `content.image.lightbox` |
| [Attributes](extended/attributes.md) | `{: .class #id}` on block elements | `attr_list` |

## Advanced Components

Self-contained UI components and richer content blocks.

| Page | What it covers | Extension |
|------|----------------|-----------|
| [Admonitions](advanced/admonitions.md) | `!!!` / `???` callouts, all types, collapse | `admonition` / `md.details` |
| [Content Tabs](advanced/tabs.md) | `===` tabbed content | `md.tabs` |
| [Annotations](advanced/annotations.md) | Code and text annotations | `content.code.annotate` |
| [Math](advanced/math.md) | LaTeX math with KaTeX or MathJax | `md.math` |
| [Mermaid](advanced/mermaid.md) | Flowcharts, sequence diagrams, Gantt charts | `md.fences` |
| [Comments](advanced/comments.md) | Giscus / Utterances via `extra.comments` | site config + front matter |

## Nesting & Combinations

How syntaxes interact when nested inside admonitions, tabs, lists, and other containers.

| Page | What it covers |
|------|----------------|
| [Combinations](nesting/combinations.md) | Mixing syntaxes in real-world layouts |

## Configuration baseline

Most examples on these pages assume the example site's `ts-mkdocs.yml`:

```yaml
markdown_extensions:
  - admonition
  - md.details
  - md.tabs
  - md.fences
  - md.tasklist
  - md.keys
  - md.mark
  - md.links:
      repo_url_shorthand: true
  - md.caret
  - md.tilde
  - attr_list
  - tables
  - footnotes
  - abbr
  - def_list
  - md.math:
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
    - content.image.lightbox
```

Individual pages call out when an extension or theme feature is required.
