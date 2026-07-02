import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync, existsSync, statSync } from 'fs'
import { join, extname, resolve } from 'path'
import { watch } from 'chokidar'
import type { Config } from './config.js'
import { loadConfig } from './config.js'
import { build } from './build.js'
import { log, warn } from './utils.js'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
}

interface SseClient {
  res: ServerResponse
  heartbeat: ReturnType<typeof setInterval>
}

const SSE_CLIENTS: Set<SseClient> = new Set()
const SSE_HEARTBEAT_MS = 30_000

const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  const es = new EventSource('/__livereload');
  es.onmessage = function(e) {
    if (e.data === 'reload') {
      es.close();
      window.location.reload();
    }
  };
  window.addEventListener('beforeunload', function() { es.close(); });
})();
</script>
`

interface ServeOptions {
  devAddr: string
  open: boolean
}

export async function serve(
  config: Config,
  options: ServeOptions & { configFile?: string },
): Promise<void> {
  // Keep a mutable reference so config reloads on mkdocs.yml changes
  let activeConfig = config
  await build(activeConfig)

  const [host, portStr] = options.devAddr.split(':')
  const port = parseInt(portStr ?? '8000', 10)

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/'

    if (url === '/__livereload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      })
      res.write('data: connected\n\n')

      let client: SseClient
      const cleanup = () => {
        clearInterval(client.heartbeat)
        SSE_CLIENTS.delete(client)
      }

      const heartbeat = setInterval(() => {
        if (res.writableEnded) return
        try {
          res.write(': ping\n\n')
        } catch {
          cleanup()
        }
      }, SSE_HEARTBEAT_MS)

      client = { res, heartbeat }
      SSE_CLIENTS.add(client)

      req.on('close', cleanup)
      res.on('close', cleanup)
      return
    }

    serveStatic(url, activeConfig.site_dir, res)
  })

  server.requestTimeout = 0

  const MAX_PORT_RETRIES = 10
  let currentPort = port

  server.once('listening', () => {
    log(`Serving at http://${host}:${currentPort}/`)
    log('Press Ctrl+C to stop')
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && currentPort - port < MAX_PORT_RETRIES) {
      warn(`Port ${currentPort} is already in use, trying ${currentPort + 1}...`)
      currentPort++
      server.listen(currentPort, host)
    } else {
      if (err.code === 'EADDRINUSE') {
        warn(`Ports ${port}–${currentPort} are all in use. Free a port or specify a different one with -a.`)
      }
      process.exit(1)
    }
  })

  server.listen(currentPort, host)

  let rebuilding = false
  let pendingRebuild = false

  const triggerRebuild = async (reloadConfig = false) => {
    if (rebuilding) {
      pendingRebuild = true
      return
    }
    rebuilding = true
    try {
      if (reloadConfig && options.configFile) {
        log('Config changed, reloading mkdocs.yml...')
        activeConfig = loadConfig(resolve(options.configFile))
      }
      await build(activeConfig)
      notifyReload()
    } catch (err) {
      warn(`Rebuild failed: ${err}`)
    } finally {
      rebuilding = false
      if (pendingRebuild) {
        pendingRebuild = false
        triggerRebuild()
      }
    }
  }

  const watchPaths = [config.docs_dir]
  if (options.configFile) watchPaths.push(resolve(options.configFile))

  const watcher = watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  })

  watcher.on('all', (_event, changedPath) => {
    const isConfigFile = options.configFile &&
      resolve(changedPath) === resolve(options.configFile)
    if (isConfigFile) {
      triggerRebuild(true)
    } else {
      log(`File changed: ${changedPath}, rebuilding...`)
      triggerRebuild()
    }
  })

  process.on('SIGINT', () => {
    for (const client of SSE_CLIENTS) {
      clearInterval(client.heartbeat)
      if (!client.res.writableEnded) client.res.end()
    }
    SSE_CLIENTS.clear()
    server.close()
    watcher.close()
    process.exit(0)
  })
}

function serveStatic(url: string, siteDir: string, res: ServerResponse): void {
  let urlPath = decodeURIComponent(url.split('?')[0])

  if (urlPath.endsWith('/')) urlPath += 'index.html'

  let filePath = join(siteDir, urlPath)

  if (!existsSync(filePath)) {
    const withHtml = filePath + '.html'
    if (existsSync(withHtml)) {
      filePath = withHtml
    } else {
      const notFound = join(siteDir, '404.html')
      if (existsSync(notFound)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(injectLiveReload(readFileSync(notFound, 'utf-8')))
      } else {
        res.writeHead(404)
        res.end('404 Not Found')
      }
      return
    }
  }

  if (statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
    if (!existsSync(filePath)) {
      res.writeHead(403)
      res.end('403 Forbidden')
      return
    }
  }

  const ext = extname(filePath)
  const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream'
  const isHtml = mimeType.startsWith('text/html')

  try {
    if (isHtml) {
      const content = injectLiveReload(readFileSync(filePath, 'utf-8'))
      res.writeHead(200, { 'Content-Type': mimeType })
      res.end(content)
    } else {
      const content = readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': mimeType })
      res.end(content)
    }
  } catch {
    res.writeHead(500)
    res.end('500 Internal Server Error')
  }
}

function injectLiveReload(html: string): string {
  if (html.includes('</body>')) {
    return html.replace('</body>', LIVE_RELOAD_SCRIPT + '</body>')
  }
  return html + LIVE_RELOAD_SCRIPT
}

function notifyReload(): void {
  for (const client of SSE_CLIENTS) {
    if (client.res.writableEnded) {
      clearInterval(client.heartbeat)
      SSE_CLIENTS.delete(client)
      continue
    }
    try {
      client.res.write('data: reload\n\n')
    } catch {
      clearInterval(client.heartbeat)
      SSE_CLIENTS.delete(client)
    }
  }
}
