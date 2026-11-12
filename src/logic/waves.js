// Pure, Three-free wave logic: how big each wave is, how fast its
// enemies trickle in, which monster type to spawn next, the wave
// controller's phase state machine, and the score awarded for a kill or
// a cleared wave. Kept free of Three.js imports so Vitest can exercise
// it without WebGL; the Three-side driver lives in main.js.
import { bossForFight, bossById, shuffleBossOrder, shuffleWaterBossOrder, waterBossForFight, wavesBeforeBoss } from './bosses.js'
import { CRAZY_SCORES, crazyWeights } from './crazyEnemies.js'
import { SHADY_SCORES, shadyWeights } from './shadyGuests.js'

export const WAVE_BASE_SIZE = 4
export const WAVE_GROWTH = 4

// The difficulty's wave tuning (logic/difficulty.js): `size` scales how many monsters a wave holds,
// `interval` how long between arrivals. Normal is 1 / 1.
let tuning = { size: 1, interval: 1 }
export function setWaveTuning({ size = 1, interval = 1 } = {}) {
  tuning = { size, interval }
}

// A strictly increasing enemy count for wave `n` (1-indexed).
export function waveSize(n) {
  const base = WAVE_BASE_SIZE + WAVE_GROWTH * (n - 1)
  return tuning.size === 1 ? base : Math.max(2, Math.round(base * tuning.size))
}

export const WAVE_BASE_SPAWN_INTERVAL = 1.9 // seconds
export const WAVE_SPAWN_INTERVAL_DECAY = 0.12 // seconds faster per wave
export const WAVE_MIN_SPAWN_INTERVAL = 0.65 // seconds

// Seconds between enemies trickling in one at a time during wave `n`,
// never faster than WAVE_MIN_SPAWN_INTERVAL.
export function waveSpawnInterval(n) {
  return Math.max(WAVE_MIN_SPAWN_INTERVAL, WAVE_BASE_SPAWN_INTERVAL - WAVE_SPAWN_INTERVAL_DECAY * (n - 1)) * tuning.interval
}

export const WAVE_INTERMISSION = 3 // seconds between a wave clearing and the next one spawning

const GRUMPUS_WEIGHT_BASE = 0.1
const GRUMPUS_WEIGHT_GROWTH = 0.02 // per wave past 3, slowly
const GRUMPUS_WEIGHT_MAX = 0.45

// The weighted odds of each monster type on wave `n`: wave 1 is blobbo
// only, zippy unlocks at wave 2, and grumpus unlocks at wave 3 with its
// share growing slowly in later waves (capped). Weights need not sum to
// 1; pickMonsterType normalizes them.
function typeWeights(n) {
  if (n <= 1) return { blobbo: 1 }
  if (n === 2) return { blobbo: 0.6, zippy: 0.4 }

  const grumpus = Math.min(GRUMPUS_WEIGHT_BASE + GRUMPUS_WEIGHT_GROWTH * (n - 3), GRUMPUS_WEIGHT_MAX)
  // The late enemies: bloaters from wave 4, spinners from 5, splitters from 6,
  // each starting small and growing (capped), carved out of the common share.
  const bloater = n >= 4 ? Math.min(0.08 + 0.02 * (n - 4), 0.2) : 0
  const spinner = n >= 5 ? Math.min(0.08 + 0.02 * (n - 5), 0.2) : 0
  const splitter = n >= 6 ? Math.min(0.08 + 0.02 * (n - 6), 0.18) : 0
  const hopper = n >= 4 ? Math.min(0.07 + 0.015 * (n - 4), 0.16) : 0
  const mirror = n >= 6 ? Math.min(0.06 + 0.015 * (n - 6), 0.14) : 0
  const glimmer = n >= 8 ? Math.min(0.06 + 0.015 * (n - 8), 0.14) : 0
  const crazy = { ...crazyWeights(n), ...shadyWeights(n) }
  const crazyTotal = Object.values(crazy).reduce((sum, w) => sum + w, 0)
  const remaining = Math.max(0.1, 1 - grumpus - bloater - spinner - splitter - hopper - mirror - glimmer - crazyTotal)
  const weights = { blobbo: remaining * 0.55, zippy: remaining * 0.45, grumpus }
  if (bloater) weights.bloater = bloater
  if (spinner) weights.spinner = spinner
  if (splitter) weights.splitter = splitter
  if (hopper) weights.hopper = hopper
  if (mirror) weights.mirror = mirror
  if (glimmer) weights.glimmer = glimmer
  Object.assign(weights, crazy)
  return weights
}

// Picks a monster type to spawn on wave `n`, weighted per typeWeights.
// rng is injectable (default Math.random) for deterministic tests.
export function pickMonsterType(n, rng = Math.random) {
  const weights = typeWeights(n)
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
  let roll = rng() * total

  const entries = Object.entries(weights)
  for (const [type, weight] of entries) {
    roll -= weight
    if (roll <= 0) return type
  }
  return entries[entries.length - 1][0]
}

