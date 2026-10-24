import * as THREE from 'three'
import { createMonsterMesh, updateWobble } from './characters.js'
import { CAMERA_LERP, CAMERA_OFFSET, MONSTER_TYPES } from './config.js'
import { createDungeon } from './dungeon.js'
import { Input } from './input.js'
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

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)

const input = new Input()
const player = new Player({
  spawn: dungeon.playerSpawn,
  grid: dungeon.grid,
  tileSize: dungeon.tileSize,
})
scene.add(player.mesh)

// Spawn one monster per M spawn point, cycling through the monster types.
// They just stand and wobble for now; AI arrives in a later milestone.
const monsterTypeNames = Object.keys(MONSTER_TYPES)
const monsters = dungeon.monsterSpawns.map((spawn, index) => {
  const type = monsterTypeNames[index % monsterTypeNames.length]
  const mesh = createMonsterMesh(type)
  mesh.position.x = spawn.x
  mesh.position.z = spawn.z
  mesh.rotation.y = Math.random() * Math.PI * 2
  mesh.userData.wobblePhase = index * 1.3
  scene.add(mesh)
  return mesh
})

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

  player.update(input, cameraYaw, deltaSeconds)
  updateWobble(player.mesh, elapsedSeconds, 0)
  monsters.forEach((mesh) => updateWobble(mesh, elapsedSeconds, mesh.userData.wobblePhase))

  cameraTarget.set(
    player.position.x + CAMERA_OFFSET.x,
    CAMERA_OFFSET.y,
    player.position.z + CAMERA_OFFSET.z,
  )
  const lerpFactor = 1 - Math.exp(-CAMERA_LERP * deltaSeconds)
  camera.position.lerp(cameraTarget, lerpFactor)
  camera.lookAt(player.position.x, 1, player.position.z)

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

animate()
