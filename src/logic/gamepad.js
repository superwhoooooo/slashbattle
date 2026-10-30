// Pure, Three-free gamepad mapping: turns a plain snapshot of a
// "standard"-mapping Gamepad API pad ({ buttons: [bool...], axes:
// [number...] }) into the actions the game understands, so src/input.js
// can merge them into the same keyboard/mouse query API callers already
// use. No Three.js (or Gamepad API) imports, so this is covered by
// Vitest without a browser context -- src/input.js is the one place that
// turns a real Gamepad object into the plain snapshot this expects.

// Standard gamepad button indices (navigator.getGamepads()' "standard"
// mapping). Bindings:
//   A (0)      attack (held) / advance (cutscene skip, start-card dismiss)
//   B (1)      hide in / exit a pod
//   X (2)      open a chest
//   Y (3)      ability slot 0
//   LB (4)     previous weapon
//   RB (5)     next weapon
//   LT (6)     held: turns Y/A/B/X into ability slots 1-4 instead of
//              their own action below
//   RT (7)     attack (held, same as A)
//   Back (8)   mute
//   Start (9)  restart / advance (cutscene skip, start-card dismiss)
//   D-pad (12-15) digital movement fallback alongside the left stick
//
// Up to 5 abilities (Q Z X C V on keyboard) fit on 4 face buttons plus
// one modifier: Y alone is slot 0; holding LT turns Y/A/B/X into slots
// 1-4. While LT is held, A/B/X only fire their ability slot -- they
// don't also attack, hide or open a chest (RT still attacks).
export const BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
}

// Radial deadzone: a stick displacement at or under `deadzone` reports
// as dead center, and anything past it is rescaled back up across the
// full 0..1 range (rather than jumping straight from 0 to whatever's
// left over past the deadzone), so the stick still reaches magnitude 1
// right at its physical edge. The result is also capped at magnitude 1,
// since a diagonal push can exceed 1 before rescaling.
export function applyDeadzone(x, y, deadzone) {
  const magnitude = Math.hypot(x, y)
  if (magnitude === 0 || magnitude <= deadzone) return { x: 0, y: 0 }
  const rescaled = Math.min((magnitude - deadzone) / (1 - deadzone), 1)
  const scale = rescaled / magnitude
  return { x: x * scale, y: y * scale }
}

function buttonDown(snapshot, index) {
  return snapshot != null && snapshot.buttons[index] === true
}

// True only the frame `index` transitions from up to down between two
// snapshots -- mirrors src/input.js's own wasPressed/wasMousePressed, so
// one press triggers one action regardless of how long the button stays
// held afterward. `prev` may be null (no previous snapshot yet, e.g. the
// pad's first polled frame), which is treated as everything up.
export function pressedThisFrame(prev, curr, index) {
  return buttonDown(curr, index) && !buttonDown(prev, index)
}

// This frame's move vector: the left stick (axes 0/1, deadzone applied)
// plus the d-pad as a digital fallback, summed and capped at magnitude
// 1. Returned as { x, z } in the same right/forward sense WASD already
// uses (x: right-positive, z: forward-positive) -- a standard pad's
// stick Y axis is up-negative, the opposite sense, hence the negation.
export function moveVector(snapshot, deadzone) {
  if (snapshot == null) return { x: 0, z: 0 }
  const stick = applyDeadzone(snapshot.axes[0] ?? 0, snapshot.axes[1] ?? 0, deadzone)
  const dpadX = (buttonDown(snapshot, BUTTONS.DPAD_RIGHT) ? 1 : 0) - (buttonDown(snapshot, BUTTONS.DPAD_LEFT) ? 1 : 0)
  const dpadZ = (buttonDown(snapshot, BUTTONS.DPAD_UP) ? 1 : 0) - (buttonDown(snapshot, BUTTONS.DPAD_DOWN) ? 1 : 0)
  const x = stick.x + dpadX
  const z = -stick.y + dpadZ
  const magnitude = Math.hypot(x, z)
  if (magnitude === 0 || magnitude <= 1) return { x, z }
  return { x: x / magnitude, z: z / magnitude }
}

// Maps one frame's gamepad snapshots to every action the game reads,
// shaped to match what callers already query through src/input.js:
// a move vector, attack as a held state, and everything else
// edge-triggered (one press, one action). `prev` is the previous
// frame's snapshot (or null on the first polled frame); either may be
// null when no pad is connected, in which case every action comes back
// false/zero.
export function gamepadActions(prev, curr, deadzone) {
  const ltHeld = buttonDown(curr, BUTTONS.LT)
  const yEdge = pressedThisFrame(prev, curr, BUTTONS.Y)
  const aEdge = pressedThisFrame(prev, curr, BUTTONS.A)
  const bEdge = pressedThisFrame(prev, curr, BUTTONS.B)
  const xEdge = pressedThisFrame(prev, curr, BUTTONS.X)
  return {
    move: moveVector(curr, deadzone),
    attack: (!ltHeld && buttonDown(curr, BUTTONS.A)) || buttonDown(curr, BUTTONS.RT),
    hide: !ltHeld && bEdge,
    chest: !ltHeld && xEdge,
    prevWeapon: pressedThisFrame(prev, curr, BUTTONS.LB),
    nextWeapon: pressedThisFrame(prev, curr, BUTTONS.RB),
    // Slot 0 is Y alone; slots 1-4 are LT held plus Y/A/B/X (see the
    // mapping comment above BUTTONS).
    abilities: [!ltHeld && yEdge, ltHeld && yEdge, ltHeld && aEdge, ltHeld && bEdge, ltHeld && xEdge],
    restart: pressedThisFrame(prev, curr, BUTTONS.START),
    mute: pressedThisFrame(prev, curr, BUTTONS.BACK),
    advance: (!ltHeld && aEdge) || pressedThisFrame(prev, curr, BUTTONS.START),
  }
}
