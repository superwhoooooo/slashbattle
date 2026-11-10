import { noteSaved } from './saveSync.js' // first: loads the device save file into localStorage before anything reads it
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
import { createTransition, stepTransition, TRANSITION } from './logic/levelTransition.js'
import { createTransitionOverlay } from './levelTransition.js'
import { iconImg } from './icons.js'
import { PICKUP_RADIUS, createPerkPickup, updatePerkPickup } from './pickups.js'
import { createLoadoutPanel } from './loadout.js'
import { createHub } from './hub.js'
import { loadProfile, saveProfile } from './profile.js'
import { createScope } from './scope.js'
import { SCOPES, AMMO, rifleSetup as riflePicks, stepSteady, tuneRifle } from './logic/rifles.js'
import { BULLET_START_Y, bulletDamage, clampSlope } from './logic/bullets.js'
import { DEEP_SPAWN_CHANCE, pickDeepType } from './logic/enemies.js'
import { MELEE_REFLECT_DAMAGE, createShield, crackFraction, hitShield, reflectedDamage, stepShield } from './logic/reflect.js'
import { WATER, stepBreath, stepDepth, waveHeight } from './logic/water.js'
import { createWaterUi } from './waterUi.js'
import { activeLoadoutPets, addToCollection, bankCrystals, setRifleOption, unlockAttachment } from './logic/profile.js'
import { setDragonOption, unlockDragonPart } from './logic/profile.js'
import { BREATHS, SCALES as DRAGON_SKINS, SKIN_IDS, BREATH_IDS, createDragonState, dragonSetup, isDragon } from './logic/dragons.js'
import { combineEffects, skillEffects } from './logic/skills.js'
import { createPauseMenu, loadBrightness } from './pauseMenu.js'
import { createSwapPanel } from './swap.js'
import { createWarp } from './warp.js'
import { playBulletTrail, playHitFx, playWeaponFx } from './weaponFx.js'
import { clampTargetToRange, inCircle } from './logic/warp.js'
import { createSandboxPanel } from './sandbox.js'
import { createTutorialPanel } from './tutorial.js'
import { advanceTutorial, createTutorial, currentStep, skipTutorialStep, tutorialDone } from './logic/tutorial.js'
import { createTouchControls, isTouchDevice } from './touch.js'
import { sandboxToggleItem, sandboxTopUp } from './logic/sandbox.js'
import { createAudio } from './audio.js'
import { createMonsterMesh } from './characters.js'
import { GRAPHICS_LABELS, getGraphicsStyle, nextGraphicsStyle, setGraphicsStyle, setWildsLook } from './graphicsStyle.js'
import { updateFace3D } from './face3d.js'
import { animateAlive } from './alive.js'
import { loadHighScore, saveHighScore } from './highScore.js'
import { createWorldArena, WORLD_LEVEL } from './worldArena.js'
import { GLIDE_SPEED_MULTIPLIER, createJumpState, isGliding, stepJump } from './logic/jump.js'
import { createGlider, updateGlider } from './glider.js'
import { createNpc, setNpcMarker, updateNpc, TALK_RANGE } from './npcs.js'
import { createQuestUi } from './questUi.js'
import { acceptQuest, claimQuest, createQuestLog, npcDialog, npcMarker, questEvent, questsToClaim, questWeaponFor } from './logic/quests.js'
import { BIOMES, BOSS_RESPAWN_SECONDS, SANCTUM_RADIUS, SKYSTAR_CATCH_RADIUS, SKYSTAR_REWARD, UNLOAD_RADIUS, VILLAGE_SAFE_RADIUS, WATER_LEVEL, WORLD_RADIUS, biomeAt, canRespawn, chunkContent, chunkKey, dangerAt, dayName, diffChunks, groundColorAt, heightAt, lakeAt, landmarkById, landmarks, nearestLandmark, nearestVillage, ruins, skystars, villageById, villages } from './logic/world.js'
import { createWildsActivities } from './wildsActivities.js'
import { createJournalUi } from './journalUi.js'
import { LANTERN_CATCH_RADIUS, LANTERN_COUNT, lanternReward, lanternsNear } from './logic/lanterns.js'
import { BOONS, SHRINE_RADIUS, activeBoons, boonEffects, createShrineState, foldBoons, grantBoon, shrineCharge, useShrine, wayshrines } from './logic/wayshrines.js'
import { HEAT_TEXT, MAX_MAPS, addMap, digAt, makeTreasureMap, nearestMap } from './logic/treasure.js'
import { createRaceState, raceCourses, raceReward, stepRace } from './logic/races.js'
import { EVENTS, STAR_SHARD_VALUE, createEventDirector, endEvent, hordePlan, merchantName, merchantStock, meteorPlan, stepEventDirector, wandererPlan } from './logic/wildEvents.js'
import { BESTIARY_FIRST_REWARD, JOURNAL_KEY, claimMilestone, creatureName, noteBiome, noteEvent, noteKill, noteLandmark, noteLantern, noteRace, noteShrine, noteTreasure, parseJournal, pickUnowned, readyMilestones, serializeJournal } from './logic/wildsJournal.js'
import { formatTime } from './logic/wildsSpots.js'
import { createMusic } from './music.js'
import { createSfx } from './sfx.js'
import { jellyHit, updateJelly } from './jelly.js'
import {
  ARENA_RADIUS,
  setArenaRadius,
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
import { bossEnrage, bossSpeedScale, immunityThresholdsFor, BOSS_HEAD_START, BOSS_IMMUNITY_MINIONS, BOSS_IMMUNITY_SECONDS, BOSS_IMMUNITY_THRESHOLDS, bossById, immunityPhaseReached, bossCooldownScale, bossDamageScale, bossHpScale, bossSpecialsFor } from './logic/bosses.js'
import { fanVelocities } from './logic/projectiles.js'
import { clampToPlatform, isOnPlatform, resolveArenaMove, spawnPointNearPlayer } from './logic/arena.js'
import { crystalDrops } from './logic/crystals.js'
import { isInPool } from './logic/resortLayout.js'
import { createChainState, hasChainExpired, nameTrick, stepChain, trickPoints } from './logic/tricks.js'
import { killVoiceForTrick } from './logic/sfx.js'
import { newestBlip, voiceFor } from './logic/bossVoice.js'
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
import { createMonsterAIState, separateMonsters, setDeepShield, setMonsterNavigator, setSurfaceShield, setTimeWarp, setWaterRoom, timeWarp, updateMonster, upgradeBossSpecials } from './monster.js'
import { applyFreeze, isFrozen } from './logic/status.js'
import { burst, createParticleSystem, resetParticles, setParticleViewScale, shardBurst, updateParticles } from './particles.js'
import { createPet, disposePets, updatePets } from './pets.js'
import { Player } from './player.js'
import { createBulletPool, fireBullets, resetBullets, updateBullets } from './bullets.js'
import { createScratchLayer, showScratch } from './scratch.js'
import { makeBullets } from './logic/bullets.js'
import { createPoisonPool, lobPoison, resetPoison, updatePoison } from './hazards.js'
import { createProjectilePool, destroyProjectilesNear, fireProjectile, resetProjectiles, updateProjectiles } from './projectiles.js'
import { inRingBand, onBeam, puddleTargets, rainZones, ringAngles, wallOrbs } from './logic/signatures.js'
import { CRAZY_TYPE_IDS } from './logic/crazyEnemies.js'
import { CHECKPOINT_KEY, RESPAWN_IFRAMES, SANCTUM_SPOT, parseCheckpoint, respawnSpot, saveSpotAt, serializeCheckpoint, shouldSave } from './logic/checkpoint.js'
import { beamHits, crystalChange, refundWithTip, stealAmount } from './logic/shadyGuests.js'
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
function setLevelEnvironment(levelIndex, level = null) {
  if (environmentLevelIndex === levelIndex) return
  environmentLevelIndex = levelIndex
  const previous = scene.environment
  scene.environment = createEnvironmentMap(renderer, level ?? levelAt(levelIndex))
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
const transitionOverlay = createTransitionOverlay() // the hyperspace jump between places
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
let fpPitch = 0 // look up (+) / down (-), radians; shots follow it (aimSlopeFor)
const FP_PITCH_LIMIT = 1.3
let fpYaw = 0 // same convention as player.facing: forward = (sin, cos)
const fpCrosshair = document.createElement('div')
fpCrosshair.style.cssText = 'position:fixed;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border:2px solid rgba(255,255,255,0.85);border-radius:50%;box-shadow:0 0 0 1px rgba(26,36,51,0.45);pointer-events:none;display:none;z-index:5'
document.body.appendChild(fpCrosshair)
function setFirstPerson(on) {
  if (on === firstPerson) return
  firstPerson = on
  fpCrosshair.style.display = on ? 'block' : 'none'
  if (on) tutorialEvent('firstPerson')
  if (on) {
    fpYaw = game.player.facing
    fpPitch = 0
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
  if (mesh.userData.amphibious) {
    // A water boss sinks until its whole body is under (you see the shadow through the water); a diver
    // finds it right at their own depth. During its intro (spawning / cutscene) it floats on top.
    const surface = WATER.floatY + waveHeight(x, z, time, waterRoom()?.surface.amp ?? 0.2)
    if (!mesh.userData.submerged || mesh.userData.spawning) return surface
    return waterState.diving ? waterY(x, z, time) - 0.4 : surface - (mesh.userData.radius * 2.4 + 0.6)
  }
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
// Holding Shift sprints (a water room keeps Shift for diving).
const SHIFT_SPRINT_MULTIPLIER = 1.5
function holdSprinting() {
  return !waterRoom() && !game?.player?.hidden && (input.isDown('ShiftLeft') || input.isDown('ShiftRight'))
}
function applyFxDepth() {
  const ground = game?.world?.groundY ?? 0 // on hills, shots / sparks / rings / crystals ride up with the player
  crystalSystem.mesh.position.y = ground
  const y = fxDepthOffset() + ground
  const hug = game?.world ? heightAt : null // enemy orbs, and third-person shots, follow the hills instead of flying into them
  bulletPool.groundAt = firstPerson ? null : hug // first-person shots fly the crosshair's straight ray
  bulletPool.terrainAt = hug
  projectilePool.groundAt = hug
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
  setWaterRoom(Boolean(room))
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
  const lurking = game.monsters.some((m) => (m.userData.deep || m.userData.submerged) && !m.userData.dying)
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
  if (firstPerson && document.pointerLockElement) {
    fpYaw -= event.movementX * 0.0025
    fpPitch = Math.max(-FP_PITCH_LIMIT, Math.min(FP_PITCH_LIMIT, fpPitch - event.movementY * 0.0025))
  }
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
  if (game?.world) {
    // On the hills the cursor points at the terrain itself: march the ray down onto the ground.
    if (!rayOntoTerrain(aimRaycaster.ray, aimPoint)) return null
  } else if (!aimRaycaster.ray.intersectPlane(aimPlane, aimPoint)) return null
  const dx = aimPoint.x - player.position.x
  const dz = aimPoint.z - player.position.z
  if (Math.hypot(dx, dz) < 0.3) return null
  return Math.atan2(dx, dz)
}

// Marches a ray until it dips below the Wilds' terrain (at bullet height); false if it never does.
function rayOntoTerrain(ray, out) {
  const { origin, direction } = ray
  if (direction.y >= -1e-4) return false
  let t = 0
  for (let i = 0; i < 400; i++) {
    t += i < 60 ? 1 : 3
    const x = origin.x + direction.x * t
    const y = origin.y + direction.y * t
    const z = origin.z + direction.z * t
    if (y <= heightAt(x, z) + 0.7) {
      out.set(x, y, z)
      return true
    }
  }
  return false
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
  aimProject.set(player.position.x, 0.7 + (game?.world?.groundY ?? 0), player.position.z).project(camera)
  const sx = (aimProject.x * 0.5 + 0.5) * window.innerWidth
  const sy = (-aimProject.y * 0.5 + 0.5) * window.innerHeight
  return screenAimAngle(player, sx + input.touchAim.dx * TOUCH_AIM_REACH, sy + input.touchAim.dy * TOUCH_AIM_REACH)
}

// Up / down aim. Bullets are 3D (logic/bullets.js): `slope` is the height they gain per unit flown.
// In first person they fly along the crosshair's ray (converging on it ~FP_CONVERGE units out);
// in third person a cursor resting on a monster sends them at its middle (over a hill, or at
// something floating or swimming), otherwise they fly level.
const FP_CONVERGE = 20
const FP_EYE_HEIGHT = 1.5
const FP_MUZZLE = 0.9 // combat.js's muzzle offset: the shot starts this far ahead of the eye
const aimSphere = new THREE.Sphere()
const aimHit = new THREE.Vector3()
function aimSlopeFor(player, game) {
  player.aimStartY = null
  if (firstPerson) {
    // Like Shardfall: on land the shot leaves from the eye and flies straight along the view ray, so it lands
    // exactly on the crosshair at every distance. Underwater the eye sits at the swimmer's depth (the old converge).
    if (!waterRoom()) {
      player.aimStartY = FP_EYE_HEIGHT + Math.tan(fpPitch) * FP_MUZZLE
      return clampSlope(Math.tan(fpPitch))
    }
    return clampSlope((BULLET_START_Y + Math.tan(fpPitch) * FP_CONVERGE - BULLET_START_Y) / FP_CONVERGE)
  }
  if (input.touchMode || !input.mouse.moved) return 0
  aimNdc.set((input.mouse.x / window.innerWidth) * 2 - 1, -(input.mouse.y / window.innerHeight) * 2 + 1)
  aimRaycaster.setFromCamera(aimNdc, camera)
  let best = null
  let bestDistance = Infinity
  const layerY = bulletPool.group.position.y
  for (const mesh of game.monsters) {
    const ai = mesh.userData
    if (ai.dying || ai.spawning || ai.falling) continue
    const height = Math.max(ai.radius * 2.2, 1.6)
    aimSphere.center.set(mesh.position.x, mesh.position.y + height * 0.4, mesh.position.z)
    aimSphere.radius = Math.max(ai.radius, 0.6) * 1.2
    if (!aimRaycaster.ray.intersectSphere(aimSphere, aimHit)) continue
    const distance = aimHit.distanceTo(aimRaycaster.ray.origin)
    if (distance < bestDistance) {
      bestDistance = distance
      // a hugging shot's height is measured from the ground under it, so use the monster's height above its own ground
      best = { y: game.world ? aimSphere.center.y - mesh.position.y - (layerY - heightAt(player.position.x, player.position.z)) : aimSphere.center.y - layerY, x: mesh.position.x, z: mesh.position.z }
    }
  }
  if (!best) return 0
  const along = Math.max(1, Math.hypot(best.x - player.position.x, best.z - player.position.z))
  return clampSlope((best.y - BULLET_START_Y) / along)
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
    if (child.geometry && !child.geometry.userData.shared) child.geometry.dispose() // shared = cached creature bodies
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
// code and the hub should see it (every pet counts as found, so all dragons can be customised). setProfile keeps the real unlocks so the sandbox never saves them.
const sandboxProfile = () => (sandbox ? { ...profile, collection: Object.keys(PETS), unlocked: { scopes: Object.keys(SCOPES), ammo: Object.keys(AMMO) } } : profile)
function setProfile(next) {
  profile = sandbox ? { ...next, unlocked: profile.unlocked, collection: profile.collection } : next // the sandbox's all-unlocked view never gets saved
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

// Dragons, and the skins and breaths for them, are per-run finds: they live on the game and are lost with the
// run (the sandbox has its own, with everything unlocked).
let sandboxDragonState = { unlocked: { skins: SKIN_IDS, breaths: BREATH_IDS }, dragons: {} }
const dragonState = (g = game) => (sandbox ? sandboxDragonState : g.dragonState)
function setDragonState(next) {
  if (sandbox) sandboxDragonState = next
  else game.dragonState = next
}
// Creates a pet beside the player; a dragon comes out in the scale and breath picked in the Dragon Den.
// `g` defaults to the live game; createGame passes its own, since the global isn't assigned yet while it runs.
function spawnPet(id, g = game) {
  return createPet(id, scene, g.player, isDragon(PETS[id]) ? dragonSetup(dragonState(g), PETS[id]) : null)
}
// Closing the hub re-dresses any dragon in play whose scale or breath was changed there.
function refreshDragons() {
  game.pets.forEach((pet, index) => {
    if (!isDragon(pet.def)) return
    const want = dragonSetup(dragonState(), PETS[pet.def.id])
    if (pet.def.scale.id === want.scale && pet.def.breath.id === want.breath) return
    const fresh = spawnPet(pet.def.id)
    fresh.mesh.position.copy(pet.mesh.position)
    fresh.age = 0.3
    disposePets([pet], scene)
    game.pets[index] = fresh
  })
}
// Starts the run with the active loadout's pets (replacing any pets already out).
function applyLoadoutPets(game) {
  disposePets(game.pets, scene)
  const ids = activeLoadoutPets(profile)
  // Runs start with the skill tree's bonus crystals (the Pocket Change / Fat Wallet nodes).
  game.inventory = { ...game.inventory, pets: ids, crystals: Math.round(skillEffects(profile.skills).startCrystals) }
  for (const id of ids) game.pets.push(spawnPet(id, game))
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

const SUNDECK_RADIUS = 48 // ARENA_RADIUS everywhere but the free roam world
function createGame() {
  const lab = gameMode === 'labyrinth'
  const worldMode = gameMode === 'world'
  setArenaRadius(worldMode ? WORLD_RADIUS : SUNDECK_RADIUS)
  setWildsLook(worldMode) // the Wilds' monsters are always Realist creatures
  document.body.classList.toggle('world', worldMode)
  const labFloor = lab ? buildLabyrinthFloor(0) : null
  if (!lab) setMonsterNavigator(null)
  document.body.classList.toggle('labyrinth', lab)
  scene.environmentIntensity = lab ? ENVIRONMENT_INTENSITY * 0.3 : ENVIRONMENT_INTENSITY
  const arena = lab ? labFloor.arena : worldMode ? createWorldArena() : createArena(levelAt(0))
  scene.add(arena.group)
  scene.background = new THREE.Color(arena.backgroundColor)
  scene.fog = arena.fog
  if (worldMode) setLevelEnvironment('world', WORLD_LEVEL)
  else setLevelEnvironment(0)

  // The sundeck's umbrellas/loungers/signs are static circular obstacles,
  // built once from arena.propObstacles; pods and chests are dynamic ones
  // (src/logic/podSpawner.js decides where/when) added/removed on top of
  // them. `obstacles` is mutated in place as pods/chests spawn/despawn
  // (via trySpawnPod/despawnPod) so the player and monsters, which hold
  // this same array, stay in sync without it ever being reassigned.
  const obstacles = lab ? [...arena.propObstacles, ...arena.gateObstacles] : [...arena.propObstacles]

  const savedSpot = worldMode ? loadCheckpoint() : null // a Wilds run picks up at the last save point
  const player = new Player({ spawn: lab ? { x: labFloor.floor.start.x, z: labFloor.floor.start.z } : savedSpot ? { x: savedSpot.x, z: savedSpot.z } : { x: 0, z: 0 }, obstacles, particleSystem })
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
    dragonState: createDragonState(), // dragon skins / breaths found and picked this run (lost with it)
    chests: [], // chest meshes on the platform
    chestSpawnerState: createPodSpawnerState(),
    pickups: [], // power-ups lying on the ground, waiting to be walked over
    pickupSpawnerState: createPodSpawnerState(),
    world: worldMode ? createWorldState(savedSpot) : null, // the free roam world's streamed chunks, live monsters and kill memory
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
  if (worldMode) {
    // The Wilds: monsters, scenery and treasure stream in around you (stepWorld), so nothing is pre-placed.
    applyLoadoutPets(game)
    game.player.maxHp = Math.round(PLAYER_MAX_HP + skillEffects(profile.skills).maxHp)
    game.player.hp = game.player.maxHp
    game.world.fx = createWildsActivities()
    game.arena.group.add(game.world.fx.group)
    stepWorld(game, 0)
    camera.position.set(player.position.x + CAMERA_OFFSET.x, CAMERA_OFFSET.y, player.position.z + CAMERA_OFFSET.z)
    return game
  }
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
  if (game.world) return 'wilds'
  return levelAt(game.levelIndex ?? 0).props.style
}

function trySpawnPod(game, at = null) {
  const point = at ?? pickPodSpawnPoint(Math.random, {
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
  tutorialEvent('weapon')
  setPlayerWeapon(game.player.mesh, selectedWeaponId(next))
  // Cancel any swing in flight (it was animating the old model).
  game.attackState.swingElapsed = null
  clearSwingTrail(swingTrail)
}

// Rage's damage multiplier right now (the Bullet Ring ability scales with it).
function elapsedDamageMultiplier(player, now) {
  return (now < player.rageUntil ? RAGE_DAMAGE_MULTIPLIER : 1) * player.weakFactor(now)
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
// Meteor Strike is gone as an ability, but Starfall still drops these.
const METEOR_BLAST = { damage: 70, radius: 4 }
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
// Whirlwind: while it lasts the player spins, hits everything close several times a
// second and shreds enemy orbs that come near.
function updateWhirlwind(game, dt, now) {
  const { player } = game
  if (now >= (player.whirlUntil ?? -Infinity)) {
    if (player.whirlSpin) {
      player.whirlSpin = 0
      player.mesh.rotation.y = player.facing
    }
    return
  }
  const def = ABILITIES.whirl
  player.whirlSpin = (player.whirlSpin ?? 0) + dt * 16
  player.mesh.rotation.y = player.whirlSpin
  const a = player.whirlSpin
  for (const k of [0, Math.PI]) {
    burst(particleSystem, { x: player.position.x + Math.sin(a + k) * def.radius * 0.85, y: 0.8, z: player.position.z + Math.cos(a + k) * def.radius * 0.85 }, 0x8af0c8, 2, 1.5)
  }
  destroyProjectilesNear(projectilePool, player.position.x, player.position.z, def.radius)
  player.whirlTick = (player.whirlTick ?? 0) - dt
  if (player.whirlTick > 0) return
  player.whirlTick = def.interval
  spawnShockwave(shockwavePool, player.position.x, player.position.z, def.radius, 0x8af0c8)
  const damage = def.damage * elapsedDamageMultiplier(player, now)
  for (const mesh of game.monsters) {
    if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
    if (Math.hypot(mesh.position.x - player.position.x, mesh.position.z - player.position.z) > def.radius + (mesh.userData.reachBonus ?? 0) + mesh.userData.radius * 0.5) continue
    damageMonster(mesh, damage, { fromPos: player.position, knockback: 1.1, obstacles: game.obstacles, particleSystem, cause: 'sword', hitstop: game.hitstop })
  }
}

// A frozen monster wears a pale ice shell; slowed ones get a faint chill sparkle.
const iceShellGeometry = new THREE.IcosahedronGeometry(1, 1)
const iceShellMaterial = new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.42, depthWrite: false })
function updateFrozenLook(mesh, now) {
  const ai = mesh.userData
  const frozen = isFrozen(ai, now)
  let shell = ai.iceShell
  if (!frozen) {
    if (shell) shell.visible = false
    return
  }
  if (!shell) {
    shell = new THREE.Mesh(iceShellGeometry, iceShellMaterial)
    const r = ai.radius * 1.15
    shell.scale.setScalar(r)
    shell.position.y = r * 0.85
    mesh.add(shell)
    ai.iceShell = shell
  }
  shell.visible = true
}

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
  // On the Wilds' hills a meteor lands on the ground there, not at sea level.
  meteors.push({ group, x: at.x, z: at.z, age: 0, fall: 0.7, damage, radius, baseY: game?.world ? heightAt(at.x, at.z) : 0 })
  spawnShockwave(shockwavePool, at.x, at.z, radius ?? METEOR_BLAST.radius, 0xff7a2e) // the landing marker
}

function disposeMeteor(meteor) {
  scene.remove(meteor.group)
  meteor.group.traverse((c) => {
    if (c.geometry) c.geometry.dispose()
    if (c.material) c.material.dispose()
  })
}

function updateMeteors(game, dt) {
  const def = METEOR_BLAST
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.age += dt
    const t = Math.min(1, m.age / m.fall)
    m.group.position.set(m.x - (1 - t) * 8, (m.baseY ?? 0) + 0.7 + (1 - t) * (1 - t) * 30, m.z - (1 - t) * 4)
    burst(particleSystem, { x: m.group.position.x, y: m.group.position.y - (game.world?.groundY ?? 0), z: m.group.position.z }, 0xff8a3a, 2, 1.5)
    if (t < 1) continue
    disposeMeteor(m)
    meteors.splice(i, 1)
    const at = { x: m.x, z: m.z }
    const blastRadius = m.radius ?? def.radius
    const blastDamage = m.damage ?? def.damage
    spawnShockwave(shockwavePool, at.x, at.z, blastRadius, 0xffb454)
    warp.add('ripple', at.x, at.z, blastRadius * 1.6, 0.6)
    const lift = (m.baseY ?? 0) - (game.world?.groundY ?? 0)
    burst(particleSystem, { x: at.x, y: 1 + lift, z: at.z }, 0xff7a2e, 60, 6, 1)
    shardBurst(particleSystem, { x: at.x, y: 0.6 + lift, z: at.z }, 0xffb454, 18, 4)
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
  tutorialEvent('ability')
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
    fireBullets(bulletPool, makeBullets(fan, { x: player.position.x, z: player.position.z, aimAngle: player.facing, slope: player.aimSlope ?? 0, startY: player.aimStartY != null ? FP_EYE_HEIGHT : BULLET_START_Y, damageMultiplier: elapsedDamageMultiplier(player, now) }))
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
  } else if (used.abilityId === 'frostlance') {
    const def = ABILITIES.frostlance
    const lance = {
      pellets: 1,
      spread: 0,
      damage: def.damage,
      knockback: 1.4,
      bullet: { speed: 30, life: 0.8, radius: 0.9, pierce: 99, explode: 0, color: 0x9fe4ff, freeze: def.freeze },
    }
    fireBullets(bulletPool, makeBullets(lance, { x: player.position.x, z: player.position.z, aimAngle: player.facing, slope: player.aimSlope ?? 0, startY: player.aimStartY != null ? FP_EYE_HEIGHT : BULLET_START_Y, damageMultiplier: elapsedDamageMultiplier(player, now) }))
    burst(particleSystem, center, 0xbfeaff, 26, 4)
    streak(player.position, { x: player.position.x + Math.sin(player.facing) * 12, z: player.position.z + Math.cos(player.facing) * 12 }, 0xbfeaff, 14)
    warp.add('ripple', player.position.x + Math.sin(player.facing) * 2, player.position.z + Math.cos(player.facing) * 2, 3, 0.4)
  } else if (used.abilityId === 'glacier') {
    const def = ABILITIES.glacier
    spawnShockwave(shockwavePool, player.position.x, player.position.z, def.radius, 0x9fe4ff)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, def.radius * 0.6, 0xffffff)
    warp.add('ripple', player.position.x, player.position.z, def.radius * 1.1, 0.7)
    burst(particleSystem, center, 0xbfeaff, 44, 5)
    shardBurst(particleSystem, center, 0xbfeaff, 18, 4)
    triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
    for (const mesh of game.monsters) {
      if (mesh.userData.dying || mesh.userData.spawning || mesh.userData.falling) continue
      if (Math.hypot(mesh.position.x - player.position.x, mesh.position.z - player.position.z) > def.radius + (mesh.userData.reachBonus ?? 0)) continue
      applyFreeze(mesh.userData, now, def.freeze)
      damageMonster(mesh, def.damage, { fromPos: player.position, knockback: 0, obstacles: game.obstacles, particleSystem, cause: 'shockwave', hitstop: game.hitstop })
    }
  } else if (used.abilityId === 'timewarp') {
    const until = now + ABILITIES.timewarp.duration
    setTimeWarp(until)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 7, 0xffd36e)
    warp.add('swirl', player.position.x, player.position.z, 9, 1.2)
    burst(particleSystem, center, 0xffe9a0, 30, 3, 0.5)
    column(player.position.x, player.position.z, 0xffd36e, 4)
  } else if (used.abilityId === 'whirl') {
    const def = ABILITIES.whirl
    player.whirlUntil = now + def.duration
    player.whirlTick = 0
    spawnShockwave(shockwavePool, player.position.x, player.position.z, def.radius * 1.3, 0x8af0c8)
    warp.add('swirl', player.position.x, player.position.z, def.radius * 1.5, 0.6)
    burst(particleSystem, center, 0x8af0c8, 24, 3, 0.5)
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

  const loot = rollChestLoot(game.inventory, Math.random, { ...profile.unlocked, ...game.dragonState.unlocked }, profile.collection)
  if (!loot) {
    game.score += CHEST_ALL_OWNED_SCORE
    game.player.hp = Math.min(game.player.maxHp, game.player.hp + CHEST_ALL_OWNED_HEAL)
    showLootToast(hud, { title: 'LOADOUT FULL', name: `+${CHEST_ALL_OWNED_SCORE} SCORE`, blurb: 'Plus a big heal' })
    return
  }

  // A pet you find is yours for good: it goes into your collection (and so the Loadout page)
  // right away, even if you then decline to swap it in for the one you're carrying.
  if (loot.kind === 'pet' && !sandbox && !isDragon(PETS[loot.id])) setProfile(addToCollection(profile, [loot.id])) // dragons are per-run finds

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
  if (loot.kind === 'skin' || loot.kind === 'breath') {
    // Dragon parts are kept on the profile; a dragon you carry puts the new one on right away.
    const isSkin = loot.kind === 'skin'
    const table = isSkin ? DRAGON_SKINS : BREATHS
    setDragonState(unlockDragonPart(dragonState(), loot.kind, loot.id))
    const wearer = game.pets.find((pet) => isDragon(pet.def))
    if (wearer) {
      setDragonState(setDragonOption(dragonState(), wearer.def.id, isSkin ? 'scale' : 'breath', loot.id))
      refreshDragons()
    }
    showLootToast(hud, { title: isSkin ? 'NEW DRAGON SKIN' : 'NEW DRAGON BREATH', name: table[loot.id].name, icon: { kind: 'pet', id: wearer ? wearer.def.id : 'cinderwing' }, blurb: `${table[loot.id].blurb}. N opens the Dragon Den` })
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
    game.pets.push(spawnPet(loot.id))
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
// ---- The Wilds (free roam): a streamed world. Chunks of scenery, monsters and treasure come alive around the
// player (logic/world.js decides what is in each) and are dropped again when they fall far behind. ----------
// The skystars caught on this device (they stay caught between runs).
const SKYSTAR_KEY = 'slashbattle:skystars'
function loadSkystars() {
  try {
    const list = JSON.parse(localStorage.getItem(SKYSTAR_KEY) ?? '[]')
    return new Set(Array.isArray(list) ? list : [])
  } catch (_) {
    return new Set()
  }
}
function saveSkystars(caught) {
  try {
    localStorage.setItem(SKYSTAR_KEY, JSON.stringify([...caught]))
    noteSaved()
  } catch (_) {
    // not remembered; still caught for this run
  }
}

// The Wilds' save point (the Sanctum or a village): saved the moment you walk in, and where you get up if you fall.
function loadCheckpoint() {
  try {
    return parseCheckpoint(localStorage.getItem(CHECKPOINT_KEY))
  } catch (_) {
    return null
  }
}
function saveCheckpoint(spot) {
  try {
    localStorage.setItem(CHECKPOINT_KEY, serializeCheckpoint(spot))
    noteSaved()
  } catch (_) {
    // not remembered between sessions; still the respawn point for this run
  }
}

// Gets the player back up at the Wilds' save point with full health: used when HP hits zero and after a fall off the world.
function respawnAtCheckpoint(game, now, { toast = true, heal = true } = {}) {
  const { player, world: w } = game
  const spot = respawnSpot(w.checkpoint)
  const groundY = heightAt(spot.x, spot.z)
  player.position.x = spot.x
  player.position.z = spot.z
  player.mesh.position.set(spot.x, groundY, spot.z)
  player.falling = false
  player.vel = { x: 0, z: 0 }
  if (heal) player.hp = player.maxHp
  player.invulnerableUntil = Math.max(player.invulnerableUntil, now + RESPAWN_IFRAMES)
  player.slowUntil = player.weakUntil = player.poisonUntil = -Infinity // shake off every status
  w.jump = createJumpState()
  w.groundY = groundY
  w.camGround = groundY
  w.talkingTo = null
  resetProjectiles(projectilePool) // no stray orbs waiting for you
  burst(particleSystem, { x: spot.x, y: groundY + 0.8, z: spot.z }, 0xfff27a, 40, 4, 1)
  spawnShockwave(shockwavePool, spot.x, spot.z, 5, 0xfff27a)
  sfx.play('waveCleared', { x: spot.x, z: spot.z })
  if (toast) questUi.showToast(`YOU GOT BACK UP AT ${spot.name.toUpperCase()}`)
}

function createWorldState(savedSpot = null) {
  return {
    checkpoint: savedSpot, // the last save point you walked into ({ id, name, x, z }), or null before the first
    starsCaught: loadSkystars(), // skystar ids caught on the hilltops
    chunks: new Map(), // chunk key -> { content, obstacles, treasure: [meshes] }
    live: new Map(), // monster id -> mesh, so a camp is never spawned twice
    killed: new Map(), // monster id -> when you slew it (a camp respawns after a while)
    opened: new Set(), // chest ids already looted
    jump: createJumpState(), // Space hops, and again in the air opens the paraglider (see logic/jump.js)
    glider: createGlider(), // the canopy, parented to the player mesh on first use
    npcs: new Map(), // villager id -> npc (src/npcs.js), alive while their chunk is
    quests: createQuestLog(),
    talkingTo: null, // the villager whose dialogue is open
    groundY: 0, // the ground height under the player (the effect layers ride on it)
    camGround: 0, // ...smoothed, for the camera
    biome: null,
    bannerUntil: 0,
    discovered: new Set(), // landmark ids found this run (a toast names each one the first time)
    landmark: null, // the landmark you are standing at, if any
    lastThunder: 0,
    wasInSanctum: false,
    // Activities (see stepActivities): the saved journal, wayshrine boons, carried treasure maps, the race
    // in progress, the roaming-event director (created on the first step, from the clock) and its live event.
    journal: loadJournal(),
    journalDirty: false,
    journalSavedAt: 0,
    shrines: createShrineState(),
    shrineAt: null, // the shrine you are standing at (so a sleeping one only says so once)
    maps: [],
    dugMaps: [],
    race: createRaceState(),
    events: null,
    event: null,
    shards: [], // star shards lying about after a Starfall: { x, z, mesh, until }
    lanternsAt: null, // where the lit-lantern list was last rebuilt
    lootQueue: [], // gear rewards waiting for the swap panel to be free
    fx: null, // src/wildsActivities.js, built with the game
  }
}

// The Wilds journal (landmarks, bestiary, lanterns, races...), kept on this device across runs.
function loadJournal() {
  try {
    return parseJournal(localStorage.getItem(JOURNAL_KEY))
  } catch (_) {
    return parseJournal(null)
  }
}
function saveJournal(journal) {
  try {
    localStorage.setItem(JOURNAL_KEY, serializeJournal(journal))
    noteSaved()
  } catch (_) {
    // not remembered between sessions
  }
}

// ---- villagers & quests: the dialogue flow --------------------------------------------------------------
const questUi = createQuestUi({
  onButton: (id) => handleDialogButton(game, id),
  onClose: () => {
    if (game?.world) game.world.talkingTo = null
    input.clear() // nothing pressed in the dialogue should carry into the game
  },
})

function worldQuestEvent(game, event) {
  const w = game.world
  if (!w) return
  const result = questEvent(w.quests, event)
  w.quests = result.log
  for (const q of result.ready) {
    if (q.type !== 'deliver') questUi.showToast(`${q.title.toUpperCase()}: RETURN TO ${q.giverName.toUpperCase()}`)
  }
}

const dialogInfo = (game, npc) => ({ npc: npc.def, village: villageById(npc.def.villageId), ...npcDialog(game.world.quests, npc.def) })

function openTalk(game, npc) {
  game.world.talkingTo = npc.def.id
  if (npc.def.merchant) {
    questUi.show(merchantDialog(game))
    sfx.play('podIn', { x: npc.mesh.position.x, z: npc.mesh.position.z })
    return
  }
  // Being spoken to is an event of its own: a letter's recipient counts it, and the quest is ready to claim.
  worldQuestEvent(game, { type: 'talk', npcId: npc.def.id })
  questUi.show(dialogInfo(game, npc))
  sfx.play('podIn', { x: npc.mesh.position.x, z: npc.mesh.position.z })
}

function handleDialogButton(game, id) {
  const w = game.world
  const npc = w?.npcs.get(w.talkingTo)
  if (!npc) return questUi.close()
  if (npc.def.merchant) return handleMerchantButton(game, id)
  const dialog = npcDialog(w.quests, npc.def)
  if (id === 'accept' && dialog.mode === 'offer') {
    w.quests = acceptQuest(w.quests, dialog.quest)
    questUi.showToast(`QUEST ACCEPTED: ${dialog.quest.title.toUpperCase()}`)
    sfx.play('chestOpen', { x: npc.mesh.position.x, z: npc.mesh.position.z })
    questUi.close()
  } else if (id === 'claim' && dialog.mode === 'claim') {
    const { log, quest } = claimQuest(w.quests, dialog.quest.id)
    w.quests = log
    if (quest) {
      game.inventory = addCrystals(game.inventory, quest.reward)
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp * quest.heal)
      burst(particleSystem, { x: game.player.position.x, y: 1.2, z: game.player.position.z }, 0xffd15c, 40, 4.5)
      const weaponId = questWeaponFor(quest, game.inventory)
      questUi.showToast(`QUEST COMPLETE  +${quest.reward} CRYSTALS${weaponId ? `  +  ${WEAPONS[weaponId].name.toUpperCase()}` : ''}`)
      sfx.play('waveCleared')
      if (weaponId) {
        const loot = { kind: 'weapon', id: weaponId }
        if (needsSwap(game.inventory, loot)) {
          // Hotbar full: the usual swap panel (the game pauses) asks which weapon to give up.
          pendingSwapLoot = loot
          questUi.close()
          swapPanel.show(loot, swappableIds(game.inventory, loot.kind))
          return
        }
        receiveLoot(game, loot)
      }
    }
    if (questsToClaim(w.quests, npc.def.id).length) questUi.update(dialogInfo(game, npc))
    else questUi.close()
  } else questUi.close()
}

function rememberWorldKill(game, mesh, now) {
  const id = mesh.userData.worldId
  if (!game.world || !id) return
  game.world.killed.set(id, now)
  game.world.live.delete(id)
}

// Quietly removes a monster that fell far behind the player (not a kill; it comes back with its camp).
function dropWorldMonster(game, mesh) {
  const id = mesh.userData.worldId
  if (id) game.world.live.delete(id)
  const i = game.monsters.indexOf(mesh)
  if (i >= 0) game.monsters.splice(i, 1)
  const j = game.spawnEffects.findIndex((e) => e.monster === mesh)
  if (j >= 0) {
    disposeObject3D(game.spawnEffects[j].effect.group)
    game.spawnEffects.splice(j, 1)
  }
  disposeObject3D(mesh)
}

function removeFrom(list, item) {
  const i = list.indexOf(item)
  if (i >= 0) list.splice(i, 1)
}

// Spawns one monster of the Wilds at `at`, scaled to how deep in it stands: { hpScale, danger, elite, boss, lake }.
// A boss knows moves like a boss several fights in. Used by the chunk camps and the roaming events.
function spawnWildMonster(game, type, at, m) {
  const mesh = spawnMonster(game, type, { at, hpScale: m.hpScale ?? 1, effectOptions: { scale: 0.5, duration: 0.4 } })
  mesh.userData.elite = Boolean(m.elite)
  mesh.position.y = m.lake ? WATER_LEVEL - 0.3 : heightAt(at.x, at.z)
  const effect = game.spawnEffects[game.spawnEffects.length - 1]
  if (effect) effect.effect.group.position.y = mesh.position.y
  mesh.userData.damageScale = (1 + m.danger * 1.1) * (m.elite ? 1.35 : 1)
  mesh.userData.speedScale = 1 + m.danger * 0.18
  if (m.lake) {
    mesh.userData.lake = m.lake // water monsters never leave their lake
    mesh.position.y = WATER_LEVEL - 0.3
  }
  if (m.boss) {
    const stats = MONSTER_TYPES[type]
    const fights = m.fights ?? BOSS_HEAD_START + Math.round(m.danger * 4)
    mesh.userData.damageScale = bossDamageScale(fights)
    mesh.userData.bossFights = fights
    mesh.userData.immunityThresholds = immunityThresholdsFor(fights)
    mesh.userData.speedScale = bossSpeedScale(stats.speed, fights)
    upgradeBossSpecials(mesh.userData, bossSpecialsFor(stats.specials, fights), bossCooldownScale(fights))
  }
  if (m.elite) {
    const material = mesh.userData.jelly?.body?.material
    if (material?.emissive) {
      material.emissive.setHex(0xff3355) // elites glow a warning red
      material.emissiveIntensity = 0.45
    }
  }
  return mesh
}

function loadWorldChunk(game, cx, cz, now) {
  const w = game.world
  const content = chunkContent(cx, cz)
  const obstacles = content.props.filter((p) => p.radius > 0).map((p) => ({ x: p.x, z: p.z, radius: p.radius }))
  game.obstacles.push(...obstacles)
  game.props.push(...obstacles)
  const chunk = { content, obstacles, treasure: [], npcIds: [] }
  w.chunks.set(content.key, chunk)

  for (const m of content.monsters) {
    if (w.live.has(m.id) || !canRespawn(w.killed.get(m.id), now, m.boss ? BOSS_RESPAWN_SECONDS : undefined)) continue
    const stats = MONSTER_TYPES[m.type]
    // Nudge a camp member out of any tree or crystal it was seeded inside.
    const at = { x: m.x, z: m.z }
    for (const o of obstacles) {
      const d = Math.hypot(at.x - o.x, at.z - o.z)
      const need = o.radius + stats.radius + 0.4
      if (d < need) {
        const k = need / (d || 1)
        at.x = o.x + (at.x - o.x || 1) * k
        at.z = o.z + (at.z - o.z) * k
      }
    }
    const mesh = spawnWildMonster(game, m.type, at, m)
    mesh.userData.worldId = m.id
    w.live.set(m.id, mesh)
  }

  // The villagers who live here.
  for (const def of content.npcs) {
    if (w.npcs.has(def.id)) continue
    const npc = createNpc(def)
    scene.add(npc.mesh)
    w.npcs.set(def.id, npc)
    chunk.npcIds.push(def.id)
  }

  for (const t of content.treasure) {
    if (t.kind === 'chest' && w.opened.has(t.id)) continue
    const list = t.kind === 'chest' ? game.chests : t.kind === 'pod' ? game.pods : game.pickups
    const before = list.length
    if (t.kind === 'chest') trySpawnChest(game, { at: { x: t.x, z: t.z } })
    else if (t.kind === 'pod') trySpawnPod(game, { x: t.x, z: t.z })
    else trySpawnPerkPickup(game, { x: t.x, z: t.z })
    if (list.length > before) {
      const mesh = list[list.length - 1]
      mesh.position.y = heightAt(t.x, t.z)
      mesh.userData.worldTreasure = t
      chunk.treasure.push({ mesh, list })
    }
  }
}

function unloadWorldChunk(game, key) {
  const w = game.world
  const chunk = w.chunks.get(key)
  if (!chunk) return
  for (const o of chunk.obstacles) {
    removeFrom(game.obstacles, o)
    removeFrom(game.props, o)
  }
  for (const id of chunk.npcIds) {
    const npc = w.npcs.get(id)
    if (!npc || w.talkingTo === id) continue
    disposeObject3D(npc.mesh)
    w.npcs.delete(id)
  }
  for (const { mesh, list } of chunk.treasure) {
    if (game.hidingState.currentPod === mesh) continue // you are hiding in it
    if (mesh.userData.worldTreasure?.kind === 'chest' && mesh.userData.opened) w.opened.add(mesh.userData.worldTreasure.id)
    if (mesh.userData.obstacle) removeFrom(game.obstacles, mesh.userData.obstacle)
    removeFrom(list, mesh)
    disposeObject3D(mesh)
  }
  w.chunks.delete(key)
}

// A name for the biome banner / minimap, and the cheap per-frame upkeep of the world.
const biomeBanner = document.getElementById('biome-banner')
const minimap = document.getElementById('minimap')
let minimapBase = null
// The minimap shows the land around you (MINIMAP_VIEW units to each side), not the whole continent at once:
// the world is too big for that to stay readable. The continent's colours are painted once and panned.
const MINIMAP_VIEW = 210
const MINIMAP_RES = 384
function drawMinimap(game, now = 0) {
  if (!minimap) return
  const ctx = minimap.getContext('2d')
  const size = minimap.width
  if (!minimapBase) {
    const res = MINIMAP_RES
    const small = document.createElement('canvas')
    small.width = small.height = res
    const sctx = small.getContext('2d')
    const image = sctx.createImageData(res, res)
    for (let py = 0; py < res; py++) {
      for (let px = 0; px < res; px++) {
        const x = ((px + 0.5) / res - 0.5) * WORLD_RADIUS * 2
        const z = ((py + 0.5) / res - 0.5) * WORLD_RADIUS * 2
        const i = (py * res + px) * 4
        if (Math.hypot(x, z) > WORLD_RADIUS) {
          image.data.set([27, 20, 56, 255], i)
        } else {
          const [r, g, b] = groundColorAt(x, z)
          // Hills read lighter, valleys darker, so the land has relief on the map.
          const lift = 0.85 + Math.min(0.35, Math.max(0, heightAt(x, z)) * 0.012)
          image.data.set([Math.min(255, r * 300 * lift), Math.min(255, g * 300 * lift), Math.min(255, b * 300 * lift), 255], i)
        }
      }
    }
    sctx.putImageData(image, 0, 0)
    minimapBase = small
  }
  const p0 = game.player.position
  const k = size / (MINIMAP_VIEW * 2)
  const at = (x, z) => [size / 2 + (x - p0.x) * k, size / 2 + (z - p0.z) * k]
  const onMap = ([x, y], pad = 6) => x > -pad && y > -pad && x < size + pad && y < size + pad
  ctx.fillStyle = '#1b1438'
  ctx.fillRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  const texelsPerUnit = MINIMAP_RES / (WORLD_RADIUS * 2)
  ctx.drawImage(minimapBase, (p0.x - MINIMAP_VIEW + WORLD_RADIUS) * texelsPerUnit, (p0.z - MINIMAP_VIEW + WORLD_RADIUS) * texelsPerUnit, MINIMAP_VIEW * 2 * texelsPerUnit, MINIMAP_VIEW * 2 * texelsPerUnit, 0, 0, size, size)
  for (const m of game.monsters) {
    if (m.userData.dying || m.userData.falling) continue
    const [x, y] = at(m.position.x, m.position.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = m.userData.isBoss ? '#ffd15c' : '#ff4d6d'
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
  }
  // Villages: a pale square each; a gold ring where an open quest wants you to go.
  const pings = new Set()
  for (const q of game.world?.quests.active ?? []) {
    if (q.type === 'deliver') pings.add(q.status === 'ready' || q.status === 'active' ? q.targetVillage : q.villageId)
    else if (q.status === 'ready') pings.add(q.villageId)
  }
  for (const v of villages()) {
    const [x, y] = at(v.x, v.z)
    if (!onMap([x, y], 12)) {
      // A pinged village off the edge of the map: an arrow on the rim points the way.
      if (pings.has(v.id)) drawMinimapPointer(ctx, size, Math.atan2(v.z - p0.z, v.x - p0.x), '#ffd15c')
      continue
    }
    if (pings.has(v.id)) {
      ctx.strokeStyle = '#ffd15c'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillStyle = '#fff6d8'
    ctx.strokeStyle = '#3a2a78'
    ctx.lineWidth = 1.5
    ctx.fillRect(x - 3.5, y - 3.5, 7, 7)
    ctx.strokeRect(x - 3.5, y - 3.5, 7, 7)
  }
  // Landmarks: a diamond each, bright once you have found it, dim until then.
  for (const l of landmarks()) {
    const [x, y] = at(l.x, l.z)
    if (!onMap([x, y])) continue
    const found = game.world?.discovered.has(l.id)
    ctx.fillStyle = found ? `#${BIOMES[l.biome].glow.toString(16).padStart(6, '0')}` : 'rgba(255,255,255,0.35)'
    ctx.strokeStyle = '#2a1f55'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x, y - 5)
    ctx.lineTo(x + 4, y)
    ctx.lineTo(x, y + 5)
    ctx.lineTo(x - 4, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  for (const r of ruins()) {
    const [x, y] = at(r.x, r.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = r.kind === 'temple' ? '#ffd15c' : '#c9b8ff'
    ctx.strokeStyle = '#2a1f55'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x, y - 4.5)
    ctx.lineTo(x + 4, y + 3)
    ctx.lineTo(x - 4, y + 3)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  // Skystars still to catch: little white stars on the peaks.
  for (const star of skystars()) {
    if (game.world?.starsCaught.has(star.id)) continue
    const [x, y] = at(star.x, star.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = '#fff6c0'
    ctx.beginPath()
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? 1.6 : 4
      const a = (k / 8) * Math.PI * 2
      ctx.lineTo(x + Math.sin(a) * r, y - Math.cos(a) * r)
    }
    ctx.closePath()
    ctx.fill()
  }
  for (const c of game.chests) {
    if (c.userData.opened) continue
    const [x, y] = at(c.position.x, c.position.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = '#ffd15c'
    ctx.fillRect(x - 2.5, y - 2.5, 5, 5)
  }
  drawActivityMarks(ctx, game, at, onMap, size, now)
  // The Sanctum is always findable: an arrow on the rim when it is off the map.
  if (!onMap(at(0, 0), -10)) drawMinimapPointer(ctx, size, Math.atan2(-p0.z, -p0.x), '#c9b8ff')
  const p = game.player
  const [px, py] = at(p.position.x, p.position.z)
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(Math.PI - p.facing) // facing is atan2(x, z); canvas y points toward +z
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#241b3a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -7)
  ctx.lineTo(5, 5)
  ctx.lineTo(-5, 5)
  ctx.closePath()
  ctx.stroke()
  ctx.fill()
  ctx.restore()
  // The time of day, and how many skystars are caught.
  const caught = game.world?.starsCaught.size ?? 0
  ctx.font = '600 11px Sora, sans-serif'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = 'rgba(16, 10, 36, 0.7)'
  ctx.fillRect(0, size - 17, size, 17)
  ctx.fillStyle = '#fff6d8'
  ctx.textAlign = 'left'
  ctx.fillText(dayName(now), 6, size - 3)
  ctx.textAlign = 'right'
  ctx.fillText(`\u2605 ${caught}/${skystars().length}`, size - 6, size - 3)
}

// A little arrowhead on the minimap's rim pointing toward something off the edge (angle in map space: atan2(dz, dx)).
function drawMinimapPointer(ctx, size, angle, color) {
  const r = size / 2 - 9
  const x = size / 2 + Math.cos(angle) * r
  const y = size / 2 + Math.sin(angle) * r
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = color
  ctx.strokeStyle = '#241b3a'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(7, 0)
  ctx.lineTo(-4, 5)
  ctx.lineTo(-4, -5)
  ctx.closePath()
  ctx.stroke()
  ctx.fill()
  ctx.restore()
}

// Catching a skystar: standing on (or gliding right over) a hilltop star.
function stepSkystars(game, now) {
  const w = game.world
  const p = game.player.position
  for (const star of skystars()) {
    if (w.starsCaught.has(star.id)) continue
    if (Math.hypot(p.x - star.x, p.z - star.z) > SKYSTAR_CATCH_RADIUS) continue
    if (Math.abs(w.groundY - star.y) > 3.5) continue
    w.starsCaught.add(star.id)
    saveSkystars(w.starsCaught)
    game.arena.world.setSkystarsCaught(w.starsCaught)
    game.inventory = addCrystals(game.inventory, SKYSTAR_REWARD)
    const at = { x: star.x, y: star.y + 1.8 - w.groundY, z: star.z }
    burst(particleSystem, at, 0xfff1a8, 40, 6)
    burst(particleSystem, at, 0xffffff, 16, 3)
    sfx.play('chestOpen', { x: star.x, z: star.z })
    questUi.showToast(`SKYSTAR CAUGHT ${w.starsCaught.size}/${skystars().length}  +${SKYSTAR_REWARD} CRYSTALS`)
  }
}

// ---- Wilds activities: lanterns, wayshrines, treasure maps, sky-ring races, roaming events and the journal ------
// (rules in logic/lanterns.js, wayshrines.js, treasure.js, races.js, wildEvents.js, wildsJournal.js; the look in
// src/wildsActivities.js). stepActivities runs from stepWorld every live frame.
const wildsStatus = document.getElementById('wilds-status')
let wildsStatusKey = ''
const MERCHANT_ID = 'merchant'
const DISCOVER_REWARD = 10 // crystals for reaching a landmark this run...
const DISCOVER_REWARD_FIRST = 25 // ...or for the first time ever
// A world height as the effect layers see it (they ride up with the player: see applyFxDepth).
const fxY = (game, worldY) => worldY - (game.world?.groundY ?? 0)
const hexColor = (c) => `#${c.toString(16).padStart(6, '0')}`

const journalUi = createJournalUi({ onClose: () => input.clear() })
function openJournal(game) {
  const w = game.world
  const boons = activeBoons(w.shrines, timer.getElapsed()).map((b) => `${BOONS[b.id].name} ${Math.ceil(b.left)}s`).join(', ')
  journalUi.show(w.journal, { discovered: w.discovered.size, maps: w.maps.length, boons })
}

// Updates the journal, and pays out any milestone it just reached (crystals now, gear through the loot queue).
function setJournal(game, next) {
  const w = game.world
  w.journal = next
  w.journalDirty = true
  let reached = false
  for (const m of readyMilestones(w.journal)) {
    reached = true
    w.journal = claimMilestone(w.journal, m.id)
    game.inventory = addCrystals(game.inventory, m.crystals)
    questUi.showToast(`MILESTONE: ${m.title.toUpperCase()}  +${m.crystals} CRYSTALS${m.loot ? `  +  A NEW ${m.loot.toUpperCase()}` : ''}`)
    if (m.loot) {
      const id = pickUnowned(m.loot, game.inventory, m.id)
      if (id) w.lootQueue.push({ kind: m.loot, id })
    }
    sfx.play('waveCleared')
  }
  if (reached) flushJournal(game, true)
}
function flushJournal(game, force = false, now = null) {
  const w = game.world
  if (!w?.journalDirty) return
  if (!force && now !== null && now - w.journalSavedAt < 4) return
  saveJournal(w.journal)
  w.journalDirty = false
  if (now !== null) w.journalSavedAt = now
}

// Hands over a piece of gear won out in the Wilds (the swap panel asks when that kind's slots are full).
function giveWildsLoot(game, loot) {
  if (loot.kind === 'pet' && !sandbox && !isDragon(PETS[loot.id])) setProfile(addToCollection(profile, [loot.id]))
  if (needsSwap(game.inventory, loot)) {
    pendingSwapLoot = loot
    questUi.close()
    swapPanel.show(loot, swappableIds(game.inventory, loot.kind))
    return
  }
  receiveLoot(game, loot)
}

// A creature felled in the Wilds goes in the bestiary; the first of its kind ever pays a little.
function noteWildsKill(game, type) {
  const w = game.world
  const { journal, first } = noteKill(w.journal, type)
  setJournal(game, journal)
  if (!first) return
  game.inventory = addCrystals(game.inventory, BESTIARY_FIRST_REWARD)
  questUi.showToast(`NEW BESTIARY ENTRY: ${creatureName(type).toUpperCase()}  +${BESTIARY_FIRST_REWARD} CRYSTALS`)
}

// ---- lost lanterns ----
function stepLanterns(game) {
  const w = game.world
  const p = game.player.position
  for (const l of lanternsNear(p.x, p.z, LANTERN_CATCH_RADIUS)) {
    if (w.journal.lanterns.includes(l.id)) continue
    const ground = heightAt(l.x, l.z)
    if (Math.abs(w.groundY - ground) > 3.5) continue
    setJournal(game, noteLantern(w.journal, l.id).journal)
    const total = w.journal.lanterns.length
    const reward = lanternReward(total)
    game.inventory = addCrystals(game.inventory, reward)
    burst(particleSystem, { x: l.x, y: fxY(game, ground + 1.3), z: l.z }, l.color, 26, 3.5)
    burst(particleSystem, { x: l.x, y: fxY(game, ground + 1.3), z: l.z }, 0xffe2a0, 12, 1.5, 0.6)
    sfx.play('crystal', { x: l.x, z: l.z })
    questUi.showToast(`LANTERN LIT ${total}/${LANTERN_COUNT}  +${reward} CRYSTALS`)
    w.lanternsAt = null
  }
  if (!w.lanternsAt || Math.hypot(w.lanternsAt.x - p.x, w.lanternsAt.z - p.z) > 12) {
    w.lanternsAt = { x: p.x, z: p.z }
    const unlit = lanternsNear(p.x, p.z, 120).filter((l) => !w.journal.lanterns.includes(l.id))
    unlit.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))
    w.fx.setLanterns(unlit)
  }
}

// ---- wayshrines ----
function stepShrines(game, now) {
  const w = game.world
  const p = game.player.position
  let at = null
  for (const s of wayshrines()) {
    const d = Math.hypot(s.x - p.x, s.z - p.z)
    if (d < 200) w.fx.setShrineCharge(s.id, shrineCharge(w.shrines, s.id, now))
    if (d < SHRINE_RADIUS && !w.jump.air) at = s
  }
  if ((at?.id ?? null) === w.shrineAt) return
  w.shrineAt = at?.id ?? null
  if (!at) return
  const used = useShrine(w.shrines, at, now)
  if (!used.boon) {
    questUi.showToast('THE WAYSHRINE SLEEPS. COME BACK LATER')
    return
  }
  w.shrines = used.state
  const def = BOONS[used.boon]
  if (def.heal) game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp * def.heal)
  setJournal(game, noteShrine(w.journal))
  const ground = heightAt(at.x, at.z)
  burst(particleSystem, { x: at.x, y: fxY(game, ground + 3), z: at.z }, def.color, 40, 4.5)
  spawnShockwave(shockwavePool, p.x, p.z, 5, def.color)
  sfx.play('chestOpen', { x: at.x, z: at.z })
  questUi.showToast(`WAYSHRINE: ${def.name.toUpperCase()} (${def.duration}s)  ·  ${def.blurb.toUpperCase()}`)
}

// ---- treasure maps ----
function grantTreasureMap(game, key, origin, from) {
  const w = game.world
  const map = makeTreasureMap(key, origin, from)
  if (w.dugMaps.includes(map.id) || w.maps.some((m) => m.id === map.id)) return false
  if (w.maps.length >= MAX_MAPS) {
    questUi.showToast('YOUR MAP CASE IS FULL: DIG ONE UP FIRST')
    return false
  }
  w.maps = addMap(w.maps, map, w.dugMaps)
  questUi.showToast(`TREASURE MAP (${from.toUpperCase()}): DIG INSIDE THE GOLD CIRCLE ON YOUR MAP`)
  return true
}

function stepTreasure(game, now) {
  const w = game.world
  const p = game.player.position
  const near = nearestMap(w.maps, p.x, p.z)
  if (!near) return null
  if (near.distance < 10 && now > (w.sparkleAt ?? 0)) {
    w.sparkleAt = now + 0.55
    burst(particleSystem, { x: near.map.x, y: fxY(game, heightAt(near.map.x, near.map.z) + 0.3), z: near.map.z }, 0xffd15c, 5, 1.6, 0.4)
  }
  const chestNear = game.chests.some((c) => !c.userData.opened && Math.hypot(c.position.x - p.x, c.position.z - p.z) < CHEST_INTERACT_RANGE)
  if (input.wasChestPressed() && !chestNear && !w.jump.air && !game.player.hidden && game.player.hp > 0) {
    const map = w.maps.find((m) => Math.hypot(m.hintX - p.x, m.hintZ - p.z) < m.hintRadius + 6)
    if (map) digTreasure(game, map)
  }
  return near
}

function digTreasure(game, map) {
  const w = game.world
  const p = game.player.position
  const result = digAt(map, p.x, p.z)
  burst(particleSystem, { x: p.x, y: 0.3, z: p.z }, 0x8a6a4a, 18, 3)
  if (!result.found) {
    sfx.play('hit', { x: p.x, z: p.z })
    questUi.showToast(`NOTHING HERE...  ${HEAT_TEXT[result.heat]}`)
    return
  }
  w.maps = w.maps.filter((m) => m !== map)
  w.dugMaps.push(map.id)
  const before = game.chests.length
  trySpawnChest(game, { at: { x: map.x, z: map.z }, cost: 0 })
  if (game.chests.length > before) game.chests[game.chests.length - 1].position.y = heightAt(map.x, map.z)
  game.inventory = addCrystals(game.inventory, map.reward)
  setJournal(game, noteTreasure(w.journal))
  spawnShockwave(shockwavePool, map.x, map.z, 4, 0xffd15c)
  burst(particleSystem, { x: map.x, y: fxY(game, heightAt(map.x, map.z) + 0.6), z: map.z }, 0xffd15c, 50, 5)
  shardBurst(particleSystem, { x: map.x, y: fxY(game, heightAt(map.x, map.z) + 0.6), z: map.z }, 0x8a6a4a, 14, 3)
  sfx.play('chestOpen', { x: map.x, z: map.z })
  questUi.showToast(`TREASURE!  +${map.reward} CRYSTALS AND A FREE CHEST (F)`)
}

// ---- sky-ring races ----
function stepRaces(game, now) {
  const w = game.world
  const p = game.player.position
  const out = stepRace(w.race, { x: p.x, y: w.groundY, z: p.z, now })
  w.race = out.state
  for (const e of out.events) {
    if (e.type === 'start') {
      questUi.showToast(`RACE: ${e.course.name.toUpperCase()}  ·  ${e.course.rings.length} RINGS  ·  JUMP OFF AND GLIDE!`)
      sfx.play('announcement')
      spawnShockwave(shockwavePool, p.x, p.z, 4, 0x7ae8ff)
    } else if (e.type === 'ring') {
      const course = raceCourses().find((c) => c.id === w.race.active?.id) ?? null
      const ring = course?.rings[e.index - 1]
      if (ring) burst(particleSystem, { x: ring.x, y: fxY(game, ring.y), z: ring.z }, 0xffd15c, 22, 4)
      sfx.play('crystal', { x: p.x, z: p.z })
    } else if (e.type === 'finish') {
      const note = noteRace(w.journal, e.course.id, e.time)
      setJournal(game, note.journal)
      const reward = raceReward(e.medal, note.first)
      game.inventory = addCrystals(game.inventory, reward)
      burst(particleSystem, { x: p.x, y: 1.2, z: p.z }, e.medal === 'gold' ? 0xffd15c : e.medal === 'silver' ? 0xdfe6f0 : 0xe0a070, 50, 5)
      sfx.play('waveCleared')
      questUi.showToast(`${e.medal.toUpperCase()}!  ${e.course.name.toUpperCase()} IN ${formatTime(e.time)}${note.best && !note.first ? '  ·  NEW BEST' : ''}  +${reward} CRYSTALS`)
    } else if (e.type === 'fail') {
      questUi.showToast(e.reason === 'time' ? `OUT OF TIME: ${e.course.name.toUpperCase()}  ·  TRY AGAIN FROM THE GATE` : 'RACE ABANDONED')
    }
  }
  w.fx.setRace(w.race.active)
}

// ---- roaming events ----
// A spot `min`..`max` from (x, z) on dry land, or null.
function spotAround(x, z, min, max, tries = 12) {
  for (let i = 0; i < tries; i++) {
    const a = Math.random() * Math.PI * 2
    const d = min + Math.random() * (max - min)
    const sx = x + Math.cos(a) * d
    const sz = z + Math.sin(a) * d
    if (Math.hypot(sx, sz) > WORLD_RADIUS - 12 || lakeAt(sx, sz, 0.3)) continue
    return { x: sx, z: sz }
  }
  return null
}

function startWildEvent(game, kind, now, danger) {
  const w = game.world
  const p = game.player.position
  const ev = { kind, startedAt: now, endsAt: now + EVENTS[kind].duration, danger }
  if (kind === 'horde') {
    ev.plan = hordePlan(Math.random, biomeAt(p.x, p.z), danger)
    ev.endsAt = now + ev.plan.timeLimit
    ev.rush = 0
    ev.nextRushAt = now + 1.5
    ev.meshes = []
    questUi.showToast('AMBUSH! THEY ARE CLOSING IN  ·  BEAT THEM ALL FOR A BOUNTY')
    sfx.play('announcement')
  } else if (kind === 'meteors') {
    ev.drops = meteorPlan(Math.random, p, 14).map((d) => ({ ...d, at: now + d.at, done: false }))
    ev.endsAt = ev.drops[ev.drops.length - 1].at + 5
    ev.shards = 0
    questUi.showToast('STARFALL! GRAB THE STAR SHARDS WHERE THEY LAND')
    sfx.play('announcement')
  } else if (kind === 'merchant') {
    const at = spotAround(p.x, p.z, 8, 13) ?? { x: p.x + 5, z: p.z }
    ev.name = merchantName(`${w.events.count}#${Math.floor(now)}`)
    ev.stock = merchantStock(`${w.events.count}#${Math.floor(now)}`, game.inventory, danger)
    ev.sold = []
    ev.npc = createNpc({ id: MERCHANT_ID, merchant: true, name: ev.name, role: 'Travelling merchant', color: 0xffc46b, x: at.x, z: at.z, villageId: null })
    scene.add(ev.npc.mesh)
    w.npcs.get(MERCHANT_ID) && disposeObject3D(w.npcs.get(MERCHANT_ID).mesh)
    w.npcs.set(MERCHANT_ID, ev.npc)
    burst(particleSystem, { x: at.x, y: fxY(game, heightAt(at.x, at.z) + 1), z: at.z }, 0xffc46b, 30, 3)
    questUi.showToast(`A TRAVELLING MERCHANT, ${ev.name.toUpperCase()}, HAS SET UP NEARBY  ·  E TO TRADE`)
  } else if (kind === 'wanderer') {
    ev.plan = wandererPlan(Math.random, danger)
    const at = spotAround(p.x, p.z, 28, 36) ?? spotAround(p.x, p.z, 16, 24)
    if (!at) return
    ev.mesh = spawnWildMonster(game, ev.plan.type, at, { boss: true, fights: ev.plan.fights, danger, hpScale: 1 + danger * 1.2 })
    questUi.showToast(`A WANDERING TITAN: ${ev.plan.name} ROAMS NEARBY!  ·  BOUNTY +${ev.plan.reward}`)
    sfx.play('bossSlam', at)
  }
  w.event = ev
}

function finishWildEvent(game, now, { seen = true } = {}) {
  const w = game.world
  if (seen) setJournal(game, noteEvent(w.journal))
  w.event = null
  w.events = endEvent(w.events, now)
}

const isDown = (game, mesh) => !game.monsters.includes(mesh) || mesh.userData.dying || mesh.userData.falling || mesh.userData.hp <= 0

function updateWildEvent(game, now) {
  const w = game.world
  const ev = w.event
  const p = game.player.position
  if (ev.kind === 'horde') {
    const alive = ev.meshes.filter((m) => !isDown(game, m)).length
    if (ev.rush === 1 && alive <= 1) ev.nextRushAt = Math.min(ev.nextRushAt, now + 1.5)
    if (ev.rush < ev.plan.waves.length && now >= ev.nextRushAt) {
      for (const type of ev.plan.waves[ev.rush]) {
        const at = spotAround(p.x, p.z, 12, 18)
        if (!at) continue
        const elite = Math.random() < ev.plan.eliteChance
        const mesh = spawnWildMonster(game, type, at, { danger: ev.danger, elite, hpScale: (1 + ev.danger * 1.4) * (elite ? 2.4 : 1) })
        mesh.userData.facing = Math.atan2(p.x - at.x, p.z - at.z)
        ev.meshes.push(mesh)
      }
      ev.rush += 1
      ev.nextRushAt = now + 16
      sfx.play('bossSlam', { x: p.x, z: p.z })
    }
    if (ev.rush >= ev.plan.waves.length && alive === 0) {
      game.inventory = addCrystals(game.inventory, ev.plan.reward)
      const at = spotAround(p.x, p.z, 3, 5) ?? { x: p.x + 3, z: p.z }
      const before = game.chests.length
      trySpawnChest(game, { at, cost: 0 })
      if (game.chests.length > before) game.chests[game.chests.length - 1].position.y = heightAt(at.x, at.z)
      burst(particleSystem, { x: p.x, y: 1.2, z: p.z }, 0xffd15c, 50, 5)
      sfx.play('waveCleared')
      questUi.showToast(`AMBUSH BEATEN!  +${ev.plan.reward} CRYSTALS AND A FREE CHEST`)
      finishWildEvent(game, now)
    } else if (now > ev.endsAt) {
      questUi.showToast('THE AMBUSHERS SCATTER... NO BOUNTY THIS TIME')
      finishWildEvent(game, now, { seen: false })
    }
  } else if (ev.kind === 'meteors') {
    for (const d of ev.drops) {
      if (d.done || now < d.at) continue
      d.done = true
      dropMeteor({ x: d.x, z: d.z }, { damage: 70, radius: 3.6 })
      w.shards.push({ x: d.x, z: d.z, appearAt: now + 0.75, until: now + 75, mesh: null, ground: 0 })
    }
    if (now > ev.endsAt) {
      questUi.showToast('THE STARFALL PASSES')
      finishWildEvent(game, now)
    }
  } else if (ev.kind === 'merchant') {
    const far = Math.hypot(ev.npc.mesh.position.x - p.x, ev.npc.mesh.position.z - p.z) > 220
    if ((now > ev.endsAt || far) && w.talkingTo !== MERCHANT_ID) {
      if (!far) burst(particleSystem, { x: ev.npc.mesh.position.x, y: fxY(game, ev.npc.mesh.position.y + 1), z: ev.npc.mesh.position.z }, 0xffc46b, 30, 3)
      disposeObject3D(ev.npc.mesh)
      w.npcs.delete(MERCHANT_ID)
      if (!far) questUi.showToast('THE MERCHANT PACKS UP AND MOVES ON')
      finishWildEvent(game, now, { seen: ev.sold.length > 0 })
    }
  } else if (ev.kind === 'wanderer') {
    const mesh = ev.mesh
    if (!mesh) return finishWildEvent(game, now, { seen: false })
    const down = mesh.userData.dying || mesh.userData.falling || mesh.userData.hp <= 0
    if (down) {
      game.inventory = addCrystals(game.inventory, ev.plan.reward)
      questUi.showToast(`TITAN FELLED: ${ev.plan.name}  ·  +${ev.plan.reward} CRYSTALS`)
      sfx.play('waveCleared')
      finishWildEvent(game, now)
    } else if (!game.monsters.includes(mesh)) {
      finishWildEvent(game, now, { seen: false })
    } else if (now > ev.endsAt && Math.hypot(mesh.position.x - p.x, mesh.position.z - p.z) > 70) {
      dropWorldMonster(game, mesh)
      questUi.showToast(`${ev.plan.name} WANDERS OFF INTO THE WILDS`)
      finishWildEvent(game, now, { seen: false })
    }
  }
}

function stepWildEvents(game, now) {
  const w = game.world
  const p = game.player.position
  w.events ??= createEventDirector(now)
  const safe = Math.hypot(p.x, p.z) < SANCTUM_RADIUS + 20 || Boolean(nearestVillage(p.x, p.z, VILLAGE_SAFE_RADIUS + 10))
  const danger = dangerAt(p.x, p.z)
  const out = stepEventDirector(w.events, { now, safe, busy: Boolean(w.race.active) || Boolean(lakeAt(p.x, p.z, 0.3)) || game.player.hp <= 0, danger })
  w.events = out.state
  if (out.start) startWildEvent(game, out.start, now, danger)
  if (w.event) updateWildEvent(game, now)
  else if (w.events.active) w.events = endEvent(w.events, now) // an event that never got going (no room for it)
  // Star shards: they twinkle where the meteors fell until you pick them up (or a while passes).
  w.shards = w.shards.filter((sh) => {
    if (!sh.mesh) {
      if (now < sh.appearAt) return true
      sh.ground = heightAt(sh.x, sh.z)
      sh.mesh = w.fx.addShard(sh.x, sh.ground + 0.8, sh.z)
    }
    w.fx.animateShard(sh.mesh, now, sh.ground)
    const take = Math.hypot(sh.x - p.x, sh.z - p.z) < 2 && Math.abs(w.groundY - sh.ground) < 3 && game.player.hp > 0
    if (!take && now < sh.until) return true
    w.fx.removeShard(sh.mesh)
    if (take) {
      game.inventory = addCrystals(game.inventory, STAR_SHARD_VALUE)
      if (w.event?.kind === 'meteors') w.event.shards += 1
      burst(particleSystem, { x: sh.x, y: fxY(game, sh.ground + 0.8), z: sh.z }, 0xfff1a8, 18, 3)
      sfx.play('crystal', { x: sh.x, z: sh.z })
    }
    return false
  })
}

// ---- the travelling merchant's shop (the villager dialogue panel) ----
function merchantDialog(game) {
  const ev = game.world.event
  const goods = ev.stock.filter((g) => !ev.sold.includes(g.id))
  return {
    npc: ev.npc.def,
    village: { name: 'the open road' },
    mode: 'shop',
    text: goods.length
      ? `Wares for the wandering soul! Gear, maps, tonics... You have ${game.inventory.crystals} crystals to spend.`
      : 'Sold out! You have a good eye, traveller. Safe roads.',
    buttons: [...goods.map((g) => ({ id: `buy:${g.id}`, label: `${g.label} · ${g.price}` })), { id: 'close', label: 'Farewell' }],
  }
}

function handleMerchantButton(game, id) {
  const w = game.world
  const ev = w.event
  if (!id.startsWith('buy:') || ev?.kind !== 'merchant') return questUi.close()
  const good = ev.stock.find((g) => `buy:${g.id}` === id)
  if (!good || ev.sold.includes(good.id)) return
  if (game.inventory.crystals < good.price) {
    questUi.showToast(`NOT ENOUGH CRYSTALS (${good.price} NEEDED)`)
    return
  }
  if (good.kind === 'map' && w.maps.length >= MAX_MAPS) {
    questUi.showToast('YOUR MAP CASE IS FULL: DIG ONE UP FIRST')
    return
  }
  game.inventory = spendCrystals(game.inventory, good.price).inventory
  ev.sold.push(good.id)
  sfx.play('chestOpen', { x: ev.npc.mesh.position.x, z: ev.npc.mesh.position.z })
  if (good.kind === 'map') grantTreasureMap(game, `merchant#${w.events.count}#${Math.floor(ev.startedAt)}`, game.player.position, ev.name)
  else if (good.kind === 'boon') {
    w.shrines = grantBoon(w.shrines, good.itemId, timer.getElapsed())
    questUi.showToast(`${BOONS[good.itemId].name.toUpperCase()}: ${BOONS[good.itemId].blurb.toUpperCase()}`)
  } else if (good.kind === 'heal') {
    game.player.hp = game.player.maxHp
    questUi.showToast('DELICIOUS. FULLY HEALED')
  } else {
    giveWildsLoot(game, { kind: good.kind, id: good.itemId })
    if (swapPanel.isOpen()) return
  }
  questUi.update(merchantDialog(game))
}

// ---- the status chips under the score: race clock, event, treasure heat, boons ----
function updateWildsStatus(game, now, treasure) {
  const w = game.world
  const chips = []
  const race = w.race.active
  if (race) {
    const course = raceCourses().find((c) => c.id === race.id)
    chips.push(['#7ae8ff', `<b>RACE</b> ${course.name} · RING ${race.next + 1}/${course.rings.length} · ${formatTime(now - race.startedAt)} / ${formatTime(course.limit)}`])
  }
  const ev = w.event
  if (ev?.kind === 'horde') {
    const left = ev.meshes.filter((m) => !isDown(game, m)).length + (ev.rush < ev.plan.waves.length ? ev.plan.waves[ev.rush].length : 0)
    chips.push(['#ff6b6b', `<b>AMBUSH</b> ${left} left · ${Math.max(0, Math.ceil(ev.endsAt - now))}s`])
  } else if (ev?.kind === 'meteors') chips.push(['#ffb454', `<b>STARFALL</b> ${ev.shards} star shard${ev.shards === 1 ? '' : 's'}`])
  else if (ev?.kind === 'merchant') chips.push(['#ffc46b', `<b>MERCHANT</b> ${ev.name} · ${Math.max(0, Math.ceil(ev.endsAt - now))}s`])
  else if (ev?.kind === 'wanderer' && ev.mesh) chips.push(['#ffd15c', `<b>TITAN</b> ${ev.plan.name} · ${Math.round(Math.hypot(ev.mesh.position.x - game.player.position.x, ev.mesh.position.z - game.player.position.z))}m`])
  if (treasure) {
    const m = treasure.map
    const inCircle = Math.hypot(m.hintX - game.player.position.x, m.hintZ - game.player.position.z) < m.hintRadius + 6
    chips.push(['#ffd15c', inCircle ? `<b>TREASURE</b> ${digAt(m, game.player.position.x, game.player.position.z).heat === 'here' ? HEAT_TEXT.here : `${HEAT_TEXT[digAt(m, game.player.position.x, game.player.position.z).heat]} · F digs`}` : `<b>MAP</b> ${w.maps.length} treasure map${w.maps.length === 1 ? '' : 's'} · gold circle on the minimap`])
  }
  for (const b of activeBoons(w.shrines, now)) chips.push([hexColor(BOONS[b.id].color), `<b>${BOONS[b.id].name}</b> ${Math.ceil(b.left)}s`])
  const html = chips.map(([c, text]) => `<div class="ws-chip" style="--c:${c}">${text}</div>`).join('')
  if (html === wildsStatusKey) return
  wildsStatusKey = html
  if (wildsStatus) wildsStatus.innerHTML = html
}

function stepActivities(game, now) {
  const w = game.world
  if (!w.fx) return
  if (w.lootQueue.length && !swapPanel.isOpen()) giveWildsLoot(game, w.lootQueue.shift())
  stepLanterns(game)
  stepShrines(game, now)
  const treasure = stepTreasure(game, now)
  stepRaces(game, now)
  stepWildEvents(game, now)
  w.fx.update(now, game.player.position)
  updateWildsStatus(game, now, treasure)
  flushJournal(game, false, now)
}

// Minimap marks for the activities: shrines, race gates, nearby unlit lanterns, treasure circles, the merchant,
// a roaming titan, and the landmark a quest sends you to.
function drawActivityMarks(ctx, game, at, onMap, size, now) {
  const w = game.world
  if (!w) return
  const p0 = game.player.position
  for (const s of wayshrines()) {
    const [x, y] = at(s.x, s.z)
    if (!onMap([x, y])) continue
    ctx.globalAlpha = shrineCharge(w.shrines, s.id, now) >= 1 ? 1 : 0.35
    ctx.fillStyle = hexColor(BOONS[s.boon].color)
    ctx.strokeStyle = '#241b3a'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(x, y, 3.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  for (const c of raceCourses()) {
    const [x, y] = at(c.start.x, c.start.z)
    if (!onMap([x, y])) continue
    ctx.strokeStyle = '#7ae8ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 4.5, 0, Math.PI * 2)
    ctx.stroke()
  }
  if (w.race.active) {
    const course = raceCourses().find((c) => c.id === w.race.active.id)
    const ring = course.rings[w.race.active.next]
    const [x, y] = at(ring.x, ring.z)
    ctx.fillStyle = '#ffd15c'
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  // Unlit lanterns only show once you are fairly close: they are for finding, not for a checklist.
  ctx.fillStyle = '#ffb35c'
  for (const l of lanternsNear(p0.x, p0.z, 55)) {
    if (w.journal.lanterns.includes(l.id)) continue
    const [x, y] = at(l.x, l.z)
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
  }
  ctx.setLineDash([4, 3])
  for (const m of w.maps) {
    const [x, y] = at(m.hintX, m.hintZ)
    const r = m.hintRadius * (size / (MINIMAP_VIEW * 2))
    if (!onMap([x, y], r)) {
      drawMinimapPointer(ctx, size, Math.atan2(m.hintZ - p0.z, m.hintX - p0.x), '#ffd15c')
      continue
    }
    ctx.strokeStyle = '#ffd15c'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])
  const ev = w.event
  const target = ev?.kind === 'merchant' ? { x: ev.npc.mesh.position.x, z: ev.npc.mesh.position.z, color: '#ffc46b' } : ev?.kind === 'wanderer' && ev.mesh ? { x: ev.mesh.position.x, z: ev.mesh.position.z, color: '#ffd15c' } : null
  if (target) {
    const [x, y] = at(target.x, target.z)
    if (!onMap([x, y])) drawMinimapPointer(ctx, size, Math.atan2(target.z - p0.z, target.x - p0.x), target.color)
    else {
      ctx.fillStyle = target.color
      ctx.strokeStyle = '#241b3a'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }
  // A landmark a quest wants you to find: a gold ring, or an arrow on the rim.
  for (const q of w.quests.active) {
    if (q.type !== 'discover' || q.status !== 'active') continue
    const l = landmarkById(q.landmarkId)
    if (!l) continue
    const [x, y] = at(l.x, l.z)
    if (!onMap([x, y], 12)) {
      drawMinimapPointer(ctx, size, Math.atan2(l.z - p0.z, l.x - p0.x), '#ffd15c')
      continue
    }
    ctx.strokeStyle = '#ffd15c'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(x, y, 9, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function stepWorld(game, now, dt = 0) {
  const w = game.world
  if (!w.starsShown) {
    w.starsShown = true
    game.arena.world.setSkystarsCaught(w.starsCaught)
  }
  const p = game.player.position
  const { load, unload } = diffChunks(new Set(w.chunks.keys()), p.x, p.z)
  for (const key of unload) unloadWorldChunk(game, key)
  for (const { cx, cz } of load) loadWorldChunk(game, cx, cz, now)
  if (load.length || unload.length) {
    game.arena.world.setProps([...w.chunks.values()].flatMap((c) => c.content.props))
    game.arena.world.setGrass([...w.chunks.values()].map((c) => c.content))
  }

  // Anything left far behind is let go, so a long trek never piles up monsters.
  for (const mesh of [...game.monsters]) {
    if (mesh.userData.dying || mesh.userData.falling || mesh.userData.spawning || mesh.userData.isBoss) continue
    if (Math.hypot(mesh.position.x - p.x, mesh.position.z - p.z) > UNLOAD_RADIUS + 30) dropWorldMonster(game, mesh)
  }

  scene.background?.copy?.(game.arena.fog.color)

  // The ground under the player (the effect layers and the camera ride on it).
  w.groundY = w.jump.air ? w.jump.alt : heightAt(p.x, p.z)
  w.camGround += (w.groundY - w.camGround) * (dt > 0 ? 1 - Math.exp(-(w.jump.air ? 12 : 5) * dt) : 1) // keeps up with a glide down a hill

  // Villagers: they amble, look at you, wear a marker for their quest state, and E talks to the nearest.
  let nearest = null
  let nearestDistance = Infinity
  for (const npc of w.npcs.values()) {
    const d = dt > 0 ? updateNpc(npc, dt, now, p) : Math.hypot(npc.mesh.position.x - p.x, npc.mesh.position.z - p.z)
    setNpcMarker(npc, npc.def.merchant ? 'offer' : npcMarker(w.quests, npc.def))
    if (d < nearestDistance) {
      nearest = npc
      nearestDistance = d
    }
  }
  const canTalk = nearest && nearestDistance < TALK_RANGE && !game.player.hidden && game.player.hp > 0 && !game.cutscene
  questUi.setPrompt(canTalk && !lastHidePrompt ? `${input.touchMode ? 'Tap TALK' : 'E'}  to talk to ${nearest.def.name}` : null)
  if (canTalk && !lastHidePrompt && dt > 0 && input.wasHidePressed()) openTalk(game, nearest)
  questUi.setTracker(w.quests)

  // The sanctum mends you.
  const inSanctum = Math.hypot(p.x, p.z) < SANCTUM_RADIUS - 6
  if (inSanctum !== w.wasInSanctum) {
    w.wasInSanctum = inSanctum
    document.body.classList.toggle('in-sanctum', inSanctum)
  }
  if (inSanctum && dt > 0 && game.player.hp > 0) game.player.hp = Math.min(game.player.maxHp, game.player.hp + 9 * dt)

  // The Sanctum and every village are save points: step in and your progress is saved; fall and you get up here.
  const saveSpot = saveSpotAt(p.x, p.z, villages())
  if (dt > 0 && game.player.hp > 0 && shouldSave(w.checkpoint, saveSpot)) {
    w.checkpoint = saveSpot
    saveCheckpoint(saveSpot)
    questUi.showToast(`PROGRESS SAVED  ·  ${saveSpot.name.toUpperCase()}`)
  }

  // Walking into a new biome names it.
  const biome = biomeAt(p.x, p.z)
  if (biome !== w.biome) {
    w.biome = biome
    w.bannerUntil = now + 3.2
    worldQuestEvent(game, { type: 'enterBiome', biome })
    if (biome !== 'sanctum' && dt > 0) {
      const note = noteBiome(w.journal, biome)
      if (note.first) setJournal(game, note.journal)
    }
    if (biomeBanner) {
      biomeBanner.textContent = BIOMES[biome].name
      biomeBanner.style.setProperty('--biome-glow', `#${BIOMES[biome].glow.toString(16).padStart(6, '0')}`)
    }
  }
  // Reaching a landmark names it (the first time this run it counts as a discovery).
  const lm = nearestLandmark(p.x, p.z)?.landmark ?? null
  if (lm?.id !== w.landmark?.id) {
    w.landmark = lm
    if (lm && !w.discovered.has(lm.id)) {
      w.discovered.add(lm.id)
      // A first-ever discovery pays more; every landmark found this run hides a treasure map.
      const note = noteLandmark(w.journal, lm.id)
      const reward = note.first ? DISCOVER_REWARD_FIRST : DISCOVER_REWARD
      game.inventory = addCrystals(game.inventory, reward)
      questUi.showToast(`${note.first ? 'NEW DISCOVERY' : 'DISCOVERED'}: ${lm.name.toUpperCase()}  ·  ${w.discovered.size}/${landmarks().length}  +${reward} CRYSTALS`)
      sfx.play('chestOpen', { x: lm.x, z: lm.z })
      if (dt > 0) setJournal(game, note.journal)
      grantTreasureMap(game, lm.id, lm, lm.name)
    }
    // Arriving at a landmark (every time) is what a 'Seek ...' quest waits for.
    if (lm) worldQuestEvent(game, { type: 'discover', landmarkId: lm.id, kind: lm.kind, biome: lm.biome })
  }
  // Thunder follows a lightning strike over the storm biomes.
  const strike = game.arena.world.lastStrike
  if (strike && strike.time !== w.lastThunder) {
    w.lastThunder = strike.time
    sfx.play('bossSlam', { x: strike.x, z: strike.z })
  }
  biomeBanner?.classList.toggle('show', now < w.bannerUntil)
  if (dt > 0) stepSkystars(game, now)
  if (dt > 0) stepActivities(game, now)
  if (dt > 0) drawMinimap(game, now)
}

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
  mesh.userData.onHit = stats.onHit
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
    // The new enemies toughen up with the player's own power (damage, attack speed skills and power-ups), so a maxed build
    // doesn't just melt them.
    if (CRAZY_TYPE_IDS.includes(type)) {
      const fx = activeFx(game.inventory.equipped)
      mesh.userData.hp = mesh.userData.maxHp = Math.round(mesh.userData.maxHp * Math.min(1.15, Math.max(1, fx.damage / Math.max(0.55, fx.cooldown))))
    }
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
  mesh.userData.bossFights = fights
  mesh.userData.speedScale = bossSpeedScale(boss.stats.speed, fights)
  mesh.userData.immunityThresholds = immunityThresholdsFor(fights)
  upgradeBossSpecials(mesh.userData, bossSpecialsFor(boss.stats.specials, fights + BOSS_HEAD_START), bossCooldownScale(fights + BOSS_HEAD_START))
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

// A boss's immunity phase: a glowing bubble, a burst of minions, and no damage until they are beaten or the timer runs out.
function startImmunity(game, mesh, phase) {
  const ud = mesh.userData
  ud.immunityDone = phase + 1
  ud.hp = Math.max(ud.hp, Math.ceil(ud.maxHp * (ud.immunityThresholds ?? BOSS_IMMUNITY_THRESHOLDS)[phase])) // the blow that crossed the line doesn't carry on through
  ud.immune = true
  ud.immuneLeft = BOSS_IMMUNITY_SECONDS
  ud.immuneGrace = 1.5
  if (!ud.bubble) {
    const r = Math.max(ud.radius * 1.6, 2.2)
    ud.bubble = new THREE.Mesh(
      new THREE.SphereGeometry(r, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    )
    ud.bubble.position.y = r * 0.7
    mesh.add(ud.bubble)
  }
  ud.bubble.visible = true
  pendingSummons.push({ bossMesh: mesh, count: BOSS_IMMUNITY_MINIONS, maxMinions: BOSS_IMMUNITY_MINIONS + 4 })
  spawnShockwave(shockwavePool, mesh.position.x, mesh.position.z, 8, 0x7fe8ff)
  burst(particleSystem, { x: mesh.position.x, y: 1.5, z: mesh.position.z }, 0x7fe8ff, 40, 5)
  sfx.play('bossSlam', { x: mesh.position.x, z: mesh.position.z })
  questUi.showToast(`${bossById(ud.type)?.name ?? 'BOSS'} IS SHIELDED! BEAT ITS MINIONS`)
}
function stepImmunity(game, mesh, dt, now) {
  const ud = mesh.userData
  ud.immuneLeft -= dt
  ud.immuneGrace -= dt
  if (ud.bubble) {
    ud.bubble.material.opacity = 0.22 + Math.sin(now * 6) * 0.08
    ud.bubble.scale.setScalar(1 + Math.sin(now * 4) * 0.03)
  }
  const minionsAlive = (ud.minions ?? []).some((m) => game.monsters.includes(m) && !m.userData.dying)
  if (ud.immuneLeft <= 0 || (ud.immuneGrace <= 0 && !minionsAlive)) {
    ud.immune = false
    if (ud.bubble) ud.bubble.visible = false
    spawnShockwave(shockwavePool, mesh.position.x, mesh.position.z, 10, 0xffffff)
    burst(particleSystem, { x: mesh.position.x, y: 1.5, z: mesh.position.z }, 0xffffff, 40, 5)
    sfx.play('bossSlam', { x: mesh.position.x, z: mesh.position.z })
    questUi.showToast('SHIELD DOWN! HIT IT NOW')
  }
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

// The urchin prince's beam: a red warning line while it charges, then a bright column that hurts anything on the
// line (a diver or a floater alike). Short-lived meshes; `kind` is 'warn' or 'beam'.
const bossBeams = []
// A paparazzo's flash is white-gold instead of the urchin's violet.
const BEAM_PALETTES = { boss: [0xffffff, 0xdbb8ff, 0x8a3df0], flash: [0xffffff, 0xfff6c8, 0xffd36e] }
function addBossBeam(event, kind, life, palette = 'boss') {
  const [coreColor, midColor, outerColor] = BEAM_PALETTES[palette]
  const mid = waterRoom() ? -0.7 : 0.9 + (game?.world?.groundY ?? 0) // in water: between the surface and a diver's depth; on land: chest height
  const half = event.length / 2
  const mat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  const group = new THREE.Group()
  const widths = kind === 'warn' ? [[0.12, 0xff3355, 0.7]] : [[Math.min(0.45, event.width * 0.6), coreColor, 0.95], [event.width, midColor, 0.55], [event.width * 1.8, outerColor, 0.2]]
  const parts = widths.map(([w, color, opacity]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(w, w, event.length, 12), mat(color, opacity))
    group.add(m)
    return { m, opacity }
  })
  group.position.set(event.x + Math.sin(event.aim) * half, mid, event.z + Math.cos(event.aim) * half)
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(event.aim), 0, Math.cos(event.aim)))
  scene.add(group)
  bossBeams.push({ group, parts, kind, life, age: 0 })
}
function updateBossBeams(dt) {
  for (let i = bossBeams.length - 1; i >= 0; i--) {
    const b = bossBeams[i]
    b.age += dt
    const t = b.age / b.life
    for (const { m, opacity } of b.parts) m.material.opacity = opacity * (b.kind === 'warn' ? 0.5 + 0.5 * Math.sin(b.age * 24) : Math.max(0, 1 - t))
    if (b.kind === 'beam') b.group.scale.set(1 + t * 0.4, 1, 1 + t * 0.4)
    if (t >= 1) {
      disposeObject3D(b.group)
      bossBeams.splice(i, 1)
    }
  }
}


// ---- signature attacks: every boss (and each new enemy) has one move nobody else has (logic/signatures.js) ----
// A tiny scheduler: a pattern is a handful of timed jobs (rings staggered, a spiral's volleys, blast zones going off).
const sigJobs = []
const addSigJob = (delay, fn) => sigJobs.push({ t: delay, fn })
function updateSigJobs(dt, now) {
  for (let i = sigJobs.length - 1; i >= 0; i--) {
    const job = sigJobs[i]
    job.t -= dt
    if (job.t <= 0) {
      sigJobs.splice(i, 1)
      job.fn(now)
    }
  }
}
// What a new enemy's hit does besides damage (monster stats' `onHit`): poison, slow, weaken, stun, or steal crystals.
const STATUS_COLORS = { poison: 0x8dff4a, slow: 0x9fe8ff, weaken: 0xff9ad0, stun: 0xfff1a8, drain: 0xffd15c }
function applyOnHit(game, onHit, now) {
  if (!onHit) return
  const { player } = game
  if (onHit.status === 'drain') {
    const taken = Math.min(game.inventory.crystals, onHit.amount ?? 4)
    if (taken > 0) {
      game.inventory = { ...game.inventory, crystals: game.inventory.crystals - taken }
      burst(particleSystem, { x: player.position.x, y: 1.2, z: player.position.z }, STATUS_COLORS.drain, 14, 3)
      questUi.showToast(`-${taken} CRYSTALS STOLEN`)
    }
    return
  }
  player.applyStatus(onHit.status, now, onHit)
  burst(particleSystem, { x: player.position.x, y: 1.2, z: player.position.z }, STATUS_COLORS[onHit.status] ?? 0xffffff, 12, 2.5)
}
function sigHurt(game) {
  triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
  triggerDamageFlash(hud)
  sfx.play('playerHurt', { x: game.player.position.x, z: game.player.position.z })
  input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
  game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
}

function runSignature(game, bossMesh, event) {
  const a = event.attack
  const { player } = game
  const color = a.color
  const size = a.size ?? 1
  const alive = () => game.monsters.includes(bossMesh) && !bossMesh.userData.dying && !bossMesh.userData.falling
  const hurt = (dmg, now) => {
    if (!player.hidden && player.damagePlayer(dmg, now, event.trueFraction ?? 0)) {
      sigHurt(game)
      applyOnHit(game, event.onHit, now)
    }
  }
  const orb = (x, z, vx, vz) => fireProjectile(projectilePool, { x, z, vx, vz, damage: event.damage, color, size })
  const here = () => ({ x: bossMesh.position.x, z: bossMesh.position.z })
  const target = { x: player.position.x, z: player.position.z }
  const zone = (x, z, radius, delay) => {
    spawnShockwave(shockwavePool, x, z, radius, 0xffd15c) // the warning ring
    addSigJob(delay, (now) => {
      spawnShockwave(shockwavePool, x, z, radius, color)
      warp.add('ripple', x, z, radius * 1.1, 0.5)
      burst(particleSystem, { x, y: 0.4, z }, color, 28, 4.5)
      sfx.play('bossSlam', { x, z })
      if (Math.hypot(player.position.x - x, player.position.z - z) <= radius) hurt(event.damage, now)
    })
  }
  if (a.kind === 'ring') {
    for (let r = 0; r < a.rings; r++) {
      addSigJob(r * a.stagger, () => {
        if (!alive()) return
        const p = here()
        for (const ang of ringAngles(a.count, event.aim + r * a.twist)) orb(p.x, p.z, Math.sin(ang) * a.speed, Math.cos(ang) * a.speed)
        burst(particleSystem, { x: p.x, y: 1, z: p.z }, color, 12, 3)
      })
    }
  } else if (a.kind === 'spiral') {
    const steps = Math.floor(a.duration / a.rate)
    for (let s = 0; s < steps; s++) {
      addSigJob(s * a.rate, () => {
        if (!alive()) return
        const p = here()
        for (let k = 0; k < a.arms; k++) {
          const ang = event.aim + (k / a.arms) * Math.PI * 2 + a.turn * s * a.rate
          orb(p.x, p.z, Math.sin(ang) * a.speed, Math.cos(ang) * a.speed)
        }
      })
    }
  } else if (a.kind === 'rain') {
    if (a.mode === 'chase') {
      for (let i = 0; i < a.count; i++) addSigJob(i * a.every, () => alive() && zone(player.position.x, player.position.z, a.radius, a.delay))
    } else {
      for (const z of rainZones(a.mode, a.count, target)) zone(z.x, z.z, a.radius, a.delay)
    }
  } else if (a.kind === 'wall') {
    const p = here()
    const gapAt = 0.15 + Math.random() * 0.7
    for (const aim of a.sideways ? [event.aim + Math.PI / 2, event.aim - Math.PI / 2] : [event.aim]) {
      for (const o of wallOrbs({ x: p.x, z: p.z, aim, count: a.count, spacing: a.spacing, speed: a.speed, gap: a.gap, gapAt })) orb(o.x, o.z, o.vx, o.vz)
    }
  } else if (a.kind === 'spokes') {
    const p = here()
    const volley = (offset, startDelay) => {
      const angles = ringAngles(a.count, event.aim + offset)
      addSigJob(startDelay, () => {
        for (const aim of angles) addBossBeam({ x: p.x, z: p.z, aim, length: a.length, width: a.width }, 'warn', a.delay)
        sfx.play('podIn', { x: p.x, z: p.z })
      })
      addSigJob(startDelay + a.delay, (now) => {
        for (const aim of angles) {
          addBossBeam({ x: p.x, z: p.z, aim, length: a.length, width: a.width }, 'beam', 0.6)
          if (onBeam({ x: player.position.x, z: player.position.z }, { x: p.x, z: p.z, aim, length: a.length, width: a.width })) hurt(event.damage, now)
        }
        sfx.play('bossSlam', { x: p.x, z: p.z })
        triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      })
    }
    volley(0, 0)
    if (a.second) volley(a.second, a.delay + 0.3)
  } else if (a.kind === 'shotgun') {
    const p = here()
    for (const base of a.mirror ? [event.aim, event.aim + Math.PI] : [event.aim]) {
      for (const { vx, vz } of fanVelocities(base, a.count, a.spread, a.speed)) orb(p.x, p.z, vx, vz)
    }
    burst(particleSystem, { x: p.x, y: 1, z: p.z }, color, 14, 3)
  } else if (a.kind === 'puddles') {
    const p = here()
    puddleTargets(a.layout, a.count, p, target).forEach((t, i) => {
      addSigJob(i * 0.12, () => alive() && lobPoison(poisonPool, { x: p.x, z: p.z, tx: t.x, tz: t.z, flight: 0.9, radius: a.radius, life: a.life, tick: 0.6, damage: event.damage }))
    })
  } else if (a.kind === 'nova') {
    const p = here()
    a.radii.forEach((r) => spawnShockwave(shockwavePool, p.x, p.z, r, 0xffffff)) // where the rings will pass
    a.radii.forEach((r, i) => {
      addSigJob(0.7 + i * a.gap, (now) => {
        spawnShockwave(shockwavePool, p.x, p.z, r, color)
        warp.add('ripple', p.x, p.z, r, 0.5)
        sfx.play('bossSlam', { x: p.x, z: p.z })
        if (inRingBand({ x: player.position.x, z: player.position.z }, p.x, p.z, r)) hurt(event.damage, now)
      })
    })
  } else if (a.kind === 'enrage') {
    bossMesh.userData.speedScale *= a.speed
    burst(particleSystem, { x: bossMesh.position.x, y: 1.2, z: bossMesh.position.z }, color, 30, 4)
    addSigJob(a.duration, () => {
      bossMesh.userData.speedScale /= a.speed
    })
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
  const playerDistance = (x, z) => (player.diving && !bossMesh.userData.deep && !bossMesh.userData.reachAll ? Infinity : Math.hypot(player.position.x - x, player.position.z - z))
  for (const event of events) {
    if (event.type === 'slam') {
      if (event.geyser) {
        // A geyser erupts from under the marked spot: a column of spray.
        burst(particleSystem, { x: event.x, y: 0.4 - fxDepthOffset(), z: event.z }, 0xbff6ff, 40, 6, 2.2)
        burst(particleSystem, { x: event.x, y: 1.5 - fxDepthOffset(), z: event.z }, 0xffffff, 24, 3, 3)
      }
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, event.geyser ? 0x6ee7ff : 0xff3355)
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
    } else if (event.type === 'warn') {
      // A ring on the water where something is about to erupt from below.
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0xffd15c)
      sfx.play('podIn', { x: event.x, z: event.z })
    } else if (event.type === 'beamWarn') {
      addBossBeam(event, 'warn', event.duration)
      sfx.play('podIn', { x: event.x, z: event.z })
    } else if (event.type === 'beam') {
      addBossBeam(event, 'beam', 0.7)
      warp.add('ripple', event.x, event.z, 8, 0.6)
      sfx.play('bossSlam', { x: event.x, z: event.z })
      input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
      // Distance from the player to the beam's line (it only goes forward from the boss).
      const px = player.position.x - event.x
      const pz = player.position.z - event.z
      const along = px * Math.sin(event.aim) + pz * Math.cos(event.aim)
      const across = Math.abs(px * Math.cos(event.aim) - pz * Math.sin(event.aim))
      if (along > 0 && along < event.length && across <= event.width + 0.6 && player.damagePlayer(event.damage, now)) hurtPlayer = true
      triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE * 1.5, SHAKE_DAMAGE_DURATION)
    } else if (event.type === 'snipe') {
      // The paparazzo's flash: hurts you on the line, and any monster standing in it too ("Photobomb").
      addBossBeam(event, 'beam', 0.45, 'flash')
      burst(particleSystem, { x: event.x, y: 1.2, z: event.z }, 0xfffbe6, 30, 5)
      sfx.play('bossSlam', { x: event.x, z: event.z })
      if (!player.hidden && playerDistance(event.x, event.z) < Infinity && beamHits(event, event.aim, event.length, event.width, player.position, 0.5) && player.damagePlayer(event.damage, now)) {
        hurtPlayer = true
        triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      }
      for (const other of game.monsters) {
        if (other === bossMesh || other.userData.dying || other.userData.spawning || other.userData.falling) continue
        if (!beamHits(event, event.aim, event.length, event.width, other.position, other.userData.radius)) continue
        damageMonster(other, event.damage, { fromPos: { x: event.x, z: event.z }, knockback: 2, obstacles: game.obstacles, particleSystem, cause: 'photobomb', hitstop: game.hitstop })
      }
    } else if (event.type === 'dig') {
      // A gopher digs in (or pops back up): a spray of deck splinters and dust.
      burst(particleSystem, { x: event.x, y: 0.3, z: event.z }, 0xc8a070, 28, 4, 1.5)
      sfx.play('podIn', { x: event.x, z: event.z })
    } else if (event.type === 'erupt') {
      // A gopher bursts up under its mark: a ring that hurts and a ring of golf balls.
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0xf3d6ae)
      warp.add('ripple', event.x, event.z, event.radius * 1.2, 0.6)
      burst(particleSystem, { x: event.x, y: 0.4, z: event.z }, 0xc8a070, 44, 6, 2.5)
      sfx.play('bossSlam', { x: event.x, z: event.z })
      if (!player.hidden && playerDistance(event.x, event.z) <= event.radius && player.damagePlayer(event.damage, now)) hurtPlayer = true
      const spread = (Math.PI * 2 * (event.balls - 1)) / event.balls
      for (const { vx, vz } of fanVelocities(Math.random() * Math.PI, event.balls, spread, 7)) {
        fireProjectile(projectilePool, { x: event.x, z: event.z, vx, vz, damage: Math.round(event.damage * 0.4), color: 0xffffff, size: 0.7 })
      }
    } else if (event.type === 'steal') {
      // The Bellhop Bandit swipes a share of your crystals into its sack and runs.
      const taken = stealAmount(game.inventory.crystals)
      game.inventory = { ...game.inventory, crystals: game.inventory.crystals - taken }
      bossMesh.userData.stolen = (bossMesh.userData.stolen ?? 0) + taken
      bossMesh.userData.setSack?.(bossMesh.userData.stolen)
      sfx.play('crystal', { x: event.x ?? bossMesh.position.x, z: event.z ?? bossMesh.position.z })
      showPopup(popupPool, { x: player.position.x, y: 1.6, z: player.position.z }, taken > 0 ? 'SWIPED!' : 'EMPTY POCKETS', taken > 0 ? `-${taken}` : '', POPUP_RING_OUT_COLOR)
      questUi.showToast(taken > 0 ? `THE BELLHOP BANDIT TOOK ${taken} CRYSTALS! CATCH IT!` : 'THE BELLHOP BANDIT FOUND NOTHING TO TAKE')
    } else if (event.type === 'escape') {
      // Got away: checks out with whatever is in its sack (main loop removes it).
      bossMesh.userData.escaped = true
      const pos = bossMesh.position
      burst(particleSystem, { x: pos.x, y: 1, z: pos.z }, 0xdccfff, 40, 5)
      shardBurst(particleSystem, { x: pos.x, y: 1, z: pos.z }, 0xc9a36a, 12, 4)
      sfx.play('podOut', { x: pos.x, z: pos.z })
      const lost = bossMesh.userData.stolen ?? 0
      questUi.showToast(lost > 0 ? `THE BELLHOP BANDIT CHECKED OUT WITH ${lost} CRYSTALS` : 'THE BELLHOP BANDIT CHECKED OUT')
    } else if (event.type === 'dive') {
      burst(particleSystem, { x: event.x, y: 0.2 - fxDepthOffset(), z: event.z }, 0xbff6ff, 36, 4.5)
      sfx.play('podIn', { x: event.x, z: event.z })
    } else if (event.type === 'breach') {
      // Bursts up out of the water under you: a ring that hurts (diving or not), and the urchin's spines fly.
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0x6ee7ff)
      warp.add('ripple', event.x, event.z, event.radius * 1.2, 0.7)
      burst(particleSystem, { x: event.x, y: 0.5 - fxDepthOffset(), z: event.z }, 0xffffff, 48, 6, 2.5)
      sfx.play('bossSlam', { x: event.x, z: event.z })
      if (Math.hypot(player.position.x - event.x, player.position.z - event.z) <= event.radius && player.damagePlayer(event.damage, now)) hurtPlayer = true
      triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      if (event.spines > 0) {
        const spread = Math.PI * 2 * (event.spines - 1) / event.spines
        for (const { vx, vz } of fanVelocities(0, event.spines, spread, 8)) {
          fireProjectile(projectilePool, { x: event.x, z: event.z, vx, vz, damage: Math.round(event.damage * 0.5), color: 0xdbb8ff, size: 1 })
        }
      }
    } else if (event.type === 'pull') {
      // The angler's light drags you across the water toward it.
      const dx = event.x - player.position.x
      const dz = event.z - player.position.z
      const d = Math.hypot(dx, dz)
      if (d > event.stopAt && d < event.range) {
        const step = Math.min(event.strength, d - event.stopAt)
        player.position.x += (dx / d) * step
        player.position.z += (dz / d) * step
        player.mesh.position.x = player.position.x
        player.mesh.position.z = player.position.z
        if (Math.random() < 0.4) burst(particleSystem, { x: player.position.x, y: 0.6 - fxDepthOffset(), z: player.position.z }, 0xfff1a8, 1, 1)
      }
    } else if (event.type === 'status') {
      applyOnHit(game, event.onHit, now)
    } else if (event.type === 'sigWarn') {
      burst(particleSystem, { x: event.x, y: 1.4, z: event.z }, event.attack.color, 16, 3)
      sfx.play('podIn', { x: event.x, z: event.z })
      if (bossMesh.userData.isBoss) questUi.showToast(`${event.attack.label}!`)
    } else if (event.type === 'signature') {
      runSignature(game, bossMesh, event)
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
  tutorialEvent('kill', 1, mesh.userData.type)
  if (mesh.userData.isBoss) tutorialEvent('bossKill')
  if (mesh.userData.lastHitAmbush) tutorialEvent('ambush')
  if (game.world) {
    worldQuestEvent(game, { type: 'kill', monster: mesh.userData.type, elite: Boolean(mesh.userData.elite), biome: biomeAt(position.x, position.z) })
    noteWildsKill(game, mesh.userData.type)
  }
  const trick = nameTrick({
    cause,
    inPool: isInPool(game.arena.pools, mesh.position.x, mesh.position.z),
    ambush: mesh.userData.lastHitAmbush,
    boss: mesh.userData.isBoss,
    whacked: mesh.userData.lastHitDazed === true && cause !== 'fall',
  })
  game.chainState = stepChain(game.chainState, now, trick.id)
  if (game.chainState.multiplier > 1) tutorialEvent('chain')
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
  // Dialogue noises: the speaker's own babble for each newly typed letter (the concierge is polite, bosses are weird).
  if (phase === 'talk') {
    const shown = visibleChars(line, lineElapsed)
    const before = cutscene.babbleLine === lineIndex ? cutscene.babbleShown : 0
    cutscene.babbleLine = lineIndex
    cutscene.babbleShown = shown
    if (shown > before) sfx.babble(newestBlip(line, before, shown, voiceFor(lineIndex === 0 ? 'concierge' : boss.id)))
  } else if (phase === 'title' && cutscene.babbleLine !== 'title') {
    cutscene.babbleLine = 'title'
    sfx.play('bossSlam') // the name slams on screen
  }
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
  game.waveState = { ...game.waveState, inWater: Boolean(level.water) } // water rooms only get the water bosses
  resetWater()
  if (!level.water) {
    game.player.mesh.position.y = 0
    for (const m of game.monsters) if (!m.userData.falling) m.position.y = 0
  }
  reskinContainers(game)
  return level
}

// Steps the hyperspace jump to the next place. Returns true while the world is frozen for it (the
// caller then just renders): the charge, the swap behind the white flash, and the camera's swoop down.
function runLevelTransition(game, deltaSeconds, elapsedSeconds) {
  const before = game.levelTransition
  const { state, frame, swapNow, arriveNow } = stepTransition(before, deltaSeconds)
  game.levelTransition = state
  transitionOverlay.draw(frame, deltaSeconds)
  const level = levelAt(state.levelIndex)
  if (before.t < TRANSITION.wait && state.t >= TRANSITION.wait) {
    sfx.play('hyperspace')
    triggerShake(game.shake, 0.3, 1.2)
  }
  if (swapNow) {
    changeLevel(game, state.levelIndex)
    attractAllCrystals(crystalSystem) // nothing left behind on the old deck
  }
  if (arriveNow) {
    const signs = level.props?.signTexts ?? level.signTexts ?? []
    transitionOverlay.arrive(level, signs.length ? `"${signs[Math.floor(Math.random() * signs.length)]}"` : '')
    sfx.play('arrive')
  }
  if (frame.done) {
    game.levelTransition = null
    transitionOverlay.draw(null, 0)
    return false
  }
  if (!frame.frozen) return false

  // Frozen: the camera rises through the charge and swoops back down onto the new place.
  const { player } = game
  const offset = player.hidden ? HIDDEN_CAMERA_OFFSET : CAMERA_OFFSET
  const lift = frame.phase === 'charge' ? 0 : frame.camLift
  cameraTarget.set(player.position.x + offset.x, offset.y + lift, player.position.z + offset.z + lift * 0.35)
  if (frame.phase === 'hold') camera.position.copy(cameraTarget) // hidden by the white: jump straight up there
  else camera.position.lerp(cameraTarget, 1 - Math.exp(-(frame.phase === 'charge' ? 2 : 9) * deltaSeconds))
  if (frame.phase === 'charge') camera.position.z -= deltaSeconds * 6 // a lurch forward into the jump
  const shakeOffset = updateShake(game.shake, deltaSeconds)
  camera.position.x += shakeOffset.x
  camera.position.y += shakeOffset.y
  camera.lookAt(player.position.x, 1, player.position.z)
  updateArena(game.arena, player.position, elapsedSeconds)
  updateParticles(particleSystem, deltaSeconds)
  return true
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
  sigJobs.length = 0
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
  target.world?.npcs.forEach((npc) => disposeObject3D(npc.mesh))
  if (target.world?.journalDirty) saveJournal(target.world.journal)
  journalUi?.close()
  wildsStatusKey = ''
  if (wildsStatus) wildsStatus.innerHTML = ''
  questUi?.reset()
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
// No waves at all: the sandbox, the tutorial and the free roam world.
const noWaves = () => freePlay() || Boolean(game?.world)

function tutorialEvent(type, amount, target) {
  if (!tutorial) return
  const result = advanceTutorial(tutorialState, { type, amount, target })
  tutorialState = result.state
  if (result.completed) sfx.play('waveCleared')
}

function startTutorial() {
  tutorial = true
  document.body.classList.add('tutorial')
  loadoutPanel.setOpen(false)
  tutorialPanel = createTutorialPanel({
    touch: touchDevice,
    onExit: () => window.location.reload(),
    onNext: () => tutorialEvent('next'),
    onSkip: () => {
      tutorialState = skipTutorialStep(tutorialState)
    },
  })
  tutorialPanel.setVisible(true)
}

// Live (not dying) monsters of `type` in the tutorial room.
function tutorialAlive(type) {
  return game.monsters.filter((m) => !m.userData.dying && (type == null || m.userData.type === type)).length
}

// Keeps at least `count` practice monsters of `type` around.
function tutorialKeep(type, count) {
  for (let n = tutorialAlive(type); n < count; n++) spawnMonster(game, type, { facePlayer: true })
}

// A softened boss for the tutorial: about 40% hp, one shield at half health, its own moves and signature.
function spawnTutorialBoss() {
  const mesh = spawnMonster(game, 'boss_blobbo', { hpScale: 0.4, facePlayer: true })
  mesh.userData.damageScale = bossDamageScale(0)
  mesh.userData.bossFights = 0
  mesh.userData.immunityThresholds = [0.5]
}

// Called every frame in tutorial mode: feeds movement / sprinting / hiding in, gives each step what
// it needs once (a weapon, an ability, a pet, a chest...), and keeps practice targets around.
function stepTutorial() {
  const p = game.player
  if (tutorialLastPos) {
    const moved = Math.hypot(p.position.x - tutorialLastPos.x, p.position.z - tutorialLastPos.z)
    tutorialEvent('move', moved)
    if (holdSprinting()) tutorialEvent('sprint', moved)
  }
  tutorialLastPos = { x: p.position.x, z: p.position.z }
  if (p.hidden) tutorialEvent('hide')
  let step = currentStep(tutorialState)
  // Shift / first person have no touch control: skip those steps on a phone.
  while (step?.desktopOnly && touchDevice) {
    tutorialState = skipTutorialStep(tutorialState)
    step = currentStep(tutorialState)
  }
  const id = step?.id
  const inv = game.inventory
  if (tutorialSetupStep !== tutorialState.step) {
    tutorialSetupStep = tutorialState.step
    if (id === 'weapon' && !inv.weapons.includes('sword')) receiveLoot(game, { kind: 'weapon', id: 'sword' })
    if (id === 'chain') tutorialKeep('blobbo', 3)
    if (id === 'hide') trySpawnPod(game)
    if (id === 'chest') trySpawnChest(game, { cost: 0 })
    if (id === 'ability' && !inv.abilities.includes('shockwave')) receiveLoot(game, { kind: 'ability', id: 'shockwave' })
    if (id === 'powerup') trySpawnPerkPickup(game)
    if (id === 'pet' && !game.pets.some((pet) => pet.def.id === 'ember')) receiveLoot(game, { kind: 'pet', id: 'ember' })
    if (id === 'mirror') spawnMonster(game, 'mirror', { facePlayer: true })
    if (id === 'bloater') spawnMonster(game, 'bloater', { facePlayer: true })
    if (id === 'boss') spawnTutorialBoss()
  }
  // Keep each step's targets around until it is done.
  if (id === 'kill' || id === 'crystals') tutorialKeep('blobbo', 1)
  if (id === 'chain' || id === 'pet') tutorialKeep('blobbo', 2)
  if (id === 'hide' || id === 'ambush') {
    tutorialKeep('blobbo', 1)
    if (!p.hidden && game.pods.length === 0) trySpawnPod(game)
  }
  if (id === 'powerup' && game.pickups.length === 0) trySpawnPerkPickup(game)
  if (id === 'mirror') tutorialKeep('mirror', 1)
  if (id === 'bloater') tutorialKeep('bloater', 1)
  if (id === 'boss' && !game.monsters.some((m) => m.userData.isBoss && !m.userData.dying)) spawnTutorialBoss()
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
      if (result.petAdded) game.pets.push(spawnPet(result.petAdded))
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
  tutorialEvent('loadout')
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
  getDragons: dragonState,
  setDragons: setDragonState,
  getRun: () => ({ sandbox, inRun: started && !sandbox, pets: game.inventory.pets, weapons: game.inventory.weapons, crystals: game.inventory.crystals, owned: game.inventory.powerups, equipped: game.inventory.equipped }),
  onBank: bankRunCrystals,
  onOpenChange: (open) => {
    if (!open) refreshDragons()
  },
})
const HUB_KEYS = { Digit6: 'skills', Numpad6: 'skills', Digit7: 'powerups', Numpad7: 'powerups', KeyJ: 'gunsmith', KeyN: 'dragons', Digit9: 'loadout', Numpad9: 'loadout' }
function canOpenHub() {
  return !swapPanel.isOpen() && !pauseMenu.isOpen() && !(started && game.player.hp <= 0) && !(started && !sandbox && loadoutPanel.isOpen()) && !(started && sandbox && sandboxPanel?.isOpen?.())
}
window.addEventListener('keydown', (event) => {
  if (event.repeat) return
  const page = HUB_KEYS[event.code]
  const jumpKey = event.code === 'KeyN' && started && game?.world && !hub.isOpen() // N shoots in the Wilds instead of opening the Dragon Den
  if (page && !jumpKey && (hub.isOpen() || canOpenHub())) {
    event.preventDefault()
    hub.toggle(page)
  } else if (event.code === 'Escape' && hub.isOpen()) {
    hub.close()
    event.hubClosed = true // so the pause menu's own Escape handler leaves it alone
  } else if (event.code === 'KeyT') bankRunCrystals()
})
document.getElementById('hub-open-btn')?.addEventListener('click', () => hub.open('loadout'))
// Graphics style (monster look), picked on the start card and remembered.
const graphicsBtn = document.getElementById('graphics-btn')
function showGraphicsStyle() {
  if (graphicsBtn) graphicsBtn.textContent = `Graphics: ${GRAPHICS_LABELS[getGraphicsStyle()]}`
}
graphicsBtn?.addEventListener('click', () => {
  if (started) return
  setGraphicsStyle(nextGraphicsStyle())
  showGraphicsStyle()
})
showGraphicsStyle()
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
// The Wilds journal (U on a keyboard); the button only shows in the Wilds.
const journalButton = touchControls?.addMenuButton(() => {
  if (journalUi.isOpen()) journalUi.close()
  else if (game?.world && !questUi.isOpen()) openJournal(game)
}, 'JOURNAL')
journalButton?.classList.add('wilds-only')

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
  if (hub.isOpen() || event?.target?.closest?.('#hub-open-btn, #hub-root, #graphics-btn') || HUB_KEYS[event?.code]) return
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
    else if (event?.code === 'KeyO' || event?.target?.closest?.('#world-btn')) {
      gameMode = 'world'
      disposeGame(game)
      game = createGame()
    } else if (event?.code === 'KeyK' || event?.target?.closest?.('#labyrinth-btn')) {
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
  transitionOverlay.reset()
  resetWater()
  resetParticles(particleSystem)
  resetPopups(popupPool)
  resetProjectiles(projectilePool)
  sigJobs.length = 0
  resetPoison(poisonPool)
  resetBullets(bulletPool)
  resetCrystals(crystalSystem)
  setChestPrompt(hud, null)
  resetShockwaves(shockwavePool)
  warp.reset()
  setTimeWarp(-Infinity)
  warpFields.length = 0
  meteors.splice(0).forEach(disposeMeteor)
  bossBeams.splice(0).forEach((b) => disposeObject3D(b.group))
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
  // The Wilds never end your run: at zero HP you get back up at the last save point.
  if (started && game.world && game.player.hp <= 0) respawnAtCheckpoint(game, elapsedSeconds)
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
  // U opens the Wilds journal (it freezes the game like the other panels).
  if (game.world && input.wasPressed('KeyU') && !questUi.isOpen() && !swapPanel.isOpen() && !hub.isOpen()) openJournal(game)
  if (loadoutOpen() || swapPanel.isOpen() || hub.isOpen() || questUi.isOpen() || journalUi.isOpen()) {
    renderMenuBackdrop(timestamp, MENU_FROZEN_FPS)
    input.endFrame()
    return
  }
  if (game.levelTransition && runLevelTransition(game, deltaSeconds, elapsedSeconds)) {
    composer.render()
    input.endFrame()
    return
  }
  const { state: nextHitstop, scale: hitstopScale } = stepHitstop(game.hitstop, deltaSeconds)
  game.hitstop = nextHitstop
  const gameplayDelta = deltaSeconds * hitstopScale

  if (game.world) stepWorld(game, elapsedSeconds, deltaSeconds)
  const { obstacles, player, pods, hidingState, attackState, shake } = game
  let monsters = game.monsters

  // Steps the wave controller, spawns anything it emits this tick, and
  // reacts to a cleared wave with a score bonus, a heal (so endless runs
  // stay survivable), and a banner. Monsters still materializing in
  // count as alive, so the clearing phase waits on them too.
  const clearedWaveNumber = game.waveState.waveNumber
  const bossBeforeStep = currentBoss(game.waveState)
  // Sandbox mode has no waves: nothing spawns or clears on its own.
  const { state: nextWaveState, spawns, events } = noWaves()
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
      // The next place arrives through a hyperspace jump (logic/levelTransition.js): a moment of play,
      // then streaks, a white flash (the place swaps behind it) and a swoop down onto the new deck.
      const nextIndex = levelIndexAfterBosses(game.bossesDefeated)
      const nextLevel = levelAt(nextIndex)
      game.levelTransition = createTransition(nextIndex)
      transitionOverlay.begin(nextLevel)
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
  if (spawnNow && !game.world) trySpawnPod(game)

  const { state: nextChestSpawnerState, spawnNow: chestSpawnNow } = stepPodSpawner(
    game.chestSpawnerState,
    elapsedSeconds,
    game.chests.filter((chest) => !chest.userData.opened).length,
    CHEST_MAX_ACTIVE,
    [CHEST_SPAWN_DELAY_MIN, CHEST_SPAWN_DELAY_MAX],
    Math.random,
  )
  game.chestSpawnerState = nextChestSpawnerState
  if (chestSpawnNow && !game.world) trySpawnChest(game)

  if (input.wasPressed('KeyL')) {
    autoShoot = !autoShoot
    tutorialEvent('autoShoot')
  }
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
  if (WEAPONS[selectedWeaponId(game.inventory)].gun) player.aimSlope = aimSlopeFor(player, game)
  else {
    player.aimSlope = 0
    player.aimStartY = null
  }
  const petFx = petEffects(game.inventory.pets, profile.pets)
  // In the Wilds, wayshrine boons (and the merchant's tonics) fold into the same effect set.
  const perk = game.world ? foldBoons(activeFx(game.inventory.equipped), boonEffects(game.world.shrines, elapsedSeconds)) : activeFx(game.inventory.equipped)
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
  player.speedMultiplier = petFx.speedMultiplier * perk.speed * (holdSprinting() ? SHIFT_SPRINT_MULTIPLIER : 1) * (elapsedSeconds < player.sprintUntil ? SPRINT_SPEED_MULTIPLIER : 1) * (elapsedSeconds < (player.whirlUntil ?? -Infinity) ? 1.3 : 1) * player.speedFactor(elapsedSeconds)
  if (player.stepStatus(elapsedSeconds)) burst(particleSystem, { x: player.position.x, y: 1.1, z: player.position.z }, STATUS_COLORS.poison, 3, 1.5)
  if (game.world) {
    const jump = game.world.jump
    if (isGliding(jump)) player.speedMultiplier *= GLIDE_SPEED_MULTIPLIER // the paraglider carries you along
    else if (!jump.air && heightAt(player.position.x, player.position.z) < WATER_LEVEL - 0.4) player.speedMultiplier *= 0.72 // wading is slow
  }
  // The player keeps full speed through a hitstop freeze: only the world stops,
  // otherwise every landed hit stalls your movement for a moment.
  if (firstPerson) cameraYaw = fpYaw + Math.PI
  const room = waterRoom()
  if (input.touchMode) {
    // Touch: the 1ST button toggles first person (while diving, DIVE/SURFACE decides it), and the
    // aim stick turns the view like the mouse does.
    if (input.wasPressed('Digit0') && !waterState.diving) setFirstPerson(!firstPerson)
    if (firstPerson && input.touchAim.aiming) { fpYaw -= input.touchAim.dx * TOUCH_LOOK_SPEED * deltaSeconds; fpPitch = Math.max(-FP_PITCH_LIMIT, Math.min(FP_PITCH_LIMIT, fpPitch - (input.touchAim.dy || 0) * TOUCH_LOOK_SPEED * deltaSeconds)) }
    touchControls?.setWater(Boolean(room), waterState.diving)
    touchControls?.setWilds(Boolean(game.world))
  }
  stepWater(elapsedSeconds, deltaSeconds)
  input.wildsKeys = Boolean(game?.world)
  player.update(input, cameraYaw, deltaSeconds, room ? true : null)
  if (game.world) {
    // Space: a plain hop; Space again in the air opens the paraglider (no cooldown, no ability slot). Not while hiding,
    // falling off the edge, or paused in a menu.
    const canHop = !player.hidden && !player.falling && player.hp > 0 && !hub.isOpen()
    const ground = heightAt(player.position.x, player.position.z)
    const hop = stepJump(game.world.jump, canHop && input.wasPressed('Space'), deltaSeconds, ground)
    game.world.jump = hop.state
    if (!player.falling) player.mesh.position.y = hop.state.alt
    if (!game.world.glider.parent) player.mesh.add(game.world.glider)
    updateGlider(game.world.glider, hop.state.gliding && hop.state.air, deltaSeconds, elapsedSeconds)
    if (hop.opened) burst(particleSystem, { x: player.position.x, y: hop.state.alt + 2.8, z: player.position.z }, 0xffd0e0, 18, 3)
    if (hop.jumped || hop.landed) {
      burst(particleSystem, { x: player.position.x, y: hop.state.alt + 0.15, z: player.position.z }, 0xe0d6ff, hop.landed ? 14 : 8, hop.landed ? 3 : 2)
    }
  }
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
    if (game.world && player.hp > 0) respawnAtCheckpoint(game, elapsedSeconds, { toast: false, heal: false }) // hurt, but back at the save point rather than the middle of the world
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
    cooldownMultiplier: petFx.cooldownMultiplier * perk.cooldown * (elapsedSeconds < player.frenzyUntil ? FRENZY_COOLDOWN_MULTIPLIER : 1) * (elapsedSeconds < timeWarp.until ? 0.77 : 1),
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
  if (ambushHit) {
    showAmbushBanner(hud)
    tutorialEvent('ambush')
  }
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
      else if (game.world) mesh.position.y = mesh.userData.lake ? WATER_LEVEL - 0.3 : heightAt(mesh.position.x, mesh.position.z)
      updateJelly(mesh, gameplayDelta, elapsedSeconds, { speed: 0, moveDir: mesh.userData.moveDir })
      updateFace3D(mesh, gameplayDelta, elapsedSeconds)
      return true
    }

    if (mesh.userData.dying) {
      updateJelly(mesh, gameplayDelta, elapsedSeconds, { speed: 0, moveDir: mesh.userData.moveDir })
      updateFace3D(mesh, gameplayDelta, elapsedSeconds)
      const finishedDying = updateMonsterHitReaction(mesh, gameplayDelta)
      if (finishedDying) {
        rememberWorldKill(game, mesh, elapsedSeconds)
        scoreKill(game, mesh, mesh.userData.lastHitBy ?? 'sword', mesh.position, elapsedSeconds)
        dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalDrops(mesh.userData.type, mesh.userData.isBoss))
        // A caught Bellhop Bandit spills its whole sack, plus a tip.
        if (mesh.userData.stolen > 0) dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalChange(refundWithTip(mesh.userData.stolen)))
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
        rememberWorldKill(game, mesh, elapsedSeconds)
        scoreKill(game, mesh, 'fall', { x: mesh.position.x, y: 0, z: mesh.position.z }, elapsedSeconds)
        // A Bellhop Bandit knocked overboard: the sack (and a tip) is credited straight back.
        if (mesh.userData.stolen > 0) {
          const back = refundWithTip(mesh.userData.stolen)
          game.inventory = addCrystals(game.inventory, back)
          questUi.showToast(`SACK RECOVERED  +${back} CRYSTALS`)
        }
        disposeObject3D(mesh)
        if (mesh.userData.isBoss) bossGone = true
        return false
      }
      return true
    }

    // Immunity phases: at 75 / 50 / 25% health a boss throws up a shield, calls minions, and can't be hurt until they are beaten.
    if (mesh.userData.isBoss && !mesh.userData.spawning && !mesh.userData.immune) {
      const phase = immunityPhaseReached(mesh.userData.hp, mesh.userData.maxHp, mesh.userData.immunityDone ?? 0, mesh.userData.immunityThresholds)
      if (phase !== null) startImmunity(game, mesh, phase)
    }
    if (mesh.userData.immune) stepImmunity(game, mesh, gameplayDelta, elapsedSeconds)
    // Phase two: at half health a boss ENRAGES: faster, its moves come round sooner, and it fires its signature at once.
    if (mesh.userData.isBoss && !mesh.userData.phase2 && !mesh.userData.spawning && mesh.userData.hp <= mesh.userData.maxHp * 0.5) {
      mesh.userData.phase2 = true
      const rage = bossEnrage(mesh.userData.bossFights ?? 99)
      mesh.userData.speedScale = (mesh.userData.speedScale ?? 1) * rage.speed
      mesh.userData.specialIntervalScale = (mesh.userData.specialIntervalScale ?? 1) * rage.interval
      mesh.userData.damageScale = (mesh.userData.damageScale ?? 1) * rage.damage
      mesh.userData.signatureTimer = Math.min(mesh.userData.signatureTimer ?? 0, 0.6)
      const material = mesh.userData.jelly?.body?.material
      if (material?.emissive) {
        material.emissive.setHex(0xff2244)
        material.emissiveIntensity = 0.5
      }
      spawnShockwave(shockwavePool, mesh.position.x, mesh.position.z, 9, 0xff2244)
      burst(particleSystem, { x: mesh.position.x, y: 1.5, z: mesh.position.z }, 0xff4466, 50, 6)
      sfx.play('bossSlam', { x: mesh.position.x, z: mesh.position.z })
      questUi.showToast(`${bossById(mesh.userData.type)?.name ?? 'BOSS'} IS ENRAGED!`)
    }
    updateFrozenLook(mesh, elapsedSeconds)
    const { hitPlayer: monsterHitPlayer, events: specialEvents } = updateMonster(mesh, player, obstacles, gameplayDelta, elapsedSeconds)
    const hitPlayer = monsterHitPlayer || (specialEvents.length > 0 && applyBossEvents(game, mesh, specialEvents, elapsedSeconds))
    if (mesh.userData.escaped) {
      disposeObject3D(mesh) // a Bellhop Bandit that got away: gone, no kill
      return false
    }
    if (mesh.userData.leakPending > 0) {
      // Hits shake crystals loose from a bandit's sack.
      dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalChange(mesh.userData.leakPending))
      mesh.userData.leakPending = 0
      mesh.userData.setSack?.(mesh.userData.stolen ?? 0)
    }
    if (mesh.userData.burrowed && Math.random() < gameplayDelta * 22) {
      // A tunnelling gopher throws up a trail of dust behind its hump.
      burst(particleSystem, { x: mesh.position.x, y: 0.15, z: mesh.position.z }, 0xc8a070, 3, 2.2, 1.2)
    }
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
      const home = mesh.userData.lake
      if (home) {
        const dx = mesh.position.x - home.x
        const dz = mesh.position.z - home.z
        const d = Math.hypot(dx, dz)
        if (d > home.radius) {
          mesh.position.x = home.x + (dx / d) * home.radius
          mesh.position.z = home.z + (dz / d) * home.radius
        }
      }
      mesh.position.y = (mesh.userData.leapY ?? 0) + (home ? WATER_LEVEL - 0.3 + Math.sin(elapsedSeconds * 2 + home.x) * 0.1 : game.world ? heightAt(mesh.position.x, mesh.position.z) : 0)
    }
    if (mesh.userData.arms) {
      for (const { pivot, side } of mesh.userData.arms) pivot.rotation.z = side * (0.55 + (mesh.userData.leapY ?? 0) * 0.5)
    }
    if (mesh.userData.eelTail) swishEelTail(mesh, elapsedSeconds)
    mesh.userData.animateAcc?.(elapsedSeconds)
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
      if (game.world) {
        // On the hills the loot has to sit on the ground, not at sea level.
        const lift = (item) => item && (item.position.y = heightAt(item.position.x, item.position.z))
        lift(game.chests[game.chests.length - 1])
        lift(game.pickups[game.pickups.length - 1])
      }
    }
  }

  updateSpawnEffects(game, gameplayDelta)

  separateMonsters(monsters, player, obstacles)
  updateArena(game.arena, player.position, elapsedSeconds)
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
  updateWhirlwind(game, gameplayDelta, elapsedSeconds)
  updateMeteors(game, gameplayDelta)
  updateBossBeams(gameplayDelta)
  updateSigJobs(gameplayDelta, elapsedSeconds)
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
    now: elapsedSeconds,
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
  const orbHurt = updateProjectiles(projectilePool, gameplayDelta * (elapsedSeconds < timeWarp.until ? timeWarp.factor : 1), player, elapsedSeconds, ARENA_RADIUS, bulwarkBlockers())
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
  // On hills, pets ride the ground: take last frame's lift off, let them move, put the new lift on.
  if (game.world) for (const pet of game.pets) pet.mesh.position.y -= pet.groundLift ?? 0
  updatePets(game.pets, { petDamage: perk.petDamage, levels: profile.pets, dt: gameplayDelta, elapsed: elapsedSeconds, player, monsters: game.monsters, obstacles, particleSystem, hitstop: game.hitstop, shockwavePool, onScratch: petScratch })
  if (game.world) {
    for (const pet of game.pets) {
      pet.groundLift = heightAt(pet.mesh.position.x, pet.mesh.position.z)
      pet.mesh.position.y += pet.groundLift
    }
  }
  const collected = updateCrystals(crystalSystem, gameplayDelta, elapsedSeconds, player.position.x, player.position.z, petFx.magnetRadius * perk.magnet)
  if (collected > 0) {
    const gained = Math.max(1, Math.round(collected * petFx.crystalMultiplier * perk.crystal))
    game.inventory = addCrystals(game.inventory, gained)
    tutorialEvent('crystal', gained)
    if (game.world) worldQuestEvent(game, { type: 'crystals', amount: gained })
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
  if (pickupSpawnNow && !freePlay() && !game.world) trySpawnPerkPickup(game)
  game.pickups = game.pickups.filter((pickup) => {
    updatePerkPickup(pickup, gameplayDelta)
    if (player.hidden || Math.hypot(pickup.position.x - player.position.x, pickup.position.z - player.position.z) > PICKUP_RADIUS) return true
    burst(particleSystem, { x: pickup.position.x, y: 1, z: pickup.position.z }, 0xffffff, 18, 3.5)
    sfx.play('chestOpen', { x: pickup.position.x, z: pickup.position.z })
    receiveLoot(game, { kind: 'powerup', id: pickup.userData.id })
    tutorialEvent('powerup')
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
  const enemiesLeft = inBossFight || noWaves() || game.labyrinth?.gateOpen
    ? game.monsters.length
    : waveSize(game.waveState.waveNumber) - game.waveState.spawnedCount + game.monsters.length
  // In the Wilds a boss's bar only shows once you are near its lair.
  const bossMesh = game.monsters.find((m) => m.userData.isBoss && !m.userData.dying && (!game.world || Math.hypot(m.position.x - player.position.x, m.position.z - player.position.z) < 70))
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
    waveState: noWaves() || game.labyrinth?.gateOpen ? { ...game.waveState, phase: 'clearing' } : game.waveState,
    boss: bossHud,
    chain: liveChain,
    deltaSeconds,
  })
  perf?.end('hud')
  if (!noWaves() && hud.waveAnnouncement !== previousAnnouncement) sfx.play('announcement')

  // A slight look-ahead in the player's current movement direction,
  // scaled by how close to full speed they're actually moving (so it
  // eases in/out along with the movement ramp rather than snapping).
  const lookAheadAmount = CAMERA_LOOKAHEAD * (player.speed / PLAYER_SPEED)
  const cameraOffset = player.hidden ? HIDDEN_CAMERA_OFFSET : CAMERA_OFFSET
  // A rifle scope with a wide view pulls the camera back; the reticle follows the cursor.
  const heldRifle = WEAPONS[selectedWeaponId(game.inventory)]
  const heldTuned = started && game.player.hp > 0 && heldRifle.rifle ? tuneRifle(heldRifle, riflePicks(sandboxProfile(), heldRifle.id)) : null
  scopeZoom = scope.update(heldTuned, { player, aimAngle: player.aimAngle ?? player.facing, mouse: input.mouse, showCursor: !input.touchMode && !firstPerson && input.mouse.moved, firstPerson, dt: deltaSeconds, steady: steadyAim })
  const zoomK = player.hidden ? 1 : scopeZoom
  cameraTarget.set(
    player.position.x + cameraOffset.x * zoomK + player.moveDir.x * lookAheadAmount,
    cameraOffset.y * zoomK + (game.world ? game.world.camGround : 0),
    player.position.z + cameraOffset.z * zoomK + player.moveDir.z * lookAheadAmount,
  )
  // Frame-rate-independent exponential smoothing: 1 - exp(-lambda * dt)
  // is the same damp() uses elsewhere, just expressed as the single
  // alpha THREE.Vector3.lerp takes.
  const lerpFactor = 1 - Math.exp(-CAMERA_LERP * deltaSeconds)
  camera.position.lerp(cameraTarget, lerpFactor)
  camera.lookAt(player.position.x, 1 + (game.world ? game.world.camGround : 0), player.position.z)
  if (firstPerson) {
    player.mesh.visible = false
    // Underwater the eye sits just above the swimmer's depth; on land it's head height.
    const eye = room ? waterState.depthY + 0.9 : 1.5 + (game.world ? player.mesh.position.y : 0)
    camera.position.set(player.position.x, eye, player.position.z)
    const cp = Math.cos(fpPitch)
    camera.lookAt(player.position.x + Math.sin(fpYaw) * 10 * cp, eye + Math.sin(fpPitch) * 10, player.position.z + Math.cos(fpYaw) * 10 * cp)
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
