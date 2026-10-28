// Pure, Three-free wave logic: how big each wave is, how fast its
// enemies trickle in, which monster type to spawn next, the wave
// controller's phase state machine, and the score awarded for a kill or
// a cleared wave. Kept free of Three.js imports so Vitest can exercise
// it without WebGL; the Three-side driver lives in main.js.
import { bossForFight, bossById, shuffleBossOrder, wavesBeforeBoss } from './bosses.js'

export const WAVE_BASE_SIZE = 3
export const WAVE_GROWTH = 2

// A strictly increasing enemy count for wave `n` (1-indexed).
export function waveSize(n) {
  return WAVE_BASE_SIZE + WAVE_GROWTH * (n - 1)
}

export const WAVE_BASE_SPAWN_INTERVAL = 2.5 // seconds
export const WAVE_SPAWN_INTERVAL_DECAY = 0.1 // seconds faster per wave
export const WAVE_MIN_SPAWN_INTERVAL = 1.5 // seconds

// Seconds between enemies trickling in one at a time during wave `n`,
// never faster than WAVE_MIN_SPAWN_INTERVAL.
export function waveSpawnInterval(n) {
  return Math.max(WAVE_MIN_SPAWN_INTERVAL, WAVE_BASE_SPAWN_INTERVAL - WAVE_SPAWN_INTERVAL_DECAY * (n - 1))
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
  const remaining = 1 - grumpus
  return { blobbo: remaining * 0.55, zippy: remaining * 0.45, grumpus }
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
  }
}

// True while the break before a boss fight is counting down.
export function isBossNext(state) {
  return state.wavesUntilBoss <= 0
}

// The boss this run meets next (or is fighting right now).
export function currentBoss(state) {
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
      next.wavesUntilBoss = wavesBeforeBoss(next.bossesDefeated)
      next.phase = 'intermission'
      next.phaseElapsed = 0
      next.spawnedCount = 0
    }
  }

  return { state: next, spawns, events }
}

const SCORE_BY_TYPE = { blobbo: 100, zippy: 75, grumpus: 150 }

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
