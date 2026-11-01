import { afterEach, describe, expect, it, vi } from 'vitest'
import { MONSTER_TYPES } from '../src/config.js'
import { createMonsterAIState, updateMonster } from '../src/monster.js'

function fake(type, x, z) {
  const stats = MONSTER_TYPES[type]
  return {
    position: { x, y: 0, z },
    rotation: { y: 0 },
    userData: { type, radius: stats.radius, hp: stats.hp, jelly: { hit: { value: 0, velocity: 0 } }, ...createMonsterAIState(stats) },
  }
}

// Runs a shooter against a player moving at (vx, vz) for `seconds`.
function run(monster, player, vx, vz, seconds, dt = 0.05) {
  const events = []
  for (let t = 0; t < seconds; t += dt) {
    player.position.x += vx * dt
    player.position.z += vz * dt
    events.push(...updateMonster(monster, player, [], dt, t).events)
  }
  return events
}

const player = () => ({ position: { x: 0, z: 0 }, hidden: false, damagePlayer: () => true })

afterEach(() => vi.restoreAllMocks())

describe('bloater', () => {
  it('lobs poison ahead of a player who is running', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    const monster = fake('bloater', 8, 0)
    const runner = player()
    const lead = []
    for (let t = 0; t < 5; t += 0.05) {
      runner.position.z += 1.5 * 0.05 // steady run along +z
      for (const e of updateMonster(monster, runner, [], 0.05, t).events) {
        if (e.type === 'lob') lead.push(e.tz - runner.position.z)
      }
    }
    expect(lead.length).toBeGreaterThanOrEqual(1)
    // 1.5 units/s times the 1s flight: it targets about 1.5 past where the player stands.
    for (const l of lead) expect(l).toBeGreaterThan(1)
  })

  it('does not melee, and backs away when crowded', () => {
    const monster = fake('bloater', 3, 0)
    const hurt = player()
    let hits = 0
    hurt.damagePlayer = () => { hits++; return true }
    run(monster, hurt, 0, 0, 5)
    expect(hits).toBe(0)
    expect(monster.position.x).toBeGreaterThan(3)
  })
})

describe('spinner', () => {
  it('fires a fan of small orbs at the player', () => {
    const shots = run(fake('spinner', 6, 0), player(), 0, 0, 8).filter((e) => e.type === 'shoot')
    expect(shots.length).toBeGreaterThanOrEqual(2)
    expect(shots[0].count).toBe(3)
    expect(shots[0].size).toBeLessThan(1)
    expect(shots[0].damage).toBeGreaterThan(0)
  })
})

describe('scaling', () => {
  it('a scaled-up monster hits harder', () => {
    const monster = fake('blobbo', 0.5, 0)
    monster.userData.damageScale = 2
    const hurt = player()
    const amounts = []
    hurt.damagePlayer = (a) => { amounts.push(a); return true }
    run(monster, hurt, 0, 0, 3)
    expect(amounts[0]).toBe(MONSTER_TYPES.blobbo.damage * 2)
  })
})
