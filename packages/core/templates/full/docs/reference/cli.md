---
title: CLI Reference
description: All ts-mkdocs command-line commands and flags
tags:
  - CLI
  - Reference
  - Commands
groups:
  - Reference
authors:
  - kartjim
---

# CLI Reference

## `ts-mkdocs new <directory>`

Scaffold a new project. Every project is a standard npm package with `package.json`, ready to `npm install` and run.

```bash
# Default: minimal starter project
npx ts-mkdocs new my-docs

# Minimal template: basic starter with index and getting-started page
npx ts-mkdocs new my-docs --template minimal

# Full template: complete example with all features demonstrated
npx ts-mkdocs new my-docs --template full

# Then start developing
cd my-docs
npm install
npm run dev
```

| Flag | Default | Description |
|------|---------|-------------|
| `-t, --template <type>` | — | Use a template: `full` (complete example) or `minimal` (basic starter) |

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

Templates:

- **`minimal`** — A clean starter with `index.md` and `getting-started.md`, ready for your own content.
- **`full`** — The complete example site used in the ts-mkdocs documentation, showcasing all features: syntax extensions, admonitions, code blocks, tabs, search, and more. Great for exploring what ts-mkdocs can do.

---

## `ts-mkdocs build`

Build the static site.

```bash
ts-mkdocs build
ts-mkdocs build -f path/to/ts-mkdocs.yml
ts-mkdocs build -d /tmp/output
ts-mkdocs build --strict
```

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --config-file <path>` | `ts-mkdocs.yml` | Config file path |
| `-d, --site-dir <path>` | from config | Override output directory |
| `--strict` | `false` | Treat warnings as errors |

---

## `ts-mkdocs serve`

Start the development server.

```bash
ts-mkdocs serve
ts-mkdocs serve -a 0.0.0.0:3000
ts-mkdocs serve --open
```

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --config-file <path>` | `ts-mkdocs.yml` | Config file path |
| `-a, --dev-addr <host:port>` | `127.0.0.1:8000` | Bind address |
| `--open` | `false` | Open browser on start |

The server watches `docs_dir` for changes and rebuilds automatically. Browsers receive a reload signal via Server-Sent Events — no page refresh needed.
