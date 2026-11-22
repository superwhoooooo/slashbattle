import { noteSaved } from './saveSync.js' // first: loads the device save file into localStorage before anything reads it
import { startUpdateCheck } from './updateCheck.js'
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
import { createHeroBeam, createHeroProjectile, disposeHeroProjectile, dressPlayer } from './heroGear.js'
import { ATOMIC_REACH, HAMMER_REACH, HOOK_RANGE, HOTFOOT_MAX, HOTFOOT_STEP, HEROES, RAM_REHIT, boomerangPoint, broadsideSpots, chainPath, densestSpot, grantSkin, heroById, heroEffects, heroLook as lookForProfile, inBeam, isBehind, pickMarks, returningPoint, rewindTarget, rootsTriggered, spinReels, tipJarCrystals, linePoint, fanAngles, infinityPush, addRage, RAGE_PER_HIT, RAGE_PER_HURT, gloryKillReady, chargeLevel, grantHero, heroForCrowns, heroForHearts, heroForSecrets, ownsHero } from './logic/heroes.js'
import { AWAKEN_LEVEL, HERO_ABILITIES, HERO_ABILITY_KEY, awakenedStats, heroAbilityFraction, isAwakened, pointsAlong, ringPoints, steerToward, traitTune, turnToward, useHeroAbility, windAt } from './logic/heroPowers.js'
import { loadProfile, saveProfile } from './profile.js'
import { DIFFICULTIES, DIFFICULTY_IDS, difficultyById, runPayout } from './logic/difficulty.js'
import { getDifficulty, setDifficulty } from './difficulty.js'
import { contractText, masteryLevel, progressEvent } from './logic/progress.js'
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
import { createMasteryPickPanel } from './masteryPick.js'
import { HERO_ULTIMATES, ULTIMATE_KEY, ULTIMATE_LEVEL, hasMasteryChoice, statPick, ultimateFraction, useUltimate } from './logic/heroUltimates.js'
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
import { GLIDE_SPEED_MULTIPLIER, createJumpState, isGliding, launchJump, stepJump } from './logic/jump.js'
import { RELIC_CATCH_RADIUS, RELIC_REWARD, TOWER_HEIGHT, chargeFraction, createLaunchState, isAloft, isleLayout, isleUnder, launchVelocity, skyArchipelagos, skyTowers, stepLaunch, surfaceAt, towerObstacles, updraftLift } from './logic/skyIslands.js'
import { createSkyWorld } from './skyIslands.js'
import { ROCK_DAMAGE_SCALE, ROCK_HIT_RADIUS, SKYFIN, createFlight, createFlyerDirector, flyerSpawnPoint, stepFlight, stepFlyerDirector, stepRock } from './logic/skyFlyers.js'
import { createGlider, updateGlider } from './glider.js'
import { createNpc, setNpcMarker, updateNpc, TALK_RANGE } from './npcs.js'
import { createQuestUi } from './questUi.js'
import { acceptQuest, claimQuest, createQuestLog, npcDialog, npcMarker, questEvent, questsToClaim, questWeaponFor } from './logic/quests.js'
import { BIOMES, BOSS_RESPAWN_SECONDS, SANCTUM_RADIUS, SKYSTAR_CATCH_RADIUS, SKYSTAR_REWARD, UNLOAD_RADIUS, VILLAGE_SAFE_RADIUS, WATER_LEVEL, WORLD_RADIUS, biomeAt, canRespawn, chunkContent, chunkKey, propHeight, dangerAt, dayName, diffChunks, groundColorAt, heightAt, inDepths, lakeAt, landmarkById, landmarks, nearestLandmark, nearestVillage, ruins, villageKeepOut, setDepthsMode, skystars, villageById, villages } from './logic/world.js'
import { createWildsActivities } from './wildsActivities.js'
import { createDepthsFx } from './depthsFx.js'
import { CAVE_FIRST_REWARD, caveArrival, caveAt, caveById, caveExit, caveObstacles, caves } from './logic/caves.js'
import { CLEAR_REWARD, COLD, EMBER, PHENOMENA, PHENOMENON_LIST, PHENOMENON_ORDER, PHENOMENON_RADIUS, SPORES, advanceStage, clearedCount, coldDamagePerSecond, coldSlow, coldStep, collectItem, createHold, createTrial, currentStage, emberSpot, gustPush, hasGift, hazardScale, heroForStorms, isCleared, joinChampion, phenomenonEye, progressOf, progressText, purgeKill, sporeSpot, stageCount, stagePoints, stageReward, startPhenomenon, stepHold, stepTrial, stormIntensity, stormMonsters } from './logic/phenomena.js'
import { createPhenomenaFx } from './phenomenaFx.js'
import { STORM_PAD_CHARGE, TEMPLE_NAMES, deepTemples, padAt, skyTempleFor, skyTemples, templeArena, templeDirections, templePlace } from './logic/stormTemples.js'
import { setMood } from './speciesModels.js'
import { championFor, companionStorm, guideTarget, guideText, sageDialog, stormCity } from './logic/stormGuide.js'
import { CAMP_SIZE, CELL_PICKUP_RADIUS, FIX_REWARD, PARTS_COST, acceptFix, campKill, collectCell, finishFix, fixOf, fixProgressText, issueCamp, issueCells, jammedTowers, keeperDialog, keeperSpot, towerIssue } from './logic/towerQuests.js'
import { createCavesFx } from './cavesFx.js'
import { ASCEND_RADIUS, DEPTH_FIRST_REWARD, DEPTH_RELIC_REWARD, RELIC_CLAIM_RADIUS, arrivalSpot, ascendFraction, beacons, chasmById, chasmFalls, chasmRim, chasms, createAscendState, depthsChunk, depthsLairs, stepAscend } from './logic/depths.js'
import { createJournalUi } from './journalUi.js'
import { LANTERN_CATCH_RADIUS, LANTERN_COUNT, lanternReward, lanternsNear } from './logic/lanterns.js'
import { BOONS, SHRINE_RADIUS, activeBoons, boonEffects, createShrineState, foldBoons, grantBoon, shrineCharge, useShrine, wayshrines } from './logic/wayshrines.js'
import { HEAT_TEXT, MAX_MAPS, addMap, digAt, makeTreasureMap, nearestMap } from './logic/treasure.js'
import { createRaceState, raceCourses, raceReward, stepRace } from './logic/races.js'
import { EVENTS, STAR_SHARD_VALUE, createEventDirector, endEvent, hordePlan, merchantName, merchantStock, meteorPlan, stepEventDirector, wandererPlan } from './logic/wildEvents.js'
import { BESTIARY_FIRST_REWARD, JOURNAL_KEY, claimMilestone, creatureName, noteBiome, noteCave, noteChasm, noteDepthRelic, noteEvent, noteIsle, noteKill, noteLandmark, noteLantern, noteRace, noteRelic, noteShrine, noteTower, noteTreasure, parseJournal, pickUnowned, readyMilestones, serializeJournal } from './logic/wildsJournal.js'
import { formatTime } from './logic/wildsSpots.js'
import { createMusic } from './music.js'
import { MUSIC_STYLE_LABELS, nextMusicStyle, pickTrack } from './logic/wildsMusic.js'
import { createSfx } from './sfx.js'
import { jellyHit, updateJelly } from './jelly.js'
import {
  ARENA_RADIUS,
  setArenaRadius,
  BLOOM_RADIUS,
  BLOOM_ENABLED,
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
  DASH_COOLDOWN,
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
import { createAttackState, damageMonster, setDamageHooks, setKnockbackWorldScale, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
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
  updateHeroAbilityHud, updateUltimateHud,
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
  setWaveTuning,
  waveClearBonus,
  waveSize,
} from './logic/waves.js'
import { enemyScale, SPLITS } from './logic/enemies.js'
import { createMonsterAIState, isUntouchable, separateMonsters, setDeepShield, setMonsterNavigator, setPlayerAloft, setSurfaceShield, setTimeWarp, setWaterRoom, timeWarp, updateMonster, upgradeBossSpecials } from './monster.js'
import { applyFreeze, applySlow, isFrozen, statusTimeScale } from './logic/status.js'
import { createCoop } from './coop.js'
import { COOP_MAX_DISTANCE, COOP_RESPAWN_HP, COOP_RESPAWN_IFRAMES, cleanMode, leashPosition, standUpBeside } from './logic/coop.js'
import { knockbackVector } from './logic/combat.js'
import { DUEL_RADIUS, DUEL_SPEED, DUEL_START_IFRAMES, NO_STAKE, awardStake, canHit as duelCanHit, cleanStake, createDuel, duelDamage, duelScoreText, duelSpawn, ownsStake, scoreKo, stakeKey, stakeLabel, stakeLocked, stakeOptions, stepDuel } from './logic/duel.js'
import { burst, createParticleSystem, resetParticles, setParticleViewScale, shardBurst, updateParticles } from './particles.js'
import { createPet, disposePets, updatePets } from './pets.js'
import { Player } from './player.js'
import { createBulletPool, fireBullets, resetBullets, updateBullets } from './bullets.js'
import { createScratchLayer, showScratch } from './scratch.js'
import { makeBullets } from './logic/bullets.js'
import { createPoisonPool, lobPoison, resetPoison, setPoisonGlow, updatePoison } from './hazards.js'
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
const DIRECT_RENDER_DEFAULT = !BLOOM_ENABLED && !GTAO_ENABLED
function createRendererWithFallback() {
  // The canvas itself needs no antialiasing: everything is drawn through the composer's own
  // multisampled target, so a multisampled default framebuffer is pure extra fill and resolve.
  // ?gpu=low|high picks the GPU on dual-GPU laptops (A/B switch for heat vs speed).
  const gpuParam = new URLSearchParams(location.search).get('gpu')
  const preferred = gpuParam === 'low' ? 'low-power' : 'high-performance'
  const attempts = isTouchDevice()
    ? [{ antialias: false }, { antialias: false, powerPreference: 'low-power' }, { antialias: true }]
    : [
        // With bloom and AO off (the default medium preset) most frames skip the composer and draw
        // straight to the canvas, so the canvas itself is antialiased then.
        { antialias: DIRECT_RENDER_DEFAULT, powerPreference: preferred },
        { antialias: DIRECT_RENDER_DEFAULT },
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
bloomPass.enabled = BLOOM_ENABLED
composer.addPass(bloomPass)
// The screen-warp pass (Warp Field, Gravity Well, ripples from slams and
// heavy weapons) bends the finished frame, so it goes before OutputPass.
const warp = createWarp(camera)
composer.addPass(warp.pass)
composer.addPass(new OutputPass())
// Like Shardfall's Normal preset: when no post effect is on this frame (no bloom, no AO, no warp
// zone), skip the whole composer chain (MSAA target, passes, output blit) and draw straight to the
// canvas. The renderer applies the same tone mapping and colour space OutputPass would.
const renderThroughComposer = composer.render.bind(composer)
composer.render = (...args) => {
  if (gtaoPass.enabled || bloomPass.enabled || warp.pass.enabled) renderThroughComposer(...args)
  else renderer.render(scene, camera)
}

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
// The Plague Doctor's Contagion puddles: the same bubbling poison look, but they only hurt monsters
// (main.js's heroState.clouds does the damage), so they're stepped against a player nobody can reach.
const contagionPool = createPoisonPool({ style: 'plague' })
scene.add(contagionPool.group)
const NOBODY = { hidden: true, diving: false, position: { x: 0, z: 0 }, damagePlayer: () => false }
const shockwavePool = createShockwavePool()
scene.add(shockwavePool.group)
const bulletPool = createBulletPool()
bulletPool.onFire = (bullets) => coop?.sendShots(bullets) // co-op: the others see our shots (as harmless ghosts)
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
    if (event.target?.closest?.('input, textarea')) return // a quick second tap on a text box must still focus it
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
// Holding Shift sprints (not in a water room; E dives there). Touch: the move stick pushed to its rim holds 'Sprint'.
const SHIFT_SPRINT_MULTIPLIER = 1.5
function holdSprinting() {
  return !waterRoom() && !game?.player?.hidden && (input.isDown('ShiftLeft') || input.isDown('ShiftRight') || input.isDown('Sprint'))
}
function applyFxDepth() {
  const ground = game?.world?.groundY ?? 0 // on hills, shots / sparks / rings / crystals ride up with the player
  crystalSystem.mesh.position.y = ground
  const y = fxDepthOffset() + ground
  const hug = game?.world && !game.world.aloft ? heightAt : null // enemy orbs, and third-person shots, follow the hills instead of flying into them (up in the sky they fly straight)
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
  setPlayerAloft(Boolean(game?.world?.aloft)) // up on a sky isle: the land's monsters and the sky's can't reach across
  applyFxDepth()
  if (!room) {
    waterUi.update({ room: false, diving: false, fraction: 1 })
    return
  }
  // Shift no longer dives (it would send you under while trying to sprint): E or the touch DIVE button does.
  const toggle = input.wasPressed('Dive') || (input.wasHidePressed() && !player.hidden && (waterState.diving || !lastHidePrompt))
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
  if (!started || hub.isOpen() || pauseMenu.isOpen() || blockingPanelOpen()) return
  setFirstPerson(!firstPerson)
})
const cameraTarget = new THREE.Vector3()

// Where the mouse points on the ground (y = 0.7, the bullets' height), as a
// yaw from the player (Player.facing's convention: atan2(dx, dz)); null until
// the mouse has moved. Used to aim ranged weapons.
const aimRaycaster = new THREE.Raycaster()
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.7)
const aimAirPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const aimPoint = new THREE.Vector3()
const aimNdc = new THREE.Vector2()
function screenAimAngle(player, clientX, clientY) {
  aimNdc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)
  aimRaycaster.setFromCamera(aimNdc, camera)
  if (game?.world) {
    // High in the sky (a Skylift launch, a sky isle) the ground is hundreds of metres down and shots fly level from your
    // height, so the cursor points at your own altitude. Down on the hills it points at the terrain itself: march the
    // ray down onto the ground.
    const jump = game.world.jump
    if (jump && isAloft(player.position.x, player.position.z, jump.alt)) {
      aimAirPlane.constant = -(jump.alt + 0.7)
      if (!aimRaycaster.ray.intersectPlane(aimAirPlane, aimPoint)) return null
    } else if (!rayOntoTerrain(aimRaycaster.ray, aimPoint)) return null
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
    t += i < 60 ? 1 : i < 200 ? 3 : 12 // out to the far plane, so a cursor aimed at the distance still finds the ground
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
      best = { y: game.world && !game.world.aloft ? aimSphere.center.y - mesh.position.y - (layerY - heightAt(player.position.x, player.position.z)) : aimSphere.center.y - layerY, x: mesh.position.x, z: mesh.position.z }
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
        if (!material.userData.shared) material.dispose() // (shared = the storm peoples' palette materials)
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
// The secret hero: claim every Nimbus Crown in the Wilds and the Nimbus Sovereign is yours (checked on each claim and at
// startup, so a save that already has them all gets it too). Written to the real profile, never the sandbox view.
function grantCrownHero(claimed, announce = false) {
  const id = heroForCrowns(claimed, skyArchipelagos().length)
  if (!id || ownsHero(profile, id)) return grantTwilightHero(announce)
  profile = grantHero(profile, id)
  saveProfile(profile)
  grantTwilightHero(announce)
  if (!announce || !hud) return
  const hero = heroById(id)
  showLootToast(hud, { title: 'SECRET HERO UNLOCKED', name: hero.name, blurb: 'Every crown of the sky is yours, and so is its Sovereign. Pick them on the Heroes page (Y).' })
  const p = game?.player?.position
  if (p) {
    burst(particleSystem, { x: p.x, y: 2, z: p.z }, 0xfff2a8, 80, 8)
    spawnShockwave(shockwavePool, p.x, p.z, 12, 0xffd15c)
  }
}
// The Twilight Regent: yours once you own BOTH the Nimbus Sovereign and the Hollow Queen (checked after either grant and at startup).
function grantTwilightHero(announce = false) {
  const id = heroForSecrets(profile)
  if (!id || ownsHero(profile, id)) return
  profile = grantHero(profile, id)
  saveProfile(profile)
  if (!announce || !hud) return
  showLootToast(hud, { title: 'SECRET HERO UNLOCKED', name: heroById(id).name, blurb: 'The Sovereign and the Hollow Queen, together at last. Pick Nyxara on the Heroes page (Y).' })
  const p = game?.player?.position
  if (p) {
    burst(particleSystem, { x: p.x, y: 2, z: p.z }, 0xff8ad8, 80, 8)
    spawnShockwave(shockwavePool, p.x, p.z, 14, 0xffc86a)
  }
}
// The Stormbinder: calm all four regional phenomena (checked on each calm and at startup, like the crowns and hearts).
function grantStormHero(cleared, announce = false) {
  const id = heroForStorms(cleared)
  if (!id || ownsHero(profile, id)) return
  profile = grantHero(profile, id)
  saveProfile(profile)
  if (!announce || !hud) return
  showLootToast(hud, { title: 'SECRET HERO UNLOCKED', name: heroById(id).name, blurb: 'All four storms are calm, and the weather has decided to follow you. Pick Kestrel on the Heroes page (Y).' })
  const p = game?.player?.position
  if (p) {
    burst(particleSystem, { x: p.x, y: 2, z: p.z }, 0x9fe8ff, 90, 9)
    for (const [i, c] of [0xe8b86a, 0xcfeaff, 0xff7a3a, 0x8ae86a].entries()) spawnShockwave(shockwavePool, p.x, p.z, 8 + i * 4, c)
  }
}
// The Hollow Queen: claim every Umbral Heart in the Depths (checked on each claim and at startup, like the crowns).
function grantDepthsHero(claimed, announce = false) {
  const id = heroForHearts(claimed, depthsLairs().length)
  if (!id || ownsHero(profile, id)) return grantTwilightHero(announce)
  profile = grantHero(profile, id)
  saveProfile(profile)
  grantTwilightHero(announce)
  if (!announce || !hud) return
  const hero = heroById(id)
  showLootToast(hud, { title: 'SECRET HERO UNLOCKED', name: hero.name, blurb: 'Every heart of the dark is yours, and so is its Queen. Pick her on the Heroes page (Y).' })
  const p = game?.player?.position
  if (p) {
    burst(particleSystem, { x: p.x, y: 2, z: p.z }, 0xb64aff, 80, 8)
    spawnShockwave(shockwavePool, p.x, p.z, 12, 0xb64aff)
  }
}
// A secret hero (logic/heroes.js `secret`) stays out of the sandbox too until the real profile owns it.
const sandboxHeroes = () => HEROES.filter((h) => !h.secret || ownsHero(profile, h.id))
const sandboxProfile = () =>
  sandbox
    ? { ...heroProfile(), collection: Object.keys(PETS), unlocked: { scopes: Object.keys(SCOPES), ammo: Object.keys(AMMO) }, heroesOwned: sandboxHeroes().map((h) => h.id), skinsOwned: sandboxHeroes().flatMap((h) => h.skins.slice(1).map((k) => `${h.id}:${k.id}`)) }
    : profile
function setProfile(next) {
  if (sandbox) {
    // The sandbox's all-unlocked view never gets saved: hero picks stay in this session only.
    sandboxHeroPick = { hero: next.hero, heroSkins: next.heroSkins }
    next = { ...next, hero: profile.hero, heroSkins: profile.heroSkins, heroesOwned: profile.heroesOwned, skinsOwned: profile.skinsOwned }
  }
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
const activeFx = (equipped) => {
  const fx = combineEffects(combineEffects(powerupEffects(equipped, profile.powerups), skillEffects(profile.skills)), heroEffects(heroProfile().hero))
  const woke = heroAwake() ? combineEffects(fx, awakenedStats(heroProfile().hero)) : fx // mastery 4 (logic/heroPowers.js)
  return combineEffects(woke, masteryRunFx()) // mastery 8: the run's +10% stat, and a running ultimate's boost
}
// ---- mastery 8 (logic/heroUltimates.js): each run, the hero's ultimate (K) or +10% to one stat ----
const masteryRun = { pick: null, hero: null, ultReady: 0, buff: null, lockedToastAt: -Infinity } // pick: { kind: 'ult' } | { kind: 'stat', id }; hero: who it was picked for
// The pick belongs to the hero it was made for, for the whole run: swap heroes mid-run and it stays with that hero (and is back when you swap to them again).
const masteryPickActive = () => masteryRun.pick !== null && masteryRun.hero === heroProfile().hero
function masteryRunFx() {
  const out = {}
  if (!masteryPickActive()) return out
  const stat = masteryRun.pick?.kind === 'stat' ? statPick(masteryRun.pick.id) : null
  if (stat) {
    for (const [k, v] of Object.entries(stat.fx)) {
      if (k === 'maxHpFrac') out.maxHp = Math.round(PLAYER_MAX_HP * v)
      else out[k] = v
    }
  }
  const b = masteryRun.buff
  if (b && heroNow < b.until) {
    if (b.damage) out.damage = (out.damage ?? 1) * b.damage
    if (b.speed) out.speed = (out.speed ?? 1) * b.speed
    if (b.guard) out.damageTaken = (out.damageTaken ?? 1) * b.guard
    if (b.haste) out.haste = (out.haste ?? 1) * b.haste
    if (b.attack) out.cooldown = (out.cooldown ?? 1) * b.attack
  }
  return out
}
const ultimateUnlocked = () => sandbox || (masteryPickActive() && masteryRun.pick.kind === 'ult')
const heroMasteryLevel = () => masteryLevel(profile.progress?.mastery?.[heroProfile().hero] ?? 0)

// ---------- heroes (logic/heroes.js): the look, and each hero's one trait ----------
// The sandbox lets you try every hero and skin for free, but those picks live only for that session:
// they never become owned (or chosen) in the saved profile that normal runs use.
let sandboxHeroPick = null // { hero, heroSkins } while in the sandbox
const heroProfile = () => (sandbox && sandboxHeroPick ? { ...profile, ...sandboxHeroPick } : profile)
const heroFx = () => heroEffects(heroProfile().hero)
const heroLook = () => lookForProfile(heroProfile())
const heroTrait = () => heroById(heroProfile().hero).trait.id
// Mastery 4 awakens the hero (logic/heroPowers.js): a stronger trait and the hero ability on B.
// The sandbox lets you try every hero awakened.
const heroAwake = () => sandbox || isAwakened(profile.progress?.mastery?.[heroProfile().hero] ?? 0)
const tn = () => traitTune(heroTrait(), heroAwake()) // the current trait's numbers
let heroNow = 0 // elapsed seconds, for the damage hooks
const heroState = {
  stillSince: 0, molten: 0, moltenUntil: -Infinity, lastHp: null, slipUntil: -Infinity, slipHaste: 1.35, clouds: [], auraNext: 0,
  hits: 0, // own hits landed (Static Charge / Echo Self counters)
  pending: [], // trait effects queued from inside damageMonster, run next frame: { at, run }
  whistleReady: 0, bassReadyAt: 0, rewindReady: 0, history: [], historyNext: 0,
  kills: 0, broadsideReady: 0, thornsReady: 0, // Seconds, Please / Broadside / Thorns
  flyers: [], // thrown things: Plasma Wake blades, boomerangs, Tip Jar suitcases (see launchFlyer)
  footprints: [], footDist: 0, lastFoot: null, // Hot Foot
  rootsReady: 0, // Thorn Warden's roots
  hookReady: 0, yanks: [], // Hookshot Hana
  atomic: 0, // Kaiju Kiddo's breath charge (hits)
  noonReady: 0, // Deadeye Dakota
  fx: [], // fading beams: { mesh, born, life }
  sabers: 0, // Plasma Wake throws (every twinEvery-th splits)
  holeReady: 0, holes: [], // Professor Singularity's black holes: { x, z, born, pull, blast, damage, life }
  rebirthReady: 0, // Phoenix Phoebe
  cutsReady: 0, // Kenji Ninefold
  // Awakened traits and hero abilities:
  abilityReady: 0, lockedToastAt: -Infinity, // the hero ability's cooldown (B)
  focusUntil: -Infinity, // Inner Focus lingering after you move (awakened) / Starfall Palm
  noonUntil: -Infinity, // awakened High Noon's damage boost
  echoUntil: -Infinity, // Mirror Self
  vanishUntil: -Infinity, // Vanish: every hit is a backstab
  speedUntil: -Infinity, // Tailwind
  hammer: null, // Thundra's hovering storm hammer
  breath: null, // Kaiju Kiddo's held Atomic Breath
  // Legendary heroes:
  blueReady: 0, infinityFxAt: 0, infinityUp: false, // Shiro the Limitless
  seraphReady: 0, windReady: 0, lances: 0, ascend: null, flyLift: 0, // the Nimbus Sovereign (secret hero)
  rage: 0, rageUntil: -Infinity, rageShockAt: -Infinity, // Ragnar Ashfather
  stompReady: 0, // Pipeworks Paolo
  pelletUntil: -Infinity, pellet: null, panicNext: 0, // Chompy Champ's power pellet
  starUntil: -Infinity, // Paolo's Super Star
  inhaleReady: 0, // Puffball Poppy
  chargeAt: 0, // Blaster Blu: when the cannon last fired its charge
}
function resetHeroState() {
  Object.assign(heroState, {
    clouds: [], lastHp: null, molten: 0, moltenUntil: -Infinity, pending: [], history: [], hits: 0,
    whistleReady: 0, bassReadyAt: 0, rewindReady: 0, kills: 0, broadsideReady: 0, thornsReady: 0,
    footprints: [], footDist: 0, lastFoot: null, rootsReady: 0, hookReady: 0, noonReady: 0, atomic: 0, sabers: 0,
    holeReady: 0, rebirthReady: 0, cutsReady: 0, holes: [], slipUntil: -Infinity,
    abilityReady: 0, focusUntil: -Infinity, noonUntil: -Infinity, echoUntil: -Infinity, vanishUntil: -Infinity, speedUntil: -Infinity,
    blueReady: 0, rage: 0, rageUntil: -Infinity, rageShockAt: -Infinity, stompReady: 0, pelletUntil: -Infinity, pellet: null,
    starUntil: -Infinity, inhaleReady: 0, chargeAt: 0, infinityUp: false, seraphReady: 0, windReady: 0, lances: 0, ascend: null,
  })
  clearFlyers()
  clearHeroFx()
}
// Trait damage itself (cause 'hero'), pets and hazards don't trigger or get boosted by traits.
const TRAIT_EXCLUDED = new Set(['pet', 'photobomb', 'spike', 'hero', 'fall'])
// What traits measure "0.5x damage" against: the weapon in hand with your damage bonuses.
function heroBaseDamage() {
  const weapon = WEAPONS[selectedWeaponId(game.inventory)]
  return (weapon?.damage ?? 16) * activeFx(game.inventory.equipped).damage
}
const setBurn = (mesh, dps = tn().dps ?? 0.4, time = tn().burn ?? 3) => {
  mesh.userData.burn = { until: heroNow + time, next: heroNow + 1, dps: dps * heroBaseDamage() }
}
setDamageHooks({
  amount(monster, damage, cause) {
    if (!game) return damage
    const trait = heroTrait()
    const t = tn()
    // Hexed monsters take more from everything (pets and trait damage too).
    const hexed = trait === 'hex' && heroNow < (monster.userData.hexUntil ?? -Infinity)
    if (TRAIT_EXCLUDED.has(cause)) return hexed ? Math.round(damage * t.bonus) : damage
    const p = game.player.position
    let scale = 1
    if (trait === 'focus' && (heroNow - heroState.stillSince >= t.delay || heroNow < heroState.focusUntil)) scale *= t.bonus
    if (trait === 'marksman') scale *= 1 + t.max * Math.min(1, Math.hypot(monster.position.x - p.x, monster.position.z - p.z) / 14)
    if (trait === 'molten' && heroNow < heroState.moltenUntil) scale *= 1 + t.per * Math.min(t.stacks, heroState.molten)
    if (trait === 'chill' && isFrozen(monster.userData, heroNow)) scale *= t.bonus
    if (trait === 'backstab' && (heroNow < heroState.vanishUntil || monster.userData.state === 'wander' || monster.userData.state === 'search' || isBehind(monster.position, monster.rotation.y, p))) {
      scale *= t.bonus
      monster.userData.backstabAt = heroNow
    }
    if (trait === 'highnoon' && heroNow < heroState.noonUntil) scale *= t.boost
    if (trait === 'spartan' && heroNow < heroState.rageUntil) scale *= t.bonus
    if (trait === 'abyss') scale *= 1 + t.hunger * (1 - Math.max(0, game.player.hp) / Math.max(1, game.player.maxHp)) // the emptier she is, the harder she bites
    if (trait === 'twilight' && !twilightDawn(t)) scale *= 1 + t.dusk // dusk: the dark hits harder
    if (trait === 'stormbound' && windAt(heroNow, t.phase).id === 'ember') scale *= 1 + t.ember // ember wind: everything burns hotter
    if (hexed) scale *= t.bonus
    return scale === 1 ? damage : Math.round(damage * scale)
  },
  hit(monster, damage, cause, lethal) {
    if (!game || TRAIT_EXCLUDED.has(cause)) return
    const trait = heroTrait()
    const t = tn()
    heroState.hits++
    const at = { x: monster.position.x, z: monster.position.z }
    const p = game.player.position
    const angle = Math.atan2(at.x - p.x, at.z - p.z)
    // These run next frame (queued), so a trait never re-enters damageMonster from inside it.
    if (trait === 'static' && heroState.hits % t.every === 0) heroState.pending.push({ at: heroNow, run: () => staticArc(at) })
    if (trait === 'echo' && !lethal && (heroNow < heroState.echoUntil || heroState.hits % t.every === 0)) {
      const mult = heroNow < heroState.echoUntil ? 1 : t.mult
      heroState.pending.push({ at: heroNow + 0.4, run: () => echoHit(monster, damage, mult) })
    }
    if (trait === 'bassdrop' && heroNow >= heroState.bassReadyAt) {
      heroState.bassReadyAt = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => bassDrop(at) })
    }
    if (trait === 'broadside' && heroNow >= heroState.broadsideReady) {
      heroState.broadsideReady = heroNow + t.cooldown
      const from = { x: p.x, z: p.z }
      broadsideSpots(from, at, 2.5, t.blasts).forEach((spot, i) => heroState.pending.push({ at: heroNow + 0.12 * (i + 1), run: () => cannonBlast(spot) }))
    }
    if (trait === 'boomerang' && heroState.hits % t.every === 0) heroState.pending.push({ at: heroNow, run: () => throwBoomerang(angle) })
    if (trait === 'hammer' && heroState.hits % t.every === 0) {
      // While the storm hammer hovers, the 4th hit calls lightning down on it instead.
      if (heroState.hammer) heroState.pending.push({ at: heroNow, run: () => heroState.hammer && lightningStrike({ x: heroState.hammer.x, z: heroState.hammer.z }, heroLook().glow) })
      else heroState.pending.push({ at: heroNow, run: () => (t.hover ? throwStormHammer(t.hover) : throwHammer(angle)) })
    }
    if (trait === 'blackhole' && heroNow >= heroState.holeReady) {
      heroState.holeReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => openBlackHole(at) })
    }
    if (trait === 'thousandcuts' && heroNow >= heroState.cutsReady) {
      heroState.cutsReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => thousandCuts() })
    }
    if (trait === 'hookshot' && heroNow >= heroState.hookReady) {
      heroState.hookReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => fireHook() })
    }
    if (trait === 'atomic' && !heroState.breath && ++heroState.atomic >= t.every) {
      heroState.atomic = 0
      heroState.pending.push({ at: heroNow + 0.05, run: () => (t.hold ? startAtomicBreath(t.hold) : atomicBreath()) })
    }
    if (trait === 'highnoon' && heroNow >= heroState.noonReady) {
      heroState.noonReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => highNoon() })
    }
    if (trait === 'jackpot') {
      const spin = spinReels(Math.random, t.chance)
      if (spin.win) heroState.pending.push({ at: heroNow + 0.05, run: () => jackpotBlast(at, spin.reels) })
    }
    // Legendary heroes.
    if (trait === 'limitless' && heroNow >= heroState.blueReady) {
      heroState.blueReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => castBlue(at, t) })
    }
    if (trait === 'fuse' && heroState.hits % t.every === 0) heroState.pending.push({ at: heroNow, run: () => fireFuseArrows(heroAimAngle(), t) })
    if (trait === 'spartan') {
      if (heroNow < heroState.rageUntil) {
        const pl = game.player
        if (pl.hp > 0) pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * t.heal)
        if (heroNow - heroState.rageShockAt >= 0.3) {
          heroState.rageShockAt = heroNow
          heroState.pending.push({ at: heroNow, run: () => heroNova(at, t.radius, t.damage, 2.5, 0xff5a2a) })
        }
      } else {
        const r = addRage(heroState.rage, RAGE_PER_HIT, t.max)
        heroState.rage = r.rage
        if (r.full) heroState.pending.push({ at: heroNow, run: () => startRage(t) })
      }
    }
    if (trait === 'stomp' && heroNow >= heroState.stompReady) {
      heroState.stompReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow + 0.05, run: () => groundPound(monster, t) })
    }
    if (trait === 'abyss' && heroState.hits % t.every === 0) heroState.pending.push({ at: heroNow, run: () => shadowTendrils(at, t) })
    if (trait === 'twilight' && !twilightDawn(t) && heroState.hits % t.tendrilEvery === 0) {
      heroState.pending.push({ at: heroNow, run: () => shadowTendrils(at, { reach: t.reach, tendrils: t.tendrils, damage: t.tendrilDamage, heal: t.heal }) })
    }
    if (trait === 'stormbound') {
      const wind = windAt(heroNow, t.phase).id
      if (wind === 'frost') applySlow(monster.userData, heroNow, t.slow, 0.45)
      else if (wind === 'mire') {
        const pl = game.player
        if (pl.hp > 0) pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * t.heal)
      } else if (wind === 'sand' && heroState.hits % t.devilEvery === 0) heroState.pending.push({ at: heroNow, run: () => dustDevil(at, t) })
    }
    if (trait === 'tnt' && heroState.hits % t.every === 0) heroState.pending.push({ at: heroNow, run: () => dropTnt(at, t) })
    if (trait === 'hadoken' && heroState.hits % t.every === 0) heroState.pending.push({ at: heroNow + 0.05, run: () => waveFist(heroAimAngle(), t) })
    if (trait === 'inhale' && heroNow >= heroState.inhaleReady) {
      heroState.inhaleReady = heroNow + t.cooldown
      heroState.pending.push({ at: heroNow, run: () => inhale(t) })
    }
    if (lethal) return
    if (trait === 'glorykill' && !monster.userData.immune && gloryKillReady(monster.userData.hp, monster.userData.maxHp, !!monster.userData.isBoss, t.below, t.bossBelow)) {
      heroState.pending.push({ at: heroNow, run: () => gloryKill(monster, t) })
    }
    if (trait === 'hex') {
      if (heroNow >= (monster.userData.hexUntil ?? -Infinity)) burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, heroLook().glow, 8, 1.5, 0.8)
      monster.userData.hexUntil = Math.max(monster.userData.hexUntil ?? -Infinity, heroNow + t.time)
    }
    if (trait === 'rebirth' && Math.random() < t.burnChance) setBurn(monster, 0.4, 3)
    if (trait === 'kindling' && Math.random() < t.chance) setBurn(monster)
    if (trait === 'chill' && Math.random() < t.chance) applyFreeze(monster.userData, heroNow, t.freeze)
  },
})
// Re-dresses the player when the hero or skin changed (a new run's mesh, or a pick in the hub).
function redressHero() {
  if (!game?.player) return
  const look = heroLook()
  const key = `${look.heroId}:${look.id}`
  if (game.player.mesh.userData.heroKey === key) return
  dressPlayer(game.player.mesh, look)
  game.player.mesh.userData.heroKey = key
}
const heroHurt = (mesh, amount, knockback = 0, fromPos = game.player.position) =>
  damageMonster(mesh, Math.max(1, Math.round(amount)), { fromPos, knockback, obstacles: game.obstacles, particleSystem, cause: 'hero' })
