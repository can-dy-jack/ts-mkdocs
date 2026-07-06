---
title: Comments
description: Giscus and Utterances comment systems via extra.comments
tags:
  - Comments
  - Configuration
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
comments: true
---

# Comments

ts-mkdocs supports [Giscus](https://giscus.app/) and [Utterances](https://utteranc.es/) — both use GitHub as the backend and load in the browser. No Personal Access Token is required; visitors authorize via GitHub OAuth when posting.

Comments appear at the bottom of a page when **both** conditions are met:

1. `extra.comments` is configured in `ts-mkdocs.yml`
2. The page sets `comments: true` in front matter (or inherits it from `.meta.yml`)

## Giscus configuration

Install the [Giscus GitHub App](https://github.com/apps/giscus) on the repository that hosts discussions, then generate IDs from the [Giscus setup page](https://giscus.app/).

```yaml
extra:
  comments:
    provider: giscus
    repo: owner/repo
    repo_id: R_xxxxxxxx
    category: General
    category_id: DIC_xxxxxxxx
    mapping: pathname
    reactions_enabled: true
    input_position: bottom
    theme: gruvbox_light
    theme_dark: gruvbox_dark   # optional — sync with site dark mode
    lang: zh-CN
```

| Field | Giscus attribute | Description |
| --- | --- | --- |
| `input_position` | `data-input-position` | Comment box position: `top` or `bottom` (default: `bottom`) |
| `theme` | `data-theme` | Giscus theme name, e.g. `light`, `gruvbox_light` |
| `lang` | `data-lang` | Widget language, e.g. `en`, `zh-CN` |

## Utterances configuration

Enable GitHub Issues on the target repository and install the [Utterances app](https://github.com/apps/utterances).

```yaml
extra:
  comments:
    provider: utterances
    repo: owner/repo
    issue_term: pathname
    label: comments
    theme: github-light
    theme_dark: github-dark   # optional
```

## Enable comments on a page

```yaml
---
comments: true
---
```

## Enable comments for a folder

Add `.meta.yml` in the folder (requires the `meta` plugin):

```yaml
comments: true
```

Disable on a specific page with `comments: false` in that page's front matter.

## Theme sync

When `theme_dark` is set, the comment widget switches themes automatically when the reader toggles light/dark mode. If omitted, the widget keeps the fixed `theme` value.

## This page

This page has `comments: true` in front matter. If `extra.comments` is configured in `ts-mkdocs.yml`, you should see the comment section below.
