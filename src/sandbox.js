// The sandbox menu: a DOM side panel (Tab toggles it) for sandbox mode,
// where there are no waves. Lets you spawn any monster or boss, equip any
// weapon / ability / pet, jump to any level, and run a few actions
// (clear the arena, heal, drop a chest or pod, toggle god mode).
// It's pure DOM -- main.js hands in the callbacks and calls `refresh`.
import { iconImg } from './icons.js'
import { BOSSES } from './logic/bosses.js'
import { ABILITIES, PETS, POWERUPS, WEAPONS } from './logic/items.js'
import { LEVELS } from './logic/levels.js'
import { MONSTER_TYPES } from './config.js'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function section(title) {
  const wrap = el('div', 'sb-section')
  wrap.appendChild(el('h3', null, title))
  const grid = el('div', 'sb-grid')
  wrap.appendChild(grid)
  return { wrap, grid }
}

function button(label, title, onClick) {
  const b = el('button', 'sb-btn', label)
  b.type = 'button'
  if (title) b.title = title
  b.addEventListener('click', (event) => {
    onClick()
    event.currentTarget.blur() // keep Space/Enter from re-pressing it mid-fight
  })
  return b
}

// callbacks: { onSpawn(type, count), onItem(kind, id), onLevel(index),
// onAction(name) }. Returns { root, toggle, setOpen, isOpen, refresh }.
export function createSandboxPanel(callbacks) {
  const root = el('div', 'sb-panel panel')
  root.id = 'sandbox-panel'
  root.style.display = 'none'
  // Clicks in the menu must not reach the window-level input handlers
  // (they'd count as attacks).
  for (const type of ['mousedown', 'mouseup']) root.addEventListener(type, (event) => event.stopPropagation())

  const header = el('div', 'sb-header')
  header.appendChild(el('strong', null, 'SANDBOX'))
  const hint = el('span', 'sb-hint', 'Tab: close')
  header.appendChild(hint)
  root.appendChild(header)

  const actions = section('Actions')
  const godButton = button('God mode: ON', 'Take no damage', () => callbacks.onAction('god'))
  actions.grid.appendChild(godButton)
  for (const [label, name, title] of [
    ['Clear enemies', 'clear', 'Pop every monster'],
    ['Full heal', 'heal', 'Restore all HP'],
    ['Drop chest', 'chest', 'Spawn a free chest'],
    ['Drop pod', 'pod', 'Spawn a hiding pod'],
  ]) {
    actions.grid.appendChild(button(label, title, () => callbacks.onAction(name)))
  }
  root.appendChild(actions.wrap)

  const spawn = section('Spawn (shift-click: x5)')
  const bossIds = new Set(BOSSES.map((boss) => boss.id))
  const regular = Object.keys(MONSTER_TYPES).filter((id) => !bossIds.has(id))
  for (const id of regular) {
    const b = button(id[0].toUpperCase() + id.slice(1), `Spawn a ${id}`, () => {})
    b.addEventListener('click', (event) => callbacks.onSpawn(id, event.shiftKey ? 5 : 1))
    spawn.grid.appendChild(b)
  }
  for (const boss of BOSSES) {
    const b = button(`👑 ${boss.name}`, `Spawn ${boss.name}`, () => {})
    b.addEventListener('click', () => callbacks.onSpawn(boss.id, 1))
    spawn.grid.appendChild(b)
  }
  root.appendChild(spawn.wrap)

  const levels = section('Level')
  const levelButtons = LEVELS.map((level, index) => {
    const b = button(level.name, `Go to ${level.name}`, () => callbacks.onLevel(index))
    levels.grid.appendChild(b)
    return b
  })
  root.appendChild(levels.wrap)

  const itemButtons = []
  const addItems = (title, kind, catalog) => {
    const s = section(title)
    for (const item of Object.values(catalog)) {
      const b = button(item.name, item.blurb, () => callbacks.onItem(kind, item.id))
      b.prepend(iconImg(kind, item.id, true))
      s.grid.appendChild(b)
      itemButtons.push({ b, kind, id: item.id })
    }
    root.appendChild(s.wrap)
  }
  addItems('Weapons (click to equip / remove)', 'weapon', WEAPONS)
  addItems('Abilities', 'ability', ABILITIES)
  addItems('Power-ups (3 at a time)', 'powerup', POWERUPS)
  addItems('Pets', 'pet', PETS)

  document.body.appendChild(root)

  let open = false
  const setOpen = (value) => {
    open = value
    root.style.display = open ? 'block' : 'none'
  }

  return {
    root,
    isOpen: () => open,
    setOpen,
    toggle: () => setOpen(!open),
    // Highlights what you own, the current level and the god-mode state.
    refresh({ inventory, levelIndex, god }) {
      for (const { b, kind, id } of itemButtons) {
        const owned =
          kind === 'weapon' ? inventory.weapons.includes(id) : kind === 'ability' ? inventory.abilities.includes(id) : kind === 'powerup' ? inventory.equipped.includes(id) : inventory.pets.includes(id)
        b.classList.toggle('on', owned)
      }
      levelButtons.forEach((b, index) => b.classList.toggle('on', index === levelIndex))
      godButton.textContent = `God mode: ${god ? 'ON' : 'OFF'}`
      godButton.classList.toggle('on', god)
    },
  }
}
