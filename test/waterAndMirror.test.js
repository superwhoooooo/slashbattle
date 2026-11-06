import { describe, expect, it } from 'vitest'
import { MONSTER_TYPES } from '../src/config.js'
import { BOSSES, BOSS_SPECIALS } from '../src/logic/bosses.js'
import { LEVELS } from '../src/logic/levels.js'
import { MELEE_REFLECT_DAMAGE, isFrontHit, reflectedDamage } from '../src/logic/reflect.js'
import { WATER, stepBreath, stepDepth, stepSwim, waterBullet, waveHeight } from '../src/logic/water.js'
import { SPLITS } from '../src/logic/enemies.js'
import { scoreForKill } from '../src/logic/waves.js'

describe('new enemies', () => {
  it('has a mirror, a hopper and a glimmer with their own tricks', () => {
    expect(MONSTER_TYPES.mirror.reflect.halfArc).toBeGreaterThan(0)
    expect(MONSTER_TYPES.hopper.specials).toContain('leap')
    expect(MONSTER_TYPES.hopper.noMelee).toBe(true)
    expect(MONSTER_TYPES.hopper.color).toBe(0x2ee6d6) // turquoise
    expect(MONSTER_TYPES.glimmer.specials).toContain('blink')
    for (const id of ['mirror', 'hopper', 'glimmer']) expect(scoreForKill(id)).toBeGreaterThan(0)
  })
  it('gives every regular enemy a boss version', () => {
    const bases = ['blobbo', 'zippy', 'grumpus', 'bloater', 'spinner', 'splitter', 'mirror', 'hopper', 'glimmer']
    for (const base of bases) expect(BOSSES.some((b) => b.id === `boss_${base}`), base).toBe(true)
    expect(MONSTER_TYPES.boss_mirror.reflect).toBeTruthy()
    expect(MONSTER_TYPES.boss_hopper.accessory).toBe('limbs')
    expect(SPLITS.boss_splitter.into).toBe('splitter')
  })
  it('leap is a real special', () => {
    expect(BOSS_SPECIALS.leap.range).toBeGreaterThan(0)
    expect(MONSTER_TYPES.boss_hopper.specials).toContain('leap')
  })
})

describe('mirror reflect rule', () => {
  const at = { x: 0, z: 0 }
  it('catches hits on the front arc only', () => {
    expect(isFrontHit(0, at, { x: 0, z: 5 }, 0.95)).toBe(true) // straight ahead (forward = +z at yaw 0)
    expect(isFrontHit(0, at, { x: 0, z: -5 }, 0.95)).toBe(false) // behind
    expect(isFrontHit(0, at, { x: 5, z: 0.5 }, 0.95)).toBe(false) // beside
    expect(isFrontHit(Math.PI / 2, at, { x: 5, z: 0 }, 0.95)).toBe(true) // turned to face +x
  })
  it('reflects a sane fraction of damage', () => {
    expect(reflectedDamage(1)).toBe(4)
    expect(reflectedDamage(1000)).toBe(14)
    expect(MELEE_REFLECT_DAMAGE).toBeGreaterThan(0)
  })
})

describe('water rules', () => {
  it('has three water rooms', () => {
    const rooms = LEVELS.filter((l) => l.water)
    expect(rooms.map((l) => l.water.style).sort()).toEqual(['ocean', 'pool', 'reef'])
    expect(rooms.map((l) => l.name)).toEqual(expect.arrayContaining(['Pool Room', 'Pacific Ocean']))
  })
  it('swimmers have momentum', () => {
    let v = { x: 0, z: 0 }
    v = stepSwim(v, { x: 6, z: 0 }, 0.1)
    expect(v.x).toBeGreaterThan(0)
    expect(v.x).toBeLessThan(6) // not instant
    const coast = stepSwim({ x: 6, z: 0 }, { x: 0, z: 0 }, 0.1)
    expect(coast.x).toBeGreaterThan(3) // keeps drifting
    expect(coast.x).toBeLessThan(6)
  })
  it('breath drains under water and refills on top', () => {
    let b = WATER.breath
    for (let i = 0; i < 20; i++) b = stepBreath(b, true, 1).breath
    expect(b).toBe(0)
    expect(stepBreath(0.5, true, 1).out).toBe(true)
    expect(stepBreath(0, false, 1).breath).toBeGreaterThan(0)
    expect(stepBreath(WATER.breath, false, 5).breath).toBe(WATER.breath)
  })
  it('depth eases toward diving and back', () => {
    let y = WATER.floatY
    for (let i = 0; i < 60; i++) y = stepDepth(y, true, 0.05)
    expect(y).toBeCloseTo(WATER.diveY, 1)
    for (let i = 0; i < 60; i++) y = stepDepth(y, false, 0.05)
    expect(y).toBeCloseTo(WATER.floatY, 1)
  })
  it('waves stay small and move over time; underwater shots are slower', () => {
    expect(Math.abs(waveHeight(3, 4, 1.2))).toBeLessThan(0.2)
    expect(waveHeight(3, 4, 0)).not.toBe(waveHeight(3, 4, 2))
    const b = waterBullet({ speed: 40, life: 1 }, true)
    expect(b.speed).toBeLessThan(40)
    expect(waterBullet({ speed: 40, life: 1 }, false).speed).toBe(40)
  })
})

describe('deep dwellers', () => {
  it('has three, flagged deep, with their own tricks', async () => {
    const { DEEP_TYPES, pickDeepType } = await import('../src/logic/enemies.js')
    expect(DEEP_TYPES).toEqual(['angler', 'urchin', 'eel'])
    for (const id of DEEP_TYPES) {
      expect(MONSTER_TYPES[id].deep).toBe(true)
      expect(scoreForKill(id)).toBeGreaterThan(0)
    }
    expect(MONSTER_TYPES.urchin.specials).toContain('spin')
    expect(MONSTER_TYPES.eel.specials).toContain('charge')
    expect(pickDeepType(() => 0)).toBe('angler')
    expect(pickDeepType(() => 0.99)).toBe('eel')
  })
  it('are out of reach and out of mind until you dive', async () => {
    const { isUntouchable, setDeepShield, createMonsterAIState, updateMonster } = await import('../src/monster.js')
    const eel = { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 }, userData: { type: 'eel', deep: true, radius: 0.4, jelly: { hit: { value: 0, velocity: 0 } }, ...createMonsterAIState(MONSTER_TYPES.eel) } }
    const blobbo = { userData: { deep: false } }
    setDeepShield(false)
    expect(isUntouchable(eel)).toBe(false)
    setDeepShield(true)
    expect(isUntouchable(eel)).toBe(true)
    expect(isUntouchable(blobbo)).toBe(false)
    // Next to the player but the player is on the surface: it never notices them.
    const player = { position: { x: 2, z: 0 }, hidden: false, damagePlayer: () => true }
    for (let t = 0; t < 2; t += 0.05) updateMonster(eel, player, [], 0.05, t)
    expect(eel.userData.state).toBe('wander')
    setDeepShield(false)
    for (let t = 2; t < 3; t += 0.05) updateMonster(eel, player, [], 0.05, t)
    expect(['chase', 'attack']).toContain(eel.userData.state)
  })
})
