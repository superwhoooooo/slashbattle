import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { createArena, updateArena } from './arena.js'
import { createMonsterMesh, updateWobble } from './characters.js'
import {
  ARENA_RADIUS,
  BLOOM_RADIUS,
  BLOOM_STRENGTH,
  BLOOM_THRESHOLD,
  CAMERA_FAR,
  CAMERA_LERP,
  CAMERA_OFFSET,
  CRATE_OBSTACLE_RADIUS,
  CRATE_POSITIONS,
  EDGE_SPAWN_MARGIN,
  FALL_DESPAWN_DEPTH,
  FALL_GRAVITY,
  HIDDEN_CAMERA_OFFSET,
  MONSTER_FALL_TUMBLE_SPEED,
  MONSTER_TYPES,
  PLAYER_MAX_HP,
  SHAKE_DAMAGE_DURATION,
  SHAKE_DAMAGE_MAGNITUDE,
  SHAKE_HIT_DURATION,
  SHAKE_HIT_MAGNITUDE,
  STARTING_MONSTER_COUNT,
} from './config.js'
import { createAttackState, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
import { createCrates, createHidingState, updateCrateWiggle, updateHiding } from './hiding.js'
import { createHud, hideStartCard, showAmbushBanner, showGameOverlay, updateHud } from './hud.js'
import { Input } from './input.js'
import { edgeSpawnPoint, isOnPlatform } from './logic/arena.js'
import { stepFall } from './logic/falling.js'
import { evaluateGameState } from './logic/gameState.js'
import { createMonsterAIState, separateMonsters, updateMonster } from './monster.js'
import { Player } from './player.js'

const container = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
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
// renderer's tone mapping/color space after the bloom pass runs.
const composer = new EffectComposer(renderer)
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

// The camera doesn't rotate yet, so it stays behind the player along a
// fixed world-space offset and eases toward its target each frame.
const cameraYaw = 0
const cameraTarget = new THREE.Vector3()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})

// Camera screen shake: a short decaying random offset added on top of
// the normal follow position. triggerShake restarts it; updateShake
// advances it and returns the current offset.
function createShakeState() {
  return { elapsed: null, duration: 0, magnitude: 0 }
}

function triggerShake(shake, magnitude, duration) {
  shake.elapsed = 0
  shake.magnitude = magnitude
  shake.duration = duration
}

