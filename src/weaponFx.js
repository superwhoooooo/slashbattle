// Per-weapon swing effects: every weapon gets its own look when it fires
// instead of the same spark puff -- a whip cracks with a refracting ripple, a
// hammer slams the ground, a scythe leaves a crescent of sparks, a rail gun
// draws a beam, a flail whirls the screen. Purely visual.
import { burst as rawBurst, shardBurst as rawShardBurst } from './particles.js'
import { spawnShockwave } from './shockwave.js'
import { weaponBase } from './logic/items.js'
import { isTouchDevice } from './touch.js'

const Y = 0.9

// Swing effects are kept subtle (a few sparks, no screen-bending ripples): the
// stacked additive sparks used to blow out into a big flash on every attack.
// `level` is 1 for hit effects and lower while a swing effect plays.
let level = 1
const SWING_LEVEL = 0.35
const FX_BRIGHTNESS = isTouchDevice() ? 0.7 : 1.3 // swing sparks are additive, so scale their colour down
const ch = (v) => Math.min(255, Math.round(v * FX_BRIGHTNESS)) // clamped so values above 1 can't spill into the next channel
const dim = (hex) => (ch((hex >> 16) & 255) << 16) | (ch((hex >> 8) & 255) << 8) | ch(hex & 255)
const burst = (ps, at, color, count, ...rest) => rawBurst(ps, at, dim(color), Math.max(1, Math.round(count * level)), ...rest)
const shardBurst = (ps, at, color, count, ...rest) => rawShardBurst(ps, at, dim(color), Math.max(1, Math.round(count * level)), ...rest)
const QUIET_WARP = { add() {} }

function ahead(origin, angle, distance) {
  return { x: origin.x + Math.sin(angle) * distance, z: origin.z + Math.cos(angle) * distance }
}

// Sparks strung along a line, for slashes, stabs and beams.
function line(ps, origin, angle, from, to, color, steps, speed = 1.5) {
  for (let i = 0; i < steps; i++) {
    const p = ahead(origin, angle, from + ((to - from) * i) / Math.max(1, steps - 1))
    burst(ps, { x: p.x, y: Y, z: p.z }, color, 3, speed)
  }
}

// Sparks along an arc centred on `angle`, `spread` radians wide.
function arc(ps, origin, angle, spread, radius, color, steps, speed = 1.8) {
  for (let i = 0; i < steps; i++) {
    const a = angle - spread / 2 + (spread * i) / Math.max(1, steps - 1)
    const p = ahead(origin, a, radius)
    burst(ps, { x: p.x, y: Y, z: p.z }, color, 3, speed)
  }
}

