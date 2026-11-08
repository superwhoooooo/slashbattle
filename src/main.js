import './saveSync.js' // first: loads the device save file into localStorage before anything reads it
import '@fontsource/sora/400.css'
import '@fontsource/sora/600.css'
import '@fontsource/sora/800.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { createArena, createEnvironmentMap, updateArena } from './arena.js'
import { createLabyrinthArena } from './labyrinth.js'
import {
  BOSSES_PER_FLOOR,
  LABYRINTH_FLOORS,
  SPIKE_MONSTER_DAMAGE,
  SPIKE_PLAYER_DAMAGE,
  bossSpot,
  buildFloor,
  cellOf,
  createNavigator,
  spikeState,
} from './logic/maze.js'
import { levelAt, levelIndexAfterBosses } from './logic/levels.js'
import { iconImg } from './icons.js'
import { PICKUP_RADIUS, createPerkPickup, updatePerkPickup } from './pickups.js'
import { createLoadoutPanel } from './loadout.js'
import { createHub } from './hub.js'
import { loadProfile, saveProfile } from './profile.js'
import { createScope } from './scope.js'
import { SCOPES, AMMO, rifleSetup as riflePicks, stepSteady, tuneRifle } from './logic/rifles.js'
import { bulletDamage } from './logic/bullets.js'
import { DEEP_SPAWN_CHANCE, pickDeepType } from './logic/enemies.js'
import { MELEE_REFLECT_DAMAGE, createShield, crackFraction, hitShield, reflectedDamage, stepShield } from './logic/reflect.js'
import { WATER, stepBreath, stepDepth, waveHeight } from './logic/water.js'
import { createWaterUi } from './waterUi.js'
import { activeLoadoutPets, addToCollection, bankCrystals, setRifleOption, unlockAttachment } from './logic/profile.js'
import { combineEffects, skillEffects } from './logic/skills.js'
import { createPauseMenu, loadBrightness } from './pauseMenu.js'
import { createSwapPanel } from './swap.js'
import { createWarp } from './warp.js'
import { playBulletTrail, playHitFx, playWeaponFx } from './weaponFx.js'
import { clampTargetToRange, inCircle } from './logic/warp.js'
import { createSandboxPanel } from './sandbox.js'
import { createTutorialPanel } from './tutorial.js'
import { advanceTutorial, createTutorial, tutorialDone } from './logic/tutorial.js'
import { createTouchControls, isTouchDevice } from './touch.js'
import { sandboxToggleItem, sandboxTopUp } from './logic/sandbox.js'
import { createAudio } from './audio.js'
import { createMonsterMesh } from './characters.js'
import { updateFace3D } from './face3d.js'
import { animateAlive } from './alive.js'
import { loadHighScore, saveHighScore } from './highScore.js'
import { createMusic } from './music.js'
import { createSfx } from './sfx.js'
import { jellyHit, updateJelly } from './jelly.js'
import {
  ARENA_RADIUS,
  BLOOM_RADIUS,
  BLOOM_STRENGTH,
  BLOOM_THRESHOLD,
  CAMERA_FAR,
  CAMERA_LERP,
  CAMERA_LOOKAHEAD,
  BLINK_DISTANCE,
  DRAIN_COLOR,
  DRAIN_DAMAGE,
  DRAIN_HEAL_PER_HIT,
  DRAIN_RADIUS,
  FRENZY_COOLDOWN_MULTIPLIER,
  GRAVITY_COLOR,
  GRAVITY_DAMAGE,
  GRAVITY_PULL_DISTANCE,
  GRAVITY_RADIUS,
  LUNGE_COLOR,
  LUNGE_DAMAGE,
  LUNGE_DISTANCE,
  LUNGE_IFRAMES,
  LUNGE_WIDTH,
  SPRINT_SPEED_MULTIPLIER,
  THUNDER_COLOR,
  THUNDER_DAMAGE,
  THUNDER_RANGE,
  THUNDER_TARGETS,
  VOLLEY_COUNT,
  VOLLEY_DAMAGE,
  BLINK_IFRAMES,
  BOSS_DEFEAT_HEAL_MULTIPLIER,
  BOSS_SPAWN_DISTANCE,
  BOSS_SPAWN_EFFECT_DURATION,
  BOSS_SPAWN_EFFECT_SCALE,
  BOSS_SPAWN_MARGIN,
  CAMERA_OFFSET,
  CHEST_ALL_OWNED_HEAL,
  CHEST_ALL_OWNED_SCORE,
  CHEST_FLASH_COLOR,
  CHEST_INTERACT_RANGE,
  CHEST_MAX_ACTIVE,
  CHEST_MIN_SPACING,
  CHEST_OBSTACLE_RADIUS,
  CHEST_SPAWN_DELAY_MAX,
  CHEST_SPAWN_DELAY_MIN,
  CHEST_SPAWN_MARGIN,
  CUTSCENE_CAMERA_LERP,
  FALL_DESPAWN_DEPTH,
  FALL_GRAVITY,
  FALL_PUFF_COLOR,
  FALL_PUFF_COUNT,
  FALL_PUFF_SPEED,
  FALL_STREAK_COUNT,
  ENVIRONMENT_INTENSITY,
  FALL_STREAK_SPEED,
  GTAO_ENABLED,
  GTAO_INTENSITY,
  GTAO_RADIUS,
  HEAL_PULSE_AMOUNT,
  HIDDEN_CAMERA_OFFSET,
  HITSTOP_PLAYER_HURT,
  JELLY_DEATH_INFLATE_STRENGTH,
  MAX_DELTA_SECONDS,
  MAX_PIXEL_RATIO,
  MSAA_SAMPLES,
  MONSTER_FALL_TUMBLE_SPEED,
  MONSTER_TYPES,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  POD_HIDE_LIMIT,
  POD_INITIAL_COUNT_MAX,
  POD_INITIAL_COUNT_MIN,
  POD_MAX_ACTIVE,
  POD_MIN_PLAYER_DISTANCE,
  POD_MIN_SPACING,
  POD_MONSTER_AVOID_RADIUS,
  POD_OBSTACLE_RADIUS,
  POD_SPAWN_BURST_COUNT,
  POD_SPAWN_BURST_SPEED,
  POD_SPAWN_DELAY_MAX,
  POD_SPAWN_DELAY_MIN,
  POD_SPAWN_FLASH_COLOR,
  POD_SPAWN_MARGIN,
  POD_SPAWN_MAX_ATTEMPTS,
  POPUP_CANNONBALL_COLOR,
  POPUP_KILL_COLOR,
  POPUP_RING_OUT_COLOR,
  RAGE_DAMAGE_MULTIPLIER,
  RUMBLE_LIGHT_DURATION,
  RUMBLE_LIGHT_STRENGTH,
  RUMBLE_MEDIUM_DURATION,
  RUMBLE_MEDIUM_STRENGTH,
  RUMBLE_STRONG_DURATION,
  RUMBLE_STRONG_STRENGTH,
  SHAKE_DAMAGE_DURATION,
  SHAKE_DAMAGE_MAGNITUDE,
  SHAKE_HIT_DURATION,
  SHAKE_HIT_MAGNITUDE,
  SHAKE_NOISE_FREQUENCY_A,
  SHAKE_NOISE_FREQUENCY_B,
  SHOCKWAVE_COLOR,
  SHOCKWAVE_DAMAGE,
  SHOCKWAVE_KNOCKBACK,
  SHOCKWAVE_RADIUS,
  SPAWN_NEAR_PLAYER_MARGIN,
  SPAWN_NEAR_PLAYER_MAX_DIST,
  SPAWN_NEAR_PLAYER_MIN_DIST,
  SWORD_BLADE_COLOR,
  TONE_MAPPING_EXPOSURE,
  WAVE_CLEAR_HEAL,
} from './config.js'
import { createCarpet, updateCarpet } from './carpet.js'
import { setPlayerWeapon } from './characters.js'
import { createChest, openChest, updateChest } from './chests.js'
import { createAttackState, damageMonster, setKnockbackWorldScale, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
import { attractAllCrystals, createCrystalSystem, dropCrystals, resetCrystals, updateCrystals } from './crystals.js'
import { createHidingState, createPod, startPodDematerialize, updateHiding, updatePod } from './hiding.js'
import {
  createHud,
  hideStartCard,
  setAutoShoot,
  setChestPrompt,
  showAmbushBanner,
  showCutscene,
  showGameOverlay,
  showLootToast,
  showTrickSticker,
  showWaveClearedBanner,
  triggerDamageFlash,
  updateHud,
  updateInventoryHud,
} from './hud.js'
import { Input } from './input.js'
import { bossById, bossCooldownScale, bossDamageScale, bossHpScale, bossSpecialsFor } from './logic/bosses.js'
import { fanVelocities } from './logic/projectiles.js'
import { clampToPlatform, isOnPlatform, resolveArenaMove, spawnPointNearPlayer } from './logic/arena.js'
import { crystalDrops } from './logic/crystals.js'
import { isInPool } from './logic/resortLayout.js'
import { createChainState, hasChainExpired, nameTrick, stepChain, trickPoints } from './logic/tricks.js'
import { killVoiceForTrick } from './logic/sfx.js'
import { CUTSCENE_ENTER_DURATION, createCutscene, introLines, speakerFor, stepCutscene, visibleChars } from './logic/cutscene.js'
import {
  addCrystals,
  availablePowerups,
  chestCost,
  createInventory,
  grantItem,
  needsSwap,
  swapItem,
  swappableIds,
  toggleEquipPowerup,
  rollChestLoot,
  selectWeaponSlot,
  selectedWeaponId,
  spendCrystals,
  useAbility,
} from './logic/inventory.js'
import { ABILITIES, ABILITY_KEYS, HOTBAR_KEYS, PETS, POWERUPS, WEAPONS, petEffects, powerupEffects, setSlotBonuses } from './logic/items.js'
import { stepFall } from './logic/falling.js'
import { evaluateGameState } from './logic/gameState.js'
import { createHitstopState, stepHitstop, triggerHitstop } from './logic/hitstop.js'
import { hideTimeRemaining } from './logic/hiding.js'
import { createPodSpawnerState, pickPodSpawnPoint, stepPodSpawner } from './logic/podSpawner.js'
import {
  beginBossFight,
  createWaveState,
  currentBoss,
  pickMonsterType,
  scoreForKill,
  stepWaves,
  waveClearBonus,
  waveSize,
} from './logic/waves.js'
import { enemyScale, SPLITS } from './logic/enemies.js'
import { createMonsterAIState, separateMonsters, setDeepShield, setMonsterNavigator, setSurfaceShield, updateMonster, upgradeBossSpecials } from './monster.js'
import { burst, createParticleSystem, resetParticles, setParticleViewScale, shardBurst, updateParticles } from './particles.js'
import { createPet, disposePets, updatePets } from './pets.js'
import { Player } from './player.js'
import { createBulletPool, fireBullets, resetBullets, updateBullets } from './bullets.js'
import { createScratchLayer, showScratch } from './scratch.js'
import { makeBullets } from './logic/bullets.js'
import { createPoisonPool, lobPoison, resetPoison, updatePoison } from './hazards.js'
import { createProjectilePool, fireProjectile, resetProjectiles, updateProjectiles } from './projectiles.js'
import { createShockwavePool, resetShockwaves, spawnShockwave, updateShockwaves } from './shockwave.js'
import { createPopupPool, resetPopups, showPopup, updatePopups } from './popups.js'
import { createSpawnEffect, updateSpawnEffect } from './spawner.js'
import { clearSwingTrail, createSwingTrail } from './trail.js'

import { ADAPTIVE_FPS_RETRY_MAX_SECONDS, ADAPTIVE_FPS_RETRY_SECONDS, ADAPTIVE_MIN_RATIO, ADAPTIVE_RETRY_SECONDS, ADAPTIVE_WINDOW_SECONDS, adaptiveDecision, estimateDisplayInterval, framesPerRender, menuFrameDue, parseFpsCap, trimmedMean } from './logic/perf.js'
import { createPerfOverlay } from './perf.js'

const container = document.querySelector('#app')

// Phones and tablets get touch controls and a lighter render (a lower pixel
// ratio cap, no ambient occlusion pass) so the game stays smooth.
const touchDevice = isTouchDevice()
const PIXEL_RATIO_CAP = touchDevice ? Math.min(MAX_PIXEL_RATIO, 2) : MAX_PIXEL_RATIO
// Some machines refuse a context with the fancy options (a busy or software-only GPU, too many
// open WebGL tabs), so try progressively plainer ones before giving up with a readable message.
function createRendererWithFallback() {
  // The canvas itself needs no antialiasing: everything is drawn through the composer's own
  // multisampled target, so a multisampled default framebuffer is pure extra fill and resolve.
  // ?gpu=low|high picks the GPU on dual-GPU laptops (A/B switch for heat vs speed).
  const gpuParam = new URLSearchParams(location.search).get('gpu')
  const preferred = gpuParam === 'low' ? 'low-power' : 'high-performance'
  const attempts = isTouchDevice()
    ? [{ antialias: false }, { antialias: false, powerPreference: 'low-power' }, { antialias: true }]
    : [
        { antialias: false, powerPreference: preferred },
        { antialias: false },
        { antialias: false, powerPreference: 'low-power' },
      ]
  let lastError = null
  for (const options of attempts) {
    try {
      return new THREE.WebGLRenderer(options)
    } catch (error) {
      lastError = error
    }
  }
  const box = document.createElement('div')
  box.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;background:#1a2433;color:#fff;font:16px/1.5 system-ui,sans-serif;text-align:center'
  box.innerHTML = '<div style="max-width:520px"><h2 style="margin:0 0 12px">Your browser could not start 3D graphics (WebGL)</h2>' +
    '<p>SlashBattle needs WebGL. Try: close other tabs and windows that use 3D or video, make sure "Use graphics acceleration when available" is on (Chrome: Settings, System), restart the browser, then reload this page. On a phone: close other tabs and apps, turn off Low Power / battery saver mode, and try Chrome or Safari.</p>' +
    '<p style="font:12px/1.4 monospace;opacity:.7;word-break:break-word"></p></div>'
  box.querySelector('p:last-child').textContent = 'Details: ' + (lastError?.message ?? lastError ?? 'unknown')
  console.error('WebGL renderer creation failed:', lastError)
  document.body.appendChild(box)
  throw lastError
}
const renderer = createRendererWithFallback()
renderer.setSize(window.innerWidth, window.innerHeight)
// Capped rather than the raw devicePixelRatio -- a 3x display would
// otherwise render (and composite) 9x the pixels for no visible gain.
// Adaptive quality (see animate) can lower this below PIXEL_RATIO_CAP when frames run slow.
let adaptiveRatioCap = Infinity
const effectivePixelRatio = () => Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP, adaptiveRatioCap)
renderer.setPixelRatio(effectivePixelRatio())
// ?shadows=0 turns shadow mapping off entirely (diagnostic A/B switch).
renderer.shadowMap.enabled = new URLSearchParams(location.search).get('shadows') !== '0'
renderer.shadowMap.type = THREE.PCFShadowMap
// NeutralToneMapping keeps the sunlit scene's pastel colors true,
// without a filmic curve crushing its highlights and shadows.
renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE * loadBrightness()
renderer.outputColorSpace = THREE.SRGBColorSpace
container.appendChild(renderer.domElement)
renderer.domElement.style.display = 'block'
// If the browser drops the GPU context (memory pressure, a second context, a driver reset) the
// canvas goes blank/white: stop it from being permanently dead and reload to recover cleanly.
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault()
  // At most one automatic reload a minute, so a GPU that keeps dropping the context can't trap
  // the page in a reload loop.
  try {
    const last = Number(sessionStorage.getItem('slashbattle:ctxReload') || 0)
    if (Date.now() - last < 60000) return
    sessionStorage.setItem('slashbattle:ctxReload', String(Date.now()))
  } catch {}
  setTimeout(() => location.reload(), 800)
})
// Phones draw far fewer pixels, so keep sparks proportional to the screen there.
function syncParticleScale() {
  setParticleViewScale(touchDevice ? Math.min(1, renderer.domElement.height / 1800) : 1)
}
syncParticleScale()

const scene = new THREE.Scene()
// Gives physically lit materials (metalness/roughness, clearcoat)
// something plausible to reflect instead of flat black: a PMREM bake of
// the sky gradient plus a bright sun panel (see arena.js's
// createEnvironmentMap). The sky colors are static, so this is built
// once rather than per game/restart like the arena itself.
scene.environmentIntensity = ENVIRONMENT_INTENSITY

// Each level has its own sky, so the reflection map is re-baked when the
// level changes (and when a restart drops back to the first one). Skipped
// when the right one is already in place.
let environmentLevelIndex = -1
function setLevelEnvironment(levelIndex) {
  if (environmentLevelIndex === levelIndex) return
  environmentLevelIndex = levelIndex
  const previous = scene.environment
  scene.environment = createEnvironmentMap(renderer, levelAt(levelIndex))
  if (previous) previous.dispose()
}

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  CAMERA_FAR,
)

// Bloom makes genuinely bright surfaces (the sword's glow, spawn/hit
// effects, the gas giant) glow without washing out the rest of the
// daylit scene; OutputPass applies the
// renderer's tone mapping/color space after the bloom pass runs. The
// composer renders into its own target, which bypasses the renderer's
// own antialias setting -- an explicit multisampled (MSAA) render
// target keeps edges clean through the post-processing passes instead.
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  samples: touchDevice ? Math.min(MSAA_SAMPLES, 2) : MSAA_SAMPLES,
})
const composer = new EffectComposer(renderer, renderTarget)
// Handing the composer its own render target pins its pixel ratio to 1,
// so on a high-DPI display the whole scene was rendered at CSS-pixel
// resolution and upscaled -- blurry and pixelated. Match the renderer's.
composer.setPixelRatio(renderer.getPixelRatio())
composer.addPass(new RenderPass(scene, camera))
// GTAOPass hides points and lines from its normal-buffer render but not
// sprites, so every sprite (pod countdowns, chest prices, indicator
// glyphs, score popups) would write a flat quad into that buffer and
// come out as a dark ambient-occlusion box. Hide sprites from it too;
// _restoreVisibility re-shows everything in the cache afterwards.
class SpriteSafeGTAOPass extends GTAOPass {
  _overrideVisibility() {
    super._overrideVisibility()
    const cache = this._visibilityCache
    this.scene.traverse((object) => {
      if (object.isSprite && object.visible) {
        object.visible = false
        cache.push(object)
      }
    })
  }
}

// Ground-truth ambient occlusion for the contact shadows in creases and
// corners that the directional sun makes obvious. Sits right after the
// render pass, before bloom, so bloom's glow is computed from the
// already-occluded image.
const gtaoPass = new SpriteSafeGTAOPass(scene, camera, window.innerWidth, window.innerHeight, undefined, {
  radius: GTAO_RADIUS,
})
gtaoPass.blendIntensity = GTAO_INTENSITY
gtaoPass.enabled = GTAO_ENABLED && !touchDevice
composer.addPass(gtaoPass)
// Full-size bloom input: a quarter-res bloom spread the glow twice as wide, which made the sword,
// attack and hit effects look noticeably brighter than they were tuned for.
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  BLOOM_STRENGTH,
  BLOOM_RADIUS,
  BLOOM_THRESHOLD,
)
composer.addPass(bloomPass)
// The screen-warp pass (Warp Field, Gravity Well, ripples from slams and
// heavy weapons) bends the finished frame, so it goes before OutputPass.
const warp = createWarp(camera)
composer.addPass(warp.pass)
composer.addPass(new OutputPass())

const input = new Input()
const hud = createHud()
const touchControls = touchDevice ? createTouchControls(input, hud) : null

