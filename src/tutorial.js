// The tutorial's on-screen checklist card (pure DOM).
import { TUTORIAL_STEPS, currentStep, tutorialDone } from './logic/tutorial.js'

export function createTutorialPanel({ touch = false, onExit } = {}) {
  const root = document.createElement('div')
  root.id = 'tutorial-panel'
  root.className = 'panel'
  document.body.appendChild(root)
  const done = new Set()
  let lastKey = ''

  function render(state) {
    const key = `${state.step}:${Math.floor(state.progress)}`
    if (key === lastKey) return
    lastKey = key
    root.replaceChildren()
    const list = document.createElement('ol')
    TUTORIAL_STEPS.forEach((s, i) => {
      const li = document.createElement('li')
      li.textContent = s.title
      if (i < state.step) li.className = 'done'
      else if (i === state.step) li.className = 'now'
      list.appendChild(li)
    })
    const step = currentStep(state)
    const head = document.createElement('h3')
    head.textContent = tutorialDone(state) ? 'Tutorial complete!' : `Step ${state.step + 1} of ${TUTORIAL_STEPS.length}: ${step.title}`
    const text = document.createElement('p')
    text.textContent = tutorialDone(state) ? 'You know the basics. Head to the main menu and pick a map to play for real.' : touch ? step.touch : step.hint
    const exit = document.createElement('button')
    exit.type = 'button'
    exit.textContent = tutorialDone(state) ? 'Main menu' : 'Exit tutorial'
    exit.addEventListener('click', (e) => { e.stopPropagation(); onExit?.() })
    exit.addEventListener('pointerdown', (e) => e.stopPropagation())
    exit.addEventListener('mousedown', (e) => e.stopPropagation())
    root.append(head, text, list, exit)
  }

  return { render, setVisible: (on) => { root.style.display = on ? 'block' : 'none' }, done }
}
