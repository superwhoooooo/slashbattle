// Regional phenomena (the Wilds, Tears of the Kingdom-style): four huge, unnatural storms each squat on one Heartland
// biome -- the Howling Sandstorm (Amethyst Dunes), the Whiteout (Frostveil Reach), the Ashstorm (Emberwaste) and the
// Weeping Miasma (Gloomfen). Walk into one and it swallows you: a hazard hits you the whole time you are inside, and the
// only way to end it is a long chain of SIX stages (a seek, a scavenger hunt past guards, a purge, a held ritual, a
// timed gate run and finally the storm's boss). Calm all four and the Stormbinder (the secret hero) answers.
// Pure, seeded, no Three; the look is src/phenomenaFx.js and the wiring is main.js's stepPhenomena. Tests:
// test/phenomena.test.js. Progress lives in the journal's `phenomena`: { [id]: { started, stage, n, got } }.
import { BIOMES, WORLD_SEED, biomeAt, heightAt, lakeAt, mulberry32 } from './world.js'
import { openGround } from './wildsSpots.js'

export const PHENOMENON_RADIUS = 78 // the storm wall
export const STORM_FADE = 24 // the storm thins out over this much beyond the wall
export const PHENOMENON_ORDER = ['sandstorm', 'whiteout', 'ashstorm', 'miasma']

