// Persists the best score/wave reached across runs via localStorage.
// Every access is wrapped in try/catch (private browsing, storage
// quotas, or disabled storage should never crash the game) with a
// { bestScore: 0, bestWave: 0 } fallback.
import { noteSaved } from './saveSync.js'
const STORAGE_KEY = 'slashbattle:highscore'
// Normal keeps the original key; Relax and Hard keep their own bests.
const keyFor = (difficulty = 'normal') => (difficulty === 'normal' ? STORAGE_KEY : `${STORAGE_KEY}:${difficulty}`)

// Loads the saved high score, or the zero fallback if nothing's saved
// yet, storage is unavailable, or the saved value is malformed.
export function loadHighScore(difficulty = 'normal') {
  try {
    const raw = localStorage.getItem(keyFor(difficulty))
    if (!raw) return { bestScore: 0, bestWave: 0 }
    const parsed = JSON.parse(raw)
    return {
      bestScore: Number(parsed.bestScore) || 0,
      bestWave: Number(parsed.bestWave) || 0,
    }
  } catch {
    return { bestScore: 0, bestWave: 0 }
  }
}

// Saves { bestScore, bestWave }. Silently does nothing if storage is
// unavailable.
export function saveHighScore(highScore, difficulty = 'normal') {
  try {
    localStorage.setItem(keyFor(difficulty), JSON.stringify(highScore))
    noteSaved()
  } catch {
    // Storage may be unavailable (private browsing, quota, disabled);
    // losing the high score is better than crashing the game over it.
  }
}