const alive = (mesh) => !mesh.userData.dying && !mesh.userData.spawning && !mesh.userData.falling && game.monsters.includes(mesh)
const distTo = (mesh, at) => Math.hypot(mesh.position.x - at.x, mesh.position.z - at.z)
// Where hero moves aim: the view in first person, else the cursor / aim stick, else the facing.
function heroAimAngle() {
  const player = game.player
  if (firstPerson) return fpYaw
  return (input.touchMode ? touchAimAngle(player) : mouseAimAngle(player)) ?? player.facing
}
function heroAimPoint(range) {
  const player = game.player
  if (!firstPerson) return abilityTargetPoint(player, range)
  const d = Math.min(range, 10)
  return clampToPlatform({ x: player.position.x + Math.sin(fpYaw) * d, z: player.position.z + Math.cos(fpYaw) * d }, ARENA_RADIUS - 1)
}
// A blast ring: shockwave, sparks, warp and a hit on everything within `radius` (`damage` x base; 0 skips the hit).
function heroNova(at, radius, damage, knockback, color = heroLook().glow, each = null) {
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, color, 30, radius * 0.9, 0.45)
  burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, 0xffffff, 14, radius * 0.6, 0.35)
  spawnShockwave(shockwavePool, at.x, at.z, radius, color)
  warp.add('ripple', at.x, at.z, radius + 1, 0.55)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 1.6, SHAKE_HIT_DURATION * 1.4)
  sfx.play('bossSlam', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) {
    if (damage > 0) heroHurt(mesh, damage * heroBaseDamage(), knockback, at)
    each?.(mesh)
  }
}
// Abyssal Hunger: shadow tendrils erupt under the monsters around a hit, and each one feeds her.
function shadowTendrils(at, t = tn()) {
  const glow = heroLook().glow
  const victims = heroTargets(at.x, at.z, t.reach).sort((a, b) => distTo(a, at) - distTo(b, at)).slice(0, t.tendrils)
  const pl = game.player
  for (const mesh of victims) {
    const x = mesh.position.x
    const z = mesh.position.z
    for (let i = 0; i < 5; i++) burst(particleSystem, { x: x + (Math.random() - 0.5) * 0.7, y: 0.3 + i * 0.45, z: z + (Math.random() - 0.5) * 0.7 }, i % 2 ? glow : 0x14101e, 3, 1.2, 0.5)
    spawnShockwave(shockwavePool, x, z, 1.8, glow)
    heroHurt(mesh, t.damage * heroBaseDamage(), 3, at)
    if (pl.hp > 0) pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * t.heal)
  }
  if (victims.length) sfx.play('hit', at)
}
// Four Winds (Kestrel): a small whirl of sand that shoves and nicks whatever it catches.
function dustDevil(at, t = tn()) {
  const color = WINDS_COLORS.sand
  burst(particleSystem, { x: at.x, y: 0.6, z: at.z }, color, 18, 2.4, 0.5)
  spawnShockwave(shockwavePool, at.x, at.z, 3.5, color)
  for (const mesh of heroTargets(at.x, at.z, 3.5)) heroHurt(mesh, t.devil * heroBaseDamage(), 4, at)
}
const WINDS_COLORS = { sand: 0xe8b86a, frost: 0xcfeaff, ember: 0xff7a3a, mire: 0x8ae86a }
// One ring of a wind round the player: sand shoves, frost slows, ember burns, mire drains and heals.
function windRing(kind, at, radius, damage, t) {
  const color = WINDS_COLORS[kind]
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, color, 22, radius * 0.9, 0.45)
  spawnShockwave(shockwavePool, at.x, at.z, radius, color)
  let drained = 0
  for (const mesh of heroTargets(at.x, at.z, radius)) {
    if (kind === 'sand') heroHurt(mesh, Math.max(0.2, damage * 0.3) * heroBaseDamage(), t.shove, at)
    else if (kind === 'frost') {
      applySlow(mesh.userData, heroNow, t.slow, 0.4)
      heroHurt(mesh, Math.max(0.2, damage * 0.4) * heroBaseDamage(), 1, at)
    } else {
      heroHurt(mesh, damage * heroBaseDamage(), 1.5, at)
      if (kind === 'ember') setBurn(mesh, 0.5, 3)
      else drained++
    }
  }
  return drained
}
// The wind pulses round her on a beat (only while something is near, so the quiet stays quiet).
function stepStormbound(player, now, t) {
  if (player.hp <= 0 || player.falling || player.hidden || now < heroState.windReady) return
  const at = { x: player.position.x, z: player.position.z }
  if (!heroTargets(at.x, at.z, t.radius).length) return
  heroState.windReady = now + t.every
  const kind = windAt(now, t.phase).id
  const drained = windRing(kind, at, t.radius, t.damage, t)
  if (kind === 'mire' && drained && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * t.heal)
}
// Calamity Call (Kestrel's B): all four winds roll out one after another.
function calamityCall(p) {
  const t = traitTune('stormbound', true)
  const rings = [['sand', 6, 2], ['frost', 8, 2], ['ember', 10, 3], ['mire', 12, 2]]
  rings.forEach(([kind, radius, damage], i) => {
    heroState.pending.push({
      at: heroNow + i * 0.35,
      run: () => {
        const drained = windRing(kind, p, radius, damage, t)
        if (kind === 'mire') {
          const pl = game.player
          pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * (drained ? 0.1 : 0.04))
        }
      },
    })
  })
  showPopup(popupPool, game.player.position, 'CALAMITY CALL', '', '#9fe8ff')
}
// Eclipse (Veyra's B): a wave of shadow that slows everything it touches, and she drinks in some health.
function eclipse(p, r, dmg, heal) {
  const glow = heroLook().glow
  heroNova(p, r, dmg, 3, glow, (m) => applySlow(m.userData, heroNow, 4, 0.4))
  column(p.x, p.z, glow, 5, 10)
  showPopup(popupPool, p, 'ECLIPSE', '', `#${glow.toString(16).padStart(6, '0')}`)
  const pl = game.player
  pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * heal)
}
// Static Charge: lightning from where the hit landed into the nearest monsters.
function staticArc(from, t = tn()) {
  const glow = heroLook().glow
  const targets = heroTargets(from.x, from.z, t.range).sort((a, b) => distTo(a, from) - distTo(b, from)).slice(0, t.targets)
  for (const mesh of targets) {
    // A jagged trail of sparks from the hit to the target, then a flash on it.
    for (let i = 1; i <= 6; i++) {
      const k = i / 6
      burst(particleSystem, { x: from.x + (mesh.position.x - from.x) * k + (Math.random() - 0.5) * 0.5, y: 1 + (Math.random() - 0.5) * 0.4, z: from.z + (mesh.position.z - from.z) * k + (Math.random() - 0.5) * 0.5 }, glow, 2, 0.6)
    }
    column(mesh.position.x, mesh.position.z, glow, 2.5, 5)
    heroHurt(mesh, t.damage * heroBaseDamage())
  }
}
// Echo Self: the twin's copy of a hit, 0.4 s late.
function echoHit(mesh, damage, mult) {
  if (!alive(mesh)) return
  burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, heroLook().glow, 12, 2.2, 0.4)
  heroHurt(mesh, damage * mult)
}
// Bass Drop: a shockwave from the hit, hurting and shoving everything near.
function bassDrop(at, radius = tn().radius, damage = tn().damage) {
  const glow = heroLook().glow
  spawnShockwave(shockwavePool, at.x, at.z, radius, glow)
  warp.add('ripple', at.x, at.z, radius + 1, 0.5)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
  sfx.play('bossSlam', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 2.5, at)
}
// Broadside: one cannon blast (Captain Gully).
function cannonBlast(at, damage = tn().damage, radius = tn().radius) {
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0xffb547, 18, 4, 0.4)
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0x3a3a40, 10, 2, 0.7)
  spawnShockwave(shockwavePool, at.x, at.z, radius, heroLook().glow)
  warp.add('ripple', at.x, at.z, radius + 0.5, 0.35)
  sfx.play('bossSlam', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 1.5, at)
}
// Thorns: a burst of thorns from the player when they get hurt (Rosa Thornheart).
function thornBurst(radius = tn().radius, damage = tn().damage) {
  const at = { x: game.player.position.x, z: game.player.position.z }
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0x4f8a4a, 20, radius * 1.5, 0.35)
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, heroLook().body, 10, radius, 0.4)
  spawnShockwave(shockwavePool, at.x, at.z, radius, heroLook().glow)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 3, at)
}
// Clockwork Sage's Rewind, Phoenix Phoebe's Rebirth and Lifeguard Lou's whistle: called before the game decides you're down.
function heroRescue(now) {
  const player = game.player
  const trait = heroTrait()
  const t = tn()
  if (trait === 'rewind' && player.hp <= 0 && now >= heroState.rewindReady) {
    // No history yet (just picked, or frozen in a cutscene): rewind in place.
    const back = rewindTarget(heroState.history, now, player.maxHp, t.minHp) ?? { x: player.position.x, z: player.position.z, hp: Math.ceil(player.maxHp * t.minHp) }
    heroState.rewindReady = now + t.cooldown
    burst(particleSystem, { x: player.position.x, y: 0.8, z: player.position.z }, heroLook().glow, 30, 3, 0.6)
    player.position = { x: back.x, z: back.z }
    player.mesh.position.x = back.x
    player.mesh.position.z = back.z
    player.hp = back.hp
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + 1.5)
    spawnShockwave(shockwavePool, back.x, back.z, 3, heroLook().glow)
    warp.add('swirl', back.x, back.z, 3, 0.7)
    if (t.slow) setTimeWarp(Math.max(timeWarp.until, now + t.slow), 0.3)
    showLootToast(hud, { title: 'REWIND', name: 'Clockwork Sage', blurb: t.slow ? 'Not yet. Wound back, and the clock is crawling.' : 'Not yet. Wound back 3 seconds.' })
  }
  if (trait === 'rebirth' && player.hp <= 0 && now >= heroState.rebirthReady) {
    heroState.rebirthReady = now + t.cooldown
    player.hp = Math.ceil(player.maxHp * t.riseHp)
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + 2)
    phoenixNova({ x: player.position.x, z: player.position.z }, t.radius, t.damage, true)
  }
  if (trait === 'whistle' && player.hp > 0 && player.hp < player.maxHp * t.below && now >= heroState.whistleReady) {
    heroState.whistleReady = now + t.cooldown
    blowWhistle(t.radius, t.damage, t.heal)
    showLootToast(hud, { title: 'RESCUE WHISTLE', name: 'Lifeguard Lou', blurb: 'Everybody out of the pool!' })
  }
}
function blowWhistle(radius, damage, heal) {
  const player = game.player
  const at = { x: player.position.x, z: player.position.z }
  spawnShockwave(shockwavePool, at.x, at.z, radius, heroLook().glow)
  warp.add('ripple', at.x, at.z, radius + 0.5, 0.6)
  burst(particleSystem, { x: at.x, y: 1.4, z: at.z }, 0xffffff, 24, 4, 0.5)
  sfx.play('announcement', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 4, at)
  player.hp = Math.min(player.maxHp, player.hp + heal)
}
// ---- thrown things (Plasma Wake, Boomerang, Tip Jar's suitcase) ----
// A flyer follows `point(t)` (t 0..1 over `duration`), spinning, and hits each monster it passes
// once per leg (`legs` 2 for the boomerang: everything can be hit again on the way back).
// Extras for the legendary heroes' shots: `angle` faces the mesh along a fixed heading instead of spinning,
// `stopOnHit` ends it on the first monster it touches, `noHit` never hits (a TNT block), `onHit(mesh)` runs on
// each monster hit, `onStep(f, at, now, t)` every frame, `onEnd(at)` when it ends, `y` fixes its height
// (above the player's height at launch) and `scale` sizes the mesh.
function launchFlyer({ kind, color, duration, radius, damage, knockback = 1, spin = 14, point, legs = 1, arc = 0, angle = null, stopOnHit = false, noHit = false, onHit = null, onStep = null, onEnd = null, y = null, scale = 1 }) {
  const mesh = createHeroProjectile(kind, color)
  const start = point(0)
  const fixedY = y === null ? null : game.player.mesh.position.y + y
  mesh.position.set(start.x, fixedY ?? game.player.mesh.position.y + 0.9, start.z)
  if (scale !== 1) mesh.scale.setScalar(scale)
  if (angle !== null) mesh.rotation.y = angle
  scene.add(mesh)
  heroState.flyers.push({ mesh, born: heroNow, duration, radius, damage, knockback, spin, point, legs, arc, hit: new Set(), leg: 0, lastAt: start, color, angle, stopOnHit, noHit, onHit, onStep, onEnd, fixedY })
}
function stepFlyers(now) {
  heroState.flyers = heroState.flyers.filter((f) => {
    const t = Math.min(1, (now - f.born) / f.duration)
    const leg = Math.min(f.legs - 1, Math.floor(t * f.legs))
    if (leg !== f.leg) {
      f.leg = leg
      f.hit.clear()
    }
    const at = f.point(t)
    f.mesh.position.x = at.x
    f.mesh.position.z = at.z
    f.mesh.position.y = (f.fixedY ?? game.player.mesh.position.y + 0.9) + f.arc * Math.sin(Math.PI * t)
    if (f.angle === null) f.mesh.rotation.y = (now - f.born) * f.spin
    else if (f.spin) f.mesh.rotation.z = (now - f.born) * f.spin
    if (!f.noHit && Math.random() < 0.6) burst(particleSystem, { x: at.x, y: f.mesh.position.y, z: at.z }, f.color, 2, 0.6, 0.3)
    f.onStep?.(f, at, now, t)
    const from = f.lastAt
    f.lastAt = at
    let stopped = false
    if (!f.noHit) {
      for (const mesh of heroTargets(at.x, at.z, f.radius)) {
        if (f.hit.has(mesh)) continue
        f.hit.add(mesh)
        heroHurt(mesh, f.damage, f.knockback, from)
        burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, f.color, 10, 2.5, 0.35)
        f.onHit?.(mesh)
        if (f.stopOnHit) {
          stopped = true
          break
        }
      }
    }
    if (t >= 1 || stopped) {
      f.onEnd?.(at)
      scene.remove(f.mesh)
      disposeHeroProjectile(f.mesh)
      return false
    }
    return true
  })
}
function clearFlyers() {
  for (const f of heroState.flyers) {
    scene.remove(f.mesh)
    disposeHeroProjectile(f.mesh)
  }
  heroState.flyers = []
}
// Dread Lord Vexar's Plasma Wake: called as an attack starts; most of the time a blade follows it out.
function onHeroAttack(player) {
  const t = tn()
  if (heroTrait() === 'charge' && chargeLevel(heroNow, heroState.chargeAt, t.charge) >= 1) {
    heroState.chargeAt = heroNow
    fireChargeShot(heroAimAngle(), t)
  }
  if (heroTrait() !== 'saber' || Math.random() >= t.chance) return
  const facing = player.facing
  const twin = ++heroState.sabers % t.twinEvery === 0
  const angles = twin ? (t.twinCount === 3 ? [facing - 0.32, facing, facing + 0.32] : [facing - 0.28, facing + 0.28]) : [facing]
  for (const angle of angles) throwSaber(angle, t.reach, t.damage)
  sfx.play('swing', player.position)
}
function throwSaber(angle, reach, damage) {
  const player = game.player
  const from = { x: player.position.x + Math.sin(angle) * 0.6, z: player.position.z + Math.cos(angle) * 0.6 }
  launchFlyer({ kind: 'saber', color: heroLook().glow, duration: 0.9 * Math.max(1, reach / 12), radius: 1.6, damage: damage * heroBaseDamage(), knockback: 1.5, spin: 24, legs: 2, point: (k) => returningPoint(from, player.position, angle, k, reach) })
}
function throwBoomerang(angle, t = tn()) {
  const p = game.player
  const from = { x: p.position.x, z: p.position.z }
  for (let i = 0; i < t.count; i++) {
    const bow = i % 2 ? -2.4 : 2.4 // a pair loops out on both sides
    launchFlyer({ kind: 'boomerang', color: heroLook().glow, duration: 1.1 * Math.max(1, t.reach / 10), radius: 1.1, damage: t.damage * heroBaseDamage(), knockback: 1, spin: 16, legs: 2, point: (k) => boomerangPoint(from, p.position, angle, k, t.reach, bow) })
  }
  sfx.play('swing', from)
}
// Lady Jackpot: three of a kind -- a coin blast and a spray of crystals.
function jackpotBlast(at, reels, t = tn()) {
  burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, 0xffd15c, 36, 6, 0.5)
  burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, heroLook().glow, 16, 4, 0.6)
  spawnShockwave(shockwavePool, at.x, at.z, t.radius, 0xffd15c)
  warp.add('ripple', at.x, at.z, t.radius + 0.5, 0.45)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 1.4, SHAKE_HIT_DURATION)
  sfx.play('chestOpen', at)
  showPopup(popupPool, at, 'JACKPOT!', reels.join(' '), '#ffd15c')
  dropCrystals(crystalSystem, at.x, at.z, Array(t.crystals).fill(1))
  for (const mesh of heroTargets(at.x, at.z, t.radius)) heroHurt(mesh, t.damage * heroBaseDamage(), 2.5, at)
}
// Chef Flambé: the pan goes up -- a fire burst that sets everything near alight.
function flambe(at, damage = tn().damage ?? 1, radius = tn().radius ?? 3.5) {
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0xff8a3d, 30, radius * 1.4, 0.45)
  burst(particleSystem, { x: at.x, y: 1.4, z: at.z }, 0xffd15c, 14, 3, 0.6)
  spawnShockwave(shockwavePool, at.x, at.z, radius, 0xff8a3d)
  sfx.play('cannonball', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) {
    heroHurt(mesh, damage * heroBaseDamage(), 1.5, at)
    setBurn(mesh, 0.4, 3)
  }
}
// Prospector Pip's Mother Lode: a geode cracks open.
function motherLode(at, t = tn()) {
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, heroLook().glow, 26, 5, 0.4)
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0x8a7a6a, 12, 3, 0.5)
  spawnShockwave(shockwavePool, at.x, at.z, t.radius, heroLook().glow)
  sfx.play('crystal', at)
  dropCrystals(crystalSystem, at.x, at.z, Array(t.gems).fill(5))
  for (const mesh of heroTargets(at.x, at.z, t.radius)) heroHurt(mesh, t.damage * heroBaseDamage(), 2, at)
}
// Thorn Warden: roots erupt as health first drops below half (and Overgrowth).
function rootBurst(radius = tn().rootRadius, time = tn().rootTime, damage = tn().rootDamage, toast = true) {
  const at = { x: game.player.position.x, z: game.player.position.z }
  burst(particleSystem, { x: at.x, y: 0.4, z: at.z }, 0x6d5233, 30, radius, 0.4)
  burst(particleSystem, { x: at.x, y: 0.6, z: at.z }, heroLook().glow, 20, radius * 0.8, 0.5)
  spawnShockwave(shockwavePool, at.x, at.z, radius, heroLook().glow)
  warp.add('ripple', at.x, at.z, radius + 0.5, 0.5)
  for (const mesh of heroTargets(at.x, at.z, radius)) {
    applyFreeze(mesh.userData, heroNow, time)
    heroHurt(mesh, damage * heroBaseDamage(), 0, at)
    column(mesh.position.x, mesh.position.z, 0x6d5233, 1.6, 6)
  }
  if (toast) showLootToast(hud, { title: 'ROOTED', name: 'Thorn Warden', blurb: 'The forest has your back.' })
}
// Magma Marge's Hot Foot: footprints of lava while running fast (awakened: any running), each burning a while.
function addFootprint(x, z, now, t = tn()) {
  if (heroState.footprints.length >= HOTFOOT_MAX * 3) heroState.footprints.shift()
  heroState.footprints.push({ x, z, until: now + t.life, next: now + 0.15, glow: now, damage: t.damage, radius: t.radius })
}
function stepHotFoot(player, now, dt) {
  const t = tn()
  const fast = heroTrait() === 'hotfoot' && player.speed > PLAYER_SPEED * t.minSpeed && !player.hidden && !player.falling
  const here = { x: player.position.x, z: player.position.z }
  if (fast && heroState.lastFoot) heroState.footDist += Math.hypot(here.x - heroState.lastFoot.x, here.z - heroState.lastFoot.z)
  heroState.lastFoot = here
  if (fast && heroState.footDist >= HOTFOOT_STEP) {
    heroState.footDist = 0
    addFootprint(here.x, here.z, now, t)
  }
  const glow = heroLook().glow
  heroState.footprints = heroState.footprints.filter((f) => {
    if (now >= f.until) return false
    if (now >= f.glow) {
      f.glow = now + 0.18
      burst(particleSystem, { x: f.x, y: 0.15, z: f.z }, glow, 2, 0.8, 0.5)
    }
    if (now >= f.next) {
      f.next = now + 0.5
      for (const mesh of heroTargets(f.x, f.z, f.radius)) heroHurt(mesh, f.damage * heroBaseDamage())
    }
    return true
  })
}
// ---- Hookshot Hana, Rush Rocket, Commander Cobalt, Kaiju Kiddo, Deadeye Dakota ----
const livePoints = (x, z, range) => heroTargets(x, z, range).map((mesh) => ({ x: mesh.position.x, z: mesh.position.z, mesh }))
// A trail of sparks along a line (chains, tracers).
function sparkLine(from, to, color, steps = 8, y = 1) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    burst(particleSystem, { x: from.x + (to.x - from.x) * t, y, z: from.z + (to.z - from.z) * t }, color, 1, 0.3, 0.25)
  }
}
// Get Over Here!: hook the farthest monsters in range (one, or three awakened) and reel them in.
function fireHook(count = tn().count, range = HOOK_RANGE, damage = tn().damage, stun = tn().stun) {
  const p = game.player.position
  const caught = livePoints(p.x, p.z, range).sort((a, b) => Math.hypot(b.x - p.x, b.z - p.z) - Math.hypot(a.x - p.x, a.z - p.z)).slice(0, count)
  if (!caught.length) return
  for (const target of caught) {
    const hook = createHeroProjectile('hook', heroLook().glow)
    scene.add(hook)
    heroState.yanks.push({ mesh: target.mesh, hook, born: heroNow, boss: target.mesh.userData.isBoss === true, travelled: 0, damage, stun })
  }
  sfx.play('swing', p)
  showPopup(popupPool, p, 'GET OVER HERE!', '', '#ffd15c')
}
// The hook flies out for 0.18 s, then drags its catch up to the player's front.
function stepYanks(now, dt) {
  const p = game.player
  heroState.yanks = heroState.yanks.filter((y) => {
    const m = y.mesh
    const gone = !alive(m) || now - y.born > 1.2
    const from = { x: p.position.x, z: p.position.z }
    const to = { x: m.position.x, z: m.position.z }
    const dx = to.x - from.x
    const dz = to.z - from.z
    const d = Math.hypot(dx, dz) || 1
    const out = Math.min(1, (now - y.born) / 0.18)
    const tip = { x: from.x + dx * out, z: from.z + dz * out }
    y.hook.position.set(tip.x, p.mesh.position.y + 1, tip.z)
    y.hook.rotation.y = Math.atan2(dx, dz)
    sparkLine(from, tip, heroLook().trim, 6)
    const stopAt = PLAYER_RADIUS
    const want = stopAt + (m.userData.radius ?? 0.6) + 0.5
    const budget = y.boss ? 3 : Infinity // bosses are only dragged partway
    if (!gone && out >= 1 && d > want && y.travelled < budget) {
      const step = Math.min(d - want, 34 * dt, budget - y.travelled)
      y.travelled += step
      const moved = resolveArenaMove(to, { x: (-dx / d) * step, z: (-dz / d) * step }, m.userData.radius ?? 0.6, game.obstacles)
      m.position.x = moved.x
      m.position.z = moved.z
      return true
    }
    scene.remove(y.hook)
    disposeHeroProjectile(y.hook)
    if (gone) return false
    applyFreeze(m.userData, now, y.stun)
    burst(particleSystem, { x: m.position.x, y: 1, z: m.position.z }, heroLook().glow, 18, 3, 0.4)
    triggerShake(game.shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)
    heroHurt(m, y.damage * heroBaseDamage())
    return false
  })
}
// Sonic Boom: at sprint / dash speed (awakened: any running), everything you run into is blasted away.
function stepRam(player, now) {
  const t = tn()
  if (player.speed <= PLAYER_SPEED * t.minSpeed || player.hidden || player.falling) return
  const p = player.position
  if (Math.random() < 0.7) burst(particleSystem, { x: p.x, y: 0.7, z: p.z }, heroLook().glow, 2, 0.8, 0.35)
  for (const mesh of heroTargets(p.x, p.z, 0.9)) {
    if (now < (mesh.userData.ramReadyAt ?? 0)) continue
    mesh.userData.ramReadyAt = now + RAM_REHIT
    burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, 0xffffff, 14, 4, 0.3)
    triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 0.8, SHAKE_HIT_DURATION)
    heroHurt(mesh, t.damage * heroBaseDamage(), 4, p)
  }
}
function sonicBoom(at, radius, damage) {
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0xffffff, 18, 5, 0.3)
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, heroLook().glow, 14, 4, 0.4)
  spawnShockwave(shockwavePool, at.x, at.z, radius, heroLook().glow)
  warp.add('ripple', at.x, at.z, radius + 0.5, 0.4)
  sfx.play('cannonball', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 2.5, at)
}
// A beam that fades out over `life` seconds.
function addBeam(color, length, width, life, place) {
  const mesh = createHeroBeam(color, length, width)
  place(mesh)
  scene.add(mesh)
  heroState.fx.push({ mesh, born: heroNow, life })
}
function stepHeroFx(now) {
  heroState.fx = heroState.fx.filter((f) => {
    const t = (now - f.born) / f.life
    if (t >= 1) {
      scene.remove(f.mesh)
      disposeHeroProjectile(f.mesh)
      return false
    }
    f.mesh.userData.setFade(1 - t * t)
    return true
  })
}
function clearHeroFx() {
  for (const y of heroState.yanks) {
    scene.remove(y.hook)
    disposeHeroProjectile(y.hook)
  }
  heroState.yanks = []
  for (const f of heroState.fx) {
    scene.remove(f.mesh)
    disposeHeroProjectile(f.mesh)
  }
  heroState.fx = []
  for (const held of [heroState.hammer, heroState.breath]) {
    if (!held) continue
    scene.remove(held.mesh)
    disposeHeroProjectile(held.mesh)
  }
  heroState.hammer = null
  heroState.breath = null
}
// Atomic Breath: a roaring beam along the player's aim.
function atomicBreath() {
  const p = game.player
  const angle = heroAimAngle()
  const from = { x: p.position.x, z: p.position.z }
  const glow = heroLook().glow
  addBeam(glow, ATOMIC_REACH, 0.7, 0.5, (mesh) => {
    mesh.position.set(from.x + Math.sin(angle) * 0.5, p.mesh.position.y + 1.1, from.z + Math.cos(angle) * 0.5)
    mesh.rotation.y = angle
  })
  const end = { x: from.x + Math.sin(angle) * ATOMIC_REACH, z: from.z + Math.cos(angle) * ATOMIC_REACH }
  for (let i = 0; i < 10; i++) {
    const t = i / 9
    burst(particleSystem, { x: from.x + (end.x - from.x) * t, y: 1.1, z: from.z + (end.z - from.z) * t }, glow, 4, 2.5, 0.4)
  }
  warp.add('ripple', end.x, end.z, 3.5, 0.45)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 1.6, SHAKE_HIT_DURATION * 1.5)
  sfx.play('bossSlam', from)
  showPopup(popupPool, from, 'ROAAAR!', 'ATOMIC BREATH', '#6fe3ff')
  for (const mesh of heroTargets(from.x, from.z, ATOMIC_REACH + 2)) {
    if (!inBeam(from, angle, mesh.position, ATOMIC_REACH, 1.3 + (mesh.userData.radius ?? 0.5))) continue
    heroHurt(mesh, 1.6 * heroBaseDamage(), 3, from)
  }
}
// Awakened Atomic Breath: a beam held for `hold` seconds that sweeps after your aim, burning what it touches.
function startAtomicBreath(hold) {
  const p = game.player
  if (heroState.breath) {
    heroState.breath.until = Math.max(heroState.breath.until, heroNow + hold)
    return
  }
  const reach = traitTune('atomic', true).reach
  const mesh = createHeroBeam(heroLook().glow, reach, 0.85)
  scene.add(mesh)
  heroState.breath = { mesh, until: heroNow + hold, angle: heroAimAngle(), next: heroNow, reach }
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 1.8, SHAKE_HIT_DURATION * 1.5)
  sfx.play('bossSlam', p.position)
  showPopup(popupPool, p.position, 'ROAAAAAAR!', 'ATOMIC BREATH', '#6fe3ff')
}
function stepAtomicBreath(now, dt) {
  const b = heroState.breath
  if (!b) return
  const p = game.player
  if (now >= b.until || p.hp <= 0 || p.hidden || p.falling) {
    scene.remove(b.mesh)
    disposeHeroProjectile(b.mesh)
    heroState.breath = null
    return
  }
  b.angle = turnToward(b.angle, heroAimAngle(), 3.2, dt)
  p.facing = b.angle
  const from = { x: p.position.x, z: p.position.z }
  b.mesh.position.set(from.x + Math.sin(b.angle) * 0.5, p.mesh.position.y + 1.1, from.z + Math.cos(b.angle) * 0.5)
  b.mesh.rotation.y = b.angle
  const left = b.until - now
  b.mesh.userData.setFade(Math.min(1, left / 0.4) * (0.8 + 0.2 * Math.sin(now * 40)))
  const glow = heroLook().glow
  const t = traitTune('atomic', true)
  const along = Math.random() * b.reach
  burst(particleSystem, { x: from.x + Math.sin(b.angle) * along, y: 1.1, z: from.z + Math.cos(b.angle) * along }, glow, 3, 2, 0.35)
  if (now < b.next) return
  b.next = now + t.tick
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 0.5, SHAKE_HIT_DURATION)
  for (const mesh of heroTargets(from.x, from.z, b.reach + 2)) {
    if (!inBeam(from, b.angle, mesh.position, b.reach, 1.4 + (mesh.userData.radius ?? 0.5))) continue
    heroHurt(mesh, t.tickDamage * heroBaseDamage(), 0.8, from)
  }
}
// Orbital Strike: mark the biggest crowd, then call the beam down on it a moment later.
function paintOrbital(fallback, t = tn()) {
  const p = game.player.position
  const spot = densestSpot(livePoints(p.x, p.z, 18), t.radius) ?? fallback
  callOrbital({ x: spot.x, z: spot.z }, t.radius, t.damage, t.delay)
}
function callOrbital(at, radius, damage, delay) {
  const glow = heroLook().glow
  showPopup(popupPool, at, 'ORBITAL STRIKE', 'INBOUND', '#ff6a6a')
  sfx.play('announcement', at)
  for (let i = 0; i < 5; i++) heroState.pending.push({ at: heroNow + i * delay * 0.2, run: () => sparkRing(at.x, at.z, radius * (1 - i * 0.15), 0xff3a3a, 20) })
  heroState.pending.push({ at: heroNow + delay, run: () => orbitalStrike(at, glow, radius, damage) })
}
function orbitalStrike(at, glow, radius, damage) {
  addBeam(glow, 40, radius * 0.32, 0.7, (mesh) => {
    mesh.position.set(at.x, game.player.mesh.position.y, at.z)
    mesh.rotation.x = -Math.PI / 2 // +z up into the sky
  })
  burst(particleSystem, { x: at.x, y: 0.6, z: at.z }, 0xffffff, 40, 7, 0.4)
  burst(particleSystem, { x: at.x, y: 0.6, z: at.z }, glow, 30, 5, 0.6)
  column(at.x, at.z, glow, 8, 14)
  spawnShockwave(shockwavePool, at.x, at.z, radius, glow)
  warp.add('ripple', at.x, at.z, radius + 1.5, 0.7)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2.2, SHAKE_HIT_DURATION * 2)
  sfx.play('bossSlam', at)
  input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 3, at)
}
// High Noon: slow time, mark the nearest monsters, then fan the hammer.
// Awakened: time nearly stops for 6 s, twice the marks, and your hits deal more until it ends.
function highNoon(t = tn()) {
  const p = game.player
  const marks = pickMarks(livePoints(p.position.x, p.position.z, t.range), p.position, t.range, t.marks)
  if (!marks.length) return
  setTimeWarp(Math.max(timeWarp.until, heroNow + t.slow), t.factor)
  heroState.noonUntil = heroNow + t.slow
  warp.add('swirl', p.position.x, p.position.z, 6, Math.min(t.slow, 2))
  showPopup(popupPool, p.position, "IT'S HIGH NOON", '', '#ffd15c')
  sfx.play('announcement', p.position)
  for (const m of marks) column(m.x, m.z, 0xff3a3a, 3, 6)
  marks.forEach((m, i) => heroState.pending.push({
    at: heroNow + 0.6 + i * 0.12,
    run: () => {
      if (!alive(m.mesh)) return
      const from = { x: game.player.position.x, z: game.player.position.z }
      const to = { x: m.mesh.position.x, z: m.mesh.position.z }
      sparkLine(from, to, 0xfff0a0, 12)
      burst(particleSystem, { x: to.x, y: 1, z: to.z }, 0xff3a3a, 14, 3, 0.35)
      sfx.play('hit', to)
      heroHurt(m.mesh, t.damage * heroBaseDamage(), 1.5, from)
    },
  }))
}
// ---- premium heroes: Thundra Stormborn, Professor Singularity, Phoenix Phoebe, Kenji Ninefold ----
// Hammer Recall: out along the aim, lightning where it turns, then back to your hand.
function throwHammer(angle) {
  const p = game.player
  const from = { x: p.position.x, z: p.position.z }
  const glow = heroLook().glow
  launchFlyer({ kind: 'hammer', color: glow, duration: 1.0, radius: 1.3, damage: heroBaseDamage(), knockback: 2, spin: 18, legs: 2, arc: 0.6, point: (t) => returningPoint(from, p.position, angle, t, HAMMER_REACH) })
  sfx.play('swing', from)
  const turn = { x: from.x + Math.sin(angle) * HAMMER_REACH, z: from.z + Math.cos(angle) * HAMMER_REACH }
  heroState.pending.push({ at: heroNow + 0.5, run: () => lightningStrike(turn, glow) })
}
// Awakened Hammer Recall: the hammer hangs in the air for `hover` seconds, gliding after your aim, smashing
// what it touches and calling lightning down every second, then flies back to your hand.
const HAMMER_GLIDE = 13 // m/s it chases the aim point
const HAMMER_RETURN = 30
function throwStormHammer(hover) {
  if (heroState.hammer) {
    heroState.hammer.until = Math.max(heroState.hammer.until, heroNow + hover)
    heroState.hammer.returning = false
    return
  }
  const p = game.player
  const mesh = createHeroProjectile('hammer', heroLook().glow)
  mesh.scale.setScalar(1.6)
  mesh.position.set(p.position.x, p.mesh.position.y + 1.3, p.position.z)
  scene.add(mesh)
  heroState.hammer = { mesh, x: p.position.x, z: p.position.z, until: heroNow + hover, nextStrike: heroNow + 0.6, returning: false, hit: new Map() }
  sfx.play('swing', p.position)
  showPopup(popupPool, p.position, 'STORM HAMMER', `${hover} s`, '#9fd8ff')
}
function stepStormHammer(now, dt) {
  const h = heroState.hammer
  if (!h) return
  const p = game.player
  const glow = heroLook().glow
  if (now >= h.until || p.hp <= 0) h.returning = true
  const target = h.returning ? p.position : heroAimPoint(18)
  const next = steerToward(h, target, h.returning ? HAMMER_RETURN : HAMMER_GLIDE, dt)
  h.x = next.x
  h.z = next.z
  h.mesh.position.set(h.x, p.mesh.position.y + 1.3 + Math.sin(now * 4) * 0.25, h.z)
  h.mesh.rotation.y += dt * (h.returning ? 20 : 6)
  if (Math.random() < 0.8) burst(particleSystem, { x: h.x, y: h.mesh.position.y, z: h.z }, glow, 2, 1, 0.3)
  if (h.returning && Math.hypot(h.x - p.position.x, h.z - p.position.z) < 0.8) {
    scene.remove(h.mesh)
    disposeHeroProjectile(h.mesh)
    heroState.hammer = null
    burst(particleSystem, { x: p.position.x, y: 1.2, z: p.position.z }, glow, 16, 3, 0.4)
    return
  }
  // Smashes what it touches (each monster at most every 0.5 s).
  for (const mesh of heroTargets(h.x, h.z, 1.5)) {
    if (now < (h.hit.get(mesh) ?? 0)) continue
    h.hit.set(mesh, now + 0.5)
    heroHurt(mesh, heroBaseDamage(), 2, { x: h.x, z: h.z })
    burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, glow, 10, 2.5, 0.35)
  }
  if (!h.returning && now >= h.nextStrike) {
    h.nextStrike = now + 1
    lightningStrike({ x: h.x, z: h.z }, glow)
  }
}
function lightningStrike(at, glow, radius = 3.5, damage = 1.8) {
  addBeam(glow, 30, 0.45, 0.35, (mesh) => {
    mesh.position.set(at.x, game.player.mesh.position.y, at.z)
    mesh.rotation.x = -Math.PI / 2
  })
  // A jagged bolt of sparks down from the sky.
  let x = at.x
  let z = at.z
  for (let y = 9; y >= 0; y -= 0.6) {
    x += (Math.random() - 0.5) * 0.5
    z += (Math.random() - 0.5) * 0.5
    burst(particleSystem, { x, y, z }, 0xffffff, 2, 0.6, 0.25)
  }
  burst(particleSystem, { x: at.x, y: 0.5, z: at.z }, glow, 30, 5, 0.4)
  spawnShockwave(shockwavePool, at.x, at.z, radius, glow)
  warp.add('ripple', at.x, at.z, radius + 0.5, 0.45)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 1.5, SHAKE_HIT_DURATION)
  sfx.play('bossSlam', at)
  for (const mesh of heroTargets(at.x, at.z, radius)) heroHurt(mesh, damage * heroBaseDamage(), 2, at)
}
// Event Horizon: a black hole that drags everything in, then implodes.
function openBlackHole(at, t = tn(), label = 'EVENT HORIZON', color = null) {
  heroState.holes.push({ x: at.x, z: at.z, born: heroNow, pull: t.pull, blast: t.blast, damage: t.damage, life: t.life, color })
  warp.add('swirl', at.x, at.z, t.pull, t.life)
  showPopup(popupPool, at, label, '', color === null ? '#c77dff' : `#${color.toString(16).padStart(6, '0')}`)
  sfx.play('hyperspace', at)
}
function stepBlackHoles(now, dt) {
  if (!heroState.holes.length) return
  const glow = heroLook().glow
  heroState.holes = heroState.holes.filter((h) => {
    const glow = h.color ?? heroLook().glow
    const age = now - h.born
    if (age >= h.life) {
      burst(particleSystem, { x: h.x, y: 0.8, z: h.z }, 0xffffff, 30, 7, 0.35)
      burst(particleSystem, { x: h.x, y: 0.8, z: h.z }, glow, 40, 6, 0.5)
      spawnShockwave(shockwavePool, h.x, h.z, h.blast, glow)
      warp.add('ripple', h.x, h.z, h.blast + 2, 0.6)
      triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2, SHAKE_HIT_DURATION * 1.5)
      sfx.play('bossSlam', h)
      for (const mesh of heroTargets(h.x, h.z, h.blast)) heroHurt(mesh, h.damage * heroBaseDamage(), 3, h)
      return false
    }
    // A swirl of sparks spiralling into a dark core.
    for (let k = 0; k < 3; k++) {
      const a = age * 9 + k * 2.1
      const r = h.pull * 0.6 * (1 - ((age * 2 + k / 3) % 1))
      burst(particleSystem, { x: h.x + Math.sin(a) * r, y: 0.6, z: h.z + Math.cos(a) * r }, k ? glow : 0x14101e, 1, 0.4, 0.3)
    }
    for (const mesh of heroTargets(h.x, h.z, h.pull)) {
      const dx = h.x - mesh.position.x
      const dz = h.z - mesh.position.z
      const d = Math.hypot(dx, dz)
      if (d < 0.4) continue
      if (!mesh.userData.isBoss) mesh.userData.confusedUntil = now + 0.3
      const step = Math.min(d - 0.3, (mesh.userData.isBoss ? 1.2 : 6) * dt)
      const moved = resolveArenaMove({ x: mesh.position.x, z: mesh.position.z }, { x: (dx / d) * step, z: (dz / d) * step }, mesh.userData.radius ?? 0.6, game.obstacles)
      mesh.position.x = moved.x
      mesh.position.z = moved.z
    }
    return true
  })
}
// Rebirth: the fire nova Phoenix Phoebe rises from (and her Phoenix Dive).
function phoenixNova(at, radius, damage, toast) {
  const glow = heroLook().glow
  burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, 0xff6a2a, 50, radius * 1.3, 0.5)
  burst(particleSystem, { x: at.x, y: 1.6, z: at.z }, glow, 30, radius * 0.8, 0.7)
  column(at.x, at.z, 0xffb547, 6, 12)
  spawnShockwave(shockwavePool, at.x, at.z, radius, 0xff6a2a)
  warp.add('ripple', at.x, at.z, radius + 1, 0.7)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2, SHAKE_HIT_DURATION * 2)
  sfx.play('cannonball', at)
  if (toast) showLootToast(hud, { title: 'REBIRTH', name: 'Phoenix Phoebe', blurb: 'From the ashes. Again.' })
  for (const mesh of heroTargets(at.x, at.z, radius)) {
    heroHurt(mesh, damage * heroBaseDamage(), 3, at)
    setBurn(mesh, 0.4, 3)
  }
}
// Thousand Cuts: flash from monster to monster, slashing each.
function thousandCuts(max = tn().max, hop = tn().hop, damage = tn().damage) {
  const p = game.player
  const path = chainPath(livePoints(p.position.x, p.position.z, hop * 2), p.position, max, hop)
  if (path.length < 1) return
  p.invulnerableUntil = Math.max(p.invulnerableUntil, heroNow + path.length * 0.08 + 0.5)
  showPopup(popupPool, p.position, 'THOUSAND CUTS', '', '#ff6a6a')
  path.forEach((target, i) => heroState.pending.push({
    at: heroNow + 0.05 + i * 0.08,
    run: () => {
      if (!alive(target.mesh) || game.player.hp <= 0 || game.player.falling || game.player.hidden) return
      const from = { x: game.player.position.x, z: game.player.position.z }
      const m = target.mesh.position
      const dx = m.x - from.x
      const dz = m.z - from.z
      const d = Math.hypot(dx, dz) || 1
      // Land just past it, on the far side, facing on.
      const past = (target.mesh.userData.radius ?? 0.6) + PLAYER_RADIUS + 0.3
      const to = resolveArenaMove(from, { x: dx + (dx / d) * past, z: dz + (dz / d) * past }, PLAYER_RADIUS, game.obstacles)
      const landing = clampToPlatform(to, ARENA_RADIUS - 1)
      sparkLine(from, landing, heroLook().glow, 10)
      sparkLine(from, landing, 0xffffff, 5, 1.2)
      game.player.position = { x: landing.x, z: landing.z }
      game.player.mesh.position.x = landing.x
      game.player.mesh.position.z = landing.z
      game.player.facing = Math.atan2(dx, dz)
      sfx.play('swing', landing)
      heroHurt(target.mesh, damage * heroBaseDamage(), 1.5, from)
    },
  }))
}
const heroTargets = (x, z, radius) =>
  game.monsters.filter((m) => !m.userData.dying && !m.userData.spawning && !m.userData.falling && Math.hypot(m.position.x - x, m.position.z - z) < radius + (m.userData.radius ?? 0.5))
