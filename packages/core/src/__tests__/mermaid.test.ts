import { describe, it, expect } from 'vitest'
import { resolveMermaidConfig } from '../md/mermaid.js'

describe('resolveMermaidConfig', () => {
  it('returns null when superfences is disabled', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: ['tables'],
    } as any)).toBeNull()
  })

  it('defaults when superfences is enabled without options', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: ['pymdownx.superfences'],
    } as any)).toEqual({
      enabled: true,
      version: '11',
      cdn: {
        javascript: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
      },
      theme: 'auto',
    })
  })

  it('defaults when markdown_extensions is empty', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: [],
    } as any)).toMatchObject({
      enabled: true,
      version: '11',
      theme: 'auto',
    })
  })

  it('supports custom version and cdn javascript', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: [{
        'pymdownx.superfences': {
          mermaid: {
            version: '10.6.1',
            cdn: {
              javascript: 'https://cdn.example.com/mermaid.min.js',
            },
          },
        },
      }],
    } as any)).toEqual({
      enabled: true,
      version: '10.6.1',
      cdn: {
        javascript: 'https://cdn.example.com/mermaid.min.js',
      },
      theme: 'auto',
    })
  })

  it('supports cdn base as a directory', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: [{
        'pymdownx.superfences': {
          mermaid: {
            cdn: { base: 'https://cdn.example.com/mermaid/dist/' },
          },
        },
      }],
    } as any)).toMatchObject({
      cdn: {
        javascript: 'https://cdn.example.com/mermaid/dist/mermaid.min.js',
      },
    })
  })

  it('supports cdn base as a full script url', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: [{
        'pymdownx.superfences': {
          mermaid: {
            cdn: { base: 'https://cdn.example.com/mermaid.esm.min.mjs' },
          },
        },
      }],
    } as any)).toMatchObject({
      cdn: {
        javascript: 'https://cdn.example.com/mermaid.esm.min.mjs',
      },
    })
  })

  it('supports diagram and theme options', () => {
    expect(resolveMermaidConfig({
      markdown_extensions: [{
        'pymdownx.superfences': {
          mermaid: {
            theme: 'forest',
            securityLevel: 'strict',
            themeVariables: {
              primaryColor: '#ff0000',
            },
            flowchart: {
              curve: 'basis',
              useMaxWidth: true,
            },
            sequence: {
              actorMargin: 80,
            },
            gantt: {
              barHeight: 24,
            },
          },
        },
      }],
    } as any)).toEqual({
      enabled: true,
      version: '11',
      cdn: {
        javascript: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
      },
      theme: 'forest',
      securityLevel: 'strict',
      themeVariables: {
        primaryColor: '#ff0000',
      },
      flowchart: {
        curve: 'basis',
        useMaxWidth: true,
      },
      sequence: {
        actorMargin: 80,
      },
      gantt: {
        barHeight: 24,
      },
    })
  })
})
