// The mastery-8 choice at the start of a run (logic/heroUltimates.js): take the hero's ultimate (K),
// or +10% to one stat. Pure DOM, styled like the swap panel; main.js pauses the game while it's open.
import { MASTERY_STAT_PICKS, ULTIMATE_LEVEL } from './logic/heroUltimates.js'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

// Returns { isOpen, show({ heroName, ultimate }), hide }. onPick({ kind: 'ult' } | { kind: 'stat', id }).
export function createMasteryPickPanel({ onPick }) {
  const root = el('div', 'sb-panel panel')
  root.id = 'mastery-pick'
  root.style.display = 'none'
  for (const type of ['mousedown', 'mouseup', 'pointerdown']) root.addEventListener(type, (event) => event.stopPropagation())
  document.body.appendChild(root)

  let open = false
  const hide = () => {
    open = false
    root.style.display = 'none'
    root.textContent = ''
  }
  const pick = (choice) => (event) => {
    event.currentTarget.blur()
    hide()
    onPick(choice)
  }

  return {
    isOpen: () => open,
    hide,
    show({ heroName, ultimate }) {
      root.textContent = ''
      const header = el('div', 'sb-header')
      header.appendChild(el('strong', null, `MASTERY ${ULTIMATE_LEVEL}: ${heroName.toUpperCase()}`))
      header.appendChild(el('span', 'sb-hint', 'Pick one for this run'))
      root.appendChild(header)

      const ult = el('button', 'sb-btn lo-btn mp-ult')
      ult.type = 'button'
      ult.appendChild(el('span', 'lo-name', `★ ULTIMATE [K]: ${ultimate.name}`))
      ult.appendChild(el('span', 'lo-blurb', `${ultimate.desc} (${ultimate.cooldown} s cooldown, on top of your B ability)`))
      ult.addEventListener('click', pick({ kind: 'ult' }))
      root.appendChild(ult)

      root.appendChild(el('div', 'sb-hint', '...or +10% to one stat:'))
      const grid = el('div', 'mp-stats')
      for (const stat of MASTERY_STAT_PICKS) {
        const b = el('button', 'sb-btn lo-btn')
        b.type = 'button'
        b.appendChild(el('span', 'lo-name', stat.name))
        b.appendChild(el('span', 'lo-blurb', stat.desc))
        b.addEventListener('click', pick({ kind: 'stat', id: stat.id }))
        grid.appendChild(b)
      }
      root.appendChild(grid)
      open = true
      root.style.display = 'block'
    },
  }
}
