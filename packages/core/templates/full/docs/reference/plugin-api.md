---
title: Plugins
description: Configuration reference for ts-mkdocs plugins
tags:
  - Plugins
  - Configuration
  - Reference
groups:
  - Reference
authors:
  - kartjim
---

# Plugins

ts-mkdocs has a plugin system that extends the build process. Plugins are configured under the `plugins` key in `ts-mkdocs.yml`.

## Plugin Syntax

Plugins can be specified as simple strings or objects with options:

```yaml
plugins:
  - search                    # simple string
  - tags                      # simple string
  - sitemap:                  # object with options
      hostname: https://example.com
```

## Built-in Plugins

### search

Client-side search powered by Lunr.js. Enabled by default.

```yaml
plugins:
  - search
```

No configuration options. The search index is built automatically at compile time.

### tags

Tag system for categorizing pages.

```yaml
plugins:
  - tags:
      sort_by: count
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sort_by` | string | `count` | Sort tags by `count` or `name` |

Tags are defined in page frontmatter:

```yaml
---
tags:
  - Getting Started
  - Installation
---
```

### social

Social card meta tags (Open Graph, Twitter Cards).

```yaml
plugins:
  - social
```

No configuration options. Uses `site_name`, `site_description`, and `site_image` from config.

### meta

Meta tag support from `.meta.yml` files.

```yaml
plugins:
  - meta
```

No configuration options. Reads metadata from `.meta.yml` files in parent directories.

### sitemap

Generates `sitemap.xml` for search engines.

```yaml
plugins:
  - sitemap:
      hostname: https://example.com
      changefreq: weekly
      priority: 0.8
      exclude:
        - 404.html
        - tags/*
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hostname` | string | **required** | Site hostname for URLs |
| `changefreq` | string | `weekly` | Change frequency hint |
| `priority` | number | `0.8` | Page priority (0.0-1.0) |
| `exclude` | array | `[]` | URL patterns to exclude |

### robots

Generates `robots.txt` for search engine crawlers.

```yaml
plugins:
  - robots:
      sitemap: https://example.com/sitemap.xml
      rules:
        - user_agent: '*'
          disallow:
            - /admin/
          allow:
            - /
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sitemap` | string | auto | Sitemap URL (auto-detected from `site_url`) |
| `rules` | array | `[{user_agent: '*'}]` | Crawler rules |
| `extra` | array | `[]` | Extra directives |

#### Simple Shorthand

```yaml
plugins:
  - robots:
      disallow:
        - /admin/
        - /private/
```

### git-revision-date

Adds creation and update dates from Git history.

```yaml
plugins:
  - git-revision-date:
      enable_creation_date: true
      fallback_to_build_date: true
      source: git
      exclude:
        - index.md
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable_creation_date` | boolean | `true` | Add creation date from Git |
| `fallback_to_build_date` | boolean | `false` | Use build date if Git date unavailable |
| `source` | string | `git` | Date source: `git` or `filesystem` |
| `exclude` | array | `[]` | Pages to exclude |

### blog

Blog functionality (placeholder).

```yaml
plugins:
  - blog
```

No configuration options. Full blog support requires `post_dir` scanning.

### offline

Offline support (placeholder).

```yaml
plugins:
  - offline
```

No configuration options.

### privacy

Privacy-focused features (placeholder).

```yaml
plugins:
  - privacy
```

No configuration options.

### typeset

Typography enhancements (placeholder).

```yaml
plugins:
  - typeset
```

No configuration options.

### group

Content grouping (placeholder).

```yaml
plugins:
  - group
```

No configuration options.

### info

Site information (placeholder).

```yaml
plugins:
  - info
```

No configuration options.

## Default Plugins

When `plugins` is not specified, only `search` is enabled:

```yaml
plugins:
  - search
```

## External Plugins

Install external plugins as npm packages:

```bash
npm install ts-mkdocs-plugin-my-plugin
```

Configure in `ts-mkdocs.yml`:

```yaml
plugins:
  - my-plugin:
      option: value
```

Or specify a custom module name:

```yaml
plugins:
  - my-plugin:
      module: @scope/custom-plugin
```

## Plugin Development

See [Plugin API](plugin-api.md) for information on writing custom plugins.

## See Also

- [Configuration Reference](config.md) — All configuration options
- [Plugin API](plugin-api.md) — Writing custom plugins
- [CLI Reference](cli.md) — Command-line interface