// Pooled visual effects are per-session singletons, like the composer
// and HUD above: created once, added to the scene once, and reset
// (never disposed/recreated) on restart, since they don't belong to any
// one game run.
const particleSystem = createParticleSystem()
scene.add(particleSystem.group)
const swingTrail = createSwingTrail(SWORD_BLADE_COLOR)
scene.add(swingTrail.mesh)
const popupPool = createPopupPool()
scene.add(popupPool.group)
const crystalSystem = createCrystalSystem()
scene.add(crystalSystem.mesh)
const projectilePool = createProjectilePool()
scene.add(projectilePool.group)
const poisonPool = createPoisonPool()
scene.add(poisonPool.group)
const shockwavePool = createShockwavePool()
scene.add(shockwavePool.group)
const bulletPool = createBulletPool()
const scratchLayer = createScratchLayer()
// A clawed pet's hit: a claw scratch on the screen over the enemy, sized to how big it looks.
const scratchAt = new THREE.Vector3()
function petScratch(target, def) {
  const height = (target.userData.radius ?? 0.6) * 1.2
  scratchAt.set(target.position.x, target.position.y + height, target.position.z)
  const distance = camera.position.distanceTo(scratchAt)
  scratchAt.project(camera)
  if (scratchAt.z > 1 || Math.abs(scratchAt.x) > 1.2 || Math.abs(scratchAt.y) > 1.2) return // behind the camera or off screen
  const size = Math.max(70, Math.min(280, (window.innerHeight * 1.1 * (target.userData.radius ?? 0.6)) / Math.max(1, distance)))
  showScratch(scratchLayer, ((scratchAt.x + 1) / 2) * window.innerWidth, ((1 - scratchAt.y) / 2) * window.innerHeight, size, def.color)
}
scene.add(bulletPool.group)
const scope = createScope(scene)
let steadyAim = 0 // 0..1, charges while the player stands still with a scoped rifle
let scopeZoom = 1 // the rifle scope's camera pull-back, smoothed by scope.js

// The camera doesn't rotate yet, so it stays behind the player along a
// fixed world-space offset and eases toward its target each frame.
let cameraYaw = 0

// iOS Safari ignores maximum-scale: stop double-tap and pinch zoom explicitly.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, (event) => event.preventDefault())
let lastTouchEnd = 0
document.addEventListener(
  'touchend',
  (event) => {
    const now = Date.now()
    if (now - lastTouchEnd < 350) event.preventDefault()
    lastTouchEnd = now
  },
  { passive: false },
)

// First person (key 0): the camera sits at the player's head and the mouse (pointer
// lock) turns the view; W moves along it and every weapon aims where you look.
let firstPerson = false
const TOUCH_LOOK_SPEED = 2.6 // rad/s at full stick, when turning the first-person view by touch
let fpYaw = 0 // same convention as player.facing: forward = (sin, cos)
const fpCrosshair = document.createElement('div')
fpCrosshair.style.cssText = 'position:fixed;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid rgba(255,255,255,0.85);border-radius:50%;box-shadow:0 0 0 1px rgba(26,36,51,0.45);pointer-events:none;display:none;z-index:5'
document.body.appendChild(fpCrosshair)
function setFirstPerson(on) {
  if (on === firstPerson) return
  firstPerson = on
  fpCrosshair.style.display = on ? 'block' : 'none'
  if (on) {
    fpYaw = game.player.facing
    if (!input.touchMode) renderer.domElement.requestPointerLock?.()?.catch?.(() => {}) // denied locks just leave the view where it is
  } else {
    cameraYaw = 0
    game.player.mesh.visible = true
    if (document.pointerLockElement) document.exitPointerLock()
  }
}
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && firstPerson) {
    setFirstPerson(false)
    if (waterState.diving) setDiving(false) // Esc surfaces you
  }
})

// ---- Water rooms (logic/levels.js entries with `water`): swim on the surface in third person,
// dive under it in first person. See logic/water.js for the rules, src/waterArena.js for the scenery.
const waterState = { diving: false, breath: WATER.breath, depthY: WATER.floatY, diveStartedAt: 0 }
const waterUi = createWaterUi({ touch: touchDevice })
let lastHidePrompt = false // whether E would have entered a pod last frame (so E can dive instead)
const waterRoom = () => game?.arena?.level?.water ?? null
// How high the water carries something at (x, z): the surface wave, plus how deep we are.
// The player's swim height (eases between floating and diving depth with the dive).
const waterY = (x, z, time) => waterState.depthY + waveHeight(x, z, time, waterRoom()?.surface.amp ?? 0.2)
// Where a monster swims: only deep dwellers (eels, anglers, urchins) follow you under; everyone else
// stays floating on the surface. While you're up top the deep ones lurk far below, out of sight.
const DEEP_LURK_Y = -WATER.depth * 0.45
function monsterSwimY(mesh, time) {
  const { x, z } = mesh.position
  if (!mesh.userData.deep) return WATER.floatY + waveHeight(x, z, time, waterRoom()?.surface.amp ?? 0.2)
  return waterState.diving ? waterY(x, z, time) : DEEP_LURK_Y
}
// Shots, sparks, enemy orbs and shock rings are drawn at fixed heights tuned for the surface, so
// while you dive their layers are shifted down with you (0 on the surface and on dry land). The
// shift is a bit more than the dive itself: the diver's first-person eye sits only 0.9 above their
// feet (1.5 on land), and a shot at plain feet-relative height would fly out right at eye level,
// covering the view. x1.6 keeps shots ~0.8 below the eye underwater, like first person on land.
const DIVE_FX_DROP = 1.6
const fxDepthOffset = () => (waterRoom() ? (waterState.depthY - WATER.floatY) * DIVE_FX_DROP : 0)
// An eel's body ripples in an S-wave running down from head to tail: a lazy sway when idle,
// a fast, wide wriggle when it's swimming hard (charging).
function swishEelTail(mesh, time) {
  const speed = mesh.userData.speed ?? 0
  const amp = 0.18 + Math.min(0.32, speed * 0.06)
  const freq = 3 + Math.min(7, speed * 1.4)
  mesh.userData.eelTail.forEach((pivot, i) => {
    pivot.rotation.y = amp * Math.sin(time * freq - i * 0.9)
  })
}
function applyFxDepth() {
  const y = fxDepthOffset()
  for (const group of [particleSystem.group, projectilePool.group, shockwavePool.group, bulletPool.group]) group.position.y = y
}

// Underwater, shots and enemy orbs ignore the murk so they stay readable; on land and on the
// surface they fade with distance like everything else (otherwise far shots glare at full brightness).
function setShotFog(on) {
  for (const slot of [...bulletPool.slots, ...projectilePool.slots]) {
    if (slot.mesh.material.fog === on) continue
    slot.mesh.material.fog = on
    slot.mesh.material.needsUpdate = true
  }
}

function applyWaterFog(under) {
  const room = waterRoom()
  setShotFog(!(under && room))
  if (under && room) {
    scene.fog = new THREE.Fog(room.under.fog, room.under.near, room.under.far)
    scene.background = new THREE.Color(room.under.fog)
  } else if (game?.arena) {
    scene.fog = game.arena.fog
    scene.background = new THREE.Color(game.arena.backgroundColor)
  }
  for (const object of game?.arena?.skyObjects ?? []) object.visible = !under
}

function setDiving(on, now = 0) {
  if (on === waterState.diving) return
  const { player } = game
  waterState.diving = on
  player.diving = on
  player.sightScale = on ? WATER.diveSightScale : 1
  applyWaterFog(on)
  setFirstPerson(on)
  const splash = { x: player.position.x, y: 0.1 - fxDepthOffset(), z: player.position.z }
  burst(particleSystem, splash, 0xbff6ff, 24, 3.5)
  if (on) {
    waterState.diveStartedAt = now
  } else if (now - waterState.diveStartedAt >= WATER.minDiveForAmbush) {
    player.exitedAt = now // bursting out of the water counts as an ambush, like popping out of a suitcase
  }
  sfx.play(on ? 'podIn' : 'podOut', { x: player.position.x, z: player.position.z })
}

// Resets everything to "on the surface" (a new run, or moving to another place).
function resetWater() {
  waterState.diving = false
  waterState.breath = WATER.breath
  waterState.depthY = WATER.floatY
  if (game?.player) {
    game.player.diving = false
    game.player.sightScale = 1
    game.player.vel = { x: 0, z: 0 }
  }
  setKnockbackWorldScale(waterRoom() ? WATER.knockbackScale : 1)
}

// Per-frame water-room logic: dive toggle, breath, depth, murk, screen furniture.
function stepWater(now, dt) {
  const room = waterRoom()
  const { player } = game
  setDeepShield(Boolean(room) && !waterState.diving)
  setSurfaceShield(Boolean(room) && waterState.diving)
  applyFxDepth()
  if (!room) {
    waterUi.update({ room: false, diving: false, fraction: 1 })
    return
  }
  const toggle = input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight') || (input.wasHidePressed() && !player.hidden && (waterState.diving || !lastHidePrompt))
  if (toggle && !player.hidden && !player.falling) setDiving(!waterState.diving, now)
  const b = stepBreath(waterState.breath, waterState.diving, dt)
  waterState.breath = b.breath
  if (b.out) {
    // Out of air: shoved to the surface with a gasp.
    setDiving(false, now)
    player.exitedAt = null
    if (!godMode && player.drown(now)) {
      triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      triggerDamageFlash(hud)
      sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
    }
  }
  waterState.depthY = stepDepth(waterState.depthY, waterState.diving, dt)
  // Bubbles trail a swimmer.
  if (waterState.diving && Math.random() < 0.25) {
    burst(particleSystem, { x: player.position.x, y: waterState.depthY + 1 - fxDepthOffset(), z: player.position.z }, 0xcff8ff, 1, 0.7, 1.2) // undo the particle layer's dive shift
  } else if (!waterState.diving && player.speed > 2 && Math.random() < 0.3) {
    burst(particleSystem, { x: player.position.x, y: 0.1 - fxDepthOffset(), z: player.position.z }, 0xffffff, 1, 1.3, 0.6)
  }
  const lurking = game.monsters.some((m) => m.userData.deep && !m.userData.dying)
  waterUi.update({ room: true, diving: waterState.diving, fraction: waterState.breath / WATER.breath, lurking })
}

// Keeps a swimmer inside the pool wall / buoy ring instead of letting it fall off.
function clampToWater(position, radius) {
  const limit = ARENA_RADIUS - radius - 0.8
  const d = Math.hypot(position.x, position.z)
  if (d <= limit) return false
  position.x *= limit / d
  position.z *= limit / d
  return true
}
window.addEventListener('mousemove', (event) => {
  if (firstPerson && document.pointerLockElement) fpYaw -= event.movementX * 0.0025
})
window.addEventListener('keydown', (event) => {
  if (event.repeat || (event.code !== 'Digit0' && event.code !== 'Numpad0')) return
  if (!started || hub.isOpen() || pauseMenu.isOpen() || swapPanel.isOpen()) return
  setFirstPerson(!firstPerson)
})
const cameraTarget = new THREE.Vector3()

// Where the mouse points on the ground (y = 0.7, the bullets' height), as a
// yaw from the player (Player.facing's convention: atan2(dx, dz)); null until
// the mouse has moved. Used to aim ranged weapons.
const aimRaycaster = new THREE.Raycaster()
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.7)
const aimPoint = new THREE.Vector3()
const aimNdc = new THREE.Vector2()
function screenAimAngle(player, clientX, clientY) {
  aimNdc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)
  aimRaycaster.setFromCamera(aimNdc, camera)
  if (!aimRaycaster.ray.intersectPlane(aimPlane, aimPoint)) return null
  const dx = aimPoint.x - player.position.x
  const dz = aimPoint.z - player.position.z
  if (Math.hypot(dx, dz) < 0.3) return null
  return Math.atan2(dx, dz)
}

function mouseAimAngle(player) {
  if (!input.mouse.moved) return null
  return screenAimAngle(player, input.mouse.x, input.mouse.y)
}

// The touch aim stick's direction: a screen-space push from where the player
// is on screen, turned into a ground yaw the same way the mouse is. null
// while the stick is untouched or still inside its deadzone, so an attack
// then just uses the facing.
const aimProject = new THREE.Vector3()
const TOUCH_AIM_REACH = 220 // px from the player the stick's full push points at
function touchAimAngle(player) {
  if (!input.touchAim.aiming) return null
  aimProject.set(player.position.x, 0.7, player.position.z).project(camera)
  const sx = (aimProject.x * 0.5 + 0.5) * window.innerWidth
  const sy = (-aimProject.y * 0.5 + 0.5) * window.innerHeight
  return screenAimAngle(player, sx + input.touchAim.dx * TOUCH_AIM_REACH, sy + input.touchAim.dy * TOUCH_AIM_REACH)
}

let autoShoot = false // L toggles; holds the trigger for ranged weapons

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(effectivePixelRatio())
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setPixelRatio(renderer.getPixelRatio())
  composer.setSize(window.innerWidth, window.innerHeight)
  gtaoPass.setSize(window.innerWidth, window.innerHeight)
  syncParticleScale()
}
window.addEventListener('resize', handleResize)
// iOS Safari's toolbars change the visible height without always firing 'resize'.
window.addEventListener('orientationchange', () => setTimeout(handleResize, 250))
window.visualViewport?.addEventListener('resize', handleResize)

// Camera screen shake: a short decaying offset added on top of the
// normal follow position. triggerShake restarts it (with a random phase
// per axis so repeated shakes don't look identical); updateShake
// advances it and returns the current offset -- smooth noise (a sum of
// two sines per axis at incommensurate frequencies) rather than a fresh
// random value every frame, which reads as a jittery flicker instead of
// a shake.
const shakeResult = { x: 0, y: 0, z: 0 }

function createShakeState() {
  return { elapsed: null, duration: 0, magnitude: 0, phase: { x: 0, y: 0, z: 0 } }
}

function triggerShake(shake, magnitude, duration) {
  shake.elapsed = 0
  shake.magnitude = magnitude
  shake.duration = duration
  shake.phase = { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2 }
}

function smoothNoise(t, phase) {
  return Math.sin(t * SHAKE_NOISE_FREQUENCY_A + phase) * 0.6 + Math.sin(t * SHAKE_NOISE_FREQUENCY_B + phase * 1.7) * 0.4
}

function updateShake(shake, deltaSeconds) {
  shakeResult.x = shakeResult.y = shakeResult.z = 0
  if (shake.elapsed === null) return shakeResult
  shake.elapsed += deltaSeconds
  if (shake.elapsed >= shake.duration) {
    shake.elapsed = null
    return shakeResult
  }
  const strength = shake.magnitude * (1 - shake.elapsed / shake.duration)
  shakeResult.x = smoothNoise(shake.elapsed, shake.phase.x) * strength
  shakeResult.y = smoothNoise(shake.elapsed, shake.phase.y) * strength
  shakeResult.z = smoothNoise(shake.elapsed, shake.phase.z) * strength
  return shakeResult
}

// Disposes every geometry/material/texture under `object` (recursively),
// then removes it from the scene. Used on restart so rebuilding the world
// doesn't leak GPU resources.
function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (material.map && !material.map.userData.shared) material.map.dispose() // shared = cached textures other objects reuse
        material.dispose()
      })
    }
  })
  scene.remove(object)
}

// Builds a fresh game world: arena, player, pods, and the per-run
// mutable state (wave controller, score, attack, hiding, shake).
// Monsters arrive via waves once the game loop starts stepping them --
// see spawnMonster(). Positions the camera behind the player. Call
// disposeGame() first if rebuilding on top of an existing game.
// 'resort' (the endless sundeck) or 'labyrinth' (3 walled floors); chosen on the start card.
let gameMode = 'resort'

// What persists on this device (banked crystals, pet collection, loadouts,
// skill / power-up levels): see logic/profile.js. Always replace it via setProfile.
let profile = loadProfile()
// The sandbox has every scope and ammo unlocked (for testing); this is the profile as the rifle
// code and the hub should see it. setProfile keeps the real unlocks so the sandbox never saves them.
const sandboxProfile = () => (sandbox ? { ...profile, unlocked: { scopes: Object.keys(SCOPES), ammo: Object.keys(AMMO) } } : profile)
function setProfile(next) {
  profile = sandbox ? { ...next, unlocked: profile.unlocked } : next // the sandbox's all-unlocked view never gets saved
  saveProfile(profile)
  applySlotBonuses()
}
// The skill tree's slot skills widen how many power-ups / pets / abilities you can hold.
function applySlotBonuses() {
  const fx = skillEffects(profile.skills)
  setSlotBonuses({ powerups: fx.slotsPowerups, pets: fx.slotsPets, abilities: fx.slotsAbilities })
}
applySlotBonuses()
const hideLimit = () => POD_HIDE_LIMIT + activeFx(game.inventory.equipped).hideTime
// The equipped power-ups (at their upgrade levels) plus the learned skills, as one effect set.
const activeFx = (equipped) => combineEffects(powerupEffects(equipped, profile.powerups), skillEffects(profile.skills))

// Starts the run with the active loadout's pets (replacing any pets already out).
function applyLoadoutPets(game) {
  disposePets(game.pets, scene)
  const ids = activeLoadoutPets(profile)
  // Runs start with the skill tree's bonus crystals (the Pocket Change / Fat Wallet nodes).
  game.inventory = { ...game.inventory, pets: ids, crystals: Math.round(skillEffects(profile.skills).startCrystals) }
  for (const id of ids) game.pets.push(createPet(id, scene, game.player))
}
const LAB_SPAWN_RADIUS = 30 // pods / chests / monsters stay inside the maze's square
const LAB_EXIT_KEEPOUT = 5 // nothing spawns on the exit pad's cell

// Builds the labyrinth state for floor `index`: the maze data, its arena, the
// shared obstacle lists and the monsters' navigator.
function buildLabyrinthFloor(index) {
  const floor = buildFloor(index)
  const arena = createLabyrinthArena(floor)
  setMonsterNavigator(createNavigator(floor.maze))
  return { floor, arena, props: [...arena.propObstacles, { x: floor.exit.x, z: floor.exit.z, radius: LAB_EXIT_KEEPOUT }] }
}

function createGame() {
  const lab = gameMode === 'labyrinth'
  const labFloor = lab ? buildLabyrinthFloor(0) : null
  if (!lab) setMonsterNavigator(null)
  document.body.classList.toggle('labyrinth', lab)
  scene.environmentIntensity = lab ? ENVIRONMENT_INTENSITY * 0.3 : ENVIRONMENT_INTENSITY
  const arena = lab ? labFloor.arena : createArena(levelAt(0))
  scene.add(arena.group)
  scene.background = new THREE.Color(arena.backgroundColor)
  scene.fog = arena.fog
  setLevelEnvironment(0)

  // The sundeck's umbrellas/loungers/signs are static circular obstacles,
  // built once from arena.propObstacles; pods and chests are dynamic ones
  // (src/logic/podSpawner.js decides where/when) added/removed on top of
  // them. `obstacles` is mutated in place as pods/chests spawn/despawn
  // (via trySpawnPod/despawnPod) so the player and monsters, which hold
  // this same array, stay in sync without it ever being reassigned.
  const obstacles = lab ? [...arena.propObstacles, ...arena.gateObstacles] : [...arena.propObstacles]

  const player = new Player({ spawn: lab ? { x: labFloor.floor.start.x, z: labFloor.floor.start.z } : { x: 0, z: 0 }, obstacles, particleSystem })
  scene.add(player.mesh)

  const game = {
    arena,
    levelIndex: 0, // which place (logic/levels.js) the run is in; advances with each boss defeated
    obstacles,
    props: lab ? labFloor.props : arena.propObstacles, // the static props alone, so pod/chest/monster spawn points can steer clear of them specifically
    player,
    pods: [],
    despawningPods: [], // pod meshes mid-dematerialize: still animating, no longer collidable or counted toward POD_MAX_ACTIVE
    podSpawnerState: createPodSpawnerState(),
    monsters: [],
    spawnEffects: [], // { effect, monster } pairs still materializing in
    waveState: createWaveState(),
    inventory: createInventory(), // crystals, the weapon hotbar, abilities, pets (see logic/inventory.js)
    pets: [], // live pet objects (src/pets.js) for inventory.pets
    chests: [], // chest meshes on the platform
    chestSpawnerState: createPodSpawnerState(),
    pickups: [], // power-ups lying on the ground, waiting to be walked over
    pickupSpawnerState: createPodSpawnerState(),
    cutscene: null, // { boss, mesh, dir, state } while a boss intro is playing; freezes gameplay
    score: 0,
    chainState: createChainState(), // the current kill-chain count/multiplier (src/logic/tricks.js)
    hidingState: createHidingState(),
    attackState: createAttackState(),
    shake: createShakeState(),
    hitstop: createHitstopState(), // a brief freeze of gameplay time on impact; see stepHitstop below
    gameOverRecorded: false,
    gameOverStats: null,
    // Labyrinth runs: which floor, how many of its bosses are down, whether the gate is open.
    labyrinth: lab ? { floorIndex: 0, floor: labFloor.floor, bossesThisFloor: 0, gateOpen: false, won: false } : null,
  }
  if (lab) game.waveState.wavesUntilBoss = 1 // a wave, then a boss, on every floor

  game.spawnRadius = lab ? LAB_SPAWN_RADIUS : ARENA_RADIUS
  const initialPodCount =
    POD_INITIAL_COUNT_MIN + Math.floor(Math.random() * (POD_INITIAL_COUNT_MAX - POD_INITIAL_COUNT_MIN + 1))
  for (let i = 0; i < initialPodCount; i++) trySpawnPod(game)
  trySpawnChest(game)
  trySpawnPerkPickup(game)
  applyLoadoutPets(game)
  game.player.maxHp = Math.round(PLAYER_MAX_HP + skillEffects(profile.skills).maxHp)
  game.player.hp = game.player.maxHp

  camera.position.set(
    player.position.x + CAMERA_OFFSET.x,
    CAMERA_OFFSET.y,
    player.position.z + CAMERA_OFFSET.z,
  )

  return game
}

