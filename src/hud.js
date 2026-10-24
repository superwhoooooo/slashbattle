// Plain DOM/CSS heads-up display: a player health bar and a monster
// counter. No Three.js; just reads and writes the overlay markup in
// index.html.

// Grabs the HUD elements already present in index.html.
export function createHud() {
  return {
    healthFill: document.getElementById('health-fill'),
    healthLabel: document.getElementById('health-label'),
    monstersLeft: document.getElementById('monsters-left'),
  }
}

// Updates the health bar's width/label and the monster counter.
export function updateHud(hud, { hp, maxHp, monstersLeft }) {
  const ratio = Math.max(0, Math.min(1, hp / maxHp))
  hud.healthFill.style.width = `${ratio * 100}%`
  hud.healthLabel.textContent = `${Math.ceil(Math.max(hp, 0))} / ${maxHp}`
  hud.monstersLeft.textContent = `Monsters left: ${monstersLeft}`
}
