// The "inventory full" prompt a chest opens when it rolls a weapon, ability
// or pet and every slot of that kind is taken: pick one of your items to
// swap out for the new one, or keep what you have. Pure DOM; main.js hands
// in the callbacks. While it is open the game is paused.
import { ABILITIES, PETS, WEAPONS } from './logic/items.js'

const CATALOGS = { weapon: WEAPONS, ability: ABILITIES, pet: PETS }
const KIND_LABEL = { weapon: 'WEAPON', ability: 'ABILITY', pet: 'PET' }

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

// Returns { isOpen, show(loot, swappableIds), hide }.
export function createSwapPanel({ onSwap, onKeep }) {
  const root = el('div', 'sb-panel panel')
  root.id = 'swap-panel'
  root.style.display = 'none'
  for (const type of ['mousedown', 'mouseup']) root.addEventListener(type, (event) => event.stopPropagation())
  document.body.appendChild(root)

  let open = false
  const hide = () => {
    open = false
    root.style.display = 'none'
    root.textContent = ''
  }

  return {
    isOpen: () => open,
    hide,
    show(loot, swappable) {
      const catalog = CATALOGS[loot.kind]
      const item = catalog[loot.id]
      root.textContent = ''
      const header = el('div', 'sb-header')
      header.appendChild(el('strong', null, `NEW ${KIND_LABEL[loot.kind]}: ${item.icon} ${item.name}`))
      header.appendChild(el('span', 'sb-hint', 'Esc: keep yours'))
      root.appendChild(header)
      root.appendChild(el('div', 'sb-hint', `${item.blurb}. Slots are full, so pick one to swap out:`))
      const list = el('div', 'lo-list')
      for (const id of swappable) {
        const owned = catalog[id]
        const b = el('button', 'sb-btn lo-btn')
        b.type = 'button'
        b.appendChild(el('span', 'lo-name', `${owned.icon} ${owned.name}`))
        b.appendChild(el('span', 'lo-blurb', owned.blurb))
        b.addEventListener('click', (event) => {
          event.currentTarget.blur()
          onSwap(id)
        })
        list.appendChild(b)
      }
      const keep = el('button', 'sb-btn lo-btn', 'Keep what I have')
      keep.type = 'button'
      keep.addEventListener('click', (event) => {
        event.currentTarget.blur()
        onKeep()
      })
      list.appendChild(keep)
      root.appendChild(list)
      open = true
      root.style.display = 'block'
    },
  }
}
