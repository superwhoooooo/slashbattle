// Pure, Three-free rules for the player's bullets (firearms and the Bullet
// Ring ability): a bullet is a plain { x, z, vx, vz, life, damage, radius,
// pierce, explode, knockback, cause, ambush } object that flies straight until it
// touches a monster, runs out of life, or leaves the platform. The pooled
// meshes live in src/bullets.js.
import { distanceBonus, rollCrit } from './rifles.js'
import { fanVelocities, projectileHits, stepProjectile } from './projectiles.js'

// The bullets one trigger pull makes: `pellets` of them in a `spread`-radian
// fan around `aimAngle`, each carrying the weapon's bullet stats.
export function makeBullets(weapon, { x, z, aimAngle, damageMultiplier = 1, knockbackMultiplier = 1, ambush = false, steady = 0, rng = Math.random }) {
  const { bullet } = weapon
  return fanVelocities(aimAngle, weapon.pellets, weapon.spread, bullet.speed).map(({ vx, vz }) => {
    // Rifles (logic/rifles.js) roll each bullet for a crit: more damage, flagged for a popup.
    const crit = rollCrit((weapon.critChance ?? 0) + (weapon.steady ?? 0) * steady, rng)
    return {
    x,
    z,
    vx,
    vz,
    life: bullet.life,
    damage: weapon.damage * damageMultiplier * (crit ? weapon.critMult ?? 2 : 1),
    crit,
    longShot: weapon.longShot ?? 0, // scope bonuses (logic/rifles.js): damage grows with distance flown,
    closeShot: weapon.closeShot ?? 0, // or is boosted for a hit right off the muzzle
    traveled: 0,
    maxRange: bullet.speed * bullet.life,
    radius: bullet.radius,
    pierce: bullet.pierce,
    explode: bullet.explode,
    freeze: bullet.freeze ?? 0, // seconds a hit freezes the monster solid (Frost Lance)
    knockback: weapon.knockback * knockbackMultiplier,
    color: bullet.color,
    cause: weapon.cause ?? 'gun',
    weaponId: weapon.id ?? null, // which weapon fired it (null for the Bullet Ring), for its trail/impact effects
    ambush,
    hitIds: new Set(),
    }
  })
}

// Advances a bullet and finds the monsters (those passed in `targets`, each
// { id, x, z, radius }) it newly touches this tick. A bullet never hits the
// same monster twice. Returns { alive, hits } -- `alive` is false once it
// has run out of life or spent its pierce on a hit.
export function stepBullet(bullet, dt, targets) {
  bullet.traveled += Math.hypot(bullet.vx, bullet.vz) * dt
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

// What a bullet deals right now: its damage plus the scope's distance bonus
// (longShot / closeShot). Returns { damage, bonus } so callers can call out a long shot.
export function bulletDamage(bullet) {
  const bonus = distanceBonus(bullet)
  return { damage: bullet.damage * (1 + bonus), bonus }
}
