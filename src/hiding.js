import * as THREE from 'three'
import {
  ARENA_RADIUS,
  HIDE_RANGE,
  POD_BASE_HEIGHT,
  POD_BASE_RADIUS,
  POD_FLOOR_GLOW_COLOR,
  POD_FLOOR_GLOW_RADIUS,
  POD_HOVER_BOB_AMOUNT,
  POD_HOVER_BOB_SPEED,
  POD_HOVER_GAP,
  POD_HULL_COLOR,
  POD_HULL_LENGTH,
  POD_HULL_RADIUS,
  POD_LABEL_BOB_AMOUNT,
  POD_LABEL_BOB_SPEED,
  POD_LABEL_SIZE,
  POD_LABEL_TEXT,
  POD_OBSTACLE_RADIUS,
  POD_SEAM_COLOR_HIGHLIGHT,
  POD_SEAM_COLOR_IDLE,
  POD_SEAM_COLOR_OCCUPIED,
  POD_SEAM_PULSE_AMOUNT,
  POD_SEAM_PULSE_SPEED,
  POD_VISOR_ARC,
  POD_VISOR_COLOR,
  POD_VISOR_HEIGHT,
  POD_WIGGLE_ANGLE,
  POD_WIGGLE_DURATION,
  POD_WIGGLE_MAX_INTERVAL,
  POD_WIGGLE_MIN_INTERVAL,
  POD_WIGGLE_SCALE_PULSE,
} from './config.js'
import { canEnterBox, findNearestBox, pickExitPoint } from './logic/hiding.js'

