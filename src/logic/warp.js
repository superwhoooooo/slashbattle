// Pure rules for the screen-warp effects (see src/warp.js) and the Warp
// Field ability: how strong a warp is at a given age, and who a field grabs.

// A swirl fades in over `FADE_IN` seconds and out over the last `FADE_OUT`.
const FADE_IN = 0.25
const FADE_OUT = 0.45

// 0..1 strength of a swirl `age` seconds into a `life`-second life.
export function swirlStrength(age, life) {
  if (age < 0 || age >= life) return 0
  return Math.min(1, age / FADE_IN, (life - age) / FADE_OUT)
}

// A ripple's ring: radius fraction (eased out) and strength (fading out).
export function rippleState(age, life) {
  const t = Math.min(1, Math.max(0, age / life))
  return { radiusFraction: 1 - (1 - t) * (1 - t), strength: 1 - t }
}

export function inCircle(x, z, cx, cz, radius) {
  return Math.hypot(x - cx, z - cz) <= radius
}

// Where a Warp Field lands: `target` (the cursor's ground point) held within
// `maxRange` of the player, so you can't throw it across the map.
export function clampTargetToRange(origin, target, maxRange) {
  const dx = target.x - origin.x
  const dz = target.z - origin.z
  const d = Math.hypot(dx, dz)
  if (d <= maxRange || d < 1e-6) return { x: target.x, z: target.z }
  return { x: origin.x + (dx / d) * maxRange, z: origin.z + (dz / d) * maxRange }
}
