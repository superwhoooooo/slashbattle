// The Wilds journal: what you have found out there, kept on this device across runs (localStorage
// `slashbattle:journal`, one of the save keys). Landmarks discovered, biomes walked, a bestiary of every creature
// felled, lanterns lit, races run (best times), treasures dug, events survived and shrines visited, plus
// MILESTONES: long-term goals that each pay once (crystals, and some a piece of gear you lack). Pure.
import { ABILITIES, PETS, WEAPONS } from './items.js'
import { isDragon } from './dragons.js'
import { bossById } from './bosses.js'
import { CRAZY_ENEMIES } from './crazyEnemies.js'
import { hashString } from './wildsSpots.js'

export const JOURNAL_KEY = 'slashbattle:journal'
export const BESTIARY_FIRST_REWARD = 8 // crystals for the first of a kind you ever fell

export function createJournal() {
  return { landmarks: [], biomes: [], bestiary: {}, lanterns: [], races: {}, treasures: 0, events: 0, shrines: 0, claimed: [], towers: [], isles: [], relics: [], chasms: [], depthRelics: [], fixes: {}, caves: [] }
}

const strings = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])
const count = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)
const numberMap = (v, ok) => {
  const out = {}
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, n] of Object.entries(v)) if (ok(n)) out[k] = n
  return out
}

// The Skylift towers' repair jobs (logic/towerQuests.js): { [towerId]: { stage, n, cells } }, junk dropped.
const STAGES = ['open', 'accepted', 'done']
function fixesOf(v) {
  const out = {}
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [id, f] of Object.entries(v)) {
      if (!f || typeof f !== 'object') continue
      out[id] = { stage: STAGES.includes(f.stage) ? f.stage : 'open', n: count(f.n), cells: strings(f.cells) }
    }
  }
  return out
}

// Reads a saved journal back (anything missing or damaged becomes empty).
export function parseJournal(text) {
  let data = null
  try {
    data = typeof text === 'string' ? JSON.parse(text) : null
  } catch {
    data = null
  }
  const j = createJournal()
  if (!data || typeof data !== 'object') return j
  return {
    landmarks: strings(data.landmarks),
    biomes: strings(data.biomes),
    bestiary: numberMap(data.bestiary, (n) => Number.isFinite(n) && n > 0),
    lanterns: strings(data.lanterns),
    races: numberMap(data.races, (n) => Number.isFinite(n) && n > 0),
    treasures: count(data.treasures),
    events: count(data.events),
    shrines: count(data.shrines),
    claimed: strings(data.claimed),
    towers: strings(data.towers),
    isles: strings(data.isles),
    relics: strings(data.relics),
    chasms: strings(data.chasms),
    depthRelics: strings(data.depthRelics),
    fixes: fixesOf(data.fixes),
    caves: strings(data.caves),
  }
}
export const serializeJournal = (j) => JSON.stringify(j)

const addTo = (list, id) => (list.includes(id) ? list : [...list, id])

// Each note returns { journal, first } (first: this was new to the journal).
export function noteLandmark(j, id) {
  return { journal: { ...j, landmarks: addTo(j.landmarks, id) }, first: !j.landmarks.includes(id) }
}
export function noteBiome(j, id) {
  return { journal: { ...j, biomes: addTo(j.biomes, id) }, first: !j.biomes.includes(id) }
}
export function noteLantern(j, id) {
  return { journal: { ...j, lanterns: addTo(j.lanterns, id) }, first: !j.lanterns.includes(id) }
}
export function noteKill(j, type) {
  const before = j.bestiary[type] ?? 0
  return { journal: { ...j, bestiary: { ...j.bestiary, [type]: before + 1 } }, first: before === 0 }
}
// A race finish: { journal, first (never finished before), best (a new best time) }.
export function noteRace(j, courseId, time) {
  const prev = j.races[courseId]
  const best = !prev || time < prev
  return { journal: best ? { ...j, races: { ...j.races, [courseId]: Math.round(time * 10) / 10 } } : j, first: !prev, best }
}
// Skylift towers ridden, sky isles set foot on, Nimbus Crowns (Sky Relics) taken.
// A cave entered: { journal, first }.
export function noteCave(j, id) {
  return { journal: { ...j, caves: addTo(j.caves, id) }, first: !j.caves.includes(id) }
}
export function noteTower(j, id) {
  return { journal: { ...j, towers: addTo(j.towers, id) }, first: !j.towers.includes(id) }
}
export function noteIsle(j, id) {
  return { journal: { ...j, isles: addTo(j.isles, id) }, first: !j.isles.includes(id) }
}
export function noteRelic(j, id) {
  return { journal: { ...j, relics: addTo(j.relics, id) }, first: !j.relics.includes(id) }
}
// A chasm fallen into (the first time ever pays a little), and an Umbral Heart claimed in the Depths.
export function noteChasm(j, id) {
  return { journal: { ...j, chasms: addTo(j.chasms, id) }, first: !j.chasms.includes(id) }
}
export function noteDepthRelic(j, id) {
  return { journal: { ...j, depthRelics: addTo(j.depthRelics, id) }, first: !j.depthRelics.includes(id) }
}
export const noteTreasure = (j) => ({ ...j, treasures: j.treasures + 1 })
export const noteEvent = (j) => ({ ...j, events: j.events + 1 })
export const noteShrine = (j) => ({ ...j, shrines: j.shrines + 1 })

