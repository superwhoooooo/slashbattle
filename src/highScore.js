// Persists the best score/wave reached across runs via localStorage.
// Every access is wrapped in try/catch (private browsing, storage
// quotas, or disabled storage should never crash the game) with a
// { bestScore: 0, bestWave: 0 } fallback.
const STORAGE_KEY = 'slashbattle:highscore'

// Loads the saved high score, or the zero fallback if nothing's saved
// yet, storage is unavailable, or the saved value is malformed.
export function loadHighScore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
export function saveHighScore(highScore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(highScore))
  } catch {
    // Storage may be unavailable (private browsing, quota, disabled);
    // losing the high score is better than crashing the game over it.
  }
}
