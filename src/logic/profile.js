// Pure, Three-free player profile: what persists between runs on this device.
// Banked crystals (the T key stocks a run's crystals here), the pets you've
// ever found (the collection), three loadouts of starting pets, and the levels
// bought with banked crystals (skill tree + power-up upgrades). Every function
// returns a NEW profile. src/profile.js saves it in localStorage.
import { MAX_SLOTS, PETS, POWERUPS, SLOT_LIMITS } from './items.js'
import { POWERUP_MAX_LEVEL, SKILLS, powerupLevel, powerupUpgradeCost, skillLevel, skillState, skillsSpent } from './skills.js'

// The first version of the skill tree (before the ARC Raiders-style one): its nodes' base cost,
// so anything spent there can be refunded into the bank instead of vanishing.
const LEGACY_SKILL_COSTS = { sharp: 20, hands: 25, reflex: 30, vampire: 40, berserk: 120, tough: 20, mend: 25, fortify: 35, hide: 50, unbreak: 120, fleet: 20, sense: 25, pull: 30, cool: 35, hunter: 120 }
function legacyRefund(rawSkills) {
  let refund = 0
  for (const [id, base] of Object.entries(LEGACY_SKILL_COSTS)) {
    const levels = count(rawSkills?.[id])
    for (let level = 0; level < levels && level < 5; level++) refund += base * (level + 1)
  }
  return refund
}

export const LOADOUT_SLOTS = 3
const PROFILE_VERSION = 2 // 2 = the ARC Raiders-style skill tree

export function createProfile() {
  return {
    version: PROFILE_VERSION,
    bank: 0,
    collection: [], // pet ids ever found
    loadouts: Array.from({ length: LOADOUT_SLOTS }, (_, i) => ({ name: `Loadout ${i + 1}`, pets: [] })),
    activeLoadout: 0,
    skills: {}, // skill id -> level
    powerups: {}, // power-up id -> level (absent = 1)
  }
}

const count = (value) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0)

// Cleans whatever came out of storage into a valid profile (unknown ids, bad
// numbers and oversized loadouts are dropped), so a corrupt save can't crash the game.
export function normalizeProfile(raw) {
  const base = createProfile()
  if (!raw || typeof raw !== 'object') return base
  const collection = Array.isArray(raw.collection) ? [...new Set(raw.collection.filter((id) => PETS[id]))] : []
  const loadouts = base.loadouts.map((fallback, i) => {
    const saved = Array.isArray(raw.loadouts) ? raw.loadouts[i] : null
    const pets = Array.isArray(saved?.pets) ? [...new Set(saved.pets.filter((id) => collection.includes(id)))].slice(0, MAX_SLOTS.pets) : []
    return { name: typeof saved?.name === 'string' && saved.name ? saved.name.slice(0, 20) : fallback.name, pets }
  })
  // Saves from the first, simpler tree: refund what was spent there and start the new tree empty.
  const oldTree = raw.version !== PROFILE_VERSION
  const skills = {}
  for (const id of oldTree ? [] : Object.keys(SKILLS)) {
    const level = Math.min(count(raw.skills?.[id]), SKILLS[id].max)
    if (level) skills[id] = level
  }
  const powerups = {}
  for (const id of Object.keys(POWERUPS)) {
    const level = Math.min(count(raw.powerups?.[id]), POWERUP_MAX_LEVEL)
    if (level > 1) powerups[id] = level
  }
  return {
    version: PROFILE_VERSION,
    bank: count(raw.bank) + (oldTree ? legacyRefund(raw.skills) : 0),
    collection,
    loadouts,
    activeLoadout: Number.isInteger(raw.activeLoadout) && raw.activeLoadout >= 0 && raw.activeLoadout < LOADOUT_SLOTS ? raw.activeLoadout : 0,
    skills,
    powerups,
  }
}

// Stocks `amount` crystals into the bank.
export function bankCrystals(profile, amount) {
  const add = count(amount)
  return add === 0 ? profile : { ...profile, bank: profile.bank + add }
}

// Adds newly found pets to the collection (returns the same profile if nothing is new).
export function addToCollection(profile, petIds) {
  const fresh = petIds.filter((id) => PETS[id] && !profile.collection.includes(id))
  return fresh.length === 0 ? profile : { ...profile, collection: [...profile.collection, ...new Set(fresh)] }
}

export function activeLoadoutPets(profile) {
  return profile.loadouts[profile.activeLoadout].pets.slice(0, SLOT_LIMITS.pets)
}

export function setActiveLoadout(profile, index) {
  if (!Number.isInteger(index) || index < 0 || index >= LOADOUT_SLOTS) return profile
  return { ...profile, activeLoadout: index }
}

// Puts a collected pet into the active loadout, or takes it out if it's there.
// { profile, ok, reason }: not collected yet, or the loadout is full.
export function toggleLoadoutPet(profile, petId) {
  if (!profile.collection.includes(petId)) return { profile, ok: false, reason: 'Not collected yet' }
  const slot = profile.loadouts[profile.activeLoadout]
  const has = slot.pets.includes(petId)
  if (!has && slot.pets.length >= SLOT_LIMITS.pets) return { profile, ok: false, reason: `A loadout holds ${SLOT_LIMITS.pets} pets (more slots in the skill tree)` }
  const pets = has ? slot.pets.filter((id) => id !== petId) : [...slot.pets, petId]
  const loadouts = profile.loadouts.map((l, i) => (i === profile.activeLoadout ? { ...l, pets } : l))
  return { profile: { ...profile, loadouts }, ok: true, reason: null }
}

// Buys the next level of a skill: { profile, ok, reason }.
export function buySkill(profile, id) {
  const skill = SKILLS[id]
  if (!skill) return { profile, ok: false, reason: 'Unknown skill' }
  const state = skillState(profile.skills, id)
  if (state.locked) return { profile, ok: false, reason: state.reason }
  if (state.cost === null) return { profile, ok: false, reason: 'Maxed out' }
  if (profile.bank < state.cost) return { profile, ok: false, reason: 'Not enough banked crystals' }
  return { profile: { ...profile, bank: profile.bank - state.cost, skills: { ...profile.skills, [id]: state.level + 1 } }, ok: true, reason: null }
}

// Unlearns every skill and refunds all of it.
export function respecSkills(profile) {
  const refund = skillsSpent(profile.skills)
  return refund === 0 ? profile : { ...profile, bank: profile.bank + refund, skills: {} }
}

// Buys the next upgrade level of a power-up: { profile, ok, reason }.
export function buyPowerupLevel(profile, id) {
  if (!POWERUPS[id]) return { profile, ok: false, reason: 'Unknown power-up' }
  const level = powerupLevel(profile.powerups, id)
  const cost = powerupUpgradeCost(level)
  if (cost === null) return { profile, ok: false, reason: 'Maxed out' }
  if (profile.bank < cost) return { profile, ok: false, reason: 'Not enough banked crystals' }
  return { profile: { ...profile, bank: profile.bank - cost, powerups: { ...profile.powerups, [id]: level + 1 } }, ok: true, reason: null }
}

export { skillLevel }