// Picks a valid spot for a new pod -- random on the platform, spaced
// from other pods/the player/any monster (src/logic/podSpawner.js's
// pickPodSpawnPoint) -- and spawns it there with a materialize effect
// (the pod mesh's own grow-in animation, see hiding.js's updatePod)
// plus a particle flash. A no-op if nothing fit in the attempt budget,
// per pickPodSpawnPoint's contract: this spawn attempt is just skipped,
// not forced into a bad position.
// Which container look (chests, suitcases) fits the current place.
function containerStyle(game) {
  if (game.labyrinth) return 'dungeon'
  return levelAt(game.levelIndex ?? 0).props.style
}

function trySpawnPod(game) {
  const point = pickPodSpawnPoint(Math.random, {
    arenaRadius: game.spawnRadius,
    margin: POD_SPAWN_MARGIN,
    existingPods: game.pods.map((pod) => ({ x: pod.position.x, z: pod.position.z })),
    minSpacing: POD_MIN_SPACING,
    playerPos: game.player.position,
    minPlayerDistance: POD_MIN_PLAYER_DISTANCE,
    monsterPositions: game.monsters.map((mesh) => ({ x: mesh.position.x, z: mesh.position.z })),
    monsterAvoidRadius: POD_MONSTER_AVOID_RADIUS,
    obstacles: game.props,
    obstacleMargin: POD_OBSTACLE_RADIUS,
    maxAttempts: POD_SPAWN_MAX_ATTEMPTS,
  })
  if (point === null) return

  const pod = createPod(point, containerStyle(game))
  const obstacle = { x: point.x, z: point.z, radius: POD_OBSTACLE_RADIUS }
  pod.userData.obstacle = obstacle
  scene.add(pod)
  game.pods.push(pod)
  game.obstacles.push(obstacle)
  burst(
    particleSystem,
    { x: point.x, y: 0.4, z: point.z },
    POD_SPAWN_FLASH_COLOR,
    POD_SPAWN_BURST_COUNT,
    POD_SPAWN_BURST_SPEED,
  )
}

// Places a chest: at `at` if given (a boss's free reward chest), otherwise
// somewhere valid on the platform (spaced from other chests/pods, the
// player and monsters, like pods). `cost` defaults to the next price on
// the climbing scale. A no-op if nothing fit.
function trySpawnChest(game, { at = null, cost = null } = {}) {
  const point =
    at ??
    pickPodSpawnPoint(Math.random, {
      arenaRadius: game.spawnRadius,
      margin: CHEST_SPAWN_MARGIN,
      existingPods: [...game.pods, ...game.chests].map((m) => ({ x: m.position.x, z: m.position.z })),
      minSpacing: CHEST_MIN_SPACING,
      playerPos: game.player.position,
      minPlayerDistance: POD_MIN_PLAYER_DISTANCE,
      monsterPositions: game.monsters.map((mesh) => ({ x: mesh.position.x, z: mesh.position.z })),
      monsterAvoidRadius: POD_MONSTER_AVOID_RADIUS,
      obstacles: game.props,
      obstacleMargin: CHEST_OBSTACLE_RADIUS,
      maxAttempts: POD_SPAWN_MAX_ATTEMPTS,
    })
  if (point === null) return

  const chest = createChest(point, cost ?? Math.max(1, Math.round(chestCost(game.inventory.chestsOpened) * activeFx(game.inventory.equipped).chestPrice)), containerStyle(game))
  const obstacle = { x: point.x, z: point.z, radius: CHEST_OBSTACLE_RADIUS }
  chest.userData.obstacle = obstacle
  scene.add(chest)
  game.chests.push(chest)
  game.obstacles.push(obstacle)
  burst(particleSystem, { x: point.x, y: 0.5, z: point.z }, CHEST_FLASH_COLOR, POD_SPAWN_BURST_COUNT, POD_SPAWN_BURST_SPEED)
}

// Drops a power-up pickup (one you don't own yet, and that isn't already lying
// around) at `at`, or somewhere valid on the map. A no-op if nothing fits or
// you own them all.
function trySpawnPerkPickup(game, at = null) {
  const lying = new Set(game.pickups.map((p) => p.userData.id))
  const options = availablePowerups(game.inventory).filter((id) => !lying.has(id))
  if (options.length === 0) return
  const point =
    at ??
    pickPodSpawnPoint(Math.random, {
      arenaRadius: game.spawnRadius,
      margin: CHEST_SPAWN_MARGIN,
      existingPods: [...game.pods, ...game.chests, ...game.pickups].map((m) => ({ x: m.position.x, z: m.position.z })),
      minSpacing: CHEST_MIN_SPACING,
      playerPos: game.player.position,
      minPlayerDistance: POD_MIN_PLAYER_DISTANCE,
      monsterPositions: game.monsters.map((mesh) => ({ x: mesh.position.x, z: mesh.position.z })),
      monsterAvoidRadius: POD_MONSTER_AVOID_RADIUS,
      obstacles: game.props,
      obstacleMargin: CHEST_OBSTACLE_RADIUS,
      maxAttempts: POD_SPAWN_MAX_ATTEMPTS,
    })
  if (point === null) return
  const pickup = createPerkPickup(point, options[Math.floor(Math.random() * options.length)])
  scene.add(pickup)
  game.pickups.push(pickup)
  burst(particleSystem, { x: point.x, y: 0.6, z: point.z }, 0xffffff, POD_SPAWN_BURST_COUNT, POD_SPAWN_BURST_SPEED)
}

// Switches the hotbar to `slot` (if filled) and swaps the sword model.
function selectWeapon(game, slot) {
  const next = selectWeaponSlot(game.inventory, slot)
  if (next.selected === game.inventory.selected) return
  game.inventory = next
  setPlayerWeapon(game.player.mesh, selectedWeaponId(next))
  // Cancel any swing in flight (it was animating the old model).
  game.attackState.swingElapsed = null
  clearSwingTrail(swingTrail)
}

// Rage's damage multiplier right now (the Bullet Ring ability scales with it).
function elapsedDamageMultiplier(player, now) {
  return now < player.rageUntil ? RAGE_DAMAGE_MULTIPLIER : 1
}

// What the weapon effects draw with (see src/weaponFx.js).
function weaponFxContext() {
  return {
    particleSystem,
    shockwavePool,
    warp,
    shake: (amount) => triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * amount, SHAKE_HIT_DURATION),
  }
}

// Warp Fields and falling meteors live here (per session, cleared on restart).
const warpFields = []
const meteors = []

// The ground point an ability aims at: under the mouse (or the touch aim
// stick), else straight ahead of the player, held within `range`.
function abilityTargetPoint(player, range) {
  let target
  if (input.mouse.moved && !input.touchMode) {
    aimNdc.set((input.mouse.x / window.innerWidth) * 2 - 1, -(input.mouse.y / window.innerHeight) * 2 + 1)
    aimRaycaster.setFromCamera(aimNdc, camera)
    if (aimRaycaster.ray.intersectPlane(aimPlane, aimPoint)) target = { x: aimPoint.x, z: aimPoint.z }
  }
  if (!target) {
    const angle = touchAimAngle(player) ?? player.facing
    target = { x: player.position.x + Math.sin(angle) * 8, z: player.position.z + Math.cos(angle) * 8 }
  }
  const held = clampTargetToRange(player.position, target, range)
  return clampToPlatform(held, ARENA_RADIUS - 1)
}

// Sparks strung between two ground points (a streak, a drain beam).
function streak(a, b, color, steps, y = 0.9) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    burst(particleSystem, { x: a.x + (b.x - a.x) * t, y, z: a.z + (b.z - a.z) * t }, color, 2, 1.2)
  }
}

// A tall column of sparks rising from the ground (heals, lightning).
function column(x, z, color, height, steps = 12) {
  for (let i = 0; i <= steps; i++) burst(particleSystem, { x, y: (height * i) / steps, z }, color, 3, 1.8)
}

// A ring of sparks around a point.
function sparkRing(x, z, radius, color, steps = 16) {
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    burst(particleSystem, { x: x + Math.sin(a) * radius, y: 0.7, z: z + Math.cos(a) * radius }, color, 2, 2)
  }
}

// Sustained auras while a timed buff is up: orbiting bubble sparks (shield),
// rising flames (rage), crackling bolts (frenzy), speed streaks (sprint).
function updateBuffAuras(player, now, dt) {
  const { x, z } = player.position
  if (now < player.shieldUntil) {
    const a = now * 6
    for (const k of [0, Math.PI]) burst(particleSystem, { x: x + Math.sin(a + k) * 1.3, y: 0.9 + Math.sin(a * 0.7) * 0.4, z: z + Math.cos(a + k) * 1.3 }, 0x66f0ff, 1, 0.4)
  }
  if (now < player.rageUntil) {
    burst(particleSystem, { x: x + (Math.random() - 0.5) * 1.2, y: 0.4, z: z + (Math.random() - 0.5) * 1.2 }, Math.random() < 0.5 ? 0xff4a3a : 0xffb454, 2, 1.2, 2.5)
  }
  if (now < player.frenzyUntil) {
    const a = Math.random() * Math.PI * 2
    burst(particleSystem, { x: x + Math.sin(a) * 1.1, y: 0.4 + Math.random() * 1.3, z: z + Math.cos(a) * 1.1 }, 0xfff27a, 2, 2.5)
  }
  if (now < player.sprintUntil && player.speed > 0.5) {
    burst(particleSystem, { x: x - Math.sin(player.facing) * 0.8, y: 0.3 + Math.random() * 0.4, z: z - Math.cos(player.facing) * 0.8 }, 0x9be37a, 3, 0.8)
  }
}

// Opens a Warp Field: the screen visibly twists over the area, and while it
// lasts it drags monsters toward its centre, confuses them (they stumble
// about instead of fighting) and hurts them in ticks.
function openWarpField(at) {
  const def = ABILITIES.vacuum
  warpFields.push({ x: at.x, z: at.z, radius: def.radius, life: def.duration, age: 0, tick: 0.3 })
  warp.add('swirl', at.x, at.z, def.radius * 1.15, def.duration)
  spawnShockwave(shockwavePool, at.x, at.z, def.radius, 0xa070ff)
}

function updateWarpFields(game, dt, now) {
  for (let i = warpFields.length - 1; i >= 0; i--) {
    const field = warpFields[i]
    field.age += dt
    if (field.age >= field.life) {
      warpFields.splice(i, 1)
      continue
    }
    field.tick -= dt
    const ticking = field.tick <= 0
    if (ticking) field.tick = 0.5
    // A ring of sparks spiralling inward sells the pull.
    const a = field.age * 5
    for (const k of [0, 2.1, 4.2]) {
      burst(particleSystem, { x: field.x + Math.sin(a + k) * field.radius * 0.9, y: 0.6, z: field.z + Math.cos(a + k) * field.radius * 0.9 }, 0xc9a8ff, 1, 1.5)
    }
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      if (!inCircle(mesh.position.x, mesh.position.z, field.x, field.z, field.radius + (mesh.userData.reachBonus ?? 0))) continue
      if (!mesh.userData.isBoss) mesh.userData.confusedUntil = now + 0.6
      const dx = field.x - mesh.position.x
      const dz = field.z - mesh.position.z
      const d = Math.hypot(dx, dz)
      const pull = Math.min(d, (mesh.userData.isBoss ? 0.8 : 2.4) * dt)
      if (d > 1e-4) {
        mesh.position.x += (dx / d) * pull
        mesh.position.z += (dz / d) * pull
      }
      if (ticking) {
        damageMonster(mesh, ABILITIES.vacuum.damage, { fromPos: { x: field.x, z: field.z }, knockback: 0, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
      }
    }
  }
}

// A meteor streaks down from the sky onto `at`, then blasts.
function dropMeteor(at, { damage = null, radius = null } = {}) {
  const group = new THREE.Group()
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd08a }))
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }))
  group.add(core, glow)
  scene.add(group)
  meteors.push({ group, x: at.x, z: at.z, age: 0, fall: 0.7, damage, radius })
  spawnShockwave(shockwavePool, at.x, at.z, radius ?? ABILITIES.meteor.radius, 0xff7a2e) // the landing marker
}

function disposeMeteor(meteor) {
  scene.remove(meteor.group)
  meteor.group.traverse((c) => {
    if (c.geometry) c.geometry.dispose()
    if (c.material) c.material.dispose()
  })
}

function updateMeteors(game, dt) {
  const def = ABILITIES.meteor
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.age += dt
    const t = Math.min(1, m.age / m.fall)
    m.group.position.set(m.x - (1 - t) * 8, 0.7 + (1 - t) * (1 - t) * 30, m.z - (1 - t) * 4)
    burst(particleSystem, m.group.position, 0xff8a3a, 2, 1.5)
    if (t < 1) continue
    disposeMeteor(m)
    meteors.splice(i, 1)
    const at = { x: m.x, z: m.z }
    const blastRadius = m.radius ?? def.radius
    const blastDamage = m.damage ?? def.damage
    spawnShockwave(shockwavePool, at.x, at.z, blastRadius, 0xffb454)
    warp.add('ripple', at.x, at.z, blastRadius * 1.6, 0.6)
    burst(particleSystem, { x: at.x, y: 1, z: at.z }, 0xff7a2e, 60, 6, 1)
    shardBurst(particleSystem, { x: at.x, y: 0.6, z: at.z }, 0xffb454, 18, 4)
    triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    sfx.play('bossSlam', at)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      if (Math.hypot(mesh.position.x - at.x, mesh.position.z - at.z) > blastRadius + (mesh.userData.reachBonus ?? 0)) continue
      damageMonster(mesh, blastDamage, { fromPos: at, knockback: 2.5, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
    }
  }
}

// Bulwark: a temporary wall of glowing blocks across the player's facing. Its
// blocks are circle obstacles (so monsters and the player collide with them)
// until it crumbles.
const bulwarkWalls = []
function raiseBulwarkWall(game, now) {
  const def = ABILITIES.bulwark
  const { player } = game
  const fx = Math.sin(player.facing)
  const fz = Math.cos(player.facing)
  const group = new THREE.Group()
  const blocks = []
  const material = new THREE.MeshStandardMaterial({ color: 0x9fb4d0, emissive: 0x4a6a9a, emissiveIntensity: 0.6, roughness: 0.4, transparent: true, opacity: 0.9 })
  const count = def.blocks
  for (let i = 0; i < count; i++) {
    const side = (i - (count - 1) / 2) * def.spacing
    const x = player.position.x + fx * def.distance - fz * side
    const z = player.position.z + fz * def.distance + fx * side
    const obstacle = { x, z, radius: def.spacing * 0.6 }
    game.obstacles.push(obstacle)
    const block = new THREE.Mesh(new THREE.BoxGeometry(def.spacing * 1.05, 1.6, 0.9), material)
    block.position.set(x, 0.8, z)
    block.rotation.y = player.facing
    block.castShadow = true
    group.add(block)
    blocks.push(obstacle)
    burst(particleSystem, { x, y: 0.8, z }, 0xb0c4de, 8, 2.5)
  }
  scene.add(group)
  bulwarkWalls.push({ game, group, blocks, material, expires: now + def.duration })
  spawnShockwave(shockwavePool, player.position.x + fx * def.distance, player.position.z + fz * def.distance, 2.5, 0xb0c4de)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
}

function removeBulwarkWall(wall) {
  for (const obstacle of wall.blocks) {
    const index = wall.game.obstacles.indexOf(obstacle)
    if (index !== -1) wall.game.obstacles.splice(index, 1)
  }
  scene.remove(wall.group)
  wall.group.traverse((child) => child.geometry?.dispose())
  wall.material.dispose()
}

// Every standing Bulwark block: shots (yours and the enemies') stop against these.
const bulwarkBlockers = () => bulwarkWalls.flatMap((wall) => wall.blocks)

function updateBulwarkWalls(now) {
  for (let i = bulwarkWalls.length - 1; i >= 0; i--) {
    const wall = bulwarkWalls[i]
    const left = wall.expires - now
    if (left > 0) {
      if (left < 1) wall.material.opacity = 0.9 * left // fades out over its last second
      continue
    }
    for (const obstacle of wall.blocks) burst(particleSystem, { x: obstacle.x, y: 0.8, z: obstacle.z }, 0xb0c4de, 6, 2)
    removeBulwarkWall(wall)
    bulwarkWalls.splice(i, 1)
  }
}

// Fires the ability in `slot` if it's ready, applying its effect.
// Fades the player's whole model to `alpha` (1 restores it). Original
// transparency settings are remembered per material the first time.
function setGhostLook(root, alpha) {
  if (root.userData.ghostAlpha === alpha) return
  root.userData.ghostAlpha = alpha
  root.traverse((child) => {
    for (const m of child.material ? [].concat(child.material) : []) {
      if (m.userData.ghostBase === undefined) m.userData.ghostBase = { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite }
      const base = m.userData.ghostBase
      const transparent = alpha < 1 || base.transparent
      if (m.transparent !== transparent) m.needsUpdate = true // only a flag flip needs a shader rebuild
      m.transparent = transparent
      m.opacity = base.opacity * alpha
      m.depthWrite = alpha < 1 ? false : base.depthWrite
    }
  })
}

