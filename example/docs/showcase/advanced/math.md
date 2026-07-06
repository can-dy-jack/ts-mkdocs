---
title: Math
description: Inline and block LaTeX math with KaTeX or MathJax
tags:
  - Math
  - LaTeX
  - KaTeX
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# Math

ts-mkdocs renders LaTeX math when the `md.math` extension is enabled. The renderer (KaTeX or MathJax) is loaded from a CDN at build time — no extra `extra_javascript` wiring is required.

## Configuration

Add the extension under `markdown_extensions` in `ts-mkdocs.yml`:

```yaml
markdown_extensions:
  - md.math:
      provider: katex
```

### KaTeX (default)

KaTeX is fast and self-contained. This example site uses:

```yaml
markdown_extensions:
  - md.math:
      provider: katex
      version: "0.16.22"
      cdn:
        base: https://cdn.jsdelivr.net/npm/katex@0.16.22/dist
```

`cdn.base` is expanded automatically into:

| Asset | Resolved URL |
|-------|--------------|
| Stylesheet | `{base}/katex.min.css` |
| JavaScript | `{base}/katex.min.js` |
| Auto-render | `{base}/contrib/auto-render.min.js` |

You can also override individual URLs:

```yaml
markdown_extensions:
  - md.math:
      provider: katex
      cdn:
        stylesheet: https://cdn.example.com/katex.min.css
        javascript: https://cdn.example.com/katex.min.js
        auto_render: https://cdn.example.com/auto-render.min.js
```

If `cdn` is omitted entirely, ts-mkdocs falls back to jsDelivr defaults derived from `provider` and `version`.

### MathJax

Switch the renderer with `provider: mathjax`:

```yaml
markdown_extensions:
  - md.math:
      provider: mathjax
      version: "3.2.2"
      cdn:
        javascript: https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js
```

MathJax only needs a single `cdn.javascript` URL. When omitted, the default is `https://cdn.jsdelivr.net/npm/mathjax@{version}/es5/tex-mml-chtml.js`.

### All options

| Option | Default | Description |
|--------|---------|-------------|
| `provider` | `katex` | Renderer: `katex` or `mathjax` |
| `version` | `0.16.22` / `3.2.2` | Package version for built-in CDN defaults |
| `generic` | `true` | Wrap output as `\(...\)` / `\[...\]` (compatible with both renderers) |
| `smart_dollar` | `true` | Treat `$5` as currency, not inline math |
| `cdn.base` | — | KaTeX only: base URL for default asset paths |
| `cdn.stylesheet` | jsDelivr KaTeX CSS | Full stylesheet URL override |
| `cdn.javascript` | jsDelivr KaTeX / MathJax JS | Full main script URL override |
| `cdn.auto_render` | jsDelivr KaTeX auto-render | Full auto-render script URL override (KaTeX only) |

See also the [Configuration](../../guide/configuration.md#math) reference page.

## Writing math

### Inline

Use `$...$` or `\(...\)` for inline formulas:

```markdown
Einstein's relation is $E = mc^2$.

Or with parentheses: \(\alpha + \beta = \gamma\).
```

Einstein's mass–energy relation is $E = mc^2$.

You can also use \(\alpha + \beta = \gamma\) delimiters.

When `smart_dollar` is enabled (default), currency amounts like $5 and $10 are **not** treated as math.

### Block

Use `$$...$$` on one or more lines for display math:

```markdown
$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$
```

The quadratic formula:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

A definite integral:

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

### Matrices

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

## In admonitions

Math works inside admonitions and other block containers:

!!! note "Formula"
    The Gaussian integral:
    $$
    \int_{-\infty}^{\infty} e^{-x^2}\, dx = \sqrt{\pi}
    $$

## Tips

- Math is **not** parsed inside inline code (`` `$x$` `` stays literal).
- Prefer `\(...\)` / `\[...\]` when `$` appears frequently in prose.
- For self-hosted or air-gapped sites, point `cdn.base` or the individual `cdn.*` URLs at your own mirror.
