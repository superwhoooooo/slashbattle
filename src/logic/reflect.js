// Pure, Three-free rule for the mirror enemy: an attack that comes from inside the
// mirror's front arc bounces off it; one from the side or behind gets through.
// `yaw` is the monster's facing (forward = (sin, cos)), `halfArc` the half-angle of
// the mirror's coverage in radians.
export function isFrontHit(yaw, monsterPos, fromPos, halfArc) {
  const dx = fromPos.x - monsterPos.x
  const dz = fromPos.z - monsterPos.z
  const length = Math.hypot(dx, dz)
  if (length < 1e-6) return true // right on top of it: the mirror is in the way
  const dot = (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / length
  return Math.acos(Math.max(-1, Math.min(1, dot))) <= halfArc
}

// What a reflected bullet comes back as: a fraction of its damage, kept in a sane band.
export function reflectedDamage(bulletDamage) {
  return Math.max(4, Math.min(14, Math.round(bulletDamage * 0.35)))
}

// The thorns a mirror deals to a melee attacker who swings into its front.
export const MELEE_REFLECT_DAMAGE = 4

// The mirror's shield wears out. Every attack it bounces is a "hit" on the glass; after
// `hits` of them it breaks and attacks go straight through. A boss's mirror (`regrow` > 0)
// grows back that many seconds later; a regular enemy's stays broken.
export function createShield(reflect) {
  return { hits: reflect.hits ?? Infinity, taken: 0, broken: false, regrow: reflect.regrow ?? 0, regrowIn: 0 }
}

// Whether the mirror is up and bouncing things.
export function shieldActive(shield) {
  return !shield.broken
}

// Records one bounced attack. Returns true if that hit broke the shield.
export function hitShield(shield) {
  if (shield.broken) return false
  shield.taken += 1
  if (shield.taken < shield.hits) return false
  shield.broken = true
  shield.regrowIn = shield.regrow
  return true
}

// Ticks the regrow timer. Returns true on the frame the shield comes back.
export function stepShield(shield, dt) {
  if (!shield.broken || shield.regrow <= 0) return false
  shield.regrowIn -= dt
  if (shield.regrowIn > 0) return false
  shield.broken = false
  shield.taken = 0
  shield.regrowIn = 0
  return true
}

// How cracked the glass looks, 0 (pristine) to 1 (about to break).
export function crackFraction(shield) {
  return shield.broken ? 1 : Math.min(1, shield.taken / shield.hits)
}
