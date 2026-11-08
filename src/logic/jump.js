// Pure jump + paraglider physics for the free roam world. Space hops; pressing Space again in the air opens
// the paraglider (a slow, steady sink with a speed boost); pressing it once more folds it. Not an ability: no
// cooldown, no charges. The state tracks absolute altitude, so you can launch off a hilltop and glide down.

export const JUMP_VELOCITY = 12 // upward speed at take-off (units/second)
export const JUMP_GRAVITY = 27 // pull back down (units/second^2); a jump peaks near 2.7 and lasts about 0.9s
export const GLIDE_SINK = 3.2 // the steady fall speed under the paraglider
export const GLIDE_SPEED_MULTIPLIER = 1.7 // run speed while gliding

export function createJumpState() {
  return { alt: 0, vy: 0, air: false, gliding: false }
}

export const isAirborne = (state) => state.air
export const isGliding = (state) => state.air && state.gliding

// One step. `want`: Space pressed this frame. `ground`: the ground height under the player.
// Returns { state, jumped, landed, opened, closed, height } where height is metres above the ground.
export function stepJump(state, want, dt, ground = 0) {
  let { alt, vy, air, gliding } = state
  let jumped = false
  let landed = false
  let opened = false
  let closed = false
  if (!air) alt = ground
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
    alt += vy * dt
    if (alt <= ground) {
      alt = ground
      vy = 0
      air = false
      gliding = false
      landed = true
    }
  }
  return { state: { alt, vy, air, gliding }, jumped, landed, opened, closed, height: Math.max(0, alt - ground) }
}
