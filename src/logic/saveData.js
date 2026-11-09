// Pure rules for the whole-game save: which localStorage keys make up "your save", how they are
// bundled into one JSON document (for the device save file and Export / Import), and how a
// document is validated. No DOM, so it can be unit tested and shared with the dev server.

export const SAVE_VERSION = 1
// Everything that should follow you between browsers. (Not session-only keys like ctxReload.)
export const SAVE_KEYS = ['slashbattle:profile', 'slashbattle:highscore', 'slashbattle:music-muted', 'slashbattle:brightness', 'slashbattle:skystars', 'slashbattle:checkpoint']
// When this browser's copy was last changed (ms since epoch); compared against the device file.
export const SAVED_AT_KEY = 'slashbattle:savedAt'
export const MAX_SAVE_BYTES = 1_000_000

// Bundles the save keys found in `storage` (anything with getItem) into a save document.
export function collectSave(storage, savedAt = Date.now()) {
  const data = {}
  for (const key of SAVE_KEYS) {
    const value = storage.getItem(key)
    if (typeof value === 'string') data[key] = value
  }
  return { game: 'slashbattle', version: SAVE_VERSION, savedAt, data }
}

// True when the save document holds anything at all.
export const hasSaveData = (save) => !!save && Object.keys(save.data).length > 0

// Validates a parsed (or raw JSON text) save document. Returns the cleaned document, or throws
// an Error with a player-readable message.
export function parseSave(input) {
  let doc = input
  if (typeof input === 'string') {
    if (input.length > MAX_SAVE_BYTES) throw new Error('That file is too big to be a SlashBattle save.')
    try {
      doc = JSON.parse(input)
    } catch {
      throw new Error("That file isn't a SlashBattle save.")
    }
  }
  if (!doc || typeof doc !== 'object' || doc.game !== 'slashbattle' || typeof doc.data !== 'object' || !doc.data) {
    throw new Error("That file isn't a SlashBattle save.")
  }
  if (!(Number(doc.version) >= 1)) throw new Error("That save file's version isn't recognised.")
  const data = {}
  for (const key of SAVE_KEYS) if (typeof doc.data[key] === 'string') data[key] = doc.data[key]
  return { game: 'slashbattle', version: SAVE_VERSION, savedAt: Number(doc.savedAt) || 0, data }
}

// What to do at startup given this browser's copy and the device file:
//   'pull' -- load the device file into this browser (it's newer)
//   'push' -- write this browser's copy to the device file (it's newer, or there's no file)
//   'none' -- nothing to do
export function syncDirection({ localSavedAt, localHasData, file }) {
  const fileHasData = hasSaveData(file)
  if (!fileHasData) return localHasData ? 'push' : 'none'
  if (!localHasData) return 'pull'
  if (file.savedAt > localSavedAt) return 'pull'
  if (localSavedAt > file.savedAt) return 'push'
  return 'none'
}
