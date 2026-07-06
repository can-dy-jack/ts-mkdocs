---
title: Installation
description: How to install ts-mkdocs and create your first project
tags:
  - Installation
  - Setup
  - Guide
groups:
  - Guide
authors:
  - kartjim
---

# Installation

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** (or npm / yarn)

## Install the CLI

```bash
# Global install (recommended)
npm install -g ts-mkdocs

# Or with pnpm
pnpm add -g ts-mkdocs
```

## Create a new project

```bash
ts-mkdocs new my-docs
cd my-docs
```

This generates:

```
my-docs/
├── ts-mkdocs.yml
└── docs/
    └── index.md
```

## Start the dev server

```bash
ts-mkdocs serve
```

Open <http://127.0.0.1:8000> in your browser. The page reloads automatically when you save a file.

## Build for production

```bash
ts-mkdocs build
```

Output lands in `site/` (or whatever `site_dir` is set to in `ts-mkdocs.yml`).

!!! note
    Add `site/` to your `.gitignore` — it is generated output and should not be committed.

## Next step

Head to [Configuration](configuration.md) to customise the theme, navigation, and plugins.
