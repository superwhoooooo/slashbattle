// Pure, Three-free player profile: what persists between runs on this device.
// Banked crystals (the T key stocks a run's crystals here), the pets you've
// ever found (the collection), three loadouts of starting pets, and the levels
// bought with banked crystals (skill tree + power-up upgrades). Every function
// returns a NEW profile. src/profile.js saves it in localStorage.
import { BREATHS, SCALES, isDragon, unlockedBreaths, unlockedSkins } from './dragons.js'
import { DEFAULT_HERO, normalizeHeroFields } from './heroes.js'
import { MAX_SLOTS, PETS, WEAPONS, PET_MAX_LEVEL, POWERUPS, SLOT_LIMITS, petLevel, petUpgradeCost } from './items.js'
import { AMMO, AMMO_MAX_LEVEL, DEFAULT_AMMO, DEFAULT_SCOPE, RIFLE_MAX_LEVEL, SCOPES, ammoLevel, ammoUpgradeCost, cycleIn, isAmmoUnlocked, isScopeUnlocked, rifleLevel, rifleUpgradeCost, unlockedAmmo, unlockedScopes } from './rifles.js'
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
    pets: {}, // pet id -> level (absent = 1)
    unlocked: { scopes: [], ammo: [] }, // scope / ammo ids found in chests
    rifleLevels: {}, // rifle id -> level (absent = 1)
    ammoLevels: {}, // ammo id -> level (absent = 1)
    rifles: {}, // rifle id -> { scope, ammo } (absent = iron sights, standard ammo)
    hero: DEFAULT_HERO, // logic/heroes.js: the hero you play as
    heroesOwned: [], // heroes bought (the Guest is always owned)
    heroSkins: {}, // hero id -> skin id worn (absent = its first skin)
    skinsOwned: [], // 'heroId:skinId' keys bought
  }
}

const count = (value) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0)

