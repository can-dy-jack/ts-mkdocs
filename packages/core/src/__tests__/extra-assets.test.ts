import { describe, expect, it } from 'vitest'
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  copyExtraAssets,
  normalizeExtraCssEntry,
  normalizeExtraJsEntry,
  resolveExtraAssetHref,
  resolveExtraScripts,
  resolveExtraStylesheets,
} from '../extra-assets.js'
import type { Config } from '../config.js'

describe('extra-assets', () => {
  it('normalizes string and object entries', () => {
    expect(normalizeExtraCssEntry('assets/custom.css')).toEqual({ path: 'assets/custom.css' })
    expect(normalizeExtraCssEntry({ path: 'assets/print.css', media: 'print' })).toEqual({
      path: 'assets/print.css',
      media: 'print',
    })
    expect(normalizeExtraJsEntry('assets/custom.js')).toEqual({ path: 'assets/custom.js' })
    expect(
      normalizeExtraJsEntry({ path: 'assets/module.js', type: 'module', defer: true }),
    ).toEqual({
      path: 'assets/module.js',
      type: 'module',
      defer: true,
    })
  })

  it('resolves local and external asset URLs', () => {
    expect(resolveExtraAssetHref('../../', 'assets/custom.css')).toBe('../../assets/custom.css')
    expect(resolveExtraAssetHref('./', 'assets/custom.css')).toBe('./assets/custom.css')
    expect(resolveExtraAssetHref('./', 'https://cdn.example.com/lib.css')).toBe(
      'https://cdn.example.com/lib.css',
    )
    expect(resolveExtraAssetHref('./', '/assets/global.css')).toBe('/assets/global.css')
  })

  it('builds stylesheet and script descriptors for templates', () => {
    const config = {
      extra_css: ['assets/custom.css', { path: 'assets/print.css', media: 'print' }],
      extra_javascript: [
        'assets/custom.js',
        { path: 'https://cdn.example.com/lib.js', defer: true },
      ],
    } as Config

    expect(resolveExtraStylesheets(config, '../../')).toEqual([
      { href: '../../assets/custom.css' },
      { href: '../../assets/print.css', media: 'print' },
    ])
    expect(resolveExtraScripts(config, './')).toEqual([
      { href: './assets/custom.js' },
      { href: 'https://cdn.example.com/lib.js', defer: true },
    ])
  })

  it('copies local extra assets into site_dir', () => {
    const dir = join(tmpdir(), `ts-mkdocs-extra-${Date.now()}`)
    const docsDir = join(dir, 'docs')
    const siteDir = join(dir, 'site')
    mkdirSync(join(docsDir, 'assets'), { recursive: true })
    writeFileSync(join(docsDir, 'assets', 'custom.css'), 'body {}')
    writeFileSync(join(docsDir, 'assets', 'custom.js'), 'console.log(1)')

    const config = {
      docs_dir: docsDir,
      site_dir: siteDir,
      strict: false,
      extra_css: ['assets/custom.css'],
      extra_javascript: ['assets/custom.js', 'https://cdn.example.com/lib.js'],
    } as Config

    copyExtraAssets(config)

    expect(existsSync(join(siteDir, 'assets/custom.css'))).toBe(true)
    expect(existsSync(join(siteDir, 'assets/custom.js'))).toBe(true)

    rmSync(dir, { recursive: true, force: true })
  })

  it('throws in strict mode when local assets are missing', () => {
    const dir = join(tmpdir(), `ts-mkdocs-extra-missing-${Date.now()}`)
    const docsDir = join(dir, 'docs')
    const siteDir = join(dir, 'site')
    mkdirSync(docsDir, { recursive: true })

    const config = {
      docs_dir: docsDir,
      site_dir: siteDir,
      strict: true,
      extra_css: ['assets/missing.css'],
      extra_javascript: [],
    } as Config

    expect(() => copyExtraAssets(config)).toThrow(/Extra asset\(s\) not found/)

    rmSync(dir, { recursive: true, force: true })
  })
})