// Stage kinds: seek (walk to a spot), collect (n pickups, each with guards), purge (fell n storm-spawn), hold (stand in the
// ritual circle for `secs`; waves keep coming), trial (gates in order within `secs`, the clock starts at gate 1), boss.
export const PHENOMENA = {
  sandstorm: {
    id: 'sandstorm', name: 'The Howling Sandstorm', short: 'Sandstorm', biome: 'amethyst', color: 0xe8b86a, glow: 0xffd98a, hazard: 'gust',
    blurb: 'A wall of violet-gold sand that shoves you about and blinds you. Something at its heart keeps it turning.',
    hazardText: 'GUSTS SHOVE YOU AROUND · VISIBILITY LOW',
    reward: 'Windstone Seal',
    stages: [
      { kind: 'seek', at: 'rim', title: 'Into the Wall', text: 'The sand howls like a living thing. Push through it to the old Sundial on the storm\'s edge: it still points at whatever started this.', radius: 7 },
      { kind: 'collect', title: 'Four Wind Stones', text: 'The Sundial\'s ring is missing four wind stones, scattered by the gale. Each lies in a nest of sand-things.', item: 'Wind Stone', n: 4, guards: 2 },
      { kind: 'purge', title: 'Sand Wraiths', text: 'The stones draw them out of the dunes. Cut down every wraith the storm throws at you.', n: 12, wave: 4 },
      { kind: 'hold', at: 'mid', title: 'Rekindle the Sun Brazier', text: 'Stand in the glowing ring and keep the brazier lit while the storm tries to put it out. Stray outside and it dims.', secs: 40, radius: 9, waveEvery: 9, wave: 3 },
      { kind: 'trial', title: 'The Gale Run', text: 'Wind gates hang round the storm. Hit the first, then thread them all in order before the gale runs out.', gates: 6, secs: 78, radius: 5 },
      { kind: 'boss', title: 'The Dune Tyrant', text: 'The eye opens. Something ancient has been spinning the sand: end it.', boss: 'boss_zipzilla', minions: 2 },
    ],
  },
  whiteout: {
    id: 'whiteout', name: 'The Great Whiteout', short: 'Whiteout', biome: 'frostveil', color: 0xcfeaff, glow: 0xe8f6ff, hazard: 'cold',
    blurb: 'A blizzard so thick it freezes you from the inside. Stay near fire or kill to keep your blood moving.',
    hazardText: 'THE COLD CREEPS IN · STAY NEAR FIRE · KILLS WARM YOU',
    reward: 'Rimefire Seal',
    stages: [
      { kind: 'seek', at: 'rim', title: 'The Last Campfire', text: 'Find the abandoned watch fire at the blizzard\'s edge. A note there says the cold started at the glacier\'s heart.', radius: 7 },
      { kind: 'trial', title: 'Sled Run to the Fires', text: 'Five signal fires have gone dark. Run through every one in order before the whiteout buries the trail.', gates: 5, secs: 70, radius: 5 },
      { kind: 'collect', title: 'Five Ember Cores', text: 'Frost wardens guard the cores that once kept this valley warm. Take them back.', item: 'Ember Core', n: 5, guards: 2 },
      { kind: 'purge', title: 'Rime Raiders', text: 'The cold has driven the local beasts mad. Fell fourteen of them.', n: 14, wave: 5 },
      { kind: 'hold', at: 'mid', title: 'Keep the Bonfire', text: 'Relight the great bonfire and keep it burning. Stand in the ring: the storm will send everything it has.', secs: 55, radius: 9, waveEvery: 8, wave: 4 },
      { kind: 'boss', title: 'The Frostbound Warden', text: 'The glacier cracks and something enormous climbs out of the ice.', boss: 'boss_conefather', minions: 3 },
    ],
  },
  ashstorm: {
    id: 'ashstorm', name: 'The Burning Ashstorm', short: 'Ashstorm', biome: 'emberwaste', color: 0xff6a2a, glow: 0xffb04a, hazard: 'embers',
    blurb: 'Glowing cinders rain from a red sky. Each one marks the ground first: do not be standing there.',
    hazardText: 'EMBERS RAIN DOWN · WATCH THE RED RINGS',
    reward: 'Cinderheart Seal',
    stages: [
      { kind: 'seek', at: 'rim', title: 'The Cooled Forge', text: 'A dead forge sits at the storm\'s edge. The smiths scratched a warning into its anvil: the fire under the world has woken.', radius: 7 },
      { kind: 'purge', title: 'Slag Hounds', text: 'The forge\'s old guardians have gone feral in the heat. Put down twelve.', n: 12, wave: 4 },
      { kind: 'collect', title: 'Three Quenching Stones', text: 'Three stones can cool the vents. They lie in the lairs of the strongest brutes the ashstorm has bred.', item: 'Quenching Stone', n: 3, guards: 3 },
      { kind: 'trial', title: 'Run the Cinder Field', text: 'Eight vent gates mark the safe path. Hit them in order while the sky throws fire at you.', gates: 8, secs: 88, radius: 5 },
      { kind: 'hold', at: 'mid', title: 'Seal the Great Vent', text: 'Hold the ring over the vent while the stones do their work. The storm will not let you.', secs: 50, radius: 9, waveEvery: 8, wave: 4 },
      { kind: 'boss', title: 'The Cinder King', text: 'The ground splits and a crowned thing of living slag hauls itself out of the vent.', boss: 'boss_omega', minions: 3 },
    ],
  },
  miasma: {
    id: 'miasma', name: 'The Weeping Miasma', short: 'Miasma', biome: 'gloomfen', color: 0x7cd86a, glow: 0xb8ff8a, hazard: 'spores',
    blurb: 'A green fog that weeps poison clouds onto the ground. Keep moving, and keep out of the clouds.',
    hazardText: 'POISON CLOUDS DRIFT IN · KEEP MOVING',
    reward: 'Mirelight Seal',
    stages: [
      { kind: 'seek', at: 'rim', title: 'The Drowned Lantern', text: 'A rotting lantern hangs at the fog\'s edge, still faintly lit. The wisps in the fen want to be followed.', radius: 7 },
      { kind: 'collect', title: 'Six Spirit Lights', text: 'The fen\'s spirit lights were stolen by the miasma. Win back six of them, though each is guarded.', item: 'Spirit Light', n: 6, guards: 2 },
      { kind: 'hold', at: 'mid', title: 'The Lantern Ritual', text: 'Hold the ring and let the spirit lights burn the fog back. The bog does not like it.', secs: 45, radius: 9, waveEvery: 8, wave: 3 },
      { kind: 'purge', title: 'Mire Spawn', text: 'Whatever the fog fed has hatched. Fell sixteen mire-spawn.', n: 16, wave: 5 },
      { kind: 'trial', title: 'The Will-o-Wisp Chase', text: 'Seven wisps flit through the fog. Catch each in order before they scatter.', gates: 7, secs: 82, radius: 5 },
      { kind: 'boss', title: 'The Bog Mother', text: 'The fen heaves, and the thing that has been weeping poison rises to meet you.', boss: 'boss_gloop', minions: 3 },
    ],
  },
}
export const PHENOMENON_LIST = PHENOMENON_ORDER.map((id) => PHENOMENA[id])
export const phenomenonById = (id) => PHENOMENA[id] ?? null

// ---- where each storm sits --------------------------------------------------------------------------------------

