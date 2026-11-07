// One save per device instead of one per browser.
//
// Each browser (and each localhost port) has its own localStorage, so playing in Firefox after
// Chrome used to start from scratch. Two ways round that:
//   - Device save file: when the game runs from the dev server (`npm run dev`), the server keeps
//     the save in ~/.slashbattle/save.json (see vite.config.js). It hands the file to the page in
//     window.__SLASH_DEVICE_SAVE__ before any game code runs; this module loads it into
//     localStorage if it's newer, and writes every change back to the file.
//   - Export / Import (pause menu): download the save as a file and load it in any browser,
//     including the GitHub Pages build, which has no server to keep a file.
//
// Game modules keep reading and writing localStorage as before and call noteSaved() after a write.
import { SAVED_AT_KEY, SAVE_KEYS, collectSave, parseSave, syncDirection } from './logic/saveData.js'

const SAVE_URL = '__slashbattle/save'
const BACKUP_URL = '__slashbattle/backup'
const PUSH_DELAY_MS = 400

const storage = (() => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null // storage blocked
  }
})()
const deviceFileAvailable = typeof window !== 'undefined' && '__SLASH_DEVICE_SAVE__' in window

const localSavedAt = () => Number(storage?.getItem(SAVED_AT_KEY)) || 0
const localHasData = () => !!storage && SAVE_KEYS.some((key) => storage.getItem(key) !== null)

function writeLocal(save) {
  for (const key of SAVE_KEYS) {
    if (key in save.data) storage.setItem(key, save.data[key])
    else storage.removeItem(key)
  }
  storage.setItem(SAVED_AT_KEY, String(save.savedAt))
}

function post(url, save, { beacon = false } = {}) {
  const body = JSON.stringify(save)
  if (beacon && navigator.sendBeacon) return navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {})
}

// Startup: reconcile this browser's copy with the device file. Runs at import, i.e. before any
// module that imports this one reads its settings.
if (storage && deviceFileAvailable) {
  try {
    const file = window.__SLASH_DEVICE_SAVE__ ? parseSave(window.__SLASH_DEVICE_SAVE__) : null
    const direction = syncDirection({ localSavedAt: localSavedAt(), localHasData: localHasData(), file })
    if (direction === 'pull') {
      // Whatever this browser had is about to be replaced: keep a copy next to the device file.
      if (localHasData()) post(BACKUP_URL, collectSave(storage, localSavedAt()))
      writeLocal(file)
      console.info('[save] loaded the device save file')
    } else if (direction === 'push') {
      if (!localSavedAt()) storage.setItem(SAVED_AT_KEY, String(Date.now()))
      post(SAVE_URL, collectSave(storage, localSavedAt()))
    }
  } catch (error) {
    console.warn('[save] could not sync with the device save file:', error)
  }
}

let pushTimer = null
function pushNow({ beacon = false } = {}) {
  clearTimeout(pushTimer)
  pushTimer = null
  if (storage && deviceFileAvailable) return post(SAVE_URL, collectSave(storage, localSavedAt()), { beacon })
}
if (deviceFileAvailable) {
  // Flush a pending write when the tab closes or goes to the background.
  window.addEventListener('pagehide', () => pushTimer && pushNow({ beacon: true }))
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && pushTimer && pushNow({ beacon: true }))
}

// Call after writing any SAVE_KEYS entry: stamps this copy as newest and (on the dev server)
// writes it to the device file shortly after.
export function noteSaved() {
  if (!storage) return
  try {
    storage.setItem(SAVED_AT_KEY, String(Date.now()))
  } catch {
    return
  }
  if (!deviceFileAvailable) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(pushNow, PUSH_DELAY_MS)
}

// Downloads the whole save as a .json file.
export function exportSave() {
  if (!storage) throw new Error('This browser is blocking saved data.')
  const save = collectSave(storage, localSavedAt() || Date.now())
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `slashbattle-save-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

// Replaces the save with the contents of an exported file (a File from an <input type=file>).
// Rejects with a player-readable Error if it isn't a save. The caller reloads the page after.
export async function importSave(file) {
  if (!storage) throw new Error('This browser is blocking saved data.')
  const save = parseSave(await file.text())
  if (Object.keys(save.data).length === 0) throw new Error('That save file is empty.')
  if (localHasData() && deviceFileAvailable) await post(BACKUP_URL, collectSave(storage, localSavedAt()))
  writeLocal({ ...save, savedAt: Date.now() })
  await pushNow() // before the caller reloads the page
}
