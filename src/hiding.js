import * as THREE from 'three'
import {
  CRATE_SIZE,
  CRATE_WIGGLE_ANGLE,
  CRATE_WIGGLE_DURATION,
  CRATE_WIGGLE_MAX_INTERVAL,
  CRATE_WIGGLE_MIN_INTERVAL,
  CRATE_WIGGLE_SCALE_PULSE,
  HIDE_RANGE,
} from './config.js'
import { worldToGrid } from './logic/grid.js'
import { canEnterBox, findNearestBox, pickExitTile } from './logic/hiding.js'

// Draws a plank-look texture: brown with darker plank lines and a goofy
// stencil, since this is obviously not a player.
function createCrateTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#8b5a2b'
  ctx.fillRect(0, 0, 128, 128)

  ctx.strokeStyle = '#5a3a1a'
  ctx.lineWidth = 4
  for (let i = 1; i < 4; i++) {
    const y = i * 32
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(128, y)
    ctx.stroke()
  }
  ctx.strokeRect(2, 2, 124, 124)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.save()
  ctx.translate(64, 64)
  ctx.rotate(-0.05)
  ctx.fillText('NOT A PLAYER', 0, -8)
  ctx.fillText('FRAGILE', 0, 10)
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createCrateMesh() {
  const geometry = new THREE.BoxGeometry(CRATE_SIZE, CRATE_SIZE, CRATE_SIZE)
  const material = new THREE.MeshStandardMaterial({ map: createCrateTexture() })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = CRATE_SIZE / 2
  mesh.userData.occupied = false
  mesh.userData.wiggleElapsed = null
  mesh.userData.nextWiggleAt = Infinity
  return mesh
}

// Builds one crate mesh per box spawn point (world positions from the
// dungeon). Unoccupied and not wiggling until the player hides in one.
export function createCrates(boxSpawns) {
  return boxSpawns.map((spawn) => {
    const mesh = createCrateMesh()
    mesh.position.x = spawn.x
    mesh.position.z = spawn.z
    return mesh
  })
}

// While occupied, wiggles the crate (a small random rotation/scale pulse)
// every CRATE_WIGGLE_MIN_INTERVAL-CRATE_WIGGLE_MAX_INTERVAL seconds, purely
// for comedy. Settles back to resting rotation/scale once unoccupied.
export function updateCrateWiggle(crate, deltaSeconds, now) {
  if (!crate.userData.occupied) {
    crate.rotation.z = 0
    crate.scale.setScalar(1)
    crate.userData.wiggleElapsed = null
    return
  }

  if (crate.userData.wiggleElapsed === null && now >= crate.userData.nextWiggleAt) {
    crate.userData.wiggleElapsed = 0
    crate.userData.wiggleAngle = (Math.random() * 2 - 1) * CRATE_WIGGLE_ANGLE
  }

  if (crate.userData.wiggleElapsed !== null) {
    crate.userData.wiggleElapsed += deltaSeconds
    const t = Math.min(crate.userData.wiggleElapsed / CRATE_WIGGLE_DURATION, 1)
    const wobble = Math.sin(t * Math.PI) // 0 -> 1 -> 0, so it settles back to rest

    crate.rotation.z = crate.userData.wiggleAngle * wobble
    crate.scale.setScalar(1 + wobble * CRATE_WIGGLE_SCALE_PULSE)

    if (t >= 1) {
      crate.userData.wiggleElapsed = null
      crate.userData.nextWiggleAt =
        now + CRATE_WIGGLE_MIN_INTERVAL + Math.random() * (CRATE_WIGGLE_MAX_INTERVAL - CRATE_WIGGLE_MIN_INTERVAL)
      crate.rotation.z = 0
      crate.scale.setScalar(1)
    }
  }
}

// Mutable state for the hiding interaction: which crate (if any) the
// player is currently inside. Create once with createHidingState() and
// pass the same object into updateHiding every frame.
export function createHidingState() {
  return { currentCrate: null }
}

// Reads edge-triggered E to enter/exit hiding. Entering snaps the player
// into the nearest enterable crate (and starts its wiggle schedule);
// exiting pops the player out to a walkable tile next to that crate,
// preferring the side closest to the player's facing. Returns whether the
// "Press E to hide" HUD prompt should show.
export function updateHiding(hidingState, player, crates, grid, tileSize, input, now) {
  if (player.hidden) {
    if (input.wasPressed('KeyE')) {
      const crate = hidingState.currentCrate
      const crateGridPos = worldToGrid(crate.position.x, crate.position.z, tileSize)
      const exitPos = pickExitTile(grid, tileSize, crateGridPos, player.facing)
      player.exitHiding(exitPos, now)
      crate.userData.occupied = false
      hidingState.currentCrate = null
    }
    return { showPrompt: false }
  }

  const boxes = crates.map((crate) => ({
    position: { x: crate.position.x, z: crate.position.z },
    occupied: crate.userData.occupied,
    ref: crate,
  }))
  const nearest = findNearestBox(player.position, boxes, HIDE_RANGE)
  const canEnter =
    nearest != null &&
    canEnterBox({ hp: player.hp, hidden: player.hidden, position: player.position }, nearest, HIDE_RANGE)

  if (canEnter && input.wasPressed('KeyE')) {
    nearest.ref.userData.occupied = true
    nearest.ref.userData.nextWiggleAt =
      now + CRATE_WIGGLE_MIN_INTERVAL + Math.random() * (CRATE_WIGGLE_MAX_INTERVAL - CRATE_WIGGLE_MIN_INTERVAL)
    hidingState.currentCrate = nearest.ref
    player.enterHiding(nearest.position)
  }

  return { showPrompt: canEnter }
}
