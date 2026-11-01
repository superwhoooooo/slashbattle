// The Tab menu for a normal run: your power-ups, and which of them are
// switched on. Click one to equip / unequip it (a full set swaps out the
// oldest). Pure DOM; main.js hands in the callback and calls `refresh`.
import { POWERUPS, POWERUP_SLOTS } from './logic/items.js'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

// Returns { isOpen, setOpen, toggle, refresh(inventory) }.
export function createLoadoutPanel({ onToggle }) {
  const root = el('div', 'sb-panel panel')
  root.id = 'loadout-panel'
  root.style.display = 'none'
  // Clicks in the menu must not reach the window-level input handlers
  // (they'd count as attacks).
  for (const type of ['mousedown', 'mouseup']) root.addEventListener(type, (event) => event.stopPropagation())

  const header = el('div', 'sb-header')
  header.appendChild(el('strong', null, 'POWER-UPS'))
  header.appendChild(el('span', 'sb-hint', 'Tab: close (game paused)'))
  root.appendChild(header)
  const count = el('div', 'sb-hint', '')
  root.appendChild(count)
  const list = el('div', 'lo-list')
  root.appendChild(list)
  const empty = el('p', 'sb-hint', 'None yet. Open chests to find power-ups.')
  root.appendChild(empty)
  document.body.appendChild(root)

  const rows = new Map()
  for (const perk of Object.values(POWERUPS)) {
    const b = el('button', 'sb-btn lo-btn')
    b.type = 'button'
    b.appendChild(el('span', 'lo-name', `${perk.icon} ${perk.name}`))
    b.appendChild(el('span', 'lo-blurb', perk.blurb))
    b.addEventListener('click', (event) => {
      onToggle(perk.id)
      event.currentTarget.blur()
    })
    b.style.display = 'none'
    list.appendChild(b)
    rows.set(perk.id, b)
  }

  let open = false
  const setOpen = (value) => {
    open = value
    root.style.display = open ? 'block' : 'none'
  }
  return {
    isOpen: () => open,
    setOpen,
    toggle: () => setOpen(!open),
    refresh(inventory) {
      count.textContent = `Equipped ${inventory.equipped.length} / ${POWERUP_SLOTS}`
      for (const [id, b] of rows) {
        b.style.display = inventory.powerups.includes(id) ? '' : 'none'
        b.classList.toggle('on', inventory.equipped.includes(id))
      }
      empty.style.display = inventory.powerups.length ? 'none' : ''
    },
  }
}