function phaseBurst(at, t = tn()) {
  burst(particleSystem, { x: at.x, y: 0.6, z: at.z }, heroLook().glow, 26, t.radius * 1.5, 0.4)
  spawnShockwave(shockwavePool, at.x, at.z, t.radius + 0.2, heroLook().glow)
  for (const mesh of heroTargets(at.x, at.z, t.radius)) heroHurt(mesh, t.damage * heroBaseDamage())
}
function onHeroDash(start, now) {
  const trait = heroTrait()
  const t = tn()
  if (trait === 'slipstream') {
    heroState.slipUntil = now + t.time
    heroState.slipHaste = t.haste
    if (t.gust) sonicBoom(start, 3, t.gust)
  }
  if (trait === 'ram') sonicBoom(start, t.boomRadius, t.boomDamage)
  if (trait === 'phase') {
    phaseBurst(start, t)
    if (t.endBurst) heroState.pending.push({ at: now + 0.2, run: () => phaseBurst({ x: game.player.position.x, z: game.player.position.z }) })
  }
}
// A pool of plague ooze (Contagion), hitting every monster in it every 0.5 s.
function addCloud(at, t = tn()) {
  if (heroState.clouds.length >= t.cap) return
  heroState.clouds.push({ x: at.x, z: at.z, until: heroNow + t.life, next: heroNow + 0.25, radius: t.radius, damage: t.damage })
  setPoisonGlow(contagionPool, heroLook().glow)
  lobPoison(contagionPool, { x: at.x, z: at.z, tx: at.x, tz: at.z, flight: 0.001, radius: t.radius, life: t.life, tick: 99, damage: 0 })
}
function boneBurst(at, t = tn()) {
  burst(particleSystem, { x: at.x, y: 0.7, z: at.z }, heroLook().trim, 22, 5, 0.3)
  burst(particleSystem, { x: at.x, y: 0.7, z: at.z }, heroLook().glow, 10, 3, 0.4)
  spawnShockwave(shockwavePool, at.x, at.z, t.radius, heroLook().trim)
  for (const mesh of heroTargets(at.x, at.z, t.radius)) heroHurt(mesh, t.damage * heroBaseDamage(), 1, at)
}
function onHeroKill(mesh, position) {
  const trait = heroTrait()
  const t = tn()
  const at = { x: position.x, z: position.z }
  heroState.kills++
  if (trait === 'pellet' && heroState.kills % t.every === 0) heroState.pending.push({ at: heroNow + 0.05, run: () => powerPellet(t) })
  if (trait === 'orbital' && heroState.kills % t.every === 0) heroState.pending.push({ at: heroNow + 0.1, run: () => paintOrbital(at) })
  if (trait === 'seconds' && heroState.kills % t.every === 0 && game.player.hp > 0) {
    const p = game.player
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * t.heal)
    burst(particleSystem, { x: p.position.x, y: 1.4, z: p.position.z }, heroLook().glow, 16, 2.5, 0.6)
    showPopup(popupPool, p.position, 'FLAMBÉ!', `+${Math.round(p.maxHp * t.heal)} HP`, '#ffb547')
    heroState.pending.push({ at: heroNow + 0.05, run: () => flambe(at) })
  }
  if (trait === 'lucky' && Math.random() < t.chance) heroState.pending.push({ at: heroNow + 0.06, run: () => motherLode(at) })
  if (trait === 'tipjar' && game.chainState.count >= t.minChain) {
    const tip = Math.max(1, tipJarCrystals(game.chainState.count)) * t.tipMult
    dropCrystals(crystalSystem, position.x, position.z, Array(tip).fill(1))
    const targets = heroTargets(position.x, position.z, 8).filter((m) => m !== mesh).sort((a, b) => distTo(a, at) - distTo(b, at)).slice(0, t.cases)
    for (const target of targets) flingSuitcase(at, target, t.damage)
  }
  if (trait === 'corpse') heroState.pending.push({ at: heroNow + 0.08, run: () => boneBurst(at) })
  // A splash of poison where it died; anything that dies in the puddle leaves one of its own.
  if (trait === 'contagion') addCloud(at, t)
  // Awakened Kindling: whatever dies burning bursts into flame and lights its neighbours.
  if (trait === 'kindling' && t.spread && mesh.userData.burn && heroNow < mesh.userData.burn.until) heroState.pending.push({ at: heroNow + 0.08, run: () => flambe(at, 1, 3.5) })
  // Awakened Hexed: a cursed monster's death curses everything near it.
  if (trait === 'hex' && t.spread && heroNow < (mesh.userData.hexUntil ?? -Infinity)) {
    burst(particleSystem, { x: at.x, y: 1, z: at.z }, heroLook().glow, 20, t.spread, 0.6)
    spawnShockwave(shockwavePool, at.x, at.z, t.spread, heroLook().glow)
    for (const m of heroTargets(at.x, at.z, t.spread)) m.userData.hexUntil = heroNow + t.time
  }
  // Awakened Backstab: a backstab kill and you melt into the shadows.
  if (trait === 'backstab' && t.vanish && heroNow - (mesh.userData.backstabAt ?? -Infinity) < 0.2) {
    game.player.ghostUntil = Math.max(game.player.ghostUntil ?? -Infinity, heroNow + t.vanish)
  }
}
function flingSuitcase(from, target, damage) {
  const to = { x: target.position.x, z: target.position.z }
  launchFlyer({ kind: 'suitcase', color: heroLook().trim, duration: 0.35, radius: 0.9, damage: damage * heroBaseDamage(), knockback: 5, spin: 9, point: (k) => ({ x: from.x + (to.x - from.x) * k, z: from.z + (to.z - from.z) * k }), arc: 1.2 })
}

