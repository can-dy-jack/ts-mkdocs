---
title: Feature Showcase
description: Visual test page covering every supported Markdown and theme element
---

# Feature Showcase

This page is a visual regression checklist — every element below should render correctly.

---

## Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5

---

## Inline text

Normal text. **Bold text.** _Italic text._ ~~Strikethrough.~~ `inline code`.

A [relative link](index.md) and an [external link](https://github.com) (opens in new tab).

---

## Blockquote

> "Any sufficiently advanced technology is indistinguishable from magic."
>
> — Arthur C. Clarke

---

## Lists

### Unordered

- Item one
- Item two
    - Nested item
    - Another nested item
- Item three

### Ordered

1. First step
2. Second step
    1. Sub-step A
    2. Sub-step B
3. Third step

---

## Table

| Language   | Type system | Primary use       |
|------------|-------------|-------------------|
| TypeScript | Static      | Web / Node.js     |
| Python     | Dynamic     | Data / scripting  |
| Rust       | Static      | Systems / WASM    |
| Go         | Static      | Backend services  |

---

## Code blocks

### TypeScript

```typescript
interface DocFile {
  srcPath: string
  destPath: string
  url: string
}

async function buildPage(file: DocFile): Promise<string> {
  const markdown = await fs.readFile(file.srcPath, 'utf-8')
  return renderMarkdown(markdown)
}
```

### Python

```python
def load_config(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)
```

### Bash

```bash
# Install and scaffold a new project
npm install -g ts-mkdocs
ts-mkdocs new my-docs
cd my-docs && ts-mkdocs serve
```

### JSON

```json
{
  "config": { "lang": ["en"], "separator": "[\\s\\-]+" },
  "docs": [
    { "location": "/", "title": "Home", "text": "Welcome…" }
  ]
}
```

---

## Admonitions

!!! note
    This is a **note** admonition. Use it for general information.

!!! tip "Pro tip"
    This is a **tip** admonition with a custom title.

!!! info
    This is an **info** admonition.

!!! success
    This is a **success** admonition.

!!! warning
    This is a **warning** admonition. Something requires attention.

!!! danger "Danger zone"
    This is a **danger** admonition. Irreversible action ahead.

!!! bug
    This is a **bug** admonition.

!!! example
    This is an **example** admonition.

!!! quote
    This is a **quote** admonition.

??? note "Collapsible (default collapsed)"
    Use `???` for admonitions that start collapsed. Add `+` after `???` to start expanded: `???+ note`.

???+ tip "Collapsible (forced expanded)"
    The `+` suffix overrides `default_collapsed` for a single block.

---

## Icons

Use `:icon-name:` shortcodes inline. Icons work in paragraphs, headings, and admonition titles.

**Material** (default library — shorthand without prefix):

:material-home: Home &nbsp; :material-settings: Settings &nbsp; :material-search: Search

**Font Awesome**:

:fontawesome-solid-heart: Solid &nbsp; :fontawesome-brands-github: GitHub &nbsp; :fontawesome-brands-docker: Docker

**Bootstrap Icons**:

:bootstrap-heart: Heart &nbsp; :bootstrap-github: GitHub &nbsp; :bootstrap-lightning: Lightning

Custom admonition title with icon shortcode:

!!! tip ":material-lightbulb: Pro tip"
    Icons also work inside admonition titles.

---

## Footnotes

Footnotes add supplemental detail without breaking the reading flow[^demo].

[^demo]: Enable with `markdown_extensions: [footnotes]`. References use `[^id]`; definitions use `[^id]: text`.

Multi-paragraph footnotes are supported[^long]:

[^long]:
    First paragraph of a longer note.

    Second paragraph, indented with four spaces.

---

## Horizontal rule

---

## Deeply nested navigation test

This page sits at the top level to confirm that relative links and asset paths still resolve correctly when navigation has multiple section depths. If the CSS and JS load, and the sidebar shows the correct active item, the path resolution is working.
