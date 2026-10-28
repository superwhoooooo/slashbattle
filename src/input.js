// Tracks which keys and mouse buttons are currently held down. Later
// milestones (attacking, hiding) read mouse button state through the same
// isDown API, keyed by button index instead of a key code.
export class Input {
  constructor() {
    this.keys = new Set()
    this.mouseButtons = new Set()
    this._justPressed = new Set()
    this._justMousePressed = new Set()

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

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    window.addEventListener('mousedown', this._onMouseDown)
    window.addEventListener('mouseup', this._onMouseUp)
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

  endFrame() {
    this._justPressed.clear()
    this._justMousePressed.clear()
  }

  // Clears all currently-tracked key/mouse state. Used so the keypress or
  // click that dismisses the start card doesn't leak into the first frame
  // of gameplay as a held key or an attack press.
  clear() {
    this.keys.clear()
    this.mouseButtons.clear()
    this._justPressed.clear()
    this._justMousePressed.clear()
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    window.removeEventListener('mousedown', this._onMouseDown)
    window.removeEventListener('mouseup', this._onMouseUp)
  }
}