// ---- milestones ---------------------------------------------------------------------------------

// stat: which journal number it counts; reward: crystals plus maybe a piece of gear ('weapon' | 'ability' | 'pet').
export const MILESTONES = [
  { id: 'sights5', title: 'Sightseer', desc: 'Discover 5 landmarks', stat: 'landmarks', need: 5, crystals: 60, loot: 'weapon' },
  { id: 'sights15', title: 'Cartographer', desc: 'Discover 15 landmarks', stat: 'landmarks', need: 15, crystals: 160, loot: 'ability' },
  { id: 'sights30', title: 'Legend of the Wilds', desc: 'Discover 30 landmarks', stat: 'landmarks', need: 30, crystals: 400, loot: 'pet' },
  { id: 'biomes5', title: 'Wayfarer', desc: 'Walk into 5 biomes', stat: 'biomes', need: 5, crystals: 50 },
  { id: 'biomes11', title: 'World Walker', desc: 'Walk into all 11 biomes', stat: 'biomes', need: 11, crystals: 250, loot: 'weapon' },
  { id: 'beasts10', title: 'Naturalist', desc: 'Fell 10 kinds of creature', stat: 'bestiary', need: 10, crystals: 70 },
  { id: 'beasts25', title: 'Monster Scholar', desc: 'Fell 25 kinds of creature', stat: 'bestiary', need: 25, crystals: 200, loot: 'ability' },
  { id: 'lanterns10', title: 'Lamplighter', desc: 'Light 10 lost lanterns', stat: 'lanterns', need: 10, crystals: 40 },
  { id: 'lanterns50', title: 'Keeper of Lights', desc: 'Light 50 lost lanterns', stat: 'lanterns', need: 50, crystals: 180, loot: 'weapon' },
  { id: 'lanterns120', title: 'The Long Night Ends', desc: 'Light 120 lost lanterns', stat: 'lanterns', need: 120, crystals: 450, loot: 'pet' },
  { id: 'races1', title: 'First Flight', desc: 'Finish a sky-ring race', stat: 'races', need: 1, crystals: 40 },
  { id: 'races5', title: 'Sky Racer', desc: 'Finish 5 different races', stat: 'races', need: 5, crystals: 220, loot: 'ability' },
  { id: 'treasure1', title: 'X Marks the Spot', desc: 'Dig up a buried treasure', stat: 'treasures', need: 1, crystals: 40 },
  { id: 'treasure5', title: 'Treasure Hunter', desc: 'Dig up 5 buried treasures', stat: 'treasures', need: 5, crystals: 200, loot: 'weapon' },
  { id: 'events3', title: 'Trouble Magnet', desc: 'See off 3 roaming events', stat: 'events', need: 3, crystals: 60 },
  { id: 'events12', title: 'Storm Chaser', desc: 'See off 12 roaming events', stat: 'events', need: 12, crystals: 240, loot: 'pet' },
  { id: 'shrines5', title: 'Pilgrim', desc: 'Take 5 wayshrine boons', stat: 'shrines', need: 5, crystals: 50 },
  { id: 'towers1', title: 'Liftoff', desc: 'Ride a Skylift tower into the sky', stat: 'towers', need: 1, crystals: 40 },
  { id: 'towers5', title: 'Tower Hopper', desc: 'Ride 5 different Skylift towers', stat: 'towers', need: 5, crystals: 180, loot: 'ability' },
  { id: 'isles10', title: 'Head in the Clouds', desc: 'Set foot on 10 sky isles', stat: 'isles', need: 10, crystals: 90 },
  { id: 'isles40', title: 'Sky Sailor', desc: 'Set foot on 40 sky isles', stat: 'isles', need: 40, crystals: 300, loot: 'weapon' },
  { id: 'relics3', title: 'Crown Seeker', desc: 'Claim 3 Nimbus Crowns', stat: 'relics', need: 3, crystals: 150 },
  { id: 'chasms1', title: 'Into the Dark', desc: 'Fall into a chasm', stat: 'chasms', need: 1, crystals: 50 },
  { id: 'chasms6', title: 'Spelunker', desc: 'Drop into 6 different chasms', stat: 'chasms', need: 6, crystals: 220, loot: 'ability' },
  { id: 'hearts3', title: 'Heart Hunter', desc: 'Claim 3 Umbral Hearts in the Depths', stat: 'depthRelics', need: 3, crystals: 200 },
  { id: 'hearts5', title: 'Lord of the Depths', desc: 'Claim every Umbral Heart (and something below will answer)', stat: 'depthRelics', need: 5, crystals: 500, loot: 'weapon' },
  { id: 'relics9', title: 'Keeper of the Sky', desc: 'Claim every Nimbus Crown (and something in the sky will notice)', stat: 'relics', need: 9, crystals: 500, loot: 'pet' },
]