function activateAbility(game, slot, now) {
  const used = useAbility(game.inventory, slot, now, activeFx(game.inventory.equipped).haste)
  if (!used.abilityId) return
  game.inventory = used.inventory
  const { player } = game
  const center = { x: player.position.x, y: 0.8, z: player.position.z }

  if (used.abilityId === 'blink') {
    const target = clampToPlatform(
      resolveArenaMove(
        player.position,
        { x: Math.sin(player.facing) * BLINK_DISTANCE, z: Math.cos(player.facing) * BLINK_DISTANCE },
        PLAYER_RADIUS,
        game.obstacles,
      ),
      ARENA_RADIUS - 1,
    )
    burst(particleSystem, center, 0xe9a3ff, 24, 3)
    warp.add('swirl', player.position.x, player.position.z, 2.8, 0.35) // the old spot collapses
    streak(player.position, target, 0xe9a3ff, 12)
    player.position = target
    player.mesh.position.x = target.x
    player.mesh.position.z = target.z
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + BLINK_IFRAMES)
    burst(particleSystem, { x: target.x, y: 0.8, z: target.z }, 0xe9a3ff, 24, 3)
    warp.add('ripple', target.x, target.z, 3.5, 0.45) // the new spot pops
  } else if (used.abilityId === 'shockwave') {
    spawnShockwave(shockwavePool, player.position.x, player.position.z, SHOCKWAVE_RADIUS, SHOCKWAVE_COLOR)
    warp.add('ripple', player.position.x, player.position.z, SHOCKWAVE_RADIUS * 1.2, 0.6)
    burst(particleSystem, center, SHOCKWAVE_COLOR, 36, 5)
    triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      const distance = Math.hypot(mesh.position.x - player.position.x, mesh.position.z - player.position.z)
      if (distance > SHOCKWAVE_RADIUS + (mesh.userData.reachBonus ?? 0)) continue
      damageMonster(mesh, SHOCKWAVE_DAMAGE, {
        fromPos: player.position,
        knockback: SHOCKWAVE_KNOCKBACK,
        obstacles: game.obstacles,
        particleSystem,
        cause: 'shockwave',
        hitstop: game.hitstop,
      })
    }
  } else if (used.abilityId === 'heal') {
    player.hp = Math.min(player.maxHp, player.hp + HEAL_PULSE_AMOUNT)
    burst(particleSystem, center, 0x7dffb0, 30, 2.5, 1)
    column(player.position.x, player.position.z, 0x7dffb0, 4.5)
    sparkRing(player.position.x, player.position.z, 1.6, 0xbfffd8)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 3, 0x7dffb0)
  } else if (used.abilityId === 'shield') {
    player.shieldUntil = now + ABILITIES.shield.duration
    burst(particleSystem, center, 0x66f0ff, 24, 2.5)
    sparkRing(player.position.x, player.position.z, 1.4, 0x66f0ff, 20)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 2.5, 0x66f0ff)
    warp.add('ripple', player.position.x, player.position.z, 2.5, 0.45)
  } else if (used.abilityId === 'rage') {
    player.rageUntil = now + ABILITIES.rage.duration
    burst(particleSystem, center, 0xff4a3a, 30, 3.5, 0.5)
    column(player.position.x, player.position.z, 0xff4a3a, 3.5, 8)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 4, 0xff4a3a)
    warp.add('ripple', player.position.x, player.position.z, 4.5, 0.55)
    triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
  } else if (used.abilityId === 'lunge') {
    const start = { x: player.position.x, z: player.position.z }
    const dash = { x: Math.sin(player.facing) * LUNGE_DISTANCE, z: Math.cos(player.facing) * LUNGE_DISTANCE }
    const target = clampToPlatform(resolveArenaMove(start, dash, PLAYER_RADIUS, game.obstacles), ARENA_RADIUS - 1)
    // Everything within LUNGE_WIDTH of the path from start to target gets slashed.
    const segX = target.x - start.x
    const segZ = target.z - start.z
    const segLengthSq = Math.max(segX * segX + segZ * segZ, 1e-6)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      const t = Math.min(1, Math.max(0, ((mesh.position.x - start.x) * segX + (mesh.position.z - start.z) * segZ) / segLengthSq))
      const distance = Math.hypot(mesh.position.x - (start.x + segX * t), mesh.position.z - (start.z + segZ * t))
      if (distance > LUNGE_WIDTH + mesh.userData.radius) continue
      damageMonster(mesh, LUNGE_DAMAGE, { fromPos: start, knockback: 1.5, obstacles: game.obstacles, particleSystem, cause: 'sword', hitstop: game.hitstop })
    }
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      burst(particleSystem, { x: start.x + segX * t, y: 0.8, z: start.z + segZ * t }, LUNGE_COLOR, 10, 2.5)
    }
    warp.add('ripple', target.x, target.z, 3.2, 0.4)
    streak(start, target, 0xffffff, 14)
    triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
    player.position = target
    player.mesh.position.x = target.x
    player.mesh.position.z = target.z
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + LUNGE_IFRAMES)
  } else if (used.abilityId === 'thunder') {
    const struck = game.monsters
      .filter((m) => !m.userData.dying && !m.userData.spawning && !m.userData.falling)
      .map((m) => ({ m, distance: Math.hypot(m.position.x - player.position.x, m.position.z - player.position.z) }))
      .filter(({ distance }) => distance <= THUNDER_RANGE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, THUNDER_TARGETS)
    for (const { m } of struck) {
      column(m.position.x, m.position.z, THUNDER_COLOR, 16, 20)
      column(m.position.x + 0.3, m.position.z - 0.2, 0xffffff, 16, 10)
      spawnShockwave(shockwavePool, m.position.x, m.position.z, 2.5, THUNDER_COLOR)
      warp.add('ripple', m.position.x, m.position.z, 2.5, 0.35)
      damageMonster(m, THUNDER_DAMAGE, { fromPos: player.position, knockback: 0.5, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
    }
    if (struck.length > 0) triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
    burst(particleSystem, center, THUNDER_COLOR, 16, 3)
  } else if (used.abilityId === 'gravity') {
    spawnShockwave(shockwavePool, player.position.x, player.position.z, GRAVITY_RADIUS, GRAVITY_COLOR)
    warp.add('swirl', player.position.x, player.position.z, GRAVITY_RADIUS * 0.9, 1.1)
    burst(particleSystem, center, GRAVITY_COLOR, 30, 4)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      const dx = mesh.position.x - player.position.x
      const dz = mesh.position.z - player.position.z
      const distance = Math.hypot(dx, dz)
      if (distance > GRAVITY_RADIUS) continue
      // Bosses only get tugged part of the way.
      const wanted = Math.max(GRAVITY_PULL_DISTANCE, 0) + (mesh.userData.reachBonus ?? 0)
      const pulledTo = mesh.userData.isBoss ? distance - (distance - wanted) * 0.3 : Math.min(distance, wanted)
      const scale = distance > 1e-4 ? pulledTo / distance : 1
      mesh.position.x = player.position.x + dx * scale
      mesh.position.z = player.position.z + dz * scale
      damageMonster(mesh, GRAVITY_DAMAGE, { fromPos: player.position, knockback: 0, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
    }
  } else if (used.abilityId === 'volley') {
    const ring = {
      pellets: VOLLEY_COUNT,
      spread: (Math.PI * 2 * (VOLLEY_COUNT - 1)) / VOLLEY_COUNT,
      damage: VOLLEY_DAMAGE,
      knockback: 0.8,
      bullet: { speed: 20, life: 0.8, radius: 0.22, pierce: 1, explode: 0, color: 0xff9a3a },
    }
    fireBullets(bulletPool, makeBullets(ring, { x: player.position.x, z: player.position.z, aimAngle: player.facing, damageMultiplier: elapsedDamageMultiplier(player, now) }))
    burst(particleSystem, center, 0xff9a3a, 20, 3)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 3.5, 0xff9a3a)
    sparkRing(player.position.x, player.position.z, 1.2, 0xff9a3a, 24)
    warp.add('ripple', player.position.x, player.position.z, 3.5, 0.4)
  } else if (used.abilityId === 'drain') {
    spawnShockwave(shockwavePool, player.position.x, player.position.z, DRAIN_RADIUS, DRAIN_COLOR)
    let drained = 0
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      const distance = Math.hypot(mesh.position.x - player.position.x, mesh.position.z - player.position.z)
      if (distance > DRAIN_RADIUS + (mesh.userData.reachBonus ?? 0)) continue
      damageMonster(mesh, DRAIN_DAMAGE, { fromPos: player.position, knockback: 0.4, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
      burst(particleSystem, { x: mesh.position.x, y: 0.8, z: mesh.position.z }, DRAIN_COLOR, 8, 2)
      streak(mesh.position, player.position, DRAIN_COLOR, 10, 1.2) // life streams back to you
      drained += 1
    }
    player.hp = Math.min(player.maxHp, player.hp + drained * DRAIN_HEAL_PER_HIT)
    burst(particleSystem, center, DRAIN_COLOR, 20, 2.5, 1)
    warp.add('swirl', player.position.x, player.position.z, DRAIN_RADIUS * 0.8, 0.9)
  } else if (used.abilityId === 'frenzy') {
    player.frenzyUntil = now + ABILITIES.frenzy.duration
    burst(particleSystem, center, 0xfff27a, 30, 3.5, 0.5)
    sparkRing(player.position.x, player.position.z, 1.5, 0xfff27a, 20)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 3.5, 0xfff27a)
    warp.add('ripple', player.position.x, player.position.z, 3.5, 0.45)
  } else if (used.abilityId === 'sprint') {
    player.sprintUntil = now + ABILITIES.sprint.duration
    burst(particleSystem, center, 0x9be37a, 24, 3)
    streak(player.position, { x: player.position.x - Math.sin(player.facing) * 4, z: player.position.z - Math.cos(player.facing) * 4 }, 0x9be37a, 10)
    warp.add('ripple', player.position.x, player.position.z, 3, 0.4)
  } else if (used.abilityId === 'meteor') {
    dropMeteor(abilityTargetPoint(player, ABILITIES.meteor.range))
  } else if (used.abilityId === 'ghost') {
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + ABILITIES.ghost.duration)
    player.ghostUntil = now + ABILITIES.ghost.duration
    warp.add('ripple', player.position.x, player.position.z, 3, 0.5)
    burst(particleSystem, center, 0xdcd6ff, 30, 3, 0.5)
  } else if (used.abilityId === 'vacuum') {
    attractAllCrystals(crystalSystem)
    openWarpField(abilityTargetPoint(player, ABILITIES.vacuum.range))
  } else if (used.abilityId === 'quake') {
    const def = ABILITIES.quake
    warp.add('ripple', player.position.x, player.position.z, def.radius, 0.9)
    for (const r of [def.radius * 0.4, def.radius * 0.7, def.radius]) spawnShockwave(shockwavePool, player.position.x, player.position.z, r, 0xb08a5a)
    burst(particleSystem, center, 0xb08a5a, 40, 5)
    triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      const distance = Math.hypot(mesh.position.x - player.position.x, mesh.position.z - player.position.z)
      if (distance > def.radius + (mesh.userData.reachBonus ?? 0)) continue
      damageMonster(mesh, def.damage, { fromPos: player.position, knockback: 1.8, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
    }
  } else if (used.abilityId === 'fanblast') {
    const fan = {
      pellets: 7,
      spread: 0.9,
      damage: ABILITIES.fanblast.damage,
      knockback: 1.2,
      bullet: { speed: 24, life: 0.6, radius: 0.26, pierce: 1, explode: 0, color: 0xff5fa8 },
    }
    fireBullets(bulletPool, makeBullets(fan, { x: player.position.x, z: player.position.z, aimAngle: player.facing, damageMultiplier: elapsedDamageMultiplier(player, now) }))
    burst(particleSystem, center, 0xff5fa8, 20, 3)
  } else if (used.abilityId === 'dizzy') {
    const def = ABILITIES.dizzy
    spawnShockwave(shockwavePool, player.position.x, player.position.z, def.radius, 0xffd23f)
    warp.add('swirl', player.position.x, player.position.z, def.radius * 0.8, 0.8)
    burst(particleSystem, center, 0xffd23f, 30, 4)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      if (Math.hypot(mesh.position.x - player.position.x, mesh.position.z - player.position.z) > def.radius + (mesh.userData.reachBonus ?? 0)) continue
      if (!mesh.userData.isBoss) mesh.userData.confusedUntil = now + def.duration
      damageMonster(mesh, def.damage, { fromPos: player.position, knockback: 0.4, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
    }
  } else if (used.abilityId === 'starfall') {
    const def = ABILITIES.starfall
    game.monsters
      .filter((m) => !m.userData.dying && !m.userData.spawning && !m.userData.falling)
      .map((m) => ({ m, d: Math.hypot(m.position.x - player.position.x, m.position.z - player.position.z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, def.targets)
      .forEach(({ m }) => dropMeteor({ x: m.position.x, z: m.position.z }, { damage: def.damage, radius: def.radius }))
    burst(particleSystem, center, 0xffe9a0, 20, 3)
  } else if (used.abilityId === 'crossfire') {
    for (let i = 0; i < 4; i++) {
      const arrow = {
        pellets: 1,
        spread: 0,
        damage: ABILITIES.crossfire.damage,
        knockback: 1,
        bullet: { speed: 30, life: 0.75, radius: 0.28, pierce: 3, explode: 0, color: 0x7ae8ff },
      }
      fireBullets(bulletPool, makeBullets(arrow, { x: player.position.x, z: player.position.z, aimAngle: player.facing + (i * Math.PI) / 2, damageMultiplier: elapsedDamageMultiplier(player, now) }))
    }
    burst(particleSystem, center, 0x7ae8ff, 20, 3)
    sparkRing(player.position.x, player.position.z, 1.2, 0x7ae8ff, 20)
  } else if (used.abilityId === 'bulwark') {
    raiseBulwarkWall(game, now)
  } else if (used.abilityId === 'refresh') {
    // Every other ability comes back right away; Second Wind itself stays on cooldown.
    const { refresh } = game.inventory.abilityReadyAt
    game.inventory = { ...game.inventory, abilityReadyAt: { refresh } }
    burst(particleSystem, center, 0x7dffb0, 30, 3, 1)
    ;[[2, 0xff5fa8], [3.5, 0xffe14a], [5, 0x66f0ff]].forEach(([r, c]) => spawnShockwave(shockwavePool, player.position.x, player.position.z, r, c))
    warp.add('swirl', player.position.x, player.position.z, 4, 0.7)
    column(player.position.x, player.position.z, 0xffffff, 5)
  }
}

// Pays for and opens a chest, then hands out what rolled: a hotbar weapon
// (equipped right away), an ability (bound to the next free key), or a
// pet. Once your loadout is full it pays out score and a heal instead.
function openChestNow(game, chest, now) {
  tutorialEvent('chest')
  const { cost } = chest.userData
  const paid = spendCrystals(game.inventory, cost)
  if (!paid.ok) return
  game.inventory = cost > 0 ? { ...paid.inventory, chestsOpened: paid.inventory.chestsOpened + 1 } : paid.inventory
  openChest(chest)
  sfx.play('chestOpen')
  const obstacleIndex = game.obstacles.indexOf(chest.userData.obstacle)
  if (obstacleIndex !== -1) game.obstacles.splice(obstacleIndex, 1)

  const point = { x: chest.position.x, y: 0.8, z: chest.position.z }
  burst(particleSystem, point, CHEST_FLASH_COLOR, 40, 4, 1)
  shardBurst(particleSystem, point, CHEST_FLASH_COLOR, 16, 3)

  const loot = rollChestLoot(game.inventory, Math.random, profile.unlocked)
  if (!loot) {
    game.score += CHEST_ALL_OWNED_SCORE
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + CHEST_ALL_OWNED_HEAL)
    showLootToast(hud, { title: 'LOADOUT FULL', name: `+${CHEST_ALL_OWNED_SCORE} SCORE`, blurb: 'Plus a big heal' })
    return
  }

  // A pet you find is yours for good: it goes into your collection (and so the Loadout page)
  // right away, even if you then decline to swap it in for the one you're carrying.
  if (loot.kind === 'pet' && !sandbox) setProfile(addToCollection(profile, [loot.id]))

  // Slots full: ask which of your items to swap out (the game pauses).
  if (needsSwap(game.inventory, loot)) {
    pendingSwapLoot = loot
    swapPanel.show(loot, swappableIds(game.inventory, loot.kind))
    return
  }
  receiveLoot(game, loot)
}

let pendingSwapLoot = null

// Hands over a rolled item (already swapped into the inventory if the slots
// were full) and sets up its in-world side: the held weapon model, or the pet.
function receiveLoot(game, loot, swappedOut = null) {
  if (loot.kind === 'scope' || loot.kind === 'ammo') {
    // Attachments are kept on the profile and go straight onto the rifle in your hands.
    const table = loot.kind === 'scope' ? SCOPES : AMMO
    setProfile(unlockAttachment(profile, loot.kind, loot.id))
    const held = selectedWeaponId(game.inventory)
    if (WEAPONS[held].rifle) setProfile(setRifleOption(profile, held, loot.kind, loot.id))
    showLootToast(hud, { title: loot.kind === 'scope' ? 'NEW SCOPE' : 'NEW AMMO', name: table[loot.id].name, icon: { kind: 'weapon', id: WEAPONS[held].rifle ? held : game.inventory.weapons.find((w) => WEAPONS[w].rifle) }, blurb: `${table[loot.id].blurb}. [ ] to switch, J to upgrade` })
    return
  }
  if (swappedOut) game.inventory = swapItem(game.inventory, loot, swappedOut)
  else game.inventory = grantItem(game.inventory, loot)
  const verb = swappedOut ? 'SWAPPED IN' : 'NEW'
  if (loot.kind === 'weapon') {
    setPlayerWeapon(game.player.mesh, loot.id)
    game.attackState.swingElapsed = null
    clearSwingTrail(swingTrail)
    const weapon = WEAPONS[loot.id]
    showLootToast(hud, { title: `${verb} WEAPON  [${game.inventory.weapons.indexOf(loot.id) + 1}]`, name: weapon.name, icon: { kind: 'weapon', id: weapon.id }, blurb: weapon.blurb })
  } else if (loot.kind === 'ability') {
    const ability = ABILITIES[loot.id]
    const key = ABILITY_KEYS[game.inventory.abilities.indexOf(loot.id)].replace('Key', '')
    showLootToast(hud, { title: `${verb} ABILITY  [${key}]`, name: ability.name, icon: { kind: 'ability', id: ability.id }, blurb: ability.blurb })
  } else if (loot.kind === 'powerup') {
    const perk = POWERUPS[loot.id]
    const on = game.inventory.equipped.includes(loot.id)
    showLootToast(hud, { title: on ? 'NEW POWER-UP  [equipped, Tab to change]' : 'NEW POWER-UP  [Tab to equip]', name: perk.name, icon: { kind: 'powerup', id: perk.id }, blurb: perk.blurb })
  } else {
    if (swappedOut) {
      const index = game.pets.findIndex((p) => p.def.id === swappedOut)
      if (index !== -1) {
        const [gone] = game.pets.splice(index, 1)
        disposePets([gone], scene)
      }
    }
    game.pets.push(createPet(loot.id, scene, game.player))
    const pet = PETS[loot.id]
    showLootToast(hud, { title: `${verb} PET`, name: pet.name, icon: { kind: 'pet', id: pet.id }, blurb: pet.blurb })
  }
}

// Starts a pod's dematerialize (shrink-away) animation and moves it
// out of the active lists (so it stops blocking movement and no longer
// counts toward POD_MAX_ACTIVE) into despawningPods, where it keeps
// animating/rendering until that finishes -- the main loop disposes it
// then. Pods are single-use: every path that vacates one (exiting
// early with E, or the hide-limit ejecting the player) calls this.
function despawnPod(game, pod) {
  const obstacleIndex = game.obstacles.indexOf(pod.userData.obstacle)
  if (obstacleIndex !== -1) game.obstacles.splice(obstacleIndex, 1)
  const podIndex = game.pods.indexOf(pod)
  if (podIndex !== -1) game.pods.splice(podIndex, 1)
  game.despawningPods.push(pod)
  startPodDematerialize(pod)
  burst(
    particleSystem,
    { x: pod.position.x, y: 0.4, z: pod.position.z },
    POD_SPAWN_FLASH_COLOR,
    POD_SPAWN_BURST_COUNT,
    POD_SPAWN_BURST_SPEED,
  )
}

// Spawns one monster of `type` on a ring around the PLAYER's current
// position (not the platform's actual edge -- on a radius-48 arena that
// would take far too long to close in), wandering once it finishes
// materializing. Added to the scene and game.monsters right away
// (marked userData.spawning so AI/combat/separation skip it), with a
// matching spawn-in effect tracked in game.spawnEffects until it
// finishes.
function spawnMonster(game, type, { at = null, effectOptions, hpScale = 1, facePlayer = false } = {}) {
  const stats = MONSTER_TYPES[type]
  const spawn = at ?? spawnPointNearPlayer(
    Math.random,
    game.player.position,
    SPAWN_NEAR_PLAYER_MIN_DIST,
    SPAWN_NEAR_PLAYER_MAX_DIST,
    game.spawnRadius,
    SPAWN_NEAR_PLAYER_MARGIN,
    game.props,
    stats.radius,
    game.labyrinth ? 40 : 10,
  )

  const mesh = createMonsterMesh(type)
  mesh.position.x = spawn.x
  mesh.position.z = spawn.z
  mesh.rotation.y = facePlayer
    ? Math.atan2(game.player.position.x - spawn.x, game.player.position.z - spawn.z)
    : Math.random() * Math.PI * 2
  mesh.userData.hp = Math.round(stats.hp * hpScale)
  mesh.userData.maxHp = mesh.userData.hp
  mesh.userData.isBoss = stats.boss === true
  mesh.userData.reachBonus = stats.reachBonus ?? 0
  mesh.userData.deep = stats.deep === true // a deep dweller: only reachable by diving
  mesh.userData.reflect = stats.reflect ?? null // a mirror bounces attacks that hit its front (null while its shield is broken)
  mesh.userData.reflectCfg = stats.reflect ?? null
  mesh.userData.shield = stats.reflect ? createShield(stats.reflect) : null // wears out after `hits` bounces
  mesh.userData.knockbackScale = stats.knockbackScale ?? 1
  mesh.userData.radius = stats.radius
  mesh.userData.falling = false
  mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
  mesh.userData.spawning = true
  Object.assign(mesh.userData, createMonsterAIState(stats))
  // Regular monsters get tougher every wave (bosses have their own scaling).
  if (!stats.boss) {
    const scale = enemyScale(game.waveState?.waveNumber ?? 1)
    mesh.userData.hp = mesh.userData.maxHp = Math.round(stats.hp * scale.hp * hpScale)
    mesh.userData.speedScale = scale.speed
    mesh.userData.damageScale = scale.damage
  }
  scene.add(mesh)
  game.monsters.push(mesh)

  const effect = createSpawnEffect(spawn, effectOptions)
  scene.add(effect.group)
  game.spawnEffects.push({ effect, monster: mesh })
  return mesh
}

// Starts the current boss's intro: drops the boss in (portal and all)
// straight ahead of the player -- on the other side if the platform's edge
// is in the way -- facing them, unrolls a red carpet from the player to its
// spot, and hands control to the cutscene, which freezes gameplay until it
// finishes (see runCutscene).
function startBossCutscene(game) {
  const boss = currentBoss(game.waveState)
  const { player } = game
  const limit = ARENA_RADIUS - BOSS_SPAWN_MARGIN
  let at = clampToPlatform({ x: player.position.x, z: player.position.z - BOSS_SPAWN_DISTANCE }, limit)
  if (Math.hypot(at.x - player.position.x, at.z - player.position.z) < BOSS_SPAWN_DISTANCE * 0.8) {
    at = clampToPlatform({ x: player.position.x, z: player.position.z + BOSS_SPAWN_DISTANCE }, limit)
  }
  // In the labyrinth the boss arrives down a straight corridor, never inside a wall.
  if (game.labyrinth) at = bossSpot(game.labyrinth.floor.maze, player.position)
  const mesh = spawnMonster(game, boss.id, {
    at,
    effectOptions: { scale: BOSS_SPAWN_EFFECT_SCALE, duration: BOSS_SPAWN_EFFECT_DURATION },
    hpScale: bossHpScale(game.waveState.bossesDefeated),
    facePlayer: true,
  })
  // Every boss fight makes the next one tougher: more hp (above), harder hits, extra moves, shorter cooldowns.
  const fights = game.waveState.bossesDefeated
  mesh.userData.damageScale = bossDamageScale(fights)
  upgradeBossSpecials(mesh.userData, bossSpecialsFor(boss.stats.specials, fights), bossCooldownScale(fights))
  const dx = player.position.x - at.x
  const dz = player.position.z - at.z
  const length = Math.hypot(dx, dz) || 1
  const carpet = createCarpet({ x: player.position.x, z: player.position.z }, at)
  scene.add(carpet.group)
  game.cutscene = {
    boss,
    mesh,
    dir: { x: dx / length, z: dz / length },
    state: createCutscene(),
    lines: introLines(boss.name, boss.lines),
    carpet,
  }
}

// Calls a summoner boss's minions in around it (skipped while it already
// has `maxMinions` alive), each through the usual portal spawn-in.
// True if a spot in the labyrinth is open floor (not inside a wall or the gate).
function labSpotClear(game, at) {
  return !game.obstacles.some((o) => Math.hypot(o.x - at.x, o.z - at.z) < o.radius + 0.4)
}

function summonMinions(game, bossMesh, count, maxMinions) {
  const living = game.monsters.filter((m) => !m.userData.isBoss && !m.userData.dying).length
  if (living >= maxMinions) return
  const toSpawn = Math.min(count, maxMinions - living)
  for (let i = 0; i < toSpawn; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = bossMesh.userData.radius + 2 + Math.random() * 2
    let at = clampToPlatform(
      { x: bossMesh.position.x + Math.sin(angle) * distance, z: bossMesh.position.z + Math.cos(angle) * distance },
      ARENA_RADIUS - SPAWN_NEAR_PLAYER_MARGIN,
    )
    if (game.labyrinth && !labSpotClear(game, at)) at = { x: bossMesh.position.x, z: bossMesh.position.z }
    const minion = spawnMonster(game, pickMonsterType(Math.max(2, game.waveState.waveNumber)), { at })
    bossMesh.userData.minions = [...(bossMesh.userData.minions ?? []), minion]
  }
}

// Once the boss is gone, whatever it called in goes with it, so beating
// the boss ends the fight instead of leaving a mop-up.
function popMinions(game) {
  for (const mesh of game.monsters) {
    if (mesh.userData.isBoss || mesh.userData.dying) continue
    mesh.userData.dying = true
    mesh.userData.deathPopElapsed = 0
    jellyHit(mesh, JELLY_DEATH_INFLATE_STRENGTH)
  }
}

// A mirror enemy bounced something: a shot comes back at you as an orb, a swing that hits its
// front bites back with a little damage and a shove.
function reflectAttack(game, info) {
  const { player } = game
  const mirror = info.monster
  const at = { x: mirror.position.x, y: 1.1, z: mirror.position.z }
  burst(particleSystem, at, 0xe6f4ff, 14, 3.5)
  sfx.play('hit', { x: mirror.position.x, z: mirror.position.z })
  const shield = mirror.userData.shield
  if (shield) {
    const broke = hitShield(shield)
    mirror.userData.setMirrorCracks?.(crackFraction(shield), shield.broken)
    if (broke) {
      mirror.userData.reflect = null // attacks go straight through now
      burst(particleSystem, at, 0xcfe8ff, 40, 6)
      showPopup(popupPool, mirror.position, 'SHIELD BROKEN!', '', POPUP_KILL_COLOR)
    }
  }
  if (info.kind === 'bullet') {
    const aim = Math.atan2(player.position.x - mirror.position.x, player.position.z - mirror.position.z)
    const damage = reflectedDamage(info.bullet.damage)
    for (const { vx, vz } of fanVelocities(aim, 1, 0, 12)) {
      fireProjectile(projectilePool, { x: mirror.position.x, z: mirror.position.z, vx, vz, damage, color: 0xcfe8ff, size: 0.55 })
    }
    showPopup(popupPool, mirror.position, 'REFLECTED!', '', POPUP_KILL_COLOR)
  } else {
    showPopup(popupPool, mirror.position, 'CLANG!', '', POPUP_KILL_COLOR)
    const dx = player.position.x - mirror.position.x
    const dz = player.position.z - mirror.position.z
    const d = Math.hypot(dx, dz) || 1
    const pushed = resolveArenaMove(player.position, { x: (dx / d) * 1.4, z: (dz / d) * 1.4 }, PLAYER_RADIUS, game.obstacles)
    player.position = pushed
    player.mesh.position.x = pushed.x
    player.mesh.position.z = pushed.z
    if (player.damagePlayer(MELEE_REFLECT_DAMAGE, timer.getElapsed())) {
      triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      triggerDamageFlash(hud)
    }
  }
}

const pendingSummons = []
const pendingSplits = []

// Turns the specials a boss fired this tick (see monster.js's
// updateMonster) into their effects: shockwave rings and damage for a slam
// or spin tick, orbs for a barrage, minions for a summon, a puff at both
// ends of a blink. Returns whether the player took damage, so the caller
// can shake the screen.
function applyBossEvents(game, bossMesh, events, now) {
  const { player } = game
  let hurtPlayer = false
  // A diver is out of reach of anything on the surface (only deep dwellers' moves reach them).
  const playerDistance = (x, z) => (player.diving && !bossMesh.userData.deep ? Infinity : Math.hypot(player.position.x - x, player.position.z - z))
  for (const event of events) {
    if (event.type === 'slam') {
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0xff3355)
      warp.add('ripple', event.x, event.z, event.radius * 1.1, 0.6)
      burst(particleSystem, { x: event.x, y: 0.3, z: event.z }, 0xff9a5a, 36, 4.5)
      sfx.play('bossSlam', { x: event.x, z: event.z })
      if (playerDistance(event.x, event.z) <= event.radius && player.damagePlayer(event.damage, now)) hurtPlayer = true
      triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
      game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
    } else if (event.type === 'spinTick') {
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0xffb454)
      if (playerDistance(event.x, event.z) <= event.radius && player.damagePlayer(event.damage, now)) hurtPlayer = true
    } else if (event.type === 'barrage') {
      for (const { vx, vz } of fanVelocities(event.aim, event.count, event.spread, event.speed)) {
        fireProjectile(projectilePool, { x: event.x, z: event.z, vx, vz, damage: event.damage })
      }
    } else if (event.type === 'lob') {
      lobPoison(poisonPool, event)
      burst(particleSystem, { x: event.x, y: 1.2, z: event.z }, 0x9bd32a, 10, 2.5)
    } else if (event.type === 'shoot') {
      for (const { vx, vz } of fanVelocities(event.aim, event.count, event.spread, event.speed)) {
        fireProjectile(projectilePool, { x: event.x, z: event.z, vx, vz, damage: event.damage, color: 0xffa83a, size: event.size })
      }
    } else if (event.type === 'summon') {
      // Deferred: we're mid-way through filtering game.monsters, which is
      // reassigned afterward and would drop anything spawned right now.
      pendingSummons.push({ bossMesh, count: event.count, maxMinions: event.maxMinions })
    } else if (event.type === 'blink') {
      burst(particleSystem, { x: event.from.x, y: 1, z: event.from.z }, 0xe9a3ff, 24, 3)
      burst(particleSystem, { x: event.to.x, y: 1, z: event.to.z }, 0xe9a3ff, 24, 3)
    }
  }
  return hurtPlayer
}

// The sticker fill for a named trick: coral for a fall (Checkout/VIP
// Checkout, the ring-out color), teal for a pool kill
// (Cannonball), butter for everything else.
function popupColorForTrick(trickId) {
  if (trickId === 'checkout' || trickId === 'vipCheckout') return POPUP_RING_OUT_COLOR
  if (trickId === 'cannonball') return POPUP_CANNONBALL_COLOR
  return POPUP_KILL_COLOR
}

// The HUD trick sticker's tone -- the same coral/teal/butter grouping
// as popupColorForTrick, but as a CSS class name for showTrickSticker
// rather than a sprite fill color.
function trickToneForId(trickId) {
  if (trickId === 'checkout' || trickId === 'vipCheckout') return 'coral'
  if (trickId === 'cannonball') return 'teal'
  return 'butter'
}

// Scores one monster's death: names its trick (from `cause` --
// 'sword'/'pet'/'shockwave'/'fall' -- plus whatever damageMonster last
// recorded on it and whether it's standing in a pool or is a boss),
// steps the kill chain, and adds the chain-multiplied points to the
// score. Pops a sticker at `position` showing the trick's name over its
// points (with the chain shown alongside once it's past 1x), and the
// same trick/points on the big screen-space HUD sticker.
function scoreKill(game, mesh, cause, position, now) {
  tutorialEvent('kill')
  const trick = nameTrick({
    cause,
    inPool: isInPool(game.arena.pools, mesh.position.x, mesh.position.z),
    ambush: mesh.userData.lastHitAmbush,
    boss: mesh.userData.isBoss,
  })
  game.chainState = stepChain(game.chainState, now, trick.id)
  const points = Math.round(trickPoints(scoreForKill(mesh.userData.type), game.chainState.multiplier) * activeFx(game.inventory.equipped).scoreMult)
  game.score += points
  const killHeal = activeFx(game.inventory.equipped).killHeal
  if (killHeal) game.player.hp = Math.min(game.player.maxHp, game.player.hp + killHeal)
  const pointsLine = game.chainState.multiplier > 1 ? `+${points} ×${game.chainState.multiplier}` : `+${points}`
  showPopup(popupPool, position, trick.name, pointsLine, popupColorForTrick(trick.id))
  showTrickSticker(hud, { name: trick.name, points, multiplier: game.chainState.multiplier, tone: trickToneForId(trick.id) })
  sfx.play(killVoiceForTrick(trick.id), position)
  input.rumble(RUMBLE_MEDIUM_STRENGTH, RUMBLE_MEDIUM_DURATION)
}

// Advances each in-progress spawn-in effect (portal fade, monster
// scale/color materialize); once one finishes, the monster can start
// running AI/combat and the effect's meshes are disposed.
function updateSpawnEffects(game, deltaSeconds) {
  game.spawnEffects = game.spawnEffects.filter(({ effect, monster }) => {
    const finished = updateSpawnEffect(effect, monster, deltaSeconds, particleSystem)
    if (finished) {
      monster.userData.spawning = false
      disposeObject3D(effect.group)
    }
    return !finished
  })
}

// One frame of a boss intro: gameplay is frozen (no AI, combat, waves or
// hide timer), but everything keeps animating -- the boss materializing,
// the jellies' idle wobble, the arena, particles -- while the camera
// swings out to frame the boss and the cutscene state machine runs its
// dialogue. Hands off to the boss fight when the cutscene is done.
function runCutscene(game, advancePressed, deltaSeconds, elapsedSeconds) {
  const { cutscene, player } = game
  const { boss, mesh, dir, lines, carpet } = cutscene
  cutscene.state = stepCutscene(cutscene.state, deltaSeconds, advancePressed, lines)

  // The carpet unrolls over the enter phase's own elapsed time; skipping
  // ahead (or any later phase) snaps it straight to fully unrolled.
  if (cutscene.state.phase === 'enter') updateCarpet(carpet, cutscene.state.phaseElapsed, CUTSCENE_ENTER_DURATION)
  else carpet.group.scale.z = 1

  // The hide-limit timer is wall-clock based: push its start forward so a
  // player hiding in a pod when the boss arrives isn't ejected by the cutscene.
  if (player.hidden) game.hidingState.enteredAt += deltaSeconds

  updateJelly(player.mesh, deltaSeconds, elapsedSeconds, { speed: 0, moveDir: player.moveDir })
  updateFace3D(player.mesh, deltaSeconds, elapsedSeconds)
  game.monsters.forEach((m) => {
    updateJelly(m, deltaSeconds, elapsedSeconds, { speed: 0, moveDir: m.userData.moveDir })
    updateFace3D(m, deltaSeconds, elapsedSeconds)
  })
  updateSpawnEffects(game, deltaSeconds)
  updateArena(game.arena, player.position, elapsedSeconds)
  updateParticles(particleSystem, deltaSeconds)
  updatePopups(popupPool, deltaSeconds)

  const size = MONSTER_TYPES[boss.id].size
  const back = 5 + size * 1.6
  cameraTarget.set(
    mesh.position.x + dir.x * back - dir.z * 4,
    2.5 + size * 0.9,
    mesh.position.z + dir.z * back + dir.x * 4,
  )
  camera.position.lerp(cameraTarget, 1 - Math.exp(-CUTSCENE_CAMERA_LERP * deltaSeconds))
  camera.lookAt(mesh.position.x, size * 0.55, mesh.position.z)

  const { phase, lineIndex, lineElapsed } = cutscene.state
  if (phase === 'done') {
    game.waveState = beginBossFight(game.waveState)
    disposeObject3D(carpet.group)
    game.cutscene = null
    showCutscene(hud, null)
    return
  }
  const line = lines[lineIndex]
  showCutscene(hud, {
    boss,
    phase,
    text: phase === 'talk' ? line.slice(0, visibleChars(line, lineElapsed)) : '',
    speaker: speakerFor(boss, lineIndex),
  })
}

// Moves the run to another place: builds that level's arena (its props
// steer clear of every pod, chest, monster and the player so nothing ends
// up inside one), swaps it in for the old one, folds its prop obstacles
// into the shared `obstacles` array in place of the old props', and
// re-bakes the sky reflections.
function changeLevel(game, levelIndex) {
  const level = levelAt(levelIndex)
  if (waterState.diving) setDiving(false) // surface before the room changes
  const occupied = [
    ...game.pods,
    ...game.chests,
    ...game.monsters,
    game.player.mesh,
  ].map((mesh) => ({ x: mesh.position.x, z: mesh.position.z, radius: (mesh.userData?.radius ?? 1) + 1.5 }))

  const arena = createArena(level, { avoid: occupied })
  const oldProps = new Set(game.props)
  const kept = game.obstacles.filter((obstacle) => !oldProps.has(obstacle))
  game.obstacles.length = 0
  game.obstacles.push(...kept, ...arena.propObstacles)

  disposeObject3D(game.arena.group)
  scene.add(arena.group)
  scene.background = new THREE.Color(arena.backgroundColor)
  scene.fog = arena.fog
  setLevelEnvironment(levelIndex)

  game.arena = arena
  game.props = arena.propObstacles
  game.levelIndex = levelIndex
  resetWater()
  if (!level.water) {
    game.player.mesh.position.y = 0
    for (const m of game.monsters) if (!m.userData.falling) m.position.y = 0
  }
  reskinContainers(game)
  return level
}

// Chests and suitcases already standing around when the place changes are rebuilt in the new
// place's look (same spot, same price). A suitcase someone is hiding in is left alone.
function reskinContainers(game) {
  const style = containerStyle(game)
  game.chests = game.chests.map((old) => {
    if (old.userData.opened) return old
    const fresh = createChest(old.position, old.userData.cost, style)
    fresh.userData.obstacle = old.userData.obstacle
    fresh.userData.spawnElapsed = old.userData.spawnElapsed
    fresh.scale.copy(old.scale)
    scene.remove(old)
    disposeObject3D(old)
    scene.add(fresh)
    return fresh
  })
  game.pods = game.pods.map((old) => {
    if (old.userData.occupied || old.userData.dematerializing) return old
    const fresh = createPod(old.position, style)
    fresh.userData.obstacle = old.userData.obstacle
    fresh.userData.materializing = old.userData.materializing
    fresh.userData.materializeElapsed = old.userData.materializeElapsed
    fresh.scale.copy(old.scale)
    scene.remove(old)
    disposeObject3D(old)
    scene.add(fresh)
    return fresh
  })
}

// Spike traps hurt anyone standing on them while the spikes are up; the gate's
// exit pad leads down to the next floor once it is open.
function updateLabyrinth(game, now, realDt) {
  const lab = game.labyrinth
  const { player } = game
  game.arena.update(now, realDt)
  for (const trap of lab.floor.traps) {
    if (spikeState(trap.phase, now) !== 'up') continue
    if (!player.falling && !player.hidden && now >= (player.ghostUntil ?? -Infinity)
      && Math.hypot(player.position.x - trap.x, player.position.z - trap.z) < trap.radius + PLAYER_RADIUS * 0.5
      && player.damagePlayer(SPIKE_PLAYER_DAMAGE, now)) {
      triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      triggerDamageFlash(hud)
      sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
      input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
      burst(particleSystem, { x: trap.x, y: 0.6, z: trap.z }, 0xff5a4a, 14, 3)
    }
    for (const mesh of game.monsters) {
      const ud = mesh.userData
      if (ud.spawning || ud.dying || ud.falling) continue
      if (now - (ud.spikeHitAt ?? -Infinity) < 0.9) continue
      if (Math.hypot(mesh.position.x - trap.x, mesh.position.z - trap.z) >= trap.radius + ud.radius * 0.5) continue
      ud.spikeHitAt = now
      damageMonster(mesh, ud.isBoss ? SPIKE_MONSTER_DAMAGE * 0.4 : SPIKE_MONSTER_DAMAGE, {
        fromPos: { x: trap.x, z: trap.z },
        knockback: 0.4,
        obstacles: game.obstacles,
        particleSystem,
        cause: 'spike',
      })
    }
  }
  const exit = lab.floor.exit
  if (lab.gateOpen && !lab.won && !player.hidden && Math.hypot(player.position.x - exit.x, player.position.z - exit.z) < 2.3) {
    advanceFloor(game)
  }
}

// Opens the gate: the bars rise and the doorway stops blocking.
function openLabyrinthGate(game) {
  const lab = game.labyrinth
  lab.gateOpen = true
  game.arena.setGateOpen(true)
  for (const o of game.arena.gateObstacles) {
    const i = game.obstacles.indexOf(o)
    if (i !== -1) game.obstacles.splice(i, 1)
  }
  game.waveState = { ...game.waveState, phase: 'gateOpen', phaseElapsed: 0 }
}

// Takes the player down to the next floor (or wins on the last one).
function advanceFloor(game) {
  const lab = game.labyrinth
  const { player } = game
  if (lab.floorIndex + 1 >= LABYRINTH_FLOORS) {
    lab.won = true
    game.score += 3000
    const best = loadHighScore()
    saveHighScore({ bestScore: Math.max(best.bestScore, game.score), bestWave: Math.max(best.bestWave, game.waveState.waveNumber) })
    document.getElementById('win-score').textContent = `Score: ${game.score}`
    return
  }
  const index = lab.floorIndex + 1
  game.monsters.forEach((m) => disposeObject3D(m))
  game.monsters = []
  game.spawnEffects.forEach(({ effect }) => disposeObject3D(effect.group))
  game.spawnEffects = []
  game.pods.forEach((p) => disposeObject3D(p))
  game.despawningPods.forEach((p) => disposeObject3D(p))
  game.pods = []
  game.despawningPods = []
  game.chests.forEach((c) => disposeObject3D(c))
  game.chests = []
  game.pickups.forEach((p) => disposeObject3D(p))
  game.pickups = []
  setChestPrompt(hud, null)
  resetProjectiles(projectilePool)
  resetPoison(poisonPool)
  resetBullets(bulletPool)
  pendingSummons.length = 0
  pendingSplits.length = 0
  game.hidingState = createHidingState()
  player.hidden = false

  game.obstacles.length = 0
  disposeObject3D(game.arena.group)
  const built = buildLabyrinthFloor(index)
  scene.add(built.arena.group)
  scene.background = new THREE.Color(built.arena.backgroundColor)
  scene.fog = built.arena.fog
  game.arena = built.arena
  game.props = built.props
  game.obstacles.push(...built.arena.propObstacles, ...built.arena.gateObstacles)
  lab.floorIndex = index
  lab.floor = built.floor
  lab.bossesThisFloor = 0
  lab.gateOpen = false
  game.waveState = { ...game.waveState, phase: 'intermission', phaseElapsed: 0, spawnedCount: 0, wavesUntilBoss: 1 }

  player.position.x = built.floor.start.x
  player.position.z = built.floor.start.z
  player.mesh.position.x = player.position.x
  player.mesh.position.z = player.position.z
  player.hp = Math.min(player.maxHp, player.hp + PLAYER_MAX_HP * 0.4)
  camera.position.set(player.position.x + CAMERA_OFFSET.x, CAMERA_OFFSET.y, player.position.z + CAMERA_OFFSET.z)

  trySpawnPod(game)
  trySpawnPod(game)
  trySpawnChest(game)
  trySpawnPerkPickup(game)
  game.score += 1000
  showWaveClearedBanner(hud, 1000, { lead: `FLOOR ${index + 1}`, text: built.floor.def.name.split(': ')[1].toUpperCase() })
  sfx.play('waveCleared')
}

// Removes and disposes everything createGame()/spawnMonster() added to
// the scene.
function disposeGame(target) {
  disposeObject3D(target.arena.group)
  disposeObject3D(target.player.mesh)
  target.pods.forEach((pod) => disposeObject3D(pod))
  target.despawningPods.forEach((pod) => disposeObject3D(pod))
  target.monsters.forEach((mesh) => disposeObject3D(mesh))
  target.spawnEffects.forEach(({ effect }) => disposeObject3D(effect.group))
  target.chests.forEach((chest) => disposeObject3D(chest))
  target.pickups.forEach((p) => disposeObject3D(p))
  if (target.cutscene) disposeObject3D(target.cutscene.carpet.group)
  disposePets(target.pets, scene)
}

// Browsers only allow audio after a user gesture, so the track (and the
// sound effects riding on the same AudioContext) start when the start
// card is dismissed. M mutes/unmutes both together (remembered).
const audio = createAudio()
const music = createMusic(audio)
const sfx = createSfx(audio)

let started = false
// Sandbox mode (pick it on the start card: B or its button): no waves, a
// menu (Tab) to spawn anything / equip anything / hop levels, free
// crystals, no cooldowns and (by default) god mode. See src/sandbox.js.
let sandbox = false
let godMode = true
let sandboxPanel = null

// Tutorial mode (start card: G or its button): no waves, god mode, and a checklist card
// that walks through moving, attacking, killing, hiding and opening a chest.
let tutorial = false
let tutorialState = createTutorial()
let tutorialPanel = null
let tutorialLastPos = null
let tutorialSetupStep = -1
const freePlay = () => sandbox || tutorial

function tutorialEvent(type, amount) {
  if (!tutorial) return
  const result = advanceTutorial(tutorialState, { type, amount })
  tutorialState = result.state
  if (result.completed) sfx.play('waveCleared')
}

function startTutorial() {
  tutorial = true
  document.body.classList.add('tutorial')
  loadoutPanel.setOpen(false)
  tutorialPanel = createTutorialPanel({ touch: touchDevice, onExit: () => window.location.reload() })
  tutorialPanel.setVisible(true)
}

// Called every frame in tutorial mode: feeds movement / hiding in, and sets up each step's props once.
function stepTutorial() {
  const p = game.player
  if (tutorialLastPos) tutorialEvent('move', Math.hypot(p.position.x - tutorialLastPos.x, p.position.z - tutorialLastPos.z))
  tutorialLastPos = { x: p.position.x, z: p.position.z }
  if (p.hidden) tutorialEvent('hide')
  if (tutorialSetupStep !== tutorialState.step) {
    tutorialSetupStep = tutorialState.step
    if (tutorialState.step === 2) spawnMonster(game, 'blobbo', { facePlayer: true })
    if (tutorialState.step === 3) trySpawnPod(game)
    if (tutorialState.step === 4) trySpawnChest(game, { cost: 0 })
  }
  // Keep a practice target around until it is beaten.
  if (tutorialState.step === 2 && !game.monsters.some((m) => !m.userData.dying)) spawnMonster(game, 'blobbo', { facePlayer: true })
  tutorialPanel.render(tutorialState)
}

// Pops every monster (a boss too) the way a boss's death pops its minions.
function clearAllMonsters(game) {
  for (const mesh of game.monsters) {
    if (mesh.userData.dying) continue
    mesh.userData.dying = true
    mesh.userData.deathPopElapsed = 0
    jellyHit(mesh, JELLY_DEATH_INFLATE_STRENGTH)
  }
}

function startSandbox() {
  sandbox = true
  document.body.classList.add('sandbox')
  sandboxPanel = createSandboxPanel({
    onSpawn(type, count) {
      for (let i = 0; i < count; i++) spawnMonster(game, type, { facePlayer: true })
    },
    onItem(kind, id) {
      const result = sandboxToggleItem(game.inventory, { kind, id })
      game.inventory = result.inventory
      if (result.petRemoved !== null) {
        const [gone] = game.pets.splice(result.petRemoved, 1)
        if (gone) disposePets([gone], scene)
      }
      if (result.petAdded) game.pets.push(createPet(result.petAdded, scene, game.player))
      if (kind === 'weapon') {
        setPlayerWeapon(game.player.mesh, selectedWeaponId(game.inventory))
        game.attackState.swingElapsed = null
        clearSwingTrail(swingTrail)
      }
    },
    onLevel(index) {
      changeLevel(game, index)
    },
    onAction(name) {
      if (name === 'god') godMode = !godMode
      else if (name === 'clear') clearAllMonsters(game)
      else if (name === 'heal') game.player.hp = game.player.maxHp
      else if (name === 'chest') trySpawnChest(game, { cost: 0 })
      else if (name === 'pod') trySpawnPod(game)
    },
  })
  sandboxPanel.setOpen(!touchDevice) // on a phone the menu covers too much until asked for
  loadoutPanel.setOpen(false)
}

// The Tab menu of a normal run: pick which found power-ups are equipped.
// (Sandbox mode has its own bigger Tab menu instead.) It pauses the game.
const loadoutPanel = createLoadoutPanel({
  onToggle(id) {
    game.inventory = toggleEquipPowerup(game.inventory, id)
    loadoutPanel.refresh(game.inventory)
  },
})
const loadoutOpen = () => !sandbox && loadoutPanel.isOpen()
const swapPanel = createSwapPanel({
  onSwap(outId) {
    const loot = pendingSwapLoot
    pendingSwapLoot = null
    swapPanel.hide()
    if (loot) receiveLoot(game, loot, outId)
  },
  onKeep() {
    const declined = pendingSwapLoot
    pendingSwapLoot = null
    swapPanel.hide()
    showLootToast(hud, declined?.kind === 'pet' && !sandbox
      ? { title: 'PET SAVED TO LOADOUT', name: PETS[declined.id].name, blurb: 'Not equipped now. Pick it in the hub (9) any time' }
      : { title: 'KEPT YOUR LOADOUT', name: 'Swap declined', blurb: 'The chest is empty now' })
  },
})
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && swapPanel.isOpen()) {
    pendingSwapLoot = null
    swapPanel.hide()
  }
})
function toggleMenu() {
  if (sandbox) return sandboxPanel.toggle()
  if (!started || game.player.hp <= 0 || swapPanel.isOpen() || hub.isOpen()) return
  loadoutPanel.refresh(game.inventory)
  loadoutPanel.toggle()
}
window.addEventListener('keydown', (event) => {
  if (event.code !== 'Tab') return
  event.preventDefault() // otherwise Tab moves browser focus onto the menu's buttons
  if (!event.repeat) toggleMenu()
})
touchControls?.addMenuButton(toggleMenu)

