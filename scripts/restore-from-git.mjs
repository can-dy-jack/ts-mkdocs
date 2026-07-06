#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function cat(blob) {
  return execSync(`git cat-file -p ${blob}`, { cwd: root, encoding: 'utf8' })
}

function write(rel, content) {
  const path = join(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
  console.log('wrote', rel)
}

// Core source from sourcemap
const sm = JSON.parse(cat('a5a23979a0a64e66863d9b6cd62d2ce5beb409a7'))
for (let i = 0; i < sm.sources.length; i++) {
  const src = sm.sources[i].replace('../src/', 'packages/core/src/')
  write(src, sm.sourcesContent[i])
}

// index.ts
write('packages/core/src/index.ts', cat('2ac0048c6889e07d852ac4aeff83ada1dffeaee3'))

// Package configs
write('package.json', cat('aad52e610d8704ef0824f3e344e72d939fd60caa'))
write('packages/core/package.json', cat('926b445bc8f47e06cc3670be90f58613f92620ab'))
write('packages/core/tsup.config.ts', cat('ead643ee59a82701975c422e363e66d120582b70'))
write('packages/core/tsconfig.json', cat('60c7df18111fe8469fdeb4dc992c52e73d377a80'))
write('tsconfig.json', cat('3b0afe17e38616fc6b753dd5d950991365a0fbea'))

write('pnpm-workspace.yaml', `packages:\n  - "packages/*"\n`)

// Theme material
write('packages/theme-material/package.json', cat('1104a57756cca9d4cf95c43f5e73925f04543493'))
write('packages/theme-material/index.js', cat('d9cc97004adb9540192fc8a35596ab7326b3d545'))
write('packages/theme-material/index.d.ts', `export declare const templatesDir: string\nexport declare const assetsDir: string\n`)
write('packages/theme-material/templates/base.html', cat('0a8a634e0d1cd6bb91c783c2656212d7f85ca108'))
write('packages/theme-material/templates/main.html', cat('59e4aeaab2ccaf10401aef60b02976dd266a2ab1'))
write('packages/theme-material/templates/404.html', cat('e2fc0753f7fd925eb380e5660fdcfc17b21290be'))
write('packages/theme-material/templates/partials/nav.html', cat('e404a1f0da04172512b53bc49e78d31f838db1e1'))
write('packages/theme-material/templates/partials/toc.html', cat('23cd26dd1c2864ebc40b2341afb1fa0706a8d0e5'))
write('packages/theme-material/assets/css/material.css', cat('6f45229f5c6def13c948916b0e1089f419dbaac5'))
write('packages/theme-material/assets/js/material.js', cat('7a6c61d352b997f83c65c9c7715860b4eeddf95d'))

// Docs
write('README.md', cat('516952d706c1c40229f0f2681174a45c714caa0f'))
write('AGENTS.md', cat('ad1557956d7a72c7203fa63c686d8672a4014ae8'))
write('example/ts-mkdocs.yml', cat('4be27aabef0a0c4179389eb8b871fd5d7bed37c9'))

// home.html - search blob
const blobs = execSync('git fsck --lost-found 2>/dev/null | grep "dangling blob" | awk \'{print $3}\'', {
  cwd: root,
  encoding: 'utf8',
}).trim().split('\n')

for (const blob of blobs) {
  try {
    const content = cat(blob)
    if (content.startsWith('{% extends "base.html" %}') && content.includes('md-hero')) {
      write('packages/theme-material/templates/home.html', content)
      break
    }
  } catch {}
}

console.log('restore complete')
