import { describe, expect, it } from 'vitest'
import { TUTORIAL_CHAPTERS, TUTORIAL_STEPS, advanceTutorial, createTutorial, skipTutorialStep, tutorialDone } from '../src/logic/tutorial.js'

describe('tutorial', () => {
  it('ignores events for other steps', () => {
    const { state, completed } = advanceTutorial(createTutorial(), { type: 'kill' })
    expect(state).toEqual(createTutorial())
    expect(completed).toBe(false)
  })

  it('accumulates progress then moves to the next step', () => {
    let s = createTutorial()
    s = advanceTutorial(s, { type: 'move', amount: 4 }).state
    expect(s.step).toBe(0)
    const r = advanceTutorial(s, { type: 'move', amount: 4 })
    expect(r.completed).toBe(true)
    expect(r.state).toEqual({ step: 1, progress: 0 })
  })

  it('finishes after every step', () => {
    let s = createTutorial()
    for (const step of TUTORIAL_STEPS) s = advanceTutorial(s, { type: step.event, amount: step.need, target: step.target }).state
    expect(tutorialDone(s)).toBe(true)
  })

  it('only counts kills of the step\'s target type', () => {
    const at = TUTORIAL_STEPS.findIndex((st) => st.target === 'mirror')
    const s = { step: at, progress: 0 }
    expect(advanceTutorial(s, { type: 'kill', target: 'blobbo' }).completed).toBe(false)
    expect(advanceTutorial(s, { type: 'kill', target: 'mirror' }).completed).toBe(true)
  })

  it('can skip a step, but not past the end', () => {
    expect(skipTutorialStep(createTutorial())).toEqual({ step: 1, progress: 0 })
    const end = { step: TUTORIAL_STEPS.length, progress: 0 }
    expect(skipTutorialStep(end)).toBe(end)
  })

  it('groups steps into chapters in order, each with text', () => {
    let last = 0
    for (const step of TUTORIAL_STEPS) {
      expect(step.chapter).toBeGreaterThanOrEqual(last)
      expect(step.chapter).toBeLessThan(TUTORIAL_CHAPTERS.length)
      expect(step.hint.length).toBeGreaterThan(10)
      if (!step.read && !step.desktopOnly) expect(step.touch.length).toBeGreaterThan(5)
      last = step.chapter
    }
    expect(new Set(TUTORIAL_STEPS.map((st) => st.chapter)).size).toBe(TUTORIAL_CHAPTERS.length)
  })
})
