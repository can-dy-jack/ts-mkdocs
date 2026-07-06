---
title: Markdown Extensions
description: Configuration reference for all Markdown extensions
tags:
  - Extensions
  - Markdown
  - Reference
groups:
  - Reference
authors:
  - kartjim
---

# Markdown Extensions

ts-mkdocs supports a rich set of Markdown extensions configured under `markdown_extensions` in `ts-mkdocs.yml`.

## Built-in Extensions

These extensions are part of the standard Markdown library:

### admonition

Callout blocks with `!!!` syntax.

```yaml
markdown_extensions:
  - admonition:
      default_collapsed: false
      types:
        todo:
          title: Todo
          icon: material/checklist
          color: '#795548'
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `default_collapsed` | boolean | `false` | Default state for `!!!` blocks |
| `types` | object | — | Custom admonition type definitions |

### tables

Standard Markdown tables with column alignment.

```yaml
markdown_extensions:
  - tables
```

No configuration options.

### footnotes

Footnote references with `[^1]` syntax.

```yaml
markdown_extensions:
  - footnotes
```

No configuration options.

### abbr

Abbreviation definitions with `*[ABBR]:` syntax.

```yaml
markdown_extensions:
  - abbr
```

No configuration options.

### def_list

Definition lists with term/definition pairs.

```yaml
markdown_extensions:
  - def_list
```

No configuration options.

### attr_list

Attribute lists with `{: .class #id}` syntax.

```yaml
markdown_extensions:
  - attr_list
```

No configuration options.

### md_in_html

Markdown inside HTML blocks.

```yaml
markdown_extensions:
  - md_in_html
```

No configuration options.

### toc

Table of contents from headings.

```yaml
markdown_extensions:
  - toc:
      permalink: true
      toc_depth: 3
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `permalink` | boolean | `false` | Add permalink anchors to headings |
| `permalink_class` | string | `headeranchor` | CSS class for permalink |
| `permalink_title` | string | `Permanent link` | Title attribute for permalink |
| `toc_depth` | number | `3` | Heading depth to include (1-6) |
| `title` | string | — | Custom TOC title |

## ts-mkdocs Extensions

These extensions are specific to ts-mkdocs:

### md.details

Collapsible admonition blocks with `???` syntax.

```yaml
markdown_extensions:
  - md.details:
      default_collapsed: true
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `default_collapsed` | boolean | `true` | Default state for `???` blocks |

### md.tabs

Content tabs with `===` syntax.

```yaml
markdown_extensions:
  - md.tabs:
      alternate_style: true
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `alternate_style` | boolean | `true` | Use Material alternate tab style |

### md.fences

Enhanced code blocks with syntax highlighting, line numbers, and more.

```yaml
markdown_extensions:
  - md.fences:
      mermaid:
        version: "11"
        cdn:
          base: https://cdn.jsdelivr.net/npm/mermaid@11/dist
        theme: auto
```

| Option | Type | Description |
|--------|------|-------------|
| `mermaid` | object | Mermaid diagram configuration |

#### Mermaid Options

```yaml
md.fences:
  mermaid:
    version: "11"
    cdn:
      base: https://cdn.jsdelivr.net/npm/mermaid@11/dist
    theme: auto
    securityLevel: strict
    themeVariables:
      primaryColor: "#4f46e5"
```

### md.tasklist

Task list checkboxes with `- [ ]` / `- [x]` syntax.

```yaml
markdown_extensions:
  - md.tasklist
```

No configuration options.

### md.keys

Keyboard key shortcuts with `++key++` syntax.

```yaml
markdown_extensions:
  - md.keys
```

No configuration options.

### md.mark

Highlighted text with `==text==` syntax.

```yaml
markdown_extensions:
  - md.mark
```

No configuration options.

### md.caret

Superscript with `^text^` and insert with `^^text^^`.

```yaml
markdown_extensions:
  - md.caret:
      insert: true
      superscript: true
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `insert` | boolean | `true` | Enable `^^insert^^` syntax |
| `superscript` | boolean | `true` | Enable `^sup^` syntax |

### md.tilde

Subscript with `~text~` and delete with `~~text~~`.

```yaml
markdown_extensions:
  - md.tilde:
      delete: true
      subscript: true
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delete` | boolean | `true` | Enable `~~delete~~` syntax |
| `subscript` | boolean | `true` | Enable `~sub~` syntax |

### md.emoji

Emoji shortcodes like `:smile:`.

```yaml
markdown_extensions:
  - md.emoji:
      emoji_index: full
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `emoji_index` | string | `full` | Emoji set: `full` or `light` |
| `defs` | object | — | Custom emoji definitions |
| `shortcuts` | object | — | Custom emoji shortcuts |

### md.links

Auto-link repository references (#1, @user, commits).

```yaml
markdown_extensions:
  - md.links:
      normalize_issue_symbols: true
      repo_url_shorthand: true
      repo_url_shortener: true
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `normalize_issue_symbols` | boolean | `false` | Normalize issue/PR symbols |
| `repo_url_shorthand` | boolean | `false` | Enable shorthand repo URLs |
| `repo_url_shortener` | boolean | `false` | Shorten repo URLs |

### md.math

LaTeX math equations via KaTeX or MathJax.

```yaml
markdown_extensions:
  - md.math:
      provider: katex
      version: "0.16.22"
      cdn:
        base: https://cdn.jsdelivr.net/npm/katex@0.16.22/dist
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | string | `katex` | Math renderer: `katex` or `mathjax` |
| `version` | string | auto | Library version |
| `cdn` | object | — | CDN configuration |

#### CDN Options

```yaml
cdn:
  base: https://cdn.jsdelivr.net/npm/katex@0.16.22/dist
  # Or override individual URLs:
  stylesheet: https://cdn.example.com/katex.min.css
  javascript: https://cdn.example.com/katex.min.js
  auto_render: https://cdn.example.com/auto-render.min.js
```

#### KaTeX (default)

```yaml
md.math:
  provider: katex
  version: "0.16.22"
  cdn:
    base: https://cdn.jsdelivr.net/npm/katex@0.16.22/dist
```

#### MathJax

```yaml
md.math:
  provider: mathjax
  version: "3.2.2"
  cdn:
    javascript: https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js
```

### md.snippets

Include content from other files with `--8<--` syntax.

```yaml
markdown_extensions:
  - md.snippets:
      base_path: docs
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `base_path` | string | docs_dir | Base path for snippet resolution |

### md.critic

Critic markup for tracked changes.

```yaml
markdown_extensions:
  - md.critic
```

No configuration options.

## Default Extensions

When `markdown_extensions` is empty, these defaults are enabled:

```yaml
markdown_extensions:
  - admonition
  - md.tabs
  - md.fences
  - attr_list
  - tables
  - md_in_html
  - md.tasklist
```

## See Also

- [Configuration Reference](config.md) — All configuration options
- [Syntax Reference](../syntax/index.md) — Markdown syntax examples
