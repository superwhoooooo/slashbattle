// Pure rules for online co-op (no Three.js, no network): room codes, the monster snapshot format the
// host streams, who a monster goes after, smoothing remote movement, and which monster events travel
// to whom. src/net/link.js moves the messages; src/coop.js applies them to the game.

export const PROTOCOL = 6 // bump when the message format changes; a mismatched joiner is told to refresh
export const MAX_PLAYERS = 4
// Co-op plays every mode. The host's game is the real one, and in the Wilds it only loads (and runs) the land around the
// host, so the players have to stay together: nobody may wander farther than this from a friend (the host's monsters
// reach LOAD_RADIUS 125 around the host, so a friend this close always has all of theirs around them).
export const COOP_MAX_DISTANCE = 60
export const COOP_MODES = ['resort', 'labyrinth', 'world', 'sandbox', 'tutorial', 'duel']
export const cleanMode = (mode) => (COOP_MODES.includes(mode) ? mode : 'resort')

// Holds a player (at `pos`) within `max` of every friend in `others` ({ x, z }): the position they may stand at, and whether
// it had to be pulled in. A few friends can pull in different directions, so it settles over a couple of passes.
export function leashPosition(pos, others, max = COOP_MAX_DISTANCE) {
  let x = pos.x
  let z = pos.z
  let held = false
  for (let pass = 0; pass < 3; pass++) {
    let moved = false
    for (const o of others) {
      const d = Math.hypot(x - o.x, z - o.z)
      if (d > max) {
        x = o.x + ((x - o.x) * max) / d
        z = o.z + ((z - o.z) * max) / d
        moved = held = true
      }
    }
    if (!moved) break
  }
  return { x, z, held }
}

// Where a downed player gets back up in the Wilds: beside the friend who is up, else null (the save point).
export function standUpBeside(friends) {
  const up = friends.find((f) => !f.down)
  return up ? { x: up.x + 2, z: up.z + 2 } : null
}
export const CODE_LENGTH = 4
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O, 1/I/L

export const COOP_RESPAWN_SECONDS = 8 // a downed player gets back up this long after going down (if anyone is still standing)
export const COOP_RESPAWN_HP = 0.6 // ...with this share of their max HP
export const COOP_RESPAWN_IFRAMES = 3
export const TARGET_SWITCH_MARGIN = 3 // a monster only switches to another player this much closer than its current one
export const INTERP_DELAY = 0.12 // s: draw remote things this far in the past so movement is smooth
export const RELAY_INTERP_DELAY = 0.3 // ...more over the slower relay
export const SILENCE_TIMEOUT = 25 // s without a message = that connection is gone (keepalives arrive every KEEPALIVE_SECONDS)
export const KEEPALIVE_SECONDS = 1 // a timer pings everyone this often while the game's frame loop isn't running (a background tab)

export function makeRoomCode(rng = Math.random) {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)]
  return code
}

// What someone typed into the code box, cleaned up (case, spaces, dashes).
export function normalizeCode(text) {
  return String(text ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)
}

export const isValidCode = (code) => typeof code === 'string' && code.length === CODE_LENGTH && [...code].every((c) => CODE_CHARS.includes(c))

