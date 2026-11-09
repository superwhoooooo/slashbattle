// The Wilds journal panel (U in the Wilds): goals (milestones with progress bars), discoveries, the bestiary,
// lanterns, races and treasure. A DOM overlay that freezes the game while it is open; rules and the saved data
// live in logic/wildsJournal.js.
import { BIOMES, WILD_BIOMES, landmarks } from './logic/world.js'
import { MILESTONES, creatureName, isBossType, milestoneProgress } from './logic/wildsJournal.js'
import { LANTERN_COUNT } from './logic/lanterns.js'
import { raceCourses } from './logic/races.js'
import { formatTime } from './logic/wildsSpots.js'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function createJournalUi({ onClose } = {}) {
  const panel = document.getElementById('journal')
  const body = document.getElementById('journal-body')
  let open = false
  for (const type of ['mousedown', 'pointerdown', 'click', 'wheel']) panel?.addEventListener(type, (e) => e.stopPropagation())
  panel?.querySelector('.journal-close')?.addEventListener('click', () => close())

  function close() {
    if (!open) return
    open = false
    panel.classList.remove('open')
    onClose?.()
  }

  window.addEventListener(
    'keydown',
    (event) => {
      if (!open) return
      if (event.code === 'Escape' || event.code === 'KeyU') {
        event.preventDefault()
        event.stopImmediatePropagation()
        close()
      }
    },
    true,
  )

  // journal: the saved journal; run: { discovered: Set, maps: n, boons: [{name, left}] } for this run.
  function render(journal, run) {
    const found = new Set(journal.landmarks)
    const goals = MILESTONES.map((m) => {
      const done = journal.claimed.includes(m.id)
      const have = milestoneProgress(journal, m)
      const reward = `${m.crystals} crystals${m.loot ? ` + a ${m.loot}` : ''}`
      return `<div class="j-goal ${done ? 'done' : ''}"><div class="j-goal-top"><b>${esc(m.title)}</b><span>${done ? 'DONE' : `${have}/${m.need}`}</span></div><div class="j-sub">${esc(m.desc)} &middot; ${esc(reward)}</div><div class="j-bar"><i style="width:${(have / m.need) * 100}%"></i></div></div>`
    }).join('')
    const sights = landmarks()
      .map((l) => (found.has(l.id) ? `<li class="found" style="--glow:#${BIOMES[l.biome].glow.toString(16).padStart(6, '0')}">${esc(l.name)}<small>${esc(BIOMES[l.biome].name)}</small></li>` : `<li class="unknown">???<small>${esc(BIOMES[l.biome].name)}</small></li>`))
      .join('')
    const biomes = WILD_BIOMES.map((b) => `<span class="j-chip ${journal.biomes.includes(b) ? 'on' : ''}">${journal.biomes.includes(b) ? esc(BIOMES[b].name) : '???'}</span>`).join('')
    const beasts = Object.entries(journal.bestiary)
      .sort((a, b) => b[1] - a[1])
      .map(([type, n]) => `<li class="${isBossType(type) ? 'boss' : ''}">${esc(creatureName(type))}<small>&times;${n}</small></li>`)
      .join('')
    const races = raceCourses()
      .map((c) => {
        const best = journal.races[c.id]
        const medal = best ? (best <= c.gold ? 'gold' : best <= c.silver ? 'silver' : 'bronze') : ''
        return `<li class="${medal}">${esc(c.name)}<small>${best ? `${formatTime(best)} ${medal.toUpperCase()}` : `gold ${formatTime(c.gold)}`}</small></li>`
      })
      .join('')
    body.innerHTML = `
      <div class="j-stats">
        <div><b>${journal.landmarks.length}/${landmarks().length}</b><span>Landmarks</span></div>
        <div><b>${journal.biomes.length}/${WILD_BIOMES.length}</b><span>Biomes</span></div>
        <div><b>${Object.keys(journal.bestiary).length}</b><span>Creatures</span></div>
        <div><b>${journal.lanterns.length}/${LANTERN_COUNT}</b><span>Lanterns lit</span></div>
        <div><b>${journal.treasures}</b><span>Treasures</span></div>
        <div><b>${journal.events}</b><span>Events</span></div>
      </div>
      <p class="j-run">This run: ${run.discovered} landmarks found &middot; ${run.maps} treasure map${run.maps === 1 ? '' : 's'} carried${run.boons ? ` &middot; ${esc(run.boons)}` : ''}</p>
      <h3>Goals</h3><div class="j-goals">${goals}</div>
      <h3>Biomes</h3><div class="j-chips">${biomes}</div>
      <h3>Landmarks</h3><ul class="j-list">${sights}</ul>
      <h3>Sky-ring races</h3><ul class="j-list">${races || '<li>No courses</li>'}</ul>
      <h3>Bestiary</h3><ul class="j-list">${beasts || '<li>Nothing felled yet</li>'}</ul>`
  }

  return {
    isOpen: () => open,
    show(journal, run) {
      if (!panel) return
      render(journal, run)
      open = true
      panel.classList.add('open')
      body.scrollTop = 0
    },
    close,
  }
}
