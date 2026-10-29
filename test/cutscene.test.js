import { describe, expect, it } from 'vitest'
import {
  CUTSCENE_ENTER_DURATION,
  CUTSCENE_TITLE_DURATION,
  createCutscene,
  introLines,
  speakerFor,
  stepCutscene,
  visibleChars,
} from '../src/logic/cutscene.js'

const lines = ['Hello there!', 'Bye now.']
const boss = { name: 'KING GLOOP' }

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

describe('introLines', () => {
  it("prepends a concierge line ahead of the boss's own lines", () => {
    const script = introLines(boss.name, lines)
    expect(script).toHaveLength(lines.length + 1)
    expect(script[0]).toContain(boss.name)
    expect(script.slice(1)).toEqual(lines)
  })
})

describe('speakerFor', () => {
  it('credits the concierge for line 0 and the boss for every line after', () => {
    expect(speakerFor(boss, 0)).toBe('Concierge')
    expect(speakerFor(boss, 1)).toBe(boss.name)
    expect(speakerFor(boss, 2)).toBe(boss.name)
  })
})

describe('stepCutscene with a concierge line prepended', () => {
  const script = introLines(boss.name, lines)

  it('skip-ahead still advances through the concierge line, then every boss line, before the title card', () => {
    let s = { phase: 'talk', phaseElapsed: 0, lineIndex: 0, lineElapsed: 99 } // concierge line already typed out
    s = stepCutscene(s, 0.05, true, script)
    expect(s.lineIndex).toBe(1) // boss's first line
    s = { ...s, lineElapsed: 99 }
    s = stepCutscene(s, 0.05, true, script)
    expect(s.lineIndex).toBe(2) // boss's second (last) line
    s = { ...s, lineElapsed: 99 }
    s = stepCutscene(s, 0.05, true, script)
    expect(s.phase).toBe('title')
  })
})
