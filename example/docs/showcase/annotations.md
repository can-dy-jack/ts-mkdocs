---
title: Annotations
description: Clickable numbered markers that expand a Markdown tooltip — in text, admonitions, tabs and code blocks
---

# Annotations

Little numbered markers that can be placed almost anywhere in a document and expand a tooltip containing arbitrary Markdown on click or keyboard focus.

## Configuration

```yaml
markdown_extensions:
  - attr_list
  - pymdownx.superfences

theme:
  features:
    - content.code.annotate # enables annotations in every code block globally enables annotations in every code block globally enables annotations in every code block globally
```

- [Attributes](attributes.md) — required for text/block annotations (the `{ .annotate }` marker)
- `content.code.annotate` — optional; enables annotations in **every** code block without needing `{ .annotate }` on each fence

## Usage

### Using annotations

Annotations consist of two parts: a marker placed anywhere inside a block tagged with the `annotate` class, and content in an ordered list right below the block:

```markdown
Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
{ .annotate }

1.  :material-lightbulb: I'm an annotation! I can contain `code`, **formatted
    text**, images, ... basically anything that can be written in Markdown.
```

Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
{ .annotate }

1.  :material-lightbulb: I'm an annotation! I can contain `code`, **formatted
    text**, images, ... basically anything that can be written in Markdown.

Note that the `annotate` class must only be added to the outermost block — nested elements share the same trailing list.

### Nested annotations

An annotation's own content can host another annotation. `{ .annotate }` on a bare list item attaches to the *whole list* rather than that one item, so wrap the nested marker in an explicit `<div class="annotate">` instead:

```markdown
Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
{ .annotate }

1.  <div class="annotate">I'm an annotation! (1)</div>

    1.  I'm an annotation as well!
```

Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
{ .annotate }

1.  <div class="annotate">I'm an annotation! (1)</div>

    1.  I'm an annotation as well!

### In admonitions

Add the `annotate` modifier right after the admonition type to host annotations in the title and body:

```markdown
!!! note annotate "Phasellus posuere in sem ut cursus (1)"

    Lorem ipsum dolor sit amet, (2) consectetur adipiscing elit.

1.  I'm an annotation in the title!
2.  I'm an annotation in the body!
```

!!! note annotate "Phasellus posuere in sem ut cursus (1)"

    Lorem ipsum dolor sit amet, (2) consectetur adipiscing elit.

1.  I'm an annotation in the title!
2.  I'm an annotation in the body!

### In content tabs

Add `{ .annotate }` to the paragraph inside a specific tab (not to the `tabbed-set` container):

```markdown
=== "Tab 1"

    Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
    { .annotate }

    1.  I'm an annotation!

=== "Tab 2"

    Phasellus posuere in sem ut cursus (1)
    { .annotate }

    1.  I'm an annotation as well!
```

=== "Tab 1"

    Lorem ipsum dolor sit amet, (1) consectetur adipiscing elit.
    { .annotate }

    1.  I'm an annotation!

=== "Tab 2"

    Phasellus posuere in sem ut cursus (1)
    { .annotate }

    1.  I'm an annotation as well!

## Code annotations

Add numeric markers in comments at the end of a line inside a fenced code block. Append `!` to strip the comment entirely, leaving only the marker.

### Enabled globally

With `content.code.annotate` enabled in `theme.features` (see [Configuration](#configuration)), every fenced code block picks up annotations automatically:

````markdown
```python
def build(config):
    site = Site(config)  # (1)!
    site.render()
    return site  # (2)!
```

1.  Creates the in-memory site model from the parsed config.
2.  Renders every page and writes it to `site_dir`.
````

```python
def build(config):
    site = Site(config)  # (1)!
    site.render()
    return site  # (2)!
```

1.  Creates the in-memory site model from the parsed config.
2.  Renders every page and writes it to `site_dir`.

### Enabled per block

If you don't want annotations enabled globally, opt in per fence with `{ .lang .annotate }`:

````markdown
```{ .yaml .annotate }
theme:
  features:
    - content.code.annotate # (1)!
```

1.  Turns on annotations for every code block, site-wide.
````

```{ .yaml .annotate }
theme:
  features:
    - content.code.annotate # (1)!
```

1.  Turns on annotations for every code block, site-wide.

### Keeping the comment text

Without the trailing `!`, the comment leader is kept and only the digits become the marker:

```{ .bash .annotate }
pnpm build   # (1)
pnpm test    # (2)
```

1.  Compiles `packages/core` with `tsup`.
2.  Runs the Vitest suite.

## Advanced usage

### Custom annotation icon

```yaml
theme:
  icon:
    annotation: material/arrow-right-circle
```

Changes the marker icon site-wide; falls back to a filled plus-circle icon by default.

## Combining with other syntax

Annotations inside tabs — see [Content Tabs](tabs.md). Annotations inside admonitions — see [Admonitions](admonitions.md). More combinations: [Combinations](combinations.md).
