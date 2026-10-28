// Plain DOM/CSS heads-up display: a player health bar, score, wave
// number, enemies-left counter, hidden indicator, hide prompt, ambush
// banner, the wave banner (intermission countdown / wave cleared), a
// screen-wide damage flash, the start card, and the game-over screen.
// No Three.js; just reads and writes the overlay markup in index.html.
import {
  AMBUSH_BANNER_DURATION,
  DAMAGE_FLASH_DURATION,
  LOW_HP_PULSE_THRESHOLD,
  POD_HIDE_URGENT_THRESHOLD,
  WAVE_CLEARED_BANNER_DURATION,
} from './config.js'
import { ABILITIES, ABILITY_KEYS, ABILITY_SLOTS, HOTBAR_SLOTS, PETS, WEAPONS } from './logic/items.js'
import { abilityCooldownFraction } from './logic/inventory.js'
import { WAVE_INTERMISSION } from './logic/waves.js'

// A bottom-bar slot: a glassy square with an optional key label, an icon,
// and a cooldown overlay.
function createSlot(keyLabel, extraClass = '') {
  const element = document.createElement('div')
  element.className = `slot panel empty ${extraClass}`.trim()
  const key = document.createElement('span')
  key.className = 'slot-key'
  key.textContent = keyLabel
  const icon = document.createElement('span')
  const cooldown = document.createElement('div')
  cooldown.className = 'cooldown'
  element.append(icon, cooldown, key)
  return { element, icon, cooldown }
}

