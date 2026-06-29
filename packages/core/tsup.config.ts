import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
