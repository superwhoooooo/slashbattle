import { describe, expect, it } from 'vitest'
import {
  CODE_LENGTH, FLAG, clampDamage, cleanName, everyoneDown, isValidCode, lerpAngle, makeRoomCode, normalizeCode, packMonster,
  pickTarget, plainCopy, pushSnapshot, routeEvents, sampleSnapshots, unpackMonster,
} from '../src/logic/coop.js'

describe('room codes', () => {
  it('makes valid 4-letter codes without look-alike characters', () => {
    for (let i = 0; i < 200; i++) {
      const code = makeRoomCode()
      expect(code).toHaveLength(CODE_LENGTH)
      expect(isValidCode(code)).toBe(true)
      expect(code).not.toMatch(/[01OIL]/)
    }
  })
  it('cleans up what people type', () => {
    expect(normalizeCode(' ab-cd9 ')).toBe('ABCD')
    expect(normalizeCode('x7')).toBe('X7')
    expect(isValidCode('AB')).toBe(false)
    expect(isValidCode('AB0D')).toBe(false)
  })
  it('cleans names', () => {
    expect(cleanName('  <Bob>  ')).toBe('Bob')
    expect(cleanName('')).toBe('Friend')
    expect(cleanName('a'.repeat(40))).toHaveLength(16)
  })
})

describe('monster snapshots', () => {
  it('round-trips a monster row with its flags', () => {
    const ud = { netId: 7, type: 'zippy', hp: 12.4, maxHp: 30, spawning: false, dying: true, isBoss: true, immune: false, phase2: true, reflect: { halfArc: 1 }, frozenUntil: 10 }
    const row = packMonster(ud, { x: 1.234, y: 0.5, z: -3.21 }, 0.75, 5)
    const back = unpackMonster(row)
    expect(back).toMatchObject({ id: 7, type: 'zippy', x: 1.23, z: -3.21, y: 0.5, rotY: 0.75, hp: 12, maxHp: 30, dying: true, boss: true, phase2: true, reflect: true, frozen: true, spawning: false, immune: false })
    expect(row[8] & FLAG.dying).toBeTruthy()
  })
  it('rejects malformed rows', () => {
    expect(unpackMonster(null)).toBeNull()
    expect(unpackMonster([1, 'zippy', 'x', 0, 0, 0, 1, 1, 0])).toBeNull()
    expect(unpackMonster([1, 2, 0, 0, 0, 0, 1, 1, 0])).toBeNull()
  })
})

describe('smoothing', () => {
  it('interpolates between the snapshots around a time', () => {
    const snaps = []
    pushSnapshot(snaps, { t: 0, x: 0 })
    pushSnapshot(snaps, { t: 1, x: 10 })
    const s = sampleSnapshots(snaps, 0.25)
    expect(s.a.x).toBe(0)
    expect(s.b.x).toBe(10)
    expect(s.k).toBeCloseTo(0.25)
    expect(sampleSnapshots(snaps, 5).k).toBe(0) // past the newest: hold it
    expect(sampleSnapshots(snaps, -1).a.x).toBe(0)
    expect(sampleSnapshots([], 0)).toBeNull()
  })
  it('keeps the buffer short and ordered', () => {
    const snaps = []
    for (let i = 0; i < 50; i++) pushSnapshot(snaps, { t: i }, 10)
    expect(snaps).toHaveLength(10)
    pushSnapshot(snaps, { t: 3 }, 10) // out of order: ignored
    expect(snaps[snaps.length - 1].t).toBe(49)
  })
  it('turns the short way round', () => {
    expect(lerpAngle(3, -3, 0.5)).toBeCloseTo(Math.PI, 1)
    expect(lerpAngle(0, 1, 0.5)).toBeCloseTo(0.5)
  })
})

describe('pickTarget', () => {
  const players = [
    { key: 'host', x: 0, z: 0, alive: true },
    { key: 'a', x: 10, z: 0, alive: true },
  ]
  it('goes after the nearest player who is up', () => {
    expect(pickTarget({ x: 8, z: 0 }, players)).toBe('a')
    expect(pickTarget({ x: 1, z: 0 }, players)).toBe('host')
  })
  it('sticks with its current target unless another is clearly closer', () => {
    expect(pickTarget({ x: 6, z: 0 }, players, 'host')).toBe('host') // a is 2 closer: not enough
    expect(pickTarget({ x: 9, z: 0 }, players, 'host')).toBe('a') // a is 8 closer
  })
  it('ignores players who are down', () => {
    expect(pickTarget({ x: 9, z: 0 }, [{ ...players[0] }, { ...players[1], alive: false }], 'a')).toBe('host')
    expect(pickTarget({ x: 0, z: 0 }, [{ ...players[0], alive: false }])).toBeNull()
  })
})

describe('routeEvents', () => {
  const events = [{ type: 'slam' }, { type: 'summon' }, { type: 'status' }, { type: 'shoot' }, { type: 'steal' }]
  it('keeps targeted events with the host when the host is the target', () => {
    const r = routeEvents(events, false)
    expect(r.host.map((e) => e.type)).toEqual(['slam', 'summon', 'status', 'shoot', 'steal'])
    expect(r.broadcast.map((e) => e.type)).toEqual(['slam', 'shoot'])
    expect(r.targeted).toEqual([])
  })
  it('sends targeted events to a remote target only', () => {
    const r = routeEvents(events, true)
    expect(r.host.map((e) => e.type)).toEqual(['slam', 'summon', 'shoot'])
    expect(r.targeted.map((e) => e.type)).toEqual(['status', 'steal'])
    expect(r.broadcast.map((e) => e.type)).toEqual(['slam', 'shoot'])
  })
})