// Draws a small holographic label: a dark translucent panel with a
// glowing border, corner ticks, and "NOT A PLAYER" lettering, since this
// is obviously not a player.
function createPodLabelTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(10, 18, 28, 0.75)'
  ctx.fillRect(4, 4, 248, 88)
  ctx.strokeStyle = '#19e7ff'
  ctx.lineWidth = 3
  ctx.strokeRect(4, 4, 248, 88)

  ctx.lineWidth = 2
  const tick = 16
  for (const [x, y, dx, dy] of [
    [4, 4, tick, 0], [4, 4, 0, tick],
    [252, 4, -tick, 0], [252, 4, 0, tick],
    [4, 92, tick, 0], [4, 92, 0, -tick],
    [252, 92, -tick, 0], [252, 92, 0, -tick],
  ]) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + dx, y + dy)
    ctx.stroke()
  }

  ctx.fillStyle = '#9be7ff'
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(POD_LABEL_TEXT, 128, 50)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createLabelSprite() {
  const material = new THREE.SpriteMaterial({
    map: createPodLabelTexture(),
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  const aspect = 256 / 96
  const height = POD_LABEL_SIZE * 0.4
  sprite.scale.set(height * aspect, height, 1)
  return sprite
}

// Two simple googly eyes on a transparent background, for the pod's
// visor when occupied.
function createPeekingEyesTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 128, 80)

  for (const cx of [40, 88]) {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, 40, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#000000'
    ctx.stroke()

    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(cx + 4, 44, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createHull() {
  const geometry = new THREE.CapsuleGeometry(POD_HULL_RADIUS, POD_HULL_LENGTH, 4, 12)
  const material = new THREE.MeshStandardMaterial({ color: POD_HULL_COLOR, metalness: 0.7, roughness: 0.35 })
  return new THREE.Mesh(geometry, material)
}

function createHoverBase() {
  const geometry = new THREE.CylinderGeometry(POD_BASE_RADIUS, POD_BASE_RADIUS * 0.85, POD_BASE_HEIGHT, 20)
  const material = new THREE.MeshStandardMaterial({ color: POD_HULL_COLOR, metalness: 0.7, roughness: 0.4 })
  return new THREE.Mesh(geometry, material)
}

// A soft glowing ring of light on the floor beneath the pod.
function createFloorGlow() {
  const geometry = new THREE.RingGeometry(POD_FLOOR_GLOW_RADIUS * 0.6, POD_FLOOR_GLOW_RADIUS, 32)
  const material = new THREE.MeshBasicMaterial({
    color: POD_FLOOR_GLOW_COLOR,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.015
  return ring
}

function createSeamRing(radius, material) {
  const geometry = new THREE.TorusGeometry(radius, 0.035, 8, 32)
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = Math.PI / 2
  return ring
}

// A translucent band wrapping the front of the hull, standing in as the
// pod's window; the eyes plane sits just in front of it when occupied.
function createVisor() {
  const radius = POD_HULL_RADIUS * 1.03
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    POD_VISOR_HEIGHT,
    16,
    1,
    true,
    -POD_VISOR_ARC / 2,
    POD_VISOR_ARC,
  )
  const material = new THREE.MeshStandardMaterial({
    color: POD_VISOR_COLOR,
    emissive: new THREE.Color(POD_VISOR_COLOR),
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  })
  const visor = new THREE.Mesh(geometry, material)
  visor.rotation.y = -Math.PI / 2 // centers the open arc on +Z (front)
  return visor
}

function createEyesPlane() {
  const geometry = new THREE.PlaneGeometry(POD_HULL_RADIUS * 1.6, POD_HULL_RADIUS)
  const material = new THREE.MeshBasicMaterial({
    map: createPeekingEyesTexture(),
    transparent: true,
    depthTest: false,
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.visible = false
  return plane
}

// Builds a cargo pod: a hover base and capsule hull (grouped as
// userData.hoverGroup, which bobs and -- while occupied -- wiggles),
// glowing seam rings that change color by state, a translucent visor
// with a pair of googly eyes that peek out when occupied, a floor glow,
// and a bobbing holographic label. Unoccupied and not wiggling until the
// player hides in it.
function createPodMesh() {
  const group = new THREE.Group()

  group.add(createFloorGlow())

  const hoverGroup = new THREE.Group()
  hoverGroup.position.y = POD_BASE_HEIGHT / 2 + POD_HOVER_GAP
  group.add(hoverGroup)

  hoverGroup.add(createHoverBase())

  const hullY = POD_BASE_HEIGHT / 2 + POD_HULL_LENGTH / 2 + POD_HULL_RADIUS
  const hull = createHull()
  hull.position.y = hullY
  hull.castShadow = true
  hoverGroup.add(hull)

  const seamMaterial = new THREE.MeshBasicMaterial({ color: POD_SEAM_COLOR_IDLE })
  const seamRadius = POD_HULL_RADIUS * 1.05
  for (const y of [hullY - POD_HULL_LENGTH * 0.2, hullY + POD_HULL_LENGTH * 0.25]) {
    const seam = createSeamRing(seamRadius, seamMaterial)
    seam.position.y = y
    hoverGroup.add(seam)
  }

  const visorY = hullY + POD_HULL_LENGTH * 0.1
  const visor = createVisor()
  visor.position.y = visorY
  hoverGroup.add(visor)

  const eyesPlane = createEyesPlane()
  eyesPlane.position.set(0, visorY, POD_HULL_RADIUS * 1.05)
  hoverGroup.add(eyesPlane)

  const label = createLabelSprite()
  const labelBaseY = hullY + POD_HULL_LENGTH / 2 + POD_HULL_RADIUS + 0.5
  label.position.y = labelBaseY
  group.add(label)

  group.userData.occupied = false
  group.userData.wiggleElapsed = null
  group.userData.nextWiggleAt = Infinity
  group.userData.hoverGroup = hoverGroup
  group.userData.seamMaterial = seamMaterial
  group.userData.eyesPlane = eyesPlane
  group.userData.label = label
  group.userData.labelBaseY = labelBaseY
  group.userData.phase = Math.random() * Math.PI * 2

  return group
}

// Builds one pod mesh per pod spawn point (world positions; currently
// the fixed ring in config.POD_POSITIONS).
export function createPods(podSpawns) {
  return podSpawns.map((spawn) => {
    const mesh = createPodMesh()
    mesh.position.x = spawn.x
    mesh.position.z = spawn.z
    return mesh
  })
}

// Advances one pod's idle hover bob and label bob (always running), its
// seam color/pulse (idle, highlighted when `isNearestEnterable`, or
// switched to the occupied color with the googly eyes peeking out), and,
// while occupied, its comedic wiggle every POD_WIGGLE_MIN_INTERVAL -
// POD_WIGGLE_MAX_INTERVAL seconds. Settles back to resting rotation/scale
// once unoccupied.
export function updatePod(pod, deltaSeconds, now, { isNearestEnterable = false } = {}) {
  const { hoverGroup, seamMaterial, eyesPlane, label, labelBaseY, occupied } = pod.userData
  const t = now + pod.userData.phase

  hoverGroup.position.y = POD_BASE_HEIGHT / 2 + POD_HOVER_GAP + Math.sin(t * POD_HOVER_BOB_SPEED) * POD_HOVER_BOB_AMOUNT
  label.position.y = labelBaseY + Math.sin(t * POD_LABEL_BOB_SPEED) * POD_LABEL_BOB_AMOUNT

  const baseColor = occupied
    ? POD_SEAM_COLOR_OCCUPIED
    : isNearestEnterable
      ? POD_SEAM_COLOR_HIGHLIGHT
      : POD_SEAM_COLOR_IDLE
  const pulse = 1 + Math.sin(t * POD_SEAM_PULSE_SPEED) * POD_SEAM_PULSE_AMOUNT
  seamMaterial.color.setHex(baseColor).multiplyScalar(pulse)

  eyesPlane.visible = occupied

  if (!occupied) {
    hoverGroup.rotation.z = 0
    hoverGroup.scale.setScalar(1)
    pod.userData.wiggleElapsed = null
    return
  }

  if (pod.userData.wiggleElapsed === null && now >= pod.userData.nextWiggleAt) {
    pod.userData.wiggleElapsed = 0
    pod.userData.wiggleAngle = (Math.random() * 2 - 1) * POD_WIGGLE_ANGLE
  }

  if (pod.userData.wiggleElapsed !== null) {
    pod.userData.wiggleElapsed += deltaSeconds
    const wiggleT = Math.min(pod.userData.wiggleElapsed / POD_WIGGLE_DURATION, 1)
    const wobble = Math.sin(wiggleT * Math.PI) // 0 -> 1 -> 0, so it settles back to rest

    hoverGroup.rotation.z = pod.userData.wiggleAngle * wobble
    hoverGroup.scale.setScalar(1 + wobble * POD_WIGGLE_SCALE_PULSE)

    if (wiggleT >= 1) {
      pod.userData.wiggleElapsed = null
      pod.userData.nextWiggleAt =
        now + POD_WIGGLE_MIN_INTERVAL + Math.random() * (POD_WIGGLE_MAX_INTERVAL - POD_WIGGLE_MIN_INTERVAL)
      hoverGroup.rotation.z = 0
      hoverGroup.scale.setScalar(1)
    }
  }
}

// Mutable state for the hiding interaction: which pod (if any) the
// player is currently inside. Create once with createHidingState() and
// pass the same object into updateHiding every frame.
export function createHidingState() {
  return { currentPod: null }
}

// Reads edge-triggered E to enter/exit hiding. Entering snaps the player
// into the nearest enterable pod (and starts its wiggle schedule);
// exiting pops the player out to a point just outside that pod,
// preferring the side closest to the player's facing. Returns whether
// the "Press E to hide in pod" HUD prompt should show, and which pod (if
// any) is the nearest enterable one, so the caller can highlight it.
export function updateHiding(hidingState, player, pods, input, now) {
  if (player.hidden) {
    if (input.wasPressed('KeyE')) {
      const pod = hidingState.currentPod
      const exitPos = pickExitPoint(
        { x: pod.position.x, z: pod.position.z },
        POD_OBSTACLE_RADIUS,
        player.facing,
        ARENA_RADIUS,
      )
      player.exitHiding(exitPos, now)
      pod.userData.occupied = false
      hidingState.currentPod = null
    }
    return { showPrompt: false, nearestPod: null }
  }

  const boxes = pods.map((pod) => ({
    position: { x: pod.position.x, z: pod.position.z },
    occupied: pod.userData.occupied,
    ref: pod,
  }))
  const nearest = findNearestBox(player.position, boxes, HIDE_RANGE)
  const canEnter =
    nearest != null &&
    canEnterBox({ hp: player.hp, hidden: player.hidden, position: player.position }, nearest, HIDE_RANGE)

  if (canEnter && input.wasPressed('KeyE')) {
    nearest.ref.userData.occupied = true
    nearest.ref.userData.nextWiggleAt =
      now + POD_WIGGLE_MIN_INTERVAL + Math.random() * (POD_WIGGLE_MAX_INTERVAL - POD_WIGGLE_MIN_INTERVAL)
    hidingState.currentPod = nearest.ref
    player.enterHiding(nearest.position)
  }

  return { showPrompt: canEnter, nearestPod: canEnter ? nearest.ref : null }
}
