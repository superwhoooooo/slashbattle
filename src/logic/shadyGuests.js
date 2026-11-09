// Pure, Three-free rules for three "shady guests": regular enemies whose ideas come from
// Shardfall's Sniper, Burrower and Treasure Goblin, reworked for the resort with their own twists.
//
//   paparazzo - keeps its distance and tracks a red laser onto where you're HEADING, locks it, then
//               fires a camera-flash beam down the line. The flash hits every monster in the lane too
//               (trick "Photobomb"), so you can bait it into shooting its friends.
//   gopher    - burrows under the deck (untouchable, only a hump of its back shows), tunnels after
//               you, stops and marks the spot, then erupts in a ring of golf balls. Coming up leaves
//               it dazed for a moment, taking extra damage (a kill then is "Whack-a-Mole").
//   bandit    - the Bellhop Bandit does no damage: it rushes you, swipes a share of your crystals and
//               runs. Every hit makes its sack leak a few back; kill it for the rest plus a tip, or it
//               checks out with your crystals when its getaway timer runs out.
//
// monster.js runs the state machines (stepSnipe / stepBurrow) and main.js turns their events into
// beams, eruptions and crystal changes.
import { clampToPlatform } from './arena.js'
import { predictPosition } from './enemies.js'

// Stats in MONSTER_TYPES' shape. `behavior` picks the state machine in monster.js; `accessory`
// the add-ons in characters.js (the Realist creatures are in beasts.js).
export const SHADY_TYPES = {
  paparazzo: { shape: 'cylinder', size: 1.2, color: 0x4a4466, edgeColor: 0xd4ccff, speed: 1.9, hp: 32, damage: 9, radius: 0.5, attackRange: 15, noMelee: true, behavior: 'snipe', accessory: 'camera' },
  gopher: { shape: 'dodecahedron', size: 1.25, color: 0xb57c45, edgeColor: 0xf3d6ae, speed: 2.0, hp: 50, damage: 8, radius: 0.55, behavior: 'burrow', accessory: 'gopher' },
  bandit: { shape: 'octahedron', size: 1.0, color: 0x7a5fae, edgeColor: 0xdccfff, speed: 3.8, hp: 40, damage: 1, radius: 0.45, attackRange: 1.3, noMelee: true, behavior: 'bandit', accessory: 'sack', knockbackScale: 0.8 },
}
export const SHADY_TYPE_IDS = Object.keys(SHADY_TYPES)
export const SHADY_SCORES = { paparazzo: 210, gopher: 200, bandit: 260 }

// Wave weights (folded into logic/waves.js's typeWeights): gophers from wave 4, paparazzi from 5,
// the odd bandit from 6. Each starts small and grows slowly, capped.
export function shadyWeights(n) {
  const weights = {}
  if (n >= 4) weights.gopher = Math.min(0.06 + 0.012 * (n - 4), 0.13)
  if (n >= 5) weights.paparazzo = Math.min(0.06 + 0.012 * (n - 5), 0.13)
  if (n >= 6) weights.bandit = Math.min(0.03 + 0.006 * (n - 6), 0.07)
  return weights
}

// ---- paparazzo -----------------------------------------------------------------------------

export const SNIPE = {
  keepAway: 8, // backs off when you come closer than this
  aim: 1.5, // seconds the laser tracks you
  lock: 0.45, // seconds it holds still (blinking) before the flash: your cue to sidestep
  cooldown: 4, // seconds between shots
  firstDelay: 1.2,
  lead: 0.5, // aims where you'll be this many seconds from now
  length: 34,
  width: 0.3, // the flash beam's half-width: its look (about 1 unit across) and its hit area
  damageMultiplier: 1,
}

// A fresh snipe cycle: cooling down before its first aim.
export function createSnipeState() {
  return { phase: 'cool', t: SNIPE.firstDelay }
}

// Advances the cool -> aim -> lock -> (fire) -> cool cycle. Returns { state, fire }.
export function stepSnipe(state, dt) {
  const t = state.t - dt
  if (t > 0) return { state: { ...state, t }, fire: false }
  if (state.phase === 'cool') return { state: { phase: 'aim', t: SNIPE.aim }, fire: false }
  if (state.phase === 'aim') return { state: { phase: 'lock', t: SNIPE.lock }, fire: false }
  return { state: { phase: 'cool', t: SNIPE.cooldown }, fire: true }
}

// The heading (atan2(dx, dz), like every other aim in the game) from `from` to where the player
// will be `SNIPE.lead` seconds from now at their smoothed velocity.
export function snipeAim(from, playerPos, playerVel, lead = SNIPE.lead) {
  const at = predictPosition(playerPos, playerVel, lead)
  return Math.atan2(at.x - from.x, at.z - from.z)
}

// True if `point` is inside a beam fired from `origin` along `aim` (forward only), `length` long
// and `width` wide either side of its centre line, with `pad` extra for the target's own size.
export function beamHits(origin, aim, length, width, point, pad = 0) {
  const px = point.x - origin.x
  const pz = point.z - origin.z
  const along = px * Math.sin(aim) + pz * Math.cos(aim)
  const across = Math.abs(px * Math.cos(aim) - pz * Math.sin(aim))
  return along > 0 && along < length && across <= width + pad
}

// ---- gopher --------------------------------------------------------------------------------

