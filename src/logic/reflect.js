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
