// The in-game pause menu (press 8, or Esc, or the PAUSE button on a phone):
// freezes the game and offers Resume, Restart, sound on/off and a brightness
// slider (remembered in localStorage). Pure DOM; main.js hands in callbacks.
const BRIGHTNESS_KEY = 'slashbattle:brightness'
export const BRIGHTNESS_MIN = 0.5
export const BRIGHTNESS_MAX = 1.3

export function loadBrightness() {
  try {
    const v = parseFloat(localStorage.getItem(BRIGHTNESS_KEY))
    if (Number.isFinite(v)) return Math.min(BRIGHTNESS_MAX, Math.max(BRIGHTNESS_MIN, v))
  } catch {
    // storage unavailable: fall through to the default
  }
  return 1
}

function saveBrightness(v) {
  try {
    localStorage.setItem(BRIGHTNESS_KEY, String(v))
  } catch {
    // ignore
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

// Returns { isOpen, setOpen, toggle }. `getMuted` / `onToggleMute` / `onBrightness(v)` /
// `onRestart` / `onResume` are supplied by main.js.
export function createPauseMenu({ getMuted, onToggleMute, onBrightness, onRestart, onClose }) {
  const root = el('div', 'overlay')
  root.id = 'pause-screen'
  root.style.display = 'none'
  for (const type of ['mousedown', 'mouseup', 'pointerdown']) root.addEventListener(type, (event) => event.stopPropagation())

  const card = el('div', 'card panel')
  card.appendChild(el('h1', null, 'PAUSED'))

  const resume = el('button', 'pause-btn primary', 'Resume')
  const restart = el('button', 'pause-btn', 'Restart run')
  const sound = el('button', 'pause-btn', '')
  for (const b of [resume, restart, sound]) b.type = 'button'

  const brightRow = el('label', 'pause-row')
  const brightLabel = el('span', null, 'Brightness')
  const slider = el('input')
  slider.type = 'range'
  slider.min = String(BRIGHTNESS_MIN)
  slider.max = String(BRIGHTNESS_MAX)
  slider.step = '0.05'
  slider.value = String(loadBrightness())
  const readout = el('span', 'pause-readout', '')
  const showReadout = () => (readout.textContent = `${Math.round(parseFloat(slider.value) * 100)}%`)
  showReadout()
  slider.addEventListener('input', () => {
    showReadout()
    saveBrightness(parseFloat(slider.value))
    onBrightness(parseFloat(slider.value))
  })
  brightRow.append(brightLabel, slider, readout)

  card.append(resume, restart, sound, brightRow)
  card.appendChild(el('p', 'hint', '8 / Esc: resume'))
  root.appendChild(card)
  document.body.appendChild(root)

  let open = false
  const refreshSound = () => (sound.textContent = getMuted() ? 'Sound: OFF' : 'Sound: ON')
  const setOpen = (value) => {
    open = value
    root.style.display = open ? 'flex' : 'none'
    if (open) refreshSound()
  }
  resume.addEventListener('click', () => {
    setOpen(false)
    onClose?.()
  })
  restart.addEventListener('click', () => {
    setOpen(false)
    onRestart()
  })
  sound.addEventListener('click', () => {
    onToggleMute()
    refreshSound()
  })
  // Space / Enter on a focused button shouldn't leak into gameplay on resume.
  for (const b of [resume, restart, sound]) b.addEventListener('click', () => b.blur())
  slider.addEventListener('change', () => slider.blur())

  return { isOpen: () => open, setOpen, toggle: () => setOpen(!open) }
}
