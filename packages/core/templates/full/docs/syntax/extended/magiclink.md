---
title: MagicLink
description: Repository issue, commit, and mention shorthand links
tags:
  - Markdown
  - Links
  - GitHub
  - Showcase
groups:
  - Showcase
authors:
  - kartjim
---

# MagicLink

Auto-link repository references with [PyMdown MagicLink](https://facelessuser.github.io/pymdown-extensions/extensions/magiclink/) syntax. Requires `md.links` in `markdown_extensions`.

The example site uses `repo_url` from `ts-mkdocs.yml` as the default repository context, so shorthand like `#1` resolves against `anthropics/claude-code`.

```yaml
markdown_extensions:
  - md.links:
      normalize_issue_symbols: true
      repo_url_shorthand: true
      repo_url_shortener: true
```

## Issues, pulls, and discussions

```markdown
#1
!13
?1173

Python-Markdown/markdown#1
Python-Markdown/markdown!598
```

#1

!13

?1173

Python-Markdown/markdown#1

Python-Markdown/markdown!598

## Commits and compares

```markdown
3f6b07a8eeaa9d606115758d90f55fec565d4e2a
e2ed7e0b3973f3f9eb7a26b8ef7ae514eebfe0d2...90b6fb8711e75732f987982cc024e9bb0111beac
```

3f6b07a8eeaa9d606115758d90f55fec565d4e2a

e2ed7e0b3973f3f9eb7a26b8ef7ae514eebfe0d2...90b6fb8711e75732f987982cc024e9bb0111beac

## Mentions

```markdown
@facelessuser
@facelessuser/pymdown-extensions
```

@facelessuser

@facelessuser/pymdown-extensions

## URL shortener

With `repo_url_shortener: true`, bare repository URLs are rendered as shorthand:

```markdown
https://github.com/facelessuser
https://github.com/facelessuser/pymdown-extensions/issues/2
```

https://github.com/facelessuser

https://github.com/facelessuser/pymdown-extensions/issues/2

## CSS classes

Repository links receive `magiclink` classes for styling, for example `magiclink-github magiclink-issue`. Icons are not included by default — add custom CSS if needed.