// ---- legendary heroes ----
// Shiro's Infinity (every frame): monsters are held at the edge of the gap, enemy orbs vanish before they land.
function stepInfinity(player, now, t) {
  if (player.hp <= 0 || player.falling || player.hidden) return
  // Nerfed: Infinity only flickers on for `on` seconds out of every `on + off`.
  const up = now % (t.on + t.off) < t.on
  if (up !== heroState.infinityUp) {
    heroState.infinityUp = up
    if (up) {
      sparkRing(player.position.x, player.position.z, t.wall + 0.5, heroLook().glow)
    }
  }
  if (!up) return
  const c = player.position
  destroyProjectilesNear(projectilePool, c.x, c.z, t.orbRadius)
  for (const mesh of heroTargets(c.x, c.z, t.wall + 1)) {
    if (mesh.userData.isBoss) continue // bosses walk straight through it
    const to = infinityPush(c, mesh.position, t.wall, mesh.userData.radius ?? 0.5)
    if (!to) continue
    const k = 1
    const moved = resolveArenaMove({ x: mesh.position.x, z: mesh.position.z }, { x: (to.x - mesh.position.x) * k, z: (to.z - mesh.position.z) * k }, mesh.userData.radius ?? 0.6, game.obstacles)
    mesh.position.x = moved.x
    mesh.position.z = moved.z
    if (now >= heroState.infinityFxAt) {
      heroState.infinityFxAt = now + 0.15
      const dx = mesh.position.x - c.x
      const dz = mesh.position.z - c.z
      const d = Math.hypot(dx, dz) || 1
      burst(particleSystem, { x: c.x + (dx / d) * t.wall, y: 1, z: c.z + (dz / d) * t.wall }, heroLook().glow, 6, 1.2, 0.3)
    }
  }
}
// Blue: a quick vortex on the target that drags in and crushes; awakened, Red follows down the aim.
function castBlue(at, t = tn()) {
  openBlackHole(at, { pull: t.pull, blast: t.blast, damage: t.damage, life: t.life }, 'BLUE', 0x3a8aff)
  if (!t.red) return
  heroState.pending.push({
    at: heroNow + t.life + 0.1,
    run: () => {
      const p = game.player.position
      const aim = heroAimAngle()
      showPopup(popupPool, p, 'REVERSAL: RED', '', '#ff3a4a')
      pointsAlong(p, aim, t.red, 3, 2.5).forEach((pt, i) => heroState.pending.push({ at: heroNow + i * 0.08, run: () => heroNova(pt, 2.8, 1.5, 7, 0xff3a4a) }))
    },
  })
}
// Hollow Violet: blue and red converge on you, then an enormous violet mass tears down the aim.
function hollowViolet(aim) {
  const p = game.player.position
  const from = { x: p.x, z: p.z }
  for (const [c, side] of [[0x3a8aff, -1], [0xff3a4a, 1]]) {
    burst(particleSystem, { x: from.x + Math.cos(aim) * side * 1.5, y: 1.4, z: from.z - Math.sin(aim) * side * 1.5 }, c, 30, 1.2, 0.5)
  }
  showPopup(popupPool, from, 'HOLLOW VIOLET', '', '#b44aff')
  sfx.play('hyperspace', from)
  heroState.pending.push({
    at: heroNow + 0.5,
    run: () => {
      const start = { x: game.player.position.x, z: game.player.position.z }
      triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2.5, SHAKE_HIT_DURATION * 2)
      sfx.play('bossSlam', start)
      launchFlyer({
        kind: 'violet', color: 0xb44aff, duration: 1.1, radius: 2.4, damage: 3 * heroBaseDamage(), knockback: 5, spin: 3, angle: aim,
        point: (k) => linePoint(start, aim, k, 20),
        onStep: (f, at, now) => {
          destroyProjectilesNear(projectilePool, at.x, at.z, 3.5)
          burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, 0xb44aff, 4, 3, 0.4)
          if (now >= (f.warpAt ?? 0)) {
            f.warpAt = now + 0.2
            warp.add('swirl', at.x, at.z, 4, 0.4)
          }
        },
        onEnd: (at) => heroNova(at, 4, 0, 0, 0xb44aff),
      })
    },
  })
}
// Fuse Arrows: bomb arrows that blow up on the first monster they reach (or at the end of their flight).
function fireFuseArrows(aim, t = tn()) {
  const p = game.player.position
  const from = { x: p.x, z: p.z }
  sfx.play('swing', from)
  for (const angle of fanAngles(aim, t.arrows, 0.45)) {
    launchFlyer({
      kind: 'arrow', color: 0xff8a1a, duration: t.reach / 32, radius: 0.8, damage: 0.4 * heroBaseDamage(), knockback: 1, spin: 0, angle, stopOnHit: true,
      point: (k) => linePoint(from, angle, k, t.reach),
      onEnd: (at) => heroNova(at, t.radius, t.damage, 3, 0xffb547),
    })
  }
}
// Spartan Rage is running right now (Ragnar Ashfather).
function heroRaging(now) {
  return heroTrait() === 'spartan' && now < heroState.rageUntil
}
// Ragnar's rage bar under the health bar: fills with rage, then drains over the rage's time.
const rageMeter = { root: document.getElementById('rage-meter'), fill: document.getElementById('rage-fill'), label: document.getElementById('rage-label'), key: '' }
function updateRageMeter(now) {
  if (!rageMeter.root) return
  const on = heroTrait() === 'spartan'
  const raging = on && now < heroState.rageUntil
  const t = on ? tn() : null
  const frac = !on ? 0 : raging ? (heroState.rageUntil - now) / t.time : heroState.rage / t.max
  const text = !on ? '' : raging ? `Enraged! ${Math.ceil(heroState.rageUntil - now)}s` : `Rage ${Math.floor(heroState.rage)} / ${t.max}`
  const key = `${on}|${raging}|${Math.round(frac * 200)}|${text}`
  if (key === rageMeter.key) return
  rageMeter.key = key
  rageMeter.root.classList.toggle('on', on)
  rageMeter.root.classList.toggle('raging', raging)
  rageMeter.fill.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`
  rageMeter.label.textContent = text
}
// Spartan Rage: full rage turns you loose.
function startRage(t = tn()) {
  const p = game.player.position
  heroState.rage = 0
  heroState.rageUntil = heroNow + t.time
  heroNova({ x: p.x, z: p.z }, 3.5, 0, 6, 0xff3a1a)
  column(p.x, p.z, 0xff3a1a, 4, 8)
  showPopup(popupPool, p, 'SPARTAN RAGE', '', '#ff3a1a')
  showLootToast(hud, { title: 'SPARTAN RAGE', name: 'Ragnar Ashfather', blurb: `+${Math.round((t.bonus - 1) * 100)}% damage, ${Math.round((1 - t.guard) * 100)}% less damage taken, faster for ${t.time} s. Every hit heals.` })
}
// Blades of Chaos: two burning chained blades whirl twice around you.
function bladesOfChaos(aim) {
  const player = game.player
  for (const offset of [0, Math.PI]) {
    launchFlyer({
      kind: 'axe', color: 0xff6a1a, duration: 1.4, legs: 2, radius: 1.4, damage: 2 * heroBaseDamage(), knockback: 3, spin: 16,
      point: (k) => {
        const a = aim + offset + k * Math.PI * 4
        const r = 5.5 * Math.min(1, k * 5)
        return { x: player.position.x + Math.sin(a) * r, z: player.position.z + Math.cos(a) * r }
      },
      onHit: (m) => setBurn(m, 0.6, 4),
    })
  }
  sfx.play('swing', player.position)
  startRage(traitTune('spartan', true))
}
// Glory Kill: finish a staggered monster on the spot; it bursts into health and crystals.
function gloryKill(mesh, t = tn()) {
  if (!alive(mesh) || mesh.userData.immune) return
  const player = game.player
  const at = { x: mesh.position.x, z: mesh.position.z }
  burst(particleSystem, { x: at.x, y: 1, z: at.z }, 0xff2a2a, 30, 4, 0.5)
  burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, 0x7dffa0, 14, 3, 0.6)
  showPopup(popupPool, at, 'GLORY KILL', '', '#ff3a3a')
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 1.5, SHAKE_HIT_DURATION)
  heroHurt(mesh, (mesh.userData.hp ?? 1) + 1, 3)
  if (player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * t.heal)
  dropCrystals(crystalSystem, at.x, at.z, Array(t.gems).fill(1))
}
// The Big Fusion Gun: a slow orb that zaps everything near as it flies, then detonates.
function bigFusionGun(aim) {
  const p = game.player.position
  const from = { x: p.x, z: p.z }
  const green = 0x6fff6a
  sfx.play('hyperspace', from)
  launchFlyer({
    kind: 'orb', color: green, duration: 2.2, radius: 1.2, damage: heroBaseDamage(), knockback: 1, spin: 4, angle: aim,
    point: (k) => linePoint(from, aim, k, 26),
    onStep: (f, at, now) => {
      if (now < (f.zapAt ?? 0)) return
      f.zapAt = now + 0.25
      for (const mesh of heroTargets(at.x, at.z, 6)) {
        sparkLine(at, mesh.position, green, 6)
        heroHurt(mesh, 0.6 * heroBaseDamage(), 0.5, at)
      }
    },
    onEnd: (at) => heroNova(at, 6, 5, 5, green),
  })
}
// Ground Pound: bounce onto the target and flatten everything round it.
function groundPound(mesh, t = tn()) {
  const player = game.player
  if (!alive(mesh) || player.hp <= 0 || player.falling || player.hidden) return
  const from = { x: player.position.x, z: player.position.z }
  const at = { x: mesh.position.x, z: mesh.position.z }
  const dx = at.x - from.x
  const dz = at.z - from.z
  const d = Math.hypot(dx, dz) || 1
  const stop = Math.max(0, d - (mesh.userData.radius ?? 0.6) - PLAYER_RADIUS - 0.2)
  const landing = clampToPlatform(resolveArenaMove(from, { x: (dx / d) * stop, z: (dz / d) * stop }, PLAYER_RADIUS, game.obstacles), ARENA_RADIUS - 1)
  for (let i = 1; i <= 8; i++) {
    const k = i / 8
    burst(particleSystem, { x: from.x + (landing.x - from.x) * k, y: 1 + Math.sin(Math.PI * k) * 2.5, z: from.z + (landing.z - from.z) * k }, 0xffd15c, 1, 0.3, 0.25)
  }
  player.position = { x: landing.x, z: landing.z }
  player.mesh.position.x = landing.x
  player.mesh.position.z = landing.z
  player.invulnerableUntil = Math.max(player.invulnerableUntil, heroNow + 0.3)
  showPopup(popupPool, at, 'BOING!', 'GROUND POUND', '#ffd15c')
  heroNova(at, t.radius, t.damage, 2, 0xffd15c, (m) => {
    if (!m.userData.isBoss) m.userData.confusedUntil = heroNow + t.daze
    dropCrystals(crystalSystem, m.position.x, m.position.z, Array(t.coins).fill(1))
  })
}
// Power Pellet: monsters panic, and touching one chomps it.
function powerPellet(t = tn()) {
  const p = game.player.position
  heroState.pelletUntil = heroNow + t.time
  heroState.pellet = t
  showPopup(popupPool, p, 'WAKA WAKA!', 'POWER PELLET', '#fff27a')
  burst(particleSystem, { x: p.x, y: 1, z: p.z }, 0xfff27a, 30, 4, 0.5)
  spawnShockwave(shockwavePool, p.x, p.z, 6, 0x3a5aff)
  sfx.play('waveCleared', p)
}
// Super Star and Power Pellet: touching monsters hurts them (each at most every 0.45 s); the pellet also scares them.
function stepTouchPowers(player, now) {
  const star = now < heroState.starUntil
  const pellet = now < heroState.pelletUntil && heroState.pellet
  if (!star && !pellet) return
  const c = player.position
  if (Math.random() < 0.7) burst(particleSystem, { x: c.x, y: 1, z: c.z }, star ? [0xff4fa3, 0xfff27a, 0x6fe3ff, 0x7dffa0][Math.floor(now * 12) % 4] : 0xfff27a, 2, 1.2, 0.3)
  if (pellet && now >= heroState.panicNext) {
    heroState.panicNext = now + 0.3
    for (const mesh of heroTargets(c.x, c.z, heroState.pellet.radius)) {
      if (mesh.userData.isBoss) continue
      mesh.userData.confusedUntil = Math.max(mesh.userData.confusedUntil ?? 0, now + 0.45)
      if (Math.random() < 0.3) burst(particleSystem, { x: mesh.position.x, y: 1.4, z: mesh.position.z }, 0x3a5aff, 3, 0.8, 0.4)
    }
  }
  if (player.hp <= 0 || player.hidden || player.falling) return
  for (const mesh of heroTargets(c.x, c.z, PLAYER_RADIUS + 0.6)) {
    if (now < (mesh.userData.touchHitAt ?? -Infinity)) continue
    mesh.userData.touchHitAt = now + 0.45
    const dmg = star ? 2 : heroState.pellet.damage
    heroHurt(mesh, dmg * heroBaseDamage(), star ? 10 : 4, c)
    burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, star ? 0xffffff : 0xfff27a, 12, 3, 0.4)
    if (!star) showPopup(popupPool, mesh.position, 'CHOMP!', '', '#fff27a')
    sfx.play(star ? 'cannonball' : 'crystal', mesh.position)
  }
}
// Primed TNT: blocks that blink faster and faster, then blow.
function dropTnt(at, t = tn()) {
  for (let i = 0; i < t.blocks; i++) {
    const a = Math.random() * Math.PI * 2
    const spot = i ? { x: at.x + Math.sin(a) * 1.6, z: at.z + Math.cos(a) * 1.6 } : { x: at.x, z: at.z }
    const fuse = t.fuse + i * 0.25
    launchFlyer({
      kind: 'tnt', color: 0xd8302a, duration: fuse, radius: 0, damage: 0, noHit: true, spin: 0, angle: Math.random() * Math.PI, y: 0,
      point: () => spot,
      onStep: (f, pos, now, k) => {
        f.mesh.userData.setBlink?.(Math.floor(k * k * 14) % 2 === 1)
        if (Math.random() < 0.3) burst(particleSystem, { x: pos.x, y: 0.95, z: pos.z }, 0xffb547, 1, 0.5, 0.25)
      },
      onEnd: (pos) => heroNova(pos, t.radius, t.damage, 4, 0xff6a2a),
    })
  }
  sfx.play('podIn', at)
}
// Wave Fist: a blue fireball down the aim.
function waveFist(aim, t = tn()) {
  const p = game.player.position
  const from = { x: p.x, z: p.z }
  showPopup(popupPool, from, 'HADO!', '', hexColor(heroLook().glow))
  sfx.play('swing', from)
  launchFlyer({
    kind: 'fireball', color: heroLook().glow, duration: t.reach / 24, radius: 0.9 * t.size, damage: t.damage * heroBaseDamage(), knockback: 6, spin: 0, angle: aim, scale: t.size,
    stopOnHit: !t.pierce, point: (k) => linePoint(from, aim, k, t.reach),
    onEnd: (at) => burst(particleSystem, { x: at.x, y: 1, z: at.z }, heroLook().glow, 18, 3, 0.4),
  })
}
// Heaven Wave: a straight wave beam that hits everything along it.
function waveBeam(aim, reach, damage, width, label) {
  const p = game.player
  const from = { x: p.position.x, z: p.position.z }
  const glow = heroLook().glow
  addBeam(glow, reach, width * 0.7, 0.7, (mesh) => {
    mesh.position.set(from.x + Math.sin(aim) * 0.5, p.mesh.position.y + 1, from.z + Math.cos(aim) * 0.5)
    mesh.rotation.y = aim
  })
  warp.add('ripple', from.x + Math.sin(aim) * reach * 0.5, from.z + Math.cos(aim) * reach * 0.5, reach * 0.4, 0.5)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2, SHAKE_HIT_DURATION * 1.5)
  sfx.play('bossSlam', from)
  showPopup(popupPool, from, label, '', hexColor(glow))
  for (const mesh of heroTargets(from.x, from.z, reach + 2)) {
    if (inBeam(from, aim, mesh.position, reach, width + (mesh.userData.radius ?? 0.5))) heroHurt(mesh, damage * heroBaseDamage(), 8, from)
  }
}
// Inhale: suck everything near to you, gulp, then spit stars down the aim.
function inhale(t = tn(), life = 0.6) {
  const p = game.player.position
  openBlackHole({ x: p.x, z: p.z }, { pull: t.radius, blast: 2.5, damage: 0.5, life }, 'INHALE!', 0xffa0c8)
  heroState.pending.push({
    at: heroNow + life + 0.05,
    run: () => {
      const pl = game.player
      if (pl.hp <= 0 || pl.hidden) return
      const from = { x: pl.position.x, z: pl.position.z }
      const aim = heroAimAngle()
      sfx.play('cannonball', from)
      for (const a of fanAngles(aim, t.stars, 0.6)) {
        launchFlyer({ kind: 'star', color: heroLook().trim, duration: 0.7, radius: 1.1, damage: t.damage * heroBaseDamage(), knockback: 4, spin: 12, point: (k) => linePoint(from, a, k, 16) })
      }
    },
  })
}
// Charge Shot: a pierce-everything plasma shot when the cannon is full.
function fireChargeShot(aim, t = tn()) {
  const p = game.player.position
  const from = { x: p.x, z: p.z }
  const glow = heroLook().glow
  burst(particleSystem, { x: from.x + Math.sin(aim), y: 1, z: from.z + Math.cos(aim) }, glow, 14, 2.5, 0.3)
  sfx.play('cannonball', from)
  launchFlyer({ kind: 'plasma', color: glow, duration: t.reach / 34, radius: t.width, damage: t.damage * heroBaseDamage(), knockback: 3, spin: 0, angle: aim, scale: t.width / 1.2, point: (k) => linePoint(from, aim, k, t.reach) })
}
// Every frame: Infinity, rage hurt-gain and glow, the touch powers.
function stepLegendaryHeroes(player, now, dt, trait, t) {
  if (trait === 'limitless') stepInfinity(player, now, t)
  if (trait === 'heavenly') stepHeavenly(player, now, t)
  if (trait === 'twilight') stepTwilight(player, now, dt, t)
  if (trait === 'stormbound') stepStormbound(player, now, t)
  applyFlight(player, now, trait === 'heavenly' || trait === 'twilight')
  if (trait === 'spartan' && now < heroState.rageUntil && Math.random() < 0.5) {
    burst(particleSystem, { x: player.position.x, y: 1.2, z: player.position.z }, 0xff3a1a, 2, 1, 0.4)
  }
  stepTouchPowers(player, now)
}

// ---- the secret hero: the Nimbus Sovereign (claim every Nimbus Crown in the Wilds) ----
const SOVEREIGN_HOVER = 0.55 // how high the Sovereign floats over the ground
const SOVEREIGN_CLIMB = 10 // Wilds: holding Space with the wings open climbs this fast (m/s)
const ASCEND = { rise: 0.5, hang: 0.3, dive: 0.25, height: 8, radius: 6, damage: 3, lances: 6, lanceDamage: 1.2 }
const isFlyer = () => heroTrait() === 'heavenly' || heroTrait() === 'twilight'
// Twilight Regency: the sky swaps between dawn (even phases) and dusk every `phase` s.
const twilightDawn = (t) => Math.floor(heroNow / t.phase) % 2 === 0
// Dawn: seraphs lance nearby monsters and you regenerate; dusk's power lives in the damage / on-hit hooks.
function stepTwilight(player, now, dt, t) {
  if (!twilightDawn(t) || player.hp <= 0 || player.falling || player.hidden) return
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * t.regen * dt)
  stepHeavenly(player, now, t)
}
// Heavenly Host: on each tick every seraph lances a monster in range (the nearest first, spread over them).
function stepHeavenly(player, now, t) {
  if (player.hp <= 0 || player.falling || player.hidden || now < heroState.seraphReady) return
  const c = player.position
  const pool = heroTargets(c.x, c.z, t.range).sort((a, b) => distTo(a, c) - distTo(b, c))
  if (!pool.length) return
  heroState.seraphReady = now + t.every
  for (let i = 0; i < t.seraphs; i++) {
    const m = pool[i % pool.length]
    heroState.pending.push({ at: now + i * 0.09, run: () => seraphLance(i, t.seraphs, m, t.damage, t) })
  }
}
// One lance of light from a seraph orb into a monster; awakened, every judgeEvery-th one is a Pillar of Judgment.
function seraphLance(i, n, mesh, damage, t = tn()) {
  if (!alive(mesh) || !game.player) return
  const pl = game.player
  const a = heroNow * 1.4 + (i / n) * Math.PI * 2
  const from = new THREE.Vector3(pl.position.x + Math.cos(a) * 1.45, pl.mesh.position.y + 0.75, pl.position.z + Math.sin(a) * 1.45)
  const to = new THREE.Vector3(mesh.position.x, mesh.position.y + 0.6, mesh.position.z)
  const glow = heroLook().glow
  addBeam(glow, Math.max(0.5, from.distanceTo(to)), 0.08, 0.2, (beam) => {
    beam.position.copy(from)
    beam.lookAt(to)
    // Soft lances: a tinted core at low strength, so a volley of them doesn't bloom out the screen.
    beam.children[0].material.color.set(glow)
    const fade = beam.userData.setFade
    beam.userData.setFade = (f) => fade(f * 0.35)
  })
  burst(particleSystem, { x: to.x, y: 1, z: to.z }, glow, 8, 1.6, 0.3)
  heroState.lances++
  if (t.judgeEvery && heroState.lances % t.judgeEvery === 0) {
    const at = { x: mesh.position.x, z: mesh.position.z }
    showPopup(popupPool, at, 'JUDGMENT', '', '#fff2a8')
    lightningStrike(at, 0xfff2a8, t.judgeRadius, t.judgeDamage)
    return
  }
  heroHurt(mesh, damage * heroBaseDamage(), 0.6, pl.position)
}
// Ascension (B): soar straight up, hang a moment, then fall like a star onto the aim point.
function ascension(now) {
  const pl = game.player
  const p = { x: pl.position.x, z: pl.position.z }
  heroState.ascend = { start: now, to: heroAimPoint(HERO_ABILITIES.sovereign.range), from: null }
  pl.invulnerableUntil = Math.max(pl.invulnerableUntil, now + ASCEND.rise + ASCEND.hang)
  const glow = heroLook().glow
  column(p.x, p.z, glow, 9, 16)
  sparkRing(p.x, p.z, 2.5, 0xffffff)
  spawnShockwave(shockwavePool, p.x, p.z, 4, glow)
  sfx.play('hyperspace', p)
}
// The Ascension's height this frame (0 when not ascending); moves you during the dive and crashes at the end.
function stepAscension(now) {
  const a = heroState.ascend
  if (!a) return 0
  const pl = game.player
  if (pl.hp <= 0 || pl.hidden || pl.falling) {
    heroState.ascend = null
    return 0
  }
  const t = now - a.start
  if (t < ASCEND.rise) {
    const k = t / ASCEND.rise
    if (Math.random() < 0.6) burst(particleSystem, { x: pl.position.x, y: k * ASCEND.height, z: pl.position.z }, heroLook().glow, 2, 1, 0.4)
    return ASCEND.height * (1 - (1 - k) * (1 - k))
  }
  if (t < ASCEND.rise + ASCEND.hang) return ASCEND.height + Math.sin((t - ASCEND.rise) * 12) * 0.1
  if (!a.from) a.from = { x: pl.position.x, z: pl.position.z }
  const k = Math.min(1, (t - ASCEND.rise - ASCEND.hang) / ASCEND.dive)
  const want = { x: a.from.x + (a.to.x - a.from.x) * k, z: a.from.z + (a.to.z - a.from.z) * k }
  const moved = clampToPlatform(resolveArenaMove(pl.position, { x: want.x - pl.position.x, z: want.z - pl.position.z }, PLAYER_RADIUS, game.obstacles), ARENA_RADIUS - 1)
  pl.position = { x: moved.x, z: moved.z }
  pl.mesh.position.x = moved.x
  pl.mesh.position.z = moved.z
  burst(particleSystem, { x: moved.x, y: ASCEND.height * (1 - k * k) + 0.5, z: moved.z }, 0xffffff, 3, 0.8, 0.3)
  if (k < 1) return ASCEND.height * (1 - k * k)
  heroState.ascend = null
  heroNow = now
  const at = { x: moved.x, z: moved.z }
  const glow = heroLook().glow
  showPopup(popupPool, at, 'STARFALL', 'ASCENSION', '#fff2a8')
  column(at.x, at.z, 0xffffff, 10, 14)
  heroNova(at, ASCEND.radius, ASCEND.damage, 6, glow)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2.5, SHAKE_HIT_DURATION * 2)
  input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
  heroTargets(at.x, at.z, 14).sort((m1, m2) => distTo(m1, at) - distTo(m2, at)).slice(0, ASCEND.lances)
    .forEach((m, i) => heroState.pending.push({ at: now + 0.15 + i * 0.07, run: () => seraphLance(i, ASCEND.lances, m, ASCEND.lanceDamage) }))
  return 0
}
// Every frame: the Sovereign floats (plus the Ascension's height). In the Wilds and the water rooms the base height
// was already set this frame, so the lift is added; on the sundeck / labyrinth it's set outright (and reset once
// you switch to a hero who walks).
function applyFlight(player, now, flyer) {
  let lift = 0
  if (flyer && !player.falling && !player.hidden && player.hp > 0 && !waterState.diving) lift = SOVEREIGN_HOVER + Math.sin(now * 2.4) * 0.08 + stepAscension(now)
  else heroState.ascend = null
  if (player.falling) {
    heroState.flyLift = 0
    return
  }
  if (game.world || waterRoom()) player.mesh.position.y += lift
  else if (lift || heroState.flyLift) player.mesh.position.y = lift
  heroState.flyLift = lift
}

// ---- hero ultimates (K), a mastery-8 run pick (logic/heroUltimates.js) ----
function triggerUltimate(now) {
  const heroId = heroProfile().hero
  const def = HERO_ULTIMATES[heroId]
  const player = game.player
  if (!def || player.hidden || player.hp <= 0 || player.falling) return
  if (!ultimateUnlocked()) {
    if (now - masteryRun.lockedToastAt > 3) {
      masteryRun.lockedToastAt = now
      const level = heroMasteryLevel()
      showLootToast(hud, level >= ULTIMATE_LEVEL
        ? { title: 'ULTIMATE NOT PICKED', name: def.name, blurb: 'You did not pick this hero\'s ultimate for this run. Pick it at the start of your next run.' }
        : { title: 'ULTIMATE LOCKED', name: def.name, blurb: `Reach mastery ${ULTIMATE_LEVEL} with ${heroById(heroId).name} to unlock it (now level ${level}).` })
    }
    return
  }
  const used = useUltimate(heroId, true, now, masteryRun.ultReady, activeFx(game.inventory.equipped).haste)
  if (!used.used) return
  masteryRun.ultReady = used.readyAt
  heroNow = now
  const p = { x: player.position.x, z: player.position.z }
  coop?.sendHeroAbility(heroId, heroLook().id, heroAimAngle(), true)
  showPopup(popupPool, player.position, def.name.toUpperCase(), 'ULTIMATE', '#ff5fa8')
  showLootToast(hud, { title: 'ULTIMATE', name: def.name, blurb: def.desc })
  column(p.x, p.z, heroLook().glow, 7, 16)
  warp.add('swirl', p.x, p.z, 6, 0.8)
  triggerShake(game.shake, SHAKE_HIT_MAGNITUDE * 2, SHAKE_HIT_DURATION * 2)
  input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
  sfx.play('hyperspace', p)
  runUltimate(def.steps)
}
// Plays out an ultimate's steps (see logic/heroUltimates.js for the kinds).
function runUltimate(steps) {
  // Delays count from when they're scheduled (heroNow is the play clock), so nested gaps stack properly.
  const later = (delay, run) => (delay > 0 ? heroState.pending.push({ at: heroNow + delay, run }) : run())
  const glow = () => heroLook().glow
  const here = () => ({ x: game.player.position.x, z: game.player.position.z })
  const status = (kind, secs = 3) => (m) => {
    if (kind === 'burn') setBurn(m, 0.8, 6)
    else if (kind === 'freeze') applyFreeze(m.userData, heroNow, secs)
    else if (kind === 'confuse' && !m.userData.isBoss) m.userData.confusedUntil = Math.max(m.userData.confusedUntil ?? -Infinity, heroNow + secs)
    else if (kind === 'slow') applySlow(m.userData, heroNow, 4, 0.4)
    else if (kind === 'hex') m.userData.hexUntil = Math.max(m.userData.hexUntil ?? -Infinity, heroNow + 10)
  }
  const blast = (at, s) => heroNova(at, s.r, s.dmg ?? 0, s.kb ?? 3, glow(), s.status ? status(s.status) : null)
  for (const s of steps) {
    later(s.at ?? 0, () => {
      const p = here()
      const aim = heroAimAngle()
      const gap = s.gap ?? 0
      switch (s.k) {
        case 'nova': blast(p, s); break
        case 'waves': for (let i = 0; i < s.n; i++) later(i * gap, () => blast(here(), s)); break
        case 'ring': ringPoints(p, s.n, s.radius, aim).forEach((pt, i) => later(i * gap, () => blast(pt, s))); break
        case 'line': pointsAlong(p, aim, s.n, s.step, s.step).forEach((pt, i) => later(i * gap, () => blast(pt, s))); break
        case 'strikes': {
          const pool = heroTargets(p.x, p.z, s.range)
          if (s.pick === 'nearest') pool.sort((a, b) => distTo(a, p) - distTo(b, p))
          else if (s.pick === 'farthest') pool.sort((a, b) => distTo(b, p) - distTo(a, p))
          else pool.sort(() => Math.random() - 0.5)
          for (let i = 0; i < s.n && pool.length; i++) {
            const m = pool[i % pool.length]
            later(i * gap, () => {
              if (!alive(m)) return
              const at = { x: m.position.x, z: m.position.z }
              lightningStrike(at, glow(), s.r, s.dmg)
              if (s.status) heroTargets(at.x, at.z, s.r).forEach(status(s.status))
            })
          }
          break
        }
        case 'rain':
          for (let i = 0; i < s.n; i++) {
            later(i * gap, () => {
              const c = here()
              // Half the drops go for a monster in range, the rest land at random.
              const targets = heroTargets(c.x, c.z, s.range)
              const m = i % 2 === 0 && targets.length ? targets[Math.floor(Math.random() * targets.length)] : null
              const a = Math.random() * Math.PI * 2
              const d = Math.sqrt(Math.random()) * s.range
              const at = m ? { x: m.position.x, z: m.position.z } : clampToPlatform({ x: c.x + Math.sin(a) * d, z: c.z + Math.cos(a) * d }, ARENA_RADIUS - 1)
              column(at.x, at.z, glow(), 6, 8)
              blast(at, s)
            })
          }
          break
        case 'hole': {
          const d = Math.min(s.range, 20)
          const at = clampToPlatform({ x: p.x + Math.sin(aim) * d, z: p.z + Math.cos(aim) * d }, ARENA_RADIUS - 1)
          openBlackHole(at, { pull: s.pull, blast: s.blast, damage: s.dmg, life: s.life }, 'SINGULARITY', glow())
          break
        }
        case 'blades':
          for (let i = 0; i < s.n; i++) {
            const offset = (i / s.n) * Math.PI * 2
            launchFlyer({
              kind: 'saber', color: glow(), duration: s.dur, legs: s.turns, radius: 1.5, damage: s.dmg * heroBaseDamage(), knockback: 3, spin: 20,
              point: (k) => {
                const a = aim + offset + k * Math.PI * 2 * s.turns
                const r = s.radius * Math.min(1, k * 6)
                return { x: game.player.position.x + Math.sin(a) * r, z: game.player.position.z + Math.cos(a) * r }
              },
              onHit: s.status ? status(s.status) : null,
            })
          }
          break
        case 'fan':
          for (let i = 0; i < s.n; i++) {
            const a = s.spread >= Math.PI * 2 - 0.01 ? aim + (i / s.n) * Math.PI * 2 : aim + (s.n > 1 ? i / (s.n - 1) - 0.5 : 0) * s.spread
            throwSaber(a, s.reach, s.dmg)
          }
          sfx.play('swing', p)
          break
        case 'pull':
          for (const m of heroTargets(p.x, p.z, s.r)) {
            const d = distTo(m, p)
            if (d < 2 || m.userData.isBoss) continue
            const k = (d - 1.6) / d
            const to = clampToPlatform({ x: m.position.x + (p.x - m.position.x) * k, z: m.position.z + (p.z - m.position.z) * k }, ARENA_RADIUS - 2)
            streak(m.position, to, glow(), 6)
            m.position.x = to.x
            m.position.z = to.z
            m.userData.confusedUntil = Math.max(m.userData.confusedUntil ?? -Infinity, heroNow + 1)
          }
          warp.add('swirl', p.x, p.z, s.r * 0.6, 0.6)
          break
        case 'freeze':
          heroNova(p, s.r, 0, 0, 0x9fe8ff, status('freeze', s.secs))
          break
        case 'confuse':
          heroNova(p, s.r, 0, 0, glow(), status('confuse', s.secs))
          break
        case 'heal': {
          const pl = game.player
          const amount = pl.maxHp * s.frac
          pl.hp = Math.min(pl.maxHp, pl.hp + amount)
          showPopup(popupPool, pl.position, `+${Math.round(amount)} HP`, '', '#7dffa0')
          column(p.x, p.z, 0x7dffb0, 5)
          break
        }
        case 'buff':
          masteryRun.buff = { until: heroNow + s.secs, damage: s.damage, speed: s.speed, guard: s.guard, haste: s.haste, attack: s.attack }
          sparkRing(p.x, p.z, 2.5, glow())
          break
        case 'invuln':
          game.player.invulnerableUntil = Math.max(game.player.invulnerableUntil, heroNow + s.secs)
          break
        case 'timewarp':
          setTimeWarp(Math.max(timeWarp.until, heroNow + s.secs), s.factor)
          break
        case 'cast':
          for (let i = 0; i < s.times; i++) later(i * gap, () => triggerHeroAbility(heroNow, true))
          break
      }
    })
  }
}
// The run-start choice, once your hero is at mastery 8 (normal runs only; the sandbox has every ultimate).
function offerMasteryPick() {
  masteryRun.pick = null
  masteryRun.hero = null
  masteryRun.ultReady = 0
  masteryRun.buff = null
  if (sandbox || tutorial || !started) return
  const heroId = heroProfile().hero
  const ultimate = HERO_ULTIMATES[heroId]
  if (!ultimate || !hasMasteryChoice(heroMasteryLevel())) return
  masteryPanel.show({ heroName: heroById(heroId).name, ultimate })
}

// ---- hero abilities (B), unlocked by awakening at mastery 4 ----
// `free`: an ultimate casting it (no lock, cooldown, popup or co-op message).
function triggerHeroAbility(now, free = false) {
  const heroId = heroProfile().hero
  const def = HERO_ABILITIES[heroId]
  const player = game.player
  if (!def || player.hidden || player.hp <= 0 || player.falling) return
  if (!free && !heroAwake()) {
    if (now - heroState.lockedToastAt > 3) {
      heroState.lockedToastAt = now
      const level = masteryLevel(profile.progress?.mastery?.[heroId] ?? 0)
      showLootToast(hud, { title: 'HERO ABILITY LOCKED', name: def.name, blurb: `Reach mastery ${AWAKEN_LEVEL} with ${heroById(heroId).name} to awaken it (now level ${level}).` })
    }
    return
  }
  if (!free) {
    const used = useHeroAbility(heroId, true, now, heroState.abilityReady, activeFx(game.inventory.equipped).haste)
    if (!used.used) return
    heroState.abilityReady = used.readyAt
    tutorialEvent('ability')
  }
  heroNow = now
  const p = { x: player.position.x, z: player.position.z }
  const aim = heroAimAngle()
  if (!free) coop?.sendHeroAbility(heroId, heroLook().id, aim) // co-op: friends see it go off (onRemoteHeroAbility)
  const glow = heroLook().glow
  const awake = (id) => traitTune(id, true)
  const later = (delay, run) => heroState.pending.push({ at: now + delay, run })
  const heal = (amount) => {
    player.hp = Math.min(player.maxHp, player.hp + amount)
    showPopup(popupPool, player.position, `+${Math.round(amount)} HP`, '', '#7dffa0')
  }
  const nearest = (range, count) => heroTargets(p.x, p.z, range).sort((a, b) => distTo(a, p) - distTo(b, p)).slice(0, count)
  if (!free) showPopup(popupPool, player.position, def.name.toUpperCase(), 'HERO ABILITY', '#ffd15c')
  input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
  switch (heroId) {
    case 'guest': heroNova(p, 6, 2, 5); break
    case 'ember': heroNova(p, 7, 2, 2, 0xff8a3d, (m) => setBurn(m, 0.8, 5)); break
    case 'thorn': rootBurst(9, 4, 1.5, false); heal(30); break
    case 'gale':
      heroNova(p, 6, 1, 8, 0xd8fff0)
      heroState.speedUntil = now + 5
      heroState.slipUntil = now + 5
      heroState.slipHaste = 1.5
      break
    case 'prospector': ringPoints(p, 5, 3.5, aim).forEach((pt, i) => later(i * 0.12, () => motherLode(pt, awake('lucky')))); break
    case 'frost': heroNova(p, 10, 0, 0, 0x9fe8ff, (m) => applyFreeze(m.userData, now, 3.5)); break
    case 'monk': heroNova(p, 6, 3, 3); heroState.focusUntil = now + 8; break
    case 'plague': [p, ...ringPoints(p, 6, 3.8)].forEach((pt) => addCloud(pt, { ...awake('contagion'), cap: 30 })); break
    case 'moon':
      heroTargets(p.x, p.z, 22).sort((a, b) => distTo(b, p) - distTo(a, p)).slice(0, 5)
        .forEach((m, i) => later(i * 0.15, () => alive(m) && lightningStrike({ x: m.position.x, z: m.position.z }, 0xd8e6ff, 2, 3)))
      break
    case 'forge':
      heroNova(p, 5, 2.5, 3, 0xff6a2a)
      heroState.molten = awake('molten').stacks
      heroState.moltenUntil = now + 8
      break
    case 'sun': heroNova(p, 8, 2.5, 3); heal(player.maxHp * 0.4); break
    case 'void': {
      const target = heroAimPoint(def.range)
      phaseBurst(p, awake('phase'))
      const moved = clampToPlatform(resolveArenaMove(player.position, { x: target.x - p.x, z: target.z - p.z }, PLAYER_RADIUS, game.obstacles), ARENA_RADIUS - 1)
      streak(player.position, moved, glow, 12)
      player.position = { x: moved.x, z: moved.z }
      player.mesh.position.x = moved.x
      player.mesh.position.z = moved.z
      player.invulnerableUntil = Math.max(player.invulnerableUntil, now + 0.4)
      phaseBurst(moved, awake('phase'))
      warp.add('swirl', moved.x, moved.z, 4, 0.5)
      break
    }
    case 'lifeguard': blowWhistle(9, 2, 30); break
    case 'bellhop': nearest(12, 8).forEach((m, i) => later(i * 0.08, () => alive(m) && flingSuitcase({ x: game.player.position.x, z: game.player.position.z }, m, 2))); break
    case 'storm': [...heroTargets(p.x, p.z, 14)].sort(() => Math.random() - 0.5).slice(0, 8)
      .forEach((m, i) => later(i * 0.15, () => alive(m) && lightningStrike({ x: m.position.x, z: m.position.z }, glow, 2, 2)))
      break
    case 'bone': heroTargets(p.x, p.z, 10).forEach((m, i) => { const at = { x: m.position.x, z: m.position.z }; later(i * 0.05, () => boneBurst(at, awake('corpse'))) }); break
    case 'dj': for (let i = 0; i < 4; i++) later(i * 0.45, () => bassDrop({ x: game.player.position.x, z: game.player.position.z }, 6, 1.5)); break
    case 'hex':
      heroNova(p, 14, 0, 0, glow, (m) => {
        m.userData.hexUntil = now + 10
        if (!m.userData.isBoss) m.userData.confusedUntil = now + 3
      })
      break
    case 'echo': heroState.echoUntil = now + 6; burst(particleSystem, { x: p.x, y: 1, z: p.z }, glow, 30, 3, 0.6); break
    case 'clock':
      heroNova(p, 14, 0, 0, glow, (m) => applyFreeze(m.userData, now, 3))
      setTimeWarp(Math.max(timeWarp.until, now + 5), 0.35)
      break
    case 'chef': heal(player.maxHp * 0.35); ringPoints(p, 3, 3, aim).forEach((pt, i) => later(0.1 + i * 0.15, () => flambe(pt, 2, 4))); break
    case 'pirate':
      pointsAlong(p, aim, 12, 1.6, 2).forEach((pt, i) => {
        const side = (i % 2 ? 1 : -1) * 1.2
        const spot = { x: pt.x + Math.cos(aim) * side, z: pt.z - Math.sin(aim) * side }
        later(0.07 * i, () => cannonBlast(spot, 2, 2.4))
      })
      break
    case 'rosa': for (let i = 0; i < 3; i++) later(i * 0.5, () => thornBurst(6, 1.5)); heal(20); break
    case 'valet':
      player.ghostUntil = Math.max(player.ghostUntil ?? -Infinity, now + 4)
      heroState.vanishUntil = now + 4
      burst(particleSystem, { x: p.x, y: 1, z: p.z }, 0x2a2a3a, 30, 3, 0.6)
      break
    case 'astro': heroNova(p, 10, 1.5, 14, glow); break
    case 'dread': for (let i = 0; i < 8; i++) throwSaber(aim + (i / 8) * Math.PI * 2, 12, 2); sfx.play('swing', p); break
    case 'odie': for (let i = 0; i < 6; i++) throwBoomerang(aim + (i / 5 - 0.5) * 1.5, { ...awake('boomerang'), reach: 12, count: 1 }); break
    case 'jackpot': nearest(14, 3).forEach((m, i) => { const at = { x: m.position.x, z: m.position.z }; later(i * 0.2, () => jackpotBlast(at, ['7', '7', '7'], awake('jackpot'))) }); break
    case 'magma': ringPoints(p, 18, 4).forEach((pt) => addFootprint(pt.x, pt.z, now, { ...awake('hotfoot'), radius: 1.3 })); sonicBoom(p, 4, 1); break
    case 'hana': fireHook(6, 16, 2, 2.5); break
    case 'rush': pointsAlong(p, aim, 5, 3, 2).forEach((pt, i) => later(i * 0.08, () => sonicBoom(pt, 3.5, 2))); break
    case 'cobalt': pointsAlong(p, aim, 5, 4, 4).forEach((pt, i) => later(i * 0.2, () => callOrbital(pt, 5, 4, 1))); break
    case 'kaiju': startAtomicBreath(awake('atomic').hold); break
    case 'dakota': highNoon(awake('highnoon')); break
    case 'thundra': throwStormHammer(awake('hammer').hover); break
    case 'singularity': openBlackHole(heroAimPoint(def.range), { pull: 16, blast: 7, damage: 6, life: 3 }); break
    case 'phoebe': phoenixNova(p, 7, 4, false); player.invulnerableUntil = Math.max(player.invulnerableUntil, now + 1); break
    case 'kenji': thousandCuts(9, 12, 2.5); break
    case 'shiro': hollowViolet(aim); break
    case 'sovereign': ascension(now); break
    case 'umbral': eclipse(p, 10, 4, 0.12); break
    case 'tempest': calamityCall(p); break
    case 'twilight': {
      eclipse(p, 10, 4, 0.1)
      const tt = awake('twilight')
      heroTargets(p.x, p.z, 14).sort((m1, m2) => distTo(m1, p) - distTo(m2, p)).slice(0, 6)
        .forEach((m, i) => heroState.pending.push({ at: now + 0.15 + i * 0.07, run: () => seraphLance(i, 6, m, 1.2, tt) }))
      break
    }
    case 'ranger':
      setTimeWarp(Math.max(timeWarp.until, now + 3), 0.25)
      warp.add('swirl', p.x, p.z, 6, 1)
      showPopup(popupPool, p, 'FLURRY RUSH', '', '#6fffe0')
      thousandCuts(8, 12, 2)
      break
    case 'ragnar': bladesOfChaos(aim); break
    case 'doomguard': bigFusionGun(aim); break
    case 'paolo':
      heroState.starUntil = now + 6
      heroState.speedUntil = Math.max(heroState.speedUntil, now + 6)
      player.invulnerableUntil = Math.max(player.invulnerableUntil, now + 6)
      showPopup(popupPool, p, 'SUPER STAR!', '', '#fff27a')
      sfx.play('waveCleared', p)
      break
    case 'chompy': powerPellet(awake('pellet')); break
    case 'blox': ringPoints(p, 8, 5, aim).forEach((pt) => dropTnt(pt, { fuse: 1.2, damage: 4, radius: 4, blocks: 1 })); break
    case 'haru': later(0.35, () => waveBeam(heroAimAngle(), 22, 5, 2, 'HEAVEN WAVE')); burst(particleSystem, { x: p.x, y: 1, z: p.z }, glow, 30, 2, 0.5); break
    case 'poppy': inhale({ radius: 14, stars: 5, damage: 3.5 }, 1.1); break
    case 'buster': fanAngles(aim, 5, 0.7).forEach((a) => fireChargeShot(a, awake('charge'))); break
  }
}

// Every frame of play: the look, gear motion, and the traits that run on a clock.
function stepHeroTraits(now, dt) {
  heroNow = now
  redressHero()
  const player = game.player
  player.mesh.userData.heroGear?.userData.animate?.(now, player.speed)
  const trait = heroTrait()
  const t = tn()
  if (player.speed > 0.3) {
    // Awakened Inner Focus lingers a moment after you start moving.
    if (trait === 'focus' && t.linger && now - heroState.stillSince >= t.delay) heroState.focusUntil = Math.max(heroState.focusUntil, now + t.linger)
    heroState.stillSince = now
  }
  if (trait === 'bramble' && player.hp > 0 && player.hp < player.maxHp / 2) player.hp = Math.min(player.maxHp, player.hp + t.regen * dt)
  if (heroState.lastHp !== null && player.hp < heroState.lastHp - 0.5 && trait === 'thorns' && now >= heroState.thornsReady && player.hp > 0) {
    heroState.thornsReady = now + 0.4
    thornBurst()
  }
  if (heroState.lastHp !== null && player.hp < heroState.lastHp - 0.01 && trait === 'molten') {
    heroState.molten = Math.min(t.stacks, (now < heroState.moltenUntil ? heroState.molten : 0) + 1)
    heroState.moltenUntil = Math.max(heroState.moltenUntil, now + t.time)
  }
  if (trait === 'bramble' && rootsTriggered(heroState.lastHp, player.hp, player.maxHp, now, heroState.rootsReady)) {
    heroState.rootsReady = now + t.rootCooldown
    rootBurst()
  }
  // Spartan Rage: taking a hit builds rage fastest.
  if (trait === 'spartan' && heroState.lastHp !== null && player.hp < heroState.lastHp - 0.5 && player.hp > 0 && now >= heroState.rageUntil) {
    const r = addRage(heroState.rage, RAGE_PER_HURT, t.max)
    heroState.rage = r.rage
    if (r.full) startRage(t)
  }
  heroState.lastHp = player.hp
  if (trait === 'hotfoot' || heroState.footprints.length) stepHotFoot(player, now, dt) // Lava Ring's footprints burn out even if you switch away
  if (trait === 'ram') stepRam(player, now)
  const gear = player.mesh.userData.heroGear
  if (gear) {
    gear.userData.charge = trait === 'atomic' ? (heroState.breath ? 1 : heroState.atomic / t.every)
      : trait === 'spartan' ? (now < heroState.rageUntil ? 1 : heroState.rage / t.max)
      : trait === 'charge' ? chargeLevel(now, heroState.chargeAt, t.charge)
      : 0
  }
  stepLegendaryHeroes(player, now, dt, trait, t)
  stepFlyers(now)
  stepYanks(now, dt)
  stepHeroFx(now)
  stepBlackHoles(now, dt)
  stepStormHammer(now, dt)
  stepAtomicBreath(now, dt)
  // Queued trait effects (static arcs, echoes, bass drops, bone bursts).
  if (heroState.pending.length) {
    const due = heroState.pending.filter((p) => now >= p.at)
    heroState.pending = heroState.pending.filter((p) => now < p.at)
    for (const p of due) p.run()
  }
  // Rewind keeps ~3.5 s of where you were and how healthy you were.
  if (trait === 'rewind' && now >= heroState.historyNext && player.hp > 0 && !player.falling) {
    heroState.historyNext = now + 0.25
    heroState.history.push({ t: now, x: player.position.x, z: player.position.z, hp: player.hp })
    while (heroState.history.length && now - heroState.history[0].t > 3.5) heroState.history.shift()
  }
  // Kindling burns.
  for (const mesh of game.monsters) {
    const burn = mesh.userData.burn
    if (!burn) continue
    if (now >= burn.until || mesh.userData.dying) mesh.userData.burn = null
    else if (now >= burn.next) {
      burn.next += 1
      heroHurt(mesh, burn.dps)
      burst(particleSystem, { x: mesh.position.x, y: 1, z: mesh.position.z }, 0xff8a3d, 8, 2, 0.6)
    }
  }
  // Contagion clouds.
  heroState.clouds = heroState.clouds.filter((cloud) => {
    if (now >= cloud.until) return false
    if (now >= cloud.next) {
      cloud.next += 0.5
      burst(particleSystem, { x: cloud.x, y: 0.3, z: cloud.z }, heroLook().glow, 5, 1.2, 0.6)
      for (const mesh of heroTargets(cloud.x, cloud.z, cloud.radius)) heroHurt(mesh, cloud.damage * heroBaseDamage())
    }
    return true
  })
  // Radiance aura.
  if (trait === 'radiance' && now >= heroState.auraNext) {
    heroState.auraNext = now + 0.5
    for (const mesh of heroTargets(player.position.x, player.position.z, t.radius)) {
      heroHurt(mesh, t.damage * heroBaseDamage())
      burst(particleSystem, { x: mesh.position.x, y: 0.9, z: mesh.position.z }, heroLook().glow, 5, 1.5, 0.6)
      if (player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + t.heal)
    }
  }
}

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
  setArenaRadius(worldMode ? WORLD_RADIUS : duelMode ? DUEL_RADIUS : SUNDECK_RADIUS) // (a duel is fought on a smaller deck)
  setDepthsMode(false) // a new run always starts on the surface
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
  dressPlayer(player.mesh, heroLook())
  player.mesh.userData.heroKey = `${heroLook().heroId}:${heroLook().id}`
  resetHeroState()
  applyDifficulty()

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
    game.player.maxHp = Math.max(1, Math.round((PLAYER_MAX_HP + skillEffects(profile.skills).maxHp) * (diff().playerHp ?? 1)))
    game.player.hp = game.player.maxHp
    game.world.fx = createWildsActivities()
    game.arena.group.add(game.world.fx.group)
    game.world.sky.fx = createSkyWorld()
    game.arena.group.add(game.world.sky.fx.group)
    game.world.sky.fx.setRidden(new Set(game.world.journal.towers))
    game.world.sky.fx.setRepaired(new Set(Object.keys(game.world.journal.fixes).filter((id) => game.world.journal.fixes[id].stage === 'done')))
    game.world.caveFx = createCavesFx()
    game.arena.group.add(game.world.caveFx.group)
    game.world.phen = { fx: createPhenomenaFx(), rt: {}, zones: [], cold: 0, speedFactor: 1, nextEmber: 0, nextSpore: 0, nextColdHurt: 0, spawnAt: 0, lastStage: {}, stormKey: '', tracked: null, guide: null }
    game.arena.group.add(game.world.phen.fx.group)
    game.arena.group.add(game.world.phen.fx.deep)
    game.world.towerQuest = { keepers: new Map(), cells: new Map(), group: new THREE.Group(), spawnAt: new Map(), lastStage: new Map() }
    game.arena.group.add(game.world.towerQuest.group)
    game.world.sky.fx.setRelicsTaken(new Set(game.world.journal.relics))
    game.world.sky.pillars = []
    for (const tower of skyTowers()) {
      const pillars = towerObstacles(tower).map((o) => ({ top: tower.y + TOWER_HEIGHT, ...o }))
      game.world.sky.pillars.push(...pillars)
      game.obstacles.push(...pillars)
      game.props.push(...pillars)
    }
    // The caves' rock outcrops are solid too (kept with the towers' pillars: both are surface-only).
    for (const cave of caves()) {
      const rocks = caveObstacles(cave)
      game.world.sky.pillars.push(...rocks)
      game.obstacles.push(...rocks)
      game.props.push(...rocks)
    }
    // The chasms (and, below them, the Depths' Lightroots and Umbral Hearts).
    game.world.depths.fx = createDepthsFx()
    game.arena.group.add(game.world.depths.fx.group)
    game.world.depths.fx.setRelicsTaken(new Set(game.world.journal.depthRelics))
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
  game.player.maxHp = Math.max(1, Math.round((PLAYER_MAX_HP + skillEffects(profile.skills).maxHp) * (diff().playerHp ?? 1)))
  game.player.hp = game.player.maxHp

  camera.position.set(
    player.position.x + CAMERA_OFFSET.x,
    CAMERA_OFFSET.y,
    player.position.z + CAMERA_OFFSET.z,
  )

  return game
}

// A cleared wave (score bonus, heal, banner) and a beaten boss (bonus, heal, on to the next place).
// A co-op joiner gets these from the host's wave controller (levelIndexOverride: where the host is going).
function applyWaveEvents(game, events, clearedWaveNumber, bossBeforeStep, levelIndexOverride = null) {
  const { player } = game
  if (events.includes('waveCleared')) {
    const bonus = Math.round(waveClearBonus(clearedWaveNumber) * diff().score)
    game.score += bonus
    showWaveClearedBanner(hud, bonus)
    sfx.play('waveCleared')
    player.hp = Math.min(player.maxHp, player.hp + WAVE_CLEAR_HEAL * activeFx(game.inventory.equipped).waveHeal * diff().waveHeal)
    progressNote({ type: 'waveClear' })
    progressNote({ type: 'wave', value: game.waveState.waveNumber })
    progressNote({ type: 'score', value: game.score })
  }
  if (events.includes('bossDefeated')) {
    const bonus = Math.round(waveClearBonus(clearedWaveNumber) * 2 * diff().score)
    game.score += bonus
    progressNote({ type: 'wave', value: game.waveState.waveNumber })
    game.bossesDefeated = (game.bossesDefeated ?? 0) + 1
    if (game.labyrinth) {
      const lab = game.labyrinth
      lab.bossesThisFloor += 1
      game.waveState = { ...game.waveState, wavesUntilBoss: 1 }
      if (lab.bossesThisFloor >= BOSSES_PER_FLOOR) {
        openLabyrinthGate(game)
        showWaveClearedBanner(hud, bonus, { lead: bossBeforeStep?.name ?? 'THE BOSS', text: 'DEFEATED - THE GATE IS OPEN! FIND THE EXIT' })
      } else {
        showWaveClearedBanner(hud, bonus, { lead: bossBeforeStep?.name ?? 'THE BOSS', text: 'DEFEATED - ONE MORE BOSS GUARDS THE GATE' })
      }
    } else {
      // The next place arrives through a hyperspace jump (logic/levelTransition.js): a moment of play,
      // then streaks, a white flash (the place swaps behind it) and a swoop down onto the new deck.
      const nextIndex = levelIndexOverride ?? levelIndexAfterBosses(game.bossesDefeated)
      const nextLevel = levelAt(nextIndex)
      game.levelTransition = createTransition(nextIndex)
      transitionOverlay.begin(nextLevel)
      showWaveClearedBanner(hud, bonus, { lead: bossBeforeStep?.name ?? 'THE BOSS', text: `DEFEATED - NEXT STOP: ${nextLevel.name.toUpperCase()}` })
    }
    sfx.play('waveCleared')
    player.hp = Math.min(player.maxHp, player.hp + WAVE_CLEAR_HEAL * activeFx(game.inventory.equipped).waveHeal * diff().waveHeal * BOSS_DEFEAT_HEAL_MULTIPLIER)
  }
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

// A boss's reward where it fell: a free chest (two in co-op, so there's one for each of you) and a power-up
// a little off to the side so they don't overlap. Every player's game drops its own (a joiner's on the
// puppet boss's death, coop.js), and each opens them for their own loot.
function dropBossLoot(game, at) {
  const spot = (dx, dz) => clampToPlatform({ x: at.x + dx, z: at.z + dz }, ARENA_RADIUS - CHEST_SPAWN_MARGIN)
  if (coop?.active) {
    trySpawnChest(game, { at: spot(-1.4, 0), cost: 0 })
    trySpawnChest(game, { at: spot(1.4, 0), cost: 0 })
    trySpawnPerkPickup(game, spot(0, 3))
  } else {
    trySpawnChest(game, { at: spot(0, 0), cost: 0 })
    trySpawnPerkPickup(game, spot(3, 1))
  }
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
  coop?.sendAbility(used.abilityId)
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
  progressNote({ type: 'chest' })
  const obstacleIndex = game.obstacles.indexOf(chest.userData.obstacle)
  if (obstacleIndex !== -1) game.obstacles.splice(obstacleIndex, 1)

  const point = { x: chest.position.x, y: 0.8, z: chest.position.z }
  burst(particleSystem, point, CHEST_FLASH_COLOR, 40, 4, 1)
  shardBurst(particleSystem, point, CHEST_FLASH_COLOR, 16, 3)

  const loot = rollChestLoot(game.inventory, Math.random, { ...profile.unlocked, ...game.dragonState.unlocked }, profile.collection)
  coop?.sendChestOpened(chest.userData.coopId ?? 0, loot ? lootName(loot) : 'LOADOUT FULL') // co-op: friends see what you got
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

// A rolled chest item's display name (for a co-op friend's "X GOT ..." toast).
function lootName(loot) {
  const table = { weapon: WEAPONS, ability: ABILITIES, pet: PETS, powerup: POWERUPS, scope: SCOPES, ammo: AMMO, skin: DRAGON_SKINS, breath: BREATHS }[loot.kind]
  return table?.[loot.id]?.name ?? String(loot.id ?? '')
}

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
function respawnAtCheckpoint(game, now, { toast = true, heal = true, near = false } = {}) {
  const { player, world: w } = game
  const beside = near ? standUpBeside(coop.peers()) : null // in co-op you get back up beside a friend who is still standing (in their level)
  if (w.depths.on && !beside) switchWorldLayer(game, false) // dying (or falling off the rim) down in the Depths brings you back up to the surface
  const spot = beside ? { ...beside, name: 'your friend' } : respawnSpot(w.checkpoint)
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
  w.jump.alt = groundY
  w.sky.launch = createLaunchState()
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
    // Skylift towers and sky isles (see stepSky; rules in logic/skyIslands.js, the look in src/skyIslands.js).
    aloft: false, // up in the sky (on an isle, or high over the land): the land's monsters can't see you
    // The Depths under the chasms (see stepDepths): on = you are down there; descent = the fall in progress.
    hostLayer: 0, // co-op guest: the level (bit 1 Depths, bit 2 sky) the host was last in, so a change brings us along
    depths: { on: false, descent: null, ascend: createAscendState(), fx: null, hintAt: 0, bannerAt: 0 },
    sky: { launch: createLaunchState(), active: new Map(), isleId: null, fx: null, chargeFxAt: 0, hintAt: 0, flyers: createFlyerDirector(), rocks: [], warned: false },
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
  if (npc.def.guide) {
    questUi.show(sageDialogInfo(game, npc))
    sfx.play('podIn', { x: npc.mesh.position.x, z: npc.mesh.position.z })
    return
  }
  if (npc.def.keeper) {
    questUi.show(keeperDialogInfo(game, npc))
    sfx.play('podIn', { x: npc.mesh.position.x, z: npc.mesh.position.z })
    return
  }
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
  if (npc.def.guide) return handleSageButton(game, id, npc)
  if (npc.def.keeper) return handleKeeperButton(game, id, npc)
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
  if (!m.lake && !m.skyIsle) at = villageKeepOut(at.x, at.z, 3) ?? at // nothing spawns inside a village
  const mesh = spawnMonster(game, type, { at, hpScale: m.hpScale ?? 1, effectOptions: { scale: 0.5, duration: 0.4 } })
  mesh.userData.elite = Boolean(m.elite)
  mesh.position.y = m.lake ? WATER_LEVEL - 0.3 : heightAt(at.x, at.z)
  const effect = game.spawnEffects[game.spawnEffects.length - 1]
  if (effect) effect.effect.group.position.y = mesh.position.y
  mesh.userData.damageScale = (1 + m.danger * 1.1) * (m.elite ? 1.35 : 1) * (diff().monsterDamage ?? 1)
  mesh.userData.speedScale = 1 + m.danger * 0.18
  if (m.lake) {
    mesh.userData.lake = m.lake // water monsters never leave their lake
    mesh.position.y = WATER_LEVEL - 0.3
  }
  if (m.boss) {
    const stats = MONSTER_TYPES[type]
    const fights = m.fights ?? BOSS_HEAD_START + Math.round(m.danger * 4)
    mesh.userData.damageScale = bossDamageScale(fights) * (diff().monsterDamage ?? 1)
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
  const content = inDepths() ? depthsChunk(cx, cz) : chunkContent(cx, cz)
  // Each solid prop knows how high its top is, so a jump or a glide over it clears it (clearsObstacle).
  const obstacles = content.props.filter((p) => p.radius > 0).map((p) => ({ x: p.x, z: p.z, radius: p.radius, top: heightAt(p.x, p.z) + propHeight(p.kind) * (p.scale ?? 1) }))
  game.obstacles.push(...obstacles)
  game.props.push(...obstacles)
  const chunk = { content, obstacles, treasure: [], npcIds: [] }
  w.chunks.set(content.key, chunk)

  for (const m of coop?.isClient ? [] : content.monsters) { // a co-op joiner's monsters are the host's (puppets)
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
  // Chasms: a dark pit with a violet ring.
  for (const c of chasms()) {
    const [x, y] = at(c.x, c.z)
    if (!onMap([x, y], 10)) continue
    ctx.fillStyle = '#05020c'
    ctx.strokeStyle = '#9a5aff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, Math.max(3.5, c.radius * k), 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
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
  drawSkyMarks(ctx, game, at, onMap)
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

// ---- Skylift towers and sky isles (rules in logic/skyIslands.js, the look in src/skyIslands.js) ----------------
const TOWER_FIRST_REWARD = 20 // crystals for the first ride on each tower, ever
const ISLE_FIRST_REWARD = 6 // ...and for first setting foot on each isle

// Is a point with your feet at `alt` above an obstacle's top? (Chests, pods and the like stand about 2.5 m tall.)
function clearsObstacle(o, alt) {
  return alt > (o.top ?? heightAt(o.x, o.z) + 2.5) - 0.2
}

// Is a chest / pickup on the level you're at? (In the Wilds a sky isle's chest hangs right over the land.)
function onMyLevel(obj) {
  return !game?.world || Math.abs(obj.position.y - (game.world.jump.air ? game.world.jump.alt : game.world.groundY)) < 5
}

// Brings an archipelago's chests and monsters in (when you're up there with it).
function activateArchipelago(game, arch, now) {
  const w = game.world
  const live = { treasure: [] }
  for (const isle of arch.isles) {
    const layout = isleLayout(isle)
    for (const t of layout.treasure) {
      if (w.opened.has(t.id)) continue
      const before = game.chests.length
      trySpawnChest(game, { at: { x: t.x, z: t.z } })
      if (game.chests.length === before) continue
      const mesh = game.chests[game.chests.length - 1]
      mesh.position.y = isle.y
      mesh.userData.worldTreasure = t
      // No collision: a chest's circle would block the land far below it too.
      if (mesh.userData.obstacle) removeFrom(game.obstacles, mesh.userData.obstacle)
      mesh.userData.obstacle = null
      live.treasure.push(mesh)
    }
    for (const g of coop?.isClient ? [] : layout.guards) { // (a guest's sky monsters are the host's puppets)
      if (w.live.has(g.id) || !canRespawn(w.killed.get(g.id), now, g.boss ? BOSS_RESPAWN_SECONDS : undefined)) continue
      const danger = arch.danger
      const mesh = spawnWildMonster(game, g.type, { x: g.x, z: g.z }, { danger, elite: g.elite, boss: g.boss, skyIsle: true, hpScale: g.boss ? 0.9 + danger * 1.1 : (1 + danger * 1.6) * (g.elite ? 2.4 : 1) })
      mesh.userData.skyIsle = true
      mesh.userData.skyHome = isle
      mesh.userData.skyArch = arch.id
      mesh.userData.worldId = g.id
      mesh.position.y = isle.y
      const effect = game.spawnEffects[game.spawnEffects.length - 1]
      if (effect?.monster === mesh) effect.effect.group.position.y = isle.y
      w.live.set(g.id, mesh)
    }
  }
  w.sky.active.set(arch.id, live)
}

// ...and lets them go again once you're back on the land (opened chests stay opened; the slain return in time).
function deactivateArchipelago(game, arch) {
  const w = game.world
  const live = w.sky.active.get(arch.id)
  if (!live) return
  for (const mesh of live.treasure) {
    if (mesh.userData.opened) w.opened.add(mesh.userData.worldTreasure.id)
    if (!game.chests.includes(mesh)) continue
    removeFrom(game.chests, mesh)
    disposeObject3D(mesh)
  }
  for (const mesh of [...game.monsters]) {
    if (mesh.userData.skyArch !== arch.id || mesh.userData.dying || mesh.userData.falling) continue
    dropWorldMonster(game, mesh)
  }
  w.sky.active.delete(arch.id)
}

// ---- broken Skylift towers: the keepers' repair jobs (rules in logic/towerQuests.js) ----
const KEEPER_SEE = 150 // a tower's keeper appears this close
const towerFixDone = (journal) => new Set(Object.keys(journal.fixes).filter((id) => journal.fixes[id].stage === 'done'))
const setFixes = (game, fixes) => setJournal(game, { ...game.world.journal, fixes })
const towerOf = (id) => skyTowers().find((t) => t.id === id) ?? null

function keeperMarker(game, towerId) {
  const tower = towerOf(towerId)
  const stage = fixOf(game.world.journal.fixes, towerId).stage
  if (stage === 'open') return 'offer'
  if (stage === 'done') return null
  return towerIssue(tower)?.kind === 'parts' && game.inventory.crystals >= PARTS_COST ? 'ready' : 'progress'
}

function keeperDialogInfo(game, npc) {
  const tower = towerOf(npc.def.keeper)
  return { npc: npc.def, village: { name: tower.name }, mode: 'keeper', ...keeperDialog(game.world.journal.fixes, tower, game.inventory.crystals) }
}

function handleKeeperButton(game, id, npc) {
  const w = game.world
  const tower = towerOf(npc.def.keeper)
  const issue = towerIssue(tower)
  if (id === 'accept' && fixOf(w.journal.fixes, tower.id).stage === 'open') {
    setFixes(game, acceptFix(w.journal.fixes, tower.id))
    const goal = { camp: 'CLEAR THE CAMP AROUND THE TOWER', cells: 'FIND THE GLOWING POWER CELLS NEAR THE TOWER', parts: `BRING ${PARTS_COST} CRYSTALS: TALK TO THE WARDEN AGAIN` }[issue.kind]
    questUi.showToast(`JOB TAKEN: ${issue.title.toUpperCase()}  ·  ${goal}`)
    sfx.play('chestOpen', { x: npc.mesh.position.x, z: npc.mesh.position.z })
    questUi.close()
  } else if (id === 'pay' && fixOf(w.journal.fixes, tower.id).stage === 'accepted' && issue.kind === 'parts') {
    if (game.inventory.crystals < PARTS_COST) {
      questUi.showToast(`NOT ENOUGH CRYSTALS (${PARTS_COST} NEEDED)`)
      return
    }
    game.inventory = spendCrystals(game.inventory, PARTS_COST).inventory
    completeTowerFix(game, tower)
    questUi.update(keeperDialogInfo(game, npc))
  } else questUi.close()
}

// The fix is done: the pad lights up, and the keeper's thanks (crystals, a heal and a treasure map).
function completeTowerFix(game, tower) {
  const w = game.world
  setFixes(game, finishFix(w.journal.fixes, tower.id))
  w.sky.fx.setRepaired(towerFixDone(w.journal))
  game.inventory = addCrystals(game.inventory, FIX_REWARD)
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp * 0.3)
  spawnShockwave(shockwavePool, tower.x, tower.z, 14, 0x5ef2d6)
  burst(particleSystem, { x: tower.x, y: fxY(game, tower.y + 3), z: tower.z }, 0x5ef2d6, 70, 8, 1)
  sfx.play('waveCleared', { x: tower.x, z: tower.z })
  questUi.showToast(`SKYLIFT RESTORED: ${tower.name.toUpperCase()}  +${FIX_REWARD} CRYSTALS  ·  STEP ONTO THE PAD`)
  grantTreasureMap(game, `tower:${tower.id}`, { x: tower.x, z: tower.z }, tower.name)
}

// A camp monster fell (scoreKill): it counts toward its tower's job.
function towerCampKill(game, towerId) {
  const w = game.world
  const tower = towerOf(towerId)
  if (!tower) return
  const out = campKill(w.journal.fixes, tower)
  if (out.fixes === w.journal.fixes) return
  setFixes(game, out.fixes)
  if (out.done) completeTowerFix(game, tower)
  else questUi.showToast(`CAMP: ${fixOf(out.fixes, tower.id).n} / ${CAMP_SIZE} CLEARED`)
}

function makeCellMesh() {
  const g = new THREE.Group()
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffd37a, fog: false }))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 6, 24), new THREE.MeshBasicMaterial({ color: 0x5ef2d6, transparent: true, opacity: 0.85, fog: false }))
  ring.rotation.x = Math.PI / 2
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 16, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd37a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }))
  beam.position.y = 8
  g.add(core, ring, beam)
  g.userData = { core, ring }
  return g
}

function animateTowerCells(game, now) {
  for (const cell of game.world.towerQuest.cells.values()) {
    cell.mesh.userData.core.rotation.y = now * 1.8
    cell.mesh.userData.ring.rotation.z = now * 1.2
    cell.mesh.position.y = cell.y + 1.3 + Math.sin(now * 2 + cell.y) * 0.18
  }
}

function clearTowerQuest(game) {
  const tq = game.world?.towerQuest
  if (!tq) return
  for (const [id, npc] of tq.keepers) {
    disposeObject3D(npc.mesh)
    game.world.npcs.delete(npc.def.id)
    tq.keepers.delete(id)
  }
  for (const cell of tq.cells.values()) {
    tq.group.remove(cell.mesh)
    disposeObject3D(cell.mesh)
  }
  tq.cells.clear()
}

// Each frame on the surface: keepers appear beside their towers, accepted jobs run (cells to collect, camps to clear).
function stepTowerQuests(game, now) {
  const w = game.world
  const tq = w.towerQuest
  const p = game.player.position
  for (const tower of skyTowers()) {
    const issue = towerIssue(tower)
    if (!issue) continue
    const d = Math.hypot(tower.x - p.x, tower.z - p.z)
    let npc = tq.keepers.get(tower.id)
    if (d < KEEPER_SEE && !npc) {
      const at = keeperSpot(tower)
      npc = createNpc({ id: `keeper:${tower.id}`, keeper: tower.id, name: issue.keeper, role: 'Tower Warden', color: issue.color, x: at.x, z: at.z, villageId: null })
      scene.add(npc.mesh)
      tq.keepers.set(tower.id, npc)
      w.npcs.set(npc.def.id, npc)
    } else if (d > KEEPER_SEE + 40 && npc && w.talkingTo !== npc.def.id) {
      disposeObject3D(npc.mesh)
      tq.keepers.delete(tower.id)
      w.npcs.delete(npc.def.id)
    }
    const fix = fixOf(w.journal.fixes, tower.id)
    if (fix.stage !== 'accepted') continue
    if (issue.kind === 'cells') {
      for (const spot of issueCells(tower)) {
        if (fix.cells.includes(spot.id)) continue
        const near = Math.hypot(spot.x - p.x, spot.z - p.z)
        let cell = tq.cells.get(spot.id)
        if (near < 140 && !cell) {
          cell = { ...spot, mesh: makeCellMesh() }
          cell.mesh.position.set(spot.x, spot.y + 1.3, spot.z)
          tq.group.add(cell.mesh)
          tq.cells.set(spot.id, cell)
        } else if (near > 190 && cell) {
          tq.group.remove(cell.mesh)
          disposeObject3D(cell.mesh)
          tq.cells.delete(spot.id)
        }
        if (cell && near < CELL_PICKUP_RADIUS && Math.abs(w.groundY - spot.y) < 4 && !game.player.hidden && game.player.hp > 0) {
          const out = collectCell(w.journal.fixes, tower, spot.id)
          setFixes(game, out.fixes)
          tq.group.remove(cell.mesh)
          disposeObject3D(cell.mesh)
          tq.cells.delete(spot.id)
          burst(particleSystem, { x: spot.x, y: fxY(game, spot.y + 1.2), z: spot.z }, 0xffd37a, 30, 5)
          sfx.play('crystal', { x: spot.x, z: spot.z })
          if (out.done) completeTowerFix(game, tower)
          else questUi.showToast(`POWER CELL ${fixOf(out.fixes, tower.id).n} / 3`)
        }
      }
    } else if (issue.kind === 'camp' && d < 55) {
      // The camp: whoever is missing (killed ones count in the journal; ones dropped behind you come back) stands round the tower.
      const need = CAMP_SIZE - fix.n
      const alive = game.monsters.filter((m) => m.userData.towerCamp === tower.id && !m.userData.dying).length
      if (need > alive && now > (tq.spawnAt.get(tower.id) ?? 0)) {
        tq.spawnAt.set(tower.id, now + 4)
        const camp = issueCamp(tower)
        const danger = Math.min(1, dangerAt(tower.x, tower.z) + 0.1)
        for (let i = alive; i < need; i++) {
          const c = camp[i % camp.length]
          const mesh = spawnWildMonster(game, c.type, { x: c.x, z: c.z }, { danger, elite: c.elite, hpScale: (1 + danger) * (c.elite ? 2.4 : 1) })
          mesh.userData.towerCamp = tower.id
        }
      }
    }
  }
  animateTowerCells(game, now)
}

// ---- the storm cities' champions: they offer each storm's chain, join you, brief the current stage and point the way ----
const phenRtView = (game) => Object.fromEntries(Object.entries(game.world.phen?.rt ?? {}).filter(([, v]) => v).map(([k, v]) => [k, { trial: v.trial }]))
const sageMarker = (game, stormId) => {
  if (isCleared(game.world.journal.phenomena, stormId)) return null
  return hasGift(game.world.journal.phenomena, stormId) ? 'progress' : 'offer'
}

// ---- the champion at your side (Tears of the Kingdom's sages): follows you, fights with their people's power ----
const CHAMPION_REACH = 17 // they go for monsters this close to them
const CHAMPION_POWER = { dunekin: 6.5, frostkin: 5, embervolk: 7, mirefolk: 8 } // seconds between their big moves
const CHAMPION_JAB = 1.5 // ...and a small hit this often in between
function stepChampion(game, now, dt) {
  const w = game.world
  if (!w.phen) return
  const storm = companionStorm(w.journal.phenomena, w.phen.tracked)
  const id = storm ? `champion:${storm}` : null
  // Only one champion walks with you; the others go home.
  for (const [key, npc] of w.npcs) {
    if (npc.def.follow && key !== id) {
      disposeObject3D(npc.mesh)
      w.npcs.delete(key)
    } else if (npc.def.champion && !npc.def.follow) npc.mesh.visible = npc.def.guide !== storm
  }
  if (!id) return
  let npc = w.npcs.get(id)
  const p = game.player.position
  if (!npc) {
    const city = stormCity(storm)
    const champ = championFor(storm)
    npc = createNpc({ id, follow: true, champion: true, guide: storm, species: city.species, name: champ.name, role: `${champ.power} · ${champ.title}`, color: champ.color, x: p.x + 2.5, z: p.z - 2, villageId: city.id, side: 1 })
    npc.nextPower = now + 3
    npc.nextJab = now + 1
    scene.add(npc.mesh)
    w.npcs.set(id, npc)
  }
  // They come with you into the Depths and onto a storm's sky temple; anywhere else up high they wait below.
  const temple = w.aloft ? skyTemples().find((t) => Math.hypot(t.x - p.x, t.z - p.z) < t.radius + 2 && w.groundY > t.y - 4) : null
  const away = (w.aloft && !temple) || game.player.hp <= 0
  npc.mesh.visible = !away
  npc.yOverride = temple ? temple.y : null
  npc.isle = temple ? { x: temple.x, z: temple.z, r: temple.radius - 2 } : null
  if (away) {
    npc.mesh.position.set(p.x + 2.5, heightAt(p.x, p.z), p.z + 2) // (they meet you when you are back)
    return
  }
  npc.clock = now
  const yaw = game.player.mesh.rotation.y
  npc.dir = { x: Math.sin(yaw), z: Math.cos(yaw) }
  if (w.depths.on && dt > 0) updateNpc(npc, dt, now, p) // (the villagers' loop does not run down there)
  if (npc.roll) stepChampionRoll(game, npc, now, dt)
  if (dt <= 0 || game.cutscene || coop?.isClient) return
  // Find the nearest monster to fight.
  const at = npc.mesh.position
  let target = null
  let best = CHAMPION_REACH
  for (const m of game.monsters) {
    const u = m.userData
    if (u.dying || u.spawning || isUntouchable(m)) continue
    if (u.skyIsle ? u.skyHome?.id !== temple?.id || !temple : false) continue // (sky monsters only on the temple isle with you)
    const d = Math.hypot(m.position.x - at.x, m.position.z - at.z)
    if (d < best) {
      best = d
      target = m
    }
  }
  if (!target) return
  npc.mesh.rotation.y = Math.atan2(target.position.x - at.x, target.position.z - at.z)
  const danger = dangerAt(at.x, at.z)
  const def = PHENOMENA[storm]
  if (now >= npc.nextPower) {
    npc.nextPower = now + CHAMPION_POWER[npc.def.species]
    npc.nextJab = now + CHAMPION_JAB
    championPower(game, npc, target, danger, def)
  } else if (now >= npc.nextJab && best < 9) {
    npc.nextJab = now + CHAMPION_JAB
    const from = { x: at.x, z: at.z }
    burst(particleSystem, { x: target.position.x, y: fxY(game, target.position.y) + 1, z: target.position.z }, def.glow, 10, 3)
    damageMonster(target, Math.round(5 + danger * 9), { fromPos: from, knockback: 0.6, obstacles: game.obstacles, particleSystem, cause: 'pet' })
  }
}
function championPower(game, npc, target, danger, def) {
  const at = npc.mesh.position
  const from = { x: at.x, z: at.z }
  const t = target.position
  const hitAll = (cx, cz, radius, dmg, knockback, fromPos = { x: cx, z: cz }) => {
    for (const m of [...game.monsters]) {
      if (m.userData.dying || m.userData.skyIsle) continue
      if (Math.hypot(m.position.x - cx, m.position.z - cz) <= radius) damageMonster(m, dmg, { fromPos, knockback, obstacles: game.obstacles, particleSystem, cause: 'pet' })
    }
  }
  const sp = npc.def.species
  const ty = fxY(game, t.y)
  if (sp === 'dunekin') { // Sirocco: a whirlwind on the target drags its neighbours in, then flays them
    for (const m of game.monsters) {
      if (m.userData.dying || m.userData.boss) continue
      const dx = t.x - m.position.x
      const dz = t.z - m.position.z
      const d = Math.hypot(dx, dz)
      if (d > 0.5 && d < 8) {
        m.position.x += (dx / d) * Math.min(2.4, d - 0.5)
        m.position.z += (dz / d) * Math.min(2.4, d - 0.5)
      }
    }
    for (let i = 0; i < 4; i++) burst(particleSystem, { x: t.x, y: ty + 0.5 + i * 1.2, z: t.z }, i % 2 ? 0xffd98a : 0xe8b86a, 18, 4 + i, 1.2)
    spawnShockwave(shockwavePool, t.x, t.z, 6, 0xffd98a)
    hitAll(t.x, t.z, 6, Math.round(16 + danger * 26), 0.3)
    sfx.play('swing', { x: t.x, z: t.z })
  } else if (sp === 'frostkin') { // Gale Volley: wind arrows at up to three monsters
    const marks = game.monsters.filter((m) => !m.userData.dying && !m.userData.skyIsle && !isUntouchable(m) && Math.hypot(m.position.x - at.x, m.position.z - at.z) < CHAMPION_REACH + 3)
      .sort((a, b) => Math.hypot(a.position.x - at.x, a.position.z - at.z) - Math.hypot(b.position.x - at.x, b.position.z - at.z)).slice(0, 3)
    for (const m of marks) {
      for (let k = 1; k <= 5; k++) {
        const f = k / 5
        burst(particleSystem, { x: at.x + (m.position.x - at.x) * f, y: fxY(game, at.y) + 2.2 - f * 1.2, z: at.z + (m.position.z - at.z) * f }, 0xdff0ff, 3, 1.5)
      }
      burst(particleSystem, { x: m.position.x, y: fxY(game, m.position.y) + 1, z: m.position.z }, 0x9fd8ff, 16, 4)
      damageMonster(m, Math.round(14 + danger * 24), { fromPos: from, knockback: 1.2, obstacles: game.obstacles, particleSystem, cause: 'pet' })
    }
    sfx.play('swing', { x: at.x, z: at.z })
  } else if (sp === 'embervolk') { // Boulder Roll: curls up and rolls straight through the target
    const dx = t.x - at.x
    const dz = t.z - at.z
    const d = Math.hypot(dx, dz) || 1
    npc.roll = { from: { x: at.x, z: at.z }, to: { x: t.x + (dx / d) * 3, z: t.z + (dz / d) * 3 }, start: npc.clock, secs: 0.45, danger, hit: new Set() }
    npc.busyUntil = npc.clock + 0.5
  } else { // Lantern Tide: a wave of light that hurts monsters, burns off poison clouds and mends you
    spawnShockwave(shockwavePool, at.x, at.z, 9, 0xdaff6a)
    burst(particleSystem, { x: at.x, y: fxY(game, at.y) + 1.5, z: at.z }, 0xb8ff8a, 50, 6, 0.6)
    hitAll(at.x, at.z, 9, Math.round(12 + danger * 22), 1.4, from)
    const player = game.player
    if (Math.hypot(player.position.x - at.x, player.position.z - at.z) < 12) player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.06)
    if (game.world.phen) game.world.phen.zones = game.world.phen.zones.filter((z) => z.kind !== 'spore' || Math.hypot(z.x - at.x, z.z - at.z) > 11)
    sfx.play('crystal', { x: at.x, z: at.z })
  }
}
function stepChampionRoll(game, npc, now, dt) {
  const r = npc.roll
  const f = Math.min(1, (now - r.start) / r.secs)
  const m = npc.mesh
  m.position.x = r.from.x + (r.to.x - r.from.x) * f
  m.position.z = r.from.z + (r.to.z - r.from.z) * f
  const rig = m.userData.rig
  if (rig) rig.body.rotation.x += dt * 22 // tumbling
  if (dt > 0 && Math.random() < 0.6) burst(particleSystem, { x: m.position.x, y: fxY(game, m.position.y) + 0.6, z: m.position.z }, 0xff8a3a, 3, 2)
  for (const mon of game.monsters) {
    if (mon.userData.dying || r.hit.has(mon) || Math.hypot(mon.position.x - m.position.x, mon.position.z - m.position.z) > 2.6) continue
    r.hit.add(mon)
    damageMonster(mon, Math.round(22 + r.danger * 34), { fromPos: { x: m.position.x, z: m.position.z }, knockback: 3.2, obstacles: game.obstacles, particleSystem, cause: 'pet' })
  }
  if (f >= 1) {
    spawnShockwave(shockwavePool, m.position.x, m.position.z, 5, 0xff6a2a)
    sfx.play('bossSlam', { x: m.position.x, z: m.position.z })
    if (rig) rig.body.rotation.x = 0
    npc.roll = null
    npc.busyUntil = 0
  }
}

// The storm's temple: walk up to its heart before the storm is worn down and your champion tells you what it is.
function stepTempleHeart(game, now) {
  const w = game.world
  const p = game.player.position
  for (const def of PHENOMENON_LIST) {
    const eye = phenomenonEye(def.id)
    if (Math.hypot(eye.x - p.x, eye.z - p.z) > 34 || w.aloft) continue
    const stage = currentStage(w.journal.phenomena, def.id)
    if (!stage || w.phen.heartSeen?.[def.id] > now - 60) continue
    w.phen.heartSeen = { ...(w.phen.heartSeen ?? {}), [def.id]: now }
    const champ = championFor(def.id)
    const who = hasGift(w.journal.phenomena, def.id) ? champ.name.toUpperCase() : 'A VOICE ON THE WIND'
    const where = templePlace(def.id) === 'sky' ? `THE STORM'S HEART BEATS IN ${TEMPLE_NAMES[def.id].toUpperCase()}, UP THERE. THE PAD WILL THROW YOU UP` : `THE STORM'S HEART BEATS IN ${TEMPLE_NAMES[def.id].toUpperCase()}, DOWN IN THE DEPTHS. JUMP INTO THE PIT`
    const when = stage.kind === 'boss' ? 'IT IS WEAK NOW: GO!' : `BUT IT IS SEALED UNTIL THE STORM IS WORN DOWN: FINISH THE TRIALS (${progressOf(w.journal.phenomena, def.id).stage + 1}/${stageCount(def.id)})`
    questUi.showToast(`${who}: "${where}, ${when}"`)
  }
}

// The storm pads at the eyes of the sky-temple storms: stand on one and it throws you up into the sky, like a Skylift.
function stepStormPads(game, now) {
  const w = game.world
  const ph = w.phen
  const player = game.player
  const p = player.position
  const ok = !player.hidden && !player.falling && player.hp > 0 && !w.jump.air && !blockingPanelOpen() && !game.cutscene
  const pad = ok ? padAt(p.x, p.z) : null
  if (!pad || (ph.padLock && ph.padLock === pad.stormId)) {
    if (!pad) ph.padLock = null
    ph.pad = null
    return
  }
  if (!ph.pad || ph.pad.stormId !== pad.stormId) {
    ph.pad = { stormId: pad.stormId, since: now }
    sfx.play('hyperspace', { x: pad.x, z: pad.z })
    questUi.showToast(`HOLD STILL: THE STORM PAD WILL THROW YOU UP TO ${TEMPLE_NAMES[pad.stormId].toUpperCase()}`)
  }
  const glow = PHENOMENA[pad.stormId].glow
  if (now > (ph.padFxAt ?? 0)) {
    ph.padFxAt = now + 0.08
    burst(particleSystem, { x: p.x + (Math.random() - 0.5) * 3, y: 0.3, z: p.z + (Math.random() - 0.5) * 3 }, glow, 4, 5, 0.6)
  }
  if (now - ph.pad.since < STORM_PAD_CHARGE) return
  ph.pad = null
  ph.padLock = pad.stormId
  w.jump = launchJump(w.jump, launchVelocity())
  spawnShockwave(shockwavePool, pad.x, pad.z, 9, glow)
  burst(particleSystem, { x: p.x, y: 0.4, z: p.z }, glow, 60, 9, 0.8)
  triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
  sfx.play('arrive', { x: pad.x, z: pad.z })
  questUi.showToast(`${TEMPLE_NAMES[pad.stormId].toUpperCase()} HANGS AHEAD · SPACE OPENS THE GLIDER`)
}

// A storm's boss, in its temple: on the sky temple's isle, or in the sunken temple in the Depths.
function spawnTempleBoss(game, id, stage) {
  const arena = templeArena(id)
  const isle = arena.place === 'sky' ? skyTempleFor(id) : null
  const danger = Math.min(1, dangerAt(arena.x, arena.z) + 0.25)
  const sky = (mesh) => {
    if (!isle) return mesh
    mesh.userData.skyIsle = true
    mesh.userData.skyHome = isle
    mesh.position.y = isle.y
    const effect = game.spawnEffects[game.spawnEffects.length - 1]
    if (effect?.monster === mesh) effect.effect.group.position.y = isle.y
    return mesh
  }
  const mesh = sky(spawnWildMonster(game, stage.boss, { x: arena.x, z: arena.z }, { boss: true, fights: BOSS_HEAD_START + 2 + PHENOMENON_ORDER.indexOf(id), danger, hpScale: 1 + danger * 1.2 }))
  mesh.userData.phenom = id
  mesh.userData.phenomRole = 'boss'
  mesh.userData.phenomBoss = id
  for (let i = 0; i < stage.minions; i++) {
    const a = (i / stage.minions) * Math.PI * 2
    sky(spawnStormMonster(game, id, { x: arena.x + Math.cos(a) * 9, z: arena.z + Math.sin(a) * 9 }, 'add', { elite: i === 0 }))
  }
  biomeBannerShow(TEMPLE_NAMES[id], PHENOMENA[id].glow, timer.getElapsed())
  questUi.showToast(`${stage.title.toUpperCase()} RISES IN ${TEMPLE_NAMES[id].toUpperCase()}`)
}

// The sunken temples, while you are in the Depths: the boss stage fights there; earlier, the temple is sealed.
function stepDeepTemples(game, now) {
  const w = game.world
  if (!w.phen) return
  const p = game.player.position
  for (const t of deepTemples()) {
    const d = Math.hypot(t.x - p.x, t.z - p.z)
    if (d > 70) continue
    const stage = currentStage(w.journal.phenomena, t.stormId)
    if (d < t.radius && w.phen.deepSeen !== t.stormId) {
      w.phen.deepSeen = t.stormId
      biomeBannerShow(t.name, PHENOMENA[t.stormId].glow, now)
      if (!stage) questUi.showToast(`${t.name.toUpperCase()} IS QUIET NOW. THE STORM ABOVE IS CALM`)
      else if (stage.kind !== 'boss') questUi.showToast(`${t.name.toUpperCase()}: THE STORM'S HEART IS SEALED. FINISH ITS TRIALS ABOVE (${progressOf(w.journal.phenomena, t.stormId).stage + 1}/${stageCount(t.stormId)})`)
    } else if (d > t.radius + 20 && w.phen.deepSeen === t.stormId) w.phen.deepSeen = null
    if (!stage || stage.kind !== 'boss' || coop?.isClient || game.player.hp <= 0) continue
    const boss = game.monsters.find((m) => m.userData.phenomBoss === t.stormId && !m.userData.dying)
    if (!boss && d < 45) spawnTempleBoss(game, t.stormId, stage)
  }
  w.phen.fx.update(now, p, new Set(PHENOMENON_ORDER.filter((id) => isCleared(w.journal.phenomena, id))))
}
function sageDialogInfo(game, npc) {
  const id = npc.def.guide
  const p = game.player.position
  return { npc: npc.def, village: villageById(npc.def.villageId), mode: 'sage', quest: null, ...sageDialog(game.world.journal.phenomena, id, { x: p.x, z: p.z }, phenRtView(game)) }
}
function handleSageButton(game, id, npc) {
  const w = game.world
  const storm = npc.def.guide
  const def = PHENOMENA[storm]
  const at = { x: npc.mesh.position.x, z: npc.mesh.position.z }
  if (id === 'accept' && !hasGift(w.journal.phenomena, storm)) {
    const wasStarted = progressOf(w.journal.phenomena, storm).started
    setPhenomena(game, joinChampion(w.journal.phenomena, storm))
    w.phen.tracked = storm
    const champ = championFor(storm)
    questUi.showToast(`${champ.name.toUpperCase()} JOINS YOU  ·  ${champ.gift.toUpperCase()} RECEIVED  ·  FOLLOW THE BEAM`)
    if (hud) showLootToast(hud, { title: `${champ.name.toUpperCase()} JOINS YOU`, name: champ.gift, blurb: `${champ.giftText} ${champ.name} fights beside you: ${champ.power} ${champ.powerText}.` })
    burst(particleSystem, { x: at.x, y: fxY(game, npc.mesh.position.y) + 1.5, z: at.z }, def.glow, 50, 5, 0.8)
    sfx.play('chestOpen', at)
    questUi.close()
    if (!wasStarted) announcePhenomenonStage(game, storm)
  } else if (id === 'mark') {
    w.phen.tracked = storm
    questUi.showToast(`TRACKING: ${def.short.toUpperCase()}`)
    questUi.close()
  } else if (id === 'rest') {
    game.player.hp = game.player.maxHp
    w.phen.cold = 0
    burst(particleSystem, { x: game.player.position.x, y: 1.2, z: game.player.position.z }, def.glow, 36, 4, 0.6)
    sfx.play('waveCleared', at)
    questUi.showToast('YOU FEEL RESTED · FULL HEALTH')
    questUi.close()
  } else questUi.close()
}

