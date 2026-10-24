// Plain DOM/CSS heads-up display: a player health bar, monster counter,
// hidden indicator, hide prompt, and ambush banner. No Three.js; just
// reads and writes the overlay markup in index.html.
import { AMBUSH_BANNER_DURATION } from './config.js'

// Grabs the HUD elements already present in index.html.
export function createHud() {
  return {
    healthFill: document.getElementById('health-fill'),
    healthLabel: document.getElementById('health-label'),
    monstersLeft: document.getElementById('monsters-left'),
    hiddenIndicator: document.getElementById('hidden-indicator'),
    hidePrompt: document.getElementById('hide-prompt'),
    ambushBanner: document.getElementById('ambush-banner'),
    ambushElapsed: null, // null means the banner isn't showing
  }
}

// Shows the "AMBUSH!" banner; updateHud fades it back out after
// AMBUSH_BANNER_DURATION.
export function showAmbushBanner(hud) {
  hud.ambushElapsed = 0
  hud.ambushBanner.style.display = 'block'
}

// Updates the health bar's width/label, the monster counter, the
// "HIDDEN" indicator, the "Press E to hide" prompt, and fades out the
// ambush banner over time.
export function updateHud(hud, { hp, maxHp, monstersLeft, hidden, showHidePrompt, deltaSeconds }) {
  const ratio = Math.max(0, Math.min(1, hp / maxHp))
  hud.healthFill.style.width = `${ratio * 100}%`
  hud.healthLabel.textContent = `${Math.ceil(Math.max(hp, 0))} / ${maxHp}`
  hud.monstersLeft.textContent = `Monsters left: ${monstersLeft}`
  hud.hiddenIndicator.style.display = hidden ? 'block' : 'none'
  hud.hidePrompt.style.display = showHidePrompt ? 'block' : 'none'

  if (hud.ambushElapsed !== null) {
    hud.ambushElapsed += deltaSeconds
    if (hud.ambushElapsed >= AMBUSH_BANNER_DURATION) {
      hud.ambushElapsed = null
      hud.ambushBanner.style.display = 'none'
    }
  }
}