const RING_SAMPLES = 16
// How much of the storm's wall lies inside its own biome (0..1) when it is centred at (x, z).
function biomeFill(biome, x, z) {
  let n = 0
  for (let i = 0; i < RING_SAMPLES; i++) {
    const a = (i / RING_SAMPLES) * Math.PI * 2
    if (biomeAt(x + Math.cos(a) * PHENOMENON_RADIUS * 0.8, z + Math.sin(a) * PHENOMENON_RADIUS * 0.8) === biome) n++
  }
  return n / RING_SAMPLES
}
const cache = new Map()
// The storm's eye: { x, z, y } -- a dry, open spot with the storm's biome all round it, chosen once (seeded).
export function phenomenonEye(id) {
  if (cache.has(id)) return cache.get(id)
  const ph = PHENOMENA[id]
  const rand = mulberry32(WORLD_SEED + 15100 + PHENOMENON_ORDER.indexOf(id) * 97)
  let best = null
  for (let i = 0; i < 700; i++) {
    const a = rand() * Math.PI * 2
    const r = 90 + rand() * 230
    const x = Math.cos(a) * r
    const z = Math.sin(a) * r
    if (biomeAt(x, z) !== ph.biome) continue
    if (lakeAt(x, z, 0.5) || !openGround(x, z, { edge: 70, villageClear: 55, siteMargin: 22 })) continue
    const score = biomeFill(ph.biome, x, z) + rand() * 0.04
    if (!best || score > best.score) best = { x, z, score }
  }
  if (!best) { // no clean spot: settle for the middle of the biome's ring
    for (let i = 0; i < 400 && !best; i++) {
      const a = rand() * Math.PI * 2
      const r = 80 + rand() * 230
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (biomeAt(x, z) === ph.biome) best = { x, z, score: 0 }
    }
  }
  const eye = best ?? { x: 150, z: 0 }
  const out = { x: eye.x, z: eye.z, y: heightAt(eye.x, eye.z) }
  cache.set(id, out)
  return out
}
export const phenomenonEyes = () => PHENOMENON_LIST.map((p) => ({ id: p.id, ...phenomenonEye(p.id) }))

// How hard the storm blows at (x, z): 1 inside the wall, easing to 0 over STORM_FADE beyond it; 0 once it is calmed.
export function stormIntensity(id, x, z, cleared = false) {
  if (cleared) return 0
  const eye = phenomenonEye(id)
  const d = Math.hypot(x - eye.x, z - eye.z)
  if (d <= PHENOMENON_RADIUS) return 1
  return Math.max(0, 1 - (d - PHENOMENON_RADIUS) / STORM_FADE)
}
export const insideStorm = (id, x, z) => stormIntensity(id, x, z) >= 1
// The storm (any of the four) whose wall holds (x, z), else null.
export function stormAt(x, z) {
  for (const p of PHENOMENON_LIST) if (insideStorm(p.id, x, z)) return p.id
  return null
}

// ---- stage points -------------------------------------------------------------------------------------------------

function dry(x, z) {
  return !lakeAt(x, z, 0.4) && openGround(x, z, { edge: 30, villageClear: 14, siteMargin: 4, road: false })
}
// A seeded point inside the storm at `rad` (fraction of the wall radius) and `ang`, nudged to dry open ground.
function pointAt(id, key, rad, ang) {
  const eye = phenomenonEye(id)
  const rand = mulberry32(WORLD_SEED + 15700 + PHENOMENON_ORDER.indexOf(id) * 131 + key * 17)
  for (let tries = 0; tries < 30; tries++) {
    const r = PHENOMENON_RADIUS * Math.min(0.92, Math.max(0, rad + (tries ? (rand() - 0.5) * 0.25 : 0)))
    const a = ang + (tries ? (rand() - 0.5) * 0.7 : 0)
    const x = eye.x + Math.cos(a) * r
    const z = eye.z + Math.sin(a) * r
    if (rad < 0.05 || dry(x, z)) return { x, z, y: heightAt(x, z) }
  }
  return { x: eye.x + Math.cos(ang) * PHENOMENON_RADIUS * rad, z: eye.z + Math.sin(ang) * PHENOMENON_RADIUS * rad, y: heightAt(eye.x, eye.z) }
}
// The side of the storm facing the Sanctum (the world's centre): where you walk in from.
const inwardAngle = (id) => {
  const eye = phenomenonEye(id)
  return Math.atan2(-eye.z, -eye.x)
}