describe('misc', () => {
  it('makes plain copies safe to send', () => {
    const a = { x: 1, f: () => 1, nested: { y: 2 } }
    a.self = a
    expect(plainCopy(a)).toEqual({ x: 1, nested: { y: 2 }, self: null })
  })
  it('ends the run only when everyone is down', () => {
    expect(everyoneDown(true, [true, true])).toBe(true)
    expect(everyoneDown(true, [true, false])).toBe(false)
    expect(everyoneDown(false, [true])).toBe(false)
    expect(everyoneDown(true, [])).toBe(true)
  })
  it('clamps forwarded damage', () => {
    expect(clampDamage('12')).toBe(12)
    expect(clampDamage(-5)).toBe(0)
    expect(clampDamage(NaN)).toBe(0)
    expect(clampDamage(1e9)).toBe(5000)
  })
})

describe('chest rows', () => {
  it('round-trips a player\'s chests and drops bad rows', async () => {
    const { packChests, unpackChests, MAX_NET_CHESTS } = await import('../src/logic/coop.js')
    const rows = packChests([{ id: 3, x: 1.234, z: -5.678, y: 0, cost: 12.4, affordable: true, opened: false }, { id: 4, x: 0, z: 0, cost: 0, affordable: false, opened: true }])
    expect(unpackChests(rows)).toEqual([
      { id: 3, x: 1.23, z: -5.68, y: 0, cost: 12, affordable: true, opened: false },
      { id: 4, x: 0, z: 0, y: 0, cost: 0, affordable: false, opened: true },
    ])
    expect(unpackChests([['x', 0, 0, 0, 1, 0, 0], [5, 'a', 0, 0, 1, 0, 0], 'junk'])).toEqual([])
    expect(unpackChests(null)).toEqual([])
    const many = Array.from({ length: 20 }, (_, i) => ({ id: i, x: 0, z: 0, cost: 1 }))
    expect(unpackChests(packChests(many))).toHaveLength(MAX_NET_CHESTS)
  })
})

describe('co-op in every mode', () => {
  it('knows the modes and cleans up junk', async () => {
    const { COOP_MODES, cleanMode } = await import('../src/logic/coop.js')
    expect(COOP_MODES).toEqual(['resort', 'labyrinth', 'world', 'sandbox', 'tutorial'])
    expect(cleanMode('world')).toBe('world')
    expect(cleanMode('???')).toBe('resort')
    expect(cleanMode(undefined)).toBe('resort')
  })
  it('leaves a player alone within reach of every friend', async () => {
    const { COOP_MAX_DISTANCE, leashPosition } = await import('../src/logic/coop.js')
    const r = leashPosition({ x: 10, z: 0 }, [{ x: 0, z: 0 }, { x: 20, z: 5 }])
    expect(r).toEqual({ x: 10, z: 0, held: false })
    expect(leashPosition({ x: 5, z: 5 }, []).held).toBe(false)
    expect(COOP_MAX_DISTANCE).toBeLessThan(125)
  })
  it('pulls a player back to the edge of the leash, along the line to the friend', async () => {
    const { COOP_MAX_DISTANCE, leashPosition } = await import('../src/logic/coop.js')
    const r = leashPosition({ x: 200, z: 0 }, [{ x: 0, z: 0 }])
    expect(r.held).toBe(true)
    expect(r.x).toBeCloseTo(COOP_MAX_DISTANCE)
    expect(r.z).toBeCloseTo(0)
  })
  it('holds against two friends at once', async () => {
    const { COOP_MAX_DISTANCE, leashPosition } = await import('../src/logic/coop.js')
    const a = { x: 0, z: 0 }
    const b = { x: 80, z: 0 }
    const r = leashPosition({ x: 40, z: 300 }, [a, b])
    expect(Math.hypot(r.x - a.x, r.z - a.z)).toBeLessThanOrEqual(COOP_MAX_DISTANCE + 0.5)
    expect(Math.hypot(r.x - b.x, r.z - b.z)).toBeLessThanOrEqual(COOP_MAX_DISTANCE + 0.5)
  })
  it('stands a downed player up beside a friend who is up, else at the save point', async () => {
    const { standUpBeside } = await import('../src/logic/coop.js')
    expect(standUpBeside([{ x: 10, z: 10, down: true }])).toBeNull()
    expect(standUpBeside([])).toBeNull()
    expect(standUpBeside([{ x: 1, z: 1, down: true }, { x: 10, z: 20, down: false }])).toEqual({ x: 12, z: 22 })
  })
})

describe('the level a monster is on', () => {
  it('carries the sky-isle flag across the wire', async () => {
    const { packMonster, unpackMonster } = await import('../src/logic/coop.js')
    const row = (ud) => unpackMonster(packMonster({ netId: 1, type: 'zippy', hp: 5, maxHp: 5, ...ud }, { x: 1, y: 100, z: 2 }, 0))
    expect(row({ skyIsle: true }).skyIsle).toBe(true)
    expect(row({}).skyIsle).toBe(false)
  })
})
