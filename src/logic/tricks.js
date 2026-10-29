// Pure, Three-free trick naming and kill-chain logic: every kill gets a
// named trick (shown on its score popup) and quick successive kills
// build a score multiplier. Kept free of Three.js imports so Vitest can
// exercise it without WebGL; src/main.js is the driver that works out
// each kill's cause (and whether it's a boss, in a pool, or an ambush)
// and feeds it in here.
import { CHAIN_MAX, CHAIN_STEP, CHAIN_WINDOW } from '../config.js'

// Picks a trick name for a kill from its circumstances. Precedence
// (highest wins when several apply to the same kill, so the funniest
// specific name comes out on top):
//   1. boss         -> "VIP Checkout" if it fell, else "Do Not Disturb"
//      (a boss kill always gets its own name, fall or not)
//   2. fall/ring-out -> "Checkout" (beats merely standing in a pool)
//   3. in a pool     -> "Cannonball"
//   4. ambush        -> "Room Service"
//   5. pet zap       -> "Turndown Service"
//   6. Shockwave     -> "Wake-Up Call"
//   7. anything else (a plain sword hit) -> "Slash"
export function nameTrick({ cause, inPool = false, ambush = false, boss = false } = {}) {
  const fell = cause === 'fall'
  if (boss) return fell ? { id: 'vipCheckout', name: 'VIP Checkout' } : { id: 'doNotDisturb', name: 'Do Not Disturb' }
  if (fell) return { id: 'checkout', name: 'Checkout' }
  if (inPool) return { id: 'cannonball', name: 'Cannonball' }
  if (ambush) return { id: 'roomService', name: 'Room Service' }
  if (cause === 'pet') return { id: 'turndownService', name: 'Turndown Service' }
  if (cause === 'shockwave') return { id: 'wakeUpCall', name: 'Wake-Up Call' }
  return { id: 'slash', name: 'Slash' }
}

// A fresh chain: no kills yet, so it reads as already expired until the
// first one lands.
export function createChainState() {
  return { count: 0, multiplier: 1, lastKillAt: -Infinity, lastTrickId: null }
}

// True if the chain begun/extended at state.lastKillAt has gone cold by
// `now` -- the HUD uses this to hide the chain indicator once a kill
// hasn't landed in a while. Doesn't touch `state`.
export function hasChainExpired(state, now) {
  return now - state.lastKillAt > CHAIN_WINDOW
}

// The multiplier for a chain `count` kills long: 1x for the first kill,
// rising by CHAIN_STEP per additional one, capped at CHAIN_MAX.
function multiplierForCount(count) {
  return Math.min(1 + CHAIN_STEP * (count - 1), CHAIN_MAX)
}

// Advances the chain for a kill landing at `now` (with the trick id that
// named it, for the caller/HUD to reference): within CHAIN_WINDOW
// seconds of the previous kill it extends (one more count, a bigger
// multiplier), otherwise it resets to a fresh chain of 1. Returns a new
// state rather than mutating `state`.
export function stepChain(state, now, trickId = null) {
  const extend = !hasChainExpired(state, now)
  const count = extend ? state.count + 1 : 1
  return { count, multiplier: multiplierForCount(count), lastKillAt: now, lastTrickId: trickId }
}

// Rounds a kill's base points scaled by the chain multiplier to the
// nearest integer.
export function trickPoints(basePoints, multiplier) {
  return Math.round(basePoints * multiplier)
}
