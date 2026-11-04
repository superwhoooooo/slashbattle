// Pure rules for tutorial mode: an ordered list of steps, each finished by one kind of
// event (the player moved, swung, killed something, hid, opened a chest).
export const TUTORIAL_STEPS = [
  { id: 'move', event: 'move', need: 6, title: 'Move around', hint: 'Use WASD or the arrow keys (left stick on touch) to walk a few steps.', touch: 'Drag the left stick to walk a few steps.' },
  { id: 'attack', event: 'attack', need: 3, title: 'Swing your weapon', hint: 'Left click or Space to cast your staff. It aims at your cursor. Try it a few times.', touch: 'Hold the right stick to aim and attack.' },
  { id: 'kill', event: 'kill', need: 1, title: 'Defeat a jelly', hint: 'A practice Blobbo is wandering in. Hit it until it pops. Knocking it off the edge works too.', touch: 'Aim at the Blobbo with the right stick until it pops.' },
  { id: 'hide', event: 'hide', need: 1, title: 'Hide in a suitcase', hint: 'Walk up to a suitcase and press E. Monsters lose you while you are inside (about 10 seconds).', touch: 'Walk up to a suitcase and tap HIDE.' },
  { id: 'chest', event: 'chest', need: 1, title: 'Open a chest', hint: 'A free cooler appeared nearby. Stand next to it and press F to open it for new gear.', touch: 'Stand next to the cooler and tap CHEST.' },
]

export const createTutorial = () => ({ step: 0, progress: 0 })

export const tutorialDone = (state) => state.step >= TUTORIAL_STEPS.length
export const currentStep = (state) => TUTORIAL_STEPS[state.step] ?? null

// Feeds one event ({ type, amount? }) into the tutorial; returns the new state and
// whether a step was just completed.
export function advanceTutorial(state, event) {
  const step = currentStep(state)
  if (!step || step.event !== event.type) return { state, completed: false }
  const progress = state.progress + (event.amount ?? 1)
  if (progress >= step.need) return { state: { step: state.step + 1, progress: 0 }, completed: true }
  return { state: { ...state, progress }, completed: false }
}