// Starting state: wave 1's intermission, ready for the first stepWaves
// call once the start card is dismissed.
// `wavesUntilBoss` counts the regular waves left before the next boss
// (one before the first, then two, three, ...); `bossOrder` is this run's
// shuffled order of the seven bosses.
export function createWaveState(rng = Math.random) {
  return {
    waveNumber: 1,
    phase: 'intermission',
    phaseElapsed: 0,
    spawnedCount: 0,
    bossesDefeated: 0,
    wavesUntilBoss: wavesBeforeBoss(0),
    bossOrder: shuffleBossOrder(rng),
    // In a water room (main.js sets `inWater` when the place changes) only the three water bosses arrive.
    inWater: false,
    waterBossOrder: shuffleWaterBossOrder(rng),
    waterBossesDefeated: 0,
  }
}

// True while the break before a boss fight is counting down.
export function isBossNext(state) {
  return state.wavesUntilBoss <= 0
}

// The boss this run meets next (or is fighting right now).
export function currentBoss(state) {
  if (state.inWater) return waterBossForFight(state.waterBossOrder, state.waterBossesDefeated)
  return bossForFight(state.bossOrder, state.bossesDefeated)
}

// Called once the boss-intro cutscene ends: the boss is out and the
// fight is on. The caller spawns it (it was already placed for the cutscene).
export function beginBossFight(state) {
  return { ...state, phase: 'bossFight', phaseElapsed: 0, spawnedCount: 1 }
}

// Advances the wave controller by one tick.
//
// Phases: `intermission` (a WAVE_INTERMISSION countdown) -> `spawning`
// (one spawn immediately, then one more every waveSpawnInterval(n) until
// waveSize(n) have been emitted) -> `clearing` (waits for aliveCount to
// reach 0) -> emits 'waveCleared' and starts the next wave's
// intermission. Once enough waves are cleared (see wavesUntilBoss) the
// intermission ends in `bossIntro` instead (emits 'bossIntro' and waits
// for the cutscene's beginBossFight), then `bossFight` (waits for
// aliveCount to reach 0, emits 'bossDefeated', and the next boss needs
// one more regular wave than the last). `aliveCount` should include monsters still materializing
// in (a spawn-in effect still counts as alive).
//
// Returns { state, spawns, events }: `state` is the next tick's wave
// state (the caller merges it back in; this does not mutate `state`);
// `spawns` is the list of monster types to spawn this tick (usually
// empty, occasionally one); `events` lists 'waveStart'/'waveCleared' for
// the tick a phase transition happened.
export function stepWaves(state, dt, aliveCount, rng = Math.random) {
  const next = { ...state, phaseElapsed: state.phaseElapsed + dt }
  const spawns = []
  const events = []

  if (next.phase === 'intermission') {
    if (next.phaseElapsed >= WAVE_INTERMISSION && isBossNext(next)) {
      next.phase = 'bossIntro'
      next.phaseElapsed = 0
      events.push('bossIntro')
    } else if (next.phaseElapsed >= WAVE_INTERMISSION) {
      next.phase = 'spawning'
      next.phaseElapsed = 0
      next.spawnedCount = 1
      spawns.push(pickMonsterType(next.waveNumber, rng))
      events.push('waveStart')
    }
  } else if (next.phase === 'spawning') {
    const size = waveSize(next.waveNumber)
    const interval = waveSpawnInterval(next.waveNumber)
    while (next.spawnedCount < size && next.phaseElapsed >= interval) {
      next.phaseElapsed -= interval
      next.spawnedCount += 1
      spawns.push(pickMonsterType(next.waveNumber, rng))
    }
    if (next.spawnedCount >= size) {
      next.phase = 'clearing'
      next.phaseElapsed = 0
    }
  } else if (next.phase === 'clearing') {
    if (aliveCount <= 0) {
      events.push('waveCleared')
      next.waveNumber += 1
      next.wavesUntilBoss -= 1
      next.phase = 'intermission'
      next.phaseElapsed = 0
      next.spawnedCount = 0
    }
  } else if (next.phase === 'bossFight') {
    if (aliveCount <= 0) {
      events.push('bossDefeated')
      next.waveNumber += 1
      next.bossesDefeated += 1
      if (next.inWater) next.waterBossesDefeated += 1
      next.wavesUntilBoss = wavesBeforeBoss(next.bossesDefeated)
      next.phase = 'intermission'
      next.phaseElapsed = 0
      next.spawnedCount = 0
    }
  }

  return { state: next, spawns, events }
}

const SCORE_BY_TYPE = { blobbo: 100, zippy: 75, grumpus: 150, bloater: 200, spinner: 175, splitter: 225, splitling: 40, angler: 230, urchin: 200, eel: 180, hopper: 210, mirror: 220, glimmer: 190, ...CRAZY_SCORES, ...SHADY_SCORES }

// Points awarded for killing one monster of `type` (including falling
// off the platform's edge), 0 for an unrecognized type.
export function scoreForKill(type) {
  return SCORE_BY_TYPE[type] ?? bossById(type)?.score ?? 0
}

export const WAVE_CLEAR_BONUS_PER_WAVE = 250

// Bonus points for clearing wave `n`.
export function waveClearBonus(n) {
  return WAVE_CLEAR_BONUS_PER_WAVE * n
}