// ---- regional phenomena: four storms, each a six-stage chain (rules in logic/phenomena.js, look in phenomenaFx.js) ----
const PHEN_NEAR = 110 // beyond the wall: stages stay live this far out
const SKY_TEMPLE_REACH = 26 // on the sky temple's isle
const STORM_FOG = { gust: [4, 38], cold: [6, 46], embers: [10, 76], spores: [5, 44] }
const setPhenomena = (game, phenomena) => setJournal(game, { ...game.world.journal, phenomena })
const phenRt = (ph, id) => (ph.rt[id] ??= { hold: createHold(), trial: createTrial(), guardKills: {}, lastGate: -1 })
const hexOf = (c) => `#${c.toString(16).padStart(6, '0')}`

// Finishes the storm's current stage: pays out, introduces the next, or calms the whole storm.
function completePhenomenonStage(game, id) {
  const w = game.world
  const def = PHENOMENA[id]
  const before = progressOf(w.journal.phenomena, id)
  const done = def.stages[before.stage]
  if (!done) return
  const out = advanceStage(w.journal.phenomena, id)
  setPhenomena(game, out.phenomena)
  w.phen.rt[id] = null
  w.phen.zones = []
  const reward = stageReward(before.stage)
  game.inventory = addCrystals(game.inventory, reward)
  const p = game.player.position
  burst(particleSystem, { x: p.x, y: 2, z: p.z }, def.glow, 60, 7, 1)
  spawnShockwave(shockwavePool, p.x, p.z, 10, def.color)
  sfx.play('waveCleared', { x: p.x, z: p.z })
  if (out.cleared) return calmPhenomenon(game, id)
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp * 0.15)
  questUi.showToast(`${def.short.toUpperCase()}  ${before.stage + 1}/${stageCount(id)} DONE: ${done.title.toUpperCase()}  +${reward} CRYSTALS`)
  announcePhenomenonStage(game, id)
}

// The big card for the stage you are now on.
function announcePhenomenonStage(game, id) {
  const stage = currentStage(game.world.journal.phenomena, id)
  if (!stage || !hud) return
  const n = progressOf(game.world.journal.phenomena, id).stage + 1
  showLootToast(hud, { title: `${PHENOMENA[id].short.toUpperCase()} · STAGE ${n} OF ${stageCount(id)}`, name: stage.title, blurb: stage.text })
}

// The whole storm is done: the sky clears, the Seal is yours, and the fourth secret hero may come.
function calmPhenomenon(game, id) {
  const w = game.world
  const def = PHENOMENA[id]
  const eye = phenomenonEye(id)
  game.inventory = addCrystals(game.inventory, CLEAR_REWARD)
  game.player.hp = game.player.maxHp
  spawnShockwave(shockwavePool, eye.x, eye.z, 40, def.glow)
  spawnShockwave(shockwavePool, eye.x, eye.z, 22, 0xffffff)
  burst(particleSystem, { x: eye.x, y: fxY(game, eye.y + 3), z: eye.z }, def.glow, 120, 12, 1)
  sfx.play('waveCleared', { x: eye.x, z: eye.z })
  grantTreasureMap(game, `storm:${id}`, { x: eye.x, z: eye.z }, def.name)
  questUi.showToast(`${def.name.toUpperCase()} IS CALMED  ·  ${def.reward.toUpperCase()}  +${CLEAR_REWARD} CRYSTALS, FULLY HEALED  ·  ${clearedCount(w.journal.phenomena)}/${PHENOMENON_ORDER.length}`)
  if (hud) showLootToast(hud, { title: 'THE SKY CLEARS', name: def.reward, blurb: `${def.name} is over. ${clearedCount(w.journal.phenomena) < PHENOMENON_ORDER.length ? `${PHENOMENON_ORDER.length - clearedCount(w.journal.phenomena)} more regional phenomena rage across the Wilds.` : 'The weather itself has noticed you.'}` })
  grantStormHero(clearedCount(w.journal.phenomena), true)
}

// A storm-spawn fell (scoreKill): count it toward the stage it belongs to.
function phenomenonKill(game, mesh) {
  const w = game.world
  const u = mesh.userData
  const id = u.phenom
  if (!w.phen || !PHENOMENA[id]) return
  w.phen.cold = Math.max(0, w.phen.cold - COLD.killWarm)
  const stage = currentStage(w.journal.phenomena, id)
  if (!stage) return
  if (u.phenomRole === 'guard') {
    const rt = phenRt(w.phen, id)
    rt.guardKills[u.phenomPoint] = (rt.guardKills[u.phenomPoint] ?? 0) + 1
  } else if (u.phenomRole === 'purge' && stage.kind === 'purge') {
    const out = purgeKill(w.journal.phenomena, id)
    setPhenomena(game, out.phenomena)
    if (out.done) completePhenomenonStage(game, id)
    else if (progressOf(out.phenomena, id).n % 4 === 0) questUi.showToast(`${stage.title.toUpperCase()}: ${progressOf(out.phenomena, id).n} / ${stage.n}`)
  } else if (u.phenomRole === 'boss' && stage.kind === 'boss') completePhenomenonStage(game, id)
}

// A spot on dry ground in the storm for a monster: a ring round the player, kept inside the wall.
function stormSpawnSpot(id, p, min = 12, max = 20) {
  const eye = phenomenonEye(id)
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2
    const d = min + Math.random() * (max - min)
    let x = p.x + Math.cos(a) * d
    let z = p.z + Math.sin(a) * d
    const away = Math.hypot(x - eye.x, z - eye.z)
    if (away > PHENOMENON_RADIUS * 0.95) {
      x = eye.x + ((x - eye.x) / away) * PHENOMENON_RADIUS * 0.9
      z = eye.z + ((z - eye.z) / away) * PHENOMENON_RADIUS * 0.9
    }
    if (!lakeAt(x, z, 2)) return { x, z }
  }
  return { x: p.x + 12, z: p.z }
}
function spawnStormMonster(game, id, at, role, extra = {}) {
  const types = stormMonsters(id)
  const type = types[Math.floor(Math.random() * types.length)]
  const danger = Math.min(1, dangerAt(at.x, at.z) + 0.15 + progressOf(game.world.journal.phenomena, id).stage * 0.04)
  const elite = extra.elite ?? (role === 'purge' && Math.random() < 0.12)
  const mesh = spawnWildMonster(game, type, at, { danger, elite, hpScale: (1 + danger) * (elite ? 2.4 : 1) })
  mesh.userData.phenom = id
  mesh.userData.phenomRole = role
  if (extra.point) mesh.userData.phenomPoint = extra.point
  return mesh
}
const stormAlive = (game, id, role, point = null) => game.monsters.filter((m) => m.userData.phenom === id && m.userData.phenomRole === role && (point === null || m.userData.phenomPoint === point) && !m.userData.dying).length

// The storm's own hazard, every frame while you are in it.
function stepStormHazard(game, id, k, now, dt, alive, scale = 1) {
  const w = game.world
  const ph = w.phen
  const def = PHENOMENA[id]
  const player = game.player
  const p = player.position
  const sparkle = (n, spread, speed, up = 0) => {
    for (let i = 0; i < n; i++) burst(particleSystem, { x: p.x + (Math.random() - 0.5) * spread, y: fxY(game, w.groundY) + 0.5 + Math.random() * 5, z: p.z + (Math.random() - 0.5) * spread }, def.color, 1, speed, up)
  }
  if (def.hazard === 'gust') {
    if (Math.random() < dt * 14 * k) sparkle(1, 26, 6, 0)
    if (!alive || player.hidden || (player.speed < 0.5 && !w.jump.air)) return // standing still, the wind never drags you about
    const push = gustPush(now, k * scale)
    const air = (w.jump.air ? 0.5 : 1) * 0.5
    const nx = p.x + push.x * dt * air
    const nz = p.z + push.z * dt * air
    if (!game.obstacles.some((o) => Math.hypot(o.x - nx, o.z - nz) < (o.radius ?? 0) + 0.7 && !(w.jump.air && clearsObstacle(o, w.groundY)))) {
      p.x = nx
      p.z = nz
      // Player.update skips its own mesh sync while you stand still, so move the body with the camera's target.
      player.mesh.position.x = nx
      player.mesh.position.z = nz
    }
  } else if (def.hazard === 'cold') {
    if (Math.random() < dt * 16 * k) sparkle(1, 28, 5, -0.2)
    // Warmth: the stage's fires, the bonfire ring and the beacon all keep you warm.
    const stage = currentStage(w.journal.phenomena, id)
    const warmAt = stage ? stagePoints(id, progressOf(w.journal.phenomena, id).stage).filter((pt) => stage.kind !== 'collect' || !progressOf(w.journal.phenomena, id).got.includes(pt.id)) : []
    const warm = warmAt.some((pt) => Math.hypot(pt.x - p.x, pt.z - p.z) < (stage?.kind === 'hold' ? stage.radius + 2 : COLD.warmRadius)) || Math.hypot(p.x, p.z) < SANCTUM_RADIUS
    ph.cold = coldStep(ph.cold, dt, { warm, intensity: k * scale })
    ph.speedFactor = coldSlow(ph.cold)
    const dps = coldDamagePerSecond(ph.cold, player.maxHp)
    if (dps > 0 && alive && now >= ph.nextColdHurt) {
      ph.nextColdHurt = now + 1.2
      if (player.damagePlayer(Math.max(1, Math.round(dps * 1.2)), now, 1)) playerHurtFx(game)
    }
  } else if (def.hazard === 'embers') {
    if (Math.random() < dt * 14 * k) sparkle(1, 24, 3, 1.2)
    if (alive && !player.hidden && now >= ph.nextEmber && ph.zones.length < 8) {
      ph.nextEmber = now + EMBER.every * (1.2 - 0.3 * k)
      const at = emberSpot(Math.random, { x: p.x, z: p.z })
      ph.zones.push({ id: `ember${now.toFixed(2)}${Math.random()}`, kind: 'ember', x: at.x, z: at.z, y: heightAt(at.x, at.z), r: EMBER.radius, born: now, warn: EMBER.warn, color: def.glow, live: false, t: 0 })
    }
    for (const z of ph.zones) {
      if (z.kind !== 'ember') continue
      z.t = Math.min(1, (now - z.born) / z.warn)
      if (!z.struck && now - z.born >= z.warn) {
        z.struck = true
        z.dead = now + 0.25
        burst(particleSystem, { x: z.x, y: fxY(game, z.y) + 1, z: z.z }, 0xff8a3a, 36, 5, 0.9)
        spawnShockwave(shockwavePool, z.x, z.z, z.r + 1, 0xff6a2a)
        sfx.play('bossSlam', { x: z.x, z: z.z })
        if (alive && !player.hidden && Math.hypot(z.x - p.x, z.z - p.z) <= z.r && !(w.jump.air && w.groundY - z.y > 3)) {
          if (player.damagePlayer(Math.max(1, Math.round(EMBER.damage * scale * (1 + progressOf(w.journal.phenomena, id).stage * 0.12))), now)) playerHurtFx(game)
        }
      }
    }
    ph.zones = ph.zones.filter((z) => !z.dead || now < z.dead)
  } else if (def.hazard === 'spores') {
    if (Math.random() < dt * 10 * k) sparkle(1, 26, 2, 0.6)
    if (alive && !player.hidden && now >= ph.nextSpore && ph.zones.length < 12) {
      ph.nextSpore = now + SPORES.every * (1.25 - 0.3 * k)
      const at = sporeSpot(Math.random, { x: p.x, z: p.z })
      ph.zones.push({ id: `spore${now.toFixed(2)}${Math.random()}`, kind: 'spore', x: at.x, z: at.z, y: heightAt(at.x, at.z), r: SPORES.radius, born: now, warn: 1.1, until: now + SPORES.life, color: def.color, live: false, t: 0, tickAt: 0 })
    }
    for (const z of ph.zones) {
      if (z.kind !== 'spore') continue
      z.t = Math.min(1, (now - z.born) / z.warn)
      z.live = now - z.born >= z.warn
      if (z.live && alive && !player.hidden && now >= z.tickAt && Math.hypot(z.x - p.x, z.z - p.z) <= z.r && !w.jump.air) {
        z.tickAt = now + SPORES.tick
        if (scale > 0.5) applyPlayerSlow?.(0.35)
        if (player.damagePlayer(Math.max(1, Math.round(SPORES.damage * scale * (1 + progressOf(w.journal.phenomena, id).stage * 0.1))), now, 1)) playerHurtFx(game)
      }
    }
    ph.zones = ph.zones.filter((z) => now < z.until)
  }
}
// (The miasma's slow is a gentle drag on speed for a moment.)
let phenSlowUntil = -Infinity
function applyPlayerSlow(seconds) {
  phenSlowUntil = timer.getElapsed() + seconds
}