// The points of stage `index`: seek / hold / boss -> one, collect -> n, trial -> the gates in order. Each { id, x, z, y }.
export function stagePoints(id, index) {
  const ph = PHENOMENA[id]
  const stage = ph?.stages[index]
  if (!stage) return []
  const base = inwardAngle(id)
  const tag = (p, i) => ({ id: `${id}:${index}:${i}`, ...p })
  if (stage.kind === 'seek') return [tag(pointAt(id, index * 31, stage.at === 'eye' ? 0 : stage.at === 'mid' ? 0.45 : 0.82, base), 0)]
  if (stage.kind === 'hold') return [tag(pointAt(id, index * 31, stage.at === 'eye' ? 0 : 0.42, base + 0.9), 0)]
  if (stage.kind === 'boss') return [tag({ ...phenomenonEye(id) }, 0)]
  if (stage.kind === 'collect') {
    return Array.from({ length: stage.n }, (_, i) => tag(pointAt(id, index * 31 + i, 0.4 + (i % 2) * 0.28, base + 0.4 + (i / stage.n) * Math.PI * 2), i))
  }
  if (stage.kind === 'trial') {
    // A loop around the eye, starting beside where you walked in; alternating radii make it a weaving run.
    return Array.from({ length: stage.gates }, (_, i) => tag(pointAt(id, index * 31 + i, 0.5 + (i % 2) * 0.22, base + (i / stage.gates) * Math.PI * 2 * 0.92), i))
  }
  return []
}

// ---- progress (the journal's `phenomena`) ----------------------------------------------------------------------------

export const stageCount = (id) => PHENOMENA[id]?.stages.length ?? 0
export const emptyProgress = () => ({ started: false, stage: 0, n: 0, got: [] })
export const progressOf = (phenomena, id) => ({ ...emptyProgress(), ...(phenomena?.[id] ?? {}) })
export const isCleared = (phenomena, id) => progressOf(phenomena, id).stage >= stageCount(id)
export const clearedCount = (phenomena) => PHENOMENON_ORDER.filter((id) => isCleared(phenomena, id)).length
export const currentStage = (phenomena, id) => (isCleared(phenomena, id) ? null : PHENOMENA[id].stages[progressOf(phenomena, id).stage])
const put = (phenomena, id, next) => ({ ...phenomena, [id]: { ...progressOf(phenomena, id), ...next } })

// The storm swallows you for the first time: the chain begins.
export const startPhenomenon = (phenomena, id) => (progressOf(phenomena, id).started ? phenomena : put(phenomena, id, { started: true }))
// Finishes the current stage: { phenomena, cleared (the whole storm is done) }.
export function advanceStage(phenomena, id) {
  const cur = progressOf(phenomena, id)
  if (cur.stage >= stageCount(id)) return { phenomena, cleared: false }
  const stage = cur.stage + 1
  return { phenomena: put(phenomena, id, { stage, n: 0, got: [] }), cleared: stage >= stageCount(id) }
}
// A pickup taken: { phenomena, done }.
export function collectItem(phenomena, id, pointId) {
  const cur = progressOf(phenomena, id)
  const stage = PHENOMENA[id]?.stages[cur.stage]
  if (!stage || stage.kind !== 'collect' || cur.got.includes(pointId)) return { phenomena, done: false }
  const got = [...cur.got, pointId]
  return { phenomena: put(phenomena, id, { got, n: got.length }), done: got.length >= stage.n }
}
// A storm-spawn felled during a purge stage: { phenomena, done }.
export function purgeKill(phenomena, id) {
  const cur = progressOf(phenomena, id)
  const stage = PHENOMENA[id]?.stages[cur.stage]
  if (!stage || stage.kind !== 'purge') return { phenomena, done: false }
  const n = cur.n + 1
  return { phenomena: put(phenomena, id, { n }), done: n >= stage.n }
}

// "2 / 4 Wind Stones" style progress for the chips and the journal.
export function progressText(phenomena, id, rt = {}) {
  const cur = progressOf(phenomena, id)
  const stage = PHENOMENA[id].stages[cur.stage]
  if (!stage) return 'Calmed'
  if (stage.kind === 'seek') return 'find the marker'
  if (stage.kind === 'collect') return `${cur.n} / ${stage.n} ${stage.item}s`
  if (stage.kind === 'purge') return `${cur.n} / ${stage.n} felled`
  if (stage.kind === 'hold') return `${Math.min(stage.secs, Math.floor(rt.hold ?? 0))} / ${stage.secs}s lit`
  if (stage.kind === 'trial') return rt.trial?.running ? `gate ${rt.trial.next + 1} / ${stage.gates} · ${Math.max(0, Math.ceil(stage.secs - (rt.trial.elapsed ?? 0)))}s` : 'reach the first gate'
  return 'defeat the boss'
}

// ---- the holds and the gate runs (pure state machines) ---------------------------------------------------------------