export const cleanName = (name, fallback = 'Friend') => String(name ?? '').replace(/[<>&"]/g, '').trim().slice(0, 16) || fallback

// ---------- monster snapshots ----------
// Bit flags for a monster row.
export const FLAG = {
  spawning: 1,
  dying: 2,
  falling: 4,
  boss: 8,
  immune: 16,
  phase2: 32,
  dazed: 64,
  burrowed: 128,
  reflect: 256, // its mirror shield is up
  frozen: 512,
  submerged: 1024, // an amphibious boss under the water
  skyIsle: 2048, // a monster of the sky isles (it only meets a player who is up there too)
}

const round2 = (v) => Math.round(v * 100) / 100

// One row per monster: [id, type, x, z, y, rotY, hp, maxHp, flags]. `now` decides `frozen`.
export function packMonster(ud, pos, rotY, now = 0) {
  let flags = 0
  if (ud.spawning) flags |= FLAG.spawning
  if (ud.dying) flags |= FLAG.dying
  if (ud.falling) flags |= FLAG.falling
  if (ud.isBoss) flags |= FLAG.boss
  if (ud.immune) flags |= FLAG.immune
  if (ud.phase2) flags |= FLAG.phase2
  if (ud.dazed) flags |= FLAG.dazed
  if (ud.burrowed) flags |= FLAG.burrowed
  if (ud.reflect) flags |= FLAG.reflect
  if (now < (ud.frozenUntil ?? -Infinity)) flags |= FLAG.frozen
  if (ud.submerged) flags |= FLAG.submerged
  if (ud.skyIsle) flags |= FLAG.skyIsle
  return [ud.netId, ud.type, round2(pos.x), round2(pos.z), round2(pos.y), round2(rotY), Math.max(0, Math.round(ud.hp)), Math.round(ud.maxHp), flags]
}

export function unpackMonster(row) {
  if (!Array.isArray(row) || row.length < 9) return null
  const [id, type, x, z, y, rotY, hp, maxHp, flags] = row
  if (typeof id !== 'number' || typeof type !== 'string' || ![x, z, y, rotY, hp, maxHp].every(Number.isFinite)) return null
  const has = (f) => (flags & f) !== 0
  return {
    id, type, x, z, y, rotY, hp, maxHp,
    spawning: has(FLAG.spawning), dying: has(FLAG.dying), falling: has(FLAG.falling), boss: has(FLAG.boss),
    immune: has(FLAG.immune), phase2: has(FLAG.phase2), dazed: has(FLAG.dazed), burrowed: has(FLAG.burrowed),
    reflect: has(FLAG.reflect), frozen: has(FLAG.frozen), submerged: has(FLAG.submerged), skyIsle: has(FLAG.skyIsle),
  }
}

// ---------- smoothing ----------
// Snapshots are { t, ... } in arrival order. Returns the two around `t` and how far between them.
export function sampleSnapshots(snaps, t) {
  if (!snaps.length) return null
  if (t <= snaps[0].t) return { a: snaps[0], b: snaps[0], k: 0 }
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i].t <= t) {
      const a = snaps[i]
      const b = snaps[i + 1] ?? a
      const k = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0
      return { a, b, k }
    }
  }
  return { a: snaps[0], b: snaps[0], k: 0 }
}

export const lerp = (a, b, k) => a + (b - a) * k

export function lerpAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}

// Keeps a snapshot buffer short (and in order).
export function pushSnapshot(snaps, snap, max = 30) {
  if (snaps.length && snap.t < snaps[snaps.length - 1].t) return snaps
  snaps.push(snap)
  while (snaps.length > max) snaps.shift()
  return snaps
}

// ---------- who a monster goes after ----------
// `players`: [{ key, x, z, alive }]. Sticks with `currentKey` unless someone else is clearly closer
// (TARGET_SWITCH_MARGIN) or the current one is gone / down. Returns a key (or null if nobody is up).
export function pickTarget(at, players, currentKey = null, margin = TARGET_SWITCH_MARGIN) {
  let best = null
  let bestD = Infinity
  let current = null
  let currentD = Infinity
  for (const p of players) {
    if (!p.alive) continue
    const d = Math.hypot(p.x - at.x, p.z - at.z)
    if (d < bestD) {
      bestD = d
      best = p
    }
    if (p.key === currentKey) {
      current = p
      currentD = d
    }
  }
  if (!best) return null
  if (current && currentD - bestD < margin) return current.key
  return best.key
}

// ---------- monster events ----------
// Events aimed at the one player a monster is after: only that player's game applies them.
export const TARGETED_EVENTS = new Set(['steal', 'pull', 'status'])
// Events only the host's game may act on (they change the shared world).
export const HOST_ONLY_EVENTS = new Set(['summon', 'escape'])

// Splits a monster's events into what the host applies for its own player, what goes to everyone
// else (area attacks, shots: each game checks them against its own player), and what goes only to
// the targeted remote player.
export function routeEvents(events, targetIsRemote) {
  const host = []
  const broadcast = []
  const targeted = []
  for (const e of events) {
    if (TARGETED_EVENTS.has(e.type)) (targetIsRemote ? targeted : host).push(e)
    else {
      host.push(e)
      if (!HOST_ONLY_EVENTS.has(e.type)) broadcast.push(e)
    }
  }
  return { host, broadcast, targeted }
}

