---
title: Mermaid
description: Flowcharts, sequence diagrams, and other Mermaid charts from code fences
tags:
  - Mermaid
  - Diagrams
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Mermaid

ts-mkdocs renders [Mermaid](https://mermaid.js.org/) diagrams from ` ```mermaid ` code fences when `md.fences` is enabled (included by default). The library is loaded from a CDN at build time — no extra `extra_javascript` wiring is required.

> https://mermaid.js.org/intro/getting-started.html

## Configuration

Configure Mermaid under the `mermaid` key inside `md.fences`:

```yaml
markdown_extensions:
  - md.fences:
      mermaid:
        version: "10.9.3"
        cdn:
          base: https://cdn.jsdelivr.net/npm/mermaid@10.9.3/dist
        theme: auto
```

### CDN

`cdn.base` is expanded automatically into:

| Asset | Resolved URL |
|-------|--------------|
| JavaScript | `{base}/mermaid.min.js` |

You can also override the script URL directly:

```yaml
markdown_extensions:
  - md.fences:
      mermaid:
        cdn:
          javascript: https://cdn.example.com/mermaid.min.js
```

If `cdn` is omitted entirely, ts-mkdocs falls back to jsDelivr defaults derived from `version`.

### Theme and diagram options

```yaml
markdown_extensions:
  - md.fences:
      mermaid:
        theme: auto          # auto | default | dark | forest | neutral | base | null
        securityLevel: strict
        themeVariables:
          primaryColor: "#4f46e5"
        flowchart:
          curve: basis
          useMaxWidth: true
        sequence:
          actorMargin: 80
        gantt:
          barHeight: 24
```

When `theme` is `auto` (default), diagrams follow the site light/dark palette.

### All options

| Option | Default | Description |
|--------|---------|-------------|
| `version` | `10.9.3` | Package version for built-in CDN defaults |
| `cdn.base` | — | Base URL for default asset path (`mermaid.min.js`) |
| `cdn.javascript` | jsDelivr Mermaid JS | Full main script URL override |
| `theme` | `auto` | Mermaid theme; `auto` follows site light/dark mode |
| `themeVariables` | — | Custom theme color variables |
| `securityLevel` | — | `strict`, `loose`, `antiscript`, or `sandbox` |
| `flowchart` | — | Flowchart options: `curve`, `useMaxWidth`, `htmlLabels`, `diagramPadding` |
| `sequence` | — | Sequence diagram layout options |
| `gantt` | — | Gantt chart layout options |

See also the [Configuration](../../guide/configuration.md#mermaid-diagrams) reference page.

## Writing diagrams

Use a fenced code block with the `mermaid` language:

````markdown
```mermaid
flowchart LR
  A[Markdown] --> B[ts-mkdocs]
  B --> C[Static HTML]
```
````

### Flowchart

```mermaid
flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process]
  B -->|No| D[End]
  C --> D
```

### Sequence diagram

```mermaid
sequenceDiagram
  participant User
  participant Site
  participant CDN
  User->>Site: Open page with diagram
  Site->>CDN: Load mermaid.min.js
  CDN-->>Site: Library ready
  Site-->>User: Rendered SVG
```

### Class diagram

```mermaid
classDiagram
  class DocFile {
    +srcPath: string
    +destUri: string
    +url: string
  }
  class Page {
    +title: string
    +content: string
  }
  DocFile --> Page : loads into
```

### State diagram

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review: submit
  Review --> Published: approve
  Review --> Draft: revise
  Published --> [*]
```

### Gantt chart

```mermaid
gantt
  title Documentation build
  dateFormat YYYY-MM
  section Write
    Draft pages   :a1, 2026-07, 3d
    Review        :a2, after a1, 2d
  section Build
    pnpm build    :b1, after a2, 1d
    Deploy        :b2, after b1, 1d
```

### Pie chart

```mermaid
pie title Extension usage
  "Superfences" : 45
  "Admonitions" : 25
  "Tabs" : 20
  "Other" : 10
```

## In admonitions

Mermaid blocks work inside admonitions and other containers:

!!! tip "Build pipeline"
    ```mermaid
    flowchart LR
      MD[Markdown] --> MK[ts-mkdocs]
      MK --> HTML[Static site]
    ```

## Tips

- Mermaid is rendered **client-side** — the diagram source stays in the HTML as a `<pre class="mermaid">` block until the library runs.
- Diagrams are excluded from code-block features such as copy buttons, line numbers, and language labels.
- For self-hosted or air-gapped sites, point `cdn.base` or `cdn.javascript` at your own mirror.
- Use `theme: auto` so diagrams match the site palette when users switch between light and dark mode.
