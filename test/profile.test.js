import { describe, expect, it } from 'vitest'
import {
  LOADOUT_SLOTS,
  activeLoadoutPets,
  addToCollection,
  bankCrystals,
  buyPowerupLevel,
  buySkill,
  createProfile,
  normalizeProfile,
  respecSkills,
  setActiveLoadout,
  toggleLoadoutPet,
} from '../src/logic/profile.js'
import { BASE_SLOTS, MAX_PETS, MAX_SLOTS, SLOT_LIMITS, powerupEffects, setSlotBonuses } from '../src/logic/items.js'
import { SKILLS, SKILL_BRANCHES, combineEffects, skillCost, skillEffects, skillsSpent } from '../src/logic/skills.js'

describe('profile banking', () => {
  it('banks whole crystals and ignores junk', () => {
    let p = bankCrystals(createProfile(), 40)
    expect(p.bank).toBe(40)
    p = bankCrystals(p, -5)
    p = bankCrystals(p, NaN)
    expect(p.bank).toBe(40)
  })
})

describe('collection and loadouts', () => {
  it('only lets collected pets into the active loadout, up to MAX_PETS', () => {
    let p = createProfile()
    expect(toggleLoadoutPet(p, 'sparky').ok).toBe(false)
    p = addToCollection(p, ['sparky', 'ember', 'bolt', 'comet', 'whirl', 'zoom'])
    for (const id of ['sparky', 'ember', 'bolt', 'comet', 'whirl']) p = toggleLoadoutPet(p, id).profile
    expect(activeLoadoutPets(p)).toHaveLength(MAX_PETS)
    expect(toggleLoadoutPet(p, 'zoom').ok).toBe(false)
    p = toggleLoadoutPet(p, 'sparky').profile // toggles off
    expect(activeLoadoutPets(p)).not.toContain('sparky')
  })

  it('keeps each loadout slot separate', () => {
    let p = addToCollection(createProfile(), ['sparky', 'ember'])
    p = toggleLoadoutPet(p, 'sparky').profile
    p = setActiveLoadout(p, 1)
    p = toggleLoadoutPet(p, 'ember').profile
    expect(p.loadouts[0].pets).toEqual(['sparky'])
    expect(p.loadouts[1].pets).toEqual(['ember'])
    expect(setActiveLoadout(p, LOADOUT_SLOTS)).toBe(p)
  })
})

describe('skills', () => {
  it('needs crystals, the node above it, and an open tier', () => {
    let p = { ...createProfile(), bank: 1000 }
    expect(buySkill(p, 'thick').reason).toMatch(/Needs Hardy/)
    p = buySkill(p, 'hardy').profile
    expect(buySkill(p, 'thick').reason).toMatch(/Spend 2 more ranks in Conditioning/)
    p = buySkill(p, 'hardy').profile
    p = buySkill(p, 'hardy').profile // 3 ranks open tier 2
    const bought = buySkill(p, 'thick')
    expect(bought.ok).toBe(true)
    expect(bought.profile.bank).toBe(p.bank - SKILLS.thick.cost)
    expect(buySkill({ ...p, bank: 0 }, 'hardy').reason).toMatch(/enough/)
  })

  it('charges the same per rank and stops at the max', () => {
    expect(skillCost('heavy', 0)).toBe(skillCost('heavy', 3))
    let p = { ...createProfile(), bank: 99999 }
    for (let i = 0; i < SKILLS.heavy.max; i++) p = buySkill(p, 'heavy').profile
    expect(buySkill(p, 'heavy').reason).toBe('Maxed out')
  })

  it('adds ranks into effects and refunds everything on a respec', () => {
    let p = { ...createProfile(), bank: 500 }
    p = buySkill(p, 'heavy').profile
    p = buySkill(p, 'heavy').profile
    p = buySkill(p, 'hardy').profile
    expect(skillEffects(p.skills).damage).toBeCloseTo(1.024)
    expect(skillEffects(p.skills).maxHp).toBe(3)
    const spent = skillsSpent(p.skills)
    expect(spent).toBe(SKILLS.heavy.cost * 2 + SKILLS.hardy.cost)
    const refunded = respecSkills(p)
    expect(refunded.bank).toBe(p.bank + spent)
    expect(refunded.skills).toEqual({})
  })

  it('is a three-tree web: every node hangs off earlier nodes of its own tree', () => {
    expect(SKILL_BRANCHES.map((b) => b.id)).toEqual(['conditioning', 'mobility', 'survival'])
    const seen = new Set()
    for (const node of Object.values(SKILLS)) {
      const spot = `${node.branch}:${node.tier}:${node.col}`
      expect(seen.has(spot)).toBe(false)
      seen.add(spot)
      expect(node.tier === 0 || node.needs.length > 0).toBe(true)
      for (const need of node.needs) {
        expect(SKILLS[need].branch).toBe(node.branch)
        expect(SKILLS[need].tier).toBeLessThan(node.tier)
      }
    }
    for (const branch of SKILL_BRANCHES) {
      const nodes = Object.values(SKILLS).filter((n) => n.branch === branch.id)
      expect(nodes.length).toBeGreaterThanOrEqual(15)
      expect(nodes.filter((n) => n.tier === 5)).toHaveLength(1) // one capstone
    }
  })

  it('upgrades more than the old stats: hp, crits, hiding, pets, slots, revives', () => {
    const fx = skillEffects({ hardy: 5, sharp: 5, hunker: 5, beastmaster: 5, mule: 3, bandolier: 2, friend: 3, determined: 1 })
    expect(fx.maxHp).toBe(15)
    expect(fx.crit).toBeCloseTo(0.04)
    expect(fx.hideTime).toBe(5)
    expect(fx.petDamage).toBeCloseTo(1.5)
    expect([fx.slotsPowerups, fx.slotsAbilities, fx.slotsPets]).toEqual([3, 2, 3])
    expect(fx.revive).toBe(1)
  })
})