// The stage runner for one storm you are in or beside.
function stepPhenomenonStage(game, id, now, dt, alive, markers) {
  const w = game.world
  const ph = w.phen
  const def = PHENOMENA[id]
  const prog = progressOf(w.journal.phenomena, id)
  const stage = def.stages[prog.stage]
  if (!stage) return
  const p = game.player.position
  const rt = phenRt(ph, id)
  const pts = stagePoints(id, prog.stage)
  const key = `${id}:${prog.stage}`
  if (ph.lastStage[id] !== key) { // a new stage: fresh runtime state
    ph.lastStage[id] = key
    w.phen.rt[id] = null
    return
  }
  const near = (pt, r) => Math.hypot(pt.x - p.x, pt.z - p.z) < r
  const color = def.glow
  if (stage.kind === 'seek') {
    for (const pt of pts) markers.push({ id: pt.id, kind: 'seek', x: pt.x, y: pt.y, z: pt.z, color, radius: stage.radius })
    if (alive && !game.player.hidden && near(pts[0], stage.radius) && Math.abs(w.groundY - pts[0].y) < 5) completePhenomenonStage(game, id)
  } else if (stage.kind === 'collect') {
    for (const pt of pts) {
      if (prog.got.includes(pt.id)) continue
      const remaining = stage.guards - (rt.guardKills[pt.id] ?? 0)
      const guarded = remaining > 0
      markers.push({ id: pt.id, kind: 'stone', x: pt.x, y: pt.y, z: pt.z, color: guarded ? 0x888899 : color })
      if (!coop?.isClient && near(pt, 48)) {
        const have = stormAlive(game, id, 'guard', pt.id)
        if (remaining > have && now > ph.spawnAt) {
          ph.spawnAt = now + 0.8
          const a = Math.random() * Math.PI * 2
          spawnStormMonster(game, id, { x: pt.x + Math.cos(a) * (5 + Math.random() * 4), z: pt.z + Math.sin(a) * (5 + Math.random() * 4) }, 'guard', { point: pt.id, elite: have === 0 && stage.guards >= 3 })
        }
      }
      if (alive && !game.player.hidden && near(pt, 2.6) && Math.abs(w.groundY - pt.y) < 4) {
        if (guarded) {
          if (now - (rt.warnedAt ?? -9) > 3) {
            rt.warnedAt = now
            questUi.showToast(`${stage.item.toUpperCase()} IS GUARDED: DEFEAT ${remaining} FIRST`)
          }
          continue
        }
        const out = collectItem(w.journal.phenomena, id, pt.id)
        setPhenomena(game, out.phenomena)
        burst(particleSystem, { x: pt.x, y: fxY(game, pt.y + 1.2), z: pt.z }, color, 36, 5)
        sfx.play('crystal', { x: pt.x, z: pt.z })
        if (out.done) completePhenomenonStage(game, id)
        else questUi.showToast(`${stage.item.toUpperCase()} ${progressOf(out.phenomena, id).n} / ${stage.n}`)
      }
    }
  } else if (stage.kind === 'purge') {
    if (!coop?.isClient && alive) {
      const need = stage.n - prog.n
      const have = stormAlive(game, id, 'purge')
      if (have < Math.min(stage.wave, need) && now > ph.spawnAt) {
        ph.spawnAt = now + 1.1
        spawnStormMonster(game, id, stormSpawnSpot(id, p), 'purge')
      }
    }
  } else if (stage.kind === 'hold') {
    const pt = pts[0]
    const inside = near(pt, stage.radius) && Math.abs(w.groundY - pt.y) < 5
    const out = stepHold(rt.hold, stage, { inside, dt, alive: alive && !game.player.hidden })
    rt.hold = out.state
    markers.push({ id: pt.id, kind: 'hold', x: pt.x, y: pt.y, z: pt.z, color, radius: stage.radius, progress: out.state.progress / stage.secs, active: inside })
    if (out.waves && !coop?.isClient) {
      for (let i = 0; i < stage.wave; i++) {
        const a = (i / stage.wave) * Math.PI * 2 + Math.random()
        spawnStormMonster(game, id, { x: pt.x + Math.cos(a) * (stage.radius + 6), z: pt.z + Math.sin(a) * (stage.radius + 6) }, 'add')
      }
      questUi.showToast(`THE STORM SENDS MORE · ${Math.max(0, Math.ceil(stage.secs - out.state.progress))}s TO GO`)
    }
    if (out.done) completePhenomenonStage(game, id)
  } else if (stage.kind === 'trial') {
    const out = stepTrial(rt.trial, stage, pts, { x: p.x, z: p.z, dt: alive ? dt : 0 })
    rt.trial = out.state
    if (out.passed !== null && out.passed !== undefined) {
      sfx.play('crystal', { x: pts[out.passed].x, z: pts[out.passed].z })
      burst(particleSystem, { x: pts[out.passed].x, y: fxY(game, pts[out.passed].y + 2), z: pts[out.passed].z }, color, 24, 5)
      if (!out.done) questUi.showToast(out.passed === 0 ? `GO! ${stage.secs}s ON THE CLOCK` : `GATE ${out.passed + 1} / ${stage.gates}`)
    }
    if (out.failed) {
      questUi.showToast('TOO SLOW: THE GATES RESET. REACH THE FIRST ONE TO TRY AGAIN')
      sfx.play('playerHurt')
    }
    pts.forEach((pt, i) => {
      if (out.state.running && i < out.state.next) return // gates already taken disappear
      const nextPt = pts[Math.min(pts.length - 1, i + 1)]
      markers.push({ id: pt.id, kind: 'gate', x: pt.x, y: pt.y, z: pt.z, color, radius: stage.radius, active: i === out.state.next, yaw: Math.atan2(nextPt.x - pt.x, nextPt.z - pt.z) + Math.PI / 2 })
    })
    if (out.done) completePhenomenonStage(game, id)
  } else if (stage.kind === 'boss') {
    // The boss waits in the storm's temple: up on the sky temple (a Depths temple's is run by stepDeepTemples).
    const arena = templeArena(id)
    if (arena.place !== 'sky') return
    const boss = game.monsters.find((m) => m.userData.phenomBoss === id && m.userData.phenomRole === 'boss' && !m.userData.dying)
    const onTemple = near(arena, SKY_TEMPLE_REACH) && w.groundY > arena.y - 5
    if (!coop?.isClient && !boss && onTemple && alive && !w.jump.air) spawnTempleBoss(game, id, stage)
  }
}

// Every live frame on the surface: the storm you stand in (fog, hazard), the first-entry hook and the stage runners.
function stepPhenomena(game, now, dt) {
  const w = game.world
  const ph = w.phen
  if (!ph) return
  const p = game.player.position
  const cleared = new Set(PHENOMENON_ORDER.filter((id) => isCleared(w.journal.phenomena, id)))
  ph.fx.update(now, p, cleared)
  if (coop?.isClient) { // (a guest's storms are the host's; the storm pads still throw a guest up to the sky temples)
    if (dt > 0 && !w.aloft) stepStormPads(game, now)
    return
  }
  const alive = game.player.hp > 0 && !game.player.falling && !game.cutscene
  // The storm you are in (or at its edge): the strongest one.
  let here = null
  let hereK = 0
  for (const def of PHENOMENON_LIST) {
    const k = w.aloft ? 0 : stormIntensity(def.id, p.x, p.z, cleared.has(def.id))
    if (k > hereK) {
      here = def.id
      hereK = k
    }
  }
  const stormKey = here ? `${here}:${hereK.toFixed(2)}:${hasGift(w.journal.phenomena, here)}` : ''
  if (stormKey !== ph.stormKey) {
    ph.stormKey = stormKey
    if (here) {
      const [near, far] = STORM_FOG[PHENOMENA[here].hazard]
      const veiled = hasGift(w.journal.phenomena, here) // (the people's gift lets you see through it)
      game.arena.world.setStorm?.(PHENOMENA[here].color, hereK * (veiled ? 0.55 : 0.9), veiled ? near * 2.5 : near, veiled ? far * 1.8 : far)
    } else game.arena.world.setStorm?.(0, 0)
  }
  if (!here || PHENOMENA[here].hazard !== 'cold') {
    ph.cold = Math.max(0, ph.cold - dt * 0.2)
    ph.speedFactor = ph.cold > 0 ? coldSlow(ph.cold) : 1
  }
  if (here && hereK >= 1 && !progressOf(w.journal.phenomena, here).started) {
    setPhenomena(game, startPhenomenon(w.journal.phenomena, here))
    const def = PHENOMENA[here]
    questUi.showToast(`${def.name.toUpperCase()}  ·  ${def.hazardText}`)
    showLootToast(hud, { title: 'A REGIONAL PHENOMENON', name: def.name, blurb: `${def.blurb} ${hasGift(w.journal.phenomena, here) ? 'Calm it, and the weather will remember you.' : `A people live inside it: find ${stormCity(here)?.name ?? 'their city'} near the edge of the world, and ${championFor(here)?.name ?? 'their champion'} will help you. Follow the GUIDE beam.`}` })
    sfx.play('bossSlam', { x: p.x, z: p.z })
    announcePhenomenonStage(game, here)
  }
  if (dt <= 0) return
  // A people's city is a refuge inside its storm: their walls, fires and lanterns keep the worst of it out.
  const refuge = Boolean(nearestVillage(p.x, p.z, VILLAGE_SAFE_RADIUS))
  if (here && hereK > 0.3 && !refuge) stepStormHazard(game, here, hereK, now, dt, alive, hazardScale(w.journal.phenomena, here))
  else if (refuge) ph.cold = Math.max(0, ph.cold - dt * 0.3)
  stepTempleHeart(game, now)
  if (!w.aloft) stepStormPads(game, now)
  if (phenSlowUntil > now) ph.speedFactor = Math.min(ph.speedFactor, 0.7)
  else if (here && PHENOMENA[here].hazard === 'spores') ph.speedFactor = 1
  // The stages: every started storm that is not calmed and that you are in or beside.
  const markers = []
  const onTemple = w.aloft ? skyTemples().find((t) => Math.hypot(t.x - p.x, t.z - p.z) < SKY_TEMPLE_REACH && w.groundY > t.y - 6) : null
  if (!w.aloft || onTemple) {
    for (const def of PHENOMENON_LIST) {
      if (cleared.has(def.id) || !progressOf(w.journal.phenomena, def.id).started) continue
      if (onTemple && onTemple.stormId !== def.id) continue
      const eye = phenomenonEye(def.id)
      if (Math.hypot(eye.x - p.x, eye.z - p.z) < PHENOMENON_RADIUS + PHEN_NEAR) stepPhenomenonStage(game, def.id, now, dt, alive, markers)
    }
  }
  ph.guide = guideTarget(w.journal.phenomena, { x: p.x, z: p.z, y: w.groundY }, ph.tracked, phenRtView(game))
  ph.fx.setGuide(ph.guide && !w.aloft ? { x: ph.guide.x, z: ph.guide.z, y: heightAt(ph.guide.x, ph.guide.z), color: PHENOMENA[ph.guide.stormId].glow } : null)
  ph.fx.setMarkers(markers)
  ph.fx.setZones(ph.zones.filter((z) => !z.struck || now < (z.dead ?? 0)))
}

// The chips: the storm you are in (stage and progress) plus its hazard (the cold meter).
function phenomenaChips(game) {
  const w = game.world
  const ph = w.phen
  if (!ph) return []
  const p = game.player.position
  const chips = []
  if (ph.guide) chips.push([hexOf(PHENOMENA[ph.guide.stormId].glow), `<b>GUIDE</b> ${guideText(ph.guide)}`])
  for (const def of PHENOMENON_LIST) {
    const prog = progressOf(w.journal.phenomena, def.id)
    if (!prog.started || prog.stage >= stageCount(def.id)) continue
    const eye = phenomenonEye(def.id)
    if (Math.hypot(eye.x - p.x, eye.z - p.z) > PHENOMENON_RADIUS + 260) continue
    const stage = def.stages[prog.stage]
    chips.push([hexOf(def.glow), `<b>${def.short.toUpperCase()} ${prog.stage + 1}/${stageCount(def.id)}</b> ${stage.title} · ${progressText(w.journal.phenomena, def.id, ph.rt[def.id] ? { hold: ph.rt[def.id].hold.progress, trial: ph.rt[def.id].trial } : {})}`])
    if (def.hazard === 'cold' && ph.cold > 0.05) chips.push(['#9fd8ff', `<b>COLD</b> ${Math.round(ph.cold * 100)}%${ph.cold >= 1 ? ' · FREEZING' : ' · stand by a fire'}`])
  }
  return chips
}

