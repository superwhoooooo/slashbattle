import { describe, expect, it } from 'vitest'
import { skyTowers, stepLaunch, createLaunchState, PAD_RADIUS } from '../src/logic/skyIslands.js'
import { CAMP_SIZE, CELL_COUNT, ISSUES, PARTS_COST, acceptFix, campKill, collectCell, finishFix, fixOf, fixProgressText, isTowerFixed, issueCamp, issueCells, jammedTowers, keeperDialog, keeperSpot, towerIssue } from '../src/logic/towerQuests.js'
import { createJournal, parseJournal, serializeJournal } from '../src/logic/wildsJournal.js'

const broken = () => skyTowers().filter((t) => towerIssue(t))
const kinds = () => new Set(broken().map((t) => towerIssue(t).kind))

describe('broken Skylift towers', () => {
  it('leaves some towers working (the starter first) and breaks the rest, with every kind of issue', () => {
    const all = skyTowers()
    expect(towerIssue(all[0])).toBe(null)
    expect(broken().length).toBeGreaterThanOrEqual(3)
    expect(broken().length).toBeLessThan(all.length)
    expect(kinds()).toEqual(new Set(Object.keys(ISSUES)))
    for (const t of broken()) {
      const i = towerIssue(t)
      expect(i.tale.length).toBeGreaterThan(40)
      expect(i.keeper).toBeTruthy()
      const k = keeperSpot(t)
      expect(Math.hypot(k.x - t.x, k.z - t.z)).toBeGreaterThan(8)
    }
  })

  it('a broken pad will not charge until it is fixed', () => {
    const t = broken()[0]
    const jammed = jammedTowers({})
    expect(jammed.has(t.id)).toBe(true)
    const on = { x: t.x, z: t.z, alt: t.y, now: 5 }
    expect(stepLaunch(createLaunchState(), { ...on, jammed }).events).toEqual([])
    expect(stepLaunch(createLaunchState(), { ...on, jammed: new Set() }).events[0].type).toBe('charge')
    expect(Math.hypot(0, 0)).toBeLessThan(PAD_RADIUS)
    expect(isTowerFixed(finishFix({}, t.id), t)).toBe(true)
    expect(jammedTowers(finishFix({}, t.id)).has(t.id)).toBe(false)
  })

  it('power cells and camps are seeded near the tower', () => {
    for (const t of broken()) {
      const cells = issueCells(t)
      expect(cells).toHaveLength(CELL_COUNT)
      for (const c of cells) expect(Math.hypot(c.x - t.x, c.z - t.z)).toBeLessThan(45)
      const camp = issueCamp(t)
      expect(camp).toHaveLength(CAMP_SIZE)
      expect(new Set(camp.map((m) => m.id)).size).toBe(CAMP_SIZE)
    }
  })

  it('cells and camp kills only count once the keeper\'s job is accepted, and finish the job', () => {
    const t = broken().find((x) => towerIssue(x).kind === 'cells')
    const cells = issueCells(t)
    expect(collectCell({}, t, cells[0].id).fixes).toEqual({})
    let f = acceptFix({}, t.id)
    expect(fixOf(f, t.id).stage).toBe('accepted')
    let out
    for (const c of cells) {
      out = collectCell(f, t, c.id)
      f = out.fixes
    }
    expect(out.done).toBe(true)
    expect(collectCell(f, t, cells[0].id).done).toBe(false) // already collected
    const c = broken().find((x) => towerIssue(x).kind === 'camp')
    let g = acceptFix({}, c.id)
    for (let i = 0; i < CAMP_SIZE; i++) {
      out = campKill(g, c)
      g = out.fixes
      expect(out.done).toBe(i === CAMP_SIZE - 1)
    }
    expect(campKill({}, c).fixes).toEqual({})
  })

  it('the keeper\'s dialogue follows the stage', () => {
    const t = broken().find((x) => towerIssue(x).kind === 'parts')
    expect(keeperDialog({}, t).buttons[0].id).toBe('accept')
    const f = acceptFix({}, t.id)
    expect(keeperDialog(f, t, PARTS_COST).buttons[0].id).toBe('pay')
    expect(keeperDialog(f, t, 0).text).toContain(String(PARTS_COST))
    expect(keeperDialog(finishFix(f, t.id), t).text).toMatch(/pad/)
    expect(fixProgressText(f, t)).toContain('crystals')
  })

  it('the journal keeps the fixes', () => {
    const t = broken()[0]
    const j = { ...createJournal(), fixes: finishFix(acceptFix({}, t.id), t.id) }
    const back = parseJournal(serializeJournal(j))
    expect(back.fixes[t.id].stage).toBe('done')
    expect(parseJournal('{"fixes":{"a":{"stage":"nonsense","n":-3}}}').fixes.a).toEqual({ stage: 'open', n: 0, cells: [] })
    expect(createJournal().fixes).toEqual({})
  })
})
