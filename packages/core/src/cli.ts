import { Command } from 'commander'
import { resolve, join } from 'path'
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { loadConfig } from './config.js'
import { build } from './build.js'
import { serve } from './serve.js'
import { log, error, success } from './utils.js'

const program = new Command()

program
  .name('ts-mkdocs')
  .description('TypeScript implementation of MkDocs with Material theme')
  .version('0.1.0')

program
  .command('new <directory>')
  .description('Create a new MkDocs project')
  .action(async (directory: string) => {
    const projectDir = resolve(directory)

    if (existsSync(projectDir)) {
      error(`Directory already exists: ${projectDir}`)
      process.exit(1)
    }

    const docsDir = resolve(projectDir, 'docs')
    const assetsDir = resolve(docsDir, 'assets')
    mkdirSync(assetsDir, { recursive: true })

    const themeModule = await import('ts-mkdocs-theme-material')
    for (const file of ['logo.svg', 'favicon.svg']) {
      copyFileSync(join(themeModule.brandDir, file), join(assetsDir, file))
    }

    writeFileSync(
      resolve(projectDir, 'mkdocs.yml'),
      `site_name: My Documentation
site_description: My documentation site
docs_dir: docs
site_dir: site

theme:
  name: material
  logo: assets/logo.svg
  favicon: assets/favicon.svg
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  font:
    text: Roboto
    code: Roboto Mono
  icons:
    default: material
    libraries:
      - material
      - fontawesome
      - bootstrap
  features:
    - navigation.tabs
    - navigation.sections
    - toc.follow
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.linenumbers
    - content.code.lang
    - content.code.wrap

plugins:
  - search
`,
    )

    writeFileSync(
      resolve(projectDir, 'docs', 'index.md'),
      `# Welcome

Welcome to my documentation!

## Getting Started

Edit this file to get started with your documentation.
`,
    )

    success(`Created new project at: ${projectDir}`)
    log('Run the following commands to get started:')
    console.log(`  cd ${directory}`)
    console.log('  ts-mkdocs serve')
  })

program
  .command('build')
  .description('Build the documentation site')
  .option('-f, --config-file <path>', 'Config file path', 'mkdocs.yml')
  .option('-d, --site-dir <path>', 'Output directory')
  .option('--strict', 'Enable strict mode')
  .action(async (options: { configFile: string; siteDir?: string; strict?: boolean }) => {
    try {
      const configFile = resolve(options.configFile)
      const config = loadConfig(configFile)
      if (options.siteDir) config.site_dir = resolve(options.siteDir)
      if (options.strict) config.strict = true
      await build(config)
    } catch (err) {
      error(String(err instanceof Error ? err.message : err))
      process.exit(1)
    }
  })

program
  .command('serve')
  .description('Start the development server with live reload')
  .option('-f, --config-file <path>', 'Config file path', 'mkdocs.yml')
  .option('-a, --dev-addr <addr>', 'Dev server address', '127.0.0.1:8000')
  .option('--open', 'Open browser after starting', false)
  .action(async (options: { configFile: string; devAddr: string; open: boolean }) => {
    try {
      const configFile = resolve(options.configFile)
      const config = loadConfig(configFile)
      await serve(config, { ...options, configFile })
    } catch (err) {
      error(String(err instanceof Error ? err.message : err))
      process.exit(1)
    }
  })

program.parse()