// The number a milestone counts, from the journal.
export function journalStat(j, stat) {
  if (stat === 'landmarks' || stat === 'biomes' || stat === 'lanterns' || stat === 'towers' || stat === 'isles' || stat === 'relics' || stat === 'chasms' || stat === 'depthRelics') return (j[stat] ?? []).length
  if (stat === 'bestiary' || stat === 'races') return Object.keys(j[stat]).length
  return j[stat] ?? 0
}

export const milestoneProgress = (j, m) => Math.min(m.need, journalStat(j, m.stat))
// Milestones reached but not yet paid.
export const readyMilestones = (j) => MILESTONES.filter((m) => !j.claimed.includes(m.id) && journalStat(j, m.stat) >= m.need)
export const claimMilestone = (j, id) => (j.claimed.includes(id) ? j : { ...j, claimed: [...j.claimed, id] })

// A piece of gear of `kind` you don't own yet (never a dragon), chosen stably from `seed`; null if none is left.
export function pickUnowned(kind, inventory, seed = '') {
  const table = kind === 'weapon' ? WEAPONS : kind === 'ability' ? ABILITIES : kind === 'pet' ? PETS : null
  if (!table) return null
  const owned = kind === 'weapon' ? inventory.weapons : kind === 'ability' ? inventory.abilities : inventory.pets
  const options = Object.keys(table).filter((id) => !owned.includes(id) && !(kind === 'pet' && isDragon(PETS[id])))
  return options.length ? options[hashString(`${seed}#${kind}`) % options.length] : null
}

// ---- names --------------------------------------------------------------------------------------

const NAME_OVERRIDES = { bandit: 'Bellhop Bandit', paparazzo: 'Paparazzo', gopher: 'Golf Gopher', splitling: 'Splitling', urchin: 'Urchin', eel: 'Eel', angler: 'Angler', skyfin: 'Skyfin' }
const CRAZY_NAMES = Object.fromEntries(CRAZY_ENEMIES.map((e) => [e.id, e.name]))
const titleCase = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())

// A creature's display name for the bestiary (bosses by their title-cased name).
export function creatureName(type) {
  if (NAME_OVERRIDES[type]) return NAME_OVERRIDES[type]
  if (CRAZY_NAMES[type]) return CRAZY_NAMES[type]
  const boss = bossById(type)
  if (boss) return titleCase(boss.name)
  return type.charAt(0).toUpperCase() + type.slice(1)
}
export const isBossType = (type) => Boolean(bossById(type))
