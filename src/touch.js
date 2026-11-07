import { ABILITY_KEYS, HOTBAR_KEYS } from './logic/items.js'

// On-screen touch controls, for phones and tablets. Everything feeds the
// same Input the keyboard and gamepad do:
//   left thumb   - a floating stick that moves you
//   right thumb  - a floating stick that aims AND attacks: touching it
//                  swings / shoots, dragging picks the direction
//   HIDE / CHEST - E and F (hide in a pod, open a chest)
//   DIVE / 1ST   - Shift (dive in a water room) and 0 (first person; the aim stick turns the view)
//   AUTO / MUTE  - L (auto-shoot) and M (sound)
//   hotbar and ability slots - tap to pick a weapon / use an ability
//   tap the game-over card to restart; tap anywhere to skip cutscene lines
// Shown only on a coarse pointer (a phone or tablet), or with #touch in
// the address for testing on a desktop.

const STICK_RADIUS = 56 // px a finger can drag from where it landed
const MOVE_DEADZONE = 0.18
const AIM_DEADZONE = 0.3 // below this, an attack just uses your facing

export function isTouchDevice() {
  try {
    if (window.location.hash === '#touch') return true
    return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches
  } catch {
    return false
  }
}

function el(tag, id, className, text) {
  const node = document.createElement(tag)
  if (id) node.id = id
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

// A floating stick: lands where the finger does, drags up to STICK_RADIUS.
// onChange(x, y, strength) gets the clamped drag (-1..1, y down), onEnd()
// fires when the finger lifts.
function attachStick(zone, { onStart, onChange, onEnd }) {
  const base = el('div', null, 'touch-stick')
  const knob = el('div', null, 'touch-knob')
  base.appendChild(knob)
  zone.appendChild(base)
  let pointerId = null
  let originX = 0
  let originY = 0

  const place = (x, y) => {
    const rect = zone.getBoundingClientRect()
    base.style.left = `${x - rect.left}px`
    base.style.top = `${y - rect.top}px`
  }

  zone.addEventListener('pointerdown', (event) => {
    if (pointerId !== null) return
    event.preventDefault()
    pointerId = event.pointerId
    originX = event.clientX
    originY = event.clientY
    try {
      zone.setPointerCapture(pointerId)
    } catch {
      // Capture is a nicety; the window-level move/up below still work without it.
    }
    place(originX, originY)
    base.classList.add('on')
    knob.style.transform = 'translate(-50%, -50%)'
    onStart?.()
    onChange(0, 0, 0)
  })
  zone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return
    event.preventDefault()
    let dx = event.clientX - originX
    let dy = event.clientY - originY
    const length = Math.hypot(dx, dy)
    if (length > STICK_RADIUS) {
      dx = (dx / length) * STICK_RADIUS
      dy = (dy / length) * STICK_RADIUS
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    onChange(dx / STICK_RADIUS, dy / STICK_RADIUS, Math.min(1, length / STICK_RADIUS))
  })
  const release = (event) => {
    if (event.pointerId !== pointerId) return
    pointerId = null
    base.classList.remove('on')
    onChange(0, 0, 0)
    onEnd?.()
  }
  zone.addEventListener('pointerup', release)
  zone.addEventListener('pointercancel', release)
}

