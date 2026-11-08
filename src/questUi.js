// The DOM side of villagers and quests: the dialogue panel (E near a villager), the quest tracker under the
// score, the "E  Talk" prompt, and a toast for finished quests. Game rules live in logic/quests.js.
import { questProgressText } from './logic/quests.js'

export function createQuestUi({ onButton, onClose }) {
  const dialog = document.getElementById('npc-dialog')
  const nameEl = document.getElementById('npc-name')
  const roleEl = document.getElementById('npc-role')
  const textEl = document.getElementById('npc-text')
  const rewardEl = document.getElementById('npc-reward')
  const buttonsEl = document.getElementById('npc-buttons')
  const tracker = document.getElementById('quest-tracker')
  const prompt = document.getElementById('talk-prompt')
  const toast = document.getElementById('quest-toast')

  let open = false
  let buttons = []
  let trackerKey = ''
  let toastTimer = null

  // The panel's own clicks must not swing the weapon or dismiss anything behind it.
  for (const type of ['mousedown', 'pointerdown', 'click']) dialog.addEventListener(type, (e) => e.stopPropagation())

  function close() {
    if (!open) return
    open = false
    dialog.classList.remove('open')
    onClose?.()
  }

  function render(info) {
    nameEl.textContent = info.npc.name
    roleEl.textContent = `${info.npc.role} of ${info.village.name}`
    textEl.textContent = info.text
    rewardEl.textContent = info.quest && info.mode === 'offer' ? `Reward: ${info.quest.reward} crystals` : ''
    rewardEl.style.display = rewardEl.textContent ? 'block' : 'none'
    buttons = info.buttons
    buttonsEl.replaceChildren(
      ...buttons.map((b, i) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.textContent = b.label
        el.className = i === 0 ? 'primary' : ''
        el.addEventListener('click', () => onButton(b.id))
        return el
      }),
    )
  }

  // Esc closes; E or Enter presses the first button. Captured so the pause menu never sees the Escape.
  window.addEventListener(
    'keydown',
    (event) => {
      if (!open) return
      if (event.code === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        close()
      } else if ((event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') && buttons[0]) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (!event.repeat) onButton(buttons[0].id)
      } else if (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') {
        // movement keys are ignored while the frame is frozen
      }
    },
    true,
  )

  return {
    isOpen: () => open,
    // info: { npc, village, mode, text, quest, buttons }
    show(info) {
      open = true
      dialog.classList.add('open')
      render(info)
    },
    update(info) {
      if (open) render(info)
    },
    close,
    setPrompt(text) {
      prompt.textContent = text ?? ''
      prompt.classList.toggle('show', Boolean(text) && !open)
    },
    // Lists the active quests, only rebuilding the DOM when something changed.
    setTracker(log) {
      const key = JSON.stringify(log.active.map((q) => [q.id, q.progress, q.status]))
      if (key === trackerKey) return
      trackerKey = key
      tracker.classList.toggle('has-quests', log.active.length > 0)
      tracker.replaceChildren(
        ...log.active.map((q) => {
          const row = document.createElement('div')
          row.className = `quest-row ${q.status}`
          const title = document.createElement('b')
          title.textContent = q.title
          const sub = document.createElement('span')
          sub.textContent = `${questProgressText(q)} · ${q.villageName}`
          row.append(title, sub)
          return row
        }),
      )
    },
    showToast(text) {
      toast.textContent = text
      toast.classList.add('show')
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3200)
    },
    reset() {
      close()
      trackerKey = ''
      tracker.replaceChildren()
      tracker.classList.remove('has-quests')
      prompt.classList.remove('show')
    },
  }
}
