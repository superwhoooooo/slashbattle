// Skyfins: sky-barracuda that hunt only up in the sky (inspired by the flying fish-birds that harry gliders in
// open-sky games, reworked). While you're aloft (on a sky isle, or gliding high over the Wilds) a director sends
// packs of them in; they circle above you, then either SWOOP (a shriek and a lean back, then a fast bite-dive
// at where you are) or BOMB (fly over you and drop a rock). On the land they lose interest and fly off.
// Shoot them as they circle (a cursor on one aims the shot up), or swat them as they swoop in. Pure.

export const SKYFIN = 'skyfin'
export const FLYER_TYPES = {
  // noMelee / flyer: monster.js's walking AI never runs for it (main.js flies it with stepFlyer).
  skyfin: { shape: 'cone', size: 1.7, color: 0x46b8e0, edgeColor: 0xc6f3ff, speed: 7, hp: 60, damage: 9, radius: 0.85, noMelee: true, flyer: true },
}
export const FLYER_TYPE_IDS = Object.keys(FLYER_TYPES)
export const FLYER_SCORES = { skyfin: 240 }

export const MAX_FLYERS = 4
export const FLYER_GAP = [12, 20] // seconds between packs while you're up there
export const FIRST_PACK_DELAY = 6 // ...and the first one this long after you get up there
const CIRCLE_RADIUS = [13, 19]
const CIRCLE_HEIGHT = [8, 13] // above you
const CIRCLE_TIME = [3.2, 6.5] // circling before the next attack
const WIND_TIME = 0.7 // the shriek before a swoop
const SWOOP_SPEED = 24
const SWOOP_TIME = 1.4
const BITE_RANGE = 1.9 // 3D, centre to your middle
const CLIMB_TIME = 1.6
const BOMB_HEIGHT = 12
const FLEE_TIME = 6
export const ROCK_GRAVITY = 22
export const ROCK_HIT_RADIUS = 2.0
export const ROCK_DAMAGE_SCALE = 1.3 // a rock hurts a little more than a bite

const lerp = (a, b, t) => a + (b - a) * t
const pick = ([a, b], r) => lerp(a, b, r)

// The director: { nextAt, wasAloft }. Returns { state, spawn: n } (how many to send in now).
export function createFlyerDirector() {
  return { nextAt: Infinity, wasAloft: false }
}
export function stepFlyerDirector(state, { now, aloft, alive, danger = 0, rand = Math.random }) {
  let { nextAt, wasAloft } = state
  let spawn = 0
  if (aloft && !wasAloft) nextAt = now + FIRST_PACK_DELAY
  if (!aloft) nextAt = Infinity
  else if (now >= nextAt) {
    const pack = 1 + Math.floor(rand() * (1.6 + danger * 1.8)) // deeper in the Wilds, bigger packs
    spawn = Math.max(0, Math.min(pack, MAX_FLYERS - alive))
    nextAt = now + pick(FLYER_GAP, rand())
  }
  return { state: { nextAt, wasAloft: aloft }, spawn }
}

// Where a new skyfin comes in from: high and off to one side of you.
export function flyerSpawnPoint(px, py, pz, rand = Math.random) {
  const a = rand() * Math.PI * 2
  return { x: px + Math.cos(a) * 42, y: py + 22 + rand() * 8, z: pz + Math.sin(a) * 42, angle: a }
}

// A skyfin's flight: { x, y, z, vx, vy, vz, mode, until, orbit, radius, height, spin, dir: {x,y,z} }.
export function createFlight(at, rand = Math.random, now = 0) {
  return {
    x: at.x, y: at.y, z: at.z, vx: 0, vy: 0, vz: 0,
    mode: 'circle', until: now + pick(CIRCLE_TIME, rand()),
    orbit: at.angle ?? rand() * Math.PI * 2,
    radius: pick(CIRCLE_RADIUS, rand()),
    height: pick(CIRCLE_HEIGHT, rand()),
    spin: rand() < 0.5 ? -1 : 1,
    dir: { x: 0, y: 0, z: 1 },
    dropped: false,
  }
}

// Steers toward a point at `speed`, easing the velocity (`turn` per second) so it banks round rather than snapping.
function steer(f, tx, ty, tz, speed, turn, dt) {
  const dx = tx - f.x
  const dy = ty - f.y
  const dz = tz - f.z
  const d = Math.hypot(dx, dy, dz) || 1
  const k = Math.min(1, turn * dt)
  f.vx += ((dx / d) * speed - f.vx) * k
  f.vy += ((dy / d) * speed - f.vy) * k
  f.vz += ((dz / d) * speed - f.vz) * k
}