export const createHold = () => ({ progress: 0, nextWave: 3 })
// Ticks a hold: progress rises while you stand inside the ring, drains at half speed outside. { state, done, waves }.
export function stepHold(state, stage, { inside, dt, alive = true }) {
  const rate = inside && alive ? 1 : -0.5
  const progress = Math.max(0, Math.min(stage.secs, state.progress + dt * rate))
  let nextWave = state.nextWave
  let waves = 0
  if (progress > 0 && progress >= nextWave && progress < stage.secs) {
    waves = 1
    nextWave += stage.waveEvery
  }
  return { state: { progress, nextWave }, done: progress >= stage.secs, waves }
}

export const createTrial = () => ({ running: false, next: 0, elapsed: 0 })
// Ticks a gate run. Touch the first gate to start the clock, then each gate in order within `secs`.
// -> { state, passed (a gate was just taken: its index), done, failed }.
export function stepTrial(state, stage, gates, { x, z, dt }) {
  let { running, next, elapsed } = state
  let passed = null
  let done = false
  let failed = false
  if (running) {
    elapsed += dt
    if (elapsed > stage.secs) {
      failed = true
      return { state: createTrial(), passed, done, failed }
    }
  }
  const gate = gates[next]
  if (gate && Math.hypot(gate.x - x, gate.z - z) <= stage.radius) {
    passed = next
    running = true
    next += 1
    if (next >= gates.length) done = true
  }
  return { state: { running, next, elapsed }, passed, done, failed }
}

// ---- the hazards ----------------------------------------------------------------------------------------------------

// The sandstorm's wind: a direction that wanders round and a strength that gusts (m/s), scaled by how deep in you are.
export function gustPush(t, intensity = 1) {
  const a = t * 0.31 + Math.sin(t * 0.17) * 1.4
  const strength = (1.4 + Math.max(0, Math.sin(t * 0.9)) * 2.6 + Math.max(0, Math.sin(t * 0.23 + 1)) * 1.8) * intensity
  return { x: Math.cos(a) * strength, z: Math.sin(a) * strength }
}
export const GUST_BLIND = { near: 6, far: 46 } // the sandstorm's visibility (fog)

export const COLD = { fill: 1 / 26, warmRate: 1 / 3, warmRadius: 9, killWarm: 0.14, slow: 0.22, burn: 0.025 }
// The whiteout's cold meter (0..1): it climbs over ~26 s, a fire (or a kill) knocks it back; at 1 it saps speed and health.
export function coldStep(cold, dt, { warm = false, intensity = 1 } = {}) {
  const next = warm ? cold - COLD.warmRate * dt : cold + COLD.fill * dt * intensity
  return Math.max(0, Math.min(1, next))
}
export const coldSlow = (cold) => 1 - COLD.slow * Math.max(0, (cold - 0.4) / 0.6) // 1 -> 0.78 speed
export const coldDamagePerSecond = (cold, maxHp) => (cold >= 1 ? maxHp * COLD.burn : 0)

export const EMBER = { every: 1.5, warn: 1.25, radius: 3.3, damage: 7, spread: 15 }
// The ashstorm's next ember: a spot near (and sometimes right on) the player. `rand` is any () => 0..1.
export function emberSpot(rand, player, spread = EMBER.spread) {
  const lead = rand() < 0.4 ? 0 : spread
  const a = rand() * Math.PI * 2
  const d = Math.sqrt(rand()) * lead
  return { x: player.x + Math.cos(a) * d, z: player.z + Math.sin(a) * d }
}

export const SPORES = { every: 2.6, life: 11, radius: 4, tick: 0.5, damage: 2.5, spread: 14 }
// The miasma's next poison cloud: somewhere round the player, never right on top of them.
export function sporeSpot(rand, player, spread = SPORES.spread) {
  const a = rand() * Math.PI * 2
  const d = 4.5 + rand() * (spread - 4.5)
  return { x: player.x + Math.cos(a) * d, z: player.z + Math.sin(a) * d }
}

// ---- rewards ----------------------------------------------------------------------------------------------------------

export const stageReward = (index) => 35 + index * 20 // crystals for finishing a stage
export const CLEAR_REWARD = 420 // crystals for calming a whole storm
// Enemy types the storm throws at you: the local biome's table (no bosses), a little tougher the deeper the stage.
export function stormMonsters(id) {
  const biome = BIOMES[PHENOMENA[id].biome]
  return biome.monsters.filter((m) => (m[2] ?? 0) <= 0.8).map((m) => m[0])
}

// ---- the secret hero ----------------------------------------------------------------------------------------------------

export const STORM_HERO = 'tempest'
export const heroForStorms = (cleared, total = PHENOMENON_ORDER.length) => (total > 0 && cleared >= total ? STORM_HERO : null)
