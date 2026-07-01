---
title: Task Lists
description: GitHub-style checkbox lists with pymdownx.tasklist
---

# Task Lists

Checkbox lists track progress in tutorials and checklists. Enable with `pymdownx.tasklist`.

## Configuration

```yaml
markdown_extensions:
  - pymdownx.tasklist
```

## Basic syntax

```markdown
- [ ] Unchecked item
- [x] Checked item
- [X] Also checked (uppercase X)
```

## Rendered output

- [ ] Unchecked item
- [x] Checked item
- [X] Also checked (uppercase X)

## Extended syntax

### Nested task lists

```markdown
- [ ] Parent task
    - [x] Sub-task done
    - [ ] Sub-task pending
```

- [ ] Parent task
    - [x] Sub-task done
    - [ ] Sub-task pending

### Mixed with ordered lists

1. [ ] First step
2. [x] Second step (done)
3. [ ] Third step

## Advanced usage

Task list items support inline formatting:

- [ ] Edit **`mkdocs.yml`** and run `ts-mkdocs build`
- [x] Read the [Configuration guide](../guide/configuration.md)

## Combining with other syntax

!!! example "Release checklist"
    - [ ] Update changelog
    - [ ] Run `pnpm test`
    - [x] Build example site
    - [ ] Tag release

Inside tabs:

=== "Dev"

    - [x] `pnpm dev`
    - [ ] Fix TypeScript errors

=== "Prod"

    - [ ] `pnpm build`
    - [ ] Deploy `example/site/`