// Stocks the run's crystals in the bank (T): they leave this run but stay on the device
// for the skill tree and power-up upgrades.
function bankRunCrystals() {
  if (sandbox || !started || game.player.hp <= 0) return
  const amount = game.inventory.crystals
  if (amount <= 0) {
    showLootToast(hud, { title: 'BANK', name: 'Nothing to bank', blurb: 'Collect crystals first, then press T' })
    return
  }
  setProfile(bankCrystals(profile, amount))
  game.inventory = { ...game.inventory, crystals: 0 }
  sfx.play('chestOpen')
  showLootToast(hud, { title: 'BANKED', name: `◆ ${amount} stocked`, blurb: `${profile.bank} in the bank. Spend it on skills [6] and power-ups [7]` })
  hub.refresh()
}

const hub = createHub({
  getProfile: () => sandboxProfile(),
  setProfile,
  getRun: () => ({ sandbox, inRun: started && !sandbox, weapons: game.inventory.weapons, crystals: game.inventory.crystals, owned: game.inventory.powerups, equipped: game.inventory.equipped }),
  onBank: bankRunCrystals,
})
const HUB_KEYS = { Digit6: 'skills', Numpad6: 'skills', Digit7: 'powerups', Numpad7: 'powerups', KeyJ: 'gunsmith', Digit9: 'loadout', Numpad9: 'loadout' }
function canOpenHub() {
  return !swapPanel.isOpen() && !pauseMenu.isOpen() && !(started && game.player.hp <= 0) && !(started && !sandbox && loadoutPanel.isOpen()) && !(started && sandbox && sandboxPanel?.isOpen?.())
}
window.addEventListener('keydown', (event) => {
  if (event.repeat) return
  const page = HUB_KEYS[event.code]
  if (page && (hub.isOpen() || canOpenHub())) {
    event.preventDefault()
    hub.toggle(page)
  } else if (event.code === 'Escape' && hub.isOpen()) {
    hub.close()
    event.hubClosed = true // so the pause menu's own Escape handler leaves it alone
  } else if (event.code === 'KeyT') bankRunCrystals()
})
document.getElementById('hub-open-btn')?.addEventListener('click', () => hub.open('loadout'))
touchControls?.addMenuButton(() => (hub.isOpen() ? hub.close() : hub.open('skills')), 'SKILLS')
touchControls?.addMenuButton(bankRunCrystals, 'BANK')

