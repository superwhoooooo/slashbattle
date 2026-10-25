// Pure, Three-free particle physics and pool slot allocation. Kept free
// of Three.js imports so Vitest can exercise it without WebGL; the
// Three-side pooled THREE.Points/InstancedMesh driver lives in
// src/particles.js.

// Advances one particle's kinematic state by dt: gravity pulls down,
// drag scales velocity toward zero, age increases. Returns the next
// tick's state; does not mutate `particle`.
export function stepParticle(particle, dt, gravity, drag) {
  const vx = particle.vx * drag
  const vy = (particle.vy - gravity * dt) * drag
  const vz = particle.vz * drag
  return {
    x: particle.x + vx * dt,
    y: particle.y + vy * dt,
    z: particle.z + vz * dt,
    vx,
    vy,
    vz,
    age: particle.age + dt,
  }
}

// 1 at birth, fading linearly to 0 at the end of its life (clamped).
export function particleAlpha(age, life) {
  if (life <= 0) return 0
  return Math.max(0, Math.min(1, 1 - age / life))
}

// Shrinks linearly from 1 at birth to 0 at the end of its life (clamped).
// Same curve as particleAlpha today, but kept separate since "fade" and
// "shrink" are conceptually different knobs a caller might want to tune
// independently later.
export function particleScale(age, life) {
  return particleAlpha(age, life)
}

// True once a particle has outlived its life.
export function isParticleDead(age, life) {
  return age >= life
}

// Picks the `count` consecutive pool slot indices to use for a new
// burst, ring-buffering around `poolSize`, plus the next cursor to pass
// into the following call. Reusing slots -- even ones still animating --
// is what makes the pool allocation-free: a burst never grows the pool,
// it just overwrites whichever slots are oldest in submission order.
export function allocateSlots(cursor, poolSize, count) {
  const indices = []
  for (let i = 0; i < count; i++) {
    indices.push((cursor + i) % poolSize)
  }
  return { indices, nextCursor: (cursor + count) % poolSize }
}
