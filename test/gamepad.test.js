import { describe, expect, it } from 'vitest'
import { BUTTONS, applyDeadzone, gamepadActions, moveVector, pressedThisFrame } from '../src/logic/gamepad.js'

function snapshot({ buttons = [], axes = [0, 0, 0, 0] } = {}) {
  const padded = new Array(17).fill(false)
  buttons.forEach((down, index) => (padded[index] = down))
  return { buttons: padded, axes }
}

describe('applyDeadzone', () => {
  it('reports dead center for a displacement inside the deadzone', () => {
    expect(applyDeadzone(0.1, 0.05, 0.2)).toEqual({ x: 0, y: 0 })
  })

  it('reports dead center for a zero displacement', () => {
    expect(applyDeadzone(0, 0, 0.2)).toEqual({ x: 0, y: 0 })
  })

  it('rescales a displacement just past the deadzone back toward the full range', () => {
    const { x, y } = applyDeadzone(0.6, 0, 0.2)
    // (0.6 - 0.2) / (1 - 0.2) = 0.5
    expect(x).toBeCloseTo(0.5)
    expect(y).toBeCloseTo(0)
  })

  it('leaves a full-magnitude cardinal push at magnitude 1', () => {
    const { x, y } = applyDeadzone(1, 0, 0.2)
    expect(x).toBeCloseTo(1)
    expect(y).toBeCloseTo(0)
  })

  it('caps a diagonal push at magnitude 1 rather than letting it exceed it', () => {
    const { x, y } = applyDeadzone(1, 1, 0.2)
    expect(Math.hypot(x, y)).toBeCloseTo(1)
  })
})

describe('pressedThisFrame', () => {
  it('is true the frame a button transitions from up to down', () => {
    const prev = snapshot({ buttons: [false] })
    const curr = snapshot({ buttons: [true] })
    expect(pressedThisFrame(prev, curr, BUTTONS.A)).toBe(true)
  })

  it('is false while a button stays held across frames', () => {
    const prev = snapshot({ buttons: [true] })
    const curr = snapshot({ buttons: [true] })
    expect(pressedThisFrame(prev, curr, BUTTONS.A)).toBe(false)
  })

  it('is false once a button is released', () => {
    const prev = snapshot({ buttons: [true] })
    const curr = snapshot({ buttons: [false] })
    expect(pressedThisFrame(prev, curr, BUTTONS.A)).toBe(false)
  })

  it('treats a missing previous snapshot as everything up, so a button already down on the first polled frame still counts as just pressed', () => {
    const curr = snapshot({ buttons: [true] })
    expect(pressedThisFrame(null, curr, BUTTONS.A)).toBe(true)
  })
})

describe('moveVector', () => {
  it('is zero with no gamepad connected', () => {
    expect(moveVector(null, 0.2)).toEqual({ x: 0, z: 0 })
  })

  it('is zero with the stick at rest', () => {
    expect(moveVector(snapshot({ axes: [0, 0, 0, 0] }), 0.2)).toEqual({ x: 0, z: 0 })
  })

  it('maps the stick pushed up to forward-positive', () => {
    const { x, z } = moveVector(snapshot({ axes: [0, -1, 0, 0] }), 0.2)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(1)
  })

  it('maps the stick pushed right to strafe-positive', () => {
    const { x, z } = moveVector(snapshot({ axes: [1, 0, 0, 0] }), 0.2)
    expect(x).toBeCloseTo(1)
    expect(z).toBeCloseTo(0)
  })

  it('falls back to the d-pad when the stick is at rest', () => {
    const curr = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.DPAD_UP]: true }) })
    const { x, z } = moveVector(curr, 0.2)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(1)
  })

  it('caps a combined diagonal push at magnitude 1', () => {
    const curr = snapshot({ axes: [1, -1, 0, 0] })
    const { x, z } = moveVector(curr, 0.2)
    expect(Math.hypot(x, z)).toBeCloseTo(1)
  })
})

