---
title: Frontmatter
description: Per-page metadata via YAML frontmatter and inherited .meta.yml files
tags:
  - Frontmatter
  - Configuration
  - Guide
groups:
  - Guide
date: 2026-07-01
updated: 2026-07-02
authors:
  - kartjim
---

# Frontmatter

Each Markdown page can declare metadata in YAML frontmatter at the top of the file. ts-mkdocs reads these fields during the build and exposes them to templates, search, and plugins.

## Supported fields

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Page title (overrides the first `#` heading) |
| `description` | string | Page description for `<meta name="description">` |
| `subtitle` | string | Optional subtitle shown in navigation |
| `template` | string | Custom template name (e.g. `home`) |
| `icon` | string | Icon shortcode for navigation |
| `status` | string | Page status identifier |
| `tags` | list | Tags shown at the bottom of the page; when the `tags` plugin is enabled, tags link to `/tags/{slug}/` archive pages |
| `groups` | list | Logical groups shown below the title with a folder icon |
| `authors` | list | Author identifiers defined in `extra.authors` (see below) |
| `readtime` | number | Override reading time in minutes |
| `reading_time` | boolean | Set to `false` to disable automatic reading time |
| `date` | date | Publish / creation date (`created`, `published` aliases) |
| `updated` | date | Last updated date (`modified` alias) |
| `edit_url` | string | Full edit link override |
| `edit_uri` | string | Edit path override relative to `repo_url` |
| `hide` | list | Hide UI elements: `tags`, `groups`, `dates`, `authors`, `readtime`, `meta`, `footer` |
| `search` | object | Search tuning: `boost`, `exclude` |
| `hero` | object | Homepage hero: `title`, `tagline` |
| `robots` | string | Value for `<meta name="robots">` |

## Example

```yaml
---
title: My Page
description: A short summary for search engines and social cards
tags:
  - API
  - Reference
groups:
  - Backend
date: 2024-06-01
updated: 2024-12-15
authors:
  - alice
  - bob
edit_uri: edit/main/docs/custom-path.md
hide:
  - footer
search:
  boost: 2
---
```

## Custom edit link

Global edit links come from `repo_url` and `edit_uri` in `mkdocs.yml`. Override them per page when the source file lives outside the default docs folder:

- `edit_url` — absolute URL, or a path appended to `repo_url`
- `edit_uri` — path relative to `repo_url` that replaces the global edit path entirely

## Inherited metadata (`.meta.yml`)

Enable the `meta` plugin to merge metadata from `.meta.yml` files in parent folders. Array fields such as `tags`, `groups`, `authors`, and `hide` are appended; other fields are overridden by the page frontmatter.

`guide/.meta.yml`:

```yaml
tags:
  - Guide
groups:
  - Documentation
```

`guide/setup.md`:

```yaml
---
title: Setup
tags:
  - Installation
---
```

The page receives `tags: [Guide, Installation]` and `groups: [Documentation]`.

## Hiding metadata

Use the `hide` frontmatter list to suppress specific metadata blocks:

```yaml
---
hide:
  - tags
  - dates
---
```

Available values: `tags`, `groups`, `dates`, `authors`, `readtime`, `meta`.

## Tags system

Enable the built-in `tags` plugin to activate the full tag system:

```yaml
plugins:
  - tags
```

With the plugin enabled, ts-mkdocs automatically:

- Aggregates all page tags during the build
- Generates a **tag index** at `/tags/` with a tag cloud and grouped listings
- Generates a **per-tag archive page** at `/tags/{slug}/` for each tag
- Makes page tags clickable links to their archive pages
- Supports client-side filtering on the tag index page

Optional plugin configuration:

```yaml
plugins:
  - tags:
      sort_by: count   # count (default) or name
```

Tags are also merged into the Lunr search index, so searching for a tag name finds related pages.

Browse all tags at [Tags](/tags/).

## Authors

Define authors globally in `mkdocs.yml`, then reference them by identifier in page frontmatter:

```yaml
extra:
  authors:
    alice:
      name: Alice Doe
      title: Core Maintainer
      avatar: assets/authors/alice.jpg   # relative to docs_dir
      url:
        x: alice
        github: alice
        website: https://alice.example.com
    bob:
      name: Bob Lee
      title: Contributor
      avatar: https://example.com/bob.png
      url:
        bilibili: "123456"
        qq: "10001"
        wechat: bob_wechat_id
        reddit: boblee
```

`url` accepts either a **website string** or a **platform map**. Supported platforms include `x`, `reddit`, `youtube`, `wechat`, `qq`, `bilibili`, `github`, `linkedin`, `discord`, `facebook`, `instagram`, `tiktok`, and `website`. Usernames are expanded to profile URLs automatically; full URLs are used as-is. WeChat IDs render as a static icon with tooltip (no public link).

```yaml
---
authors:
  - alice
  - team
---
```

Authors render below the meta bar with avatar, name, title, and social link icons.

## Reading time

Reading time is computed automatically from page content. Configure it in `mkdocs.yml`:

```yaml
extra:
  reading_time:
    enabled: true
    words_per_minute: 265      # same default as Material blog plugin
    cjk_chars_per_minute: 500  # CJK characters per minute
    exclude_code: true         # ignore fenced code blocks
    min_minutes: 1
```

Override per page with frontmatter:

```yaml
readtime: 10          # force 10 minutes
reading_time: false   # disable for this page
```
