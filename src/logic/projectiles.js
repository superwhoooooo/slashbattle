// Pure, Three-free projectile rules for the boss barrage's orbs: a
// projectile is a plain { x, z, vx, vz, life, damage, radius } object that
// flies in a straight line until it hits the player or its life runs out.
// Kept free of Three.js so Vitest can exercise it without WebGL; the pooled
// meshes live in src/projectiles.js.

// A fan of `count` projectile velocities centered on `aimAngle` (atan2(dx,
// dz), like Player.facing), spread over `spread` radians total.
export function fanVelocities(aimAngle, count, spread, speed) {
  const velocities = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = aimAngle + (t - 0.5) * spread
    velocities.push({ vx: Math.sin(angle) * speed, vz: Math.cos(angle) * speed })
  }
  return velocities
}

// Moves a projectile one tick (mutating it) and returns whether it's still
// alive (life left).
export function stepProjectile(projectile, dt) {
  projectile.x += projectile.vx * dt
  projectile.z += projectile.vz * dt
  projectile.life -= dt
  return projectile.life > 0
}

// True if the projectile's circle overlaps the target's circle.
export function projectileHits(projectile, target, targetRadius) {
  return Math.hypot(projectile.x - target.x, projectile.z - target.z) <= projectile.radius + targetRadius
}
