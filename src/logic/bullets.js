// Pure, Three-free rules for the player's bullets (firearms and the Bullet
// Ring ability): a bullet is a plain { x, z, vx, vz, life, damage, radius,
// pierce, explode, knockback, cause, ambush } object that flies straight until it
// touches a monster, runs out of life, or leaves the platform. The pooled
// meshes live in src/bullets.js.
import { fanVelocities, projectileHits, stepProjectile } from './projectiles.js'

// The bullets one trigger pull makes: `pellets` of them in a `spread`-radian
// fan around `aimAngle`, each carrying the weapon's bullet stats.
export function makeBullets(weapon, { x, z, aimAngle, damageMultiplier = 1, knockbackMultiplier = 1, ambush = false }) {
  const { bullet } = weapon
  return fanVelocities(aimAngle, weapon.pellets, weapon.spread, bullet.speed).map(({ vx, vz }) => ({
    x,
    z,
    vx,
    vz,
    life: bullet.life,
    damage: weapon.damage * damageMultiplier,
    radius: bullet.radius,
    pierce: bullet.pierce,
    explode: bullet.explode,
    knockback: weapon.knockback * knockbackMultiplier,
    color: bullet.color,
    cause: weapon.cause ?? 'gun',
    weaponId: weapon.id ?? null, // which weapon fired it (null for the Bullet Ring), for its trail/impact effects
    ambush,
    hitIds: new Set(),
  }))
}

// Advances a bullet and finds the monsters (those passed in `targets`, each
// { id, x, z, radius }) it newly touches this tick. A bullet never hits the
// same monster twice. Returns { alive, hits } -- `alive` is false once it
// has run out of life or spent its pierce on a hit.
export function stepBullet(bullet, dt, targets) {
  let alive = stepProjectile(bullet, dt)
  const hits = []
  if (!alive) return { alive, hits }
  for (const target of targets) {
    if (bullet.hitIds.has(target.id)) continue
    if (!projectileHits(bullet, target, target.radius)) continue
    bullet.hitIds.add(target.id)
    hits.push(target)
    if (bullet.pierce <= 0) {
      alive = false
      break
    }
    bullet.pierce -= 1
  }
  return { alive, hits }
}
