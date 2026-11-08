import { describe, expect, it } from 'vitest'
import {
  MAX_ACTIVE_QUESTS, QUEST_TYPES, acceptQuest, activeFrom, ambientLine, claimQuest, createQuestLog, questEvent, questFor, questProgressText, questsToClaim, roundOf,
} from '../src/logic/quests.js'
import { villageLayout, villages } from '../src/logic/world.js'

const allNpcs = () => villages().flatMap((v) => villageLayout(v).npcs)

describe('quest generation', () => {
  it('is deterministic and complete for every villager and round', () => {
    for (const npc of allNpcs()) {
      for (let round = 0; round < 6; round++) {
        const q = questFor(npc, round)
        expect(questFor(npc, round)).toEqual(q)
        expect(QUEST_TYPES).toContain(q.type)
        expect(q.title.length).toBeGreaterThan(3)
        expect(q.desc.length).toBeGreaterThan(10)
        expect(q.need).toBeGreaterThanOrEqual(1)
        expect(q.reward).toBeGreaterThan(0)
        if (q.type === 'deliver') {
          expect(q.targetNpc).not.toBe(npc.id)
          expect(allNpcs().some((n) => n.id === q.targetNpc)).toBe(true)
          expect(q.claimAt).toBe(q.targetNpc)
        } else expect(q.claimAt).toBe(npc.id)
      }
    }
  })

  it('starts gentle, and asks for more as the rounds go on', () => {
    const npc = allNpcs()[0]
    for (const q of [0, 1, 2].map((r) => questFor(npc, r))) expect(q.need).toBeLessThan(45)
    const early = allNpcs().map((n) => questFor(n, 0).type)
    expect(early.every((t) => ['slay', 'gather', 'explore', 'deliver'].includes(t))).toBe(true)
    const slay = allNpcs().find((n) => questFor(n, 0).type === 'slay')
    if (slay) expect(questFor(slay, 0).reward).toBeGreaterThan(0)
  })
})

describe('quest log', () => {
  const npc = allNpcs()[0]

  it('accepts a quest once per giver and up to the limit', () => {
    let log = createQuestLog()
    log = acceptQuest(log, questFor(npc, 0))
    expect(log.active.length).toBe(1)
    expect(acceptQuest(log, questFor(npc, 1)).active.length).toBe(1) // same giver already has one out
    const others = allNpcs().slice(1, 6)
    for (const n of others) log = acceptQuest(log, questFor(n, 0))
    expect(log.active.length).toBe(MAX_ACTIVE_QUESTS)
  })

  it('counts kills in the right biome, then becomes ready and can be claimed once', () => {
    const slay = allNpcs().map((n) => questFor(n, 0)).find((q) => q.type === 'slay') ?? { ...questFor(npc, 0), type: 'slay', biome: 'whisperwood', need: 3, id: 'x#0', giver: 'x', claimAt: 'x' }
    let log = acceptQuest(createQuestLog(), slay)
    log = questEvent(log, { type: 'kill', monster: 'blobbo', biome: slay.biome === 'emberwaste' ? 'frostveil' : 'emberwaste' }).log
    expect(log.active[0].progress).toBe(0) // wrong biome
    let ready = []
    for (let i = 0; i < slay.need; i++) ({ log, ready } = questEvent(log, { type: 'kill', monster: 'blobbo', biome: slay.biome }))
    expect(ready.length).toBe(1)
    expect(log.active[0].status).toBe('ready')
    expect(questsToClaim(log, slay.claimAt).length).toBe(1)
    expect(questProgressText(log.active[0])).toMatch(/Return to/)
    const claimed = claimQuest(log, slay.id)
    expect(claimed.quest.reward).toBe(slay.reward)
    expect(claimed.log.active.length).toBe(0)
    expect(roundOf(claimed.log, slay.giver)).toBe(1)
    expect(claimQuest(claimed.log, slay.id).quest).toBeNull() // cannot double-claim
  })

  it('handles each other quest type', () => {
    const base = { id: 'q#0', giver: 'g', claimAt: 'g', giverName: 'G', need: 1, progress: 0, status: 'active' }
    const run = (quest, event) => questEvent(acceptQuest(createQuestLog(), { ...base, ...quest }), event).log.active[0]
    expect(run({ type: 'hunt', monster: 'zippy', need: 2 }, { type: 'kill', monster: 'zippy' }).progress).toBe(1)
    expect(run({ type: 'hunt', monster: 'zippy', need: 2 }, { type: 'kill', monster: 'blobbo' }).progress).toBe(0)
    expect(run({ type: 'elite' }, { type: 'kill', monster: 'blobbo', elite: true }).status).toBe('ready')
    expect(run({ type: 'elite' }, { type: 'kill', monster: 'blobbo', elite: false }).status).toBe('active')
    expect(run({ type: 'gather', need: 10 }, { type: 'crystals', amount: 6 }).progress).toBe(6)
    expect(run({ type: 'gather', need: 10 }, { type: 'crystals', amount: 99 }).progress).toBe(10)
    expect(run({ type: 'explore', targetBiome: 'amethyst', targetName: 'x', targetVillageName: 'y' }, { type: 'enterBiome', biome: 'amethyst' }).status).toBe('ready')
    expect(run({ type: 'explore', targetBiome: 'amethyst' }, { type: 'enterBiome', biome: 'frostveil' }).status).toBe('active')
    expect(run({ type: 'deliver', targetNpc: 'v1:0', claimAt: 'v1:0' }, { type: 'talk', npcId: 'v1:0' }).status).toBe('ready')
    expect(run({ type: 'deliver', targetNpc: 'v1:0', claimAt: 'v1:0' }, { type: 'talk', npcId: 'v9:9' }).status).toBe('active')
  })

  it('has chat for anyone', () => {
    for (const n of allNpcs()) expect(ambientLine(n).length).toBeGreaterThan(10)
    expect(activeFrom(createQuestLog(), 'nobody')).toBeNull()
  })
})

import { npcDialog } from '../src/logic/quests.js'

describe('villager dialogue', () => {
  const npc = allNpcs()[0]
  it('offers a quest, then reports progress, then pays out', () => {
    let log = createQuestLog()
    const offer = npcDialog(log, npc)
    expect(offer.mode).toBe('offer')
    expect(offer.buttons.map((b) => b.id)).toEqual(['accept', 'close'])
    log = acceptQuest(log, offer.quest)
    expect(npcDialog(log, npc).mode).toBe('progress')
    const q = log.active[0]
    log = { ...log, active: [{ ...q, status: 'ready', progress: q.need }] }
    if (q.claimAt === npc.id) {
      const claim = npcDialog(log, npc)
      expect(claim.mode).toBe('claim')
      expect(claim.buttons[0].label).toContain(String(q.reward))
    }
  })

  it('refuses to hand out more when the log is full, and chats otherwise never crashes', () => {
    let log = createQuestLog()
    for (const n of allNpcs().slice(1, 4)) log = acceptQuest(log, questFor(n, 0))
    expect(log.active.length).toBe(MAX_ACTIVE_QUESTS)
    expect(npcDialog(log, npc).mode).toBe('full')
  })
})