const pauseMenu = createPauseMenu({
  getMuted: () => music.isMuted(),
  onToggleMute: () => music.toggleMuted(),
  onBrightness: (v) => {
    renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE * v
  },
  onRestart: () => {
    loadoutPanel.setOpen(false)
    restartGame()
  },
  // Back to the start card (map choice): a fresh page load is the cleanest reset.
  onMainMenu: () => window.location.reload(),
})
function togglePause() {
  if (!started || swapPanel.isOpen() || hub.isOpen() || (!sandbox && loadoutPanel.isOpen())) return
  pauseMenu.toggle()
}
window.addEventListener('keydown', (event) => {
  if (event.repeat) return
  if (event.code === 'Digit8' || event.code === 'Numpad8') togglePause()
  else if (event.code === 'Escape' && pauseMenu.isOpen()) pauseMenu.setOpen(false)
  else if (event.code === 'Escape' && !swapPanel.isOpen() && !event.hubClosed) togglePause()
})
touchControls?.addMenuButton(togglePause, 'PAUSE')

// Full screen (touch button). iPhone Safari has no Fullscreen API for pages, so there
// the button explains Add to Home Screen, which the meta tags below make fullscreen.
function toggleFullscreen() {
  const root = document.documentElement
  const enter = root.requestFullscreen ?? root.webkitRequestFullscreen
  const exit = document.exitFullscreen ?? document.webkitExitFullscreen
  const active = document.fullscreenElement ?? document.webkitFullscreenElement
  if (!enter) {
    if (!window.navigator.standalone) window.alert('To play full screen on iPhone: tap Share, then "Add to Home Screen", and open SlashBattle from your home screen.')
    return
  }
  if (active) exit?.call(document)
  else enter.call(root)?.catch?.(() => {})
}
touchControls?.addMenuButton(toggleFullscreen, 'FULLSCREEN')

function dismissStartCard(event) {
  // Guards against the keydown/mousedown listeners below and a gamepad
  // press both landing on the same frame and dismissing it twice.
  if (started) return
  // Opening the hub (its button, or keys 6 / 7 / 9) or typing inside it isn't "start".
  if (hub.isOpen() || event?.target?.closest?.('#hub-open-btn, #hub-root') || HUB_KEYS[event?.code]) return
  started = true
  // The card goes away first, and each step below is guarded: one failing (audio on an odd
  // browser, a bad saved profile) must never leave the card up with every click ignored.
  hideStartCard(hud)
  const guard = (label, fn) => {
    try {
      fn()
    } catch (error) {
      console.error(`start: ${label} failed`, error)
    }
  }
  guard('mode', () => {
    if (event?.code === 'KeyB' || event?.target?.closest?.('#sandbox-btn')) startSandbox()
    else if (event?.code === 'KeyG' || event?.target?.closest?.('#tutorial-btn')) startTutorial()
    else if (event?.code === 'KeyK' || event?.target?.closest?.('#labyrinth-btn')) {
      gameMode = 'labyrinth'
      // The sundeck world was already built behind the start card: swap it for the labyrinth.
      disposeGame(game)
      game = createGame()
    }
  })
  if (!sandbox && !tutorial) guard('loadout pets', () => applyLoadoutPets(game)) // the loadout may have changed on the start card
  guard('music', () => music.start())
  // The key/click that dismisses the card shouldn't also register as a
  // held attack button or key on gameplay's first frame.
  input.clear()
}
// (Not `once`: opening the hub from the start card must not use the listener up.)
window.addEventListener('keydown', dismissStartCard)
window.addEventListener('mousedown', dismissStartCard)
window.addEventListener('pointerdown', dismissStartCard) // a finger tap
// iOS only lets audio start from a finished tap, not the pointerdown above:
// keep nudging the (shared, idempotent) audio start on every touch release.
window.addEventListener('touchend', () => {
  if (started) audio.start()
}, { passive: true })

let game = createGame()

// Dev-server only: lets browser tests (and you, in the console) peek at the state.
if (import.meta.env.DEV) window.__debug = { input, get game() { return game } }

const timer = new THREE.Timer()

// Throws the current run away and starts a fresh one (same map).
function restartGame() {
  if (waterState.diving) setFirstPerson(false)
  disposeGame(game)
  game = createGame()
  resetWater()
  resetParticles(particleSystem)
  resetPopups(popupPool)
  resetProjectiles(projectilePool)
  resetPoison(poisonPool)
  resetBullets(bulletPool)
  resetCrystals(crystalSystem)
  setChestPrompt(hud, null)
  resetShockwaves(shockwavePool)
  warp.reset()
  warpFields.length = 0
  meteors.splice(0).forEach(disposeMeteor)
  bulwarkWalls.splice(0).forEach(removeBulwarkWall)
  pendingSummons.length = 0
  clearSwingTrail(swingTrail)
}

// The equipped power-ups, as a little strip of icons on the HUD.
const perkBar = document.getElementById('perk-bar')
let perkBarKey = ''
function updatePerkBar(equipped) {
  const key = equipped.join(',')
  if (key === perkBarKey) return
  perkBarKey = key
  perkBar.replaceChildren(
    ...equipped.map((id) => {
      const chip = document.createElement('div')
      chip.className = 'perk-chip panel'
      chip.title = `${POWERUPS[id].name}: ${POWERUPS[id].blurb}`
      chip.style.setProperty('--perk', POWERUPS[id].color)
      chip.appendChild(iconImg('powerup', id))
      return chip
    }),
  )
}

const winScreen = document.getElementById('win-screen')
const floorChip = document.getElementById('floor-chip')
function updateFloorChip(game) {
  const lab = game.labyrinth
  const gate = lab.gateOpen ? '<span class="gate-open">GATE OPEN</span>' : '<span class="gate-locked">GATE LOCKED</span>'
  const html = `FLOOR ${lab.floorIndex + 1}/${LABYRINTH_FLOORS} &middot; BOSSES ${lab.bossesThisFloor}/${BOSSES_PER_FLOOR} &middot; ${gate}`
  if (floorChip.dataset.html !== html) {
    floorChip.dataset.html = html
    floorChip.innerHTML = html
  }
}

// Frame cap (?fps=N, default 60, 0 = uncapped), the ?perf=1 overlay and adaptive pixel ratio all live
// in this thin wrapper around gameFrame(). Skipped frames never touch the timer, so the next rendered
// frame's delta covers the whole elapsed time and simulation speed is unchanged.
const FPS_CAP = parseFpsCap(new URLSearchParams(location.search).get('fps'))
// ?post=0 bypasses the whole post-processing chain (MSAA target, GTAO, bloom, warp, output pass)
// and renders straight to the canvas -- a diagnostic switch for isolating GPU fill cost.
if (new URLSearchParams(location.search).get('post') === '0') {
  composer.render = () => renderer.render(scene, camera)
}
const perf = createPerfOverlay(renderer, () => renderer.getPixelRatio(), () => fpsCap)
if (perf) {
  // Console/devtools inspection under ?perf=1 only; changeLevel(i) jumps to LEVELS[i] for profiling.
  window.__slash = { scene, renderer, camera, changeLevel: (index) => changeLevel(game, index) }
  renderer.info.autoReset = false // composer renders several passes per frame; count the whole frame
  const renderComposer = composer.render.bind(composer)
  composer.render = (...args) => {
    perf.begin('render')
    renderComposer(...args)
    perf.end('render')
  }
}
const adaptiveEnabled = !new URLSearchParams(location.search).has('pr') && new URLSearchParams(location.search).get('adaptive') !== '0'
// With no explicit ?fps=, adaptive quality may drop the cap to ADAPTIVE_LOW_FPS before giving up
// any sharpness -- halving GPU work (and heat) per second at the same picture quality.
const autoFps = adaptiveEnabled && !new URLSearchParams(location.search).has('fps') && FPS_CAP > 0
let fpsCap = FPS_CAP
let fpsRetryAt = -Infinity
let fpsRetryDelay = ADAPTIVE_FPS_RETRY_SECONDS
let lastFpsUpAt = -Infinity
let lastRenderedAt = null
// Behind a menu the 3D scene is either frozen (pause, loadout, swap, hub) or just idling (title
// card, game over), so redraw it at a trickle instead of every display frame: same look, a
// fraction of the GPU work and heat while the player reads a menu.
const MENU_IDLE_FPS = 15
const MENU_FROZEN_FPS = 5
let lastMenuRenderAt = -Infinity
let wasMenuFrame = false
function renderMenuBackdrop(timestamp, fps) {
  menuFrame = true
  // Always draw the first frame after a menu opens so it never shows a stale picture.
  if (!wasMenuFrame || menuFrameDue(timestamp, lastMenuRenderAt, fps)) {
    lastMenuRenderAt = timestamp
    composer.render()
  }
}
let adaptiveCeiling = Infinity
let adaptiveCeilingSetAt = -Infinity
let adaptiveIntervals = []
let adaptiveWindowStart = null
// Frames before this timestamp aren't measured: the first moments after a menu closes, a game
// starts or a quality change lands are full of one-off hitches (spawns, shader compiles, resizes).
const ADAPTIVE_SETTLE_MS = 2000
let adaptiveSettleUntil = -Infinity
// Set by gameFrame when it only drew (or skipped drawing) a menu backdrop: those frames say
// nothing about gameplay cost, so they're left out of the adaptive measurement.
let menuFrame = false