const FX = {
  sword: (c) => {
    arc(c.ps, c.o, c.a, 2.2, 1.4, 0x7ae8ff, 10)
    arc(c.ps, c.o, c.a, 1.6, 1.1, 0xffffff, 6, 1)
    const p = ahead(c.o, c.a, 1.4)
    c.warp.add('ripple', p.x, p.z, 1.6, 0.25)
  },
  dagger: (c) => {
    line(c.ps, c.o, c.a - 0.5, 0.3, 1.4, 0xffa94d, 5, 2.5)
    line(c.ps, c.o, c.a + 0.5, 0.3, 1.4, 0xffd9a0, 5, 2.5)
  },
  spear: (c) => {
    line(c.ps, c.o, c.a, 0.6, 2.8, 0x7cffb0, 7, 2.5)
    const tip = ahead(c.o, c.a, 2.8)
    c.warp.add('ripple', tip.x, tip.z, 1.6, 0.3)
  },
  hammer: (c) => {
    const p = ahead(c.o, c.a, 1.8)
    spawnShockwave(c.shock, p.x, p.z, 4, 0xff4fa3)
    c.warp.add('ripple', p.x, p.z, 5, 0.55)
    shardBurst(c.ps, { x: p.x, y: 0.4, z: p.z }, 0xff4fa3, 10, 3)
    c.shake(2)
  },
  scythe: (c) => arc(c.ps, c.o, c.a, 4.4, 1.9, 0xb48cff, 14),
  katana: (c) => line(c.ps, c.o, c.a, 0.5, 1.9, 0x4de0ff, 7, 2.2),
  axe: (c) => {
    const p = ahead(c.o, c.a, 1.5)
    shardBurst(c.ps, { x: p.x, y: Y, z: p.z }, 0xff7a45, 8, 3)
    arc(c.ps, c.o, c.a, 2.2, 1.5, 0xff7a45, 6)
  },
  rapier: (c) => {
    line(c.ps, c.o, c.a, 0.5, 2.4, 0xf5f07a, 6, 3)
  },
  flail: (c) => {
    c.warp.add('swirl', c.o.x, c.o.z, 3.2, 0.45)
    arc(c.ps, c.o, c.a, Math.PI * 2, 2.1, 0xff6fe0, 14)
  },
  chainsaw: (c) => {
    const p = ahead(c.o, c.a, 1.2)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0xffd23f, 10, 4.5, 1)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0xff8a3a, 4, 3, 2)
  },
  boomstick: (c) => {
    const p = ahead(c.o, c.a, 1.9)
    c.warp.add('ripple', p.x, p.z, 3, 0.4)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0x8cff6f, 14, 4)
  },
  whip: (c) => {
    const tip = ahead(c.o, c.a, 3.1)
    line(c.ps, c.o, c.a, 0.6, 3.1, 0xff5fa8, 9, 1.2)
    c.warp.add('ripple', tip.x, tip.z, 2.2, 0.35)
  },
  nunchucks: (c) => {
    arc(c.ps, c.o, c.a, Math.PI * 2, 1.5, 0x5affc4, 14)
    arc(c.ps, c.o, c.a + 1, Math.PI * 2, 1.0, 0xffffff, 8, 1)
    c.warp.add('swirl', c.o.x, c.o.z, 2, 0.3)
  },
  // Guns: a muzzle effect at the barrel.
  staff: (c) => {
    const p = ahead(c.o, c.a, 1.1)
    burst(c.ps, { x: p.x, y: 1.1, z: p.z }, 0xb48cff, 12, 3, 0.8)
    burst(c.ps, { x: p.x, y: 1.1, z: p.z }, 0xffffff, 4, 2, 1)
    c.warp.add('ripple', p.x, p.z, 1.4, 0.25)
  },
  pistol: (c) => {
    const p = ahead(c.o, c.a, 1)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0xffe14a, 10, 4)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0xffffff, 3, 2)
    c.warp.add('ripple', p.x, p.z, 1.2, 0.2)
  },
  shotgun: (c) => {
    const p = ahead(c.o, c.a, 1.2)
    c.warp.add('ripple', p.x, p.z, 2.6, 0.35)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0xff8ad8, 16, 4.5)
  },
  smg: (c) => {
    const p = ahead(c.o, c.a, 1)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0x66f0ff, 5, 2.5, 1.5)
  },
  railgun: (c) => {
    line(c.ps, c.o, c.a, 1, 24, 0x7cffb0, 22, 0.8)
    const p = ahead(c.o, c.a, 1.4)
    c.warp.add('ripple', p.x, p.z, 3.2, 0.4)
    c.shake(1.5)
  },
  launcher: (c) => {
    const p = ahead(c.o, c.a, 1.2)
    c.warp.add('ripple', p.x, p.z, 3.4, 0.4)
    burst(c.ps, { x: p.x, y: Y, z: p.z }, 0xff8a3a, 18, 4, 0.5)
    c.shake(1.5)
  },
  crossbow: (c) => {
    line(c.ps, c.o, c.a, 1, 6, 0xc9ff5a, 8, 1.2)
  },
  flamer: (c) => {
    for (const d of [1.2, 2.2, 3.2]) {
      const p = ahead(c.o, c.a + (Math.random() - 0.5) * 0.5, d)
      burst(c.ps, { x: p.x, y: Y, z: p.z }, Math.random() < 0.5 ? 0xff6a2a : 0xffd23f, 5, 2, 1.5)
    }
  },
  blaster: (c) => {
    const p = ahead(c.o, c.a, 1.2)
    for (const color of [0xd96bff, 0x66f0ff, 0xffe14a, 0xff5fa8]) burst(c.ps, { x: p.x, y: Y, z: p.z }, color, 5, 4)
  },
}

