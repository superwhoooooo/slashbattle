// Pure, Three-free combat rules: hit detection (range + facing arc),
// damage, knockback, cooldowns, and the ambush damage hook. Kept free of
// Three.js imports so Vitest can exercise it without WebGL.

// Bonus multiplier applied to damage when the hit is an ambush (used by the
// hiding milestone; the hook exists here so combat.js can wire it in now).
export const AMBUSH_DAMAGE_MULTIPLIER = 2

// Normalizes an angle (radians, any magnitude) to (-PI, PI].
function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

// True if targetPos is within `range` of attackerPos and within the
// `arcRadians`-wide cone centered on attackerFacingAngle. Angles follow the
// same convention as Player.facing: atan2(dx, dz), i.e. angle 0 points
// toward +Z. Correctly handles facing angles that wrap across -PI/PI.
export function isInAttackArc(attackerPos, attackerFacingAngle, targetPos, range, arcRadians) {
  const dx = targetPos.x - attackerPos.x
  const dz = targetPos.z - attackerPos.z
  const distance = Math.hypot(dx, dz)
  if (distance > range) return false

  const angleToTarget = Math.atan2(dx, dz)
  const angleDiff = normalizeAngle(angleToTarget - attackerFacingAngle)
  return Math.abs(angleDiff) <= arcRadians / 2
}

// Computes the damage a hit deals. Defaults to the base amount; an ambush
// hit (set by the hiding milestone) multiplies it.
export function computeDamage(base, { ambush = false } = {}) {
  return ambush ? base * AMBUSH_DAMAGE_MULTIPLIER : base
}

// Applies damage to an entity-like { hp } object without mutating it,
// returning the new hp (clamped at 0) and whether the hit was lethal.
export function applyDamage(entity, amount) {
  const hp = Math.max(0, entity.hp - amount)
  return { hp, lethal: hp <= 0 }
}

// The horizontal push an attack gives a hit target: the direction from
// attacker to target, scaled by strength. Safe (zero vector) when the two
// positions coincide, since that direction is undefined.
export function knockbackVector(fromPos, toPos, strength) {
  const dx = toPos.x - fromPos.x
  const dz = toPos.z - fromPos.z
  const distance = Math.hypot(dx, dz)
  if (distance === 0) return { x: 0, z: 0 }
  return { x: (dx / distance) * strength, z: (dz / distance) * strength }
}

// A simple cooldown: ready(now) is true once `seconds` have passed since
// the last trigger(now). Ready immediately before the first trigger.
export function createCooldown(seconds) {
  let readyAt = -Infinity
  return {
    ready(now) {
      return now >= readyAt
    },
    // `overrideSeconds` lets a different weapon use its own cooldown.
    trigger(now, overrideSeconds = seconds) {
      readyAt = now + overrideSeconds
    },
  }
}