// A plain-data copy safe to send (drops functions, three objects' methods, cycles become null).
export function plainCopy(value) {
  const seen = new WeakSet()
  return JSON.parse(
    JSON.stringify(value, (key, v) => {
      if (typeof v === 'function') return undefined
      if (v && typeof v === 'object') {
        if (seen.has(v)) return null
        seen.add(v)
      }
      return v
    }),
  )
}

// ---------- downs and game over ----------
// Everyone in the room is down at once (the host's own player plus every remote one).
export function everyoneDown(hostDown, remoteDowns) {
  return hostDown && remoteDowns.every(Boolean)
}

// Damage forwarded over the wire is clamped so a bad message can't do anything silly.
export function clampDamage(amount, max = 5000) {
  const n = Number(amount)
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0
}

// ---------- pets and shots (cosmetic: each game only shows what the others' pets and guns are doing) ----------
// A pet unit row: [model key, x, z, y, rotY, beam target x, beam target z] (the beam pair only while beaming).
// The model key is the pet's model name, or 'd:<pet id>' for a dragon (its model is built from the pet def).
export const MAX_NET_PETS = 6
export function packPets(units) {
  return units.slice(0, MAX_NET_PETS).map((u) => {
    const row = [u.key, round2(u.x), round2(u.z), round2(u.y), round2(u.rotY)]
    if (u.beamTo) row.push(round2(u.beamTo.x), round2(u.beamTo.z))
    return row
  })
}
export function unpackPets(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows.slice(0, MAX_NET_PETS)) {
    if (!Array.isArray(row) || typeof row[0] !== 'string' || row[0].length > 40) continue
    const [key, x, z, y, rotY, bx, bz] = row
    if (![x, z, y, rotY].every(Number.isFinite)) continue
    out.push({ key, x, z, y, rotY, beamTo: Number.isFinite(bx) && Number.isFinite(bz) ? { x: bx, z: bz } : null })
  }
  return out
}

// A chest row: [id, x, z, y, cost, affordable (0/1), opened (0/1)] -- a player's own chests, so their
// friends can see them (and watch them pop open). At most MAX_NET_CHESTS.
export const MAX_NET_CHESTS = 8
export function packChests(chests) {
  return chests.slice(0, MAX_NET_CHESTS).map((c) => [c.id, round2(c.x), round2(c.z), round2(c.y ?? 0), Math.max(0, Math.round(c.cost)), c.affordable ? 1 : 0, c.opened ? 1 : 0])
}
export function unpackChests(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows.slice(0, MAX_NET_CHESTS)) {
    if (!Array.isArray(row)) continue
    const [id, x, z, y, cost, ok, open] = row
    if (!Number.isInteger(id) || ![x, z, y, cost].every(Number.isFinite)) continue
    out.push({ id, x, z, y, cost: Math.max(0, Math.min(99999, Math.round(cost))), affordable: ok === 1, opened: open === 1 })
  }
  return out
}

// A shot row: [x, z, y, vx, vz, vy, life, radius, color]. At most MAX_NET_SHOTS per volley.
export const MAX_NET_SHOTS = 24
export function packShots(bullets) {
  return bullets.slice(0, MAX_NET_SHOTS).map((b) => [round2(b.x), round2(b.z), round2(b.y ?? 0.7), round2(b.vx), round2(b.vz), round2(b.vy ?? 0), round2(b.life), round2(b.radius), b.color | 0])
}
export function unpackShots(rows) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows.slice(0, MAX_NET_SHOTS)) {
    if (!Array.isArray(row) || row.length < 9 || !row.every(Number.isFinite)) continue
    const [x, z, y, vx, vz, vy, life, radius, color] = row
    out.push({
      x, z, y, vx, vz, vy,
      life: Math.min(5, Math.max(0, life)),
      radius: Math.min(3, Math.max(0.02, radius)),
      color: color & 0xffffff,
      ghost: true, damage: 0, knockback: 0, pierce: 99, explode: 0, freeze: 0, traveled: 0, maxRange: 400, cause: 'gun', hitIds: new Set(),
    })
  }
  return out
}