// One step. `p`: your middle { x, y, z }; `leave`: you're back on the land (it flies off).
// Returns { flight, events } with events { type: 'wind' } { type: 'bite' } { type: 'drop', x, y, z } { type: 'gone' }.
export function stepFlight(f0, { p, dt, now, leave = false, rand = Math.random }) {
  const f = { ...f0, dir: { ...f0.dir } }
  const events = []
  if (leave && f.mode !== 'flee') {
    f.mode = 'flee'
    f.until = now + FLEE_TIME
  }
  switch (f.mode) {
    case 'circle': {
      f.orbit += f.spin * dt * (9 / f.radius)
      const tx = p.x + Math.cos(f.orbit) * f.radius
      const tz = p.z + Math.sin(f.orbit) * f.radius
      steer(f, tx, p.y + f.height + Math.sin(now * 1.3 + f.orbit) * 1.2, tz, 11, 2.2, dt)
      if (now >= f.until) {
        if (rand() < 0.62) {
          f.mode = 'wind'
          f.until = now + WIND_TIME
          events.push({ type: 'wind' })
        } else {
          f.mode = 'bomb'
          f.until = now + 5
          f.dropped = false
        }
      }
      break
    }
    case 'wind': {
      // Hangs back and rears up, facing you: the tell.
      f.vx *= 1 - Math.min(1, dt * 5)
      f.vz *= 1 - Math.min(1, dt * 5)
      f.vy += (2.5 - f.vy) * Math.min(1, dt * 4)
      if (now >= f.until) {
        const dx = p.x - f.x
        const dy = p.y - f.y
        const dz = p.z - f.z
        const d = Math.hypot(dx, dy, dz) || 1
        f.vx = (dx / d) * SWOOP_SPEED
        f.vy = (dy / d) * SWOOP_SPEED
        f.vz = (dz / d) * SWOOP_SPEED
        f.mode = 'swoop'
        f.until = now + SWOOP_TIME
      }
      break
    }
    case 'swoop': {
      // Commits to the dive (only a slight homing), so a sidestep or a dash makes it miss.
      steer(f, p.x, p.y, p.z, SWOOP_SPEED, 0.8, dt)
      if (Math.hypot(p.x - f.x, p.y - f.y, p.z - f.z) < BITE_RANGE) {
        events.push({ type: 'bite' })
        f.mode = 'climb'
        f.until = now + CLIMB_TIME
      } else if (now >= f.until) {
        f.mode = 'climb'
        f.until = now + CLIMB_TIME
      }
      break
    }
    case 'climb': {
      // Pulls up and away; it's slow and close here -- the moment to hit back.
      const away = Math.atan2(f.z - p.z, f.x - p.x)
      steer(f, p.x + Math.cos(away) * 18, p.y + f.height, p.z + Math.sin(away) * 18, 8, 2, dt)
      if (now >= f.until) {
        f.mode = 'circle'
        f.until = now + pick(CIRCLE_TIME, rand())
        f.orbit = away
      }
      break
    }
    case 'bomb': {
      // Flies right over you and lets a rock go.
      steer(f, p.x, p.y + BOMB_HEIGHT, p.z, 13, 2.6, dt)
      if (!f.dropped && Math.hypot(p.x - f.x, p.z - f.z) < 2.5) {
        f.dropped = true
        events.push({ type: 'drop', x: f.x, y: f.y - 0.6, z: f.z })
        f.mode = 'climb'
        f.until = now + CLIMB_TIME
      } else if (now >= f.until) {
        f.mode = 'circle'
        f.until = now + pick(CIRCLE_TIME, rand())
      }
      break
    }
    case 'flee': {
      const away = Math.atan2(f.z - p.z, f.x - p.x)
      steer(f, f.x + Math.cos(away) * 30, f.y + 20, f.z + Math.sin(away) * 30, 16, 2, dt)
      if (now >= f.until) events.push({ type: 'gone' })
      break
    }
    default:
      break
  }
  f.x += f.vx * dt
  f.y += f.vy * dt
  f.z += f.vz * dt
  const speed = Math.hypot(f.vx, f.vy, f.vz)
  if (speed > 0.5) f.dir = { x: f.vx / speed, y: f.vy / speed, z: f.vz / speed }
  return { flight: f, events }
}

// A falling rock: { x, y, z, vy }. Returns { rock, hit (it struck you), landed (it reached `floor`) }.
export function stepRock(r, { p, dt, floor }) {
  const rock = { ...r, vy: r.vy - ROCK_GRAVITY * dt }
  rock.y += rock.vy * dt
  const hit = Math.hypot(p.x - rock.x, p.z - rock.z) < ROCK_HIT_RADIUS && Math.abs(p.y - rock.y) < 1.4
  return { rock, hit, landed: !hit && rock.y <= floor }
}