export const BURROW = {
  upTime: 2.6, // seconds above ground (walking, biting) between burrows
  firstDelay: 1.0,
  maxUnder: 4.5, // seconds it tunnels before coming up wherever it got to
  speedMultiplier: 2.1, // it's quicker underground
  closeEnough: 1.0, // stops right under you
  warn: 1.2, // seconds the ring shows before it erupts: move!
  radius: 2.6, // eruption radius
  damageMultiplier: 1.2,
  balls: 8, // golf balls flung out in a ring
  dazed: 2.2, // seconds it sits stunned after coming up
  dazedDamageMultiplier: 1.5,
  sink: 0.72, // how much of its body (x size) is under the deck while burrowed
}

export function createBurrowState() {
  return { phase: 'up', t: BURROW.firstDelay }
}

// Advances the up -> under -> marked -> (erupt) -> dazed -> up cycle. `engaged` is whether it is
// after the player (chase/attack, player not hidden); `distance` how far it is from them.
// Returns { state, event }: event is null, 'dig' (it went under), 'mark' (it stopped: show the
// ring), 'erupt' (it bursts up: damage and golf balls) or 'surface' (it lost you and came up quietly).
export function stepBurrow(state, dt, { engaged, distance }) {
  const t = state.t - dt
  switch (state.phase) {
    case 'up':
      if (t <= 0 && engaged && distance > BURROW.closeEnough * 2) return { state: { phase: 'under', t: BURROW.maxUnder }, event: 'dig' }
      return { state: { phase: 'up', t: Math.max(0, t) }, event: null }
    case 'under':
      if (!engaged) return { state: { phase: 'up', t: BURROW.upTime }, event: 'surface' }
      if (t <= 0 || distance <= BURROW.closeEnough) return { state: { phase: 'marked', t: BURROW.warn }, event: 'mark' }
      return { state: { phase: 'under', t }, event: null }
    case 'marked':
      if (t <= 0) return { state: { phase: 'dazed', t: BURROW.dazed }, event: 'erupt' }
      return { state: { phase: 'marked', t }, event: null }
    default: // dazed
      if (t <= 0) return { state: { phase: 'up', t: BURROW.upTime }, event: null }
      return { state: { phase: 'dazed', t }, event: null }
  }
}

// True while it's out of reach underground (tunnelling or about to erupt).
export const isBurrowed = (state) => state?.phase === 'under' || state?.phase === 'marked'

// ---- bandit --------------------------------------------------------------------------------

export const BANDIT = {
  stealFraction: 0.3, // of your crystals
  stealMin: 3,
  stealMax: 40,
  fleeTime: 8, // seconds to catch it before it checks out
  fleeSpeedMultiplier: 0.88, // a touch slower than its rush, so you can run it down
  fleeDistance: 7, // how far ahead it aims each step of its getaway
  leakFraction: 0.2, // of its sack, spilled on every hit
  tip: 0.25, // extra on top of the sack when you catch it
}

// How many crystals a swipe takes from `crystals`: a share, at least stealMin (never more than you
// have), at most stealMax.
export function stealAmount(crystals) {
  if (crystals <= 0) return 0
  const want = Math.max(BANDIT.stealMin, Math.min(BANDIT.stealMax, Math.round(crystals * BANDIT.stealFraction)))
  return Math.min(crystals, want)
}

// How many crystals spill out of a sack holding `stolen` on a (non-lethal) hit.
export function leakAmount(stolen) {
  if (stolen <= 0) return 0
  return Math.min(stolen, Math.max(1, Math.ceil(stolen * BANDIT.leakFraction)))
}

// What you get back for catching it with `stolen` still in the sack: the lot plus a tip.
export function refundWithTip(stolen) {
  return stolen > 0 ? stolen + Math.ceil(stolen * BANDIT.tip) : 0
}

// Splits `total` crystals into gem values (5s, then 2s, then 1s) for dropCrystals.
export function crystalChange(total) {
  const values = []
  let left = Math.max(0, Math.floor(total))
  for (const v of [5, 2, 1]) {
    while (left >= v) {
      values.push(v)
      left -= v
    }
  }
  return values
}

// Where a fleeing bandit heads next: straight away from the player, kept `margin` in from the edge
// of a platform of `radius`. Cornered at the edge it slides along it, away from you.
export function fleeTarget(pos, playerPos, radius, margin = 2) {
  let dx = pos.x - playerPos.x
  let dz = pos.z - playerPos.z
  const d = Math.hypot(dx, dz)
  if (d < 1e-6) {
    dx = 1
    dz = 0
  } else {
    dx /= d
    dz /= d
  }
  const limit = radius - margin
  const ahead = { x: pos.x + dx * BANDIT.fleeDistance, z: pos.z + dz * BANDIT.fleeDistance }
  if (Math.hypot(ahead.x, ahead.z) <= limit) return ahead
  // At the edge: run along it, picking the tangent that leads away from the player.
  const r = Math.hypot(pos.x, pos.z) || 1
  const tx = -pos.z / r
  const tz = pos.x / r
  const sign = tx * dx + tz * dz >= 0 ? 1 : -1
  return clampToPlatform({ x: pos.x + tx * sign * BANDIT.fleeDistance, z: pos.z + tz * sign * BANDIT.fleeDistance }, limit)
}
