// Pure, Three-free rules for the water rooms (the pool room, the ocean, the reef
// aquarium). You float on the surface in third person, or dive under it in first
// person; water has momentum, waves, a limited breath and murky sight.

export const WATER = {
  floatY: -0.3, // how deep a swimmer's feet sit while floating (the surface is y = 0)
  diveY: -1.7, // and while diving
  depth: 9, // the floor under the surface
  breath: 14, // seconds you can stay under
  breathRegen: 3, // surface recovery speed, times real time
  drownDamageFraction: 0.12, // of max HP, when the breath runs out
  diveSightScale: 0.4, // monsters see a diver only this fraction as far
  surfaceSpeedScale: 0.9,
  diveSpeedScale: 0.8,
  accel: 2.6, // how fast a swimmer gets up to speed (lower = more momentum)
  drag: 1.6, // how fast one coasts to a stop with no input
  bulletSpeedScale: 0.75, // shots underwater
  bulletLifeScale: 0.8,
  knockbackScale: 1.5, // everything slides farther in water
  minDiveForAmbush: 1.0, // seconds under before surfacing counts as an ambush
}

// The height of the water surface at (x, z) at time t: a few crossing waves.
export function waveHeight(x, z, t, amp = 0.18) {
  return (
    amp * (0.55 * Math.sin(x * 0.35 + t * 1.3) + 0.3 * Math.sin(z * 0.45 - t * 1.7 + 1.3) + 0.15 * Math.sin((x + z) * 0.8 + t * 2.4))
  )
}

// One swimming velocity step: eases toward the wished velocity with `accel` while the
// player pushes, and coasts down with `drag` when they let go. Returns a new { x, z }.
export function stepSwim(vel, wish, dt, { accel = WATER.accel, drag = WATER.drag } = {}) {
  const pushing = wish.x !== 0 || wish.z !== 0
  const k = 1 - Math.exp(-(pushing ? accel : drag) * dt)
  return { x: vel.x + (wish.x - vel.x) * k, z: vel.z + (wish.z - vel.z) * k }
}

// The breath after `dt`: drains while diving, refills at the surface. `out` is true the
// moment it hits zero while diving (time to be forced up).
export function stepBreath(breath, diving, dt) {
  if (diving) {
    const next = Math.max(0, breath - dt)
    return { breath: next, out: next <= 0 }
  }
  return { breath: Math.min(WATER.breath, breath + dt * WATER.breathRegen), out: false }
}

// Eases the swimmers' depth toward where it should be (floating or diving).
export function stepDepth(y, diving, dt) {
  const target = diving ? WATER.diveY : WATER.floatY
  return y + (target - y) * (1 - Math.exp(-7 * dt))
}

// Bullets fired underwater are slower and shorter-lived.
export function waterBullet(bullet, underwater) {
  if (!underwater) return bullet
  return { ...bullet, speed: bullet.speed * WATER.bulletSpeedScale, life: bullet.life * WATER.bulletLifeScale }
}
