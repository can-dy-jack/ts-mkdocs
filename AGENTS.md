# ts-mkdocs — Agent Notes

## Monorepo basics
- **Package manager:** pnpm 9 (enforced via `packageManager` field). Do not use npm or yarn.
- **Workspace:** Two packages under `packages/`:
  - `core/` — build engine + CLI (package name `ts-mkdocs`)
  - `theme-material/` — Nunjucks templates + static assets (package name `ts-mkdocs-theme-material`)

## Build & dev
- `pnpm install` → `pnpm build` is the required first setup.
- `pnpm build` at root runs `tsup` in `packages/core` only. `theme-material` has **no build step**; templates and assets are consumed from source.
- `pnpm dev` runs `tsup --watch` in parallel across packages.
- `pnpm typecheck` runs `tsc --noEmit` across packages.
- `pnpm test` runs Vitest unit tests in `packages/core`.

## Running the example site
The example site validates changes end-to-end. **You must build first** because the scripts reference compiled output:
- `pnpm example:build` — runs `node packages/core/dist/cli.js build -f example/mkdocs.yml`
- `pnpm example:serve` — runs `node packages/core/dist/cli.js serve -f example/mkdocs.yml`

## Architecture gotchas
- **ESM only.** `tsup` outputs `esm`, target `node20`. All source uses `.js` extensions in imports.
- **Dynamic theme resolution.** `build.ts` loads the theme at runtime via `await import('ts-mkdocs-theme-material')`. The core package depends on the theme via `workspace:*`.
- **Feature flags.** `theme.features` in `mkdocs.yml` drives UI behavior via `features.ts` → template context + `material.js`.
- **Markdown extensions.** Configured via `markdown_extensions` in `mkdocs.yml`, applied in `markdown-extensions.ts`.
- **Plugins.** Built-in plugins in `packages/core/src/plugins/`. External plugins via `ts-mkdocs-plugin-<name>` npm packages.
- **Live reload uses SSE**, not WebSocket (`/__livereload` endpoint).
- **Default config behavior:** `use_directory_urls` defaults to `true`, so pages output as `path/index.html` rather than `path.html`.

## Entry points
- CLI commands live in `packages/core/src/cli.ts` (built to `dist/cli.js`).
- Public API is exported from `packages/core/src/index.ts` (built to `dist/index.js`).
- Theme paths are exported from `packages/theme-material/index.js` (`templatesDir`, `assetsDir`).

## Important paths
- Example config: `example/mkdocs.yml`
- Example docs source: `example/docs/`
- Example build output: `example/site/` (gitignored)
