import * as THREE from 'three'
import { createMonsterMesh, updateWobble } from './characters.js'
import {
  CAMERA_LERP,
  CAMERA_OFFSET,
  HIDDEN_CAMERA_OFFSET,
  MONSTER_TYPES,
  PLAYER_MAX_HP,
} from './config.js'
import { createAttackState, updateMonsterHitReaction, updatePlayerAttack } from './combat.js'
import { createDungeon } from './dungeon.js'
import { createCrates, createHidingState, updateCrateWiggle, updateHiding } from './hiding.js'
import { createHud, showAmbushBanner, updateHud } from './hud.js'
import { Input } from './input.js'
import { withObstacles } from './logic/grid.js'
import { createMonsterAIState, separateMonsters, updateMonster } from './monster.js'
import { Player } from './player.js'

const container = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()

const dungeon = createDungeon()
scene.add(dungeon.group)
scene.background = new THREE.Color(dungeon.backgroundColor)
scene.fog = dungeon.fog

// Crates are solid for movement but should NOT block line of sight, so
// movement/collision uses this grid (walls + crate tiles) while anything
// checking line of sight keeps using dungeon.grid (walls only).
const collisionGrid = withObstacles(dungeon.grid, dungeon.grid.boxSpawns)

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)

const input = new Input()
const player = new Player({
  spawn: dungeon.playerSpawn,
  grid: collisionGrid,
  tileSize: dungeon.tileSize,
})
scene.add(player.mesh)

const crates = createCrates(dungeon.boxSpawns)
crates.forEach((crate) => scene.add(crate))
const hidingState = createHidingState()

// Spawn one monster per M spawn point, cycling through the monster types.
// Each starts out wandering; updateMonster drives wander/chase/attack/search.
const monsterTypeNames = Object.keys(MONSTER_TYPES)
let monsters = dungeon.monsterSpawns.map((spawn, index) => {
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

const attackState = createAttackState()
const hud = createHud()

// The camera doesn't rotate yet, so it stays behind the player along a
// fixed world-space offset and eases toward its target each frame.
const cameraYaw = 0
const cameraTarget = new THREE.Vector3()
camera.position.set(
  player.position.x + CAMERA_OFFSET.x,
  CAMERA_OFFSET.y,
  player.position.z + CAMERA_OFFSET.z,
)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const clock = new THREE.Clock()

function animate() {
  const deltaSeconds = clock.getDelta()
  const elapsedSeconds = clock.getElapsedTime()

  // Once hp hits 0, stop reading player input; the game-over screen comes
  // in a later milestone.
  if (player.hp > 0) player.update(input, cameraYaw, deltaSeconds)
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

  const { ambushHit } = updatePlayerAttack(attackState, {
    player,
    monsters,
    grid: collisionGrid,
    tileSize: dungeon.tileSize,
    input,
    elapsedSeconds,
    deltaSeconds,
  })
  if (ambushHit) showAmbushBanner(hud)

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
    updateMonster(mesh, player, collisionGrid, deltaSeconds, elapsedSeconds, dungeon.grid)
    updateMonsterHitReaction(mesh, deltaSeconds)
    return true
  })

  separateMonsters(monsters, player, collisionGrid)

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

  renderer.render(scene, camera)
  input.endFrame()
  requestAnimationFrame(animate)
}

animate()
