// Pure, Three-free smoothing math: frame-rate-independent exponential
// damping (toward a value, or toward an angle via the shortest arc) and
// a linear velocity ramp (ease into/out of a target speed over a fixed
// time instead of snapping to it). Kept free of Three.js imports so
// Vitest can exercise it without WebGL; src/main.js, src/player.js, and
// src/monster.js use it for camera follow/look-ahead, screen shake,
// character facing, and movement acceleration.

// Exponential damping toward `target`: frame-rate independent (splitting
// the same elapsed time across more/fewer frames gives the same result,
// since exponential decay composes exactly -- exp(-k*a) * exp(-k*b) ==
// exp(-k*(a+b))), unlike a fixed-fraction-per-frame lerp. `lambda` is
// how fast it converges: after 1/lambda seconds, about 63% of the
// remaining distance to `target` has closed.
export function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt)
}

// Wraps an angle (radians) to (-PI, PI].
export function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

// Like damp, but for an angle (radians): always turns the SHORTEST way
// around, rather than the long way when current/target straddle the
// +-PI wraparound (e.g. going from 3.0 to -3.0 rad turns through PI,
// not all the way back around through 0).
export function dampAngle(current, target, lambda, dt) {
  const shortestDelta = wrapAngle(target - current)
  return wrapAngle(current + damp(0, shortestDelta, lambda, dt))
}

// Moves `current` toward `target` at a constant `rate` (units/second),
// clamped so it never overshoots -- a linear ramp, for easing a speed
// into or out of its target over a fixed time (rate = target / rampTime
// takes about rampTime seconds to go from 0 to target).
export function rampToward(current, target, rate, dt) {
  const maxDelta = Math.abs(rate) * dt
  const delta = target - current
  if (Math.abs(delta) <= maxDelta) return target
  return current + Math.sign(delta) * maxDelta
}
