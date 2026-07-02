---
title: Combinations
description: Real-world layouts mixing multiple Markdown extensions
tags:
  - Showcase
  - Nesting
groups:
  - Showcase
date: 2026-07-01
updated: 2026-07-02
authors:
  - kartjim
---

# Combinations

Individual syntax pages show each feature in isolation. This page demonstrates **nested and mixed** patterns you will use in real documentation.

## Tabs + admonitions + code

=== "Setup"

    !!! tip "First time?"
            Run `pnpm install` once at the repo root.
            ```bash
            pnpm build
            pnpm example:serve
            ```

=== "Config"

    !!! note "Required keys"
        | Key | Purpose |
        |-----|---------|
        | `site_name` | Browser title |
        | `docs_dir` | Markdown source |

    ```yaml
    site_name: My Docs
    docs_dir: docs
    ```

## Admonition + task list + icons

!!! example ":material-checklist: Release checklist"
    - [x] Update [Changelog](../../changelog.md)
    - [x] Run `pnpm test`
    - [ ] Build example site
    - [ ] Tag version on GitHub

## Table + footnotes + links

| Command | Description |
|---------|-------------|
| `ts-mkdocs build` | One-shot static build[^build] |
| `ts-mkdocs serve` | Dev server with live reload[^serve] |

[^build]: Output lands in `site_dir` (default `site/`).
[^serve]: Watches `docs_dir` and rebuilds on save.

## Heading + mark + keys + footnote

### ==Quick== reference {: #quick-ref }

Press ++Ctrl+F++ to search the docs[^search]. See [Code Blocks](../extended/code-blocks.md) for theme features.

[^search]: Requires the `search` plugin in `mkdocs.yml`.

## Nested quotes and callouts

!!! quote "From the project README"
    > Build beautiful docs in TypeScript — no Python required.

    — tagline on the [home page](../../index.md)

## Icons + tabs + task lists

=== ":material-code: Dev"

    - [x] `pnpm dev`
    - [ ] Fix warnings

=== ":material-rocket: Ship"

    - [ ] `pnpm build`
    - [ ] Deploy `site/`

## Deep navigation sanity check

This page lives under **Feature Showcase / Combinations**. Verify:

- Sidebar shows the nested section and active item
- Prev/next footer links work (`navigation.footer`)
- CSS, JS, and fonts load correctly at this depth
- Relative links like [Overview](../index.md) resolve

If all of the above pass, path resolution and theme assets are working end-to-end.
