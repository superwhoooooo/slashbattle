// How a Realist creature moves its body, learned from Shardfall's monsters (pure, no Three.js):
//
// - Legs follow real ground speed: the step cycle advances by the ground actually covered divided by
//   how far a foot reaches, so feet plant instead of skating. Walking backwards runs the cycle in
//   reverse, a teleport (blink, knockback snap) is not a stride, and a tiny fast creature tops out
//   at a fast scuttle.
// - The body rides each stride: a small bob twice per cycle (one per footfall).
// - Legless creatures crawl instead: a volume-keeping squash-and-stretch pulse tied to distance.
// - It leans into its run (more when speeding up), banks into turns, and breathes when still.
//
// `state` is mutated and returned; feed it the creature's displacement this frame.

export const WALK_AMP = 1.2 // how far legs swing at a full stride (multiplies the design's own lift / stride)
const MAX_STEP_RATE = 34 // radians/second: the fastest scuttle
const TELEPORT_SPEED = 45 // faster than this in one frame is a teleport, not a stride
const BOB = 0.035 // stride bob, as a share of body size
const CRAWL = 0.07 // legless crawl pulse strength
const MAX_LEAN = 0.16 // radians, forward lean at a run
const MAX_BANK = 0.14 // radians, sideways bank in a hard turn
const BREATH = 0.022 // idle breathing, share of body size

export function createMotionState(seed = 0) {
  return { phase: seed, speed: 0, lean: 0, bank: 0, lastFacing: null, breathPhase: seed * 1.7 }
}

// dx, dz: how far it moved this frame (world units); dt: seconds; facing: its yaw (atan2(x, z));
// reach: how far a foot sweeps per step, in world units (0 for a legless creature).
export function stepMotion(state, { dx = 0, dz = 0, dt, facing = 0, reach = 0 }) {
  const out = { phase: state.phase, amp: 0, bob: 0, crawl: 0, lean: state.lean, bank: state.bank, breath: 0 }
  if (!(dt > 0)) return out
  const dist = Math.hypot(dx, dz)
  let v = dist / dt
  if (v > TELEPORT_SPEED) v = 0
  state.speed += (v - state.speed) * Math.min(1, dt * 10)
  const accel = (v - state.speed) // positive while speeding up

  // Backwards? (moving against the way it faces)
  const back = dist > 1e-6 && dx * Math.sin(facing) + dz * Math.cos(facing) < -0.25 * dist
  const legs = reach > 0
  const rate = Math.min(MAX_STEP_RATE, state.speed / (legs ? reach : 0.6))
  state.phase += rate * dt * (back ? -1 : 1)

  const amp = Math.min(1, state.speed / 0.8)
  out.phase = state.phase
  out.amp = WALK_AMP * amp
  if (legs) out.bob = Math.sin(state.phase * 2) * BOB * amp
  else out.crawl = Math.sin(state.phase * 2) * CRAWL * amp

  // Lean into the run (a little extra while accelerating), ease back upright when stopping.
  const leanTarget = Math.max(-MAX_LEAN, Math.min(MAX_LEAN, state.speed * 0.025 + accel * 0.01)) * (back ? -0.6 : 1)
  state.lean += (leanTarget - state.lean) * Math.min(1, dt * 6)
  // Bank into turns: proportional to how fast it is turning, scaled by speed.
  let turn = 0
  if (state.lastFacing !== null) {
    turn = facing - state.lastFacing
    turn = Math.atan2(Math.sin(turn), Math.cos(turn)) / dt
  }
  state.lastFacing = facing
  const bankTarget = Math.max(-MAX_BANK, Math.min(MAX_BANK, -turn * 0.05 * Math.min(1, state.speed / 2)))
  state.bank += (bankTarget - state.bank) * Math.min(1, dt * 8)
  out.lean = state.lean
  out.bank = state.bank

  // Breathe: a slow swell, fading out as it gets moving.
  state.breathPhase += dt * 2.2
  out.breath = Math.sin(state.breathPhase) * BREATH * (1 - amp)
  return out
}
