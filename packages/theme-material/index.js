import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const templatesDir = join(__dirname, 'templates')
export const assetsDir = join(__dirname, 'assets')
