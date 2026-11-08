// Pure rules for the chill / freeze / slow-time statuses a monster can carry.
// A monster's AI record (userData) holds `frozenUntil` (solid ice: it does
// nothing), `slowUntil` + `slowFactor` (a frost slow) -- and the whole arena
// can sit in Time Warp (a shared factor until some moment). Bosses shrug off a
// freeze but are slowed by it instead (BOSS_FREEZE_SLOW), like confusion.

export const BOSS_FREEZE_SLOW = 0.5 // a boss "frozen" moves at this fraction of speed
export const TIME_WARP_FACTOR = 0.4 // everything in the arena runs at this fraction

// Freezes `ai` solid until now + seconds (a boss is slowed instead). Never shortens
// a freeze or slow that is already running. Returns 'frozen' | 'slowed'.
export function applyFreeze(ai, now, seconds) {
  if (ai.isBoss) {
    applySlow(ai, now, seconds, BOSS_FREEZE_SLOW)
    return 'slowed'
  }
  ai.frozenUntil = Math.max(ai.frozenUntil ?? -Infinity, now + seconds)
  return 'frozen'
}

// Slows `ai` to `factor` (0-1) of its speed until now + seconds; the stronger
// (lower) factor wins while two slows overlap.
export function applySlow(ai, now, seconds, factor) {
  const running = now < (ai.slowUntil ?? -Infinity)
  ai.slowFactor = running ? Math.min(ai.slowFactor ?? 1, factor) : factor
  ai.slowUntil = Math.max(ai.slowUntil ?? -Infinity, now + seconds)
}

export function isFrozen(ai, now) {
  return now < (ai.frozenUntil ?? -Infinity)
}

// How fast time runs for this monster right now: 0 while frozen, otherwise the
// slowest of its own slow and the arena-wide Time Warp (`warpUntil`/`warpFactor`).
export function statusTimeScale(ai, now, warpUntil = -Infinity, warpFactor = TIME_WARP_FACTOR) {
  if (isFrozen(ai, now)) return 0
  let scale = 1
  if (now < (ai.slowUntil ?? -Infinity)) scale = Math.min(scale, ai.slowFactor ?? 1)
  if (now < warpUntil) scale = Math.min(scale, warpFactor)
  return scale
}
