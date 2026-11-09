// Drives the three shady guests through monster.js's real updateMonster loop with a stand-in mesh,
// and checks each one actually gets round to its move.
import { describe, expect, it } from 'vitest'
import { createMonsterAIState, isUntouchable, updateMonster } from '../src/monster.js'
import { MONSTER_TYPES } from '../src/config.js'

function fakeMonster(type, x, z) {
  const laser = { visible: false, material: { opacity: 0 } }
  const userData = { type, hp: 100, maxHp: 100, radius: MONSTER_TYPES[type].radius, ...createMonsterAIState(MONSTER_TYPES[type]), laser }
  return { position: { x, z, y: 0 }, rotation: { y: 0 }, userData }
}
function fakePlayer(x, z) {
  return { position: { x, z }, hidden: false, damagePlayer: () => true }
}
// Runs `seconds` of updates at 60fps; the player optionally strafes along x. Returns every event.
function run(monster, player, seconds, strafe = 0) {
  const events = []
  const dt = 1 / 60
  for (let t = 0; t < seconds; t += dt) {
    player.position.x += strafe * dt
    events.push(...updateMonster(monster, player, [], dt, t).events)
    if (monster.userData.escaped) break
  }
  return events
}

describe('shady guests in the real monster loop', () => {
  it('a paparazzo shows its laser, then flashes a beam', () => {
    const m = fakeMonster('paparazzo', 0, 0)
    const p = fakePlayer(0, 11)
    let laserSeen = false
    const events = []
    for (let t = 0; t < 6; t += 1 / 60) {
      events.push(...updateMonster(m, p, [], 1 / 60, t).events)
      laserSeen ||= m.userData.laser.visible
    }
    expect(laserSeen).toBe(true)
    const shot = events.find((e) => e.type === 'snipe')
    expect(shot).toBeTruthy()
    expect(shot.damage).toBeGreaterThan(0)
  })

  it('a paparazzo backs off when you crowd it', () => {
    const m = fakeMonster('paparazzo', 0, 0)
    const p = fakePlayer(0, 4)
    run(m, p, 1)
    expect(Math.hypot(m.position.x - p.position.x, m.position.z - p.position.z)).toBeGreaterThan(4)
  })

  it('a gopher digs in (untouchable), tunnels over, erupts, and is dazed after', () => {
    const m = fakeMonster('gopher', 0, 0)
    const p = fakePlayer(0, 9)
    const events = []
    let wasUntouchable = false
    let wasDazed = false
    for (let t = 0; t < 10; t += 1 / 60) {
      events.push(...updateMonster(m, p, [], 1 / 60, t).events)
      wasUntouchable ||= isUntouchable(m)
      wasDazed ||= m.userData.dazed === true
    }
    const types = events.map((e) => e.type)
    expect(types).toContain('dig')
    expect(types).toContain('warn')
    expect(types).toContain('erupt')
    expect(types.indexOf('dig')).toBeLessThan(types.indexOf('erupt'))
    expect(wasUntouchable).toBe(true)
    expect(wasDazed).toBe(true)
    const erupt = events.find((e) => e.type === 'erupt')
    expect(Math.hypot(erupt.x - p.position.x, erupt.z - p.position.z)).toBeLessThan(3) // came up near you
  })

  it('a bandit steals once in reach, then runs and checks out if not caught', () => {
    const m = fakeMonster('bandit', 0, 0)
    const p = fakePlayer(0, 5)
    const events = run(m, p, 15)
    const types = events.map((e) => e.type)
    expect(types.filter((t) => t === 'steal')).toHaveLength(1)
    expect(types).toContain('escape')
    expect(Math.hypot(m.position.x - p.position.x, m.position.z - p.position.z)).toBeGreaterThan(8) // got away from you
  })
})

describe('shady guests: meshes', () => {
  function stubContext() {
    return new Proxy({}, { get: (t, p) => (p in t ? t[p] : (...a) => (p === 'measureText' ? { width: 10 } : stubContext())), set: (t, p, v) => ((t[p] = v), true) })
  }
  it('builds each in both looks, with the laser, sack and animated add-ons', async () => {
    globalThis.document = { createElement: () => ({ width: 0, height: 0, style: {}, getContext: () => stubContext() }) }
    globalThis.localStorage ??= { getItem: () => null, setItem: () => {} }
    const { createMonsterMesh } = await import('../src/characters.js')
    const { setGraphicsStyle } = await import('../src/graphicsStyle.js')
    for (const style of ['jelly', 'shard']) {
      setGraphicsStyle(style)
      const pap = createMonsterMesh('paparazzo')
      expect(pap.userData.laser, style).toBeTruthy()
      expect(pap.userData.laser.visible).toBe(false)
      const gopher = createMonsterMesh('gopher')
      const bandit = createMonsterMesh('bandit')
      for (const m of [pap, gopher, bandit]) m.userData.animateAcc?.(1.3)
      if (style === 'jelly') {
        bandit.userData.setSack(30)
        expect(bandit.userData.setSack).toBeTypeOf('function')
        expect(gopher.userData.animateAcc).toBeTypeOf('function')
      }
    }
  })
})
