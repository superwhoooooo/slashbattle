import { describe, expect, it } from 'vitest'
import { PETS } from '../src/logic/items.js'
import { CONTACT, LEASH, SIGHT, STRIKES, canEngage, engageGoal, homeSpot, isFighter, leashPoint, stepToward, strikeReach } from '../src/logic/petAI.js'

const origin = { x: 0, z: 0 }

describe('pet catalog', () => {
  it('gives every attack kind what it needs to do what it says', () => {
    for (const pet of Object.values(PETS)) {
      if (pet.kind === 'lunge') expect(STRIKES[pet.strike], pet.id).toBeTruthy()
      if (pet.kind === 'explode') expect(pet.blast, pet.id).toBeGreaterThan(0)
      if (pet.kind === 'shot') expect(pet.projectile, pet.id).toBeTruthy()
    }
  })

  it('makes Toco peck in person instead of shooting a beam', () => {
    expect(PETS.toco.kind).toBe('lunge')
    expect(PETS.toco.strike).toBe('peck')
    expect(PETS.toco.sight).toBeGreaterThan(SIGHT)
  })

  it('only fighters roam', () => {
    expect(isFighter(PETS.toco)).toBe(true)
    expect(isFighter(PETS.healbit)).toBe(false)
    expect(isFighter(PETS.shieldy)).toBe(false)
    expect(isFighter(PETS.magneto)).toBe(false)
  })
})

describe('seeing enemies', () => {
  it('engages enemies in sight near the player, ignores far ones', () => {
    expect(canEngage(PETS.ember, { x: 1, z: 0 }, origin, { x: 10, z: 0 })).toBe(true)
    expect(canEngage(PETS.ember, { x: 1, z: 0 }, origin, { x: SIGHT + 5, z: 0 })).toBe(false) // out of sight
    expect(canEngage(PETS.ember, { x: LEASH + 4, z: 0 }, origin, { x: LEASH + 5, z: 0 })).toBe(false) // too far from the player
    expect(canEngage(PETS.healbit, { x: 1, z: 0 }, origin, { x: 3, z: 0 })).toBe(false)
  })
})

describe('where a pet heads', () => {
  const pet = { x: 1, z: 0 }
  const target = { x: 9, z: 0 }

  it('lunges straight at the enemy when ready and backs off after a hit', () => {
    const go = engageGoal(PETS.toco, { pet, target, player: origin, ready: true })
    expect(go.x).toBeCloseTo(9)
    const back = engageGoal(PETS.toco, { pet: { x: 9.5, z: 0 }, target, player: origin, ready: false })
    expect(Math.hypot(back.x - target.x, back.z - target.z)).toBeGreaterThan(CONTACT)
  })

  it('sticks to the enemy for a fast flurry', () => {
    const near = engageGoal(PETS.shadow, { pet: { x: 9.2, z: 0 }, target, player: origin, ready: false })
    expect(Math.hypot(near.x - target.x, near.z - target.z)).toBeLessThan(1.2)
  })

  it('waits by the player while a bomb reforms, then charges', () => {
    expect(engageGoal(PETS.blasty, { pet, target, player: origin, ready: false })).toBeNull()
    expect(engageGoal(PETS.blasty, { pet, target, player: origin, ready: true }).x).toBeCloseTo(9)
  })

  it('shooters close to their range, then hold', () => {
    const far = engageGoal(PETS.waddles, { pet: origin, target: { x: 15, z: 0 }, player: origin, ready: true })
    expect(far).not.toBeNull()
    expect(far.x).toBeLessThan(15)
    expect(engageGoal(PETS.waddles, { pet: { x: 9, z: 0 }, target: { x: 15, z: 0 }, player: origin, ready: true })).toBeNull()
  })

  it('pulse pets run in until enemies are within their radius', () => {
    expect(engageGoal(PETS.spike, { pet, target, player: origin, ready: true })).not.toBeNull()
    expect(engageGoal(PETS.spike, { pet: { x: 8.5, z: 0 }, target, player: origin, ready: true })).toBeNull()
  })

  it("never leaves the player's leash", () => {
    const go = engageGoal(PETS.ember, { pet, target: { x: LEASH, z: 0 }, player: origin, ready: true })
    expect(Math.hypot(go.x, go.z)).toBeLessThanOrEqual(LEASH + 1e-6)
    expect(leashPoint({ x: 100, z: 0 }, origin, 10)).toEqual({ x: 10, z: 0 })
  })
})

describe('moving', () => {
  it('steps toward a goal without overshooting', () => {
    expect(stepToward(origin, { x: 10, z: 0 }, 10, 0.1).x).toBeCloseTo(1)
    expect(stepToward(origin, { x: 0.01, z: 0 }, 10, 1).x).toBeCloseTo(0.01)
  })

  it('idles around the player and reaches a big enemy a bit sooner', () => {
    const spot = homeSpot({ x: 5, z: 5 }, 0, 1, 0)
    expect(Math.hypot(spot.x - 5, spot.z - 5)).toBeCloseTo(1.9)
    expect(strikeReach({ reachBonus: 1 })).toBeGreaterThan(strikeReach({}))
  })
})
