import '@fontsource/orbitron/400.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/900.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { createArena, createEnvironmentMap, updateArena } from './arena.js'
import { createMonsterMesh } from './characters.js'
import { updateFace3D } from './face3d.js'
import { loadHighScore, saveHighScore } from './highScore.js'
import { createMusic } from './music.js'
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
  FALL_STREAK_SPEED,
  GTAO_ENABLED,
  GTAO_INTENSITY,
  GTAO_RADIUS,
  HEAL_PULSE_AMOUNT,
  HIDDEN_CAMERA_OFFSET,
  JELLY_DEATH_INFLATE_STRENGTH,
  MAX_DELTA_SECONDS,
  MAX_PIXEL_RATIO,
  MONSTER_FALL_TUMBLE_SPEED,
  MONSTER_TYPES,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  POD_FLOOR_GLOW_COLOR,
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
  POD_SPAWN_MARGIN,
  POD_SPAWN_MAX_ATTEMPTS,
  POPUP_KILL_COLOR,
  POPUP_RING_OUT_COLOR,
  RAGE_DAMAGE_MULTIPLIER,
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
import { setPlayerWeapon } from './characters.js'
import { createChest, openChest, updateChest } from './chests.js'
import { createAttackState, damageMonster, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
import { attractAllCrystals, createCrystalSystem, dropCrystals, resetCrystals, updateCrystals } from './crystals.js'
import { createHidingState, createPod, startPodDematerialize, updateHiding, updatePod } from './hiding.js'
import {
  createHud,
  hideStartCard,
  setChestPrompt,
  showAmbushBanner,
  showCutscene,
  showGameOverlay,
  showLootToast,
  showWaveClearedBanner,
  triggerDamageFlash,
  updateHud,
  updateInventoryHud,
} from './hud.js'
import { Input } from './input.js'
import { bossById, bossHpScale } from './logic/bosses.js'
import { fanVelocities } from './logic/projectiles.js'
import { clampToPlatform, isOnPlatform, resolveArenaMove, spawnPointNearPlayer } from './logic/arena.js'
import { crystalDrops } from './logic/crystals.js'
import { createCutscene, stepCutscene, visibleChars } from './logic/cutscene.js'
import {
  addCrystals,
  chestCost,
  createInventory,
  grantItem,
  rollChestLoot,
  selectWeaponSlot,
  selectedWeaponId,
  spendCrystals,
  useAbility,
} from './logic/inventory.js'
import { ABILITIES, ABILITY_KEYS, HOTBAR_KEYS, PETS, WEAPONS, petEffects } from './logic/items.js'
import { stepFall } from './logic/falling.js'
import { evaluateGameState } from './logic/gameState.js'
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
import { createMonsterAIState, separateMonsters, updateMonster } from './monster.js'
import { burst, createParticleSystem, resetParticles, shardBurst, updateParticles } from './particles.js'
import { createPet, disposePets, updatePets } from './pets.js'
import { Player } from './player.js'
import { createProjectilePool, fireProjectile, resetProjectiles, updateProjectiles } from './projectiles.js'
import { createShockwavePool, resetShockwaves, spawnShockwave, updateShockwaves } from './shockwave.js'
import { createPopupPool, resetPopups, showPopup, updatePopups } from './popups.js'
import { createSpawnEffect, updateSpawnEffect } from './spawner.js'
import { clearSwingTrail, createSwingTrail } from './trail.js'

const container = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
// Capped rather than the raw devicePixelRatio -- a 3x display would
// otherwise render (and composite) 9x the pixels for no visible gain.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
// NeutralToneMapping keeps the sunlit scene's pastel colors true,
// without a filmic curve crushing its highlights and shadows.
renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE
renderer.outputColorSpace = THREE.SRGBColorSpace
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()
// Gives physically lit materials (metalness/roughness, clearcoat)
// something plausible to reflect instead of flat black: a PMREM bake of
// the sky gradient plus a bright sun panel (see arena.js's
// createEnvironmentMap). The sky colors are static, so this is built
// once rather than per game/restart like the arena itself.
scene.environment = createEnvironmentMap(renderer)

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  CAMERA_FAR,
)

