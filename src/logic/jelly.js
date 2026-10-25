// Pure, Three-free jelly deformation math: a stable spring-damper
// integrator and the per-vertex displacement function that makes a
// low-poly body wobble, bulge, and splat. Kept free of Three.js imports
// so Vitest can exercise it without WebGL; the Three-side driver lives in
// src/jelly.js.

// Semi-implicit Euler, substepped so it stays stable even at a large dt
// (a dropped frame, or a test calling it with dt = 0.1): acceleration
// pulls `value` toward `target` (stiffness) while velocity is damped
// (damping), which is what lets it overshoot and oscillate before
// settling -- the "boing".
const MAX_SUBSTEP = 1 / 60

export function springStep(state, target, stiffness, damping, dt) {
  let { value, velocity } = state
  let remaining = dt

  while (remaining > 0) {
    const step = Math.min(remaining, MAX_SUBSTEP)
    const acceleration = (target - value) * stiffness - velocity * damping
    velocity += acceleration * step
    value += velocity * step
    remaining -= step
  }

  return { value, velocity }
}

// The jelly displacement for one vertex, as a pure function of its
// ORIGINAL position (never the previous frame's displaced position, so
// duplicated flat-shaded vertices that share an original position always
// move together and faces never tear). Returns [dx, dy, dz].
//
// params:
//   idleAmplitude, idleSpeed, idlePhase -- a traveling ripple pushed
//     along each vertex's own radial direction from the body's center,
//     so the surface breathes without changing the overall silhouette.
//   bulge, bulgeDirX, bulgeDirZ -- movement squash/stretch: stretches
//     along the (horizontal, normalized) movement direction and squashes
//     vertically, proportional to how far the vertex already is along
//     each axis (scaling the shape rather than shearing it).
//   hit -- a spring value shared by the hit splat, the attack wind-up,
//     and the death burst: >= 0 flattens (squash vertically, widen
//     horizontally, conserving volume); < 0 inflates evenly outward.
export function jellyOffset(origX, origY, origZ, time, params) {
  const {
    idleAmplitude = 0,
    idleSpeed = 0,
    idlePhase = 0,
    bulge = 0,
    bulgeDirX = 0,
    bulgeDirZ = 0,
    hit = 0,
  } = params

  const radial = Math.hypot(origX, origY, origZ)
  const ripple = radial > 1e-6 ? idleAmplitude * Math.sin(radial * 3 + time * idleSpeed + idlePhase) : 0
  const rippleScale = radial > 1e-6 ? ripple / radial : 0
  let dx = origX * rippleScale
  let dy = origY * rippleScale
  let dz = origZ * rippleScale

  const along = origX * bulgeDirX + origZ * bulgeDirZ
  dx += bulgeDirX * along * bulge
  dz += bulgeDirZ * along * bulge
  dy += -origY * bulge * 0.5

  if (hit >= 0) {
    dx += origX * hit * 0.5
    dy += -origY * hit
    dz += origZ * hit * 0.5
  } else {
    const inflate = -hit
    dx += origX * inflate
    dy += origY * inflate
    dz += origZ * inflate
  }

  return [dx, dy, dz]
}
