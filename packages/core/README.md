# ts-mkdocs

A TypeScript implementation of MkDocs with a built-in Material theme. Converts Markdown files into static HTML documentation sites — no Python required.

## Features

- **Material Design Theme** — Built-in Material theme with dark mode, search, navigation tabs, code highlighting, and more
- **Markdown Extensions** — Admonitions, content tabs, code blocks, task lists, footnotes, math (KaTeX), Mermaid diagrams, and more
- **Full-text Search** — Powered by Lunr.js, with multi-language support
- **Plugin System** — Extensible build pipeline with lifecycle hooks
- **Live Reload** — Dev server with instant preview via Server-Sent Events
- **i18n Support** — Multi-language documentation out of the box

## Quick Start

```bash
# Create a new project
npx ts-mkdocs new my-docs

# Or with a template
npx ts-mkdocs new my-docs --template full      # Complete example
npx ts-mkdocs new my-docs --template minimal    # Basic starter

# Install and start
cd my-docs
npm install
npm run dev
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

The generated project is a standard npm package with `package.json`, `.gitignore`, `ts-mkdocs.yml`, and a `docs/` directory.

## CLI Commands

### `ts-mkdocs new <directory>`

Scaffold a new project. Generates a standard npm package ready to install and run.

```bash
npx ts-mkdocs new my-docs
npx ts-mkdocs new my-docs --template minimal
npx ts-mkdocs new my-docs --template full
```

| Flag | Default | Description |
|------|---------|-------------|
| `-t, --template <type>` | — | Use a template: `full` or `minimal` |

Generated project structure:

```
my-docs/
├── package.json        # npm scripts: dev, build, preview
├── .gitignore
├── ts-mkdocs.yml       # Site configuration
└── docs/               # Markdown source files
    └── index.md
```

Available npm scripts:

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `ts-mkdocs serve` | Start dev server with live reload |
| `npm run build` | `ts-mkdocs build` | Build static site to `site/` |
| `npm run preview` | `ts-mkdocs build && npx serve site` | Build and preview locally |

### `ts-mkdocs build`

Build the static site.

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --config-file <path>` | `ts-mkdocs.yml` | Config file path |
| `-d, --site-dir <path>` | from config | Override output directory |
| `--strict` | `false` | Treat warnings as errors |

### `ts-mkdocs serve`

Start the development server with live reload.

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --config-file <path>` | `ts-mkdocs.yml` | Config file path |
| `-a, --dev-addr <host:port>` | `127.0.0.1:8000` | Bind address |
| `--open` | `false` | Open browser on start |

## Programmatic API

```ts
import { loadConfig, build, serve } from 'ts-mkdocs'

const config = loadConfig('ts-mkdocs.yml')
await build(config)           // Build static site
await serve(config, options)  // Start dev server
```

## Configuration

Create a `ts-mkdocs.yml` in your project root:

```yaml
site_name: My Docs
site_description: My documentation site
docs_dir: docs
site_dir: site

theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
    - scheme: slate
      primary: indigo

plugins:
  - search
```

See the [full configuration reference](https://ts-mkdocs.example.com/reference/config/) for all options.

## License

MIT
