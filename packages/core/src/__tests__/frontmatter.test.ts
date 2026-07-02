import { describe, expect, it } from 'vitest'
import {
  isMetaFile,
  loadInheritedMeta,
  mergePageMeta,
  normalizePageMeta,
  resolveEditUrl,
} from '../frontmatter.js'
import { loadPage } from '../page.js'
import { buildDocFile } from '../files.js'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

function makeTempDocs(): string {
  const dir = join(tmpdir(), 'ts-mkdocs-frontmatter-' + Date.now())
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('frontmatter', () => {
  it('detects .meta.yml files', () => {
    expect(isMetaFile('.meta.yml')).toBe(true)
    expect(isMetaFile('guide/.meta.yml')).toBe(true)
    expect(isMetaFile('guide/setup.md')).toBe(false)
  })

  it('normalizes date aliases and formats dates', () => {
    const meta = normalizePageMeta(
      {
        created: '2024-06-01',
        modified: '2024-12-15',
        tags: ['Docs', 'Docs'],
        groups: 'Guide, Setup',
      },
      'en',
    )

    expect(meta.date).toBeTruthy()
    expect(meta.updated).toBeTruthy()
    expect(meta.date_formatted).toContain('2024')
    expect(meta.updated_formatted).toContain('2024')
    expect(meta.tags).toEqual(['Docs'])
    expect(meta.groups).toEqual(['Guide', 'Setup'])
  })

  it('merges inherited meta and appends array fields', () => {
    const merged = mergePageMeta(
      { tags: ['Shared'], groups: ['Guide'] },
      { tags: ['Page'], title: 'Example' },
    )

    expect(merged.tags).toEqual(['Shared', 'Page'])
    expect(merged.groups).toEqual(['Guide'])
    expect(merged.title).toBe('Example')
  })

  it('loads inherited meta from parent folders', () => {
    const docsDir = makeTempDocs()
    try {
      mkdirSync(join(docsDir, 'guide'))
      writeFileSync(
        join(docsDir, '.meta.yml'),
        'groups:\n  - Docs\n',
      )
      writeFileSync(
        join(docsDir, 'guide', '.meta.yml'),
        'tags:\n  - Guide\n',
      )

      const inherited = loadInheritedMeta(docsDir, 'guide/setup.md')
      expect(inherited.groups).toEqual(['Docs'])
      expect(inherited.tags).toEqual(['Guide'])
    } finally {
      rmSync(docsDir, { recursive: true, force: true })
    }
  })

  it('resolves edit_url overrides from frontmatter', () => {
    const config = {
      repo_url: 'https://github.com/example/repo',
      edit_uri: 'edit/main/docs/',
    }

    expect(
      resolveEditUrl(config, 'guide/setup.md', {
        edit_url: 'https://example.com/custom-edit',
      }),
    ).toBe('https://example.com/custom-edit')

    expect(
      resolveEditUrl(config, 'guide/setup.md', {
        edit_uri: 'edit/main/lib/readme.md',
      }),
    ).toBe('https://github.com/example/repo/edit/main/lib/readme.md')

    expect(resolveEditUrl(config, 'guide/setup.md', {})).toBe(
      'https://github.com/example/repo/edit/main/docs/guide/setup.md',
    )
  })

  it('loads page frontmatter with inherited meta', () => {
    const docsDir = makeTempDocs()
    try {
      mkdirSync(join(docsDir, 'guide'), { recursive: true })
      writeFileSync(
        join(docsDir, 'guide', '.meta.yml'),
        'tags:\n  - Inherited\n',
      )
      writeFileSync(
        join(docsDir, 'guide', 'setup.md'),
        `---
title: Setup Guide
tags:
  - Install
date: 2024-01-10
updated: 2024-02-20
edit_uri: edit/main/custom/setup.md
---
# Setup
`,
      )

      const file = buildDocFile('guide/setup.md', docsDir, join(docsDir, 'site'), true)
      const page = loadPage(file, { docsDir, language: 'en', inheritMeta: true })

      expect(page.title).toBe('Setup Guide')
      expect(page.meta.tags).toEqual(['Inherited', 'Install'])
      expect(page.meta.date_formatted).toContain('2024')
      expect(page.meta.updated_formatted).toContain('2024')
    } finally {
      rmSync(docsDir, { recursive: true, force: true })
    }
  })
})