// Plays weapon `id`'s swing effect from `origin` (the player, {x, z}) toward
// `angle`. ctx: { particleSystem, shockwavePool, warp, shake(amount) }.
export function playWeaponFx(id, origin, angle, ctx) {
  const fx = FX[weaponBase(id)]
  if (!fx) return
  level = SWING_LEVEL
  try {
    fx({ ps: ctx.particleSystem, shock: ctx.shockwavePool, warp: QUIET_WARP, shake: ctx.shake ?? (() => {}), o: origin, a: angle })
  } finally {
    level = 1
  }
}

export const WEAPON_FX_IDS = Object.keys(FX)

const RAINBOW = [0xff5fa8, 0xffe14a, 0x66f0ff, 0x7cffb0, 0xd96bff, 0xff8a3a]
const pick = (list) => list[Math.floor(Math.random() * list.length)]

// What a weapon does where it LANDS on a monster: `at` is the monster's
// {x, z}, `angle` the direction of the blow. Each weapon lands differently.
const HIT = {
  sword: (c) => { arc(c.ps, c.o, c.a + Math.PI, 1.4, 0.8, 0x7ae8ff, 5, 3); burst(c.ps, p3(c.o), 0xffffff, 6, 4) },
  dagger: (c) => { burst(c.ps, p3(c.o), 0xffa94d, 8, 4); line(c.ps, c.o, c.a + 0.8, -0.6, 0.6, 0xffffff, 3, 2) },
  spear: (c) => { c.warp.add('ripple', c.o.x, c.o.z, 2.2, 0.3); line(c.ps, c.o, c.a, 0, 2.2, 0x7cffb0, 6, 2.5) },
  hammer: (c) => { spawnShockwave(c.shock, c.o.x, c.o.z, 3.5, 0xff4fa3); c.warp.add('ripple', c.o.x, c.o.z, 4.5, 0.5); shardBurst(c.ps, p3(c.o), 0xff4fa3, 10, 3.5); c.shake(2) },
  scythe: (c) => { c.warp.add('swirl', c.o.x, c.o.z, 2, 0.4); burst(c.ps, p3(c.o), 0xb48cff, 14, 3.5, 1) },
  katana: (c) => { line(c.ps, c.o, c.a + Math.PI / 2, -1.2, 1.2, 0xffffff, 8, 3); burst(c.ps, p3(c.o), 0x4de0ff, 8, 4) },
  axe: (c) => { shardBurst(c.ps, p3(c.o), 0xff7a45, 12, 4); c.shake(1) },
  rapier: (c) => { burst(c.ps, p3(c.o), 0xffffff, 10, 5); burst(c.ps, p3(c.o), 0xf5f07a, 6, 2) },
  flail: (c) => { c.warp.add('swirl', c.o.x, c.o.z, 2.2, 0.4); for (const col of RAINBOW.slice(0, 3)) burst(c.ps, p3(c.o), col, 5, 3.5) },
  chainsaw: (c) => { burst(c.ps, p3(c.o), 0xffd23f, 12, 5, 1.5); burst(c.ps, p3(c.o), 0xffffff, 4, 3) },
  boomstick: (c) => { c.warp.add('ripple', c.o.x, c.o.z, 3, 0.4); burst(c.ps, p3(c.o), 0x8cff6f, 16, 5); c.shake(1.5) },
  whip: (c) => { c.warp.add('ripple', c.o.x, c.o.z, 1.8, 0.3); burst(c.ps, p3(c.o), 0xff5fa8, 12, 4) },
  nunchucks: (c) => { for (const col of [0x5affc4, 0xffffff]) burst(c.ps, p3(c.o), col, 6, 3.5) },
  staff: (c) => { for (const col of [0xb48cff, 0xffffff, 0x7ae8ff]) burst(c.ps, p3(c.o), col, 5, 3.5, 0.5) },
  pistol: (c) => { burst(c.ps, p3(c.o), 0xffe14a, 8, 4); burst(c.ps, p3(c.o), 0xffffff, 3, 2) },
  shotgun: (c) => { for (const col of RAINBOW) burst(c.ps, p3(c.o), col, 3, 4.5) },
  smg: (c) => { burst(c.ps, p3(c.o), 0x66f0ff, 6, 2.5, 1.5) },
  railgun: (c) => { c.warp.add('ripple', c.o.x, c.o.z, 2.8, 0.4); line(c.ps, c.o, c.a, -1, 3, 0x7cffb0, 8, 3); c.shake(1) },
  crossbow: (c) => { line(c.ps, c.o, c.a, -0.5, 2.5, 0xc9ff5a, 7, 2.5); burst(c.ps, p3(c.o), 0xffffff, 5, 3) },
  flamer: (c) => { burst(c.ps, p3(c.o), 0xff6a2a, 8, 2, 2.5); burst(c.ps, p3(c.o), 0xffd23f, 4, 2, 3) },
  blaster: (c) => { for (const col of RAINBOW) burst(c.ps, p3(c.o), col, 3, 4) },
}