// Cleans whatever came out of storage into a valid profile (unknown ids, bad
// numbers and oversized loadouts are dropped), so a corrupt save can't crash the game.
export function normalizeProfile(raw) {
  const base = createProfile()
  if (!raw || typeof raw !== 'object') return base
  const collection = Array.isArray(raw.collection) ? [...new Set(raw.collection.filter((id) => PETS[id] && !isDragon(PETS[id])))] : [] // dragons are per-run finds, never collected
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
  const pets = {}
  for (const id of Object.keys(PETS)) {
    const level = Math.min(count(raw.pets?.[id]), PET_MAX_LEVEL)
    if (level > 1) pets[id] = level
  }
  // Rifle attachments: only non-default, known picks are kept.
  const rifles = {}
  for (const id of Object.keys(WEAPONS)) {
    if (!WEAPONS[id].rifle) continue
    const saved = raw.rifles?.[id]
    const scope = SCOPES[saved?.scope] ? saved.scope : DEFAULT_SCOPE
    const ammo = AMMO[saved?.ammo] ? saved.ammo : DEFAULT_AMMO
    if (scope !== DEFAULT_SCOPE || ammo !== DEFAULT_AMMO) rifles[id] = { scope, ammo }
  }
  const rifleLevels = {}
  for (const id of Object.keys(WEAPONS)) {
    const level = Math.min(count(raw.rifleLevels?.[id]), RIFLE_MAX_LEVEL)
    if (WEAPONS[id].rifle && level > 1) rifleLevels[id] = level
  }
  const ammoLevels = {}
  for (const id of Object.keys(AMMO)) {
    const level = Math.min(count(raw.ammoLevels?.[id]), AMMO_MAX_LEVEL)
    if (level > 1) ammoLevels[id] = level
  }
  return {
    version: PROFILE_VERSION,
    bank: count(raw.bank) + (oldTree ? legacyRefund(raw.skills) : 0),
    collection,
    loadouts,
    activeLoadout: Number.isInteger(raw.activeLoadout) && raw.activeLoadout >= 0 && raw.activeLoadout < LOADOUT_SLOTS ? raw.activeLoadout : 0,
    skills,
    powerups,
    pets,
    rifles,
    unlocked: {
      scopes: Array.isArray(raw.unlocked?.scopes) ? [...new Set(raw.unlocked.scopes.filter((id) => SCOPES[id] && id !== DEFAULT_SCOPE))] : [],
      ammo: Array.isArray(raw.unlocked?.ammo) ? [...new Set(raw.unlocked.ammo.filter((id) => AMMO[id] && id !== DEFAULT_AMMO))] : [],
    },
    rifleLevels,
    ammoLevels,
    ...normalizeHeroFields(raw),
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

// Buys the next level of a collected pet: { profile, ok, reason }.
export function buyPetLevel(profile, id) {
  if (!PETS[id]) return { profile, ok: false, reason: 'Unknown pet' }
  if (!profile.collection.includes(id)) return { profile, ok: false, reason: 'Find this pet first' }
  const level = petLevel(profile.pets, id)
  const cost = petUpgradeCost(level)
  if (cost === null) return { profile, ok: false, reason: 'Maxed out' }
  if (profile.bank < cost) return { profile, ok: false, reason: 'Not enough banked crystals' }
  return { profile: { ...profile, bank: profile.bank - cost, pets: { ...profile.pets, [id]: level + 1 } }, ok: true, reason: null }
}

// Sets (or steps, with `value` = +1 / -1 and `step: true`) a rifle's scope or ammo. Only unlocked
// ones can be picked; stepping cycles through the unlocked ones.
export function setRifleOption(profile, rifleId, kind, value, step = false) {
  if (!WEAPONS[rifleId]?.rifle || (kind !== 'scope' && kind !== 'ammo')) return profile
  const current = profile.rifles?.[rifleId] ?? { scope: DEFAULT_SCOPE, ammo: DEFAULT_AMMO }
  const ids = kind === 'scope' ? unlockedScopes(profile.unlocked) : unlockedAmmo(profile.unlocked)
  const next = step ? cycleIn(ids, current[kind], value) : value
  if (!ids.includes(next)) return profile
  return { ...profile, rifles: { ...profile.rifles, [rifleId]: { ...current, [kind]: next } } }
}

// Dragon state is per RUN, not part of the saved profile: `{ unlocked: { skins, breaths }, dragons: { petId: { scale, breath } } }`
// lives on the game (main.js's dragonState) and is lost with the run. These helpers work on that shape.
// Sets (or steps) a dragon's skin ('scale') or breath. Only unlocked ones can be picked (a dragon's own
// starting skin and breath always can); stepping cycles through the unlocked ones.
export function setDragonOption(state, petId, kind, value, step = false) {
  const def = PETS[petId]
  if (def?.kind !== 'breath' || (kind !== 'scale' && kind !== 'breath')) return state
  const ids = kind === 'scale' ? unlockedSkins(state.unlocked, def) : unlockedBreaths(state.unlocked, def)
  const current = state.dragons?.[petId]?.[kind] ?? (kind === 'scale' ? def.defaultScale : def.defaultBreath)
  const next = step ? ids[(Math.max(0, ids.indexOf(current)) + (value >= 0 ? 1 : ids.length - 1)) % ids.length] : value
  if (!ids.includes(next)) return state
  return { ...state, dragons: { ...state.dragons, [petId]: { ...state.dragons?.[petId], [kind]: next } } }
}

// Adds a found dragon skin or breath to the unlocked set. `kind` is 'skin' or 'breath'.
export function unlockDragonPart(state, kind, id) {
  const key = kind === 'skin' ? 'skins' : 'breaths'
  if (!(kind === 'skin' ? SCALES : BREATHS)[id]) return state
  if (((kind === 'skin' ? state.unlocked?.skins : state.unlocked?.breaths) ?? []).includes(id)) return state
  return { ...state, unlocked: { ...state.unlocked, [key]: [...(state.unlocked?.[key] ?? []), id] } }
}

// Adds a found scope / ammo to the unlocked set. `kind` is 'scope' or 'ammo'.
export function unlockAttachment(profile, kind, id) {
  const key = kind === 'scope' ? 'scopes' : 'ammo'
  if (!(kind === 'scope' ? SCOPES : AMMO)[id]) return profile
  if ((kind === 'scope' ? isScopeUnlocked : isAmmoUnlocked)(profile.unlocked, id)) return profile
  return { ...profile, unlocked: { ...profile.unlocked, [key]: [...(profile.unlocked?.[key] ?? []), id] } }
}

// Buys the next level of a rifle: { profile, ok, reason }.
export function buyRifleLevel(profile, id) {
  if (!WEAPONS[id]?.rifle) return { profile, ok: false, reason: 'Unknown rifle' }
  const level = rifleLevel(profile.rifleLevels, id)
  const cost = rifleUpgradeCost(level)
  if (cost === null) return { profile, ok: false, reason: 'Maxed out' }
  if (profile.bank < cost) return { profile, ok: false, reason: 'Not enough banked crystals' }
  return { profile: { ...profile, bank: profile.bank - cost, rifleLevels: { ...profile.rifleLevels, [id]: level + 1 } }, ok: true, reason: null }
}

// Buys the next level of an unlocked ammo type: { profile, ok, reason }.
export function buyAmmoLevel(profile, id) {
  if (!AMMO[id]) return { profile, ok: false, reason: 'Unknown ammo' }
  if (!isAmmoUnlocked(profile.unlocked, id)) return { profile, ok: false, reason: 'Find this ammo in a chest first' }
  const level = ammoLevel(profile.ammoLevels, id)
  const cost = ammoUpgradeCost(level)
  if (cost === null) return { profile, ok: false, reason: 'Maxed out' }
  if (profile.bank < cost) return { profile, ok: false, reason: 'Not enough banked crystals' }
  return { profile: { ...profile, bank: profile.bank - cost, ammoLevels: { ...profile.ammoLevels, [id]: level + 1 } }, ok: true, reason: null }
}

export { skillLevel }

export { buyHero, buySkin, selectHero } from './heroes.js'