// Bloom makes the neon emissive surfaces (the grid, the rim, the pylons)
// glow without washing out the rest of the scene; OutputPass applies the
// renderer's tone mapping/color space after the bloom pass runs. The
// composer renders into its own target, which bypasses the renderer's
// own antialias setting -- an explicit multisampled (MSAA) render
// target keeps edges clean through the post-processing passes instead.
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  samples: 4,
})
const composer = new EffectComposer(renderer, renderTarget)
// Handing the composer its own render target pins its pixel ratio to 1,
// so on a high-DPI display the whole scene was rendered at CSS-pixel
// resolution and upscaled -- blurry and pixelated. Match the renderer's.
composer.setPixelRatio(renderer.getPixelRatio())
composer.addPass(new RenderPass(scene, camera))
// Ground-truth ambient occlusion for the contact shadows in creases and
// corners that the directional sun makes obvious. Sits right after the
// render pass, before bloom, so bloom's glow is computed from the
// already-occluded image.
const gtaoPass = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight, undefined, {
  radius: GTAO_RADIUS,
})
gtaoPass.blendIntensity = GTAO_INTENSITY
gtaoPass.enabled = GTAO_ENABLED
composer.addPass(gtaoPass)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  BLOOM_STRENGTH,
  BLOOM_RADIUS,
  BLOOM_THRESHOLD,
)
composer.addPass(bloomPass)
composer.addPass(new OutputPass())

const input = new Input()
const hud = createHud()

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
const shockwavePool = createShockwavePool()
scene.add(shockwavePool.group)

