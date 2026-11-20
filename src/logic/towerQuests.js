// Broken Skylift towers and the keepers' quests to fix them (pure, seeded; tested in test/towerQuests.test.js).
// Inspired by Tears of the Kingdom's Skyview Towers: some stand ready, but others are out of order for a reason, and
// somebody nearby needs a hand. A broken tower's pad stays jammed (logic/skyIslands.js's stepLaunch skips it) until
// its issue is fixed:
//   camp   a monster camp has taken the lift house: fell every one of them
//   cells  a storm knocked the lift's power cells loose across the meadow: collect them all
//   parts  the lift's gears have seized: the keeper needs replacement parts (crystals)
// Progress is kept per tower in the journal (`fixes`): { stage: 'open' | 'accepted' | 'done', n, cells }.
import { BIOMES, WORLD_SEED, biomeAt, heightAt, lakeAt, mulberry32 } from './world.js'
import { TOWER_RING, skyTowers } from './skyIslands.js'

export const FIX_REWARD = 140 // crystals for fixing a tower
export const PARTS_COST = 90 // crystals the keeper needs for new gears
export const CAMP_SIZE = 6
export const CELL_COUNT = 3
export const CELL_PICKUP_RADIUS = 2.2
export const KEEPER_DISTANCE = 11.5 // the keeper's post, beside the shelter
const FREE_TOWERS = new Set([0, 4, 7]) // these Skylifts have no trouble

export const ISSUES = {
  camp: {
    kind: 'camp', title: 'Lift House Overrun', short: 'Clear the camp',
    tale: 'A rowdy camp of monsters moved into the lift house and hid the lever somewhere in the weeds. I would not step on that pad with them around. Chase every last one of them off and I will have it running in no time.',
  },
  cells: {
    kind: 'cells', title: 'Scattered Power Cells', short: 'Find the power cells',
    tale: 'The storm last night shook the lift\'s three power cells loose, and they rolled off across the meadow. You can spot them by their glow. Bring them close and the lift will drink them straight up.',
  },
  parts: {
    kind: 'parts', title: 'Seized Gears', short: 'Pay for new gears',
    tale: 'The lift\'s gears have seized solid. I know exactly what it needs, but replacement gears are not free. Cover the parts and I will get this tower turning again, and you can have the first ride.',
  },
}

const KEEPER_NAMES = ['Warden Odell', 'Keeper Ysolde', 'Old Marrow', 'Warden Pim', 'Keeper Tamsin', 'Warden Brisk']
const KEEPER_COLORS = [0xb8e0ff, 0xffd9a8, 0xd2f5c4, 0xf2c4ff, 0xffc9c9, 0xc4f0f0]

// A tower's issue (or null if its Skylift works): { kind, ...ISSUES[kind], keeper, color }.
export function towerIssue(tower) {
  if (!tower || FREE_TOWERS.has(tower.index)) return null
  const order = skyTowers().filter((t) => !FREE_TOWERS.has(t.index)).findIndex((t) => t.id === tower.id)
  const kind = ['camp', 'cells', 'parts', 'cells', 'camp', 'parts'][Math.max(0, order) % 6]
  return { ...ISSUES[kind], keeper: KEEPER_NAMES[tower.index % KEEPER_NAMES.length], color: KEEPER_COLORS[tower.index % KEEPER_COLORS.length] }
}

// The keeper's post: beside the tower's shelter.
export function keeperSpot(tower) {
  const a = tower.dir + Math.PI * 0.5
  return { x: tower.x + Math.cos(a) * KEEPER_DISTANCE, z: tower.z + Math.sin(a) * KEEPER_DISTANCE }
}

// Where the power cells lie: three spots on dry land 20-42 from the tower, spread round it. Stable ids.
export function issueCells(tower) {
  const rand = mulberry32(WORLD_SEED + 9100 + tower.index * 71)
  const out = []
  const base = rand() * Math.PI * 2
  for (let i = 0; i < CELL_COUNT; i++) {
    for (let tries = 0; tries < 40; tries++) {
      const a = base + (i / CELL_COUNT) * Math.PI * 2 + (rand() - 0.5) * 0.7
      const d = 20 + rand() * 22
      const x = tower.x + Math.cos(a) * d
      const z = tower.z + Math.sin(a) * d
      if (lakeAt(x, z, 3) && tries < 39) continue
      out.push({ id: `${tower.id}:cell${i}`, x, z, y: heightAt(x, z) })
      break
    }
  }
  return out
}

