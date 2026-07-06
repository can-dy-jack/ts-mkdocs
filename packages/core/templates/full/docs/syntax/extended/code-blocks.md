---
title: Code Blocks
description: Fenced code, Shiki highlighting, copy button, line numbers, hl_lines, diff highlighting
tags:
  - Code
  - Syntax Highlighting
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Code Blocks

Fenced code blocks use **Shiki** for syntax highlighting. Theme features add copy buttons, line numbers, and language badges.

## Configuration

```yaml
markdown_extensions:
  - md.fences

theme:
  highlight:
    theme_light: catppuccin-latte
    theme_dark: github-dark
  features:
    - content.code.copy
    - content.code.linenumbers
    - content.code.lang
    - content.code.wrap
```

## Basic syntax

Wrap code in triple backticks with an optional language identifier:

````markdown
```typescript
const greeting = 'hello'
console.log(greeting)
```
````

## Rendered output

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

## Extended syntax

### Other languages

```python
def load_config(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)
```

```bash
pnpm install
pnpm build
pnpm example:serve
```

```json
{
  "site_name": "My Docs",
  "theme": { "name": "material" }
}
```

### Plain text (no language)

```
No highlighting when the language is omitted or unknown.
```

### Code block title

Add a centered title in the code block head with `title="..."` on the fence info line:

````markdown
```typescript title="src/build.ts"
async function buildPage(file: DocFile): Promise<string> {
  return renderMarkdown(markdown)
}
```
````

Rendered output:

```typescript title="src/build.ts"
async function buildPage(file: DocFile): Promise<string> {
  const markdown = await fs.readFile(file.srcPath, 'utf-8')
  return renderMarkdown(markdown)
}
```

With `content.code.lang` enabled, the title appears centered and the language label stays on the left.

You can also set the title with `attr_list` on the opening fence:

````markdown
``` { .typescript title="greeting.ts" }
const greeting = 'hello'
```
````

### Highlighting specific lines

Pass line numbers to `hl_lines` right after the language shortcode. Line counts start at `1`:

````markdown
```python hl_lines="2 3"
def bubble_sort(items):
    for i in range(len(items)):
        for j in range(len(items) - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
```
````

Line ranges use a hyphen: `hl_lines="3-5"`.

Rendered output (lines 2–3 highlighted):

```python hl_lines="2 3"
def bubble_sort(items):
    for i in range(len(items)):
        for j in range(len(items) - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
```

With `attr_list`:

````markdown
``` { .python hl_lines="2 4-5" }
def example():
    highlighted = True
    normal = 1
    also = 2
    highlighted_too = 3
```
````

### Diff highlighting

Use the `diff` language for unified-diff style blocks with `+`/`-` line markers and Material-style row backgrounds:

```diff
- const old = 'removed'
+ const updated = 'added'
  const unchanged = 'context'
```

Combine diff markers with syntax highlighting via `diff-lang` (strip prefixes, highlight with the underlying language):

```diff-python
- def greet():
-     print('hello')
+ def greet():
+     print('hello, world')
```

## Advanced usage

### Blank lines inside blocks

Blank lines are preserved and should not overlap adjacent lines when line numbers are enabled:

```typescript
function example() {
  const a = 1

  const b = 2
  return a + b
}
```

### Mermaid diagrams

Mermaid diagrams use the `mermaid` fence language and are rendered client-side. See the dedicated [Mermaid](../advanced/mermaid.md) page for configuration, CDN options, and more diagram types.

## Theme features in action

When the example theme features are on, each block above should show:

| Feature | What you see |
|---------|----------------|
| `content.code.lang` | Language label in the top bar |
| Code block `title="..."` | Centered title in the top bar |
| `content.code.copy` | Copy button on hover |
| `content.code.wrap` | Line wrap toggle in the top bar |
| `content.code.linenumbers` | Gutter line numbers |
| `hl_lines="..."` | Highlighted rows with left accent bar |
| `diff` / `diff-lang` | Red/green row backgrounds with +/- markers |

## Combining with other syntax

Code inside tabs — see [Content Tabs](../advanced/tabs.md):

=== "TypeScript"

    ```typescript
    export function build(): void {}
    ```

=== "Python"

    ```python
    def build() -> None:
        pass
    ```

Code inside admonitions:

!!! example "Config snippet"
    ```yaml
    site_name: My Docs
    ```

Inline `` `code` `` in prose is separate from fenced blocks — see [Text & Links](../basic/text.md).