// The camera doesn't rotate yet, so it stays behind the player along a
// fixed world-space offset and eases toward its target each frame.
const cameraYaw = 0
const cameraTarget = new THREE.Vector3()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setPixelRatio(renderer.getPixelRatio())
  composer.setSize(window.innerWidth, window.innerHeight)
  gtaoPass.setSize(window.innerWidth, window.innerHeight)
})

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
        if (material.map) material.map.dispose()
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
function createGame() {
  const arena = createArena()
  scene.add(arena.group)
  scene.background = new THREE.Color(arena.backgroundColor)
  scene.fog = arena.fog

  // Pods are dynamic circular obstacles (src/logic/podSpawner.js decides
  // where/when); `obstacles` is mutated in place as they spawn/despawn
  // (via trySpawnPod/despawnPod) so the player and monsters, which hold
  // this same array, stay in sync without it ever being reassigned.
  const obstacles = []

  const player = new Player({ spawn: { x: 0, z: 0 }, obstacles, particleSystem })
  scene.add(player.mesh)

  const game = {
    arena,
    obstacles,
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
    cutscene: null, // { boss, mesh, dir, state } while a boss intro is playing; freezes gameplay
    score: 0,
    hidingState: createHidingState(),
    attackState: createAttackState(),
    shake: createShakeState(),
    gameOverRecorded: false,
    gameOverStats: null,
  }

  const initialPodCount =
    POD_INITIAL_COUNT_MIN + Math.floor(Math.random() * (POD_INITIAL_COUNT_MAX - POD_INITIAL_COUNT_MIN + 1))
  for (let i = 0; i < initialPodCount; i++) trySpawnPod(game)
  trySpawnChest(game)

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
function trySpawnPod(game) {
  const point = pickPodSpawnPoint(Math.random, {
    arenaRadius: ARENA_RADIUS,
    margin: POD_SPAWN_MARGIN,
    existingPods: game.pods.map((pod) => ({ x: pod.position.x, z: pod.position.z })),
    minSpacing: POD_MIN_SPACING,
    playerPos: game.player.position,
    minPlayerDistance: POD_MIN_PLAYER_DISTANCE,
    monsterPositions: game.monsters.map((mesh) => ({ x: mesh.position.x, z: mesh.position.z })),
    monsterAvoidRadius: POD_MONSTER_AVOID_RADIUS,
    maxAttempts: POD_SPAWN_MAX_ATTEMPTS,
  })
  if (point === null) return

  const pod = createPod(point)
  const obstacle = { x: point.x, z: point.z, radius: POD_OBSTACLE_RADIUS }
  pod.userData.obstacle = obstacle
  scene.add(pod)
  game.pods.push(pod)
  game.obstacles.push(obstacle)
  burst(
    particleSystem,
    { x: point.x, y: 0.4, z: point.z },
    POD_FLOOR_GLOW_COLOR,
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
      arenaRadius: ARENA_RADIUS,
      margin: CHEST_SPAWN_MARGIN,
      existingPods: [...game.pods, ...game.chests].map((m) => ({ x: m.position.x, z: m.position.z })),
      minSpacing: CHEST_MIN_SPACING,
      playerPos: game.player.position,
      minPlayerDistance: POD_MIN_PLAYER_DISTANCE,
      monsterPositions: game.monsters.map((mesh) => ({ x: mesh.position.x, z: mesh.position.z })),
      monsterAvoidRadius: POD_MONSTER_AVOID_RADIUS,
      maxAttempts: POD_SPAWN_MAX_ATTEMPTS,
    })
  if (point === null) return

  const chest = createChest(point, cost ?? chestCost(game.inventory.chestsOpened))
  const obstacle = { x: point.x, z: point.z, radius: CHEST_OBSTACLE_RADIUS }
  chest.userData.obstacle = obstacle
  scene.add(chest)
  game.chests.push(chest)
  game.obstacles.push(obstacle)
  burst(particleSystem, { x: point.x, y: 0.5, z: point.z }, CHEST_FLASH_COLOR, POD_SPAWN_BURST_COUNT, POD_SPAWN_BURST_SPEED)
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

// Fires the ability in `slot` if it's ready, applying its effect.
function activateAbility(game, slot, now) {
  const used = useAbility(game.inventory, slot, now)
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
    player.position = target
    player.mesh.position.x = target.x
    player.mesh.position.z = target.z
    player.invulnerableUntil = Math.max(player.invulnerableUntil, now + BLINK_IFRAMES)
    burst(particleSystem, { x: target.x, y: 0.8, z: target.z }, 0xe9a3ff, 24, 3)
  } else if (used.abilityId === 'shockwave') {
    spawnShockwave(shockwavePool, player.position.x, player.position.z, SHOCKWAVE_RADIUS, SHOCKWAVE_COLOR)
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
      })
    }
  } else if (used.abilityId === 'heal') {
    player.hp = Math.min(PLAYER_MAX_HP, player.hp + HEAL_PULSE_AMOUNT)
    burst(particleSystem, center, 0x7dffb0, 30, 2.5, 1)
  } else if (used.abilityId === 'shield') {
    player.shieldUntil = now + ABILITIES.shield.duration
    burst(particleSystem, center, 0x66f0ff, 24, 2.5)
  } else if (used.abilityId === 'rage') {
    player.rageUntil = now + ABILITIES.rage.duration
    burst(particleSystem, center, 0xff4a3a, 30, 3.5, 0.5)
  }
}

