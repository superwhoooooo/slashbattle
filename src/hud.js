// Plain DOM/CSS heads-up display: a player health bar, score, wave
// number, enemies-left counter, hidden indicator, hide prompt, ambush
// banner, the wave banner (intermission countdown / wave cleared), a
// screen-wide damage flash, the start card, and the game-over screen.
// No Three.js; just reads and writes the overlay markup in index.html.
import { AMBUSH_BANNER_DURATION, DAMAGE_FLASH_DURATION, LOW_HP_PULSE_THRESHOLD, WAVE_CLEARED_BANNER_DURATION } from './config.js'
import { WAVE_INTERMISSION } from './logic/waves.js'

// Grabs the HUD elements already present in index.html.
export function createHud() {
  return {
    healthBar: document.getElementById('health-bar'),
    healthFill: document.getElementById('health-fill'),
    healthLabel: document.getElementById('health-label'),
    scoreCounter: document.getElementById('score-counter'),
    waveCounter: document.getElementById('wave-counter'),
    enemiesLeft: document.getElementById('enemies-left'),
    hiddenIndicator: document.getElementById('hidden-indicator'),
    hidePrompt: document.getElementById('hide-prompt'),
    ambushBanner: document.getElementById('ambush-banner'),
    ambushElapsed: null, // null means the banner isn't showing
    waveBanner: document.getElementById('wave-banner'),
    waveClearedElapsed: null, // null means the "WAVE CLEARED" banner isn't showing
    damageFlash: document.getElementById('damage-flash'),
    damageFlashElapsed: null, // null means the flash isn't showing
    startCard: document.getElementById('start-card'),
    loseScreen: document.getElementById('lose-screen'),
    loseWave: document.getElementById('lose-wave'),
    loseScore: document.getElementById('lose-score'),
    loseBest: document.getElementById('lose-best'),
    loseNewBest: document.getElementById('lose-new-best'),
    _last: {}, // dirty-check cache for updateHud's setIfChanged, so it skips DOM writes when nothing changed
  }
}

// Calls `apply(value)` (a DOM write) only if `value` differs from the
// last value written under `key` -- most HUD fields are unchanged most
// frames (score/wave/enemies-left especially), so this skips a lot of
// needless layout-dirtying DOM writes.
function setIfChanged(hud, key, value, apply) {
  if (hud._last[key] === value) return
  hud._last[key] = value
  apply(value)
}

// Flashes the full-screen damage overlay; updateHud fades it back out
// after DAMAGE_FLASH_DURATION.
export function triggerDamageFlash(hud) {
  hud.damageFlashElapsed = 0
  hud.damageFlash.classList.add('active')
}

// Shows the "AMBUSH!" banner; updateHud fades it back out after
// AMBUSH_BANNER_DURATION.
export function showAmbushBanner(hud) {
  hud.ambushElapsed = 0
  hud.ambushBanner.style.display = 'block'
}

// Hides the start/controls card, shown at load until the first key or
// click.
export function hideStartCard(hud) {
  hud.startCard.style.display = 'none'
}

// Shows the "WAVE CLEARED +bonus" banner; updateHud switches back to the
// intermission countdown banner after WAVE_CLEARED_BANNER_DURATION.
export function showWaveClearedBanner(hud, bonus) {
  hud.waveClearedElapsed = 0
  hud.waveBanner.textContent = `WAVE CLEARED +${bonus}`
  hud.waveBanner.style.display = 'block'
}

// Shows the game-over screen with the run's stats, or hides it for any
// other state (in particular 'playing', and after a restart). `stats`
// ({ wave, score, bestScore, isNewBest }) is only read when state is
// 'lost'.
export function showGameOverlay(hud, state, stats) {
  hud.loseScreen.style.display = state === 'lost' ? 'flex' : 'none'
  if (state !== 'lost' || !stats) return

  hud.loseWave.textContent = `Wave reached: ${stats.wave}`
  hud.loseScore.textContent = `Score: ${stats.score}`
  hud.loseBest.textContent = `Best: ${stats.bestScore}`
  hud.loseNewBest.style.display = stats.isNewBest ? 'block' : 'none'
}

// Updates the health bar's width/label (pulsing red at/under
// LOW_HP_PULSE_THRESHOLD), the score/wave/enemies-left counters, the
// "HIDDEN" indicator, the "Press E to hide in pod" prompt, the wave
// banner (the intermission countdown, unless a "WAVE CLEARED" banner is
// still showing), and fades out the ambush banner and the damage flash
// over time.
export function updateHud(
  hud,
  { hp, maxHp, score, wave, enemiesLeft, hidden, showHidePrompt, waveState, deltaSeconds },
) {
  const ratio = Math.max(0, Math.min(1, hp / maxHp))
  setIfChanged(hud, 'healthRatio', ratio, (r) => {
    hud.healthFill.style.width = `${r * 100}%`
    hud.healthBar.classList.toggle('low', r <= LOW_HP_PULSE_THRESHOLD)
  })
  setIfChanged(hud, 'healthLabel', `${Math.ceil(Math.max(hp, 0))} / ${maxHp}`, (v) => {
    hud.healthLabel.textContent = v
  })
  setIfChanged(hud, 'score', score, (v) => (hud.scoreCounter.textContent = `Score: ${v}`))
  setIfChanged(hud, 'wave', wave, (v) => (hud.waveCounter.textContent = `Wave: ${v}`))
  setIfChanged(hud, 'enemiesLeft', enemiesLeft, (v) => (hud.enemiesLeft.textContent = `Enemies left: ${v}`))
  setIfChanged(hud, 'hidden', hidden, (v) => (hud.hiddenIndicator.style.display = v ? 'block' : 'none'))
  setIfChanged(hud, 'showHidePrompt', showHidePrompt, (v) => (hud.hidePrompt.style.display = v ? 'block' : 'none'))

  if (hud.ambushElapsed !== null) {
    hud.ambushElapsed += deltaSeconds
    if (hud.ambushElapsed >= AMBUSH_BANNER_DURATION) {
      hud.ambushElapsed = null
      hud.ambushBanner.style.display = 'none'
    }
  }

  if (hud.damageFlashElapsed !== null) {
    hud.damageFlashElapsed += deltaSeconds
    if (hud.damageFlashElapsed >= DAMAGE_FLASH_DURATION) {
      hud.damageFlashElapsed = null
      hud.damageFlash.classList.remove('active')
    }
  }

  if (hud.waveClearedElapsed !== null) {
    hud.waveClearedElapsed += deltaSeconds
    if (hud.waveClearedElapsed >= WAVE_CLEARED_BANNER_DURATION) hud.waveClearedElapsed = null
  }
  if (hud.waveClearedElapsed === null) {
    if (waveState.phase === 'intermission') {
      const remaining = Math.max(0, WAVE_INTERMISSION - waveState.phaseElapsed)
      const text = `WAVE ${waveState.waveNumber} - ${Math.ceil(remaining)}`
      setIfChanged(hud, 'waveBannerText', text, (v) => (hud.waveBanner.textContent = v))
      setIfChanged(hud, 'waveBannerDisplay', 'block', (v) => (hud.waveBanner.style.display = v))
    } else {
      setIfChanged(hud, 'waveBannerDisplay', 'none', (v) => (hud.waveBanner.style.display = v))
    }
  }
}
