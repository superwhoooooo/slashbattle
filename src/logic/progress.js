// Long-term reasons to play (pure, no Three.js): resort CONTRACTS, hero MASTERY and lifetime RECORDS.
// All of it lives in the saved profile (`profile.progress`, cleaned by `normalizeProgress`).
//
// Contracts: three jobs are always open ("Ring out 15 guests", "Reach wave 8", "Hit a x5 chain"...).
// Run events (`progressEvent`) push them along; a finished one pays banked crystals (scaled by the
// difficulty's reward) and a fresh one is drawn in its place, a little bigger each time (`tier`).
//
// Mastery: every hero earns XP while you play as them (kills, waves, bosses). Each level pays crystals,
// and levels 4 / 7 / 10 give that hero's 2nd / 3rd / 4th skin for free.
//
// Records: lifetime totals (runs, kills, bosses, chests) and the best wave reached per difficulty.
import { difficultyById } from './difficulty.js'

// ---- contracts ----
// kind: what event moves it. 'count' kinds add up across runs; 'best' kinds need one run to reach the goal.
//   kill (any kill), killType (target = monster type), trick (target = trick id), boss, chest, crystals,
//   wave (best), chain (best), score (best), waveClear (count of waves cleared).
// goal(tier) grows as you finish more contracts. reward(tier) is the base payout.
export const CONTRACT_TEMPLATES = [
  { id: 'kills', kind: 'kill', goal: (t) => 60 + 30 * t, reward: (t) => 40 + 15 * t, text: (g) => `Check out ${g} guests` },
  { id: 'ringouts', kind: 'trick', target: 'checkout', goal: (t) => 8 + 4 * t, reward: (t) => 55 + 15 * t, text: (g) => `Knock ${g} guests off the edge` },
  { id: 'ambush', kind: 'trick', target: 'roomService', goal: (t) => 3 + 2 * t, reward: (t) => 55 + 15 * t, text: (g) => `Land ${g} Room Service (ambush) kills` },
  { id: 'cannonball', kind: 'trick', target: 'cannonball', goal: (t) => 4 + 2 * t, reward: (t) => 50 + 15 * t, text: (g) => `Finish ${g} guests in a pool` },
  { id: 'pets', kind: 'trick', target: 'turndownService', goal: (t) => 10 + 5 * t, reward: (t) => 45 + 15 * t, text: (g) => `Let your pet finish ${g} guests` },
  { id: 'magic', kind: 'trick', target: 'magicHour', goal: (t) => 40 + 20 * t, reward: (t) => 40 + 15 * t, text: (g) => `${g} Magic Hour kills with the Wizard Staff` },
  { id: 'blobbo', kind: 'killType', target: 'blobbo', goal: (t) => 30 + 15 * t, reward: (t) => 35 + 10 * t, text: (g) => `Pop ${g} Blobbos` },
  { id: 'zippy', kind: 'killType', target: 'zippy', goal: (t) => 25 + 10 * t, reward: (t) => 40 + 10 * t, text: (g) => `Catch ${g} Zippies` },
  { id: 'grumpus', kind: 'killType', target: 'grumpus', goal: (t) => 15 + 8 * t, reward: (t) => 45 + 10 * t, text: (g) => `Cheer up ${g} Grumpuses` },
  { id: 'bosses', kind: 'boss', goal: (t) => 1 + t, reward: (t) => 80 + 25 * t, text: (g) => `Defeat ${g} boss${g === 1 ? '' : 'es'}` },
  { id: 'chests', kind: 'chest', goal: (t) => 4 + 2 * t, reward: (t) => 40 + 10 * t, text: (g) => `Open ${g} chests` },
  { id: 'crystals', kind: 'crystals', goal: (t) => 150 + 75 * t, reward: (t) => 40 + 10 * t, text: (g) => `Collect ${g} crystals` },
  { id: 'waves', kind: 'waveClear', goal: (t) => 8 + 4 * t, reward: (t) => 45 + 15 * t, text: (g) => `Clear ${g} waves` },
  { id: 'reach', kind: 'wave', goal: (t) => 5 + 2 * t, reward: (t) => 60 + 20 * t, text: (g) => `Reach wave ${g} in one run` },
  { id: 'chain', kind: 'chain', goal: (t) => Math.min(8, 3 + t), reward: (t) => 50 + 15 * t, text: (g) => `Build a x${g} kill chain` },
  { id: 'score', kind: 'score', goal: (t) => 8000 + 6000 * t, reward: (t) => 60 + 20 * t, text: (g) => `Score ${g.toLocaleString('en-US')} in one run` },
]
const TEMPLATE_BY_ID = Object.fromEntries(CONTRACT_TEMPLATES.map((t) => [t.id, t]))
export const ACTIVE_CONTRACTS = 3
const BEST_KINDS = new Set(['wave', 'chain', 'score'])

