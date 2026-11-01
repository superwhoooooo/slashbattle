// Pure, Three-free rules for the late-game enemies (waves 4-6 on) and for
// how every regular enemy toughens up over time.
//   bloater  (wave 4) - keeps its distance and lobs poison at where you're GOING
//   spinner  (wave 5) - whirls in place and fires small orbs at you
//   splitter (wave 6) - bursts into two fast splitlings when killed
// plus `enemyScale(n)`: the hp / damage / speed multiplier wave `n` gives
// every non-boss monster.

// Ranged attack tuning, keyed by monster type. `keepAway` is the distance
// inside which the shooter backs off; it fires only while in `attackRange`
// (set on the type in config.js).
export const RANGED_ATTACKS = {
  bloater: { kind: 'lob', interval: 3.4, flight: 1.0, puddleRadius: 2.1, puddleLife: 4.5, tick: 0.6, keepAway: 6, windup: 0.6 },
  spinner: { kind: 'shoot', interval: 2.1, count: 3, spread: 0.5, speed: 8.5, orbSize: 0.6, keepAway: 4, windup: 0.4, spins: true },
}

// What a splitter leaves behind.
export const SPLITS = { splitter: { into: 'splitling', count: 2 } }

// Where a target moving at `velocity` will be in `leadTime` seconds.
export function predictPosition(position, velocity, leadTime) {
  return { x: position.x + velocity.x * leadTime, z: position.z + velocity.z * leadTime }
}

// A smoothed velocity estimate from two consecutive positions (blend 0 keeps
// the old estimate, 1 trusts only the newest sample). dt <= 0 (a hitstop
// freeze) leaves it alone.
export function smoothVelocity(velocity, previousPosition, position, dt, blend = 0.4) {
  if (!previousPosition || dt <= 0) return velocity
  const vx = (position.x - previousPosition.x) / dt
  const vz = (position.z - previousPosition.z) / dt
  return { x: velocity.x * (1 - blend) + vx * blend, z: velocity.z * (1 - blend) + vz * blend }
}

// Multipliers for a regular monster spawned on wave `n`: noticeably tougher
// every wave (capped on speed/damage so it stays fair), a boss is exempt.
export function enemyScale(n) {
  const w = Math.max(0, n - 1)
  return {
    hp: 1 + 0.1 * w,
    damage: Math.min(2.5, 1 + 0.06 * w),
    speed: Math.min(1.5, 1 + 0.03 * w),
  }
}

// A poison glob in flight / puddle on the ground. phase 'flying' for
// `flight` seconds (an arc from (sx, sz) to (x, z)), then 'puddle' for `life`
// seconds, hurting a non-hidden player standing within `radius` every `tick`.
export function createPoison({ sx, sz, x, z, flight, radius, life, tick, damage }) {
  return { sx, sz, x, z, flight, radius, life, tick, damage, phase: 'flying', elapsed: 0, tickLeft: 0 }
}

// Advances a poison one step (mutating it). Returns { alive, hit } where
// `hit` is true the tick the puddle should damage the player.
export function stepPoison(poison, dt, player, playerRadius) {
  poison.elapsed += dt
  if (poison.phase === 'flying') {
    if (poison.elapsed >= poison.flight) {
      poison.phase = 'puddle'
      poison.elapsed = 0
      poison.tickLeft = 0
    }
    return { alive: true, hit: false }
  }
  if (poison.elapsed >= poison.life) return { alive: false, hit: false }
  poison.tickLeft -= dt
  const inside = !player.hidden && Math.hypot(player.position.x - poison.x, player.position.z - poison.z) <= poison.radius + playerRadius
  if (inside && poison.tickLeft <= 0) {
    poison.tickLeft = poison.tick
    return { alive: true, hit: true }
  }
  return { alive: true, hit: false }
}
