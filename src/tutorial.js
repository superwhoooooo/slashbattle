// The tutorial's on-screen card (pure DOM): the chapter list, the current step (how to do it and
// why it matters), progress, and Skip / Continue / Exit buttons.
import { TUTORIAL_CHAPTERS, TUTORIAL_STEPS, currentStep, tutorialDone } from './logic/tutorial.js'

const stop = (el) => {
  for (const type of ['pointerdown', 'mousedown']) el.addEventListener(type, (e) => e.stopPropagation())
}

function button(label, primary, onClick) {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = label
  if (primary) b.className = 'primary'
  b.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick?.()
  })
  stop(b)
  return b
}

export function createTutorialPanel({ touch = false, onExit, onNext, onSkip } = {}) {
  const root = document.createElement('div')
  root.id = 'tutorial-panel'
  root.className = 'panel'
  stop(root)
  document.body.appendChild(root)
  let lastKey = ''

  function render(state) {
    const key = `${state.step}:${Math.floor(state.progress)}`
    if (key === lastKey) return
    lastKey = key
    root.replaceChildren()

    const done = tutorialDone(state)
    const step = currentStep(state)

    // Chapter chips: done ones ticked, the current one highlighted.
    const chapters = document.createElement('div')
    chapters.className = 'tut-chapters'
    TUTORIAL_CHAPTERS.forEach((name, i) => {
      const chip = document.createElement('span')
      chip.textContent = name
      if (done || (step && i < step.chapter)) chip.className = 'done'
      else if (step && i === step.chapter) chip.className = 'now'
      chapters.appendChild(chip)
    })

    const head = document.createElement('h3')
    const text = document.createElement('p')
    root.append(chapters, head, text)

    if (done) {
      head.textContent = 'Tutorial complete!'
      text.textContent = 'You have seen everything. Head to the main menu and pick a place to play for real.'
      root.append(button('Main menu', true, onExit))
      return
    }

    const inChapter = TUTORIAL_STEPS.filter((s) => s.chapter === step.chapter)
    const index = inChapter.indexOf(step)
    head.textContent = `${step.title}  (${index + 1}/${inChapter.length})`
    text.textContent = touch && step.touch ? step.touch : step.hint

    if (step.why) {
      const why = document.createElement('p')
      why.className = 'tut-why'
      why.textContent = step.why
      root.append(why)
    }
    if (step.need > 1 && !step.read) {
      const bar = document.createElement('div')
      bar.className = 'tut-bar'
      const fill = document.createElement('i')
      fill.style.width = `${Math.min(100, (state.progress / step.need) * 100)}%`
      bar.appendChild(fill)
      root.append(bar)
    }

    const row = document.createElement('div')
    row.className = 'tut-buttons'
    if (step.read) row.append(button(state.step === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Continue', true, onNext))
    else row.append(button('Skip step', false, onSkip))
    row.append(button('Exit tutorial', false, onExit))
    root.append(row)
  }

  return { render, setVisible: (on) => { root.style.display = on ? 'block' : 'none' } }
}
