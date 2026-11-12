// The difficulty picked on the start card, remembered on this device (`slashbattle:difficulty`,
// a save key). Rules and numbers live in logic/difficulty.js.
import { DEFAULT_DIFFICULTY, DIFFICULTIES } from './logic/difficulty.js'
import { noteSaved } from './saveSync.js'

const KEY = 'slashbattle:difficulty'
let current = DEFAULT_DIFFICULTY
try {
  const saved = localStorage.getItem(KEY)
  if (DIFFICULTIES[saved]) current = saved
} catch (_) {
  // blocked storage: Normal
}

export const getDifficulty = () => current

export function setDifficulty(id) {
  if (!DIFFICULTIES[id]) return current
  current = id
  try {
    localStorage.setItem(KEY, id)
    noteSaved()
  } catch (_) {
    // still applies this session
  }
  return current
}
