---
title: Quick Start
description: Get up and running with ts-mkdocs in 5 minutes
tags:
  - Quick Start
  - Installation
  - Setup
groups:
  - Tutorial
authors:
  - kartjim
---

# Quick Start

Get your documentation site up and running in 5 minutes.

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** (or npm / yarn)

## Step 1: Install the CLI

```bash
# Global install (recommended)
npm install -g ts-mkdocs

# Or with pnpm
pnpm add -g ts-mkdocs
```

## Step 2: Create a new project

```bash
ts-mkdocs new my-docs
cd my-docs
```

This generates a starter project:

```
my-docs/
├── ts-mkdocs.yml    # site configuration
└── docs/
    └── index.md     # home page
```

## Step 3: Start the dev server

```bash
ts-mkdocs serve
```

Open <http://127.0.0.1:8000> in your browser. The page reloads automatically when you save a file.

## Step 4: Add content

Create new Markdown files in the `docs/` directory:

```bash
# Create a guide directory
mkdir docs/guide

# Create a new page
echo "# Getting Started\n\nWelcome to the guide!" > docs/guide/getting-started.md
```

Add the page to your navigation in `ts-mkdocs.yml`:

```yaml
nav:
  - Home: index.md
  - Guide:
    - Getting Started: guide/getting-started.md
```

## Step 5: Build for production

```bash
ts-mkdocs build
```

Output lands in `site/` (or whatever `site_dir` is set to in `ts-mkdocs.yml`).

!!! note
    Add `site/` to your `.gitignore` — it is generated output and should not be committed.

## Project Structure

A typical ts-mkdocs project looks like this:

```
my-docs/
├── ts-mkdocs.yml         # site configuration
├── docs/                 # source Markdown files
│   ├── index.md          # home page
│   ├── guide/            # documentation pages
│   │   ├── getting-started.md
│   │   └── configuration.md
│   └── assets/           # custom CSS/JS
│       ├── custom.css
│       └── custom.js
└── site/                 # generated output (gitignore this)
```

## Next Steps

- [Features](features.md) — Learn about all available features
- [Basic Configuration](basic-config.md) — Customize your site
- [Syntax Reference](../syntax/index.md) — Markdown syntax guide