// The minimap: each uncalmed storm's wall (a pointer on the rim for the nearest one) and the current stage's spots.
function drawPhenomenaMarks(ctx, game, at, onMap, size) {
  const w = game.world
  if (!w.phen) return
  const p0 = game.player.position
  const scale = size / (MINIMAP_VIEW * 2)
  let nearest = null
  for (const def of PHENOMENON_LIST) {
    const prog = progressOf(w.journal.phenomena, def.id)
    const done = prog.stage >= stageCount(def.id)
    const eye = phenomenonEye(def.id)
    const [x, y] = at(eye.x, eye.z)
    const r = PHENOMENON_RADIUS * scale
    ctx.strokeStyle = hexOf(def.color)
    ctx.fillStyle = hexOf(def.color)
    if (done) {
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      continue
    }
    const d = Math.hypot(eye.x - p0.x, eye.z - p0.z)
    if (!nearest || d < nearest.d) nearest = { d, eye, def }
    if (onMap([x, y], r)) {
      ctx.globalAlpha = 0.18
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.9
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    if (prog.started && prog.stage < stageCount(def.id)) {
      ctx.fillStyle = hexOf(def.glow)
      for (const pt of stagePoints(def.id, prog.stage)) {
        if (prog.got.includes(pt.id)) continue
        const [sx, sy] = at(pt.x, pt.z)
        if (!onMap([sx, sy])) continue
        ctx.beginPath()
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  if (nearest && !w.phen.guide && !onMap(at(nearest.eye.x, nearest.eye.z), PHENOMENON_RADIUS * scale) && nearest.d < 1000) {
    drawMinimapPointer(ctx, size, Math.atan2(nearest.eye.z - p0.z, nearest.eye.x - p0.x), hexOf(nearest.def.color))
  }
  // The guide: a pulsing diamond on the objective (or an arrow on the rim) in the storm's colour.
  const g = w.phen.guide
  if (g) {
    const [gx, gy] = at(g.x, g.z)
    const color = hexOf(PHENOMENA[g.stormId].glow)
    if (!onMap([gx, gy], 6)) drawMinimapPointer(ctx, size, Math.atan2(g.z - p0.z, g.x - p0.x), color)
    else {
      const pulse = 5.5 + Math.sin(performance.now() / 220) * 1.5
      ctx.fillStyle = color
      ctx.strokeStyle = '#241b3a'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(gx, gy - pulse)
      ctx.lineTo(gx + pulse, gy)
      ctx.lineTo(gx, gy + pulse)
      ctx.lineTo(gx - pulse, gy)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
}

// The towers whose pads are jammed for us. A co-op guest can't run the Tower Wardens' repair jobs (those are the host's), so
// every pad works for a guest.
const NONE_JAMMED = new Set()
function jammedFor(w) {
  return coop?.isClient ? NONE_JAMMED : jammedTowers(w.journal.fixes)
}

function stepSky(game, now, dt) {
  const w = game.world
  const s = w.sky
  if (!s.fx) return
  const p = game.player.position
  const player = game.player
  if (dt > 0) {
    // The towers: stand on the pad, hold still while it charges, and up you go.
    const ok = !player.hidden && !player.falling && player.hp > 0 && !w.jump.air && !blockingPanelOpen() && !game.cutscene
    const out = stepLaunch(s.launch, { x: p.x, z: p.z, alt: w.groundY, now, ok, jammed: jammedFor(w) })
    s.launch = out.state
    for (const ev of out.events) {
      if (ev.type === 'charge') {
        sfx.play('hyperspace', { x: ev.tower.x, z: ev.tower.z })
        spawnShockwave(shockwavePool, ev.tower.x, ev.tower.z, 3, 0x5ef2d6)
      } else if (ev.type === 'launch') {
        const t = ev.tower
        w.jump = launchJump(w.jump, ev.vy)
        spawnShockwave(shockwavePool, t.x, t.z, 9, 0x5ef2d6)
        burst(particleSystem, { x: p.x, y: 0.4, z: p.z }, 0x5ef2d6, 60, 9, 0.8)
        burst(particleSystem, { x: p.x, y: 0.4, z: p.z }, 0xffffff, 30, 6, 0.6)
        triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
        input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
        sfx.play('arrive', { x: t.x, z: t.z })
        const note = noteTower(w.journal, t.id)
        if (note.first) {
          game.inventory = addCrystals(game.inventory, TOWER_FIRST_REWARD)
          questUi.showToast(`SKYLIFT ACTIVATED: ${t.name.toUpperCase()}  +${TOWER_FIRST_REWARD} CRYSTALS`)
          setJournal(game, note.journal)
          s.fx.setRidden(new Set(w.journal.towers))
        }
        questUi.showToast(`${t.isles.toUpperCase()} AHEAD · SPACE OPENS THE GLIDER`)
      }
    }
    // Charging: sparks rise up the column.
    if (s.launch.charging && now > s.chargeFxAt) {
      s.chargeFxAt = now + 0.08
      burst(particleSystem, { x: p.x + (Math.random() - 0.5) * 3, y: 0.3, z: p.z + (Math.random() - 0.5) * 3 }, 0x5ef2d6, 4, 5, 0.6)
    }

    // Which isle you're standing on (the first visit pays a little and goes in the journal).
    const isle = !w.jump.air ? isleUnder(p.x, p.z, w.groundY + 0.1) : null
    if (isle && isle.id !== s.isleId) {
      s.isleId = isle.id
      biomeBannerShow(isle.name, 0x9ff2ff, now)
      const note = noteIsle(w.journal, isle.id)
      if (note.first) {
        game.inventory = addCrystals(game.inventory, ISLE_FIRST_REWARD)
        setJournal(game, note.journal)
      }
    } else if (!w.jump.air && !isle) s.isleId = null

    // The Nimbus Crowns (Sky Relics) on the crown isles; every one of them brings the secret hero.
    for (const arch of skyArchipelagos()) {
      const r = arch.relic
      if (w.journal.relics.includes(r.id)) continue
      if (Math.hypot(r.x - p.x, r.z - p.z) > RELIC_CATCH_RADIUS || Math.abs(w.groundY - r.y) > 4.5) continue
      setJournal(game, noteRelic(w.journal, r.id).journal)
      s.fx.setRelicsTaken(new Set(w.journal.relics))
      game.inventory = addCrystals(game.inventory, RELIC_REWARD)
      player.hp = player.maxHp
      const at = { x: r.x, y: r.y + 3.8 - w.groundY, z: r.z }
      burst(particleSystem, at, 0xffd15c, 60, 7)
      burst(particleSystem, at, 0x5ef2d6, 30, 4)
      spawnShockwave(shockwavePool, r.x, r.z, 8, 0xffd15c)
      sfx.play('waveCleared', { x: r.x, z: r.z })
      questUi.showToast(`NIMBUS CROWN CLAIMED ${w.journal.relics.length}/${skyArchipelagos().length}  ·  ${arch.name.toUpperCase()}  +${RELIC_REWARD} CRYSTALS, FULLY HEALED`)
      grantCrownHero(w.journal.relics.length, true)
    }

    // Archipelagos come alive while you're up there with them, and go quiet once you're back on the land.
    for (const arch of skyArchipelagos()) {
      const d = Math.hypot(arch.x - p.x, arch.z - p.z)
      const on = s.active.has(arch.id)
      if (!on && d < arch.radius + 60 && w.groundY > arch.low - 70) activateArchipelago(game, arch, now)
      else if (on && (d > arch.radius + 120 || w.groundY < arch.low - 110)) deactivateArchipelago(game, arch)
    }
  }
  if (dt > 0 && !coop?.isClient) stepSkyfins(game, now, dt)
  if (dt > 0 && !game.cutscene && !coop?.isClient) stepTowerQuests(game, now)
  else if (dt > 0) animateTowerCells(game, now)
  w.caveFx?.update({ x: p.x, z: p.z }, now)
  s.fx.update({ x: p.x, z: p.z, y: w.groundY }, now, s.launch.charging ? { towerId: s.launch.charging, fraction: chargeFraction(s.launch, now) } : null)
}

// Co-op guest: when the host drops into the Depths, comes back up, or goes up into (or down from) the sky, we are taken
// along, to where the host stands. (Only the host falls into chasms; both ride the towers and storm pads. A guest who is
// already up in the sky, or already back on the land, when the host gets there is left where they are.)
let lastFollowAt = -Infinity
function followHost(layer) {
  const w = game.world
  if (layer === w.hostLayer) return
  const now = timer.getElapsed()
  const spot = coop.hostSpot()
  if (!spot || now - lastFollowAt < 1.5) return
  lastFollowAt = now
  w.hostLayer = layer
  const depths = (layer & 1) === 1
  const sameLevel = depths === w.depths.on && ((layer & 2) === 2) === !!w.aloft
  if (sameLevel && (!coopLeash || Math.hypot(spot.x - game.player.position.x, spot.z - game.player.position.z) < COOP_MAX_DISTANCE * 1.6)) return
  if (depths !== w.depths.on) switchWorldLayer(game, depths)
  jumpToHost(spot)
  questUi.showToast(depths ? 'FOLLOWING YOUR FRIEND DOWN INTO THE DEPTHS' : (layer & 2) ? 'FOLLOWING YOUR FRIEND UP INTO THE SKY' : 'FOLLOWING YOUR FRIEND')
}

// Puts the guest where the host stands (and at the host's height).
function jumpToHost(spot) {
  const w = game.world
  const player = game.player
  const at = arrivalSpot(spot.x, spot.z)
  const alt = Math.max(heightAt(at.x, at.z), spot.y)
  player.position.x = at.x
  player.position.z = at.z
  player.mesh.position.set(at.x, alt, at.z)
  player.vel = { x: 0, z: 0 }
  w.jump = { alt, vy: 0, air: true, gliding: false }
  w.groundY = w.camGround = alt
  w.sky.launch = createLaunchState()
  burst(particleSystem, { x: at.x, y: 1, z: at.z }, 0xcfe8ff, 30, 5, 0.7)
}
// A guest left far behind (the host respawned at a save point, a stale position at the moment of a level change...)
// is brought back to the host.
function regroupGuest(now) {
  if (!coop?.isClient || !coopLeash || now - lastFollowAt < 2) return // (no leash: a guest may roam as far as they like)
  const spot = coop.hostSpot()
  const p = game.player.position
  if (!spot || Math.hypot(spot.x - p.x, spot.z - p.z) < COOP_MAX_DISTANCE * 1.6) return
  lastFollowAt = now
  jumpToHost(spot)
  questUi.showToast('BACK WITH YOUR FRIEND')
}

// In the Wilds the fight music kicks in when a boss is close (and stays until you are well clear, so it never flaps).
let bossMusicOn = false
function bossNearby(game) {
  if (!game.world || game.labyrinth) return false
  const p = game.player.position
  const limit = bossMusicOn ? 48 : 30
  bossMusicOn = game.monsters.some((m) => m.userData.isBoss && !m.userData.dying && !m.userData.falling && Math.hypot(m.position.x - p.x, m.position.z - p.z) < limit)
  return bossMusicOn
}

// ---- The Depths: chasms take you down, Lightroots bring you up (rules in logic/depths.js, the look in src/depthsFx.js) ----
const DESCENT_SECONDS = 1.5 // how long the fall into a chasm lasts before the Depths take over
const depthsFade = (() => {
  const el = document.createElement('div')
  el.id = 'depths-fade'
  el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:45;opacity:0;background:#000'
  document.body.appendChild(el)
  return {
    // Fades the whole screen to `opacity` over `ms` (0 ms = at once) in `color`.
    to(opacity, ms, color = '#000') {
      el.style.transition = ms ? `opacity ${ms}ms ease` : 'none'
      el.style.background = color
      el.style.opacity = String(opacity)
    },
  }
})()

// Swaps which world is showing, the surface or the Depths: everything of the one you leave is let go (chunks, monsters,
// the sky isles' chests), the terrain mode flips (logic/world.js), and the arena and effects change over.
function switchWorldLayer(game, toDepths) {
  const w = game.world
  for (const key of [...w.chunks.keys()]) unloadWorldChunk(game, key)
  for (const arch of skyArchipelagos()) if (w.sky.active.has(arch.id)) deactivateArchipelago(game, arch)
  if (coop?.isClient) coop.clearPuppets() // (a guest's monsters are the host's puppets; the next snapshot brings this level's)
  for (const mesh of [...game.monsters]) dropWorldMonster(game, mesh)
  w.live.clear()
  // The Skylift towers' pillars are solid on the surface only.
  for (const o of w.sky.pillars ?? []) {
    removeFrom(game.obstacles, o)
    removeFrom(game.props, o)
    if (!toDepths) {
      game.obstacles.push(o)
      game.props.push(o)
    }
  }
  setDepthsMode(toDepths)
  game.arena.world.setDepths(toDepths)
  w.depths.fx.setDepths(toDepths)
  if (w.fx) w.fx.group.visible = !toDepths
  if (w.sky.fx) w.sky.fx.group.visible = !toDepths
  if (w.caveFx) w.caveFx.group.visible = !toDepths
  if (w.phen) {
    w.phen.fx.group.visible = !toDepths
    w.phen.fx.deep.visible = toDepths
    w.phen.speedFactor = 1
    w.phen.stormKey = ''
    game.arena.world.setStorm?.(0, 0)
  }
  clearTowerQuest(game)
  w.depths.on = toDepths
  w.depths.descent = null
  w.depths.caveDescent = null
  w.depths.ascend = createAscendState()
  w.sky.launch = createLaunchState()
  w.sky.isleId = null
  w.aloft = false
  w.biome = null // the banner announces where you arrive
  w.landmark = null
  w.lanternsAt = null
  game.arena.world.setProps([])
  game.arena.world.setGrass([])
  resetProjectiles(projectilePool)
  document.body.classList.toggle('in-depths', toDepths)
}

// You have fallen far enough: the Depths take over, and you land with a thump.
function enterDepths(game, chasm, now) {
  const w = game.world
  const player = game.player
  switchWorldLayer(game, true)
  const at = arrivalSpot(player.position.x, player.position.z)
  player.position.x = at.x
  player.position.z = at.z
  player.mesh.position.x = at.x
  player.mesh.position.z = at.z
  player.vel = { x: 0, z: 0 }
  const alt = heightAt(at.x, at.z) + 50
  w.jump = { alt, vy: -6, air: true, gliding: false }
  w.groundY = w.camGround = alt
  player.mesh.position.y = alt
  w.bannerUntil = now + 3.6
  if (biomeBanner) {
    biomeBanner.textContent = BIOMES.depths.name
    biomeBanner.style.setProperty('--biome-glow', `#${BIOMES.depths.glow.toString(16).padStart(6, '0')}`)
  }
  const note = noteChasm(w.journal, chasm.id)
  setJournal(game, note.journal)
  if (note.first) {
    game.inventory = addCrystals(game.inventory, DEPTH_FIRST_REWARD)
    questUi.showToast(`THE DEPTHS  ·  ${chasm.name.toUpperCase()}  +${DEPTH_FIRST_REWARD} CRYSTALS  ·  FIND A LIGHTROOT TO GO HOME`)
  } else questUi.showToast(`THE DEPTHS  ·  FIND A LIGHTROOT TO GO HOME`)
  setTimeout(() => depthsFade.to(0, 1100), 80)
}

// Walking through a cave's doorway (logic/caves.js): a short fade, then the cave's chamber, a pocket of the Depths.
function enterCave(game, cave, now) {
  const w = game.world
  const player = game.player
  switchWorldLayer(game, true)
  const at = caveArrival(cave)
  player.position.x = at.x
  player.position.z = at.z
  player.mesh.position.x = at.x
  player.mesh.position.z = at.z
  player.vel = { x: 0, z: 0 }
  const ground = heightAt(at.x, at.z)
  w.jump = { alt: ground, vy: 0, air: false, gliding: false }
  w.groundY = w.camGround = ground
  player.mesh.position.y = ground
  w.depths.cave = cave.id
  w.bannerUntil = now + 3.6
  if (biomeBanner) {
    biomeBanner.textContent = cave.name
    biomeBanner.style.setProperty('--biome-glow', `#${BIOMES.depths.glow.toString(16).padStart(6, '0')}`)
  }
  const note = noteCave(w.journal, cave.id)
  setJournal(game, note.journal)
  if (note.first) {
    game.inventory = addCrystals(game.inventory, CAVE_FIRST_REWARD)
    questUi.showToast(`${cave.name.toUpperCase()}  +${CAVE_FIRST_REWARD} CRYSTALS  ·  A CHEST AND GUARDS WAIT INSIDE  ·  THE LIGHTROOT TAKES YOU OUT`)
  } else questUi.showToast(`${cave.name.toUpperCase()}  ·  THE LIGHTROOT TAKES YOU OUT`)
  setTimeout(() => depthsFade.to(0, 900), 80)
}

// On the surface (or an isle): walk into a cave's doorway and you go in.
function stepCaves(game, now) {
  const w = game.world
  const player = game.player
  const d = w.depths
  if (d.caveDescent) {
    if (!d.caveDescent.faded && now - d.caveDescent.start > 0.25) {
      d.caveDescent.faded = true
      depthsFade.to(1, 450)
    }
    if (now - d.caveDescent.start >= 0.8) enterCave(game, d.caveDescent.cave, now)
    return
  }
  if (player.hidden || player.falling || player.hp <= 0 || game.cutscene || blockingPanelOpen() || w.jump.air) return
  const p = player.position
  const cave = caveAt(p.x, p.z, w.groundY)
  if (!cave) return
  d.caveDescent = { start: now, cave, faded: false }
  sfx.play('podIn', { x: cave.x, z: cave.z })
  questUi.showToast(`INTO ${cave.name.toUpperCase()}`)
}

// A Lightroot lifts you home, to the rim of the chasm it belongs to (or out of the cave it stands in).
function leaveDepths(game, beacon, now) {
  const w = game.world
  const player = game.player
  if (beacon.caveId) {
    const cave = caveById(beacon.caveId)
    switchWorldLayer(game, false)
    const out = caveExit(cave)
    const ground = surfaceAt(out.x, out.z, cave.y + 1)
    player.position.x = out.x
    player.position.z = out.z
    player.mesh.position.set(out.x, ground, out.z)
    player.vel = { x: 0, z: 0 }
    w.jump = launchJump({ alt: ground, vy: 0, air: false, gliding: false }, 8)
    w.groundY = w.camGround = ground
    w.depths.cave = null
    burst(particleSystem, { x: out.x, y: 1, z: out.z }, 0xffd9a8, 40, 5, 0.8)
    spawnShockwave(shockwavePool, out.x, out.z, 5, 0xffd9a8)
    sfx.play('arrive', { x: out.x, z: out.z })
    questUi.showToast(`BACK OUTSIDE  ·  ${cave.name.toUpperCase()}`)
    setTimeout(() => depthsFade.to(0, 800), 60)
    return
  }
  const chasm = chasmById(beacon.chasmId)
  switchWorldLayer(game, false)
  const rim = chasmRim(chasm)
  const ground = heightAt(rim.x, rim.z)
  player.position.x = rim.x
  player.position.z = rim.z
  player.mesh.position.set(rim.x, ground, rim.z)
  player.vel = { x: 0, z: 0 }
  w.jump = launchJump({ alt: ground, vy: 0, air: false, gliding: false }, 22)
  w.groundY = w.camGround = ground
  burst(particleSystem, { x: rim.x, y: 1, z: rim.z }, 0xcfe8ff, 50, 6, 0.9)
  spawnShockwave(shockwavePool, rim.x, rim.z, 7, 0xcfe8ff)
  sfx.play('arrive', { x: rim.x, z: rim.z })
  questUi.showToast(`BACK ON THE SURFACE  ·  ${chasm.name.toUpperCase()}`)
  setTimeout(() => depthsFade.to(0, 1000), 60)
}

// On the surface: walking into a chasm starts the fall.
function stepChasms(game, now) {
  const w = game.world
  const player = game.player
  const d = w.depths
  if (d.descent) {
    if (!d.descent.faded && now - d.descent.start > 0.75) {
      d.descent.faded = true
      depthsFade.to(1, 650)
    }
    if (now - d.descent.start >= DESCENT_SECONDS) enterDepths(game, d.descent.chasm, now)
    return
  }
  if (player.hidden || player.falling || player.hp <= 0 || game.cutscene || blockingPanelOpen()) return
  const p = player.position
  const c = chasmFalls(p.x, p.z)
  if (!c || w.jump.alt - heightAt(p.x, p.z) > 2.5) return // gliding over one carries you across
  d.descent = { start: now, chasm: c, faded: false }
  w.jump = { alt: w.jump.alt, vy: -4, air: true, gliding: false }
  spawnShockwave(shockwavePool, p.x, p.z, 4, 0x9a5aff)
  sfx.play('hyperspace', { x: p.x, z: p.z })
  triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
  questUi.showToast(`THE GROUND GIVES WAY  ·  ${c.name.toUpperCase()}`)
}

// Down in the Depths: Lightroots to climb out by, Umbral Hearts to claim, and the dark.
function stepDepths(game, now, dt) {
  const w = game.world
  const d = w.depths
  const player = game.player
  const p = player.position
  biomeBanner?.classList.toggle('show', now < w.bannerUntil)
  if (dt > 0) stepDeepTemples(game, now)
  let charging = null
  if (dt > 0) {
    const ok = !coop?.isClient && !player.hidden && !player.falling && player.hp > 0 && !w.jump.air && !blockingPanelOpen() && !game.cutscene
    const out = stepAscend(d.ascend, { x: p.x, z: p.z, now, ok })
    d.ascend = out.state
    for (const ev of out.events) {
      if (ev.type === 'charge') {
        sfx.play('hyperspace', { x: ev.beacon.x, z: ev.beacon.z })
        spawnShockwave(shockwavePool, ev.beacon.x, ev.beacon.z, 3, 0xcfe8ff)
      } else if (ev.type === 'ascend') {
        depthsFade.to(1, 0, '#e8f4ff')
        leaveDepths(game, ev.beacon, now)
        return
      }
    }
    if (d.ascend.charging) charging = { beaconId: d.ascend.charging, fraction: ascendFraction(d.ascend, now) }

    // The Umbral Hearts: each lies in its lair, and is yours once the guardian is down.
    for (const lair of depthsLairs()) {
      const r = lair.relic
      if (w.journal.depthRelics.includes(r.id)) continue
      if (Math.hypot(r.x - p.x, r.z - p.z) > RELIC_CLAIM_RADIUS || Math.abs(w.groundY - heightAt(r.x, r.z)) > 4.5) continue
      const bossDown = coop?.isClient ? !game.monsters.some((m) => m.userData.isBoss && Math.hypot(m.position.x - r.x, m.position.z - r.z) < 30) : w.killed.has(`${lair.id}:boss`) // (a guest sees the host's boss as a puppet)
      if (!bossDown) {
        if (now > d.hintAt) {
          d.hintAt = now + 5
          questUi.showToast('THE GUARDIAN STILL STANDS  ·  DEFEAT IT TO TAKE THE HEART')
        }
        continue
      }
      setJournal(game, noteDepthRelic(w.journal, r.id).journal)
      d.fx.setRelicsTaken(new Set(w.journal.depthRelics))
      game.inventory = addCrystals(game.inventory, DEPTH_RELIC_REWARD)
      player.hp = player.maxHp
      const at = { x: r.x, y: 3 - 0, z: r.z }
      burst(particleSystem, at, 0xd23aff, 60, 7)
      burst(particleSystem, at, 0xffffff, 24, 4)
      spawnShockwave(shockwavePool, r.x, r.z, 9, 0xd23aff)
      sfx.play('waveCleared', { x: r.x, z: r.z })
      questUi.showToast(`UMBRAL HEART ${w.journal.depthRelics.length}/${depthsLairs().length}  ·  ${lair.name.toUpperCase()}  +${DEPTH_RELIC_REWARD} CRYSTALS, FULLY HEALED`)
      grantDepthsHero(w.journal.depthRelics.length, true)
    }

    // The status chips: where you are, the way out, how many hearts.
    const hearts = w.journal.depthRelics.length
    const html = [
      ['#b48aff', '<b>THE DEPTHS</b> a Lightroot (pale beam) lifts you home'],
      ['#e08aff', `<b>UMBRAL HEARTS</b> ${hearts}/${depthsLairs().length}`],
      ...(charging ? [['#cfe8ff', '<b>LIGHTROOT</b> hold still...']] : []),
    ].map(([c, text]) => `<div class="ws-chip" style="--c:${c}">${text}</div>`).join('')
    if (html !== wildsStatusKey) {
      wildsStatusKey = html
      if (wildsStatus) wildsStatus.innerHTML = html
    }
    drawDepthsMinimap(game, now)
  }
  d.fx.update(now, charging)
}

// The minimap while you are down there: no land to paint, just the dark with the way out and the hearts.
function drawDepthsMinimap(game, now) {
  if (!minimap) return
  const ctx = minimap.getContext('2d')
  const size = minimap.width
  const p0 = game.player.position
  const k = size / (MINIMAP_VIEW * 2)
  const at = (x, z) => [size / 2 + (x - p0.x) * k, size / 2 + (z - p0.z) * k]
  const onMap = ([x, y], pad = 6) => x > -pad && y > -pad && x < size + pad && y < size + pad
  ctx.fillStyle = '#07050f'
  ctx.fillRect(0, 0, size, size)
  const [cx, cy] = at(0, 0)
  ctx.strokeStyle = 'rgba(154, 90, 255, 0.5)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, WORLD_RADIUS * k, 0, Math.PI * 2)
  ctx.stroke()
  for (const m of game.monsters) {
    if (m.userData.dying || m.userData.falling) continue
    const [x, y] = at(m.position.x, m.position.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = m.userData.isBoss ? '#ffd15c' : '#ff4d6d'
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
  }
  for (const c of game.chests) {
    if (c.userData.opened) continue
    const [x, y] = at(c.position.x, c.position.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = '#ffd15c'
    ctx.fillRect(x - 2.5, y - 2.5, 5, 5)
  }
  // Lightroots: pale diamonds; an arrow on the rim points at the nearest when none is on the map.
  let nearest = null
  for (const b of beacons()) {
    const dist = Math.hypot(b.x - p0.x, b.z - p0.z)
    if (!nearest || dist < nearest.dist) nearest = { b, dist }
    const [x, y] = at(b.x, b.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = '#e8f4ff'
    ctx.strokeStyle = '#241b3a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, y - 6)
    ctx.lineTo(x + 5, y)
    ctx.lineTo(x, y + 6)
    ctx.lineTo(x - 5, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  if (nearest && !onMap(at(nearest.b.x, nearest.b.z), -10)) drawMinimapPointer(ctx, size, Math.atan2(nearest.b.z - p0.z, nearest.b.x - p0.x), '#e8f4ff')
  // The Umbral Hearts not yet claimed: magenta rings.
  for (const lair of depthsLairs()) {
    if (game.world.journal.depthRelics.includes(lair.relic.id)) continue
    const [x, y] = at(lair.x, lair.z)
    if (!onMap([x, y], 12)) continue
    ctx.strokeStyle = '#e08aff'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.stroke()
  }
  const p = game.player
  const [px, py] = at(p0.x, p0.z)
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(Math.PI - p.facing)
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
  ctx.font = '600 11px Sora, sans-serif'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = 'rgba(16, 10, 36, 0.7)'
  ctx.fillRect(0, size - 17, size, 17)
  ctx.fillStyle = '#d8c8ff'
  ctx.textAlign = 'left'
  ctx.fillText('The Depths', 6, size - 3)
  ctx.textAlign = 'right'
  ctx.fillText(`♥ ${game.world.journal.depthRelics.length}/${depthsLairs().length}`, size - 6, size - 3)
}

// ---- Skyfins: the sky's hunters (rules in logic/skyFlyers.js) ----
const rockGeometry = new THREE.DodecahedronGeometry(0.75, 0)
const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.9, flatShading: true })

// Sends packs in while you're up in the sky, and drops their rocks.
function stepSkyfins(game, now, dt) {
  const w = game.world
  const s = w.sky
  const player = game.player
  const p = player.position
  const alive = game.monsters.filter((m) => m.userData.flight && !m.userData.dying).length
  const danger = Math.min(1, dangerAt(p.x, p.z) + 0.2)
  const out = stepFlyerDirector(s.flyers, { now, aloft: w.aloft && player.hp > 0 && !game.cutscene, alive, danger })
  s.flyers = out.state
  for (let i = 0; i < out.spawn; i++) {
    const at = flyerSpawnPoint(p.x, w.groundY, p.z)
    const mesh = spawnWildMonster(game, SKYFIN, { x: at.x, z: at.z }, { danger, skyIsle: true, hpScale: 1 + danger * 1.2 })
    mesh.userData.skyIsle = true // lives up in the sky: it can only reach you (and be reached) while you're up there too
    mesh.userData.flight = createFlight(at, Math.random, now)
    mesh.rotation.order = 'YXZ' // turn, then pitch nose-down into a dive
    mesh.position.y = at.y
    const effect = game.spawnEffects[game.spawnEffects.length - 1]
    if (effect?.monster === mesh) effect.effect.group.position.y = at.y
  }
  if (out.spawn > 0) {
    sfx.play('announcement', { x: p.x, z: p.z })
    if (!s.warned) {
      s.warned = true
      questUi.showToast('SKYFINS! THEY SWOOP AFTER A SHRIEK — DODGE, THEN HIT BACK')
    }
  }
  // Their rocks fall until they hit you or the ground (or an isle) below.
  const me = { x: p.x, y: (w.jump.air ? w.jump.alt : w.groundY) + 1, z: p.z }
  s.rocks = s.rocks.filter((r) => {
    const step = stepRock(r.state, { p: me, dt, floor: surfaceAt(r.state.x, r.state.z, r.state.y) })
    r.state = step.rock
    r.mesh.position.set(r.state.x, r.state.y, r.state.z)
    r.mesh.rotation.x += dt * 4
    r.mesh.rotation.z += dt * 3
    if (step.hit && !player.hidden && w.aloft && player.damagePlayer(r.damage, now)) playerHurtFx(game)
    if (step.hit || step.landed) {
      const at = { x: r.state.x, y: r.state.y - w.groundY, z: r.state.z }
      shardBurst(particleSystem, at, 0x8a7a6a, 10, 4)
      burst(particleSystem, at, 0xd8c8b0, 14, 3)
      if (Math.abs(r.state.y - w.groundY) < 30) sfx.play('hit', { x: r.state.x, z: r.state.z })
      r.mesh.removeFromParent()
      return false
    }
    return true
  })
}

// One Skyfin's frame: fly, shriek, bite, drop rocks, leave.
function flySkyfin(game, mesh, dt0, now) {
  const ud = mesh.userData
  const w = game.world
  const player = game.player
  const dt = dt0 * statusTimeScale(ud, now) // frozen ones hang still
  ud.flight.x = mesh.position.x // a knockback moves it
  ud.flight.z = mesh.position.z
  const alt = w ? (w.jump.air ? w.jump.alt : w.groundY) : 0
  const p = { x: player.position.x, y: alt + 1, z: player.position.z }
  const leave = !w || !w.aloft || player.hp <= 0
  const { flight, events } = stepFlight(ud.flight, { p, dt, now, leave })
  ud.flight = flight
  for (const ev of events) {
    if (ev.type === 'wind') {
      sfx.play('swing', { x: flight.x, z: flight.z })
      burst(particleSystem, { x: flight.x, y: flight.y - (w?.groundY ?? 0), z: flight.z }, 0xff6b6b, 10, 3)
    } else if (ev.type === 'bite') {
      const ghost = now < (player.ghostUntil ?? -Infinity)
      if (!player.hidden && !ghost && player.damagePlayer(Math.round(MONSTER_TYPES[SKYFIN].damage * (ud.damageScale ?? 1)), now)) playerHurtFx(game)
    } else if (ev.type === 'drop' && w) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial)
      rock.castShadow = true
      // It lets go right over you: the red ring shows where it will land, about a second's fall away.
      rock.position.set(p.x, ev.y, p.z)
      game.arena.group.add(rock) // goes with the world when the run ends
      w.sky.rocks.push({ mesh: rock, state: { x: p.x, y: ev.y, z: p.z, vy: 0 }, damage: Math.round(MONSTER_TYPES[SKYFIN].damage * ROCK_DAMAGE_SCALE * (ud.damageScale ?? 1)) })
      spawnShockwave(shockwavePool, p.x, p.z, ROCK_HIT_RADIUS, 0xff5a5a) // where it will land
    } else if (ev.type === 'gone') {
      dropWorldMonster(game, mesh)
      return false
    }
  }
  mesh.position.set(flight.x, flight.y, flight.z)
  mesh.rotation.y = Math.atan2(flight.dir.x, flight.dir.z)
  mesh.rotation.x = -Math.asin(Math.max(-1, Math.min(1, flight.dir.y))) * 0.85
  mesh.rotation.z = Math.sin(now * 1.7 + flight.orbit) * 0.12
  ud.speed = 0
  updateFrozenLook(mesh, now)
  updateJelly(mesh, dt0, now, { speed: 0, moveDir: ud.moveDir })
  updateFace3D(mesh, dt0, now)
  updateMonsterHitReaction(mesh, dt0)
  return true
}

// The banner that names a biome also names the sky isle you step onto.
function biomeBannerShow(text, glow, now) {
  if (!biomeBanner || !game?.world) return
  biomeBanner.textContent = text
  biomeBanner.style.setProperty('--biome-glow', `#${glow.toString(16).padStart(6, '0')}`)
  game.world.bannerUntil = now + 3.2
}

// Status chips for the sky: the lift charging, a tower's pad nearby, an updraft to ride.
function skyChips(game, now) {
  const w = game.world
  const s = w.sky
  const p = game.player.position
  const chips = []
  if (s.launch.charging) chips.push(['#5ef2d6', `<b>SKYLIFT</b> charging ${Math.round(chargeFraction(s.launch, now) * 100)}% · hold still`])
  else if (!w.jump.air) {
    const jammed = jammedFor(w)
    for (const t of skyTowers()) {
      if (Math.hypot(t.x - p.x, t.z - p.z) < 14 && Math.abs(w.groundY - t.y) < 6) {
        if (jammed.has(t.id)) chips.push(['#ff8aa8', `<b>${t.name.toUpperCase()}</b> is jammed: talk to ${towerIssue(t).keeper} (E)`])
        else chips.push(['#5ef2d6', `<b>${t.name.toUpperCase()}</b> step onto the glowing pad to launch`])
      }
    }
  }
  for (const t of skyTowers()) {
    const f = fixOf(w.journal.fixes, t.id)
    if (towerIssue(t) && f.stage === 'accepted') chips.push(['#ffd37a', `<b>FIX ${t.name.toUpperCase()}</b> ${fixProgressText(w.journal.fixes, t)}`])
  }
  const cave = !w.jump.air ? caves().find((c) => Math.hypot(c.x - p.x, c.z - p.z) < 14 && Math.abs(w.groundY - c.y) < 5) : null
  if (cave) chips.push(['#ffd9a8', `<b>${cave.name.toUpperCase()}</b> walk into the doorway to go in`])
  if (w.jump.air && !w.jump.gliding) {
    for (const a of skyArchipelagos()) {
      const u = a.updraft
      if (Math.hypot(u.x - p.x, u.z - p.z) < u.radius + 8 && w.jump.alt > u.y0 && w.jump.alt < u.y1) chips.push(['#cff8ff', '<b>UPDRAFT</b> open the glider (Space) to ride it up'])
    }
  }
  if (w.jump.air && w.aloft && w.jump.vy < -20 && !w.jump.gliding) chips.push(['#ffd0e0', '<b>FALLING</b> Space opens the glider'])
  return chips
}

// Minimap: towers (a teal spire) and, near them, the isles above (pale rings; gold for an unclaimed relic).
function drawSkyMarks(ctx, game, at, onMap) {
  const w = game.world
  if (!w?.sky?.fx) return
  for (const arch of skyArchipelagos()) {
    for (const isle of arch.isles) {
      const [x, y] = at(isle.x, isle.z)
      if (!onMap([x, y], 10)) continue
      const r = Math.max(2, isle.radius * (ctx.canvas.width / (MINIMAP_VIEW * 2)))
      ctx.strokeStyle = isle.crown && !w.journal.relics.includes(arch.relic.id) ? '#ffd15c' : 'rgba(207, 248, 255, 0.75)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 2])
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
  const jammed = jammedFor(w)
  for (const c of caves()) {
    const [x, y] = at(c.x, c.z)
    if (!onMap([x, y], 6)) continue
    ctx.fillStyle = w.journal.caves.includes(c.id) ? '#ffd9a8' : c.kind === 'isle' ? '#7ff0d8' : '#9a7650'
    ctx.strokeStyle = '#241b3a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, y + 3, 5, Math.PI, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  for (const t of skyTowers()) {
    if (towerIssue(t) && fixOf(w.journal.fixes, t.id).stage === 'accepted') {
      for (const cell of issueCells(t)) {
        if (fixOf(w.journal.fixes, t.id).cells.includes(cell.id) || towerIssue(t).kind !== 'cells') continue
        const [cx, cy] = at(cell.x, cell.z)
        if (!onMap([cx, cy], 4)) continue
        ctx.fillStyle = '#ffd37a'
        ctx.beginPath()
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    }
  }
  for (const t of skyTowers()) {
    const [x, y] = at(t.x, t.z)
    if (!onMap([x, y])) continue
    ctx.fillStyle = jammed.has(t.id) ? '#c4506e' : w.journal.towers.includes(t.id) ? '#5ef2d6' : '#2f8a7a'
    ctx.strokeStyle = '#241b3a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, y - 7)
    ctx.lineTo(x + 4, y + 4)
    ctx.lineTo(x - 4, y + 4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
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
const hexColor = (c) => `#${c.toString(16).padStart(6, '0')}`
// A world height as the effect layers see it (they ride up with the player: see applyFxDepth).
const fxY = (game, worldY) => worldY - (game.world?.groundY ?? 0)

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
  const out = stepEventDirector(w.events, { now, safe, busy: Boolean(w.race.active) || Boolean(lakeAt(p.x, p.z, 0.3)) || game.player.hp <= 0 || w.aloft, danger })
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
    if (blockingPanelOpen()) return
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
  chips.push(...skyChips(game, now))
  chips.push(...phenomenaChips(game))
  const html = chips.map(([c, text]) => `<div class="ws-chip" style="--c:${c}">${text}</div>`).join('')
  if (html === wildsStatusKey) return
  wildsStatusKey = html
  if (wildsStatus) wildsStatus.innerHTML = html
}

function stepActivities(game, now) {
  const w = game.world
  if (!w.fx) return
  if (w.lootQueue.length && !blockingPanelOpen()) giveWildsLoot(game, w.lootQueue.shift())
  stepLanterns(game)
  stepShrines(game, now)
  const treasure = stepTreasure(game, now)
  stepRaces(game, now)
  if (!coop?.isClient) stepWildEvents(game, now)
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
  drawPhenomenaMarks(ctx, game, at, onMap, size)
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
    if (mesh.userData.dying || mesh.userData.falling || mesh.userData.spawning || mesh.userData.isBoss || mesh.userData.netPuppet) continue
    if (Math.hypot(mesh.position.x - p.x, mesh.position.z - p.z) > UNLOAD_RADIUS + 30) dropWorldMonster(game, mesh)
  }

  scene.background?.copy?.(game.arena.fog.color)

  // The ground under the player (the effect layers and the camera ride on it).
  w.groundY = w.jump.air ? w.jump.alt : surfaceAt(p.x, p.z, w.jump.alt)
  w.camGround += (w.groundY - w.camGround) * (dt > 0 ? 1 - Math.exp(-(w.jump.air ? (Math.abs(w.jump.vy) > 25 ? 30 : 12) : 5) * dt) : 1) // keeps up with a glide down a hill (and a Skylift launch)
  w.aloft = isAloft(p.x, p.z, w.groundY)
  game.arena.shadowY = w.camGround // the sun's shadow box follows you up to the isles
  game.arena.world.setAltitude?.(w.camGround - heightAt(p.x, p.z), w.camGround)
  if (dt > 0) regroupGuest(now)
  if (!w.depths.on && dt > 0 && !coop?.isClient) {
    stepChasms(game, now)
    if (!w.depths.descent) stepCaves(game, now)
  } // (in co-op only the host falls: a guest follows the host's level, see followHost)
  stepChampion(game, now, dt)
  if (w.depths.on) game.player.inVillage = false // (no villages down there)
  if (w.depths.on) {
    stepDepths(game, now, dt)
    return
  }

  // Villagers: they amble, look at you, wear a marker for their quest state, and E talks to the nearest.
  let nearest = null
  let nearestDistance = Infinity
  for (const npc of w.npcs.values()) {
    if (!npc.mesh.visible) continue // (a champion who is out with you is not home; one who is aloft-hidden waits)
    if (npc.mesh.userData.rig && npc.def.villageId && dt > 0) { // the storm peoples fret until their storm is calm
      const storm = villageById(npc.def.villageId)?.stormId
      const worried = Boolean(storm) && !isCleared(w.journal.phenomena, storm)
      if (npc.mesh.userData.rig.worried !== worried) setMood(npc.mesh, worried)
    }
    const d = dt > 0 ? updateNpc(npc, dt, now, p) : Math.hypot(npc.mesh.position.x - p.x, npc.mesh.position.z - p.z)
    setNpcMarker(npc, npc.def.follow ? null : npc.def.guide ? sageMarker(game, npc.def.guide) : npc.def.merchant ? 'offer' : npc.def.keeper ? keeperMarker(game, npc.def.keeper) : npcMarker(w.quests, npc.def))
    if (d < nearestDistance) {
      nearest = npc
      nearestDistance = d
    }
  }
  const canTalk = nearest && nearestDistance < TALK_RANGE && !game.player.hidden && game.player.hp > 0 && !game.cutscene
  questUi.setPrompt(canTalk && !lastHidePrompt ? `${input.touchMode ? 'Tap TALK' : 'E'}  to talk to ${nearest.def.name}` : null)
  if (canTalk && !lastHidePrompt && dt > 0 && input.wasHidePressed()) openTalk(game, nearest)
  questUi.setTracker(w.quests)

  // Inside a village the monsters lose you (monster.js reads `inVillage`); they can't come in after you either.
  game.player.inVillage = Boolean(villageKeepOut(p.x, p.z))

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
  stepPhenomena(game, now, dt)
  stepSky(game, now, dt)
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
  // The difficulty's toughness (logic/difficulty.js): bosses keep their own speed scaling.
  const d = diff()
  const toughness = stats.boss ? d.bossHp : d.monsterHp
  if (toughness !== 1) mesh.userData.hp = mesh.userData.maxHp = Math.max(1, Math.round(mesh.userData.maxHp * toughness))
  if (!stats.boss) mesh.userData.speedScale = (mesh.userData.speedScale ?? 1) * d.monsterSpeed
  if (d.monsterDamage && d.monsterDamage !== 1) mesh.userData.damageScale = (mesh.userData.damageScale ?? 1) * d.monsterDamage
  scene.add(mesh)
  game.monsters.push(mesh)
  coop?.registerMonster(mesh) // co-op: an id the host's snapshots use for it

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
  mesh.userData.damageScale = bossDamageScale(fights) * (diff().monsterDamage ?? 1)
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

// Co-op joiner: the host's boss arrived (a puppet here), so play its intro too: the same red carpet,
// lines and title, framed on our player. Waits up to 8 s for the boss to stream in, then gives up.
function startRemoteBossCutscene(game, now) {
  const pending = game.remoteCutscene
  if (!coop?.isClient) {
    game.remoteCutscene = null
    return
  }
  const mesh = game.monsters.find((m) => m.userData.netPuppet && m.userData.isBoss && !m.userData.dying)
  if (!mesh) {
    if (now - pending.since > 8) game.remoteCutscene = null
    return
  }
  game.remoteCutscene = null
  const boss = bossById(mesh.userData.type)
  if (!boss) return
  const { player } = game
  const dx = player.position.x - mesh.position.x
  const dz = player.position.z - mesh.position.z
  const length = Math.hypot(dx, dz) || 1
  const carpet = createCarpet({ x: player.position.x, z: player.position.z }, { x: mesh.position.x, z: mesh.position.z })
  scene.add(carpet.group)
  game.cutscene = { boss, mesh, dir: { x: dx / length, z: dz / length }, state: createCutscene(), lines: introLines(boss.name, boss.lines), carpet, remote: true }
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
      for (const other of coop?.isClient ? [] : game.monsters) { // a co-op joiner's monsters are the host's to hurt
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
    if (mesh.userData.towerCamp) towerCampKill(game, mesh.userData.towerCamp)
    if (mesh.userData.phenom) phenomenonKill(game, mesh)
    else if (game.world.phen) game.world.phen.cold = Math.max(0, game.world.phen.cold - COLD.killWarm * 0.5)
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
  const zeroG = trick.id === 'checkout' || trick.id === 'vipCheckout' ? (heroTrait() === 'zerog' ? tn().ringOut : 1) : 1 // Cosmo Nova's ring-outs
  const points = Math.round(trickPoints(scoreForKill(mesh.userData.type), game.chainState.multiplier) * activeFx(game.inventory.equipped).scoreMult * diff().score * zeroG)
  game.score += points
  progressNote({ type: 'kill', monster: mesh.userData.type, trick: trick.id })
  if (mesh.userData.isBoss) progressNote({ type: 'boss' })
  if (game.chainState.multiplier > 1) progressNote({ type: 'chain', value: game.chainState.multiplier })
  progressNote({ type: 'score', value: game.score })
  const killHeal = activeFx(game.inventory.equipped).killHeal
  if (killHeal) game.player.hp = Math.min(game.player.maxHp, game.player.hp + killHeal)
  const pointsLine = game.chainState.multiplier > 1 ? `+${points} ×${game.chainState.multiplier}` : `+${points}`
  showPopup(popupPool, position, trick.name, pointsLine, popupColorForTrick(trick.id))
  showTrickSticker(hud, { name: trick.name, points, multiplier: game.chainState.multiplier, tone: trickToneForId(trick.id) })
  sfx.play(killVoiceForTrick(trick.id), position)
  input.rumble(RUMBLE_MEDIUM_STRENGTH, RUMBLE_MEDIUM_DURATION)
  if (cause !== 'fall') onHeroKill(mesh, position)
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

  updateJelly(player.mesh, deltaSeconds, elapsedSeconds, { speed: 0, moveDir: player.moveDir, still: heroById(heroProfile().hero).id !== 'guest' })
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
    if (!cutscene.remote) game.waveState = beginBossFight(game.waveState) // a joiner's waves follow the host's

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
    if (coop?.isClient) {
      // The host decides when the party goes down (it runs the waves); ask, once in a while.
      if (now - lastFloorRequest > 1.5) {
        lastFloorRequest = now
        coop.requestFloor()
      }
    } else {
      advanceFloor(game)
      coop?.sendFloor()
    }
  }
}
let lastFloorRequest = -Infinity

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
    const best = loadHighScore(getDifficulty())
    saveHighScore({ bestScore: Math.max(best.bestScore, game.score), bestWave: Math.max(best.bestWave, game.waveState.waveNumber) }, getDifficulty())
    const payout = finishRun(game) ?? 0
    document.getElementById('win-score').textContent = `Score: ${game.score}${payout ? ` · Checkout tip: +${payout} ◆ banked` : ''}`
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
  resetPoison(contagionPool)
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
let coop = null // online co-op (src/coop.js), created once the first game exists
let coopSwingStarted = false // a swing started this frame (sent with our next state)
// Sandbox mode (pick it on the start card: B or its button): no waves, a
// menu (Tab) to spawn anything / equip anything / hop levels, free
// crystals, no cooldowns and (by default) god mode. See src/sandbox.js.
let sandbox = false
let duelMode = false // a 1v1 duel (co-op's PvP mode, see stepDuelRound)
let duel = createDuel()
let duelRivals = 0 // how many rivals we had last frame (a new one starts a fresh match)
let duelStake = NO_STAKE // what the host put on the line (the host's pick; on the guest, what the host told us)
let godMode = true
let sandboxPanel = null

// Tutorial mode (start card: G or its button): no waves, god mode, and a checklist card
// that walks through moving, attacking, killing, hiding and opening a chest.
let tutorial = false
let tutorialState = createTutorial()
let tutorialPanel = null
let tutorialLastPos = null
let tutorialSetupStep = -1
const freePlay = () => sandbox || tutorial || duelMode // (a duel: no waves, no progress, Normal difficulty)
// No waves at all: the sandbox, the tutorial and the free roam world.
const noWaves = () => freePlay() || Boolean(game?.world) || Boolean(coop?.isClient) // a co-op joiner mirrors the host's waves

// ---------- difficulty (logic/difficulty.js) and long-term progress (logic/progress.js) ----------
// The sandbox and the tutorial always play at Normal and never feed contracts / mastery.
const diff = () => (freePlay() ? DIFFICULTIES.normal : difficultyById(coop?.difficulty ?? getDifficulty())) // a co-op joiner plays at the host's difficulty
function applyDifficulty() {
  const d = diff()
  setWaveTuning({ size: d.waveSize, interval: d.spawnInterval })
  document.body.dataset.difficulty = d.id
}
// Progress changes on nearly every kill, so it's kept in memory and saved a moment later.
let progressSaveTimer = null
function saveProgressSoon() {
  if (progressSaveTimer) return
  progressSaveTimer = setTimeout(() => {
    progressSaveTimer = null
    saveProfile(profile)
  }, 2500)
}
// Feeds one run event into contracts, hero mastery and records; pays what they earned into the bank.
function progressNote(event) {
  if (freePlay() || !game || !started) return
  const result = progressEvent(profile.progress, event, { hero: profile.hero, difficulty: getDifficulty() })
  if (result.progress === profile.progress && !result.bank) return
  let next = { ...profile, progress: result.progress }
  if (result.bank) next = bankCrystals(next, result.bank)
  for (const up of result.levelUps) if (up.skin !== null) next = grantSkin(next, up.hero, up.skin)
  profile = next
  saveProgressSoon()
  for (const done of result.done) {
    sfx.play('waveCleared')
    showLootToast(hud, { title: 'CONTRACT COMPLETE', name: done.text, blurb: `+${done.reward} ◆ banked. A new contract is waiting [I]` })
  }
  for (const up of result.levelUps) {
    const hero = heroById(up.hero)
    const skinName = up.skin !== null ? hero.skins[up.skin]?.name : null
    sfx.play('chestOpen')
    const awakened = up.level === AWAKEN_LEVEL && HERO_ABILITIES[up.hero]
    showLootToast(hud, awakened
      ? { title: `MASTERY ${up.level} · AWAKENED!`, name: hero.name, blurb: `${hero.trait.id ? `${hero.trait.name} grows far stronger, and ` : ''}${HERO_ABILITIES[up.hero].name} is yours: press B. +${up.reward} ◆${skinName ? `, ${skinName} skin` : ''}` }
      : { title: `MASTERY ${up.level}`, name: hero.name, blurb: `+${up.reward} ◆ banked${skinName ? `, and the ${skinName} skin is yours` : ''}` })
  }
  if (result.done.length || result.levelUps.length) hub.refresh()
}
// The end of a run (lost, or the labyrinth won): the checkout tip, records, and the game-over summary.
function finishRun(game) {
  if (game.runFinished || freePlay() || game.world) return null
  game.runFinished = true
  const payout = runPayout({ wave: game.waveState.waveNumber, score: game.score, bosses: game.bossesDefeated ?? 0, difficulty: getDifficulty() })
  progressNote({ type: 'runEnd' })
  if (payout > 0) profile = bankCrystals(profile, payout)
  saveProfile(profile)
  return payout
}

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
const masteryPanel = createMasteryPickPanel({
  onPick(choice) {
    masteryRun.pick = choice
    masteryRun.hero = heroProfile().hero
    const def = HERO_ULTIMATES[heroProfile().hero]
    if (choice.kind === 'ult') showLootToast(hud, { title: `ULTIMATE [${input.touchMode ? 'tap ★' : 'K'}]`, name: def.name, blurb: def.desc })
    else showLootToast(hud, { title: 'MASTERY BOOST', name: statPick(choice.id).name, blurb: `${statPick(choice.id).desc} for this run` })
    input.clear()
  },
})
// A panel that pauses everything (the chest swap, the mastery-8 pick).
function blockingPanelOpen() {
  return swapPanel.isOpen() || masteryPanel.isOpen()
}
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && swapPanel.isOpen()) {
    pendingSwapLoot = null
    swapPanel.hide()
  }
})
function toggleMenu() {
  if (sandbox) return sandboxPanel.toggle()
  if (!started || game.player.hp <= 0 || blockingPanelOpen() || hub.isOpen()) return
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
    if (!open) {
      refreshDragons()
      redressHero()
    }
  },
})
const HUB_KEYS = { Digit6: 'skills', Numpad6: 'skills', Digit7: 'powerups', Numpad7: 'powerups', KeyJ: 'gunsmith', KeyN: 'dragons', KeyY: 'heroes', KeyI: 'contracts', Digit9: 'loadout', Numpad9: 'loadout' }
function canOpenHub() {
  return !blockingPanelOpen() && !pauseMenu.isOpen() && !(started && game.player.hp <= 0) && !(started && !sandbox && loadoutPanel.isOpen()) && !(started && sandbox && sandboxPanel?.isOpen?.())
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
document.getElementById('heroes-open-btn')?.addEventListener('click', () => hub.open('heroes'))
document.getElementById('contracts-open-btn')?.addEventListener('click', () => hub.open('contracts'))
// Difficulty (Relax / Normal / Hard), picked on the start card and remembered.
function showDifficulty() {
  const current = getDifficulty()
  for (const btn of document.querySelectorAll('.diff-btn')) btn.classList.toggle('on', btn.dataset.difficulty === current)
  const blurb = document.getElementById('difficulty-blurb')
  if (blurb) blurb.textContent = difficultyById(current).blurb
}
for (const btn of document.querySelectorAll('.diff-btn')) {
  btn.addEventListener('click', () => {
    if (started || !DIFFICULTY_IDS.includes(btn.dataset.difficulty)) return
    setDifficulty(btn.dataset.difficulty)
    applyDifficulty()
    showDifficulty()
  })
}
showDifficulty()
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
  getMusicStyle: () => MUSIC_STYLE_LABELS[music.getStyle()],
  onToggleMusicStyle: () => music.setStyle(nextMusicStyle(music.getStyle())),
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
  if (!started || blockingPanelOpen() || hub.isOpen() || (!sandbox && loadoutPanel.isOpen())) return
  pauseMenu.toggle()
}
window.addEventListener('keydown', (event) => {
  if (event.repeat) return
  if (event.code === 'Digit8' || event.code === 'Numpad8') togglePause()
  else if (event.code === 'Escape' && pauseMenu.isOpen()) pauseMenu.setOpen(false)
  else if (event.code === 'Escape' && !blockingPanelOpen() && !event.hubClosed) togglePause()
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
  if (hub.isOpen() || event?.target?.closest?.('#hub-open-btn, #heroes-open-btn, #contracts-open-btn, #difficulty-row, #hub-root, #graphics-btn, #coop-btn, #coop-panel') || HUB_KEYS[event?.code]) return
  if (event && (event.code === 'KeyP' || coop?.isOpen())) return // P opens the co-op panel (a co-op join starts the run with no event)
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
    if (coop?.isClient || coop?.connecting) return // a joiner plays the host's mode (joinMode)
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
  guard('mastery pick', () => offerMasteryPick()) // mastery 8: the ultimate or a +10% stat for this run
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
grantDepthsHero(loadJournal().depthRelics.length)
grantTwilightHero()
grantStormHero(clearedCount(loadJournal().phenomena))
grantCrownHero(loadJournal().relics.length) // a save that already holds every Nimbus Crown gets the secret hero

// Dev-server only: lets browser tests (and you, in the console) peek at the state.
if (import.meta.env.DEV) {
  window.__debug = {
    input, get game() { return game }, get coop() { return coop },
    // Hero powers (sandbox): pick a hero, spawn monsters near you, read the awakened state.
    setSandboxHero(id) { sandboxHeroPick = { hero: id, heroSkins: {} } },
    spawn(type, n = 1) { for (let i = 0; i < n; i++) spawnMonster(game, type, { at: { x: game.player.position.x + Math.sin(i * 1.3) * (4 + i), z: game.player.position.z + Math.cos(i * 1.3) * (4 + i) } }) },
    get heroState() { return heroState },
    get music() { return music },
    // Co-op browser tests: give this run a pet, or jump straight to the next boss's intro.
    addPet(id) { game.pets.push(spawnPet(id, game)) },
    bossNext() { game.waveState = { ...game.waveState, wavesUntilBoss: 0 } },
    get bulletPool() { return bulletPool },
    // The Wilds: jump to a storm city or its temple, e.g. goto('Gildenspire'), goto('sandstorm') (dev only).
    goto(where) {
      const w = game.world
      if (!w) return 'start the Wilds first'
      const key = String(where).toLowerCase()
      const city = villages().find((v) => v.city && (v.name.toLowerCase() === key || v.species === key))
      const at = city ?? (PHENOMENA[key] ? phenomenonEye(key) : null)
      if (!at) return 'try Gildenspire, Rimehold, Pyreholm, Lanternmere, or sandstorm / whiteout / ashstorm / miasma'
      const p = game.player.position
      p.x = at.x + (city ? 0 : 20)
      p.z = at.z + (city ? 6 : 0)
      game.player.mesh.position.x = p.x
      game.player.mesh.position.z = p.z
      return `at ${city ? city.name : key}`
    },
  }
}

// ---------- online co-op (P; src/coop.js) ----------
// The hurt feedback every source of player damage shares.
function playerHurtFx(game) {
  const { player } = game
  triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
  triggerDamageFlash(hud)
  sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
  input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
  game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
}

// Co-op downs: at 0 HP you drop (out of the fight) and get back up at the middle a few seconds later;
// the run only ends when everyone is down at once (the host decides and tells everyone).
function stepCoopDown(game, now) {
  const player = game.player
  const standUp = () => {
    game.coopDownAt = null
    player.mesh.visible = !firstPerson
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + COOP_RESPAWN_IFRAMES)
    burst(particleSystem, { x: player.position.x, y: 0.8, z: player.position.z }, 0x7dffc4, 36, 4, 1)
    spawnShockwave(shockwavePool, player.position.x, player.position.z, 4, 0x7dffc4)
  }
  if (player.hp > 0) {
    if (game.coopDownAt != null) standUp() // healed back up (a wave-clear heal)
    return
  }
  if (game.coopDownAt == null) {
    game.coopDownAt = now
    player.mesh.visible = false
    game.attackState.swingElapsed = null
    shardBurst(particleSystem, { x: player.position.x, y: 0.8, z: player.position.z }, 0xff6a4d, 24, 4)
    if (coop.remoteCount() > 0) questUi.showToast(`YOU'RE DOWN! BACK UP IN ${coop.respawnSeconds}s`)
  }
  if (coop.everyoneDown(true) && !game.world) { // (the Wilds never end your run: everyone gets back up at a save point)
    game.coopOver = true
    coop.sendGameOver()
    return
  }
  if (now - game.coopDownAt >= coop.respawnSeconds && (game.world || !coop.everyoneDown(true))) {
    player.hp = Math.max(1, Math.round(player.maxHp * COOP_RESPAWN_HP))
    if (game.world) {
      respawnAtCheckpoint(game, now, { toast: false, heal: false, near: true })
      standUp()
      return
    }
    player.position.x = 0
    player.position.z = 0
    player.mesh.position.x = 0
    player.mesh.position.z = 0
    player.vel = { x: 0, z: 0 }
    standUp()
  }
}

// ---------- 1v1 duel (co-op's PvP mode; rules in logic/duel.js, the rival stand-in in coop.js) ----------
const duelChip = document.createElement('div')
duelChip.id = 'duel-chip'
duelChip.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:40;display:none;padding:8px 18px;border-radius:999px;background:rgba(26,36,51,0.82);color:#fff;font:700 15px Sora,system-ui,sans-serif;letter-spacing:0.04em;pointer-events:none;white-space:nowrap;max-width:calc(100vw - 32px);overflow:hidden;text-overflow:ellipsis'
document.body.appendChild(duelChip)

// The host picked "Host a 1v1 duel" (or a plain game after one): switch our own game over first.
function setDuel(on) {
  if (on === duelMode) return
  if (!started) dismissStartCard()
  joinMode(on ? 'duel' : 'resort')
  restartGame()
  applyDifficulty()
}

// Both stand up at their corners, full health, with a moment of invulnerability.
function resetDuelRound(game, now) {
  const player = game.player
  const spot = duelSpawn(!coop?.isClient)
  player.hp = player.maxHp
  player.falling = false
  player.position.x = spot.x
  player.position.z = spot.z
  player.mesh.position.set(spot.x, 0, spot.z)
  player.mesh.rotation.set(0, 0, 0)
  player.vel = { x: 0, z: 0 }
  player.facing = spot.facing
  player.mesh.visible = !firstPerson
  player.invulnerableUntil = Math.max(player.invulnerableUntil, now + DUEL_START_IFRAMES)
  game.coopDownAt = null
  game.duelDown = false
  spawnShockwave(shockwavePool, spot.x, spot.z, 4, 0x7dffc4)
}

function stepDuelRound(game, now) {
  const player = game.player
  const rivals = coop?.remoteCount() ?? 0
  if (rivals > 0 && duelRivals === 0) { // a rival arrived: a fresh match
    duel = createDuel()
    resetDuelRound(game, now)
    questUi.showToast(`DUEL! ${String(coop.rivalName() ?? 'YOUR RIVAL').toUpperCase()} STEPS ONTO THE DECK`)
    if (coop.isHost) coop.sendStake(duelStake) // (tell the newcomer what's on the line)
  }
  duelRivals = rivals
  if (!rivals) {
    if (player.hp <= 0) resetDuelRound(game, now)
    duelChip.textContent = 'DUEL · WAITING FOR A RIVAL TO JOIN'
    duelChip.style.display = ''
    return
  }
  // We went down (knocked out or rung out): the rival takes the round.
  if (duel.phase === 'fight' && !game.duelDown && (player.hp <= 0 || player.falling)) {
    game.duelDown = true
    if (player.hp <= 0) {
      game.coopDownAt = now // (no moving or swinging while down)
      player.mesh.visible = false
      game.attackState.swingElapsed = null
      shardBurst(particleSystem, { x: player.position.x, y: 0.8, z: player.position.z }, 0xff6a4d, 24, 4)
    }
    coop.sendKo()
    const before = duel.phase
    duel = scoreKo(duel, false, now)
    if (before !== 'over' && duel.phase === 'over') settleDuel()
    questUi.showToast(duel.phase === 'over' ? `${String(coop.rivalName()).toUpperCase()} WINS THE DUEL` : player.falling ? 'RUNG OUT! THE ROUND GOES TO YOUR RIVAL' : 'KNOCKED OUT! THE ROUND GOES TO YOUR RIVAL')
    sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
  }
  if (player.hp <= 0 && game.coopDownAt == null) game.coopDownAt = now // (fell to 0 between rounds)
  const out = stepDuel(duel, now)
  duel = out.duel
  if (out.reset) {
    resetDuelRound(game, now)
    questUi.showToast(duel.round === 1 && duel.me === 0 && duel.them === 0 ? 'A NEW MATCH! FIGHT!' : `ROUND ${duel.round}: FIGHT!`)
  }
  duelChip.textContent = duelScoreText(duel, String(coop.rivalName() ?? 'RIVAL').toUpperCase()) + (duelStake.kind !== 'none' ? `  ·  ON THE LINE: ${stakeLabel(duelStake).toUpperCase()}` : '')
  duelChip.style.display = ''
}

// ---- stakes: the host puts something they own on the line; if the guest wins the match they get a copy (the host keeps theirs) ----
// The host picks it in the co-op panel (returns why not, or null).
function chooseDuelStake(key) {
  if (!duelMode || !coop?.isHost) return 'Only the host of a duel can put something on the line.'
  if (stakeLocked(duel)) return 'The match has started: the stake is locked until it ends.'
  const stake = stakeOptions(profile).find((o) => stakeKey(o) === key)
  if (!stake || !ownsStake(profile, stake)) return "You don't own that."
  duelStake = cleanStake(stake)
  coop.sendStake(duelStake)
  questUi.showToast(duelStake.kind === 'none' ? 'NOTHING ON THE LINE' : `ON THE LINE: ${stakeLabel(duelStake).toUpperCase()}`)
  return null
}
// The guest hears what's on the line.
function hearDuelStake(raw) {
  if (!duelMode || coop?.isHost) return
  const next = cleanStake(raw)
  if (stakeKey(next) === stakeKey(duelStake)) return
  duelStake = next
  questUi.showToast(next.kind === 'none' ? 'THE HOST TOOK THE STAKE OFF THE TABLE' : `THE HOST PUTS ${stakeLabel(next).toUpperCase()} ON THE LINE: WIN THE DUEL TO GET IT!`)
}
// The match is over: the guest who won gets their copy.
function settleDuel() {
  if (duelStake.kind === 'none') return
  const label = stakeLabel(duelStake).toUpperCase()
  const rival = String(coop?.rivalName() ?? 'YOUR RIVAL').toUpperCase()
  if (coop?.isHost) {
    questUi.showToast(duel.winner === 'me' ? `YOU DEFENDED ${label}!` : `${rival} WON A COPY OF ${label} (YOU KEEP YOURS)`)
    return
  }
  if (duel.winner !== 'me') {
    questUi.showToast(`YOU LOST: ${label} STAYS WITH ${rival}`)
    return
  }
  const { profile: next, gained } = awardStake(profile, duelStake)
  if (gained) setProfile(next)
  showLootToast(hud, { title: 'DUEL PRIZE', name: stakeLabel(duelStake).replace(/^the (hero|pet) /, ''), blurb: gained ? `You beat ${coop?.rivalName() ?? 'the host'} and won ${stakeLabel(duelStake)}! It's yours to keep.` : `You won ${stakeLabel(duelStake)}, but you already had it.` })
}

// The rival's attack landed on us (their game decided it hit).
function takeDuelHit({ damage, knockback, fromPos }) {
  const player = game.player
  if (!started || !duelCanHit(duel) || game.duelDown || player.falling) return
  const now = timer.getElapsed()
  if (!player.damagePlayer(duelDamage(damage), now)) return
  playerHurtFx(game)
  if (knockback > 0) {
    const push = knockbackVector(fromPos, player.position, knockback)
    player.position.x += push.x
    player.position.z += push.z
    player.mesh.position.x = player.position.x
    player.mesh.position.z = player.position.z
  }
}

// Co-op plays every mode: the host's mode is everyone's (the welcome carries it, see joinMode).
let lastLeashToast = -Infinity
// Must co-op players in the Wilds stay within COOP_MAX_DISTANCE of each other? The host decides (the co-op panel's checkbox);
// a guest hears it in the welcome and whenever it changes. Off: anyone may roam anywhere (monsters only live around the host).
let coopLeash = true
function setCoopLeash(on, fromHost = false) {
  on = on !== false
  if (on === coopLeash) return
  coopLeash = on
  if (!fromHost) coop?.sendLeash(on)
  if (game?.world || fromHost) questUi.showToast(on ? `CO-OP: STAY WITHIN ${COOP_MAX_DISTANCE} M OF EACH OTHER` : 'CO-OP: ROAM AS FAR AS YOU LIKE (MONSTERS ONLY SHOW UP AROUND THE HOST)')
}
function canCoop() {
  return null
}
const coopMode = () => (duelMode ? 'duel' : sandbox ? 'sandbox' : tutorial ? 'tutorial' : gameMode)

// A joiner switches to the host's mode before the run restarts in the host's place.
function joinMode(mode) {
  mode = cleanMode(mode)
  if (mode === coopMode()) return
  if (mode === 'duel' || duelMode) {
    duelMode = mode === 'duel'
    duel = createDuel()
    duelRivals = 0
    duelStake = NO_STAKE
    if (duelMode) {
      gameMode = 'resort' // (the duel is fought on the Orbital Sundeck)
      disposeGame(game)
      game = createGame()
      return
    }
  }
  if (sandbox || tutorial) {
    window.location.reload() // (rare: they were in the sandbox / tutorial themselves; start over from the card)
    return
  }
  if (mode === 'sandbox') startSandbox()
  else if (mode === 'tutorial') startTutorial()
  else {
    gameMode = mode
    disposeGame(game)
    game = createGame()
  }
}

coop = createCoop({
  scene,
  particleSystem,
  getGame: () => game,
  now: () => timer.getElapsed(),
  disposeObject3D,
  canCoop,
  mode: coopMode,
  duel: () => duelMode,
  duelCanHit: () => duelCanHit(duel),
  setDuel,
  onPvpHit: (hit) => takeDuelHit(hit),
  leash: () => coopLeash,
  setLeash: (on) => setCoopLeash(on),
  onLeash: (on) => setCoopLeash(on, true),
  onStake: (raw) => hearDuelStake(raw),
  stakeChoices: () => stakeOptions(profile).map((o) => ({ key: stakeKey(o), label: o.kind === 'none' ? 'Nothing' : stakeLabel(o).replace(/^the /, '') })),
  currentStakeKey: () => stakeKey(duelStake),
  stakeLocked: () => stakeLocked(duel),
  chooseStake: (key) => chooseDuelStake(key),
  onDuelKo(name) {
    if (!started || !duelMode) return
    const before = duel.phase
    duel = scoreKo(duel, true, timer.getElapsed())
    if (before !== 'over' && duel.phase === 'over') settleDuel()
    questUi.showToast(duel.phase === 'over' ? 'YOU WIN THE DUEL!' : `${String(name).toUpperCase()} IS DOWN! THE ROUND IS YOURS`)
    sfx.play('waveCleared', { x: game.player.position.x, z: game.player.position.z })
  },
  layer: () => (game.world ? (game.world.depths.on ? 1 : 0) | (game.world.aloft ? 2 : 0) : 0),
  difficultyId: () => getDifficulty(),
  toast: (text) => questUi.showToast(text),
  // Joined a host: a fresh run in their place, at their difficulty, mirroring their waves.
  onJoined(welcome) {
    if (!started) dismissStartCard()
    joinMode(welcome.mode)
    restartGame()
    applyDifficulty()
    if (welcome.level) changeLevel(game, welcome.level)
  },
  // The session ended. A joiner carries on solo from the same wave (their own waves start up again).
  onEnded(reason, wasClient) {
    if (!started) return
    duelChip.style.display = 'none'
    if (duelMode) { // the duel is over: back to a normal game on the sundeck
      joinMode('resort')
      restartGame()
      applyDifficulty()
      if (reason !== 'left') questUi.showToast('YOUR RIVAL LEFT. THE DUEL IS OVER')
      return
    }
    applyDifficulty()
    if (wasClient) {
      const fresh = createWaveState()
      game.waveState = { ...fresh, waveNumber: game.waveState.waveNumber, inWater: Boolean(waterRoom()) }
      if (reason !== 'left') questUi.showToast('THE HOST LEFT. CARRYING ON SOLO')
    }
    game.coopOver = false
    if (game.coopDownAt != null) {
      game.player.hp = Math.max(1, Math.round(game.player.maxHp * COOP_RESPAWN_HP))
      stepCoopDown(game, timer.getElapsed())
    }
  },
  // A monster's swing landed on us in the host's game.
  onHurt(amount, trueFraction) {
    if (game.coopDownAt != null || game.coopOver) return
    if (game.player.damagePlayer(amount, timer.getElapsed(), trueFraction)) playerHurtFx(game)
  },
  // A host monster's attack (a slam, a fan of orbs, a signature...) plays out here against our own player.
  onEvents(mesh, events) {
    if (!started || game.coopOver) return
    if (applyBossEvents(game, mesh, events, timer.getElapsed())) playerHurtFx(game)
  },
  // Our hit finished a monster in the host's game: the kill (score, trick, crystals) is ours.
  onKill(m) {
    if (!started || typeof m.type !== 'string' || !MONSTER_TYPES[m.type]) return
    const x = Number(m.x) || 0
    const z = Number(m.z) || 0
    const position = { x, y: 0, z }
    const ghost = { userData: { type: m.type, isBoss: Boolean(m.b), lastHitAmbush: Boolean(m.a), lastHitDazed: Boolean(m.dz) }, position }
    const cause = typeof m.c === 'string' ? m.c : 'sword'
    scoreKill(game, ghost, cause, position, timer.getElapsed())
    const stolen = Math.max(0, Math.min(9999, Number(m.st) || 0))
    if (cause !== 'fall') {
      dropCrystals(crystalSystem, x, z, crystalDrops(m.type, Boolean(m.b)))
      if (stolen > 0) dropCrystals(crystalSystem, x, z, crystalChange(refundWithTip(stolen)))
    } else if (stolen > 0) {
      game.inventory = addCrystals(game.inventory, refundWithTip(stolen))
    }
  },
  // The host's waves: cleared, boss beaten (on to the next place), boss arriving.
  onWaveEvents(m) {
    if (!started || !Array.isArray(m.e)) return
    const events = m.e.filter((e) => typeof e === 'string')
    applyWaveEvents(game, events, Number(m.n) || game.waveState.waveNumber, { name: String(m.boss ?? '') || 'THE BOSS' }, Number.isInteger(m.lvl) ? m.lvl : null)
    if (events.includes('waveCleared') || events.includes('bossDefeated')) attractAllCrystals(crystalSystem)
    if (events.includes('bossIntro')) {
      questUi.showToast(`${String(m.boss || 'A BOSS').toUpperCase()} HAS CHECKED IN!`)
      game.remoteCutscene = { since: timer.getElapsed() } // play the intro once the host's boss shows up here
    }
  },
  // The host's wave counter (for the HUD) and place (resyncs us if we missed a jump).
  onWaveState(w) {
    if (!started || typeof w.phase !== 'string') return
    game.waveState = { ...game.waveState, waveNumber: Number(w.waveNumber) || 1, phase: w.phase, phaseElapsed: Number(w.phaseElapsed) || 0, spawnedCount: Number(w.spawnedCount) || 0 }
    const level = Number(w.levelIndex) || 0
    if (level !== (game.levelIndex ?? 0) && !game.levelTransition && !w.transitioning) changeLevel(game, level)
    if (game.world && coop?.isClient) followHost(Number(w.layer) || 0)
  },
  // The party goes down a floor (the host stepped on the exit, or asked for it).
  onFloor() {
    if (game.labyrinth && !game.labyrinth.won) advanceFloor(game)
  },
  onFloorRequest() {
    const lab = game.labyrinth
    if (!lab || !lab.gateOpen || lab.won) return
    advanceFloor(game)
    coop.sendFloor()
  },
  onRestart() {
    restartGame()
    applyDifficulty()
  },
  onGameOver() {
    game.coopOver = true
  },
  // Someone else swung or fired: their weapon's effect where they stand.
  onSwingFx(weaponId, at, facing) {
    if (!WEAPONS[weaponId] || !Number.isFinite(facing)) return
    playWeaponFx(weaponId, at, facing, { particleSystem, shockwavePool, warp, shake: () => {} })
    sfx.play('swing', at)
  },
  // A friend's shots: drawn and flown in our game too, but harmless (their game does the hits).
  onRemoteShots(bullets) {
    if (!started || !bullets.length) return
    fireBullets(bulletPool, bullets)
  },
  // A friend used an ability: a flash and ring where they stand, in the ability's colour.
  onRemoteAbility(id, at) {
    if (!started) return
    const color = COOP_ABILITY_COLORS[id] ?? 0xfff27a
    burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, color, 26, 3)
    spawnShockwave(shockwavePool, at.x, at.z, id === 'shockwave' || id === 'glacier' ? 6 : 3, color)
    sfx.play('swing', at)
  },
  // A friend used their hero ability (B): its name over them and a big burst in their hero's glow.
  // (Their game does the real work -- damage, heals, dashes -- so this is the look only.)
  onRemoteHeroAbility(heroId, at, aim, info) {
    if (!started) return
    const def = info.ultimate ? HERO_ULTIMATES[heroId] : HERO_ABILITIES[heroId]
    if (!def) return
    const color = info.glow
    const radius = info.ultimate ? 14 : Math.max(5, Math.min(12, def.range ?? 7))
    if (info.ultimate) column(at.x, at.z, color, 7, 16)
    showPopup(popupPool, at, def.name.toUpperCase(), `${info.name.toUpperCase()}'S ${info.ultimate ? 'ULTIMATE' : 'HERO ABILITY'}`, info.ultimate ? '#ff5fa8' : '#ffd15c')
    burst(particleSystem, { x: at.x, y: 0.8, z: at.z }, color, 34, radius * 0.8, 0.45)
    burst(particleSystem, { x: at.x, y: 1.2, z: at.z }, 0xffffff, 14, radius * 0.5, 0.35)
    spawnShockwave(shockwavePool, at.x, at.z, radius, color)
    spawnShockwave(shockwavePool, at.x, at.z, radius * 0.55, 0xffffff)
    column(at.x, at.z, color, 5)
    const reach = Math.min(def.range ?? 8, 14)
    streak(at, { x: at.x + Math.sin(aim) * reach, z: at.z + Math.cos(aim) * reach }, color, 10)
    warp.add('ripple', at.x, at.z, radius + 1, 0.5)
    sfx.play('bossSlam', at)
  },
  // A friend opened one of their chests: a toast saying what they got.
  onRemoteChestOpened(at, info) {
    if (!started) return
    questUi.showToast(info.loot ? `${info.name.toUpperCase()} GOT ${info.loot.toUpperCase()}!` : `${info.name.toUpperCase()} OPENED A CHEST`)
    sfx.play('chestOpen', at)
  },
  chestStyle: () => containerStyle(game),
  // A joiner's view of the water: monsters float / lurk / rise relative to OUR diver (see monsterSwimY).
  puppetY(mesh, time) {
    return waterRoom() ? monsterSwimY(mesh, time) : null
  },
  // A joiner: the host's boss died on screen -- our own free chests (and a power-up) where it fell.
  onPuppetBossDeath(mesh) {
    if (!started) return
    dropBossLoot(game, { x: mesh.position.x, z: mesh.position.z })
  },
  // Host: a joined player's hit on one of our monsters (already scaled by their gear and hero).
  applyRemoteHit(mesh, hit) {
    const reach = hit.diving && (mesh.userData.deep || mesh.userData.submerged) // a diving friend can reach the deep dwellers
    if (reach) setDeepShield(false)
    damageMonster(mesh, hit.damage, { fromPos: hit.fromPos, knockback: hit.knockback, obstacles: game.obstacles, particleSystem, cause: hit.cause, ambush: hit.ambush, raw: true, by: hit.by })
    if (reach) setDeepShield(Boolean(waterRoom()) && !waterState.diving)
  },
  // Host: a joined player froze / slowed / confused one of our monsters.
  applyRemoteStatus(mesh, m) {
    const now = timer.getElapsed()
    const secs = (v) => Math.max(0, Math.min(30, Number(v) || 0))
    if (m.fr) applyFreeze(mesh.userData, now, secs(m.fr))
    if (Array.isArray(m.sl)) applySlow(mesh.userData, now, secs(m.sl[0]), Math.max(0.05, Math.min(1, Number(m.sl[1]) || 1)))
    if (m.cf && !mesh.userData.isBoss) mesh.userData.confusedUntil = Math.max(mesh.userData.confusedUntil ?? -Infinity, now + secs(m.cf))
  },
})
window.addEventListener('keydown', (event) => {
  if (event.repeat || event.code !== 'KeyP' || event.target?.closest?.('input, textarea')) return
  if (hub.isOpen() || blockingPanelOpen()) return
  coop.toggle()
})
document.getElementById('coop-btn')?.addEventListener('click', () => coop.toggle(true))
touchControls?.addMenuButton(() => coop.toggle(), 'CO-OP')


const timer = new THREE.Timer()

// Co-op: what our pets look like right now, for the others to draw (logic/coop.js's packPets).
function coopPetRows(game) {
  if (!coop?.active) return []
  const rows = []
  for (const pet of game.pets) {
    for (const unit of [pet, ...(pet.buddies ?? [])]) {
      if (!unit.mesh) continue
      rows.push({
        key: unit.def.model === 'dragon' ? `d:${unit.def.id}` : unit.def.model,
        x: unit.mesh.position.x, z: unit.mesh.position.z, y: unit.mesh.position.y, rotY: unit.mesh.rotation.y,
        beamTo: unit.beamTo ?? null,
      })
    }
  }
  return rows
}
// Co-op: our chests, so friends can see them (logic/coop.js's packChests). Ids are handed out lazily.
let coopChestSeq = 0
function coopChestRows(game) {
  if (!coop?.active) return []
  return game.chests.map((c) => {
    c.userData.coopId ??= ++coopChestSeq
    return { id: c.userData.coopId, x: c.position.x, z: c.position.z, y: c.position.y, cost: c.userData.cost, affordable: game.inventory.crystals >= c.userData.cost, opened: c.userData.opened }
  })
}
const COOP_ABILITY_COLORS = { blink: 0xe9a3ff, shockwave: 0xffd27a, heal: 0x7dffb0, shield: 0x66f0ff, rage: 0xff5a4a, glacier: 0xbfe9ff, frostlance: 0xbfe9ff, timewarp: 0x9fd0ff, vacuum: 0xb48cff, whirl: 0xffffff, storm: 0xfff27a }

// Throws the current run away and starts a fresh one (same map).
function restartGame() {
  coop?.sendRestart() // co-op host: everyone starts the new run together
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
  resetPoison(contagionPool)
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
  offerMasteryPick() // a fresh run: the mastery-8 choice again
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

  // Co-op: send our state, stream the host's monsters, move the other players. Runs even while this
  // game is paused in a menu or a cutscene, so the connection and everyone else's game keep going.
  if (coop) {
    coop.frame(deltaSeconds, elapsedSeconds, {
      player: game.player,
      down: game.coopDownAt != null,
      weapon: selectedWeaponId(game.inventory),
      look: { hero: heroLook().heroId, skin: heroLook().id },
      swingStarted: coopSwingStarted,
      cutscene: Boolean(game.cutscene),
      pets: coopPetRows(game),
      chests: coopChestRows(game),
    })
    coopSwingStarted = false
  }

  if (started && game.player.hp < game.player.maxHp * 0.3) heroRescue(elapsedSeconds)
  // Downed But Determined: back up at half HP, once per revive the skill tree grants.
  if (started && !sandbox && !duelMode && game.player.hp <= 0 && (game.revivesUsed ?? 0) < activeFx(game.inventory.equipped).revive) {
    game.revivesUsed = (game.revivesUsed ?? 0) + 1
    game.player.hp = Math.round(game.player.maxHp * 0.5)
    game.player.invulnerableUntil = Math.max(game.player.invulnerableUntil, elapsedSeconds + 3)
    burst(particleSystem, { x: game.player.position.x, y: 0.8, z: game.player.position.z }, 0xfff27a, 40, 4, 1)
    spawnShockwave(shockwavePool, game.player.position.x, game.player.position.z, 5, 0xfff27a)
    showLootToast(hud, { title: 'SKILL', name: 'Downed But Determined', blurb: 'You got back up!' })
  }
  // The Wilds never end your run: at zero HP you get back up at the last save point.
  if (started && game.world && game.player.hp <= 0 && !coop?.active) respawnAtCheckpoint(game, elapsedSeconds)
  // Co-op: going down isn't the end while a friend is still standing (stepCoopDown gets you back up).
  if (started && coop?.active && duelMode) stepDuelRound(game, elapsedSeconds)
  else if (started && coop?.active && !game.coopOver) stepCoopDown(game, elapsedSeconds)
  const gameState = game.coopOver
    ? 'lost'
    : game.labyrinth?.won
    ? 'won'
    : coop?.active && game.player.hp <= 0
    ? 'playing'
    : evaluateGameState({ playerHp: game.player.hp })
  winScreen.style.display = gameState === 'won' ? 'flex' : 'none'
  if (game.labyrinth) updateFloorChip(game)

  if (input.wasPressed('KeyM') || input.wasMutePressed()) music.toggleMuted()
  // Paused (pause menu or the hub): a chill lo-fi loop instead of the fight music.
  const chillOut = gameState === 'playing' && started && (pauseMenu.isOpen() || hub.isOpen())
  music.setMuffled(gameState !== 'playing')
  music.setMode(pickTrack({
    style: music.getStyle(),
    paused: chillOut,
    bossFight: game.waveState.phase === 'bossFight' && gameState === 'playing',
    bossNear: gameState === 'playing' && bossNearby(game),
    world: Boolean(game.world),
    depths: Boolean(game.world?.depths.on),
    aloft: Boolean(game.world?.aloft),
    labyrinth: Boolean(game.labyrinth),
    biome: game.world?.biome ?? 'sanctum',
  }))

  // Recorded once, the frame the player dies: compares this run against
  // the saved high score, persists the new best, and freezes the stats
  // the game-over overlay shows (score/wave keep changing on `game` if
  // we let the loop keep running, but it doesn't past this point).
  if (gameState === 'lost' && !game.gameOverRecorded) {
    game.gameOverRecorded = true
    const mode = getDifficulty()
    const previousBest = loadHighScore(mode)
    const isNewBest = game.score > previousBest.bestScore
    const bestScore = Math.max(previousBest.bestScore, game.score)
    const bestWave = Math.max(previousBest.bestWave, game.waveState.waveNumber)
    saveHighScore({ bestScore, bestWave }, mode)
    const payout = finishRun(game)
    game.gameOverStats = {
      wave: game.waveState.waveNumber, score: game.score, bestScore, isNewBest,
      difficulty: difficultyById(mode).name, payout, bank: profile.bank,
      contracts: profile.progress.contracts.map((c) => ({ text: contractText(c), progress: c.progress, goal: c.goal })),
    }
  }
  showGameOverlay(hud, gameState === 'lost' ? 'lost' : null, game.gameOverStats)

  if (!started || gameState !== 'playing') {
    if (started && gameState !== 'playing' && (input.wasPressed('KeyR') || input.wasRestartPressed())) {
      if (coop?.isClient) questUi.showToast('THE HOST STARTS THE NEXT RUN')
      else restartGame()
    }
    renderMenuBackdrop(timestamp, MENU_IDLE_FPS)
    input.endFrame()
    return
  }

  if (pauseMenu.isOpen()) {
    renderMenuBackdrop(timestamp, MENU_FROZEN_FPS)
    input.endFrame()
    return
  }

  if (game.remoteCutscene && !game.cutscene) startRemoteBossCutscene(game, elapsedSeconds)
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
  if (game.world && input.wasPressed('KeyU') && !questUi.isOpen() && !blockingPanelOpen() && !hub.isOpen()) openJournal(game)
  if (loadoutOpen() || blockingPanelOpen() || hub.isOpen() || questUi.isOpen() || journalUi.isOpen()) {
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
  const downed = game.coopDownAt != null // co-op: down and waiting to get back up (no moving, swinging or using things)

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
  applyWaveEvents(game, events, clearedWaveNumber, bossBeforeStep)
  if (events.length && coop?.isHost) {
    const nextIndex = events.includes('bossDefeated') && !game.labyrinth ? game.levelTransition?.levelIndex ?? null : null
    coop.sendWaveEvents({ e: events, n: clearedWaveNumber, boss: (events.includes('bossIntro') ? currentBoss(game.waveState) : bossBeforeStep)?.name ?? '', lvl: nextIndex })
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
  const wantMaxHp = Math.max(1, Math.round((PLAYER_MAX_HP + perk.maxHp) * (diff().playerHp ?? 1))) // Benji Mode halves it
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
  player.speedMultiplier = petFx.speedMultiplier * perk.speed * (holdSprinting() ? SHIFT_SPRINT_MULTIPLIER : 1) * (elapsedSeconds < player.sprintUntil ? SPRINT_SPEED_MULTIPLIER : 1) * (elapsedSeconds < (player.whirlUntil ?? -Infinity) ? 1.3 : 1) * (elapsedSeconds < heroState.speedUntil ? 1.5 : 1) * (heroRaging(elapsedSeconds) ? tn().speed : 1) * player.speedFactor(elapsedSeconds) * (game.world?.phen?.speedFactor ?? 1) * (duelMode ? DUEL_SPEED : 1)
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
  // Tap Shift to dash (hold it to keep sprinting): along the way you're moving, or your facing when still.
  if (!room && !downed && !player.hidden && !player.falling && player.hp > 0 && (input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight'))) {
    const moving = player.speed > 0.5
    const dir = moving ? player.moveDir : { x: Math.sin(player.facing), z: Math.cos(player.facing) }
    const dashStart = { x: player.position.x, z: player.position.z }
    if (player.dash(elapsedSeconds, dir, DASH_COOLDOWN * heroFx().dash)) {
      onHeroDash(dashStart, elapsedSeconds)
      burst(particleSystem, { x: player.position.x, y: 0.5, z: player.position.z }, heroLook().accent, 14, 3, 0.35)
      sfx.play('swing', { x: player.position.x, z: player.position.z })
    }
  }
  if (!downed) {
    // In the Wilds an obstacle only blocks you up to its top: hop or glide over a rock, a tree, a cottage...
    const allObstacles = player.obstacles
    // (Landing on top of one, you're inside its circle: it lets you walk off rather than trapping you.)
    if (game.world) {
      const { x, z } = player.position
      const air = game.world.jump.air
      player.obstacles = allObstacles.filter((o) => !(air && clearsObstacle(o, game.world.jump.alt)) && Math.hypot(o.x - x, o.z - z) > o.radius + PLAYER_RADIUS * 0.5)
    }
    const leashFrom = { x: player.position.x, z: player.position.z }
    player.update(input, cameraYaw, deltaSeconds, room ? true : null)
    player.obstacles = allObstacles
    // Co-op in the Wilds: the host only runs the land around the host, so nobody strays far from a friend.
    if (game.world && coop?.active && coopLeash && !player.falling) { // (the host can turn this off: coopLeash)
      // Only a step AWAY from a friend is stopped, so a friend who teleports (a respawn) never drags you along.
      const away = coop.peers().filter((f) => Math.hypot(player.position.x - f.x, player.position.z - f.z) > Math.hypot(leashFrom.x - f.x, leashFrom.z - f.z))
      const leash = leashPosition(player.position, away)
      if (leash.held) {
        player.position.x = leash.x
        player.position.z = leash.z
        player.mesh.position.x = leash.x
        player.mesh.position.z = leash.z
        if (elapsedSeconds - lastLeashToast > 4) {
          lastLeashToast = elapsedSeconds
          questUi.showToast(`STAY WITHIN ${COOP_MAX_DISTANCE} M OF YOUR FRIENDS`)
        }
      }
    }
  }
  if (game.world) {
    // Space: a plain hop; Space again in the air opens the paraglider (no cooldown, no ability slot). Not while hiding,
    // falling off the edge, or paused in a menu.
    const canHop = !player.hidden && !player.falling && player.hp > 0 && !hub.isOpen()
    // The ground is a sky isle's top when you're on (or above) one; an updraft lifts an open glider.
    const ground = game.world.depths.descent ? -1e9 : surfaceAt(player.position.x, player.position.z, game.world.jump.alt) // (falling into a chasm: nothing to land on)
    // The Nimbus Sovereign's wings: hold Space with them spread to climb.
    const climb = isFlyer() && game.world.jump.gliding && canHop && input.isDown('Space') ? SOVEREIGN_CLIMB : 0
    const lift = Math.max(climb, updraftLift(player.position.x, player.position.z, game.world.jump.alt))
    const hop = stepJump(game.world.jump, canHop && input.wasPressed('Space'), deltaSeconds, ground, lift)
    game.world.jump = hop.state
    if (lift > 0 && hop.state.gliding && Math.random() < 0.3) burst(particleSystem, { x: player.position.x + (Math.random() - 0.5) * 3, y: hop.state.alt - (game.world.groundY ?? 0) - 1, z: player.position.z + (Math.random() - 0.5) * 3 }, 0xdff8ff, 2, 2.5, 0.5)
    if (hop.landed && hop.impact > 30) {
      // A long drop without the glider: a superhero landing.
      spawnShockwave(shockwavePool, player.position.x, player.position.z, 6, 0xe0d6ff)
      triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE * 1.4, SHAKE_DAMAGE_DURATION)
      sfx.play('bossSlam', { x: player.position.x, z: player.position.z })
      input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
    }
    if (!player.falling) player.mesh.position.y = hop.state.alt
    if (!game.world.glider.parent) player.mesh.add(game.world.glider)
    updateGlider(game.world.glider, hop.state.gliding && hop.state.air, deltaSeconds, elapsedSeconds)
    if (isFlyer()) {
      game.world.glider.visible = false // the Sovereign flies on their own wings
      if (hop.state.gliding && hop.state.air && Math.random() < 0.5) burst(particleSystem, { x: player.position.x, y: hop.state.alt - (game.world.groundY ?? 0) + 1, z: player.position.z }, heroLook().glow, 2, 1.5, 0.4)
    }
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
    if (isFlyer()) {
      // The Nimbus Sovereign flies: the wings catch them at the edge instead of a fall.
      const held = clampToPlatform(player.position, ARENA_RADIUS - 0.2)
      player.position = { x: held.x, z: held.z }
      player.mesh.position.x = held.x
      player.mesh.position.z = held.z
    } else player.startFalling()
  }
  if (player.falling && player.updateFalling(gameplayDelta, elapsedSeconds)) {
    if (game.world && player.hp > 0) respawnAtCheckpoint(game, elapsedSeconds, { toast: false, heal: false, near: coop?.active }) // hurt, but back at the save point rather than the middle of the world
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
    sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
    game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
  }
  // Only the Guest (the bare jelly) stretches as it moves; the other heroes' gear would come apart from it.
  // Heroes in gear keep their jelly still (no breathing / bulge poking through the mask or costume) and squash as a whole.
  const bareJelly = heroById(heroProfile().hero).id === 'guest'
  updateJelly(player.mesh, deltaSeconds, elapsedSeconds, { speed: bareJelly ? player.speed : 0, moveDir: player.moveDir, still: !bareJelly })
  updateFace3D(player.mesh, gameplayDelta, elapsedSeconds)

  // wasHidden, compared against player.hidden after updateHiding runs,
  // catches the one frame hiding actually started, so the zip-up sound
  // plays exactly once per entry.
  const wasHidden = player.hidden
  // vacatedPod is the pod the player just left (early with E, or forced
  // out by the hide-limit timer -- `ejected`) this frame, if any; pods
  // are single-use, so it always starts despawning. An eject also
  // triggers the same shake/flash feedback a monster's hit does.
  const { showPrompt, nearestPod, vacatedPod, ejected } = downed ? { showPrompt: false, nearestPod: null, vacatedPod: null, ejected: false } : updateHiding(
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
  if (!player.hidden && !downed) {
    ABILITY_KEYS.forEach((key, slot) => {
      if (input.wasPressed(key) || input.wasAbilityPressed(slot)) activateAbility(game, slot, elapsedSeconds)
    })
  }
  // The hero ability (B / a stick click / the hero slot), unlocked at mastery 4.
  if (!downed && (input.wasPressed(HERO_ABILITY_KEY) || input.wasHeroAbilityPressed())) triggerHeroAbility(elapsedSeconds)
  if (!downed && (input.wasPressed(ULTIMATE_KEY) || input.wasUltimatePressed())) triggerUltimate(elapsedSeconds)

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
  const { ambushHit, hitAny } = downed ? { ambushHit: false, hitAny: false } : updatePlayerAttack(attackState, {
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
    cooldownMultiplier: petFx.cooldownMultiplier * perk.cooldown * (elapsedSeconds < player.frenzyUntil ? FRENZY_COOLDOWN_MULTIPLIER : 1) * (elapsedSeconds < timeWarp.until ? 0.77 : 1) * (elapsedSeconds < heroState.slipUntil ? 1 / heroState.slipHaste : 1),
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
    coopSwingStarted = true // co-op: the others see your swing's effect
    tutorialEvent('attack')
    sfx.play('swing', { x: player.position.x, z: player.position.z })
    onHeroAttack(player)
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
    // Co-op joiner: the host's monster, mirrored (src/coop.js moves and animates it).
    if (mesh.userData.netPuppet) return coop.stepPuppet(mesh, gameplayDelta, elapsedSeconds, player.position)
    if (mesh.userData.spawning) {
      if (room) mesh.position.y = monsterSwimY(mesh, elapsedSeconds)
      else if (game.world) mesh.position.y = mesh.userData.flight ? mesh.userData.flight.y : mesh.userData.skyHome ? mesh.userData.skyHome.y : mesh.userData.lake ? WATER_LEVEL - 0.3 : heightAt(mesh.position.x, mesh.position.z)
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
        // Co-op: a friend's killing blow scores (and drops crystals) in their game, not ours.
        if (!coop?.creditKill(mesh, mesh.userData.lastHitBy ?? 'sword')) {
          scoreKill(game, mesh, mesh.userData.lastHitBy ?? 'sword', mesh.position, elapsedSeconds)
          dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalDrops(mesh.userData.type, mesh.userData.isBoss))
          // A caught Bellhop Bandit spills its whole sack, plus a tip.
          if (mesh.userData.stolen > 0) dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalChange(refundWithTip(mesh.userData.stolen)))
        }
        disposeObject3D(mesh) // per-monster geometry, materials and indicator textures; also removes it from the scene
        if (SPLITS[mesh.userData.type] && mesh.userData.lastHitBy) pendingSplits.push({ type: mesh.userData.type, x: mesh.position.x, z: mesh.position.z })
        if (mesh.userData.isBoss) {
          bossGone = true
          bossDeathPoint = { x: mesh.position.x, z: mesh.position.z, y: mesh.userData.skyHome?.y }
        }
        return false
      }
      return true
    }

    if (mesh.userData.falling) {
      mesh.userData.fallState = stepFall(mesh.userData.fallState, gameplayDelta, FALL_GRAVITY)
      mesh.position.y = (mesh.userData.fallBaseY ?? 0) - mesh.userData.fallState.fallenY
      mesh.rotation.x += gameplayDelta * MONSTER_FALL_TUMBLE_SPEED
      mesh.rotation.z += gameplayDelta * MONSTER_FALL_TUMBLE_SPEED * 0.6
      if (mesh.userData.fallState.fallenY >= (mesh.userData.skyHome ? 26 : FALL_DESPAWN_DEPTH)) {
        rememberWorldKill(game, mesh, elapsedSeconds)
        const friendsKill = coop?.creditKill(mesh, 'fall') // co-op: a friend knocked it off
        if (!friendsKill) scoreKill(game, mesh, 'fall', { x: mesh.position.x, y: 0, z: mesh.position.z }, elapsedSeconds)
        // A Bellhop Bandit knocked overboard: the sack (and a tip) is credited straight back.
        if (mesh.userData.stolen > 0 && !friendsKill) {
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

    // Skyfins fly their own course (logic/skyFlyers.js), not the walking AI.
    if (mesh.userData.flight) return flySkyfin(game, mesh, gameplayDelta, elapsedSeconds)

    // Immunity phases: at 75 / 50 / 25% health a boss throws up a shield, calls minions, and can't be hurt until they are beaten.
    if (mesh.userData.isBoss && !mesh.userData.spawning && !mesh.userData.immune) {
      const phase = immunityPhaseReached(mesh.userData.hp, mesh.userData.maxHp, mesh.userData.immunityDone ?? 0, mesh.userData.immunityThresholds)
      if (phase !== null) startImmunity(game, mesh, phase)
    }
    if (mesh.userData.immune) stepImmunity(game, mesh, gameplayDelta, elapsedSeconds)
    // Phase two: at half health a boss ENRAGES: faster, its moves come round sooner, and it fires its signature at once.
    if (mesh.userData.isBoss && !mesh.userData.phase2 && !mesh.userData.spawning && (diff().bossEnraged || mesh.userData.hp <= mesh.userData.maxHp * 0.5)) {
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
    // Co-op host: it goes after the nearest player who's up; a remote player is a stand-in whose hits are sent to them.
    const target = coop?.isHost ? coop.targetFor(mesh, player, downed) : player
    const { hitPlayer: monsterHitPlayer, events: rawEvents } = updateMonster(mesh, target, obstacles, gameplayDelta, elapsedSeconds)
    const specialEvents = coop?.isHost ? coop.routeMonsterEvents(mesh, target, rawEvents) : rawEvents
    const hitPlayer = (monsterHitPlayer && target === player) || (specialEvents.length > 0 && applyBossEvents(game, mesh, specialEvents, elapsedSeconds))
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
    } else if (mesh.userData.skyHome) {
      // A sky isle's monster keeps to its isle; knocked off the edge, it falls (a ring-out like any other).
      const isle = mesh.userData.skyHome
      const dx = mesh.position.x - isle.x
      const dz = mesh.position.z - isle.z
      const d = Math.hypot(dx, dz)
      const keep = isle.radius - 1 - mesh.userData.radius * 0.5
      if (d > isle.radius + 0.2 && mesh.userData.knocked && !mesh.userData.immune) {
        mesh.userData.falling = true
        mesh.userData.fallBaseY = isle.y
        mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
        burst(particleSystem, { x: mesh.position.x, y: isle.y - (game.world.groundY ?? 0) + mesh.userData.radius, z: mesh.position.z }, FALL_PUFF_COLOR, FALL_PUFF_COUNT, FALL_PUFF_SPEED)
      } else if (d > keep) {
        mesh.position.x = isle.x + (dx / d) * keep
        mesh.position.z = isle.z + (dz / d) * keep
      }
      mesh.userData.knocked = false
      if (!mesh.userData.falling) mesh.position.y = isle.y + (mesh.userData.leapY ?? 0)
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
      // Villages are safe: a monster that wanders, chases or is knocked into one is held at its edge.
      if (game.world && !home && !mesh.userData.flight) {
        const out = villageKeepOut(mesh.position.x, mesh.position.z, mesh.userData.radius ?? 0)
        if (out) {
          mesh.position.x = out.x
          mesh.position.z = out.z
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
  pendingSummons.splice(0).forEach(({ bossMesh, count, maxMinions }) => summonMinions(game, bossMesh, count, maxMinions))
  if (bossGone) popMinions(game)
  // Splits come after the boss's minions are popped: Splitzilla's own split-offs ("two problems,
  // then four") must survive it, and the boss fight only ends once they're beaten too.
  pendingSplits.splice(0).forEach(({ type, x, z }) => {
    const { into, count } = SPLITS[type]
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random()
      let at = clampToPlatform({ x: x + Math.sin(angle) * 1.2, z: z + Math.cos(angle) * 1.2 }, ARENA_RADIUS - SPAWN_NEAR_PLAYER_MARGIN)
      if (game.labyrinth && !labSpotClear(game, at)) at = { x, z }
      spawnMonster(game, into, { at })
    }
  })
  if (bossGone) {
    attractAllCrystals(crystalSystem)
    // A boss leaves a free chest where it fell (when it died on the platform).
    if (bossDeathPoint) {
      dropBossLoot(game, bossDeathPoint)
      if (game.world) {
        // On the hills the loot has to sit on the ground, not at sea level.
        const lift = (item) => item && (item.position.y = bossDeathPoint.y ?? heightAt(item.position.x, item.position.z)) // a sky isle's guardian leaves it on the isle
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
  updatePoison(contagionPool, gameplayDelta, NOBODY, elapsedSeconds)
  if (orbHurt || poisonHurt) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
    sfx.play('playerHurt', { x: player.position.x, z: player.position.z })
    input.rumble(RUMBLE_STRONG_STRENGTH, RUMBLE_STRONG_DURATION)
    game.hitstop.remaining = triggerHitstop(game.hitstop, HITSTOP_PLAYER_HURT).remaining
  }

  // Pets follow and help, crystals scatter/home/get collected, and chests
  // animate; F opens the nearest one in reach if you can afford it.
  player.damageTakenMultiplier = tutorial || (sandbox && godMode) ? 0 : Math.max(0.3, petFx.damageTakenMultiplier * perk.damageTaken) * (heroRaging(elapsedSeconds) ? tn().guard : 1) // Spartan Rage shrugs hits off
  updateRageMeter(elapsedSeconds)
  player.difficultyDamage = diff().damageTaken
  if (tutorial) stepTutorial()
  if (sandbox) {
    game.inventory = sandboxTopUp(game.inventory)
    sandboxPanel.refresh({ inventory: game.inventory, levelIndex: game.levelIndex, god: godMode })
  }
  player.updateStatusEffects(elapsedSeconds)
  if (perk.regen > 0 && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + perk.regen * gameplayDelta)
  stepHeroTraits(elapsedSeconds, gameplayDelta)
  // On hills, pets ride the ground: take last frame's lift off, let them move, put the new lift on.
  if (game.world) for (const pet of game.pets) pet.mesh.position.y -= pet.groundLift ?? 0
  updatePets(game.pets, { petDamage: perk.petDamage, levels: profile.pets, dt: gameplayDelta, elapsed: elapsedSeconds, player, monsters: game.monsters, obstacles, particleSystem, hitstop: game.hitstop, shockwavePool, onScratch: petScratch })
  if (game.world) {
    for (const pet of game.pets) {
      pet.groundLift = surfaceAt(pet.mesh.position.x, pet.mesh.position.z, (game.world.groundY ?? 0) + 0.5) // up on a sky isle with you
      pet.mesh.position.y += pet.groundLift
    }
  }
  const collected = updateCrystals(crystalSystem, gameplayDelta, elapsedSeconds, player.position.x, player.position.z, petFx.magnetRadius * perk.magnet)
  if (collected > 0) {
    const gained = Math.max(1, Math.round(collected * petFx.crystalMultiplier * perk.crystal))
    game.inventory = addCrystals(game.inventory, gained)
    tutorialEvent('crystal', gained)
    progressNote({ type: 'crystals', amount: gained })
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
    if (player.hidden || downed || Math.hypot(pickup.position.x - player.position.x, pickup.position.z - player.position.z) > PICKUP_RADIUS || !onMyLevel(pickup)) return true
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
      if (chest.userData.opened || !onMyLevel(chest)) continue
      const distance = Math.hypot(chest.position.x - player.position.x, chest.position.z - player.position.z)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestChest = chest
      }
    }
  }
  if (nearestChest && !downed && input.wasChestPressed() && game.inventory.crystals >= nearestChest.userData.cost) {
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
  {
    const heroId = heroProfile().hero
    const ability = HERO_ABILITIES[heroId]
    updateHeroAbilityHud(hud, heroAwake() && ability ? { key: `${heroId}:${heroLook().id}`, look: heroLook(), name: ability.name, fraction: heroAbilityFraction(heroId, elapsedSeconds, heroState.abilityReady, activeFx(game.inventory.equipped).haste) } : null)
    const ult = HERO_ULTIMATES[heroId]
    updateUltimateHud(hud, ultimateUnlocked() && ult ? { key: `${heroId}:${heroLook().id}`, look: heroLook(), name: ult.name, fraction: ultimateFraction(heroId, elapsedSeconds, masteryRun.ultReady, activeFx(game.inventory.equipped).haste) } : null)
  }
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

startUpdateCheck() // a home-screen copy of the game hears about a new version (src/updateCheck.js)
