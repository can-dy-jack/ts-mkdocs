---
title: Images
description: Markdown images, relative paths, and lightbox zoom
tags:
  - Images
  - Markdown
  - Showcase
groups:
  - Showcase
date: 2026-07-02
updated: 2026-07-02
authors:
  - kartjim
---

# Images

Standard Markdown image syntax with path rewriting for nested pages and optional lightbox zoom.

## Configuration

Images work out of the box. Enable the lightbox (click to zoom, keyboard ← → to browse) with a theme feature:

```yaml
theme:
  features:
    - content.image.lightbox
```

Non-Markdown files under `docs/` (png, jpg, svg, …) are copied to the site output with the same relative path.

## Basic syntax

```markdown
![Site logo](../../assets/logo.svg)

![Favicon](../assets/favicon.svg)
```

## Rendered output

### Docs-relative path

From this page (`showcase/extended/images.md`), paths resolve relative to the **source file**, then rewrite to URLs relative to this page:

![Site logo](./logo.svg)

### Same-folder reference

Place assets next to the page or use `../` segments as needed.

## Path types

| Reference | Example | Resolves to |
|-----------|---------|-------------|
| Relative to source file | `../../assets/logo.svg` | `docs/assets/logo.svg` |
| Docs-root relative | `assets/logo.svg` on `index.md` | `docs/assets/logo.svg` |
| Site-root absolute | `/assets/logo.svg` | `/assets/logo.svg` (unchanged) |
| External URL | `https://…` | Used as-is |

### Site-root absolute

```markdown
![Logo from site root](/assets/logo.svg)
```

![Logo from site root](/assets/logo.svg)

### External image

```markdown
![GitHub mark](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)
```

![GitHub mark](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)

## Lightbox gallery

When `content.image.lightbox` is enabled, images in the page body become a gallery — click to zoom, then use **←** / **→** or on-screen controls to move between images on the same page.

Try clicking any image on this page.

### Skip lightbox for one image

Use `data-no-lightbox` via `attr_list` or raw HTML:

```markdown
![Decorative](../../assets/favicon.svg){ data-no-lightbox }
```

## Linked images

Markdown links around images keep a single anchor; the lightbox opens the link target:

```markdown
[![Logo](../../assets/logo.svg)](../../assets/logo.svg)
```

[![Logo](../../assets/logo.svg)](../../assets/logo.svg)

## Advanced usage

### Multiple images in one section

![Logo A](../../assets/logo.svg)

![Logo B](../../assets/favicon.svg)

Use arrow keys in the lightbox to switch between **Logo A** and **Logo B**.

### Images in admonitions

!!! tip
    ![Inline logo](../../assets/favicon.svg)

    Images inside callouts participate in the same page gallery.

## Combining with other syntax

See [Attributes](attributes.md) for `{ .class #id }` on images and [Text & Links](../basic/text.md) for standard links.
