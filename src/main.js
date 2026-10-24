import * as THREE from 'three'
import { createMonsterMesh, updateWobble } from './characters.js'
import {
  CAMERA_LERP,
  CAMERA_OFFSET,
  HIDDEN_CAMERA_OFFSET,
  MONSTER_TYPES,
  PLAYER_MAX_HP,
  SHAKE_DAMAGE_DURATION,
  SHAKE_DAMAGE_MAGNITUDE,
  SHAKE_HIT_DURATION,
  SHAKE_HIT_MAGNITUDE,
} from './config.js'
import { createAttackState, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
import { createDungeon, updateTorchFlicker } from './dungeon.js'
import { createCrates, createHidingState, updateCrateWiggle, updateHiding } from './hiding.js'
import { createHud, hideStartCard, showAmbushBanner, showGameOverlay, updateHud } from './hud.js'
import { Input } from './input.js'
import { evaluateGameState } from './logic/gameState.js'
import { withObstacles } from './logic/grid.js'
import { createMonsterAIState, separateMonsters, updateMonster } from './monster.js'
import { Player } from './player.js'

const container = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)

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

// Builds a fresh game world: dungeon, grids, player, crates, and
// monsters, plus the per-run mutable state (attack, hiding, shake).
// Positions the camera behind the player. Call disposeGame() first if
// rebuilding on top of an existing game.
function createGame() {
  const dungeon = createDungeon()
  scene.add(dungeon.group)
  scene.background = new THREE.Color(dungeon.backgroundColor)
  scene.fog = dungeon.fog

  // Crates are solid for movement but should NOT block line of sight, so
  // movement/collision uses this grid (walls + crate tiles) while anything
  // checking line of sight keeps using dungeon.grid (walls only).
  const collisionGrid = withObstacles(dungeon.grid, dungeon.grid.boxSpawns)

  const player = new Player({
    spawn: dungeon.playerSpawn,
    grid: collisionGrid,
    tileSize: dungeon.tileSize,
  })
  scene.add(player.mesh)

  const crates = createCrates(dungeon.boxSpawns)
  crates.forEach((crate) => scene.add(crate))

  // Spawn one monster per M spawn point, cycling through the monster
  // types. Each starts out wandering; updateMonster drives the rest.
  const monsterTypeNames = Object.keys(MONSTER_TYPES)
  const monsters = dungeon.monsterSpawns.map((spawn, index) => {
    const type = monsterTypeNames[index % monsterTypeNames.length]
    const stats = MONSTER_TYPES[type]
    const mesh = createMonsterMesh(type)
    mesh.position.x = spawn.x
    mesh.position.z = spawn.z
    mesh.rotation.y = Math.random() * Math.PI * 2
    mesh.userData.wobblePhase = index * 1.3
    mesh.userData.hp = stats.hp
    mesh.userData.radius = stats.radius
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
    dungeon,
    collisionGrid,
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
  disposeObject3D(target.dungeon.group)
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
    renderer.render(scene, camera)
    input.endFrame()
    requestAnimationFrame(animate)
    return
  }

  const { dungeon, collisionGrid, player, crates, hidingState, attackState, shake } = game
  let monsters = game.monsters

  player.update(input, cameraYaw, deltaSeconds)
  updateWobble(player.mesh, elapsedSeconds, 0)

  const { showPrompt } = updateHiding(
    hidingState,
    player,
    crates,
    collisionGrid,
    dungeon.tileSize,
    input,
    elapsedSeconds,
  )
  crates.forEach((crate) => updateCrateWiggle(crate, deltaSeconds, elapsedSeconds))

  const { ambushHit, hitAny } = updatePlayerAttack(attackState, {
    player,
    monsters,
    grid: collisionGrid,
    tileSize: dungeon.tileSize,
    input,
    elapsedSeconds,
    deltaSeconds,
  })
  if (ambushHit) showAmbushBanner(hud)
  if (hitAny) triggerShake(shake, SHAKE_HIT_MAGNITUDE, SHAKE_HIT_DURATION)

  // Dying monsters skip the idle wobble and just finish their death-pop
  // animation before being removed from the scene and this list.
  monsters = monsters.filter((mesh) => {
    if (mesh.userData.dying) {
      const finishedDying = updateMonsterHitReaction(mesh, deltaSeconds)
      if (finishedDying) {
        scene.remove(mesh)
        return false
      }
      return true
    }

    updateWobble(mesh, elapsedSeconds, mesh.userData.wobblePhase)
    // Movement collides with crates (collisionGrid); line of sight does
    // not (dungeon.grid), so a crate can't itself grant cover.
    const { hitPlayer } = updateMonster(mesh, player, collisionGrid, deltaSeconds, elapsedSeconds, dungeon.grid)
    if (hitPlayer) triggerShake(shake, SHAKE_DAMAGE_MAGNITUDE, SHAKE_DAMAGE_DURATION)
    updateMonsterHitReaction(mesh, deltaSeconds)
    return true
  })
  game.monsters = monsters

  separateMonsters(monsters, player, collisionGrid)
  updateTorchFlicker(dungeon.torches, elapsedSeconds)

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

  renderer.render(scene, camera)
  input.endFrame()
  requestAnimationFrame(animate)
}

animate()
