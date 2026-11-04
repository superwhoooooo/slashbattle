import { describe, expect, it } from 'vitest'
import { TUTORIAL_STEPS, advanceTutorial, createTutorial, tutorialDone } from '../src/logic/tutorial.js'

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
    for (const step of TUTORIAL_STEPS) s = advanceTutorial(s, { type: step.event, amount: step.need }).state
    expect(tutorialDone(s)).toBe(true)
  })
})
