import { GAMEPAD_DEADZONE } from './config.js'
import { BUTTONS, gamepadActions } from './logic/gamepad.js'

// Tracks which keys and mouse buttons are currently held down. Later
// milestones (attacking, hiding) read mouse button state through the same
// isDown API, keyed by button index instead of a key code.
//
// A gamepad is polled once a frame (pollGamepad(), called from the
// animate() loop) rather than through events -- the Gamepad API has no
// per-button press/release events, only connect/disconnect. The actual
// Gamepad object is turned into a plain snapshot and handed to
// src/logic/gamepad.js's gamepadActions (pure, testable without a
// browser), which this class merges into the same query API callers
// already use: the movement query combines the keyboard with the
// gamepad's move vector, and a handful of dedicated was*Pressed/is*Down
// methods below OR a keyboard/mouse check with the gamepad's own action.
export class Input {
  constructor() {
    this.keys = new Set()
    this.mouseButtons = new Set()
    this._justPressed = new Set()
    this._justMousePressed = new Set()

    this._gamepadIndex = null // navigator.getGamepads() index of the pad we're following, or null if none
    this._activeGamepad = null // the real Gamepad object last polled, for rumble()
    this._prevGamepadSnapshot = null
    this._currGamepadSnapshot = null
    this._gamepadActions = gamepadActions(null, null, GAMEPAD_DEADZONE)
    // A gamepad button still physically held through clear() (e.g. the
    // one that dismissed the start card) shouldn't immediately read as
    // an attack on gameplay's first frame -- unlike a keyboard key,
    // polling would otherwise keep reporting it held every frame with
    // no release/press event to reset against. Cleared once both
    // buttons are actually released.
    this._suppressGamepadAttack = false

    this._onKeyDown = (event) => {
      // Guard against the browser's own key-repeat firing keydown
      // repeatedly while a key is held: only the up-to-down transition
      // counts as "just pressed".
      if (!this.keys.has(event.code)) this._justPressed.add(event.code)
      this.keys.add(event.code)
    }
    this._onKeyUp = (event) => this.keys.delete(event.code)
    this._onMouseDown = (event) => {
      this._justMousePressed.add(event.button)
      this.mouseButtons.add(event.button)
    }
    this._onMouseUp = (event) => this.mouseButtons.delete(event.button)
    this._onGamepadConnected = (event) => {
      this._gamepadIndex = event.gamepad.index
    }
    this._onGamepadDisconnected = (event) => {
      if (this._gamepadIndex !== event.gamepad.index) return
      this._gamepadIndex = null
      this._activeGamepad = null
      this._prevGamepadSnapshot = null
      this._currGamepadSnapshot = null
      this._gamepadActions = gamepadActions(null, null, GAMEPAD_DEADZONE)
    }

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    window.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mouseup', this._onMouseUp)
    window.addEventListener('gamepadconnected', this._onGamepadConnected)
    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected)
  }

  // True if the given KeyboardEvent.code (e.g. "KeyW", "ArrowUp") is held.
  isDown(code) {
    return this.keys.has(code)
  }

  // True if the given mouse button index (0 = left, 2 = right) is held.
  isMouseDown(button) {
    return this.mouseButtons.has(button)
  }

  // True only on the frame a key transitions from up to down (edge-
  // triggered: one press toggles something once, however long it's held).
  // Call endFrame() once per game loop tick to clear it afterward.
  wasPressed(code) {
    return this._justPressed.has(code)
  }

  // Like wasPressed, for a mouse button index.
  wasMousePressed(button) {
    return this._justMousePressed.has(button)
  }

  // This frame's movement vector, WASD/arrow keys combined with the
  // gamepad's left stick/d-pad (see src/logic/gamepad.js's moveVector),
  // in the same right-positive/forward-positive sense. Not normalized --
  // Player.update() normalizes the combined result itself, same as it
  // already did for the keyboard alone, so a keyboard key and the stick
  // pushed the same way don't add up to more than full speed.
  moveVector() {
    const forwardInput =
      (this.isDown('KeyW') || this.isDown('ArrowUp') ? 1 : 0) -
      (this.isDown('KeyS') || this.isDown('ArrowDown') ? 1 : 0)
    const strafeInput =
      (this.isDown('KeyD') || this.isDown('ArrowRight') ? 1 : 0) -
      (this.isDown('KeyA') || this.isDown('ArrowLeft') ? 1 : 0)
    return {
      x: strafeInput + this._gamepadActions.move.x,
      z: forwardInput + this._gamepadActions.move.z,
    }
  }

  // Attack: held, like Space/left click -- A or RT held swings just as
  // continuously as holding the keyboard/mouse equivalent does.
  isAttackDown() {
    return this.isMouseDown(0) || this.isDown('Space') || this._gamepadActions.attack
  }

  // Hide in / exit a pod: edge-triggered, like E.
  wasHidePressed() {
    return this.wasPressed('KeyE') || this._gamepadActions.hide
  }

  // Open the nearest chest: edge-triggered, like F.
  wasChestPressed() {
    return this.wasPressed('KeyF') || this._gamepadActions.chest
  }

  // Cycle the weapon hotbar backward/forward: LB/RB, edge-triggered.
  // No keyboard equivalent (1-5 jump straight to a slot instead).
  wasPrevWeaponPressed() {
    return this._gamepadActions.prevWeapon
  }

  wasNextWeaponPressed() {
    return this._gamepadActions.nextWeapon
  }

  // Ability `slot` (0-4, matching ABILITY_KEYS' Q Z X C V order):
  // edge-triggered, OR'd with the keyboard check at the call site.
  wasAbilityPressed(slot) {
    return this._gamepadActions.abilities[slot] === true
  }

  // Restart after losing: edge-triggered, like R.
  wasRestartPressed() {
    return this._gamepadActions.restart
  }

  // Mute/unmute: edge-triggered, like M.
  wasMutePressed() {
    return this._gamepadActions.mute
  }

  // Cutscene skip / start-card dismiss: edge-triggered, like
  // Space/Enter/a click.
  wasAdvancePressed() {
    return this._gamepadActions.advance
  }

  // Reads navigator.getGamepads() once a frame (call at the top of the
  // game loop, before any input is queried) and recomputes this frame's
  // gamepad actions. Silently does nothing if the Gamepad API isn't
  // available or no pad is connected -- every gamepad query above then
  // just falls through to its keyboard/mouse half, if it has one.
  pollGamepad() {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return
    let pads
    try {
      pads = navigator.getGamepads()
    } catch {
      return
    }
    const pad = this._gamepadIndex != null ? pads[this._gamepadIndex] : Array.from(pads).find((p) => p != null)
    this._activeGamepad = pad ?? null
    this._prevGamepadSnapshot = this._currGamepadSnapshot
    this._currGamepadSnapshot = pad ? { buttons: pad.buttons.map((b) => b.pressed), axes: pad.axes.slice() } : null
    this._gamepadActions = gamepadActions(this._prevGamepadSnapshot, this._currGamepadSnapshot, GAMEPAD_DEADZONE)

    if (this._suppressGamepadAttack) {
      const stillHeld =
        this._currGamepadSnapshot?.buttons[BUTTONS.A] === true || this._currGamepadSnapshot?.buttons[BUTTONS.RT] === true
      if (stillHeld) this._gamepadActions = { ...this._gamepadActions, attack: false }
      else this._suppressGamepadAttack = false
    }
  }

  // Pulses the active gamepad's rumble motors, if the browser/pad
  // support it -- guarded with optional chaining plus a try/catch so an
  // unsupported combination just no-ops instead of throwing. `strength`
  // is 0..1 for both the strong (low-frequency) and weak (high-frequency)
  // motors; `durationMs` is how long the pulse lasts.
  rumble(strength, durationMs) {
    try {
      this._activeGamepad?.vibrationActuator?.playEffect('dual-rumble', {
        duration: durationMs,
        strongMagnitude: strength,
        weakMagnitude: strength,
      })
    } catch {
      // Rumble is a nice-to-have; an unsupported pad/browser just skips it.
    }
  }

  endFrame() {
    this._justPressed.clear()
    this._justMousePressed.clear()
  }

  // Clears all currently-tracked key/mouse state. Used so the keypress or
  // click that dismisses the start card doesn't leak into the first frame
  // of gameplay as a held key or an attack press. A gamepad button held
  // through the same dismissal is suppressed the same way, until it's
  // released and pressed again (see pollGamepad()).
  clear() {
    this.keys.clear()
    this.mouseButtons.clear()
    this._justPressed.clear()
    this._justMousePressed.clear()
    this._suppressGamepadAttack =
      this._currGamepadSnapshot?.buttons[BUTTONS.A] === true || this._currGamepadSnapshot?.buttons[BUTTONS.RT] === true
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    window.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('gamepadconnected', this._onGamepadConnected)
    window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected)
  }
}
