// Sky-ring races: a glowing start gate sits on some of the Wilds' tallest summits, and a trail of rings leads
// away downhill. Step into the gate to start the clock, then jump off and glide (or run) through every ring in
// order before time runs out. Rings hang along a conservative glide path from the summit, so a glide that starts
// at the gate can always make them (too high is fine: fold the glider to drop). Medals by time; best times are
// kept in the Wilds journal. Pure and seeded.
import { PLAYER_SPEED } from '../config.js'
import { WORLD_RADIUS, heightAt, lakeAt, skystars } from './world.js'
import { GLIDE_SINK, GLIDE_SPEED_MULTIPLIER, JUMP_VELOCITY, JUMP_GRAVITY } from './jump.js'

export const RING_RADIUS = 4.4 // a ring's opening (you pass when inside it)
export const START_RADIUS = 3.6
const RING_SPACING = 15
const COURSE_LENGTH = 165
const RACE_COUNT = 9
const RACE_SPACING = 110 // between start gates
const GIVE_UP_DISTANCE = 90 // wander this far from the next ring and the race is off
const RACE_NAMES = ['Featherfall Run', 'The Gull\'s Dive', 'Skylark Sprint', 'Cloudhopper Course', 'The Long Drop', 'Windrider\'s Way', 'Starling Slalom', 'Kestrel Chase', 'The Falling Leaf', 'Moth\'s Spiral']

const GLIDE_SPEED = PLAYER_SPEED * GLIDE_SPEED_MULTIPLIER
const JUMP_PEAK = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * JUMP_GRAVITY)
const PLAN_SINK = (GLIDE_SINK / GLIDE_SPEED) * 1.45 // the rings assume a steeper glide than the real one, for slack

let cache = null

// Every course: { id, name, start: {x, y, z}, rings: [{x, y, z, yaw}], length, gold, silver, limit }.
export function raceCourses() {
  if (cache) return cache
  const summits = [...skystars()].filter((s) => s.y > 16).sort((a, b) => b.y - a.y)
  const list = []
  for (const top of summits) {
    if (list.length >= RACE_COUNT) break
    if (list.some((c) => Math.hypot(c.start.x - top.x, c.start.z - top.z) < RACE_SPACING)) continue
    const course = planCourse(top, list.length)
    if (course) list.push(course)
  }
  cache = list
  return cache
}

// Lays a gently curving line of rings down the best side of a summit (the one that falls away most and stays
// on land), or null when no side works.
function planCourse(top, index) {
  let best = null
  for (let k = 0; k < 24; k++) {
    const heading = (k / 24) * Math.PI * 2
    for (const curve of [-0.006, 0.006]) {
      const path = walk(top, heading, curve)
      if (!path) continue
      let drop = 0
      for (const p of path) drop += top.y - heightAt(p.x, p.z)
      if (!best || drop > best.drop) best = { drop, path }
    }
  }
  if (!best) return null
  const startY = top.y
  const rings = []
  let glideEnds = null
  for (const p of best.path) {
    const ground = heightAt(p.x, p.z)
    const planned = startY + JUMP_PEAK - PLAN_SINK * p.s
    if (glideEnds === null && planned < ground + 2.4) glideEnds = p.s
    rings.push({ x: p.x, z: p.z, y: Math.max(ground + 2.4, planned), yaw: p.yaw, s: p.s })
  }
  // An honest best time: glide at full speed until the real glide path meets the ground, then run.
  const realSink = GLIDE_SINK / GLIDE_SPEED
  let glideFor = COURSE_LENGTH
  for (const p of best.path) {
    if (startY + JUMP_PEAK - realSink * p.s < heightAt(p.x, p.z) + 0.5) {
      glideFor = p.s
      break
    }
  }
  const ideal = glideFor / GLIDE_SPEED + (COURSE_LENGTH - glideFor) / PLAYER_SPEED
  return {
    id: `race${index}`,
    name: RACE_NAMES[index % RACE_NAMES.length],
    start: { x: top.x, y: top.y, z: top.z },
    rings: rings.map(({ s, ...r }) => r),
    length: COURSE_LENGTH,
    gold: Math.round((ideal * 1.08 + 1.5) * 10) / 10,
    silver: Math.round((ideal * 1.3 + 3) * 10) / 10,
    limit: Math.round((ideal * 1.7 + 6) * 10) / 10,
  }
}