function updateShake(shake, deltaSeconds) {
  if (shake.elapsed === null) return { x: 0, y: 0, z: 0 }
  shake.elapsed += deltaSeconds
  if (shake.elapsed >= shake.duration) {
    shake.elapsed = null
    return { x: 0, y: 0, z: 0 }
  }
  const strength = shake.magnitude * (1 - shake.elapsed / shake.duration)
  return {
    x: (Math.random() * 2 - 1) * strength,
    y: (Math.random() * 2 - 1) * strength,
    z: (Math.random() * 2 - 1) * strength,
  }
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

// Builds a fresh game world: arena, player, crates, and monsters, plus
// the per-run mutable state (attack, hiding, shake). Positions the camera
// behind the player. Call disposeGame() first if rebuilding on top of an
// existing game.
function createGame() {
  const arena = createArena()
  scene.add(arena.group)
  scene.background = new THREE.Color(arena.backgroundColor)
  scene.fog = arena.fog

  // Crates stand in as circular obstacles for both movement collision
  // and knockback; a later milestone spawns them dynamically.
  const obstacles = CRATE_POSITIONS.map((pos) => ({ x: pos.x, z: pos.z, radius: CRATE_OBSTACLE_RADIUS }))

  const player = new Player({ spawn: { x: 0, z: 0 }, obstacles })
  scene.add(player.mesh)

  const crates = createCrates(CRATE_POSITIONS)
  crates.forEach((crate) => scene.add(crate))

  // A fixed starting group, cycling through the monster types, spawned
  // at the platform's edge. Each starts out wandering; updateMonster
  // drives the rest. Waves arrive in a later milestone.
  const monsterTypeNames = Object.keys(MONSTER_TYPES)
  const monsters = Array.from({ length: STARTING_MONSTER_COUNT }, (_, index) => {
    const type = monsterTypeNames[index % monsterTypeNames.length]
    const stats = MONSTER_TYPES[type]
    const spawn = edgeSpawnPoint(Math.random, ARENA_RADIUS, EDGE_SPAWN_MARGIN)
    const mesh = createMonsterMesh(type)
    mesh.position.x = spawn.x
    mesh.position.z = spawn.z
    mesh.rotation.y = Math.random() * Math.PI * 2
    mesh.userData.wobblePhase = index * 1.3
    mesh.userData.hp = stats.hp
    mesh.userData.radius = stats.radius
    mesh.userData.falling = false
    mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
    Object.assign(mesh.userData, createMonsterAIState())
    scene.add(mesh)
    return mesh
  })

  camera.position.set(
    player.position.x + CAMERA_OFFSET.x,
    CAMERA_OFFSET.y,
    player.position.z + CAMERA_OFFSET.z,
  )

  return {
    arena,
    obstacles,
    player,
    crates,
    monsters,
    hidingState: createHidingState(),
    attackState: createAttackState(),
    shake: createShakeState(),
  }
}

// Removes and disposes everything createGame() added to the scene.
function disposeGame(target) {
  disposeObject3D(target.arena.group)
  disposeObject3D(target.player.mesh)
  target.crates.forEach((crate) => disposeObject3D(crate))
  target.monsters.forEach((mesh) => disposeObject3D(mesh))
}

let started = false
function dismissStartCard() {
  started = true
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
  const deltaSeconds = clock.getDelta()
  const elapsedSeconds = clock.getElapsedTime()

  const gameState = evaluateGameState({
    playerHp: game.player.hp,
    monstersRemaining: game.monsters.length,
  })
  showGameOverlay(hud, gameState === 'playing' ? null : gameState)

  if (!started || gameState !== 'playing') {
    if (started && gameState !== 'playing' && input.wasPressed('KeyR')) {
      disposeGame(game)
      game = createGame()
    }
    composer.render()
    input.endFrame()
    requestAnimationFrame(animate)
    return
  }

  const { obstacles, player, crates, hidingState, attackState, shake } = game
  let monsters = game.monsters

  player.update(input, cameraYaw, deltaSeconds)
  if (!player.falling && !player.hidden && !isOnPlatform(player.position, ARENA_RADIUS)) {
    player.startFalling()
  }
  if (player.falling) player.updateFalling(deltaSeconds, elapsedSeconds)
  updateWobble(player.mesh, elapsedSeconds, 0)

  const { showPrompt } = updateHiding(hidingState, player, crates, input, elapsedSeconds)
  crates.forEach((crate) => updateCrateWiggle(crate, deltaSeconds, elapsedSeconds))

  const { ambushHit, hitAny } = updatePlayerAttack(attackState, {
    player,
    monsters,
    obstacles,
    input,
    elapsedSeconds,
    deltaSeconds,
  })
  if (ambushHit) showAmbushBanner(hud)
  if (hitAny) triggerShake(shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)

  // Dying monsters skip the idle wobble and just finish their death-pop
  // animation before being removed from the scene and this list. Falling
  // monsters (walked, chased, or knocked off the edge) skip it too,
  // tumbling down out of view before the same removal happens -- it
  // counts as a kill exactly like a death pop does, by leaving the list.
  monsters = monsters.filter((mesh) => {
    if (mesh.userData.dying) {
      const finishedDying = updateMonsterHitReaction(mesh, deltaSeconds)
      if (finishedDying) {
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
        scene.remove(mesh)
        return false
      }
      return true
    }

    updateWobble(mesh, elapsedSeconds, mesh.userData.wobblePhase)
    const { hitPlayer } = updateMonster(mesh, player, obstacles, deltaSeconds, elapsedSeconds)
    if (hitPlayer) triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    updateMonsterHitReaction(mesh, deltaSeconds)

    if (!isOnPlatform({ x: mesh.position.x, z: mesh.position.z }, ARENA_RADIUS)) {
      mesh.userData.falling = true
      mesh.userData.fallState = { velocityY: 0, fallenY: 0 }
    }
    return true
  })
  game.monsters = monsters

  separateMonsters(monsters, player, obstacles)
  updateArena(game.arena, elapsedSeconds)

  updateHud(hud, {
    hp: player.hp,
    maxHp: PLAYER_MAX_HP,
    monstersLeft: monsters.length,
    hidden: player.hidden,
    showHidePrompt: showPrompt,
    deltaSeconds,
  })

  const cameraOffset = player.hidden ? HIDDEN_CAMERA_OFFSET : CAMERA_OFFSET
  cameraTarget.set(
    player.position.x + cameraOffset.x,
    cameraOffset.y,
    player.position.z + cameraOffset.z,
  )
  const lerpFactor = 1 - Math.exp(-CAMERA_LERP * deltaSeconds)
  camera.position.lerp(cameraTarget, lerpFactor)
  camera.lookAt(player.position.x, 1, player.position.z)

  const shakeOffset = updateShake(shake, deltaSeconds)
  camera.position.x += shakeOffset.x
  camera.position.y += shakeOffset.y
  camera.position.z += shakeOffset.z

  composer.render()
  input.endFrame()
  requestAnimationFrame(animate)
}

animate()