describe('gamepadActions', () => {
  it('returns every action false/zero with no gamepad connected', () => {
    const actions = gamepadActions(null, null, 0.2)
    expect(actions.move).toEqual({ x: 0, z: 0 })
    expect(actions.attack).toBe(false)
    expect(actions.hide).toBe(false)
    expect(actions.chest).toBe(false)
    expect(actions.prevWeapon).toBe(false)
    expect(actions.nextWeapon).toBe(false)
    expect(actions.abilities).toEqual([false, false, false, false, false])
    expect(actions.restart).toBe(false)
    expect(actions.mute).toBe(false)
    expect(actions.advance).toBe(false)
  })

  it('attacks while A is held', () => {
    const curr = snapshot({ buttons: [true] })
    expect(gamepadActions(null, curr, 0.2).attack).toBe(true)
  })

  it('attacks while RT is held', () => {
    const curr = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.RT]: true }) })
    expect(gamepadActions(null, curr, 0.2).attack).toBe(true)
  })

  it('edge-triggers hide on B, one press per transition', () => {
    const up = snapshot({ buttons: [] })
    const down = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.B]: true }) })
    expect(gamepadActions(up, down, 0.2).hide).toBe(true)
    expect(gamepadActions(down, down, 0.2).hide).toBe(false)
  })

  it('edge-triggers chest on X', () => {
    const up = snapshot({ buttons: [] })
    const down = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.X]: true }) })
    expect(gamepadActions(up, down, 0.2).chest).toBe(true)
  })

  it('edge-triggers the previous/next weapon cycle on LB/RB', () => {
    const up = snapshot({ buttons: [] })
    const lb = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LB]: true }) })
    const rb = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.RB]: true }) })
    expect(gamepadActions(up, lb, 0.2).prevWeapon).toBe(true)
    expect(gamepadActions(up, rb, 0.2).nextWeapon).toBe(true)
  })

  it('maps Y alone to ability slot 0', () => {
    const up = snapshot({ buttons: [] })
    const y = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.Y]: true }) })
    expect(gamepadActions(up, y, 0.2).abilities).toEqual([true, false, false, false, false])
  })

  it('maps LT held + Y/A/B/X to ability slots 1-4', () => {
    const up = snapshot({ buttons: [] })
    const ltY = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.Y]: true }) })
    const ltA = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.A]: true }) })
    const ltB = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.B]: true }) })
    const ltX = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.X]: true }) })
    expect(gamepadActions(up, ltY, 0.2).abilities).toEqual([false, true, false, false, false])
    expect(gamepadActions(up, ltA, 0.2).abilities).toEqual([false, false, true, false, false])
    expect(gamepadActions(up, ltB, 0.2).abilities).toEqual([false, false, false, true, false])
    expect(gamepadActions(up, ltX, 0.2).abilities).toEqual([false, false, false, false, true])
  })

  it('does not also attack, hide or open a chest while LT turns A/B/X into abilities', () => {
    const up = snapshot({ buttons: [] })
    const ltA = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.A]: true }) })
    const ltB = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.B]: true }) })
    const ltX = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.X]: true }) })
    expect(gamepadActions(up, ltA, 0.2).attack).toBe(false)
    expect(gamepadActions(up, ltB, 0.2).hide).toBe(false)
    expect(gamepadActions(up, ltX, 0.2).chest).toBe(false)
  })

  it('still attacks with RT while LT is held', () => {
    const up = snapshot({ buttons: [] })
    const ltRt = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.LT]: true, [BUTTONS.RT]: true }) })
    expect(gamepadActions(up, ltRt, 0.2).attack).toBe(true)
  })

  it('edge-triggers restart on Start and mute on Back', () => {
    const up = snapshot({ buttons: [] })
    const start = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.START]: true }) })
    const back = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.BACK]: true }) })
    expect(gamepadActions(up, start, 0.2).restart).toBe(true)
    expect(gamepadActions(up, back, 0.2).mute).toBe(true)
  })

  it('edge-triggers advance (cutscene skip / start-card dismiss) on A or Start', () => {
    const up = snapshot({ buttons: [] })
    const a = snapshot({ buttons: [true] })
    const start = snapshot({ buttons: Object.assign(new Array(16).fill(false), { [BUTTONS.START]: true }) })
    expect(gamepadActions(up, a, 0.2).advance).toBe(true)
    expect(gamepadActions(up, start, 0.2).advance).toBe(true)
  })
})