// The ring points along one heading (null if it leaves the land or runs into a lake).
function walk(top, heading, curve) {
  const out = []
  let x = top.x
  let z = top.z
  let h = heading
  for (let s = 1; s <= COURSE_LENGTH; s++) {
    h += curve
    x += Math.cos(h) * 1
    z += Math.sin(h) * 1
    if (Math.hypot(x, z) > WORLD_RADIUS - 30) return null
    if (s >= 14 && (s - 14) % RING_SPACING === 0) {
      if (lakeAt(x, z, 0.2)) return null
      out.push({ x, z, s, yaw: Math.atan2(Math.cos(h), Math.sin(h)) }) // yaw: the ring faces along the path
    }
  }
  return out
}

export const raceById = (id) => raceCourses().find((c) => c.id === id) ?? null

export function createRaceState() {
  return { active: null, lockout: null } // active: { id, next, startedAt }; lockout: a gate you must step out of first
}

// 'gold' | 'silver' | 'bronze' for a finishing time.
export const medalFor = (course, time) => (time <= course.gold ? 'gold' : time <= course.silver ? 'silver' : 'bronze')
export const MEDAL_REWARD = { gold: 90, silver: 55, bronze: 30 }
// Crystals for a finish (a first-ever finish of the course pays half again).
export const raceReward = (medal, firstTime) => Math.round(MEDAL_REWARD[medal] * (firstTime ? 1.5 : 1))

// Is a point (y = the player's feet) inside a ring's opening?
export function inRing(ring, x, y, z) {
  return Math.hypot(ring.x - x, ring.z - z) < RING_RADIUS && y > ring.y - RING_RADIUS - 1.6 && y < ring.y + RING_RADIUS
}

// One step of the race rules. Returns { state, events } with events
//   { type: 'start', course } { type: 'ring', index, total } { type: 'finish', course, time, medal }
//   { type: 'fail', course, reason: 'time' | 'lost' }
export function stepRace(state, { x, y, z, now }) {
  const events = []
  let { active, lockout } = state
  if (lockout) {
    const gate = raceById(lockout)
    if (!gate || Math.hypot(gate.start.x - x, gate.start.z - z) > START_RADIUS + 5) lockout = null
  }
  if (!active) {
    for (const course of raceCourses()) {
      if (course.id === lockout) continue
      if (Math.hypot(course.start.x - x, course.start.z - z) < START_RADIUS && Math.abs(y - course.start.y) < 4) {
        active = { id: course.id, next: 0, startedAt: now }
        lockout = course.id
        events.push({ type: 'start', course })
        break
      }
    }
    return { state: { active, lockout }, events }
  }
  const course = raceById(active.id)
  const time = now - active.startedAt
  const ring = course.rings[active.next]
  if (inRing(ring, x, y, z)) {
    active = { ...active, next: active.next + 1 }
    events.push({ type: 'ring', index: active.next, total: course.rings.length })
    if (active.next >= course.rings.length) {
      events.push({ type: 'finish', course, time, medal: medalFor(course, time) })
      return { state: { active: null, lockout }, events }
    }
  } else if (time > course.limit) {
    events.push({ type: 'fail', course, reason: 'time' })
    return { state: { active: null, lockout }, events }
  } else if (Math.hypot(ring.x - x, ring.z - z) > GIVE_UP_DISTANCE) {
    events.push({ type: 'fail', course, reason: 'lost' })
    return { state: { active: null, lockout }, events }
  }
  return { state: { active, lockout }, events }
}
