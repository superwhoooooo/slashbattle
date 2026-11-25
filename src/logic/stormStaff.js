// Storm-touched staff: every regional phenomenon you calm leaves a piece of its trouble in your Wizard Staff, for good
// (it reads the Wilds journal's storms, so it works in every mode). Each one changes how the orbs LOOK in flight and does
// something of its own where they land:
//   Pocket Tornado (sandstorm) -- a little twister circles every orb; where it lands it drops off and stays a moment,
//                                 sucking monsters in, spinning them round and grinding at them, then flings them away.
//   Hoarfrost (whiteout)       -- ice shards orbit the orb; a hit slows and bursts frost spikes out of the ground round
//                                 the target, and every 4th hit on the same monster freezes it solid. The next orb SHATTERS it.
//   Comet Core (ashstorm)      -- the orb flies as a burning comet that sets alight whatever it passes close by; a hit on
//                                 something already burning FLARES UP and spreads the fire to its neighbours.
//   Sporecap (miasma)          -- where an orb lands a glowing toadstool sprouts and puffs poison spores for a few seconds.
// Pure data + rules here; main.js's staffStormHit / stepStaffZones apply them, src/staffFx.js draws them.
// Tests: test/colosseums.test.js ('the storm-touched staff').
import { PHENOMENON_ORDER, isCleared } from './phenomena.js'

export const STAFF_UPGRADES = {
  sandstorm: {
    id: 'sandstorm', name: 'Pocket Tornado', color: 0xffd98a,
    desc: 'The Howling Sandstorm rides your staff: a little twister circles every orb, and where one lands it drops off and stays a moment, sucking monsters in, spinning them and grinding at them before it flings them away.',
    tornado: { life: 2.6, radius: 3.4, pull: 6, bossPull: 0.8, swirl: 4.5, tick: 0.4, mult: 0.14, fling: 1.8, max: 3, merge: 2.5 },
  },
  whiteout: {
    id: 'whiteout', name: 'Hoarfrost', color: 0xcfeaff,
    desc: 'The Great Whiteout rides your staff: ice shards circle every orb, a hit slows and bursts frost spikes out of the ground round the target, and every 4th hit freezes it solid. The next orb SHATTERS it.',
    slow: 0.55, slowFor: 1.6, spikes: { radius: 2.4, mult: 0.3 }, stacks: 4, freezeFor: 1.4, shatter: 1.6,
  },
  ashstorm: {
    id: 'ashstorm', name: 'Comet Core', color: 0xffb04a,
    desc: 'The Burning Ashstorm rides your staff: every orb flies as a burning comet that sets alight whatever it passes, and a hit on something already burning flares up and spreads the fire.',
    burnDps: 0.35, burnFor: 3, scorch: 1.5, flare: { radius: 3, mult: 0.35, cooldown: 0.6 },
  },
  miasma: {
    id: 'miasma', name: 'Sporecap', color: 0xb8ff8a,
    desc: 'The Weeping Miasma rides your staff: where an orb lands a glowing toadstool sprouts and puffs poison spores at everything near it for a few seconds.',
    cap: { life: 4.2, radius: 2.9, puffEvery: 0.8, mult: 0.22, slow: 0.7, max: 4, merge: 2 },
  },
}

// The upgrades a journal's storms have earned (in storm order).
export function staffUpgrades(phenomena) {
  return PHENOMENON_ORDER.filter((id) => isCleared(phenomena ?? {}, id)).map((id) => STAFF_UPGRADES[id])
}
export const hasStaffUpgrade = (list, id) => list.some((u) => u.id === id)

// ---- landing zones: tornadoes and sporecaps ----

// A new zone where an orb landed, or the one already there grown / refreshed (`merge`): returns the zone list.
export function dropZone(zones, kind, x, z, y, damage, now) {
  const t = kind === 'tornado' ? STAFF_UPGRADES.sandstorm.tornado : STAFF_UPGRADES.miasma.cap
  const near = zones.find((zn) => zn.kind === kind && Math.hypot(zn.x - x, zn.z - z) < t.merge)
  if (near) {
    near.until = now + t.life
    near.damage = Math.max(near.damage, damage)
    return zones
  }
  const mine = zones.filter((zn) => zn.kind === kind)
  if (mine.length >= t.max) return zones
  return [...zones, { kind, x, z, y, damage, born: now, until: now + t.life, next: now + (kind === 'tornado' ? t.tick : 0.25) }]
}

// One frame of a zone: does it tick (hurt what's in it) and is it over?
export function stepZone(zone, now) {
  const t = zone.kind === 'tornado' ? STAFF_UPGRADES.sandstorm.tornado : STAFF_UPGRADES.miasma.cap
  let tick = false
  if (now >= zone.next && now < zone.until) {
    tick = true
    zone.next = now + (zone.kind === 'tornado' ? t.tick : t.puffEvery)
  }
  return { tick, done: now >= zone.until }
}

// How a tornado drags a monster this frame: in toward the eye (harder the nearer it is) and round it.
export function tornadoPull(zone, mx, mz, dt, boss = false) {
  const t = STAFF_UPGRADES.sandstorm.tornado
  const dx = zone.x - mx
  const dz = zone.z - mz
  const d = Math.hypot(dx, dz)
  if (d > t.radius || d < 0.05) return { x: 0, z: 0 }
  const k = (boss ? t.bossPull : t.pull) * (0.4 + 0.6 * (1 - d / t.radius)) * dt
  const swirl = (boss ? 0.2 : 1) * t.swirl * dt
  const inward = Math.min(d - 0.4, k)
  return { x: (dx / d) * Math.max(0, inward) + (-dz / d) * swirl, z: (dz / d) * Math.max(0, inward) + (dx / d) * swirl }
}

// Hoarfrost's stacks on one monster: every `stacks`-th hit freezes it (and the count starts over).
export function frostStack(count = 0) {
  const n = count + 1
  return n >= STAFF_UPGRADES.whiteout.stacks ? { count: 0, freeze: true } : { count: n, freeze: false }
}