export function makeContract(templateId, tier = 0) {
  const tpl = TEMPLATE_BY_ID[templateId]
  const goal = tpl.goal(tier)
  return { id: tpl.id, tier, goal, progress: 0, reward: tpl.reward(tier) }
}

export const contractText = (c) => TEMPLATE_BY_ID[c.id]?.text(c.goal) ?? c.id
export const isBestKind = (c) => BEST_KINDS.has(TEMPLATE_BY_ID[c.id]?.kind)

// Draws a contract whose template isn't already open (rng in [0, 1)).
export function drawContract(open, tier, rng = Math.random) {
  const taken = new Set(open.map((c) => c.id))
  const pool = CONTRACT_TEMPLATES.filter((t) => !taken.has(t.id))
  const tpl = pool[Math.floor(rng() * pool.length) % pool.length]
  return makeContract(tpl.id, tier)
}

// ---- mastery ----
export const MASTERY_XP = [0, 60, 160, 320, 540, 820, 1180, 1620, 2160, 2800] // xp needed for level 1..10
export const MASTERY_MAX = MASTERY_XP.length
export const XP_PER = { kill: 1, waveClear: 6, boss: 30 }
export function masteryLevel(xp = 0) {
  let level = 1
  for (let i = 1; i < MASTERY_XP.length; i++) if (xp >= MASTERY_XP[i]) level = i + 1
  return level
}
// { level, into, span } for a progress bar (span 0 at max level).
export function masteryBar(xp = 0) {
  const level = masteryLevel(xp)
  if (level >= MASTERY_MAX) return { level, into: 0, span: 0 }
  const lo = MASTERY_XP[level - 1]
  return { level, into: xp - lo, span: MASTERY_XP[level] - lo }
}
export const masteryReward = (level) => 30 * level
// Which skin index (0-based) a mastery level hands out for free, if any.
export const MASTERY_SKIN_LEVELS = { 4: 1, 7: 2, 10: 3 }

// ---- records + state ----
// A new profile starts on the same three easy jobs; after that they're drawn at random.
const STARTER_CONTRACTS = ['kills', 'reach', 'ringouts']
export function createProgress() {
  const contracts = STARTER_CONTRACTS.map((id) => makeContract(id, 0))
  return {
    contracts,
    contractsDone: 0,
    mastery: {}, // hero id -> xp
    records: { runs: 0, kills: 0, bosses: 0, chests: 0, bestWave: { relax: 0, normal: 0, hard: 0 } },
  }
}

const num = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)

// Cleans a saved progress block (unknown contracts are redrawn, numbers sanitized).
export function normalizeProgress(raw, rng = Math.random) {
  const base = createProgress()
  if (!raw || typeof raw !== 'object') return base
  const contracts = []
  for (const c of Array.isArray(raw.contracts) ? raw.contracts : []) {
    if (!TEMPLATE_BY_ID[c?.id] || contracts.some((o) => o.id === c.id) || contracts.length >= ACTIVE_CONTRACTS) continue
    const fresh = makeContract(c.id, num(c.tier))
    contracts.push({ ...fresh, progress: Math.min(num(c.progress), fresh.goal) })
  }
  const done = num(raw.contractsDone)
  while (contracts.length < ACTIVE_CONTRACTS) contracts.push(drawContract(contracts, contractTier(done), rng))
  const mastery = {}
  for (const [id, xp] of Object.entries(raw.mastery ?? {})) if (typeof id === 'string' && num(xp)) mastery[id] = num(xp)
  const r = raw.records ?? {}
  return {
    contracts,
    contractsDone: done,
    mastery,
    records: {
      runs: num(r.runs), kills: num(r.kills), bosses: num(r.bosses), chests: num(r.chests),
      bestWave: { relax: num(r.bestWave?.relax), normal: num(r.bestWave?.normal), hard: num(r.bestWave?.hard) },
    },
  }
}

