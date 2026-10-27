import '@fontsource/orbitron/400.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/orbitron/900.css'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { createArena, updateArena } from './arena.js'
import { createMonsterMesh } from './characters.js'
import { updateFace3D } from './face3d.js'
import { loadHighScore, saveHighScore } from './highScore.js'
import { createMusic } from './music.js'
import { updateJelly } from './jelly.js'
import {
  ARENA_RADIUS,
  BLOOM_RADIUS,
  BLOOM_STRENGTH,
  BLOOM_THRESHOLD,
  CAMERA_FAR,
  CAMERA_LERP,
  CAMERA_LOOKAHEAD,
  CAMERA_OFFSET,
  FALL_DESPAWN_DEPTH,
  FALL_GRAVITY,
  FALL_PUFF_COLOR,
  FALL_PUFF_COUNT,
  FALL_PUFF_SPEED,
  FALL_STREAK_COUNT,
  FALL_STREAK_SPEED,
  HIDDEN_CAMERA_OFFSET,
  MAX_DELTA_SECONDS,
  MAX_PIXEL_RATIO,
  MONSTER_FALL_TUMBLE_SPEED,
  MONSTER_TYPES,
  PLAYER_MAX_HP,
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
  SHAKE_DAMAGE_DURATION,
  SHAKE_DAMAGE_MAGNITUDE,
  SHAKE_HIT_DURATION,
  SHAKE_HIT_MAGNITUDE,
  SHAKE_NOISE_FREQUENCY_A,
  SHAKE_NOISE_FREQUENCY_B,
  SPAWN_NEAR_PLAYER_MARGIN,
  SPAWN_NEAR_PLAYER_MAX_DIST,
  SPAWN_NEAR_PLAYER_MIN_DIST,
  SWORD_BLADE_COLOR,
  TONE_MAPPING_EXPOSURE,
  WAVE_CLEAR_HEAL,
} from './config.js'
import { createAttackState, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
import { createHidingState, createPod, startPodDematerialize, updateHiding, updatePod } from './hiding.js'
import {
  createHud,
  hideStartCard,
  showAmbushBanner,
  showGameOverlay,
  showWaveClearedBanner,
  triggerDamageFlash,
  updateHud,
} from './hud.js'
import { Input } from './input.js'
import { isOnPlatform, spawnPointNearPlayer } from './logic/arena.js'
import { stepFall } from './logic/falling.js'
import { evaluateGameState } from './logic/gameState.js'
import { hideTimeRemaining } from './logic/hiding.js'
import { createPodSpawnerState, pickPodSpawnPoint, stepPodSpawner } from './logic/podSpawner.js'
import { createWaveState, scoreForKill, stepWaves, waveClearBonus, waveSize } from './logic/waves.js'
import { createMonsterAIState, separateMonsters, updateMonster } from './monster.js'
import { burst, createParticleSystem, resetParticles, updateParticles } from './particles.js'
import { Player } from './player.js'
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
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE
renderer.outputColorSpace = THREE.SRGBColorSpace
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()

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
function spawnMonster(game, type) {
  const stats = MONSTER_TYPES[type]
  const spawn = spawnPointNearPlayer(
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
  mesh.rotation.y = Math.random() * Math.PI * 2
  mesh.userData.hp = stats.hp
  mesh.userData.radius = stats.radius
  mesh.userData.falling = false
  mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
  mesh.userData.spawning = true
  Object.assign(mesh.userData, createMonsterAIState())
  scene.add(mesh)
  game.monsters.push(mesh)

  const effect = createSpawnEffect(spawn)
  scene.add(effect.group)
  game.spawnEffects.push({ effect, monster: mesh })
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
      clearSwingTrail(swingTrail)
    }
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

  const { ambushHit, hitAny } = updatePlayerAttack(attackState, {
    player,
    monsters,
    obstacles,
    input,
    elapsedSeconds,
    deltaSeconds,
    particleSystem,
    swingTrail,
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
        scene.remove(mesh)
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
        return false
      }
      return true
    }

    const { hitPlayer } = updateMonster(mesh, player, obstacles, deltaSeconds, elapsedSeconds)
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

  // Advances each in-progress spawn-in effect (portal fade, monster
  // scale/color materialize); once one finishes, the monster can start
  // running AI/combat and the effect's meshes are disposed.
  game.spawnEffects = game.spawnEffects.filter(({ effect, monster }) => {
    const finished = updateSpawnEffect(effect, monster, deltaSeconds, particleSystem)
    if (finished) {
      monster.userData.spawning = false
      disposeObject3D(effect.group)
    }
    return !finished
  })

  separateMonsters(monsters, player, obstacles)
  updateArena(game.arena, elapsedSeconds, player.position)
  updateParticles(particleSystem, deltaSeconds)
  updatePopups(popupPool, deltaSeconds)

  const enemiesLeft = waveSize(game.waveState.waveNumber) - game.waveState.spawnedCount + monsters.length
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
