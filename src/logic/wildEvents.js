// Roaming events in the Wilds: every minute or two, out on open ground, something happens around you.
//   horde     - AMBUSH! A pack of the local monsters closes in, in two rushes; beat them all in time for a bounty
//               and a free chest.
//   meteors   - a STARFALL: meteors rain down near you (hurting monsters, not you) and each leaves a star shard
//               worth crystals where it lands.
//   merchant  - a travelling merchant sets up nearby for a while, selling gear you lack, treasure maps, tonics.
//   wanderer  - a WANDERING TITAN: a roaming boss arrives; fell it for a big bounty (it leaves after a while).
// This module is the director (when, and which) plus each event's plan and payout. Pure.
import { ABILITIES, PETS, WEAPONS } from './items.js'
import { isDragon } from './dragons.js'
import { BIOMES, mulberry32 } from './world.js'
import { BOSSES } from './bosses.js'
import { BOON_IDS, BOONS } from './wayshrines.js'
import { hashString, pickWeighted } from './wildsSpots.js'

export const FIRST_EVENT_AT = 50 // seconds into a Wilds run before the first one
export const EVENT_GAP = [75, 130] // seconds between one event ending and the next
export const EVENTS = {
  horde: { name: 'Ambush!', duration: 80, weight: 3 },
  meteors: { name: 'Starfall', duration: 22, weight: 2 },
  merchant: { name: 'Travelling Merchant', duration: 120, weight: 2 },
  wanderer: { name: 'Wandering Titan', duration: 150, weight: 1.2 },
}

export function createEventDirector(now = 0) {
  return { nextAt: now + FIRST_EVENT_AT, active: null, count: 0 }
}

// Which event to start, weighted; the titan is rare close to the Sanctum.
export function pickEventKind(rng, { danger = 0, last = null } = {}) {
  const entries = Object.entries(EVENTS)
    .filter(([kind]) => kind !== last)
    .map(([kind, def]) => [kind, kind === 'wanderer' ? def.weight * (0.3 + danger * 1.6) : def.weight])
  return pickWeighted(rng, entries)
}

// One step. `safe`: you are in the Sanctum or a village (nothing starts there); `busy`: a race or a dialogue is
// on. Returns { state, start } where start is the kind to begin now, or null.
export function stepEventDirector(state, { now, safe = false, busy = false, danger = 0, rng = Math.random }) {
  if (state.active || now < state.nextAt) return { state, start: null }
  if (safe || busy) return { state: { ...state, nextAt: now + 6 }, start: null } // try again in a moment
  const kind = pickEventKind(rng, { danger, last: state.lastKind })
  return { state: { ...state, active: { kind, startedAt: now, endsAt: now + EVENTS[kind].duration }, lastKind: kind, count: state.count + 1 }, start: kind }
}

// Ends the running event; the next one comes EVENT_GAP later.
export function endEvent(state, now, rng = Math.random) {
  return { ...state, active: null, nextAt: now + EVENT_GAP[0] + rng() * (EVENT_GAP[1] - EVENT_GAP[0]) }
}

// ---- horde ------------------------------------------------------------------------------------

// Two rushes of the local biome's monsters (only ones dangerous enough for this depth), a time limit, a bounty.
export function hordePlan(rng, biomeId, danger) {
  const table = (BIOMES[biomeId]?.monsters ?? BIOMES.whisperwood.monsters).filter((m) => m[2] <= danger + 0.05)
  const entries = (table.length ? table : BIOMES.whisperwood.monsters.slice(0, 2)).map((m) => [m[0], m[1]])
  const size = Math.round(4 + danger * 5)
  const rush = () => Array.from({ length: size }, () => pickWeighted(rng, entries))
  return { waves: [rush(), rush()], eliteChance: 0.1 + danger * 0.25, timeLimit: EVENTS.horde.duration, reward: Math.round(45 + danger * 110) }
}

// ---- starfall ---------------------------------------------------------------------------------

export const STAR_SHARD_VALUE = 6 // crystals per shard
// When and where each meteor lands: [{ at, x, z }] offsets around the centre, one every ~1.3s.
export function meteorPlan(rng, center, count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const a = rng() * Math.PI * 2
    const d = 5 + Math.sqrt(rng()) * 22
    return { at: 1.2 + i * 1.35 + rng() * 0.4, x: center.x + Math.cos(a) * d, z: center.z + Math.sin(a) * d }
  })
}

// ---- merchant ---------------------------------------------------------------------------------

export const MERCHANT_NAMES = ['Pell the Peddler', 'Old Marigold', 'Quill Wanderfoot', 'Bartholomew Bindle', 'Saffi of the Roads']
export const merchantName = (seed) => MERCHANT_NAMES[hashString(`merchant#${seed}`) % MERCHANT_NAMES.length]

// What the merchant has today: up to 4 goods, [{ id, kind, itemId?, label, price }]. kinds: 'weapon' | 'ability' |
// 'pet' (something you lack), 'map' (a treasure map), 'boon' (a tonic: a wayshrine boon), 'heal'.
export function merchantStock(seed, inventory, danger = 0) {
  const rng = mulberry32(hashString(`stock#${seed}`))
  const pick = (list) => (list.length ? list[Math.floor(rng() * list.length)] : null)
  const scale = 1 + danger * 0.8
  const goods = []
  const gear = [
    ['weapon', pick(Object.keys(WEAPONS).filter((id) => !inventory.weapons.includes(id)))],
    ['ability', pick(Object.keys(ABILITIES).filter((id) => !inventory.abilities.includes(id)))],
    ['pet', pick(Object.keys(PETS).filter((id) => !inventory.pets.includes(id) && !isDragon(PETS[id])))],
  ].filter(([, id]) => id)
  // Two pieces of gear (when there is any left to sell), then a map, then a tonic or a heal.
  for (let i = 0; i < 2 && gear.length; i++) {
    const [kind, itemId] = gear.splice(Math.floor(rng() * gear.length), 1)[0]
    const table = kind === 'weapon' ? WEAPONS : kind === 'ability' ? ABILITIES : PETS
    goods.push({ id: `${kind}:${itemId}`, kind, itemId, label: table[itemId].name, price: Math.round((kind === 'pet' ? 70 : 55) * scale) })
  }
  goods.push({ id: 'map', kind: 'map', label: 'Treasure map', price: Math.round(30 * scale) })
  if (rng() < 0.6) {
    const boon = BOON_IDS[Math.floor(rng() * BOON_IDS.length)]
    goods.push({ id: `boon:${boon}`, kind: 'boon', itemId: boon, label: `Tonic of ${BOONS[boon].name}`, price: Math.round(22 * scale) })
  } else goods.push({ id: 'heal', kind: 'heal', label: 'Hearty stew (full heal)', price: Math.round(15 * scale) })
  return goods
}

// ---- wandering titan --------------------------------------------------------------------------

// Which boss walks the land today (any of the land bosses), and its bounty.
export function wandererPlan(rng, danger) {
  const boss = BOSSES[Math.floor(rng() * BOSSES.length)]
  return { type: boss.id, name: boss.name, reward: Math.round(120 + danger * 180), fights: 3 + Math.round(danger * 4) }
}
