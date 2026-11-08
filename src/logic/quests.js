// Pure quest rules for the villagers of the Wilds. Every NPC offers one quest at a time, generated from a seed
// (their id plus how many they have already given you), so the same villager always asks the same thing in the
// same order. Progress is driven by events the game feeds in (kills, crystals, entering a biome, talking).
//
//   questFor(npc, round)   - the quest this NPC offers on their `round`th request
//   createQuestLog()       - { active: [quests with progress/status], rounds: { npcId: n }, completed }
//   acceptQuest / questEvent / claimQuest / questsToClaim - the log's transitions (all return new state)
import { BIOMES, OUTER_BIOMES, dangerAt, mulberry32, villageById, villageLayout, villages } from './world.js'

export const MAX_ACTIVE_QUESTS = 3
export const QUEST_TYPES = ['slay', 'hunt', 'elite', 'gather', 'explore', 'deliver']

const BASE_REWARD = { slay: 18, hunt: 22, elite: 42, gather: 20, explore: 26, deliver: 32 }
const HEAL_FRACTION = 0.25

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const hash = (str) => {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

// The monster types a village's own biome throws at it (for "hunt" quests).
function localMonsters(biomeId) {
  return BIOMES[biomeId].monsters.map((m) => m[0])
}

export function questFor(npc, round = 0) {
  const village = villageById(npc.villageId)
  const rng = mulberry32(hash(`${npc.id}#${round}`))
  const danger = dangerAt(village.x, village.z)
  const biome = BIOMES[village.biome]
  const scale = 1 + danger * 1.2 + round * 0.25

  // The first request from anyone is a gentle one; later ones can be anything.
  const pool = round === 0 ? ['slay', 'gather', 'explore', 'deliver'] : QUEST_TYPES
  const type = pool[Math.floor(rng() * pool.length)]
  const quest = {
    id: `${npc.id}#${round}`,
    giver: npc.id,
    giverName: npc.name,
    villageId: village.id,
    villageName: village.name,
    type,
    need: 1,
    progress: 0,
    status: 'active', // 'active' -> 'ready' (done; go and claim it)
    claimAt: npc.id,
    reward: 0,
    heal: HEAL_FRACTION,
  }

  if (type === 'slay') {
    quest.need = Math.round(4 + round * 2 + danger * 4)
    quest.biome = village.biome
    quest.title = `Quiet the ${biome.name}`
    quest.desc = `Creatures stir across ${biome.name} and the paths are no longer safe. Defeat ${quest.need} of them.`
  } else if (type === 'hunt') {
    const kinds = localMonsters(village.biome)
    quest.monster = kinds[Math.floor(rng() * kinds.length)]
    quest.need = Math.round(3 + round + danger * 3)
    quest.title = `Hunt the ${cap(quest.monster)}`
    quest.desc = `${cap(quest.monster)}s have been stalking our roads at dusk. Slay ${quest.need} of them.`
  } else if (type === 'elite') {
    quest.need = 1
    quest.title = 'The Red-Eyed One'
    quest.desc = 'A great beast leads the others, its eyes burning red. Slay one of the glowing elite monsters.'
  } else if (type === 'gather') {
    quest.need = Math.round(12 + round * 8 + danger * 14)
    quest.title = 'The Fading Lanterns'
    quest.desc = `Our lanterns are fading and only crystals can feed them. Gather ${quest.need} crystals from fallen monsters.`
  } else if (type === 'explore') {
    const options = OUTER_BIOMES.filter((b) => b !== village.biome)
    quest.targetBiome = options[Math.floor(rng() * options.length)]
    quest.title = 'A Far Light'
    quest.desc = `I saw a strange glow far off in ${BIOMES[quest.targetBiome].name}. Walk into ${BIOMES[quest.targetBiome].name} and come back to tell me what waits there.`
  } else {
    // deliver: carry a letter to someone in another village (one of the nearer ones), and be paid there.
    const others = villages()
      .filter((v) => v.id !== village.id)
      .sort((a, b) => Math.hypot(a.x - village.x, a.z - village.z) - Math.hypot(b.x - village.x, b.z - village.z))
      .slice(0, 3)
    const targetVillage = others[Math.floor(rng() * others.length)]
    const targetNpc = villageLayout(targetVillage).npcs[Math.floor(rng() * 3)]
    quest.targetNpc = targetNpc.id
    quest.targetName = targetNpc.name
    quest.targetVillage = targetVillage.id
    quest.targetVillageName = targetVillage.name
    quest.claimAt = targetNpc.id // you are paid on delivery, not back home
    quest.title = 'A Sealed Letter'
    quest.desc = `Carry this sealed letter to ${targetNpc.name} in ${targetVillage.name}. They will see you rewarded.`
    // A longer road is worth more.
    quest.reward = Math.round(BASE_REWARD.deliver * (1 + danger) * (1 + Math.hypot(targetVillage.x - village.x, targetVillage.z - village.z) / 220))
  }
  if (!quest.reward) quest.reward = Math.round(BASE_REWARD[type] * scale)
  return quest
}

// What a quest shows on the tracker: "Slay monsters 3/6".
export function questProgressText(q) {
  if (q.status === 'ready') return q.type === 'deliver' ? `Deliver to ${q.targetName}` : `Return to ${q.giverName}`
  if (q.type === 'explore') return `Reach ${BIOMES[q.targetBiome].name}`
  if (q.type === 'deliver') return `Deliver to ${q.targetName} in ${q.targetVillageName}`
  return `${q.progress}/${q.need}`
}

// ---- the log ----------------------------------------------------------------------------------------

export function createQuestLog() {
  return { active: [], rounds: {}, completed: 0 }
}

export const roundOf = (log, npcId) => log.rounds[npcId] ?? 0
export const activeFrom = (log, npcId) => log.active.find((q) => q.giver === npcId) ?? null
export const canAccept = (log) => log.active.length < MAX_ACTIVE_QUESTS

export function acceptQuest(log, quest) {
  if (!canAccept(log) || activeFrom(log, quest.giver)) return log
  return { ...log, active: [...log.active, { ...quest }] }
}

// Applies one game event to every active quest. Events:
//   { type: 'kill', monster, elite, biome }  { type: 'crystals', amount }
//   { type: 'enterBiome', biome }            { type: 'talk', npcId }
// Returns { log, ready } where `ready` lists the quests that just became complete.
export function questEvent(log, event) {
  const ready = []
  const active = log.active.map((q) => {
    if (q.status !== 'active') return q
    let progress = q.progress
    if (event.type === 'kill') {
      if (q.type === 'slay' && (!q.biome || q.biome === event.biome)) progress += 1
      else if (q.type === 'hunt' && q.monster === event.monster) progress += 1
      else if (q.type === 'elite' && event.elite) progress += 1
    } else if (event.type === 'crystals' && q.type === 'gather') progress += event.amount
    else if (event.type === 'enterBiome' && q.type === 'explore' && q.targetBiome === event.biome) progress = q.need
    else if (event.type === 'talk' && q.type === 'deliver' && q.targetNpc === event.npcId) progress = q.need
    if (progress === q.progress) return q
    progress = Math.min(progress, q.need)
    const next = { ...q, progress, status: progress >= q.need ? 'ready' : 'active' }
    if (next.status === 'ready') ready.push(next)
    return next
  })
  return { log: { ...log, active }, ready }
}

// Finished quests that can be claimed from this NPC.
export function questsToClaim(log, npcId) {
  return log.active.filter((q) => q.status === 'ready' && q.claimAt === npcId)
}

// Pays out one finished quest: removes it and bumps its giver's round so they ask something new next time.
export function claimQuest(log, questId) {
  const quest = log.active.find((q) => q.id === questId && q.status === 'ready')
  if (!quest) return { log, quest: null }
  return {
    log: { ...log, active: log.active.filter((q) => q.id !== questId), rounds: { ...log.rounds, [quest.giver]: roundOf(log, quest.giver) + 1 }, completed: log.completed + 1 },
    quest,
  }
}

// A few lines of villager chat, for when there is no quest business.
export const AMBIENT_LINES = [
  'The lanterns burn blue when the Sanctum is watching over us.',
  'They say the light at the rim of the world is a door. I have never wanted to find out.',
  'Mind the red-eyed ones. They do not wander; they hunt.',
  'My grandmother crossed the whole continent once. She never would say what she saw.',
  'The hills sing a little at night, if you stand still enough.',
  'Rest here as long as you like. Nothing wild will cross our lamps.',
  'Every village keeps a lantern lit for travellers. Ours is lit for you.',
  'Frostveil to the east, Emberwaste to the south. Never in the same day.',
]
export const ambientLine = (npc, salt = 0) => AMBIENT_LINES[(hash(npc.id) + salt) % AMBIENT_LINES.length]

// ---- what a villager says ----------------------------------------------------------------------------

// The conversation when you speak to `npc`, given your quest log. Returns
//   { mode, text, quest?, buttons: [{ id, label }] }
// with mode 'claim' (you finished something for them), 'progress' (their quest is still open), 'offer' (they
// have a request), 'full' (you carry too many quests) or 'chat'. Button ids: 'claim', 'accept', 'close'.
export function npcDialog(log, npc) {
  const claims = questsToClaim(log, npc.id)
  if (claims.length) {
    const q = claims[0]
    const text = q.type === 'deliver'
      ? `A sealed letter from ${q.giverName} of ${q.villageName}! You carried it all this way. Take this for your trouble.`
      : `You have done it. ${q.type === 'explore' ? 'So the light was real... thank you for looking.' : 'The village is safer for it.'} Here is what I promised.`
    return { mode: 'claim', quest: q, text, buttons: [{ id: 'claim', label: `Claim ${q.reward} crystals` }] }
  }
  const mine = activeFrom(log, npc.id)
  if (mine) {
    const hint = mine.type === 'deliver' ? `The letter is still with you. ${mine.targetName} waits in ${mine.targetVillageName}.` : `${questProgressText(mine)}. Keep at it, traveller.`
    return { mode: 'progress', quest: mine, text: `${mine.title}: ${hint}`, buttons: [{ id: 'close', label: 'I will see it done' }] }
  }
  const quest = questFor(npc, roundOf(log, npc.id))
  if (!canAccept(log)) {
    return { mode: 'full', text: 'You are already carrying so many promises, traveller. Finish one, then come and see me.', buttons: [{ id: 'close', label: 'Of course' }] }
  }
  return {
    mode: 'offer',
    quest,
    text: quest.desc,
    buttons: [{ id: 'accept', label: 'Accept' }, { id: 'close', label: 'Not now' }],
  }
}

// Which marker floats over a villager: '?' (something to collect, or a letter to receive), '...' (their quest is
// open), '!' (they have a request and you have room for it), or null.
export function npcMarker(log, npc) {
  if (questsToClaim(log, npc.id).length) return 'ready'
  if (log.active.some((q) => q.type === 'deliver' && q.status === 'active' && q.targetNpc === npc.id)) return 'ready'
  if (activeFrom(log, npc.id)) return 'progress'
  return canAccept(log) ? 'offer' : null
}
