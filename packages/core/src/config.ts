import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import yaml from 'js-yaml'
import { z } from 'zod'

const ThemeSchema = z.object({
  name: z.string().default('material'),
  palette: z
    .union([
      z.object({
        scheme: z.string().optional(),
        primary: z.string().optional(),
        accent: z.string().optional(),
      }),
      z.array(
        z.object({
          media: z.string().optional(),
          scheme: z.string().optional(),
          primary: z.string().optional(),
          accent: z.string().optional(),
          toggle: z
            .object({ icon: z.string(), name: z.string() })
            .optional(),
        }),
      ),
    ])
    .optional(),
  font: z
    .union([
      z.literal(false),
      z.object({ text: z.string().optional(), code: z.string().optional() }),
    ])
    .optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  language: z.string().default('en'),
  features: z.array(z.string()).default([]),
  icons: z
    .object({
      default: z.enum(['material', 'fontawesome', 'bootstrap', 'octicons']).default('material'),
      libraries: z
        .array(z.enum(['material', 'fontawesome', 'bootstrap', 'octicons']))
        .default(['material', 'fontawesome', 'bootstrap']),
    })
    .default({ default: 'material', libraries: ['material', 'fontawesome', 'bootstrap'] }),
  icon: z
    .union([
      z.record(z.string()),
      z.object({
        admonition: z.record(z.string()).optional(),
      }).passthrough(),
    ])
    .optional(),
  custom_dir: z.string().optional(),
  highlight: z.object({
    theme_light: z.string().default('github-light'),
    theme_dark: z.string().default('github-dark'),
  }).default({ theme_light: 'github-light', theme_dark: 'github-dark' }),
})

const PluginConfigSchema = z.union([
  z.string(),
  z.record(z.any()),
])

export const ConfigSchema = z.object({
  site_name: z.string(),
  site_url: z.string().optional(),
  site_description: z.string().optional(),
  site_author: z.string().optional(),
  repo_url: z.string().optional(),
  repo_name: z.string().optional(),
  edit_uri: z.string().optional(),
  dev_addr: z.string().default('127.0.0.1:8000'),
  watch: z.array(z.string()).optional(),
  docs_dir: z.string().default('docs'),
  site_dir: z.string().default('site'),
  nav: z.array(z.any()).optional(),
  theme: ThemeSchema.default({ name: 'material' }),
  plugins: z.array(PluginConfigSchema).default(['search']),
  markdown_extensions: z.array(z.union([z.string(), z.record(z.any())])).default([]),
  extra: z.record(z.any()).optional(),
  extra_css: z.array(z.string()).default([]),
  extra_javascript: z.array(z.string()).default([]),
  copyright: z.string().optional(),
  strict: z.boolean().default(false),
  use_directory_urls: z.boolean().default(true),
})

export type Config = z.infer<typeof ConfigSchema>
export type ThemeConfig = z.infer<typeof ThemeSchema>

export function loadConfig(configPath: string): Config {
  const absPath = resolve(configPath)
  if (!existsSync(absPath)) {
    throw new Error(`Config file not found: ${absPath}`)
  }

  const raw = readFileSync(absPath, 'utf-8')
  const parsed = yaml.load(raw)

  const result = ConfigSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid mkdocs.yml:\n${issues}`)
  }

  const config = result.data
  const configDir = dirname(absPath)

  config.docs_dir = resolve(configDir, config.docs_dir)
  config.site_dir = resolve(configDir, config.site_dir)

  return config
}

export function getDefaultConfig(projectDir: string): Config {
  return ConfigSchema.parse({
    site_name: 'My Documentation',
    docs_dir: resolve(projectDir, 'docs'),
    site_dir: resolve(projectDir, 'site'),
  })
}
