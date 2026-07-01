---
title: Icons
description: Inline icon shortcodes from Material, Font Awesome, Bootstrap
---

# Icons

Embed icons inline with `:library-name:` shortcodes. Icons work in paragraphs, headings, admonition titles, and tables.

## Configuration

```yaml
theme:
  icons:
    default: material
    libraries:
      - material
      - fontawesome
      - bootstrap
```

## Basic syntax

```markdown
:material-home: Home
:fontawesome-brands-github: GitHub
:bootstrap-heart: Heart
```

## Rendered output

**Material** (default library — shorthand without prefix):

:material-home: Home &nbsp; :material-settings: Settings &nbsp; :material-search: Search

**Font Awesome**:

:fontawesome-solid-heart: Solid &nbsp; :fontawesome-brands-github: GitHub &nbsp; :fontawesome-brands-docker: Docker

**Bootstrap Icons**:

:bootstrap-heart: Heart &nbsp; :bootstrap-github: GitHub &nbsp; :bootstrap-lightning: Lightning

## Extended syntax

### Explicit library prefix

When multiple libraries define the same name, use the full prefix:

```markdown
:material-lightbulb:
:fontawesome-solid-lightbulb:
```

:material-lightbulb: Material &nbsp; :fontawesome-solid-lightbulb: Font Awesome

### Icons in headings

## :material-rocket: Launch checklist

## Advanced usage

### Icons in admonition titles

```markdown
!!! tip ":material-lightbulb: Pro tip"
    Body text here.
```

!!! tip ":material-lightbulb: Pro tip"
    Icons also work inside quoted admonition titles.

### Icons in tables

| Icon | Label |
|------|-------|
| :material-code-braces: | Code |
| :material-book: | Docs |

## Combining with other syntax

Icons + tabs:

=== ":material-javascript: JS"

    Use `npm install`.

=== ":material-terminal: Shell"

    Use `pnpm install`.

Icons + links:

:fontawesome-brands-github: [Repository](https://github.com/can-dy-jack/ts-mkdocs)
