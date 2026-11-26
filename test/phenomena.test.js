import { describe, expect, it } from 'vitest'
import {
  CLEAR_REWARD, COLD, PHENOMENA, PHENOMENON_LIST, PHENOMENON_ORDER, PHENOMENON_RADIUS, STORM_FADE, advanceStage, clearedCount, coldDamagePerSecond, coldSlow, coldStep,
  collectItem, createHold, createTrial, emberSpot, gustPush, heroForStorms, isCleared, phenomenonEye, progressOf, progressText, purgeKill, sporeSpot,
  stageCount, stagePoints, stageReward, startPhenomenon, stepHold, stepTrial, stormAt, stormIntensity, stormMonsters,
} from '../src/logic/phenomena.js'
import { biomeAt } from '../src/logic/world.js'
import { MILESTONES, createJournal, journalStat, parseJournal, readyMilestones, serializeJournal } from '../src/logic/wildsJournal.js'

describe('the four regional phenomena', () => {
  it('are four storms, each on its own Heartland biome, with six stages ending in a boss', () => {
    expect(PHENOMENON_ORDER).toHaveLength(4)
    expect(new Set(PHENOMENON_LIST.map((p) => p.biome)).size).toBe(4)
    for (const ph of PHENOMENON_LIST) {
      expect(ph.stages).toHaveLength(6)
      expect(ph.stages[0].kind).toBe('seek')
      expect(ph.stages[5].kind).toBe('boss')
      expect(new Set(ph.stages.map((s) => s.kind)).size).toBeGreaterThanOrEqual(5) // a real variety of things to do
      expect(stormMonsters(ph.id).length).toBeGreaterThan(0)
    }
  })
  it('each sit in their own biome, far apart, and are deterministic', () => {
    const eyes = PHENOMENON_LIST.map((p) => ({ id: p.id, ...phenomenonEye(p.id) }))
    for (const e of eyes) {
      expect(biomeAt(e.x, e.z)).toBe(PHENOMENA[e.id].biome)
      expect(phenomenonEye(e.id)).toEqual(phenomenonEye(e.id))
    }
    for (let i = 0; i < eyes.length; i++) for (let j = i + 1; j < eyes.length; j++) {
      expect(Math.hypot(eyes[i].x - eyes[j].x, eyes[i].z - eyes[j].z)).toBeGreaterThan(PHENOMENON_RADIUS * 2)
    }
  })
  it('the storm blows at full strength inside the wall and fades beyond it', () => {
    const eye = phenomenonEye('sandstorm')
    expect(stormIntensity('sandstorm', eye.x, eye.z)).toBe(1)
    expect(stormIntensity('sandstorm', eye.x + PHENOMENON_RADIUS + STORM_FADE / 2, eye.z)).toBeCloseTo(0.5, 1)
    expect(stormIntensity('sandstorm', eye.x + PHENOMENON_RADIUS + 200, eye.z)).toBe(0)
    expect(stormIntensity('sandstorm', eye.x, eye.z, true)).toBe(0)
    expect(stormAt(eye.x, eye.z)).toBe('sandstorm')
    expect(stormAt(0, 0)).toBe(null)
  })
  it('every stage has points inside the storm', () => {
    for (const ph of PHENOMENON_LIST) {
      const eye = phenomenonEye(ph.id)
      ph.stages.forEach((stage, i) => {
        const pts = stagePoints(ph.id, i)
        expect(pts.length).toBe(stage.kind === 'collect' ? stage.n : stage.kind === 'trial' ? stage.gates : stage.kind === 'purge' ? 0 : 1)
        for (const pt of pts) expect(Math.hypot(pt.x - eye.x, pt.z - eye.z)).toBeLessThanOrEqual(PHENOMENON_RADIUS)
        expect(new Set(pts.map((p) => p.id)).size).toBe(pts.length)
        expect(stagePoints(ph.id, i)).toEqual(pts)
      })
    }
  })
})

describe('progress', () => {
  it('walks a storm through every stage, collects and purges, and clears', () => {
    let ph = {}
    ph = startPhenomenon(ph, 'sandstorm')
    expect(progressOf(ph, 'sandstorm').started).toBe(true)
    expect(isCleared(ph, 'sandstorm')).toBe(false)
    ph = advanceStage(ph, 'sandstorm').phenomena // seek done
    const stones = stagePoints('sandstorm', 1)
    let out
    for (const s of stones) out = collectItem(ph, 'sandstorm', s.id), ph = out.phenomena
    expect(out.done).toBe(true)
    expect(collectItem(ph, 'sandstorm', stones[0].id).done).toBe(false) // no double counting
    ph = advanceStage(ph, 'sandstorm').phenomena
    expect(purgeKill(startPhenomenon({}, 'sandstorm'), 'sandstorm').done).toBe(false) // not a purge stage: ignored
    const stage = PHENOMENA.sandstorm.stages[2]
    for (let i = 0; i < stage.n; i++) out = purgeKill(ph, 'sandstorm'), ph = out.phenomena
    expect(out.done).toBe(true)
    let last
    while (!isCleared(ph, 'sandstorm')) last = advanceStage(ph, 'sandstorm'), ph = last.phenomena
    expect(last.cleared).toBe(true)
    expect(progressOf(ph, 'sandstorm').stage).toBe(stageCount('sandstorm'))
    expect(progressText(ph, 'sandstorm')).toBe('Calmed')
    expect(advanceStage(ph, 'sandstorm').phenomena).toBe(ph)
  })
  it('rewards climb with the stage, and the finale is big', () => {
    expect(stageReward(5)).toBeGreaterThan(stageReward(0))
    expect(CLEAR_REWARD).toBeGreaterThan(stageReward(5) * 2)
  })
  it('saves in the journal, drops junk, and pays milestones', () => {
    let ph = startPhenomenon({}, 'whiteout')
    ph = advanceStage(ph, 'whiteout').phenomena
    const j = parseJournal(serializeJournal({ ...createJournal(), phenomena: { ...ph, bogus: { stage: 3 }, miasma: { stage: 99, n: -4, got: [1, 'a'] } } }))
    expect(j.phenomena.whiteout).toMatchObject({ started: true, stage: 1 })
    expect(j.phenomena.bogus).toBeUndefined()
    expect(j.phenomena.miasma).toMatchObject({ stage: stageCount('miasma'), n: 0, got: ['a'] })
    expect(parseJournal('junk').phenomena).toEqual({})
    expect(journalStat(j, 'storms')).toBe(1) // miasma clamped to done
    expect(readyMilestones(j).some((m) => m.id === 'storms1')).toBe(true)
    expect(MILESTONES.find((m) => m.id === 'storms4').need).toBe(4)
  })
  it('the fourth secret hero comes only with all four storms calmed', () => {
    expect(heroForStorms(3)).toBe(null)
    expect(heroForStorms(4)).toBe('tempest')
    const done = Object.fromEntries(PHENOMENON_ORDER.map((id) => [id, { started: true, stage: stageCount(id), n: 0, got: [] }]))
    expect(clearedCount(done)).toBe(4)
    expect(clearedCount({})).toBe(0)
  })
})

