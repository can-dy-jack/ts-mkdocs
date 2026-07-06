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

Scaffold a new project.

```bash
ts-mkdocs new my-docs
```

Creates `ts-mkdocs.yml` and `docs/index.md` inside `<directory>`.

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