// Where the camp's monsters stand: a loose ring 13-22 out. `type` comes from the local biome's monster table.
export function issueCamp(tower) {
  const rand = mulberry32(WORLD_SEED + 9300 + tower.index * 53)
  const out = []
  const base = rand() * Math.PI * 2
  for (let i = 0; i < CAMP_SIZE; i++) {
    const a = base + (i / CAMP_SIZE) * Math.PI * 2 + (rand() - 0.5) * 0.5
    const d = 13 + rand() * 9
    const x = tower.x + Math.cos(a) * d
    const z = tower.z + Math.sin(a) * d
    const table = (BIOMES[biomeAt(x, z)] ?? BIOMES.sanctum).monsters.filter((m) => (m[2] ?? 0) <= 0.7)
    const pool = table.length ? table : BIOMES.sanctum.monsters
    let t = rand() * pool.reduce((s, e) => s + e[1], 0)
    let type = pool[0][0]
    for (const e of pool) {
      t -= e[1]
      if (t <= 0) {
        type = e[0]
        break
      }
    }
    out.push({ id: `${tower.id}:camp${i}`, type, x, z, elite: i === 0 })
  }
  return out
}

// ---- progress (the journal's `fixes`) ----------------------------------------------------------------

export const fixOf = (fixes, id) => fixes?.[id] ?? { stage: 'open', n: 0, cells: [] }
export const isTowerFixed = (fixes, tower) => !towerIssue(tower) || fixOf(fixes, tower.id).stage === 'done'
// The tower ids whose pads are jammed.
export const jammedTowers = (fixes) => new Set(skyTowers().filter((t) => !isTowerFixed(fixes, t)).map((t) => t.id))

const put = (fixes, id, next) => ({ ...fixes, [id]: { ...fixOf(fixes, id), ...next } })
export const acceptFix = (fixes, id) => (fixOf(fixes, id).stage === 'open' ? put(fixes, id, { stage: 'accepted' }) : fixes)
export function finishFix(fixes, id) {
  return put(fixes, id, { stage: 'done' })
}
// A power cell picked up: { fixes, done (all collected) }.
export function collectCell(fixes, tower, cellId) {
  const cur = fixOf(fixes, tower.id)
  if (cur.stage !== 'accepted' || cur.cells.includes(cellId)) return { fixes, done: false }
  const cells = [...cur.cells, cellId]
  return { fixes: put(fixes, tower.id, { cells, n: cells.length }), done: cells.length >= CELL_COUNT }
}
// A camp monster felled: { fixes, done }.
export function campKill(fixes, tower) {
  const cur = fixOf(fixes, tower.id)
  if (cur.stage !== 'accepted') return { fixes, done: false }
  const n = cur.n + 1
  return { fixes: put(fixes, tower.id, { n }), done: n >= CAMP_SIZE }
}

// "2 / 3 power cells" style progress for the tracker and the keeper.
export function fixProgressText(fixes, tower) {
  const issue = towerIssue(tower)
  if (!issue) return ''
  const cur = fixOf(fixes, tower.id)
  if (cur.stage === 'done') return 'Fixed'
  if (issue.kind === 'cells') return `${cur.n} / ${CELL_COUNT} power cells`
  if (issue.kind === 'camp') return `${cur.n} / ${CAMP_SIZE} camp monsters`
  return `${PARTS_COST} crystals of parts`
}

// The keeper's dialogue: { text, buttons: [{ id, label }] } for the stage the fix is in.
export function keeperDialog(fixes, tower, crystals = 0) {
  const issue = towerIssue(tower)
  const cur = fixOf(fixes, tower.id)
  if (!issue) return { text: 'All in working order. Safe travels, and keep your glider dry.', buttons: [{ id: 'close', label: 'Thanks' }] }
  if (cur.stage === 'done') return { text: `The ${tower.name} hums like new, thanks to you. Step on the glowing pad whenever you like.`, buttons: [{ id: 'close', label: 'Farewell' }] }
  if (cur.stage === 'open') return { text: `${issue.tale}`, buttons: [{ id: 'accept', label: issue.kind === 'parts' ? 'Leave it to me' : 'I\'ll sort it out' }, { id: 'close', label: 'Not now' }] }
  const status = fixProgressText(fixes, tower)
  if (issue.kind === 'parts') {
    return {
      text: `Gears first, then the tower. ${crystals >= PARTS_COST ? 'You have enough: shall I send for them?' : `It comes to ${PARTS_COST} crystals, and you only have ${crystals}.`}`,
      buttons: [{ id: 'pay', label: `Pay ${PARTS_COST} crystals` }, { id: 'close', label: 'Back soon' }],
    }
  }
  return { text: `${issue.short}: ${status} so far. ${issue.kind === 'cells' ? 'Look for the glow.' : 'They are camped around the tower.'}`, buttons: [{ id: 'close', label: 'On it' }] }
}

export { TOWER_RING }