// Grabs the HUD elements already present in index.html (and builds the
// hotbar / ability slots inside their containers).
export function createHud() {
  const hotbarSlots = Array.from({ length: HOTBAR_SLOTS }, (_, i) => createSlot(String(i + 1)))
  document.getElementById('hotbar').append(...hotbarSlots.map((s) => s.element))
  const abilitySlots = Array.from({ length: ABILITY_SLOTS }, (_, i) =>
    createSlot(ABILITY_KEYS[i].replace('Key', ''), 'small'),
  )
  document.getElementById('ability-bar').append(...abilitySlots.map((s) => s.element))
  return {
    hotbarSlots,
    abilitySlots,
    petBar: document.getElementById('pet-bar'),
    crystalCounter: document.getElementById('crystal-counter'),
    chestPrompt: document.getElementById('chest-prompt'),
    lootToast: document.getElementById('loot-toast'),
    lootToastTitle: document.getElementById('loot-toast-title'),
    lootToastName: document.getElementById('loot-toast-name'),
    lootToastBlurb: document.getElementById('loot-toast-blurb'),
    healthBar: document.getElementById('health-bar'),
    healthFill: document.getElementById('health-fill'),
    healthLabel: document.getElementById('health-label'),
    scoreCounter: document.getElementById('score-counter'),
    waveCounter: document.getElementById('wave-counter'),
    enemiesLeft: document.getElementById('enemies-left'),
    hiddenIndicator: document.getElementById('hidden-indicator'),
    hideCountdown: document.getElementById('hide-countdown'),
    hideCountdownRing: document.getElementById('hide-countdown-ring'),
    hideCountdownSeconds: document.getElementById('hide-countdown-seconds'),
    hidePrompt: document.getElementById('hide-prompt'),
    ambushBanner: document.getElementById('ambush-banner'),
    ambushElapsed: null, // null means the banner isn't showing
    waveBanner: document.getElementById('wave-banner'),
    waveClearedElapsed: null, // null means the "WAVE CLEARED" banner isn't showing
    bossBar: document.getElementById('boss-bar'),
    bossBarName: document.getElementById('boss-bar-name'),
    bossBarFill: document.getElementById('boss-bar-fill'),
    cutscene: document.getElementById('cutscene'),
    cutsceneDialogue: document.getElementById('cutscene-dialogue'),
    cutsceneSpeaker: document.getElementById('cutscene-speaker'),
    cutsceneText: document.getElementById('cutscene-text'),
    cutsceneTitle: document.getElementById('cutscene-title'),
    cutsceneTitleName: document.getElementById('cutscene-title-name'),
    cutsceneTitleSub: document.getElementById('cutscene-title-sub'),
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

// Shows or hides the boss intro cutscene overlay (letterbox bars, the
// dialogue box, the name card). `view` is null to hide it, or
// { boss, phase, text } -- the boss, the cutscene phase, and the
// currently typed-out line to show while talking.
export function showCutscene(hud, view) {
  setIfChanged(hud, 'cutsceneOn', view !== null, (on) => (hud.cutscene.style.display = on ? 'block' : 'none'))
  if (!view) return
  const talking = view.phase === 'talk'
  const title = view.phase === 'title'
  setIfChanged(hud, 'cutsceneTalking', talking, (v) => (hud.cutsceneDialogue.style.display = v ? 'block' : 'none'))
  setIfChanged(hud, 'cutsceneTitleShown', title, (v) => (hud.cutsceneTitle.style.display = v ? 'block' : 'none'))
  setIfChanged(hud, 'cutsceneSpeaker', view.boss.name, (v) => (hud.cutsceneSpeaker.textContent = v))
  setIfChanged(hud, 'cutsceneTitleName', view.boss.name, (v) => (hud.cutsceneTitleName.textContent = v))
  setIfChanged(hud, 'cutsceneTitleSub', view.boss.title, (v) => (hud.cutsceneTitleSub.textContent = v))
  setIfChanged(hud, 'cutsceneText', view.text, (v) => (hud.cutsceneText.textContent = v))
}

// Redraws the crystal count, the weapon hotbar (filled slots, the
// selected one lifted), the ability slots (with cooldown overlays) and
// the pet icons from the inventory. `now` is game time, for cooldowns.
export function updateInventoryHud(hud, inventory, now) {
  setIfChanged(hud, 'crystals', inventory.crystals, (v) => (hud.crystalCounter.textContent = `💎 ${v}`))

  hud.hotbarSlots.forEach((slot, i) => {
    const id = inventory.weapons[i]
    setIfChanged(hud, `weapon${i}`, id ?? '', (v) => {
      slot.icon.textContent = v ? WEAPONS[v].icon : ''
      slot.element.classList.toggle('empty', !v)
    })
    setIfChanged(hud, `selected${i}`, i === inventory.selected, (v) => slot.element.classList.toggle('selected', v))
  })

  hud.abilitySlots.forEach((slot, i) => {
    const id = inventory.abilities[i]
    setIfChanged(hud, `ability${i}`, id ?? '', (v) => {
      slot.icon.textContent = v ? ABILITIES[v].icon : ''
      slot.element.classList.toggle('empty', !v)
    })
    if (!id) return
    const fraction = abilityCooldownFraction(inventory, id, now)
    setIfChanged(hud, `cd${i}`, Math.round(fraction * 50), (v) => (slot.cooldown.style.height = `${v * 2}%`))
    setIfChanged(hud, `ready${i}`, fraction === 0, (v) => slot.element.classList.toggle('ready', v))
  })

  setIfChanged(hud, 'pets', inventory.pets.join(','), () => {
    hud.petBar.replaceChildren(
      ...inventory.pets.map((id) => {
        const slot = createSlot('')
        slot.element.classList.remove('empty')
        slot.icon.textContent = PETS[id].icon
        return slot.element
      }),
    )
  })
}

// Shows (or hides, with null) the chest prompt; `poor` styles it red.
export function setChestPrompt(hud, text, poor = false) {
  setIfChanged(hud, 'chestPrompt', `${text ?? ''}|${poor}`, () => {
    hud.chestPrompt.style.display = text ? 'block' : 'none'
    hud.chestPrompt.textContent = text ?? ''
    hud.chestPrompt.classList.toggle('poor', poor)
  })
}

// Pops the "NEW WEAPON: ..." toast for what a chest just gave.
export function showLootToast(hud, { title, name, blurb }) {
  hud.lootToastTitle.textContent = title
  hud.lootToastName.textContent = name
  hud.lootToastBlurb.textContent = blurb
  hud.lootToast.classList.remove('show')
  void hud.lootToast.offsetWidth // restart the CSS animation
  hud.lootToast.classList.add('show')
}

// Hides the start/controls card, shown at load until the first key or
// click.
export function hideStartCard(hud) {
  hud.startCard.style.display = 'none'
}

// Shows the "WAVE CLEARED +bonus" banner; updateHud switches back to the
// intermission countdown banner after WAVE_CLEARED_BANNER_DURATION.
export function showWaveClearedBanner(hud, bonus, label = 'WAVE CLEARED') {
  hud.waveClearedElapsed = 0
  hud.waveBanner.textContent = `${label} +${bonus}`
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
  {
    hp,
    maxHp,
    score,
    wave,
    enemiesLeft,
    hidden,
    hideTimeRemaining,
    hideLimit,
    showHidePrompt,
    waveState,
    boss,
    deltaSeconds,
  },
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
  const inBossFight = waveState.phase === 'bossFight'
  setIfChanged(hud, 'wave', inBossFight ? 'BOSS' : wave, (v) => {
    hud.waveCounter.textContent = v === 'BOSS' ? 'BOSS FIGHT' : `Wave: ${v}`
  })
  setIfChanged(hud, 'bossShown', boss != null, (v) => (hud.bossBar.style.display = v ? 'block' : 'none'))
  if (boss) {
    setIfChanged(hud, 'bossName', boss.name, (v) => (hud.bossBarName.textContent = v))
    setIfChanged(hud, 'bossRatio', boss.ratio, (v) => (hud.bossBarFill.style.width = `${v * 100}%`))
  }
  setIfChanged(hud, 'enemiesLeft', enemiesLeft, (v) => (hud.enemiesLeft.textContent = `Enemies left: ${v}`))
  setIfChanged(hud, 'hidden', hidden, (v) => (hud.hiddenIndicator.style.display = v ? 'block' : 'none'))

  // The hide-limit countdown ring + seconds, next to the HIDDEN
  // indicator: a CSS conic-gradient driven by a --hide-fraction custom
  // property, turning red/urgent in the last few seconds.
  if (hidden && hideTimeRemaining != null) {
    const fraction = hideLimit > 0 ? hideTimeRemaining / hideLimit : 0
    const seconds = String(Math.ceil(hideTimeRemaining))
    const urgent = hideTimeRemaining <= POD_HIDE_URGENT_THRESHOLD
    setIfChanged(hud, 'hideFraction', fraction, (v) => hud.hideCountdownRing.style.setProperty('--hide-fraction', v))
    setIfChanged(hud, 'hideSeconds', seconds, (v) => (hud.hideCountdownSeconds.textContent = v))
    setIfChanged(hud, 'hideUrgent', urgent, (v) => hud.hideCountdown.classList.toggle('urgent', v))
  }
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
      const label = waveState.wavesUntilBoss <= 0 ? 'BOSS INCOMING' : `WAVE ${waveState.waveNumber}`
      const text = `${label} - ${Math.ceil(remaining)}`
      setIfChanged(hud, 'waveBannerText', text, (v) => (hud.waveBanner.textContent = v))
      setIfChanged(hud, 'waveBannerDisplay', 'block', (v) => (hud.waveBanner.style.display = v))
    } else {
      setIfChanged(hud, 'waveBannerDisplay', 'none', (v) => (hud.waveBanner.style.display = v))
    }
  }
}
