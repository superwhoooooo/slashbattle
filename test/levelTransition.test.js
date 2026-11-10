import { describe, expect, it } from 'vitest'
import { TRANSITION, createTransition, stepTransition, transitionFrame, transitionLength } from '../src/logic/levelTransition.js'

describe('the hyperspace jump between places', () => {
  it('lets play go on for a moment before freezing for the jump', () => {
    expect(transitionFrame(0.5).frozen).toBe(false)
    expect(transitionFrame(0.5).streaks).toBe(0)
    expect(transitionFrame(TRANSITION.wait + 0.1).frozen).toBe(true)
  })

  it('builds the streaks through the charge and ends it in full white', () => {
    const a = transitionFrame(TRANSITION.wait + 0.2)
    const b = transitionFrame(TRANSITION.wait + 0.9)
    expect(b.streaks).toBeGreaterThan(a.streaks)
    expect(a.flash).toBe(0)
    expect(transitionFrame(TRANSITION.wait + TRANSITION.charge + 0.05)).toMatchObject({ phase: 'hold', flash: 1 })
  })

  it('swaps the place exactly once, behind the white, then arrives once', () => {
    let state = createTransition(2)
    let swaps = 0
    let arrivals = 0
    let swapFlash = null
    for (let i = 0; i < 400; i++) {
      const step = stepTransition(state, 1 / 60)
      state = step.state
      if (step.swapNow) {
        swaps++
        swapFlash = step.frame.flash
      }
      if (step.arriveNow) {
        arrivals++
        expect(swaps).toBe(1) // the new place is there before the reveal
      }
    }
    expect(swaps).toBe(1)
    expect(arrivals).toBe(1)
    expect(swapFlash).toBe(1)
    expect(state.levelIndex).toBe(2)
  })

  it('swoops the camera down from high above and clears the white during the reveal', () => {
    const start = TRANSITION.wait + TRANSITION.charge + TRANSITION.hold
    const early = transitionFrame(start + 0.05)
    const late = transitionFrame(start + TRANSITION.reveal * 0.8)
    expect(early.camLift).toBeGreaterThan(late.camLift)
    expect(early.flash).toBeGreaterThan(late.flash)
    expect(late.flash).toBeLessThan(0.05)
  })

  it('finishes and hands control back', () => {
    const end = transitionFrame(transitionLength() + 0.01)
    expect(end).toMatchObject({ done: true, frozen: false, flash: 0, streaks: 0, camLift: 0 })
  })
})