// Builds the touch layer and wires it to `input`. `hud` is src/hud.js's
// element bag (hotbarSlots / abilitySlots), for tapping the slots.
// Returns { addMenuButton(onTap) } for sandbox mode's menu.
export function createTouchControls(input, hud) {
  input.touchMode = true
  document.body.classList.add('touch')

  const layer = el('div', 'touch-layer')
  layer.addEventListener('contextmenu', (event) => event.preventDefault())

  const moveZone = el('div', 'touch-move-zone', 'touch-zone')
  const aimZone = el('div', 'touch-aim-zone', 'touch-zone')
  moveZone.appendChild(el('div', null, 'touch-hint', 'MOVE'))
  aimZone.appendChild(el('div', null, 'touch-hint', 'AIM + ATTACK'))
  layer.append(moveZone, aimZone)

  // Any touch on the play area also nudges a cutscene along.
  for (const zone of [moveZone, aimZone]) {
    zone.addEventListener('pointerdown', () => {
      input.tapKey('Space')
      layer.classList.add('used')
    })
  }

  attachStick(moveZone, {
    onChange(x, y) {
      const strength = Math.hypot(x, y)
      if (strength < MOVE_DEADZONE) {
        input.touchMove.x = 0
        input.touchMove.z = 0
        return
      }
      input.touchMove.x = x
      input.touchMove.z = -y // dragging up is forward
    },
    onEnd() {
      input.touchMove.x = 0
      input.touchMove.z = 0
    },
  })

  attachStick(aimZone, {
    onStart() {
      input.touchAim.active = true
      input.holdKey('Space', true) // holding the aim stick is holding attack
    },
    onChange(x, y, strength) {
      input.touchAim.dx = x
      input.touchAim.dy = y
      input.touchAim.aiming = strength >= AIM_DEADZONE
    },
    onEnd() {
      input.touchAim.active = false
      input.touchAim.aiming = false
      input.holdKey('Space', false)
    },
  })

  const addButton = (parent, label, className, onTap) => {
    const button = el('button', null, `touch-btn ${className}`, label)
    button.type = 'button'
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      button.classList.add('down')
      onTap()
    })
    for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
      button.addEventListener(type, () => button.classList.remove('down'))
    }
    parent.appendChild(button)
    return button
  }

  const actions = el('div', 'touch-actions')
  addButton(actions, 'HIDE', 'big', () => input.tapKey('KeyE'))
  addButton(actions, 'CHEST', 'big', () => input.tapKey('KeyF'))
  layer.appendChild(actions)

  // View buttons: DIVE (water rooms only, Shift) and 1ST (first-person view, key 0).
  const view = el('div', 'touch-view')
  const diveButton = addButton(view, 'DIVE', 'small', () => input.tapKey('ShiftLeft'))
  diveButton.style.display = 'none'
  addButton(view, '1ST', 'small', () => input.tapKey('Digit0'))
  layer.appendChild(view)

  const toggles = el('div', 'touch-toggles')
  addButton(toggles, 'AUTO', 'small', () => input.tapKey('KeyL'))
  addButton(toggles, '🔊', 'small', () => input.tapKey('KeyM'))
  layer.appendChild(toggles)

  document.body.appendChild(layer)

  // The HUD's own weapon and ability slots become tap targets.
  hud.hotbarSlots.forEach((slot, i) => {
    slot.element.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      input.tapKey(HOTBAR_KEYS[i])
    })
  })
  hud.abilitySlots.forEach((slot, i) => {
    slot.element.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      input.tapKey(ABILITY_KEYS[i])
    })
  })

  // The game-over card: tap to play again.
  const lose = document.getElementById('lose-screen')
  lose?.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    input.tapKey('KeyR')
  })

  // Tap-flavored copy for the prompts that name a key.
  const setText = (selector, text) => {
    const node = document.querySelector(selector)
    if (node) node.textContent = text
  }
  setText('#hide-prompt', 'Tap HIDE to enter the pod')
  setText('#start-card .hint', 'Tap to begin')
  setText('#lose-screen .hint', 'Tap to play again')
  setText('#cutscene-hint', 'Tap: next')

  return {
    // main.js: show the DIVE button only in a water room; it reads SURFACE while you're under.
    setWater(inWater, diving) {
      diveButton.style.display = inWater ? '' : 'none'
      diveButton.textContent = diving ? 'SURFACE' : 'DIVE'
    },
    // Sandbox mode's menu toggle (Tab on a keyboard).
    addMenuButton(onTap, label = 'MENU') {
      addButton(toggles, label, 'small', onTap)
    },
  }
}