// Frame cap bookkeeping (see framesPerRender): recent raw rAF deltas give the display's refresh
// interval; every Nth display frame is rendered.
const rafDeltas = []
let lastRafAt = null
let displayFrameCount = 0

function animate(timestamp) {
  if (lastRafAt !== null) {
    rafDeltas.push(timestamp - lastRafAt)
    if (rafDeltas.length > 60) rafDeltas.shift()
  }
  lastRafAt = timestamp
  const everyN = framesPerRender(estimateDisplayInterval(rafDeltas), fpsCap)
  displayFrameCount++
  // A long stall (hidden tab, breakpoint) restarts the count so the next frame renders at once.
  if (lastRenderedAt !== null && timestamp - lastRenderedAt > 250) displayFrameCount = everyN
  if (lastRenderedAt !== null && displayFrameCount < everyN) return
  displayFrameCount = 0
  const interval = lastRenderedAt === null ? 0 : timestamp - lastRenderedAt
  lastRenderedAt = timestamp
  if (perf) {
    renderer.info.reset()
    perf.begin('total')
  }
  menuFrame = false
  gameFrame(timestamp)
  wasMenuFrame = menuFrame
  if (perf) {
    perf.end('total')
    perf.frame(timestamp)
  }

  if (adaptiveEnabled && !document.hidden && !menuFrame) {
    if (adaptiveWindowStart === null) {
      adaptiveWindowStart = timestamp + ADAPTIVE_SETTLE_MS
      adaptiveSettleUntil = adaptiveWindowStart
    }
    if (timestamp >= adaptiveSettleUntil && interval > 0 && interval < 250) adaptiveIntervals.push(interval)
    if (timestamp - adaptiveWindowStart >= ADAPTIVE_WINDOW_SECONDS * 1000) {
      const current = renderer.getPixelRatio()
      // Step back up toward full sharpness when frames are holding the cap, but not to a ratio
      // that was too slow within the last ADAPTIVE_RETRY_SECONDS (avoids see-sawing).
      if (timestamp - adaptiveCeilingSetAt > ADAPTIVE_RETRY_SECONDS * 1000) adaptiveCeiling = Infinity
      const maxRatio = Math.min(window.devicePixelRatio, PIXEL_RATIO_CAP, adaptiveCeiling)
      const avg = trimmedMean(adaptiveIntervals)
      const decision =
        adaptiveIntervals.length > 10
          ? adaptiveDecision({ ratio: current, fpsCap, avgFrameMs: avg, maxRatio, autoFps, fullFps: FPS_CAP, fpsRetryDue: timestamp >= fpsRetryAt })
          : { ratio: current, fpsCap, change: null }
      if (decision.change === 'fpsDown') {
        // Came straight back down after a retry? Wait longer before the next one.
        if (timestamp - lastFpsUpAt < ADAPTIVE_WINDOW_SECONDS * 3000) {
          fpsRetryDelay = Math.min(fpsRetryDelay * 2, ADAPTIVE_FPS_RETRY_MAX_SECONDS)
        }
        fpsRetryAt = timestamp + fpsRetryDelay * 1000
      }
      if (decision.change === 'fpsDown' || decision.change === 'fpsUp') {
        console.info(`[adaptive] trimmed avg frame ${avg.toFixed(1)}ms: fps cap ${fpsCap} -> ${decision.fpsCap}` + (decision.change === 'fpsDown' ? ` (retry full rate in ${fpsRetryDelay}s)` : ''))
        if (decision.change === 'fpsUp') lastFpsUpAt = timestamp
        fpsCap = decision.fpsCap
      }
      const next = decision.ratio
      if (next !== current) {
        console.info(`[adaptive] avg frame ${avg.toFixed(1)}ms: pixel ratio ${current} -> ${next} (floor ${ADAPTIVE_MIN_RATIO})`)
        if (next < current) {
          adaptiveCeiling = next
          adaptiveCeilingSetAt = timestamp
        }
        adaptiveRatioCap = next
        handleResize()
      }
      adaptiveIntervals = []
      adaptiveWindowStart = timestamp
      if (decision.change) {
        // Let the change land before judging it.
        adaptiveSettleUntil = timestamp + ADAPTIVE_SETTLE_MS / 2
        adaptiveWindowStart = adaptiveSettleUntil
      }
    }
  } else {
    adaptiveWindowStart = null
    adaptiveIntervals = []
  }
}

