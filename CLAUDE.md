# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ts-mkdocs is a TypeScript implementation of MkDocs with a built-in Material theme. It converts Markdown files into static HTML documentation sites.

- **Language:** TypeScript (ESM-only, Node 20+)
- **Package Manager:** pnpm 9 (enforced via `packageManager` field)
- **Build Tool:** tsup
- **Test Framework:** Vitest
- **Template Engine:** Nunjucks
- **Markdown Parser:** markdown-it with extensions

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (required before testing example)
pnpm dev                  # Watch mode for all packages
pnpm typecheck            # Type checking across packages
pnpm test                 # Run Vitest tests in packages/core
pnpm example:serve        # Start dev server with live reload (http://127.0.0.1:8000)
pnpm example:build        # Build example site to example/site/

# Single package
cd packages/core
pnpm test:watch           # Watch mode for tests
```

**Run a single test file:** `cd packages/core && npx vitest run src/__tests__/config.test.ts`

## Monorepo Structure

Two packages under `packages/`:

- **`core/`** — Build engine + CLI (published as `ts-mkdocs`). Entry points: `src/cli.ts` (CLI), `src/index.ts` (public API).
- **`theme-material/`** — Nunjucks templates + static assets (published as `ts-mkdocs-theme-material`). Exports `templatesDir`, `assetsDir`, `brandDir` from `index.js`.

The `example/` directory contains a test site with its own `mkdocs.yml`.

## Architecture

### Build Pipeline ([build.ts](packages/core/src/build.ts))

1. Config loaded from `mkdocs.yml`, validated with Zod ([config.ts](packages/core/src/config.ts))
2. Plugin lifecycle: `on_config` → `on_files` → `on_nav` → `on_page_markdown` → `on_page_content` → `on_post_build` ([plugins.ts](packages/core/src/plugins.ts))
3. Markdown files discovered from `docs_dir` ([files.ts](packages/core/src/files.ts))
4. Navigation tree built from config or inferred from file structure ([nav.ts](packages/core/src/nav.ts))
5. Each page rendered: frontmatter → markdown-it → Nunjucks template → HTML
6. Lunr.js search index generated ([search.ts](packages/core/src/search.ts))
7. Static output written to `site_dir`

### Key Abstractions

- **DocFile** — source file with `srcPath`, `srcUri`, `destPath`, `destUri`, `url`
- **Page** — loaded page with frontmatter, content, TOC
- **Navigation** — tree of `NavPage`, `NavSection`, `NavLink` items
- **Plugin** — event-driven hooks for build customization

### Dev Server ([serve.ts](packages/core/src/serve.ts))

Uses **SSE (Server-Sent Events)**, not WebSocket. Endpoint: `/__livereload`. Chokidar file watcher triggers rebuilds.

### Theme Resolution

Dynamic import: `await import('ts-mkdocs-theme-material')`. Core depends on theme via `workspace:*`.

### Markdown Extensions ([md/](packages/core/src/md/))

Custom markdown-it plugins implementing Material for MkDocs syntax: admonitions (`!!!`/`???`), content tabs (`===`), enhanced code blocks (superfences), Shiki syntax highlighting, annotations, task lists, icon shortcodes (`:icon-name:`), keyboard keys (`++key++`), highlight marks (`==text==`), superscript/subscript (`^text^`/`~text~`), insert/delete (`^^text^^`/`~~text~~`), footnotes, and file snippets (`--8<--`).

## Code Conventions

- **ESM Only:** All local imports must use `.js` extensions (e.g., `import { foo } from './bar.js'`)
- **TypeScript Strict:** Enabled in tsconfig
- **Target:** Node 20, module NodeNext

## Environment Variables

- `TS_MKDOCS_GITHUB_TOKEN` / `GITHUB_TOKEN` / `GH_TOKEN` — GitHub API token for repo stats (server-side only, never shipped to browser)

## Gotchas

- Must run `pnpm build` before `pnpm example:serve` or `pnpm example:build`
- `use_directory_urls` defaults to `true` (outputs `path/index.html` instead of `path.html`)
