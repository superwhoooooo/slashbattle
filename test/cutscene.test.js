import { describe, expect, it } from 'vitest'
import {
  CUTSCENE_ENTER_DURATION,
  CUTSCENE_TITLE_DURATION,
  createCutscene,
  stepCutscene,
  visibleChars,
} from '../src/logic/cutscene.js'

const lines = ['Hello there!', 'Bye now.']

function run(state, seconds, advance = false, dt = 0.05) {
  let s = state
  for (let t = 0; t < seconds; t += dt) s = stepCutscene(s, dt, advance && t === 0, lines)
  return s
}

describe('visibleChars', () => {
  it('types out gradually and never past the end', () => {
    expect(visibleChars('abc', 0)).toBe(0)
    expect(visibleChars('abcdefghij'.repeat(10), 0.5)).toBeGreaterThan(0)
    expect(visibleChars('abc', 100)).toBe(3)
  })
})

describe('stepCutscene', () => {
  it('goes enter -> talk -> title -> done on its own', () => {
    let s = createCutscene()
    expect(s.phase).toBe('enter')
    s = run(s, CUTSCENE_ENTER_DURATION + 0.2)
    expect(s.phase).toBe('talk')
    expect(s.lineIndex).toBe(0)
    s = run(s, 30)
    expect(['title', 'done']).toContain(s.phase)
    s = run(s, CUTSCENE_TITLE_DURATION + 0.2)
    expect(s.phase).toBe('done')
  })

  it('first advance finishes typing the line, the second moves to the next', () => {
    let s = { phase: 'talk', phaseElapsed: 0, lineIndex: 0, lineElapsed: 0 }
    s = stepCutscene(s, 0.05, true, lines)
    expect(s.lineIndex).toBe(0)
    expect(visibleChars(lines[0], s.lineElapsed)).toBe(lines[0].length)
    s = stepCutscene(s, 0.05, true, lines)
    expect(s.lineIndex).toBe(1)
    expect(s.lineElapsed).toBe(0)
  })

  it('advancing past the last line shows the name card, and again ends it', () => {
    let s = { phase: 'talk', phaseElapsed: 0, lineIndex: 1, lineElapsed: 99 }
    s = stepCutscene(s, 0.05, true, lines)
    expect(s.phase).toBe('title')
    s = stepCutscene(s, 0.05, true, lines)
    expect(s.phase).toBe('done')
  })

  it('can skip the enter phase', () => {
    expect(stepCutscene(createCutscene(), 0.05, true, lines).phase).toBe('talk')
  })

  it('does not mutate the state passed in', () => {
    const s = createCutscene()
    stepCutscene(s, 1, false, lines)
    expect(s).toEqual(createCutscene())
  })
})