describe('slot limits', () => {
  it('grow with the slot skills, capped, and reset', () => {
    setSlotBonuses({ powerups: 3, pets: 3, abilities: 2 })
    expect(SLOT_LIMITS).toEqual({ powerups: 6, pets: 1, abilities: 7 })
    setSlotBonuses({ powerups: 99, pets: 99, abilities: 99 })
    expect(SLOT_LIMITS).toEqual(MAX_SLOTS)
    setSlotBonuses({})
    expect(SLOT_LIMITS).toEqual(BASE_SLOTS)
  })

  it('holds at most one pet, whatever the slot bonus', () => {
    let p = addToCollection(createProfile(), ['sparky', 'ember', 'bolt'])
    setSlotBonuses({ pets: 5 })
    for (const id of ['sparky', 'ember', 'bolt']) p = toggleLoadoutPet(p, id).profile
    expect(activeLoadoutPets(p)).toHaveLength(1)
    setSlotBonuses({})
    expect(MAX_PETS).toBe(1)
  })
})

describe('power-up upgrades', () => {
  it('strengthens a perk with each level', () => {
    const base = powerupEffects(['heavy'])
    const lvl3 = powerupEffects(['heavy'], { heavy: 3 })
    expect(lvl3.damage).toBeGreaterThan(base.damage)
    expect(powerupEffects(['thick'], { thick: 3 }).damageTaken).toBeLessThan(powerupEffects(['thick']).damageTaken)
    expect(powerupEffects(['thirst'], { thirst: 2 }).killHeal).toBeGreaterThan(4)
  })

  it('costs banked crystals', () => {
    const p = { ...createProfile(), bank: 100 }
    const bought = buyPowerupLevel(p, 'heavy')
    expect(bought.ok).toBe(true)
    expect(bought.profile.powerups.heavy).toBe(2)
    expect(bought.profile.bank).toBeLessThan(100)
    expect(buyPowerupLevel({ ...p, bank: 0 }, 'heavy').ok).toBe(false)
  })

  it('combines with skills without dropping below the floors', () => {
    const fx = combineEffects(powerupEffects(['thick', 'iron', 'thirst'], { thick: 5, iron: 5 }), skillEffects({ thick: 5, fortress: 4, nerves: 5 }))
    expect(fx.damageTaken).toBeGreaterThanOrEqual(0.3)
    expect(fx.killHeal).toBeGreaterThan(0)
  })
})

describe('normalizeProfile', () => {
  it('survives garbage', () => {
    expect(normalizeProfile(null)).toEqual(createProfile())
    const p = normalizeProfile({ version: 2, bank: '12abc', collection: ['sparky', 'nope'], skills: { heavy: 99, zzz: 4 }, powerups: { heavy: 99 }, loadouts: [{ pets: ['sparky', 'ember'] }], activeLoadout: 7 })
    expect(p.bank).toBe(0)
    expect(p.collection).toEqual(['sparky'])
    expect(p.skills).toEqual({ heavy: SKILLS.heavy.max })
    expect(p.powerups.heavy).toBe(5)
    expect(p.loadouts[0].pets).toEqual(['sparky'])
    expect(p.activeLoadout).toBe(0)
  })

  it('refunds what a save from the first skill tree spent', () => {
    const p = normalizeProfile({ bank: 10, skills: { sharp: 2, tough: 1 } })
    expect(p.skills).toEqual({})
    expect(p.bank).toBe(10 + (20 + 40) + 20)
  })
})