function gameFrame(timestamp) {
  // Updates the timer's internal delta/elapsed state from this frame's
  // rAF timestamp, so the getDelta()/getElapsed() calls below return a
  // stable value no matter how many times they're read this frame.
  timer.update(timestamp)

  // Polled once a frame, before anything below queries it: turns the
  // real Gamepad object (if any) into this frame's actions (src/input.js's
  // pollGamepad/src/logic/gamepad.js's gamepadActions).
  input.pollGamepad()
  // The keydown/mousedown listeners above only fire for the keyboard/
  // mouse; a gamepad press has to be checked here instead, from the poll.
  if (!started && input.wasAdvancePressed()) dismissStartCard()

  // Clamped so a dropped/backgrounded-tab frame doesn't feed a huge dt
  // into movement/physics and teleport everything forward.
  const deltaSeconds = Math.min(timer.getDelta(), MAX_DELTA_SECONDS)
  warp.update(deltaSeconds, timer.getElapsed())
  const elapsedSeconds = timer.getElapsed()

  // Downed But Determined: back up at half HP, once per revive the skill tree grants.
  if (started && !sandbox && game.player.hp <= 0 && (game.revivesUsed ?? 0) < activeFx(game.inventory.equipped).revive) {
    game.revivesUsed = (game.revivesUsed ?? 0) + 1
    game.player.hp = Math.round(game.player.maxHp * 0.5)
    game.player.invulnerableUntil = Math.max(game.player.invulnerableUntil, elapsedSeconds + 3)
    burst(particleSystem, { x: game.player.position.x, y: 0.8, z: game.player.position.z }, 0xfff27a, 40, 4, 1)
    spawnShockwave(shockwavePool, game.player.position.x, game.player.position.z, 5, 0xfff27a)
    showLootToast(hud, { title: 'SKILL', name: 'Downed But Determined', blurb: 'You got back up!' })
  }
  const gameState = game.labyrinth?.won ? 'won' : evaluateGameState({ playerHp: game.player.hp })
  winScreen.style.display = gameState === 'won' ? 'flex' : 'none'
  if (game.labyrinth) updateFloorChip(game)

  if (input.wasPressed('KeyM') || input.wasMutePressed()) music.toggleMuted()
  // Paused (pause menu or the hub): a chill lo-fi loop instead of the fight music.
  const chillOut = gameState === 'playing' && started && (pauseMenu.isOpen() || hub.isOpen())
  music.setMuffled(gameState !== 'playing')
  music.setMode(chillOut ? 'chill' : game.waveState.phase === 'bossFight' && gameState === 'playing' ? 'boss' : 'normal')

  // Recorded once, the frame the player dies: compares this run against
  // the saved high score, persists the new best, and freezes the stats
  // the game-over overlay shows (score/wave keep changing on `game` if
  // we let the loop keep running, but it doesn't past this point).
  if (gameState === 'lost' && !game.gameOverRecorded) {
    game.gameOverRecorded = true
    const previousBest = loadHighScore()
    const isNewBest = game.score > previousBest.bestScore
    const bestScore = Math.max(previousBest.bestScore, game.score)
    const bestWave = Math.max(previousBest.bestWave, game.waveState.waveNumber)
    saveHighScore({ bestScore, bestWave })
    game.gameOverStats = { wave: game.waveState.waveNumber, score: game.score, bestScore, isNewBest }
  }
  showGameOverlay(hud, gameState === 'lost' ? 'lost' : null, game.gameOverStats)

  if (!started || gameState !== 'playing') {
    if (started && gameState !== 'playing' && (input.wasPressed('KeyR') || input.wasRestartPressed())) restartGame()
    renderMenuBackdrop(timestamp, MENU_IDLE_FPS)
    input.endFrame()
    return
  }

  if (pauseMenu.isOpen()) {
    renderMenuBackdrop(timestamp, MENU_FROZEN_FPS)
    input.endFrame()
    return
  }

  if (game.cutscene) {
    const advance = input.wasPressed('Space') || input.wasPressed('Enter') || input.wasMousePressed(0) || input.wasAdvancePressed()
    runCutscene(game, advance, deltaSeconds, elapsedSeconds)
    composer.render()
    input.endFrame()
    return
  }

  // Hitstop freezes gameplay time, not real time: the camera shake/flash,
  // HUD, and music all keep using deltaSeconds, but every system below
  // that actually moves/animates the game world uses gameplayDelta, which
  // is 0 for the frame(s) a freeze covers (or a fraction of deltaSeconds
  // the frame it ends partway through, so no time is lost overall).
  // The Tab power-up menu pauses the world (freeze the frame, still render).
  if (loadoutOpen() || swapPanel.isOpen() || hub.isOpen()) {
    renderMenuBackdrop(timestamp, MENU_FROZEN_FPS)
    input.endFrame()
    return
  }
  const { state: nextHitstop, scale: hitstopScale } = stepHitstop(game.hitstop, deltaSeconds)
  game.hitstop = nextHitstop
  const gameplayDelta = deltaSeconds * hitstopScale

  const { obstacles, player, pods, hidingState, attackState, shake } = game
  let monsters = game.monsters

  // Steps the wave controller, spawns anything it emits this tick, and
  // reacts to a cleared wave with a score bonus, a heal (so endless runs
  // stay survivable), and a banner. Monsters still materializing in
  // count as alive, so the clearing phase waits on them too.
  const clearedWaveNumber = game.waveState.waveNumber
  const bossBeforeStep = currentBoss(game.waveState)
  // Sandbox mode has no waves: nothing spawns or clears on its own.
  const { state: nextWaveState, spawns, events } = freePlay()
    ? { state: game.waveState, spawns: [], events: [] }
    : stepWaves(game.waveState, gameplayDelta, monsters.length, Math.random)
  game.waveState = nextWaveState
  // In a water room some arrivals are deep dwellers that can only be fought underwater.
  spawns.forEach((type) => spawnMonster(game, waterRoom() && Math.random() < DEEP_SPAWN_CHANCE ? pickDeepType() : type))
  // The labyrinth's corridors swallow monsters: half the time a second one tags along.
  if (game.labyrinth) spawns.forEach((type) => { if (Math.random() < 0.5) spawnMonster(game, type) })
  if (events.includes('waveCleared')) {
    const bonus = waveClearBonus(clearedWaveNumber)
    game.score += bonus
    showWaveClearedBanner(hud, bonus)
    sfx.play('waveCleared')
    player.hp = Math.min(player.maxHp, player.hp + WAVE_CLEAR_HEAL * activeFx(game.inventory.equipped).waveHeal)
  }
  if (events.includes('bossDefeated')) {
    const bonus = waveClearBonus(clearedWaveNumber) * 2
    game.score += bonus
    game.bossesDefeated = (game.bossesDefeated ?? 0) + 1
    if (game.labyrinth) {
      const lab = game.labyrinth
      lab.bossesThisFloor += 1
      game.waveState = { ...game.waveState, wavesUntilBoss: 1 }
      if (lab.bossesThisFloor >= BOSSES_PER_FLOOR) {
        openLabyrinthGate(game)
        showWaveClearedBanner(hud, bonus, { lead: bossBeforeStep.name, text: 'DEFEATED - THE GATE IS OPEN! FIND THE EXIT' })
      } else {
        showWaveClearedBanner(hud, bonus, { lead: bossBeforeStep.name, text: 'DEFEATED - ONE MORE BOSS GUARDS THE GATE' })
      }
    } else {
      const nextLevel = changeLevel(game, levelIndexAfterBosses(game.bossesDefeated))
      showWaveClearedBanner(hud, bonus, { lead: bossBeforeStep.name, text: `DEFEATED - NEXT STOP: ${nextLevel.name.toUpperCase()}` })
    }
    sfx.play('waveCleared')
    player.hp = Math.min(player.maxHp, player.hp + WAVE_CLEAR_HEAL * activeFx(game.inventory.equipped).waveHeal * BOSS_DEFEAT_HEAL_MULTIPLIER)
  }
  if (events.includes('waveCleared') || events.includes('bossDefeated')) attractAllCrystals(crystalSystem)
  if (events.includes('bossIntro')) startBossCutscene(game)

  // Steps the pod spawn timer and spawns one if it's due -- see
  // trySpawnPod (a no-op if nothing fit).
  const { state: nextPodSpawnerState, spawnNow } = stepPodSpawner(
    game.podSpawnerState,
    elapsedSeconds,
    pods.length,
    POD_MAX_ACTIVE,
    [POD_SPAWN_DELAY_MIN, POD_SPAWN_DELAY_MAX],
    Math.random,
  )
  game.podSpawnerState = nextPodSpawnerState
  if (spawnNow) trySpawnPod(game)

  const { state: nextChestSpawnerState, spawnNow: chestSpawnNow } = stepPodSpawner(
    game.chestSpawnerState,
    elapsedSeconds,
    game.chests.filter((chest) => !chest.userData.opened).length,
    CHEST_MAX_ACTIVE,
    [CHEST_SPAWN_DELAY_MIN, CHEST_SPAWN_DELAY_MAX],
    Math.random,
  )
  game.chestSpawnerState = nextChestSpawnerState
  if (chestSpawnNow) trySpawnChest(game)

  if (input.wasPressed('KeyL')) autoShoot = !autoShoot
  setAutoShoot(hud, autoShoot)
  // Touch: the aim stick aims any weapon (melee swings toward it too); the
  // mouse only aims ranged ones.
  player.aimAngle = firstPerson
    ? fpYaw
    : input.touchMode
    ? touchAimAngle(player)
    : WEAPONS[selectedWeaponId(game.inventory)].gun
      ? mouseAimAngle(player)
      : null
  const petFx = petEffects(game.inventory.pets, profile.pets)
  const perk = activeFx(game.inventory.equipped)
  // Skill-tree vitals: max HP (a raise heals by the same amount) and longer i-frames.
  const wantMaxHp = Math.round(PLAYER_MAX_HP + perk.maxHp)
  if (player.maxHp !== wantMaxHp) {
    if (wantMaxHp > player.maxHp) player.hp += wantMaxHp - player.maxHp
    player.maxHp = wantMaxHp
    player.hp = Math.min(player.hp, wantMaxHp)
  }
  player.iframeScale = perk.iframes
  // Every pet you find joins your collection (kept on this device) so it can go in a loadout.
  if (!sandbox && game.inventory.pets.some((id) => !profile.collection.includes(id))) {
    setProfile(addToCollection(profile, game.inventory.pets))
  }
  player.speedMultiplier = petFx.speedMultiplier * perk.speed * (elapsedSeconds < player.sprintUntil ? SPRINT_SPEED_MULTIPLIER : 1)
  // The player keeps full speed through a hitstop freeze: only the world stops,
  // otherwise every landed hit stalls your movement for a moment.
  if (firstPerson) cameraYaw = fpYaw + Math.PI
  const room = waterRoom()
  if (input.touchMode) {
    // Touch: the 1ST button toggles first person (while diving, DIVE/SURFACE decides it), and the
    // aim stick turns the view like the mouse does.
    if (input.wasPressed('Digit0') && !waterState.diving) setFirstPerson(!firstPerson)
    if (firstPerson && input.touchAim.aiming) fpYaw -= input.touchAim.dx * TOUCH_LOOK_SPEED * deltaSeconds
    touchControls?.setWater(Boolean(room), waterState.diving)
  }
  stepWater(elapsedSeconds, deltaSeconds)
  player.update(input, cameraYaw, deltaSeconds, room ? true : null)
  if (room) {
    // No edge to fall off: the pool wall / buoys hold you in. You ride the waves.
    if (!player.falling && !player.hidden && clampToWater(player.position, PLAYER_RADIUS)) {
      player.mesh.position.x = player.position.x
      player.mesh.position.z = player.position.z
      player.vel = { x: 0, z: 0 }
    }
    if (!player.falling) player.mesh.position.y = waterY(player.position.x, player.position.z, elapsedSeconds)
  } else if (!player.falling && !player.hidden && !isOnPlatform(player.position, ARENA_RADIUS)) {
    player.startFalling()
  }
  if (player.falling && player.updateFalling(gameplayDelta, elapsedSeconds)) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
    sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
    game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
  }
  updateJelly(player.mesh, deltaSeconds, elapsedSeconds, { speed: player.speed, moveDir: player.moveDir })
  updateFace3D(player.mesh, gameplayDelta, elapsedSeconds)

  // wasHidden, compared against player.hidden after updateHiding runs,
  // catches the one frame hiding actually started, so the zip-up sound
  // plays exactly once per entry.
  const wasHidden = player.hidden
  // vacatedPod is the pod the player just left (early with E, or forced
  // out by the hide-limit timer -- `ejected`) this frame, if any; pods
  // are single-use, so it always starts despawning. An eject also
  // triggers the same shake/flash feedback a monster's hit does.
  const { showPrompt, nearestPod, vacatedPod, ejected } = updateHiding(
    hidingState,
    player,
    pods,
    input,
    elapsedSeconds,
    hideLimit(),
  )
  lastHidePrompt = Boolean(showPrompt)
  if (!wasHidden && player.hidden) sfx.play('podIn', { x: player.position.x, z: player.position.z })
  if (vacatedPod) {
    sfx.play('podOut', { x: vacatedPod.position.x, z: vacatedPod.position.z })
    despawnPod(game, vacatedPod)
  }
  if (ejected) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
    sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
    game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
  }

  pods.forEach((pod) => {
    const remaining = pod.userData.occupied
      ? hideTimeRemaining(hidingState.enteredAt, elapsedSeconds, hideLimit())
      : null
    updatePod(pod, gameplayDelta, elapsedSeconds, { isNearestEnterable: pod === nearestPod, hideTimeRemaining: remaining })
  })
  game.despawningPods = game.despawningPods.filter((pod) => {
    const finished = updatePod(pod, gameplayDelta, elapsedSeconds, {})
    if (finished) disposeObject3D(pod)
    return !finished
  })

  // The weapon hotbar (1-5) and ability keys (Q Z X C V); LB/RB cycle the
  // hotbar backward/forward for a gamepad, which has no equivalent of
  // jumping straight to a slot.
  HOTBAR_KEYS.forEach((key, slot) => {
    if (input.wasPressed(key)) selectWeapon(game, slot)
  })
  const weaponCount = game.inventory.weapons.length
  if (input.wasPrevWeaponPressed()) selectWeapon(game, (game.inventory.selected - 1 + weaponCount) % weaponCount)
  if (input.wasNextWeaponPressed()) selectWeapon(game, (game.inventory.selected + 1) % weaponCount)
  if (!player.hidden) {
    ABILITY_KEYS.forEach((key, slot) => {
      if (input.wasPressed(key) || input.wasAbilityPressed(slot)) activateAbility(game, slot, elapsedSeconds)
    })
  }

  // [ and ] cycle the scope / ammo (the ones you've unlocked) of the rifle in your hands.
  const heldId = selectedWeaponId(game.inventory)
  if (WEAPONS[heldId].rifle) {
    for (const [code, kind] of [['BracketLeft', 'scope'], ['BracketRight', 'ammo']]) {
      if (!input.wasPressed(code)) continue
      setProfile(setRifleOption(sandboxProfile(), heldId, kind, input.isDown('ShiftLeft') ? -1 : 1, true))
      const picks = riflePicks(sandboxProfile(), heldId)
      const option = (kind === 'scope' ? SCOPES : AMMO)[picks[kind]]
      showLootToast(hud, { title: kind === 'scope' ? 'SCOPE' : 'AMMO', name: option.name, icon: { kind: 'weapon', id: heldId }, blurb: option.blurb })
      sfx.play('podIn')
    }
  }
  // Standing still steadies a scoped rifle (crit chance, see logic/rifles.js); moving shakes it.
  {
    const rifle = WEAPONS[heldId].rifle ? tuneRifle(WEAPONS[heldId], riflePicks(sandboxProfile(), heldId)) : null
    steadyAim = rifle && rifle.steady > 0 ? stepSteady(steadyAim, player.speed > 0.5, gameplayDelta, rifle.steadyRate) : 0
  }

  // No swing in flight yet this frame -- used below to tell a swing that
  // just started (attackState.swingElapsed goes from null to 0) from one
  // already in progress, so the whoosh only plays once per swing.
  const hadSwing = attackState.swingElapsed !== null
  const { ambushHit, hitAny } = updatePlayerAttack(attackState, {
    player,
    monsters,
    obstacles,
    input,
    elapsedSeconds,
    deltaSeconds: gameplayDelta,
    particleSystem,
    swingTrail,
    weaponId: selectedWeaponId(game.inventory),
    damageMultiplier: elapsedDamageMultiplier(player, elapsedSeconds) * petFx.damageMultiplier * perk.damage * (Math.random() < perk.crit ? 2 : 1),
    cooldownMultiplier: petFx.cooldownMultiplier * perk.cooldown * (elapsedSeconds < player.frenzyUntil ? FRENZY_COOLDOWN_MULTIPLIER : 1),
    knockbackMultiplier: petFx.knockbackMultiplier * perk.knockback,
    bulletPool,
    rifleSetup: riflePicks(sandboxProfile(), selectedWeaponId(game.inventory)),
    steady: steadyAim,
    autoAttack: autoShoot,
    underwater: waterState.diving,
    onReflect: (info) => reflectAttack(game, info),
    hitstop: game.hitstop,
    onMeleeHit: (id, at, from) => playHitFx(id, at, Math.atan2(at.x - from.x, at.z - from.z), weaponFxContext()),
  })
  if (!hadSwing && attackState.swingElapsed !== null) {
    tutorialEvent('attack')
    sfx.play('swing', { x: player.position.x, z: player.position.z })
    playWeaponFx(selectedWeaponId(game.inventory), player.position, player.facing, {
      particleSystem,
      shockwavePool,
      warp,
      shake: (amount) => triggerShake(shake, SHAKE_HIT_MAGNITUDE * amount, SHAKE_HIT_DURATION),
    })
  }
  if (ambushHit) showAmbushBanner(hud)
  if (hitAny) {
    triggerShake(shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
    sfx.play('hit', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_LIGHT_STRENGTH, RUMBLE_LIGHT_DURATION)
  }

  // Monsters still materializing in just tick their jelly (for the
  // inflate wobble the spawn effect kicked off) -- updateSpawnEffect
  // below drives the actual scale/color materialize animation, and
  // disposes the effect once it's done. Dying monsters keep ticking
  // their jelly too (so the death-burst inflate still wobbles per-vertex
  // while the uniform death-pop scale plays) until that pop finishes,
  // then score the kill and get removed from the scene and this list.
  // Falling monsters (walked, chased, or knocked off the edge) skip the
  // jelly tick, tumbling down out of view before the same scored removal
  // happens.
  let bossGone = false
  let bossDeathPoint = null
  monsters = monsters.filter((mesh) => {
    if (mesh.userData.spawning) {
      if (room) mesh.position.y = monsterSwimY(mesh, elapsedSeconds)
      updateJelly(mesh, gameplayDelta, elapsedSeconds, { speed: 0, moveDir: mesh.userData.moveDir })
      updateFace3D(mesh, gameplayDelta, elapsedSeconds)
      return true
    }

    if (mesh.userData.dying) {
      updateJelly(mesh, gameplayDelta, elapsedSeconds, { speed: 0, moveDir: mesh.userData.moveDir })
      updateFace3D(mesh, gameplayDelta, elapsedSeconds)
      const finishedDying = updateMonsterHitReaction(mesh, gameplayDelta)
      if (finishedDying) {
        scoreKill(game, mesh, mesh.userData.lastHitBy ?? 'sword', mesh.position, elapsedSeconds)
        dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalDrops(mesh.userData.type, mesh.userData.isBoss))
        disposeObject3D(mesh) // per-monster geometry, materials and indicator textures; also removes it from the scene
        if (SPLITS[mesh.userData.type] && mesh.userData.lastHitBy) pendingSplits.push({ type: mesh.userData.type, x: mesh.position.x, z: mesh.position.z })
        if (mesh.userData.isBoss) {
          bossGone = true
          bossDeathPoint = { x: mesh.position.x, z: mesh.position.z }
        }
        return false
      }
      return true
    }

    if (mesh.userData.falling) {
      mesh.userData.fallState = stepFall(mesh.userData.fallState, gameplayDelta, FALL_GRAVITY)
      mesh.position.y = -mesh.userData.fallState.fallenY
      mesh.rotation.x += gameplayDelta * MONSTER_FALL_TUMBLE_SPEED
      mesh.rotation.z += gameplayDelta * MONSTER_FALL_TUMBLE_SPEED * 0.6
      if (mesh.userData.fallState.fallenY >= FALL_DESPAWN_DEPTH) {
        scoreKill(game, mesh, 'fall', { x: mesh.position.x, y: 0, z: mesh.position.z }, elapsedSeconds)
        disposeObject3D(mesh)
        if (mesh.userData.isBoss) bossGone = true
        return false
      }
      return true
    }

    const { hitPlayer: monsterHitPlayer, events: specialEvents } = updateMonster(mesh, player, obstacles, gameplayDelta, elapsedSeconds)
    const hitPlayer = monsterHitPlayer || (specialEvents.length > 0 && applyBossEvents(game, mesh, specialEvents, elapsedSeconds))
    updateJelly(mesh, gameplayDelta, elapsedSeconds, { speed: mesh.userData.speed, moveDir: mesh.userData.moveDir })
    updateFace3D(mesh, gameplayDelta, elapsedSeconds)
    animateAlive(mesh, player.position, gameplayDelta, elapsedSeconds)
    if (hitPlayer) {
      triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      triggerDamageFlash(hud)
      sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
      input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
      game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
    }
    updateMonsterHitReaction(mesh, gameplayDelta)
    if (mesh.userData.shield && stepShield(mesh.userData.shield, gameplayDelta)) {
      // A boss's mirror grows back.
      mesh.userData.reflect = mesh.userData.reflectCfg
      mesh.userData.setMirrorCracks?.(0, false)
      burst(particleSystem, { x: mesh.position.x, y: 1.5, z: mesh.position.z }, 0xe6f4ff, 24, 4)
    }

    if (room) {
      // Swimmers ride the waves (and leap on top of that); the wall holds them in.
      clampToWater(mesh.position, mesh.userData.radius)
      // Eased toward its swim height, so deep dwellers glide up to meet a diver and sink away again.
      const targetY = monsterSwimY(mesh, elapsedSeconds)
      mesh.userData.sinkY = (mesh.userData.sinkY ?? targetY) + (targetY - (mesh.userData.sinkY ?? targetY)) * Math.min(1, deltaSeconds * 4)
      mesh.position.y = mesh.userData.sinkY + (mesh.userData.leapY ?? 0)
    } else {
      mesh.position.y = mesh.userData.leapY ?? 0
    }
    if (mesh.userData.arms) {
      for (const { pivot, side } of mesh.userData.arms) pivot.rotation.z = side * (0.55 + (mesh.userData.leapY ?? 0) * 0.5)
    }
    if (mesh.userData.eelTail) swishEelTail(mesh, elapsedSeconds)
    if (!room && !isOnPlatform({ x: mesh.position.x, z: mesh.position.z }, ARENA_RADIUS)) {
      mesh.userData.falling = true
      mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
      const fallPoint = { x: mesh.position.x, y: mesh.userData.radius, z: mesh.position.z }
      burst(particleSystem, fallPoint, FALL_PUFF_COLOR, FALL_PUFF_COUNT, FALL_PUFF_SPEED)
      burst(particleSystem, fallPoint, MONSTER_TYPES[mesh.userData.type].edgeColor, FALL_STREAK_COUNT, FALL_STREAK_SPEED)
    }
    return true
  })
  game.monsters = monsters
  pendingSplits.splice(0).forEach(({ type, x, z }) => {
    const { into, count } = SPLITS[type]
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random()
      let at = clampToPlatform({ x: x + Math.sin(angle) * 1.2, z: z + Math.cos(angle) * 1.2 }, ARENA_RADIUS - SPAWN_NEAR_PLAYER_MARGIN)
      if (game.labyrinth && !labSpotClear(game, at)) at = { x, z }
      spawnMonster(game, into, { at })
    }
  })
  pendingSummons.splice(0).forEach(({ bossMesh, count, maxMinions }) => summonMinions(game, bossMesh, count, maxMinions))
  if (bossGone) {
    popMinions(game)
    attractAllCrystals(crystalSystem)
    // A boss leaves a free chest where it fell (when it died on the platform).
    if (bossDeathPoint) {
      trySpawnChest(game, { at: clampToPlatform(bossDeathPoint, ARENA_RADIUS - CHEST_SPAWN_MARGIN), cost: 0 })
      // ...and a power-up, a little off to the side so the two don't overlap.
      trySpawnPerkPickup(game, clampToPlatform({ x: bossDeathPoint.x + 3, z: bossDeathPoint.z + 1 }, ARENA_RADIUS - CHEST_SPAWN_MARGIN))
    }
  }

  updateSpawnEffects(game, gameplayDelta)

  separateMonsters(monsters, player, obstacles)
  updateArena(game.arena, player.position)
  if (game.labyrinth) {
    updateLabyrinth(game, elapsedSeconds, deltaSeconds)
    if (game.labyrinth.won) {
      composer.render()
      input.endFrame()
      return
    }
  }
  updateParticles(particleSystem, gameplayDelta)
  updatePopups(popupPool, gameplayDelta)
  updateShockwaves(shockwavePool, gameplayDelta)
  updateWarpFields(game, gameplayDelta, elapsedSeconds)
  updateMeteors(game, gameplayDelta)
  updateBulwarkWalls(elapsedSeconds)
  updateBuffAuras(player, elapsedSeconds, gameplayDelta)
  setGhostLook(player.mesh, elapsedSeconds < (player.ghostUntil ?? -Infinity) ? 0.28 : 1)
  // Ghost Form leaves a trail of pale wisps.
  if (elapsedSeconds < (player.ghostUntil ?? -Infinity)) {
    burst(particleSystem, { x: player.position.x, y: 0.5 + Math.random() * 1.2, z: player.position.z }, 0xdcd6ff, 2, 1.2, 0.8)
  }
  if (updateBullets(bulletPool, gameplayDelta, {
    blockers: bulwarkBlockers(),
    monsters,
    obstacles,
    particleSystem,
    hitstop: game.hitstop,
    arenaRadius: ARENA_RADIUS,
    onReflect: (info) => reflectAttack(game, info),
    onTrail: (bullet) => playBulletTrail(bullet, weaponFxContext()),
    onHit: (bullet, mesh) => {
      playHitFx(bullet.weaponId, mesh.position, Math.atan2(bullet.vx, bullet.vz), weaponFxContext())
      const { damage, bonus } = bulletDamage(bullet)
      if (bullet.crit || bonus >= 0.25) {
        const crit = bullet.crit
        showPopup(popupPool, mesh.position, crit ? 'CRIT!' : bullet.closeShot > 0 && bullet.traveled <= 5 ? 'POINT BLANK' : 'LONG SHOT', `${Math.round(damage)}`, POPUP_KILL_COLOR)
        triggerShake(shake, SHAKE_HIT_MAGNITUDE * (crit ? 1.6 : 1.2), SHAKE_HIT_DURATION)
        burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, 0xffffff, crit ? 10 : 5, 3)
      }
    },
    onExplode: (x, z, radius, color) => {
      warp.add('ripple', x, z, radius * 1.5, 0.5)
      spawnShockwave(shockwavePool, x, z, radius, color)
      shardBurst(particleSystem, { x, y: 0.6, z }, color, 10, 3)
    },
  })) {
    sfx.play('hit', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_LIGHT_STRENGTH, RUMBLE_LIGHT_DURATION)
  }
  const orbHurt = updateProjectiles(projectilePool, gameplayDelta, player, elapsedSeconds, ARENA_RADIUS, bulwarkBlockers())
  const poisonHurt = updatePoison(poisonPool, gameplayDelta, player, elapsedSeconds)
  if (orbHurt || poisonHurt) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
    sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
    game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
  }

  // Pets follow and help, crystals scatter/home/get collected, and chests
  // animate; F opens the nearest one in reach if you can afford it.
  player.damageTakenMultiplier = tutorial || (sandbox && godMode) ? 0 : Math.max(0.3, petFx.damageTakenMultiplier * perk.damageTaken)
  if (tutorial) stepTutorial()
  if (sandbox) {
    game.inventory = sandboxTopUp(game.inventory)
    sandboxPanel.refresh({ inventory: game.inventory, levelIndex: game.levelIndex, god: godMode })
  }
  player.updateStatusEffects(elapsedSeconds)
  if (perk.regen > 0 && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + perk.regen * gameplayDelta)
  updatePets(game.pets, { petDamage: perk.petDamage, levels: profile.pets, dt: gameplayDelta, elapsed: elapsedSeconds, player, monsters: game.monsters, obstacles, particleSystem, hitstop: game.hitstop, shockwavePool, onScratch: petScratch })
  const collected = updateCrystals(crystalSystem, gameplayDelta, elapsedSeconds, player.position.x, player.position.z, petFx.magnetRadius * perk.magnet)
  if (collected > 0) {
    game.inventory = addCrystals(game.inventory, Math.max(1, Math.round(collected * petFx.crystalMultiplier * perk.crystal)))
    sfx.play('crystal')
  }

  const { state: nextPickupSpawner, spawnNow: pickupSpawnNow } = stepPodSpawner(
    game.pickupSpawnerState,
    elapsedSeconds,
    game.pickups.length,
    2,
    [16, 28],
    Math.random,
  )
  game.pickupSpawnerState = nextPickupSpawner
  if (pickupSpawnNow && !freePlay()) trySpawnPerkPickup(game)
  game.pickups = game.pickups.filter((pickup) => {
    updatePerkPickup(pickup, gameplayDelta)
    if (player.hidden || Math.hypot(pickup.position.x - player.position.x, pickup.position.z - player.position.z) > PICKUP_RADIUS) return true
    burst(particleSystem, { x: pickup.position.x, y: 1, z: pickup.position.z }, 0xffffff, 18, 3.5)
    sfx.play('chestOpen', { x: pickup.position.x, z: pickup.position.z })
    receiveLoot(game, { kind: 'powerup', id: pickup.userData.id })
    disposeObject3D(pickup)
    return false
  })

  let nearestChest = null
  if (!player.hidden) {
    let nearestDistance = CHEST_INTERACT_RANGE
    for (const chest of game.chests) {
      if (chest.userData.opened) continue
      const distance = Math.hypot(chest.position.x - player.position.x, chest.position.z - player.position.z)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestChest = chest
      }
    }
  }
  if (nearestChest && input.wasChestPressed() && game.inventory.crystals >= nearestChest.userData.cost) {
    openChestNow(game, nearestChest, elapsedSeconds)
  }
  game.chests = game.chests.filter((chest) => {
    const finished = updateChest(chest, gameplayDelta, elapsedSeconds, {
      affordable: game.inventory.crystals >= chest.userData.cost,
      highlighted: chest === nearestChest && !chest.userData.opened,
    })
    if (finished) disposeObject3D(chest)
    return !finished
  })
  if (nearestChest && !nearestChest.userData.opened) {
    const { cost } = nearestChest.userData
    const affordable = game.inventory.crystals >= cost
    setChestPrompt(
      hud,
      affordable
        ? cost === 0
          ? `${input.touchMode ? 'Tap CHEST' : 'Press F'} to open the FREE chest`
          : `${input.touchMode ? 'Tap CHEST' : 'Press F'} to open chest (💎 ${cost})`
        : `Chest needs 💎 ${cost} (you have ${game.inventory.crystals})`,
      !affordable,
    )
  } else {
    setChestPrompt(hud, null)
  }
  updateInventoryHud(hud, game.inventory, elapsedSeconds)
  updatePerkBar(game.inventory.equipped)

  const inBossFight = game.waveState.phase === 'bossFight'
  const enemiesLeft = inBossFight || freePlay() || game.labyrinth?.gateOpen
    ? game.monsters.length
    : waveSize(game.waveState.waveNumber) - game.waveState.spawnedCount + game.monsters.length
  const bossMesh = game.monsters.find((m) => m.userData.isBoss && !m.userData.dying)
  const bossHud = bossMesh
    ? {
        name: bossById(bossMesh.userData.type).name,
        ratio: Math.max(0, Math.min(1, bossMesh.userData.hp / bossMesh.userData.maxHp)),
      }
    : null
  // The chain indicator only shows once a chain is actually worth
  // bragging about (2+ kills) and still live; a lone kill or a cold
  // chain just hides it.
  const liveChain =
    game.chainState.count >= 2 && !hasChainExpired(game.chainState, elapsedSeconds)
      ? { count: game.chainState.count, multiplier: game.chainState.multiplier }
      : null
  // The PA chime plays the one frame updateHud picks a fresh
  // announcement for the wave banner (hud.waveAnnouncement changes
  // identity), not on every frame that banner stays on screen.
  const previousAnnouncement = hud.waveAnnouncement
  perf?.begin('hud')
  updateHud(hud, {
    hp: player.hp,
    maxHp: player.maxHp,
    score: game.score,
    wave: game.waveState.waveNumber,
    enemiesLeft,
    hidden: player.hidden,
    hideTimeRemaining: player.hidden ? hideTimeRemaining(hidingState.enteredAt, elapsedSeconds, hideLimit()) : null,
    hideLimit: hideLimit(),
    showHidePrompt: showPrompt,
    // Sandbox never steps the wave controller, so it would sit in
    // 'intermission' at 0s and the HUD would re-pick a PA line (and the
    // announcement chime would fire) every single frame.
    waveState: freePlay() || game.labyrinth?.gateOpen ? { ...game.waveState, phase: 'clearing' } : game.waveState,
    boss: bossHud,
    chain: liveChain,
    deltaSeconds,
  })
  perf?.end('hud')
  if (!freePlay() && hud.waveAnnouncement !== previousAnnouncement) sfx.play('announcement')

  // A slight look-ahead in the player's current movement direction,
  // scaled by how close to full speed they're actually moving (so it
  // eases in/out along with the movement ramp rather than snapping).
  const lookAheadAmount = CAMERA_LOOKAHEAD * (player.speed / PLAYER_SPEED)
  const cameraOffset = player.hidden ? HIDDEN_CAMERA_OFFSET : CAMERA_OFFSET
  // A rifle scope with a wide view pulls the camera back; the reticle follows the cursor.
  const heldRifle = WEAPONS[selectedWeaponId(game.inventory)]
  const heldTuned = started && game.player.hp > 0 && heldRifle.rifle ? tuneRifle(heldRifle, riflePicks(sandboxProfile(), heldRifle.id)) : null
  scopeZoom = scope.update(heldTuned, { player, aimAngle: player.aimAngle ?? player.facing, mouse: input.mouse, showCursor: !input.touchMode && !firstPerson && input.mouse.moved, dt: deltaSeconds, steady: steadyAim })
  const zoomK = player.hidden ? 1 : scopeZoom
  cameraTarget.set(
    player.position.x + cameraOffset.x * zoomK + player.moveDir.x * lookAheadAmount,
    cameraOffset.y * zoomK,
    player.position.z + cameraOffset.z * zoomK + player.moveDir.z * lookAheadAmount,
  )
  // Frame-rate-independent exponential smoothing: 1 - exp(-lambda * dt)
  // is the same damp() uses elsewhere, just expressed as the single
  // alpha THREE.Vector3.lerp takes.
  const lerpFactor = 1 - Math.exp(-CAMERA_LERP * deltaSeconds)
  camera.position.lerp(cameraTarget, lerpFactor)
  camera.lookAt(player.position.x, 1, player.position.z)
  if (firstPerson) {
    player.mesh.visible = false
    // Underwater the eye sits just above the swimmer's depth; on land it's head height.
    const eye = room ? waterState.depthY + 0.9 : 1.5
    camera.position.set(player.position.x, eye, player.position.z)
    camera.lookAt(player.position.x + Math.sin(fpYaw) * 10, eye - 0.15, player.position.z + Math.cos(fpYaw) * 10)
  }

  const shakeOffset = updateShake(shake, deltaSeconds)
  camera.position.x += shakeOffset.x
  camera.position.y += shakeOffset.y
  camera.position.z += shakeOffset.z

  // Keeps positional sound effects panning/attenuating from wherever the
  // camera actually ended up this frame, shake included.
  sfx.updateListener(camera)

  composer.render()
  input.endFrame()
}

// setAnimationLoop (rather than a manual requestAnimationFrame chain)
// is the steadier, recommended driver for a render loop.
renderer.setAnimationLoop(animate)