// Every 3 contracts finished, new ones get a tier bigger.
export const contractTier = (done) => Math.floor(done / 3)

// Does `event` move contract `c`, and to what progress?
function advance(c, event) {
  const tpl = TEMPLATE_BY_ID[c.id]
  const { type } = event
  const amount = event.amount ?? 1
  switch (tpl.kind) {
    case 'kill': return type === 'kill' ? c.progress + amount : c.progress
    case 'killType': return type === 'kill' && event.monster === tpl.target ? c.progress + amount : c.progress
    case 'trick': return type === 'kill' && event.trick === tpl.target ? c.progress + amount : c.progress
    case 'boss': return type === 'boss' ? c.progress + amount : c.progress
    case 'chest': return type === 'chest' ? c.progress + amount : c.progress
    case 'crystals': return type === 'crystals' ? c.progress + amount : c.progress
    case 'waveClear': return type === 'waveClear' ? c.progress + amount : c.progress
    case 'wave': return type === 'wave' ? Math.max(c.progress, event.value) : c.progress
    case 'chain': return type === 'chain' ? Math.max(c.progress, event.value) : c.progress
    case 'score': return type === 'score' ? Math.max(c.progress, event.value) : c.progress
    default: return c.progress
  }
}

// Feeds one run event into the progress: contracts, mastery (for `hero`) and records.
// event: { type: 'kill', monster, trick, boss? } | { type: 'boss' } | { type: 'chest' } | { type: 'crystals', amount }
//   | { type: 'waveClear' } | { type: 'wave', value } | { type: 'chain', value } | { type: 'score', value }
// Returns { progress, bank: crystals earned, done: [{ text, reward }], levelUps: [{ hero, level, reward, skin }] }.
export function progressEvent(progress, event, { hero = 'guest', difficulty = 'normal', rng = Math.random } = {}) {
  const mult = difficultyById(difficulty).reward
  let bank = 0
  const done = []
  const levelUps = []
  let contractsDone = progress.contractsDone
  const kept = []
  for (const c of progress.contracts) {
    const next = Math.min(c.goal, advance(c, event))
    if (next >= c.goal) {
      const reward = Math.round(c.reward * mult)
      bank += reward
      done.push({ text: contractText(c), reward })
      contractsDone++
    } else kept.push(next === c.progress ? c : { ...c, progress: next })
  }
  while (kept.length < ACTIVE_CONTRACTS) kept.push(drawContract(kept, contractTier(contractsDone), rng))

  let mastery = progress.mastery
  const xp = event.type === 'kill' ? XP_PER.kill : event.type === 'waveClear' ? XP_PER.waveClear : event.type === 'boss' ? XP_PER.boss : 0
  if (xp) {
    const before = mastery[hero] ?? 0
    const after = before + xp
    mastery = { ...mastery, [hero]: after }
    for (let level = masteryLevel(before) + 1; level <= masteryLevel(after); level++) {
      const reward = Math.round(masteryReward(level) * mult)
      bank += reward
      levelUps.push({ hero, level, reward, skin: MASTERY_SKIN_LEVELS[level] ?? null })
    }
  }

  const r = progress.records
  let records = r
  if (event.type === 'kill') records = { ...r, kills: r.kills + 1 }
  else if (event.type === 'boss') records = { ...r, bosses: r.bosses + 1 }
  else if (event.type === 'chest') records = { ...r, chests: r.chests + 1 }
  else if (event.type === 'wave' && event.value > (r.bestWave[difficulty] ?? 0)) records = { ...r, bestWave: { ...r.bestWave, [difficulty]: event.value } }
  else if (event.type === 'runEnd') records = { ...r, runs: r.runs + 1 }

  const changed = done.length || kept.some((c, i) => c !== progress.contracts[i]) || mastery !== progress.mastery || records !== r
  return { progress: changed ? { ...progress, contracts: kept, contractsDone, mastery, records } : progress, bank, done, levelUps }
}