describe('holds and gate runs', () => {
  const stage = PHENOMENA.sandstorm.stages[3]
  it('a hold fills while you stand in the ring, drains slowly outside, and sends waves', () => {
    let s = createHold()
    let waves = 0
    let out
    for (let t = 0; t < 10; t += 0.5) {
      out = stepHold(s, stage, { inside: true, dt: 0.5 })
      s = out.state
      waves += out.waves
    }
    expect(s.progress).toBeCloseTo(10, 5)
    expect(waves).toBeGreaterThanOrEqual(1)
    const before = s.progress
    s = stepHold(s, stage, { inside: false, dt: 2 }).state
    expect(s.progress).toBeCloseTo(before - 1, 5)
    for (let t = 0; t < 200 && !out.done; t += 0.5) out = stepHold(out.state, stage, { inside: true, dt: 0.5 })
    expect(out.done).toBe(true)
    expect(stepHold(createHold(), stage, { inside: false, dt: 5 }).state.progress).toBe(0)
  })
  it('a trial starts at gate 1, passes gates in order, can fail on time and can be finished', () => {
    const trial = PHENOMENA.sandstorm.stages[4]
    const gates = stagePoints('sandstorm', 4)
    let out = stepTrial(createTrial(), trial, gates, { x: gates[2].x, z: gates[2].z, dt: 0.1 })
    expect(out.passed).toBe(null) // gates must be taken in order
    out = stepTrial(out.state, trial, gates, { x: gates[0].x, z: gates[0].z, dt: 0.1 })
    expect(out.passed).toBe(0)
    expect(out.state.running).toBe(true)
    const late = stepTrial(out.state, trial, gates, { x: 0, z: 0, dt: trial.secs + 1 })
    expect(late.failed).toBe(true)
    expect(late.state).toEqual(createTrial())
    let s = out.state
    for (let i = 1; i < gates.length; i++) {
      out = stepTrial(s, trial, gates, { x: gates[i].x, z: gates[i].z, dt: 1 })
      s = out.state
    }
    expect(out.done).toBe(true)
  })
})

describe('the hazards', () => {
  it('gusts wander and blow harder when you are deep in', () => {
    const a = gustPush(3, 1)
    expect(Math.hypot(a.x, a.z)).toBeGreaterThan(1)
    expect(Math.hypot(gustPush(3, 0.5).x, gustPush(3, 0.5).z)).toBeLessThan(Math.hypot(a.x, a.z))
    expect(gustPush(3, 1)).toEqual(a)
  })
  it('the cold climbs over about 26 s, fires warm you, and a freezing body suffers', () => {
    let cold = 0
    for (let t = 0; t < 27; t++) cold = coldStep(cold, 1)
    expect(cold).toBe(1)
    expect(coldDamagePerSecond(1, 100)).toBeGreaterThan(0)
    expect(coldDamagePerSecond(0.9, 100)).toBe(0)
    expect(coldSlow(0)).toBe(1)
    expect(coldSlow(1)).toBeCloseTo(1 - COLD.slow, 5)
    expect(coldStep(1, 1, { warm: true })).toBeLessThan(1)
    expect(coldStep(0, 10, { warm: true })).toBe(0)
  })
  it('embers land near the player (some right on them); spores never land on top of them', () => {
    const player = { x: 10, z: 10 }
    let i = 0
    const rand = () => ((i++ * 0.6180339) % 1)
    for (let n = 0; n < 40; n++) {
      const e = emberSpot(rand, player)
      expect(Math.hypot(e.x - player.x, e.z - player.z)).toBeLessThanOrEqual(15.01)
      const s = sporeSpot(rand, player)
      expect(Math.hypot(s.x - player.x, s.z - player.z)).toBeGreaterThanOrEqual(4.49)
    }
  })
})

describe('storm temple bosses', () => {
  it('each storm ends with its own element champion', async () => {
    const { COLOSSEUM_BOSS_FOR } = await import('../src/logic/bosses.js')
    for (const id of Object.keys(PHENOMENA)) {
      const stage = PHENOMENA[id].stages.find((st) => st.kind === 'boss')
      expect(stage.boss).toBe(COLOSSEUM_BOSS_FOR[id])
    }
    expect(PHENOMENA.miasma.stages.find((st) => st.kind === 'boss').boss).toBe('boss_mire')
  })
})