// Pays for and opens a chest, then hands out what rolled: a hotbar weapon
// (equipped right away), an ability (bound to the next free key), or a
// pet. Once you own everything it pays out score and a heal instead.
function openChestNow(game, chest, now) {
  const { cost } = chest.userData
  const paid = spendCrystals(game.inventory, cost)
  if (!paid.ok) return
  game.inventory = cost > 0 ? { ...paid.inventory, chestsOpened: paid.inventory.chestsOpened + 1 } : paid.inventory
  openChest(chest)
  const obstacleIndex = game.obstacles.indexOf(chest.userData.obstacle)
  if (obstacleIndex !== -1) game.obstacles.splice(obstacleIndex, 1)

  const point = { x: chest.position.x, y: 0.8, z: chest.position.z }
  burst(particleSystem, point, CHEST_FLASH_COLOR, 40, 4, 1)
  shardBurst(particleSystem, point, CHEST_FLASH_COLOR, 16, 3)

  const loot = rollChestLoot(game.inventory)
  if (!loot) {
    game.score += CHEST_ALL_OWNED_SCORE
    game.player.hp = Math.min(PLAYER_MAX_HP, game.player.hp + CHEST_ALL_OWNED_HEAL)
    showLootToast(hud, { title: 'YOU OWN EVERYTHING', name: `+${CHEST_ALL_OWNED_SCORE} SCORE`, blurb: 'Plus a big heal' })
    return
  }

  game.inventory = grantItem(game.inventory, loot)
  if (loot.kind === 'weapon') {
    setPlayerWeapon(game.player.mesh, loot.id)
    game.attackState.swingElapsed = null
    clearSwingTrail(swingTrail)
    const weapon = WEAPONS[loot.id]
    showLootToast(hud, { title: `NEW WEAPON  [${game.inventory.weapons.length}]`, name: `${weapon.icon} ${weapon.name}`, blurb: weapon.blurb })
  } else if (loot.kind === 'ability') {
    const ability = ABILITIES[loot.id]
    const key = ABILITY_KEYS[game.inventory.abilities.indexOf(loot.id)].replace('Key', '')
    showLootToast(hud, { title: `NEW ABILITY  [${key}]`, name: `${ability.icon} ${ability.name}`, blurb: ability.blurb })
  } else {
    game.pets.push(createPet(loot.id, scene, game.player))
    const pet = PETS[loot.id]
    showLootToast(hud, { title: 'NEW PET', name: `${pet.icon} ${pet.name}`, blurb: pet.blurb })
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
    POD_FLOOR_GLOW_COLOR,
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
    ARENA_RADIUS,
    SPAWN_NEAR_PLAYER_MARGIN,
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
  mesh.userData.knockbackScale = stats.knockbackScale ?? 1
  mesh.userData.radius = stats.radius
  mesh.userData.falling = false
  mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
  mesh.userData.spawning = true
  Object.assign(mesh.userData, createMonsterAIState(stats))
  scene.add(mesh)
  game.monsters.push(mesh)

  const effect = createSpawnEffect(spawn, effectOptions)
  scene.add(effect.group)
  game.spawnEffects.push({ effect, monster: mesh })
  return mesh
}

// Starts the current boss's intro: drops the boss in (portal and all)
// straight ahead of the player -- on the other side if the platform's edge
// is in the way -- facing them, and hands control to the cutscene, which
// freezes gameplay until it finishes (see runCutscene).
function startBossCutscene(game) {
  const boss = currentBoss(game.waveState)
  const { player } = game
  const limit = ARENA_RADIUS - BOSS_SPAWN_MARGIN
  let at = clampToPlatform({ x: player.position.x, z: player.position.z - BOSS_SPAWN_DISTANCE }, limit)
  if (Math.hypot(at.x - player.position.x, at.z - player.position.z) < BOSS_SPAWN_DISTANCE * 0.8) {
    at = clampToPlatform({ x: player.position.x, z: player.position.z + BOSS_SPAWN_DISTANCE }, limit)
  }
  const mesh = spawnMonster(game, boss.id, {
    at,
    effectOptions: { scale: BOSS_SPAWN_EFFECT_SCALE, duration: BOSS_SPAWN_EFFECT_DURATION },
    hpScale: bossHpScale(game.waveState.bossesDefeated),
    facePlayer: true,
  })
  const dx = player.position.x - at.x
  const dz = player.position.z - at.z
  const length = Math.hypot(dx, dz) || 1
  game.cutscene = { boss, mesh, dir: { x: dx / length, z: dz / length }, state: createCutscene() }
}

// Calls a summoner boss's minions in around it (skipped while it already
// has `maxMinions` alive), each through the usual portal spawn-in.
function summonMinions(game, bossMesh, count, maxMinions) {
  const living = game.monsters.filter((m) => !m.userData.isBoss && !m.userData.dying).length
  if (living >= maxMinions) return
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = bossMesh.userData.radius + 2 + Math.random() * 2
    const at = clampToPlatform(
      { x: bossMesh.position.x + Math.sin(angle) * distance, z: bossMesh.position.z + Math.cos(angle) * distance },
      ARENA_RADIUS - SPAWN_NEAR_PLAYER_MARGIN,
    )
    spawnMonster(game, pickMonsterType(Math.max(2, game.waveState.waveNumber)), { at })
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

const pendingSummons = []

// Turns the specials a boss fired this tick (see monster.js's
// updateMonster) into their effects: shockwave rings and damage for a slam
// or spin tick, orbs for a barrage, minions for a summon, a puff at both
// ends of a blink. Returns whether the player took damage, so the caller
// can shake the screen.
function applyBossEvents(game, bossMesh, events, now) {
  const { player } = game
  let hurtPlayer = false
  const playerDistance = (x, z) => Math.hypot(player.position.x - x, player.position.z - z)
  for (const event of events) {
    if (event.type === 'slam') {
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0xff3355)
      burst(particleSystem, { x: event.x, y: 0.3, z: event.z }, 0xff9a5a, 36, 4.5)
      if (playerDistance(event.x, event.z) <= event.radius && player.damagePlayer(event.damage, now)) hurtPlayer = true
      triggerShake(game.shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    } else if (event.type === 'spinTick') {
      spawnShockwave(shockwavePool, event.x, event.z, event.radius, 0xffb454)
      if (playerDistance(event.x, event.z) <= event.radius && player.damagePlayer(event.damage, now)) hurtPlayer = true
    } else if (event.type === 'barrage') {
      for (const { vx, vz } of fanVelocities(event.aim, event.count, event.spread, event.speed)) {
        fireProjectile(projectilePool, { x: event.x, z: event.z, vx, vz, damage: event.damage })
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
  const { boss, mesh, dir } = cutscene
  cutscene.state = stepCutscene(cutscene.state, deltaSeconds, advancePressed, boss.lines)

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
  updateArena(game.arena, elapsedSeconds, player.position)
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
    game.cutscene = null
    showCutscene(hud, null)
    return
  }
  const line = boss.lines[lineIndex]
  showCutscene(hud, { boss, phase, text: phase === 'talk' ? line.slice(0, visibleChars(line, lineElapsed)) : '' })
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
  disposePets(target.pets, scene)
}

// Browsers only allow audio after a user gesture, so the track starts
// when the start card is dismissed. M mutes/unmutes it (remembered).
const music = createMusic()

let started = false
function dismissStartCard() {
  started = true
  music.start()
  hideStartCard(hud)
  // The key/click that dismisses the card shouldn't also register as a
  // held attack button or key on gameplay's first frame.
  input.clear()
}
window.addEventListener('keydown', dismissStartCard, { once: true })
window.addEventListener('mousedown', dismissStartCard, { once: true })

let game = createGame()

const clock = new THREE.Clock()

function animate() {
  // Clamped so a dropped/backgrounded-tab frame doesn't feed a huge dt
  // into movement/physics and teleport everything forward.
  const deltaSeconds = Math.min(clock.getDelta(), MAX_DELTA_SECONDS)
  const elapsedSeconds = clock.getElapsedTime()

  const gameState = evaluateGameState({ playerHp: game.player.hp })

  if (input.wasPressed('KeyM')) music.toggleMuted()
  music.setMuffled(gameState !== 'playing')

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
  showGameOverlay(hud, gameState === 'playing' ? null : gameState, game.gameOverStats)

  if (!started || gameState !== 'playing') {
    if (started && gameState !== 'playing' && input.wasPressed('KeyR')) {
      disposeGame(game)
      game = createGame()
      resetParticles(particleSystem)
      resetPopups(popupPool)
      resetProjectiles(projectilePool)
      resetCrystals(crystalSystem)
      setChestPrompt(hud, null)
      resetShockwaves(shockwavePool)
      pendingSummons.length = 0
      clearSwingTrail(swingTrail)
    }
    composer.render()
    input.endFrame()
    return
  }

  if (game.cutscene) {
    const advance = input.wasPressed('Space') || input.wasPressed('Enter') || input.wasMousePressed(0)
    runCutscene(game, advance, deltaSeconds, elapsedSeconds)
    composer.render()
    input.endFrame()
    return
  }

  const { obstacles, player, pods, hidingState, attackState, shake } = game
  let monsters = game.monsters

  // Steps the wave controller, spawns anything it emits this tick, and
  // reacts to a cleared wave with a score bonus, a heal (so endless runs
  // stay survivable), and a banner. Monsters still materializing in
  // count as alive, so the clearing phase waits on them too.
  const clearedWaveNumber = game.waveState.waveNumber
  const bossBeforeStep = currentBoss(game.waveState)
  const { state: nextWaveState, spawns, events } = stepWaves(
    game.waveState,
    deltaSeconds,
    monsters.length,
    Math.random,
  )
  game.waveState = nextWaveState
  spawns.forEach((type) => spawnMonster(game, type))
  if (events.includes('waveCleared')) {
    const bonus = waveClearBonus(clearedWaveNumber)
    game.score += bonus
    showWaveClearedBanner(hud, bonus)
    player.hp = Math.min(PLAYER_MAX_HP, player.hp + WAVE_CLEAR_HEAL)
  }
  if (events.includes('bossDefeated')) {
    const bonus = waveClearBonus(clearedWaveNumber) * 2
    game.score += bonus
    showWaveClearedBanner(hud, bonus, `${bossBeforeStep.name} DEFEATED`)
    player.hp = Math.min(PLAYER_MAX_HP, player.hp + WAVE_CLEAR_HEAL * BOSS_DEFEAT_HEAL_MULTIPLIER)
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

  player.update(input, cameraYaw, deltaSeconds)
  if (!player.falling && !player.hidden && !isOnPlatform(player.position, ARENA_RADIUS)) {
    player.startFalling()
  }
  if (player.falling && player.updateFalling(deltaSeconds, elapsedSeconds)) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
  }
  updateJelly(player.mesh, deltaSeconds, elapsedSeconds, { speed: player.speed, moveDir: player.moveDir })
  updateFace3D(player.mesh, deltaSeconds, elapsedSeconds)

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
    POD_HIDE_LIMIT,
  )
  if (vacatedPod) despawnPod(game, vacatedPod)
  if (ejected) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
  }

  pods.forEach((pod) => {
    const remaining = pod.userData.occupied
      ? hideTimeRemaining(hidingState.enteredAt, elapsedSeconds, POD_HIDE_LIMIT)
      : null
    updatePod(pod, deltaSeconds, elapsedSeconds, { isNearestEnterable: pod === nearestPod, hideTimeRemaining: remaining })
  })
  game.despawningPods = game.despawningPods.filter((pod) => {
    const finished = updatePod(pod, deltaSeconds, elapsedSeconds, {})
    if (finished) disposeObject3D(pod)
    return !finished
  })

  // The weapon hotbar (1-5) and ability keys (Q Z X C V).
  HOTBAR_KEYS.forEach((key, slot) => {
    if (input.wasPressed(key)) selectWeapon(game, slot)
  })
  if (!player.hidden) {
    ABILITY_KEYS.forEach((key, slot) => {
      if (input.wasPressed(key)) activateAbility(game, slot, elapsedSeconds)
    })
  }

  const { ambushHit, hitAny } = updatePlayerAttack(attackState, {
    player,
    monsters,
    obstacles,
    input,
    elapsedSeconds,
    deltaSeconds,
    particleSystem,
    swingTrail,
    weaponId: selectedWeaponId(game.inventory),
    damageMultiplier: elapsedSeconds < player.rageUntil ? RAGE_DAMAGE_MULTIPLIER : 1,
  })
  if (ambushHit) showAmbushBanner(hud)
  if (hitAny) triggerShake(shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)

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
      updateJelly(mesh, deltaSeconds, elapsedSeconds, { speed: 0, moveDir: mesh.userData.moveDir })
      updateFace3D(mesh, deltaSeconds, elapsedSeconds)
      return true
    }

    if (mesh.userData.dying) {
      updateJelly(mesh, deltaSeconds, elapsedSeconds, { speed: 0, moveDir: mesh.userData.moveDir })
      updateFace3D(mesh, deltaSeconds, elapsedSeconds)
      const finishedDying = updateMonsterHitReaction(mesh, deltaSeconds)
      if (finishedDying) {
        const points = scoreForKill(mesh.userData.type)
        game.score += points
        showPopup(popupPool, mesh.position, `+${points}`, POPUP_KILL_COLOR)
        dropCrystals(crystalSystem, mesh.position.x, mesh.position.z, crystalDrops(mesh.userData.type, mesh.userData.isBoss))
        scene.remove(mesh)
        if (mesh.userData.isBoss) {
          bossGone = true
          bossDeathPoint = { x: mesh.position.x, z: mesh.position.z }
        }
        return false
      }
      return true
    }

    if (mesh.userData.falling) {
      mesh.userData.fallState = stepFall(mesh.userData.fallState, deltaSeconds, FALL_GRAVITY)
      mesh.position.y = -mesh.userData.fallState.fallenY
      mesh.rotation.x += deltaSeconds * MONSTER_FALL_TUMBLE_SPEED
      mesh.rotation.z += deltaSeconds * MONSTER_FALL_TUMBLE_SPEED * 0.6
      if (mesh.userData.fallState.fallenY >= FALL_DESPAWN_DEPTH) {
        const points = scoreForKill(mesh.userData.type)
        game.score += points
        showPopup(popupPool, { x: mesh.position.x, y: 0, z: mesh.position.z }, 'RING OUT!', POPUP_RING_OUT_COLOR)
        scene.remove(mesh)
        if (mesh.userData.isBoss) bossGone = true
        return false
      }
      return true
    }

    const { hitPlayer: monsterHitPlayer, events: specialEvents } = updateMonster(mesh, player, obstacles, deltaSeconds, elapsedSeconds)
    const hitPlayer = monsterHitPlayer || (specialEvents.length > 0 && applyBossEvents(game, mesh, specialEvents, elapsedSeconds))
    updateJelly(mesh, deltaSeconds, elapsedSeconds, { speed: mesh.userData.speed, moveDir: mesh.userData.moveDir })
    updateFace3D(mesh, deltaSeconds, elapsedSeconds)
    if (hitPlayer) {
      triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
      triggerDamageFlash(hud)
    }
    updateMonsterHitReaction(mesh, deltaSeconds)

    if (!isOnPlatform({ x: mesh.position.x, z: mesh.position.z }, ARENA_RADIUS)) {
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
  if (bossGone) {
    popMinions(game)
    attractAllCrystals(crystalSystem)
    // A boss leaves a free chest where it fell (when it died on the platform).
    if (bossDeathPoint) {
      trySpawnChest(game, { at: clampToPlatform(bossDeathPoint, ARENA_RADIUS - CHEST_SPAWN_MARGIN), cost: 0 })
    }
  }

  updateSpawnEffects(game, deltaSeconds)

  separateMonsters(monsters, player, obstacles)
  updateArena(game.arena, elapsedSeconds, player.position)
  updateParticles(particleSystem, deltaSeconds)
  updatePopups(popupPool, deltaSeconds)
  updateShockwaves(shockwavePool, deltaSeconds)
  if (updateProjectiles(projectilePool, deltaSeconds, player, elapsedSeconds, ARENA_RADIUS)) {
    triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    triggerDamageFlash(hud)
  }

  // Pets follow and help, crystals scatter/home/get collected, and chests
  // animate; F opens the nearest one in reach if you can afford it.
  const petFx = petEffects(game.inventory.pets)
  player.damageTakenMultiplier = petFx.damageTakenMultiplier
  player.updateStatusEffects(elapsedSeconds)
  updatePets(game.pets, { dt: deltaSeconds, elapsed: elapsedSeconds, player, monsters: game.monsters, obstacles, particleSystem })
  const collected = updateCrystals(crystalSystem, deltaSeconds, elapsedSeconds, player.position.x, player.position.z, petFx.magnetRadius)
  if (collected > 0) game.inventory = addCrystals(game.inventory, collected)

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
  if (nearestChest && input.wasPressed('KeyF') && game.inventory.crystals >= nearestChest.userData.cost) {
    openChestNow(game, nearestChest, elapsedSeconds)
  }
  game.chests = game.chests.filter((chest) => {
    const finished = updateChest(chest, deltaSeconds, elapsedSeconds, {
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
          ? 'Press F to open the FREE chest'
          : `Press F to open chest (💎 ${cost})`
        : `Chest needs 💎 ${cost} (you have ${game.inventory.crystals})`,
      !affordable,
    )
  } else {
    setChestPrompt(hud, null)
  }
  updateInventoryHud(hud, game.inventory, elapsedSeconds)

  const inBossFight = game.waveState.phase === 'bossFight'
  const enemiesLeft = inBossFight
    ? game.monsters.length
    : waveSize(game.waveState.waveNumber) - game.waveState.spawnedCount + game.monsters.length
  const bossMesh = game.monsters.find((m) => m.userData.isBoss && !m.userData.dying)
  const bossHud = bossMesh
    ? {
        name: bossById(bossMesh.userData.type).name,
        ratio: Math.max(0, Math.min(1, bossMesh.userData.hp / bossMesh.userData.maxHp)),
      }
    : null
  updateHud(hud, {
    hp: player.hp,
    maxHp: PLAYER_MAX_HP,
    score: game.score,
    wave: game.waveState.waveNumber,
    enemiesLeft,
    hidden: player.hidden,
    hideTimeRemaining: player.hidden ? hideTimeRemaining(hidingState.enteredAt, elapsedSeconds, POD_HIDE_LIMIT) : null,
    hideLimit: POD_HIDE_LIMIT,
    showHidePrompt: showPrompt,
    waveState: game.waveState,
    boss: bossHud,
    deltaSeconds,
  })

  // A slight look-ahead in the player's current movement direction,
  // scaled by how close to full speed they're actually moving (so it
  // eases in/out along with the movement ramp rather than snapping).
  const lookAheadAmount = CAMERA_LOOKAHEAD * (player.speed / PLAYER_SPEED)
  const cameraOffset = player.hidden ? HIDDEN_CAMERA_OFFSET : CAMERA_OFFSET
  cameraTarget.set(
    player.position.x + cameraOffset.x + player.moveDir.x * lookAheadAmount,
    cameraOffset.y,
    player.position.z + cameraOffset.z + player.moveDir.z * lookAheadAmount,
  )
  // Frame-rate-independent exponential smoothing: 1 - exp(-lambda * dt)
  // is the same damp() uses elsewhere, just expressed as the single
  // alpha THREE.Vector3.lerp takes.
  const lerpFactor = 1 - Math.exp(-CAMERA_LERP * deltaSeconds)
  camera.position.lerp(cameraTarget, lerpFactor)
  camera.lookAt(player.position.x, 1, player.position.z)

  const shakeOffset = updateShake(shake, deltaSeconds)
  camera.position.x += shakeOffset.x
  camera.position.y += shakeOffset.y
  camera.position.z += shakeOffset.z

  composer.render()
  input.endFrame()
}

// setAnimationLoop (rather than a manual requestAnimationFrame chain)
// is the steadier, recommended driver for a render loop.
renderer.setAnimationLoop(animate)