function p3(o) {
  return { x: o.x, y: Y, z: o.z }
}

export function playHitFx(id, at, angle, ctx) {
  const fx = HIT[weaponBase(id)]
  if (!fx) return
  fx({ ps: ctx.particleSystem, shock: ctx.shockwavePool, warp: ctx.warp, shake: ctx.shake ?? (() => {}), o: at, a: angle })
}

// Shot trails get their own, dimmer level on desktop: a spark is left every frame a shot flies,
// and the additive sparks pile up into a glaring streak. Desktop trails end up at ~0.75 overall
// (x FX_BRIGHTNESS 1.3), a touch brighter than phones' 0.7; phones are left as they were.
const TRAIL_BRIGHTNESS = isTouchDevice() ? 1 : 0.58
const scaleColor = (hex, k) => (Math.round(((hex >> 16) & 255) * k) << 16) | (Math.round(((hex >> 8) & 255) * k) << 8) | Math.round((hex & 255) * k)
const trailBurst = (ps, at, color, ...rest) => burst(ps, at, scaleColor(color, TRAIL_BRIGHTNESS), ...rest)

// A bullet's trail, called every frame it flies: each gun leaves its own
// kind -- sparkles, confetti, bubbles, embers, a hot beam.
export function playBulletTrail(bullet, ctx) {
  const ps = ctx.particleSystem
  const here = { x: bullet.x, y: 0.7, z: bullet.z }
  switch (weaponBase(bullet.weaponId)) {
    case 'staff':
      trailBurst(ps, here, Math.random() < 0.3 ? 0xffffff : 0xb48cff, 1, 1.4, 0.4)
      break
    case 'pistol':
      trailBurst(ps, here, 0xffe14a, 1, 0.8)
      break
    case 'shotgun':
      if (Math.random() < 0.5) trailBurst(ps, here, pick(RAINBOW), 1, 1.6)
      break
    case 'smg':
      trailBurst(ps, here, 0x66f0ff, 1, 0.6, 1.8)
      break
    case 'railgun':
      trailBurst(ps, here, 0x7cffb0, 2, 0.3)
      trailBurst(ps, here, 0xffffff, 1, 0.2)
      break
    case 'launcher':
      trailBurst(ps, here, Math.random() < 0.5 ? 0xff8a3a : 0x6a5a50, 2, 1.2, 0.6)
      break
    case 'crossbow':
      trailBurst(ps, here, 0xc9ff5a, 2, 0.3)
      break
    case 'flamer':
      trailBurst(ps, here, Math.random() < 0.5 ? 0xff6a2a : 0xffd23f, 2, 1.2, 2.2)
      break
    case 'blaster':
      trailBurst(ps, here, pick(RAINBOW), 2, 1.5)
      break
    default:
      trailBurst(ps, here, bullet.color ?? 0xffffff, 1, 0.8)
  }
}
