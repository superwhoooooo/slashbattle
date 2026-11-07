import { defineConfig } from 'vite'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { MAX_SAVE_BYTES, parseSave } from './src/logic/saveData.js'

// One save per device (see src/saveSync.js): while `npm run dev` serves the game, the save lives
// in ~/.slashbattle/save.json (override with SLASHBATTLE_SAVE_DIR), shared by every browser and
// every port on this machine. The page gets the file inlined before any game code runs, and
// POSTs each change back. Replaced browser copies are kept in backups/ so nothing is lost.
function deviceSave() {
  const dir = process.env.SLASHBATTLE_SAVE_DIR || join(homedir(), '.slashbattle')
  const file = join(dir, 'save.json')
  const readSave = () => {
    try {
      return parseSave(readFileSync(file, 'utf8'))
    } catch {
      return null // no file yet (or unreadable): the browser's copy wins
    }
  }
  const writeAtomic = (path, save) => {
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(`${path}.tmp`, JSON.stringify(save, null, 2))
    renameSync(`${path}.tmp`, path)
  }
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
        if (body.length > MAX_SAVE_BYTES) reject(new Error('too large'))
      })
      req.on('end', () => resolve(body))
      req.on('error', reject)
    })
  const handler = (target) => async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      return res.end()
    }
    try {
      const save = parseSave(await readBody(req))
      writeAtomic(target(save), save)
      res.statusCode = 204
    } catch (error) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'text/plain')
      res.write(String(error.message))
    }
    res.end()
  }
  return {
    name: 'slashbattle-device-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__slashbattle/save', handler(() => file))
      server.middlewares.use(
        '/__slashbattle/backup',
        handler((save) => join(dir, 'backups', `browser-copy-${new Date().toISOString().replace(/[:.]/g, '-')}-saved-${save.savedAt}.json`)),
      )
    },
    transformIndexHtml() {
      // JSON in a <script>: escape "<" so a value can't close the tag.
      const json = JSON.stringify(readSave()).replace(/</g, '\\u003c')
      return [{ tag: 'script', children: `window.__SLASH_DEVICE_SAVE__ = ${json}`, injectTo: 'head-prepend' }]
    },
  }
}

// Relative asset paths, so the built game works from any folder or URL
// (GitHub Pages serves it from /slashbattle/, not the site root).
export default defineConfig({
  base: './',
  plugins: [deviceSave()],
})
