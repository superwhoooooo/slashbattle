// Pure jump physics for the free roam world: a plain hop on N (not an ability, no cooldown, no charges).
// One jump at a time: you must land before you can jump again.

export const JUMP_VELOCITY = 12 // upward speed at take-off (units/second)
export const JUMP_GRAVITY = 27 // pull back down (units/second^2); a jump peaks near 2.7 and lasts about 0.9s

export function createJumpState() {
  return { y: 0, vy: 0 }
}

export const isAirborne = (state) => state.y > 0 || state.vy > 0

// One step. `want` is whether jump was pressed this frame. Returns { state, jumped, landed }.
export function stepJump(state, want, dt) {
  let { y, vy } = state
  let jumped = false
  let landed = false
  if (want && !isAirborne(state)) {
    vy = JUMP_VELOCITY
    jumped = true
  }
  if (y > 0 || vy > 0) {
    vy -= JUMP_GRAVITY * dt
    y += vy * dt
    if (y <= 0) {
      y = 0
      vy = 0
      landed = true
    }
  }
  return { state: { y, vy }, jumped, landed }
}
