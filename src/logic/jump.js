// Pure jump + paraglider physics for the free roam world. Space hops; pressing Space again in the air opens
// the paraglider (a slow, steady sink with a speed boost); pressing it once more folds it. Not an ability: no
// cooldown, no charges. The state tracks absolute altitude, so you can launch off a hilltop and glide down.

export const JUMP_VELOCITY = 12 // upward speed at take-off (units/second)
export const JUMP_GRAVITY = 27 // pull back down (units/second^2); a jump peaks near 2.7 and lasts about 0.9s
export const GLIDE_SINK = 3.2 // the steady fall speed under the paraglider
export const GLIDE_SPEED_MULTIPLIER = 1.7 // run speed while gliding
export const LEDGE_DROP = 1.6 // the ground falling away by more than this in one step (an isle's edge) sends you airborne
export const TERMINAL_FALL = 48 // the fastest you ever fall (a long drop from a sky isle)

export function createJumpState() {
  return { alt: 0, vy: 0, air: false, gliding: false }
}

export const isAirborne = (state) => state.air
export const isGliding = (state) => state.air && state.gliding

// Fired up into the sky (a Skylift tower): airborne, rising at `vy`, glider folded.
export const launchJump = (state, vy) => ({ ...state, vy, air: true, gliding: false })

// One step. `want`: Space pressed this frame. `ground`: the ground height under the player. `lift`: an updraft's
// rise speed here (only an open glider rides it).
// Returns { state, jumped, landed, opened, closed, height, impact } where height is metres above the ground and
// impact the speed you hit the ground at (on the frame you land).
export function stepJump(state, want, dt, ground = 0, lift = 0) {
  let { alt, vy, air, gliding } = state
  let jumped = false
  let landed = false
  let opened = false
  let closed = false
  let impact = 0
  if (!air) {
    if (ground < alt - LEDGE_DROP) {
      air = true // walked off an edge
      vy = 0
    } else alt = ground
  }
  if (want) {
    if (!air) {
      air = true
      vy = JUMP_VELOCITY
      jumped = true
    } else if (!gliding) {
      gliding = true
      opened = true
    } else {
      gliding = false
      closed = true
    }
  }
  if (air) {
    vy -= JUMP_GRAVITY * dt
    if (gliding) vy = Math.max(vy, -GLIDE_SINK)
    if (gliding && lift > 0) vy = Math.max(vy, lift)
    vy = Math.max(vy, -TERMINAL_FALL)
    alt += vy * dt
    if (alt <= ground) {
      impact = -vy
      alt = ground
      vy = 0
      air = false
      gliding = false
      landed = true
    }
  }
  return { state: { alt, vy, air, gliding }, jumped, landed, opened, closed, impact, height: Math.max(0, alt - ground) }
}
