---
title: Frontmatter
description: Per-page metadata via YAML frontmatter and inherited .meta.yml files
tags:
  - Frontmatter
  - Configuration
  - Guide
groups:
  - Guide
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
| `hide` | list | Hide UI elements: `tags`, `groups`, `dates`, `authors`, `readtime`, `license`, `meta`, `footer` |
| `license` | bool / string / object | Article license declaration override (`false` to hide); see [Article license](#article-license) |
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

Available values: `tags`, `groups`, `dates`, `authors`, `readtime`, `license`, `meta`.

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

## Article license

When enabled, a license declaration card is rendered at the bottom of each page (above tags). It shows the article title, canonical URL, author, publish date, license type, and a footer notice.

Configure globally in `mkdocs.yml`:

```yaml
site_url: https://example.com/   # required for the article URL line

extra:
  license:
    enabled: true
    preset: cc-by-nc-sa-4.0        # default when enabled
    author: Site Author            # fallback when the page has no authors
    notice: Custom footer notice   # optional; overrides the preset notice
    show_url: true                 # default: true
    show_author: true              # default: true
    show_date: true                # default: true
```

| Field | Type | Description |
| --- | --- | --- |
| `enabled` | boolean | Turn the declaration card on or off site-wide |
| `preset` | string | Built-in license preset. Currently supported: `cc-by-nc-sa-4.0` |
| `author` | string | Default author name when a page has no `authors` frontmatter |
| `notice` | string | Footer notice text override |
| `name` | string | License name override (e.g. `CC BY-NC-SA 4.0`) |
| `url` | string | License link override |
| `show_url` | boolean | Show the article URL line (default: `true`) |
| `show_author` | boolean | Show the author column (default: `true`) |
| `show_date` | boolean | Show the publish date column (default: `true`) |

Field population rules:

- **Title** — page `title` frontmatter (or first `#` heading)
- **URL** — `site_url` + page path; hidden when `site_url` is not set
- **Author** — page `authors` (resolved via `extra.authors`), then `extra.license.author`, then `site_author`
- **Date** — page `date` frontmatter, formatted as `YYYY-MM-DD`
- **Notice** — localized preset text based on `theme.language`, unless overridden by `notice`

Override per page with frontmatter:

```yaml
---
license: false   # hide the card on this page
---
```

```yaml
---
license: cc-by-nc-sa-4.0
---
```

```yaml
---
license:
  author: Alice
  notice: Custom notice for this page only.
  page_url: https://example.com/custom-url/
  date: 2026-02-16
---
```

Or hide via `hide`:

```yaml
---
hide:
  - license
---
```

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
