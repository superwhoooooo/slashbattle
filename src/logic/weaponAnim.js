// Pure, Three-free swing animation for the held weapon. Each weapon has its
// own motion: a pose is where the grip sits around the player (a `yaw`
// around the body and a reach `r` out from it, at height `h`), how the weapon
// points (`pitch`: 0 = straight up, PI/2 = straight out; `roll`: a sideways
// tilt) and which way it faces (`face`). Each channel is a number, a list of
// [time, value] keys (eased between), or a function of the swing progress.
// Progress runs 0..1 and the damage lands at 0.5.

const R = 0.6 // PLAYER_BODY_RADIUS (kept literal so this file stays config-free; a test checks it)
export const REST_MELEE = { yaw: Math.PI / 2, r: R + 0.1, h: R * 0.6, pitch: 0.15, roll: 0, face: 0 }
const REST_GUN = { yaw: 0.35, r: 0.95, h: 0.8, pitch: 1.45, roll: 0, face: 0 }

const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t

// Eased interpolation through [time, value] keys.
export function track(keys, t) {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1]
      const [t1, v1] = keys[i]
      return lerp(v0, v1, smooth((t - t0) / (t1 - t0)))
    }
  }
  return keys[keys.length - 1][1]
}

const channel = (spec, t) => (typeof spec === 'number' ? spec : typeof spec === 'function' ? spec(t) : track(spec, t))

// A gun's kick: nothing until the shot at 0.5, then a sharp pulse.
const kick = (t) => track([[0, 0], [0.45, 0], [0.55, 1], [1, 0]], t)
const gun = ({ kickUp = 0.3, back = 0.2, jitter = 0 } = {}) => ({
  yaw: 0.3,
  r: (t) => 0.95 - back * kick(t) + Math.sin(t * 120) * jitter,
  h: (t) => 0.85 + 0.05 * kick(t),
  pitch: (t) => 1.45 + kickUp * kick(t) + Math.sin(t * 90) * jitter,
  roll: 0,
  face: 0,
})
const radial = (spec) => ({ roll: 0, ...spec, face: 'radial' })

export const SWINGS = {
  sword: radial({ yaw: [[0, -1.3], [1, 1.3]], r: 0.9, h: [[0, 1.05], [0.5, 0.8], [1, 1.05]], pitch: [[0, 1.2], [0.5, 1.5], [1, 1.2]] }),
  dagger: radial({
    yaw: (t) => (t < 0.5 ? -0.35 : 0.35),
    r: (t) => 0.5 + 0.9 * Math.sin(Math.PI * ((t * 2) % 1)),
    h: 0.85,
    pitch: 1.5,
  }),
  spear: radial({ yaw: 0, r: [[0, 0.8], [0.3, 0.1], [0.55, 2.0], [1, 0.8]], h: 0.9, pitch: 1.5 }),
  hammer: radial({ yaw: 0, r: [[0, 0.4], [0.3, 0.3], [0.55, 1.3], [1, 1.0]], h: [[0, 1.2], [0.3, 1.5], [0.55, 0.5], [1, 0.7]], pitch: [[0, -0.6], [0.3, -0.9], [0.55, 2.0], [1, 1.6]] }),
  axe: radial({ yaw: [[0, 0.4], [0.55, -0.2], [1, -0.3]], r: [[0, 0.5], [0.25, 0.4], [0.55, 1.2], [1, 1.0]], h: [[0, 1.1], [0.25, 1.4], [0.55, 0.55], [1, 0.7]], pitch: [[0, -0.3], [0.25, -0.7], [0.55, 1.9], [1, 1.5]], roll: [[0, 0.3], [0.55, -0.4], [1, 0]] }),
  scythe: radial({ yaw: [[0, -2.4], [1, 2.4]], r: 0.8, h: 0.5, pitch: 1.5 }),
  katana: radial({ yaw: [[0, -1.0], [0.15, -1.25], [0.55, 1.0], [1, 0.8]], r: 0.8, h: 0.9, pitch: 1.4, roll: [[0, -0.5], [0.55, 0.5], [1, 0]] }),
  rapier: radial({ yaw: [[0, 0.2], [0.5, 0], [1, -0.1]], r: [[0, 0.9], [0.3, 0.3], [0.55, 2.3], [1, 1.0]], h: 0.9, pitch: 1.5 }),
  flail: radial({ yaw: [[0, -0.3], [1, -0.3 + Math.PI * 2.3]], r: 0.7, h: 0.9, pitch: 1.5 }),
  chainsaw: radial({ yaw: (t) => Math.sin(t * 30) * 0.12, r: [[0, 0.9], [1, 1.3]], h: 0.85, pitch: 1.5, roll: (t) => Math.sin(t * 110) * 0.08 }),
  boomstick: radial({ yaw: [[0, -1.8], [0.35, -2.0], [0.6, 0.9], [1, 1.2]], r: 0.9, h: 0.9, pitch: 1.3 }),
  whip: radial({ yaw: [[0, -1.0], [0.35, -1.4], [0.55, 0.5], [1, 0.8]], r: 0.8, h: [[0, 1.1], [0.35, 1.6], [0.55, 1.0], [1, 1.0]], pitch: [[0, 0.9], [0.35, 0.4], [0.55, 1.5], [1, 1.2]] }),
  nunchucks: radial({ yaw: [[0, -0.9], [0.5, 0], [1, 0.9]], r: 0.8, h: 1.0, pitch: 1.3 }),
  // Guns: held forward, each with its own kick.
  pistol: gun({ kickUp: 0.4, back: 0.2 }),
  shotgun: gun({ kickUp: 0.8, back: 0.45 }),
  smg: gun({ kickUp: 0.08, back: 0.08, jitter: 0.02 }),
  railgun: gun({ kickUp: 0.15, back: 0.7 }),
  launcher: gun({ kickUp: 0.6, back: 0.5 }),
  crossbow: gun({ kickUp: 0.2, back: 0.35 }),
  flamer: gun({ kickUp: 0.05, back: 0.1, jitter: 0.03 }),
  blaster: gun({ kickUp: 0.3, back: 0.25 }),
  // The staff is held upright at the side, raised and jabbed forward to cast.
  staff: { yaw: [[0, 1.2], [0.5, 0.3], [1, 1.2]], r: [[0, 0.7], [0.5, 1.1], [1, 0.7]], h: [[0, 0.6], [0.5, 0.9], [1, 0.6]], pitch: [[0, 0.2], [0.5, 1.2], [1, 0.2]], roll: 0, face: 0 },
}

const GUNS = new Set(['pistol', 'shotgun', 'smg', 'railgun', 'launcher', 'crossbow', 'flamer', 'blaster'])

export function restPose(id) {
  return GUNS.has(id) ? REST_GUN : REST_MELEE
}

// The pose of weapon `id` at swing progress `t` (0..1), or at rest when t is
// null. The start and end ease in and out of the rest pose.
export function weaponPose(id, t) {
  const rest = restPose(id)
  const swing = SWINGS[id]
  if (t === null || t === undefined || !swing) return { ...rest }
  const raw = {}
  for (const key of ['yaw', 'r', 'h', 'pitch', 'roll']) raw[key] = channel(swing[key], t)
  raw.face = swing.face === 'radial' ? raw.yaw : channel(swing.face, t)
  const w = Math.min(smooth(Math.min(1, t / 0.18)), 1 - smooth(Math.max(0, (t - 0.82) / 0.18)))
  const out = {}
  for (const key of Object.keys(raw)) out[key] = lerp(rest[key], raw[key], w)
  return out
}
