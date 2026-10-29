import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  ARENA_RADIUS,
  HIDE_RANGE,
  POD_BUMPER_RADIUS,
  POD_COUNTDOWN_BOB_AMOUNT,
  POD_COUNTDOWN_BOB_SPEED,
  POD_COUNTDOWN_COLOR,
  POD_COUNTDOWN_SIZE,
  POD_COUNTDOWN_URGENT_COLOR,
  POD_DEMATERIALIZE_DURATION,
  POD_EJECT_EXIT_MARGIN,
  POD_EXIT_MARGIN,
  POD_HANDLE_COLOR,
  POD_HANDLE_RAISE,
  POD_HANDLE_SPAN,
  POD_HIDE_URGENT_THRESHOLD,
  POD_MATERIALIZE_DURATION,
  POD_OBSTACLE_RADIUS,
  POD_RIB_THICKNESS,
  POD_RIB_WIDTH,
  POD_SEAM_COLOR_HIGHLIGHT,
  POD_SEAM_COLOR_IDLE,
  POD_SEAM_COLOR_OCCUPIED,
  POD_SEAM_COLOR_URGENT,
  POD_SEAM_PULSE_AMOUNT,
  POD_SEAM_PULSE_SPEED,
  POD_SHELL_BEVEL,
  POD_SHELL_COLOR,
  POD_SHELL_DEPTH,
  POD_SHELL_HEIGHT,
  POD_SHELL_WIDTH,
  POD_TAG_INK_COLOR,
  POD_TAG_SIZE,
  POD_TAG_SWAY_AMOUNT,
  POD_TAG_SWAY_SPEED,
  POD_TAG_TEXT,
  POD_TRIM_COLOR,
  POD_URGENT_WIGGLE_SCALE,
  POD_URGENT_WIGGLE_SPEEDUP,
  POD_WHEEL_COLOR,
  POD_WHEEL_RADIUS,
  POD_WHEEL_WIDTH,
  POD_WIGGLE_ANGLE,
  POD_WIGGLE_DURATION,
  POD_WIGGLE_MAX_INTERVAL,
  POD_WIGGLE_MIN_INTERVAL,
  POD_WIGGLE_SCALE_PULSE,
} from './config.js'
import { canEnterBox, findNearestBox, pickExitPoint, shouldEject } from './logic/hiding.js'

// Draws a paper luggage tag: a manila card with a punched string hole
// and "NOT A GUEST" lettering, since this is obviously not a guest.
function createLuggageTagTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 140
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  const ink = new THREE.Color(POD_TAG_INK_COLOR).getStyle()

  const r = 14
  ctx.fillStyle = '#f0e4c8'
  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(r + 6, 6)
  ctx.lineTo(134 - r, 6)
  ctx.quadraticCurveTo(134, 6, 134, r + 6)
  ctx.lineTo(134, 194 - r)
  ctx.quadraticCurveTo(134, 194, 134 - r, 194)
  ctx.lineTo(r + 6, 194)
  ctx.quadraticCurveTo(6, 194, 6, 194 - r)
  ctx.lineTo(6, r + 6)
  ctx.quadraticCurveTo(6, 6, r + 6, 6)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Punches a transparent hole for the string to loop through.
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(70, 34, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(70, 34, 10, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(POD_TAG_TEXT, 70, 120, 120)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  return texture
}

// Builds the hanging luggage tag as a pivot group: a thin string plus
// the tag card beneath it, both hanging straight down from the pivot's
// local origin. The caller positions the pivot at the handle's grip and
// swings it (rotation.z) to make the tag sway like a pendulum.
function createLuggageTag() {
  const pivot = new THREE.Group()

  const stringLength = 0.08
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, stringLength, 6),
    new THREE.MeshBasicMaterial({ color: POD_TAG_INK_COLOR }),
  )
  string.position.y = -stringLength / 2
  pivot.add(string)

  const tagHeight = POD_TAG_SIZE
  const tagWidth = POD_TAG_SIZE * 0.7
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(tagWidth, tagHeight),
    new THREE.MeshBasicMaterial({ map: createLuggageTagTexture(), transparent: true, side: THREE.DoubleSide }),
  )
  tag.position.y = -(stringLength + tagHeight / 2)
  pivot.add(tag)

  return pivot
}

// Two simple googly eyes on a transparent background, peeking out of
// the suitcase's zipper gap while occupied.
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
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  return texture
}

// A small floating countdown ("10", "9", ... "1") shown over an
// occupied pod while the hide-limit timer runs, turning red in the
// last few seconds. Redrawn only when the displayed text/color actually
// changes (cached on the sprite's own userData), not every frame.
function createCountdownTexture(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 96, 96)
  ctx.font = 'bold 60px Sora, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
  ctx.strokeText(text, 48, 52)
  ctx.fillStyle = color
  ctx.fillText(text, 48, 52)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  return texture
}

function createCountdownSprite() {
  const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, opacity: 0 })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(POD_COUNTDOWN_SIZE, POD_COUNTDOWN_SIZE, 1)
  sprite.visible = false
  sprite.userData.lastText = null
  sprite.userData.lastColor = null
  return sprite
}

// Shows/updates the countdown sprite for `remaining` seconds left (null
// to hide it entirely), redrawing its texture only when the rounded
// seconds or the urgent/normal color actually changed.
function updateCountdownSprite(sprite, remaining, urgent) {
  if (remaining == null) {
    sprite.visible = false
    return
  }
  const text = String(Math.ceil(remaining))
  const color = urgent ? POD_COUNTDOWN_URGENT_COLOR : POD_COUNTDOWN_COLOR
  if (sprite.userData.lastText !== text || sprite.userData.lastColor !== color) {
    if (sprite.material.map) sprite.material.map.dispose()
    sprite.material.map = createCountdownTexture(text, color)
    sprite.material.opacity = 1
    sprite.material.needsUpdate = true
    sprite.userData.lastText = text
    sprite.userData.lastColor = color
  }
  sprite.visible = true
}

function createEyesPlane() {
  const geometry = new THREE.PlaneGeometry(POD_SHELL_WIDTH * 0.6, 0.22)
  const material = new THREE.MeshBasicMaterial({
    map: createPeekingEyesTexture(),
    transparent: true,
    depthTest: false,
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.visible = false
  return plane
}

// Builds a hiding pod as a hard-shell rolling suitcase: a rounded-box
// shell (userData.bodyGroup, which -- while occupied -- wiggles) on two
// small wheels, with corner bumpers, a couple of vertical ribs, a
// telescoping handle on top, glowing zip-seam bands that change color
// by state, a zipper-gap window with a pair of googly eyes that peek
// out when occupied, and a paper luggage tag swaying from the handle.
// Unoccupied and not wiggling until the player hides in it.
function createPodMesh() {
  const group = new THREE.Group()

  const bodyGroup = new THREE.Group()
  group.add(bodyGroup)

  const bodyBottomY = POD_WHEEL_RADIUS
  const bodyCenterY = bodyBottomY + POD_SHELL_HEIGHT / 2
  const bodyTopY = bodyBottomY + POD_SHELL_HEIGHT
  const gripY = bodyTopY + POD_HANDLE_RAISE
  const halfWidth = POD_SHELL_WIDTH / 2
  const halfDepth = POD_SHELL_DEPTH / 2

  const shellMaterial = new THREE.MeshStandardMaterial({ color: POD_SHELL_COLOR, metalness: 0.3, roughness: 0.25 })
  const shell = new THREE.Mesh(
    new RoundedBoxGeometry(POD_SHELL_WIDTH, POD_SHELL_HEIGHT, POD_SHELL_DEPTH, 4, POD_SHELL_BEVEL),
    shellMaterial,
  )
  shell.position.y = bodyCenterY
  shell.castShadow = true
  bodyGroup.add(shell)

  const trimMaterial = new THREE.MeshStandardMaterial({ color: POD_TRIM_COLOR, metalness: 0.4, roughness: 0.5 })

  const bumperGeometry = new THREE.SphereGeometry(POD_BUMPER_RADIUS, 10, 8)
  for (const x of [-halfWidth * 0.92, halfWidth * 0.92]) {
    for (const z of [-halfDepth * 0.92, halfDepth * 0.92]) {
      const bumper = new THREE.Mesh(bumperGeometry, trimMaterial)
      bumper.position.set(x, bodyBottomY, z)
      bodyGroup.add(bumper)
    }
  }

  const ribGeometry = new THREE.BoxGeometry(POD_RIB_WIDTH, POD_SHELL_HEIGHT * 0.75, POD_RIB_THICKNESS)
  for (const x of [-POD_SHELL_WIDTH * 0.18, POD_SHELL_WIDTH * 0.18]) {
    const rib = new THREE.Mesh(ribGeometry, trimMaterial)
    rib.position.set(x, bodyCenterY, halfDepth + POD_RIB_THICKNESS / 2)
    bodyGroup.add(rib)
  }

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: POD_WHEEL_COLOR, metalness: 0.2, roughness: 0.8 })
  const wheelGeometry = new THREE.CylinderGeometry(POD_WHEEL_RADIUS, POD_WHEEL_RADIUS, POD_WHEEL_WIDTH, 14)
  const wheelX = halfWidth - POD_WHEEL_WIDTH / 2 - 0.03
  for (const x of [-wheelX, wheelX]) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheel.rotation.z = Math.PI / 2 // lays the cylinder on its side, axle along x, so it rolls along z
    wheel.position.set(x, POD_WHEEL_RADIUS, -halfDepth + 0.05)
    bodyGroup.add(wheel)
  }

  const handleMaterial = new THREE.MeshStandardMaterial({ color: POD_HANDLE_COLOR, metalness: 0.8, roughness: 0.3 })
  const legGeometry = new THREE.CylinderGeometry(0.025, 0.025, POD_HANDLE_RAISE, 8)
  for (const x of [-POD_HANDLE_SPAN / 2, POD_HANDLE_SPAN / 2]) {
    const leg = new THREE.Mesh(legGeometry, handleMaterial)
    leg.position.set(x, bodyTopY + POD_HANDLE_RAISE / 2, 0)
    bodyGroup.add(leg)
  }
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, POD_HANDLE_SPAN, 8), handleMaterial)
  grip.rotation.z = Math.PI / 2 // lays the cylinder on its side so it spans the two legs like a grip bar
  grip.position.y = gripY
  bodyGroup.add(grip)

  const seamMaterial = new THREE.MeshBasicMaterial({ color: POD_SEAM_COLOR_IDLE })
  const bandGeometry = new THREE.BoxGeometry(POD_SHELL_WIDTH * 1.04, 0.05, POD_SHELL_DEPTH * 1.04)
  for (const t of [0.35, 0.68]) {
    const band = new THREE.Mesh(bandGeometry, seamMaterial)
    band.position.y = bodyBottomY + POD_SHELL_HEIGHT * t
    bodyGroup.add(band)
  }

  const eyesPlane = createEyesPlane()
  eyesPlane.position.set(0, bodyTopY - 0.18, halfDepth + 0.01)
  bodyGroup.add(eyesPlane)

  const tagPivot = createLuggageTag()
  tagPivot.position.set(POD_HANDLE_SPAN * 0.4, gripY, 0)
  group.add(tagPivot)

  const countdownBaseY = gripY + 0.3
  const countdown = createCountdownSprite()
  countdown.position.y = countdownBaseY
  group.add(countdown)

  group.userData.occupied = false
  group.userData.wiggleElapsed = null
  group.userData.nextWiggleAt = Infinity
  group.userData.bodyGroup = bodyGroup
  group.userData.seamMaterial = seamMaterial
  group.userData.eyesPlane = eyesPlane
  group.userData.tagPivot = tagPivot
  group.userData.countdown = countdown
  group.userData.countdownBaseY = countdownBaseY
  group.userData.phase = Math.random() * Math.PI * 2

  // Pods are dynamically spawned/despawned (src/logic/podSpawner.js
  // decides where/when); every one starts tiny and grows in, and is
  // flagged to shrink away once despawned.
  group.scale.setScalar(0)
  group.userData.materializing = true
  group.userData.materializeElapsed = 0
  group.userData.dematerializing = false
  group.userData.dematerializeElapsed = 0

  return group
}

// Builds one pod mesh at `position` ({x, z}), starting its materialize
// (grow-in) animation. The caller adds it to the scene and obstacles.
export function createPod(position) {
  const mesh = createPodMesh()
  mesh.position.x = position.x
  mesh.position.z = position.z
  return mesh
}

// Starts a pod's dematerialize (shrink-away) animation; updatePod
// returns true once it's finished, so the caller knows to remove and
// dispose the mesh.
export function startPodDematerialize(pod) {
  pod.userData.dematerializing = true
  pod.userData.dematerializeElapsed = 0
}

// Advances one pod's materialize/dematerialize scale animation, its
// luggage tag's pendulum sway and the countdown sprite's bob (always
// running), its seam color/pulse (idle, highlighted when
// `isNearestEnterable`, switched to the occupied color, or an urgent
// red once `hideTimeRemaining` -- only meaningful for the one pod the
// player is actually hiding in -- drops to POD_HIDE_URGENT_THRESHOLD or
// under), its countdown sprite while occupied, and, while occupied, its
// comedic wiggle every POD_WIGGLE_MIN_INTERVAL-MAX_INTERVAL seconds
// (faster and harder in the last few urgent seconds). Settles back to
// resting rotation/scale once unoccupied. Returns true once a
// dematerialize animation has finished, so the caller knows to remove
// and dispose the mesh.
export function updatePod(pod, deltaSeconds, now, { isNearestEnterable = false, hideTimeRemaining = null } = {}) {
  if (pod.userData.materializing) {
    pod.userData.materializeElapsed += deltaSeconds
    const growT = Math.min(pod.userData.materializeElapsed / POD_MATERIALIZE_DURATION, 1)
    pod.scale.setScalar(growT)
    if (growT >= 1) pod.userData.materializing = false
  }

  if (pod.userData.dematerializing) {
    pod.userData.dematerializeElapsed += deltaSeconds
    const shrinkT = Math.min(pod.userData.dematerializeElapsed / POD_DEMATERIALIZE_DURATION, 1)
    pod.scale.setScalar(1 - shrinkT)
    if (shrinkT >= 1) return true
  }

  const { bodyGroup, seamMaterial, eyesPlane, tagPivot, countdown, countdownBaseY, occupied } = pod.userData
  const phaseT = now + pod.userData.phase
  const urgent = occupied && hideTimeRemaining != null && hideTimeRemaining <= POD_HIDE_URGENT_THRESHOLD

  tagPivot.rotation.z = Math.sin(phaseT * POD_TAG_SWAY_SPEED) * POD_TAG_SWAY_AMOUNT
  countdown.position.y = countdownBaseY + Math.sin(phaseT * POD_COUNTDOWN_BOB_SPEED) * POD_COUNTDOWN_BOB_AMOUNT

  const baseColor = urgent
    ? POD_SEAM_COLOR_URGENT
    : occupied
      ? POD_SEAM_COLOR_OCCUPIED
      : isNearestEnterable
        ? POD_SEAM_COLOR_HIGHLIGHT
        : POD_SEAM_COLOR_IDLE
  const pulse = 1 + Math.sin(phaseT * POD_SEAM_PULSE_SPEED) * POD_SEAM_PULSE_AMOUNT
  seamMaterial.color.setHex(baseColor).multiplyScalar(pulse)

  eyesPlane.visible = occupied
  updateCountdownSprite(countdown, occupied ? hideTimeRemaining : null, urgent)

  if (!occupied) {
    bodyGroup.rotation.z = 0
    bodyGroup.scale.setScalar(1)
    pod.userData.wiggleElapsed = null
    return false
  }

  const wiggleScale = urgent ? POD_URGENT_WIGGLE_SCALE : 1
  const wiggleSpeedup = urgent ? POD_URGENT_WIGGLE_SPEEDUP : 1

  if (pod.userData.wiggleElapsed === null && now >= pod.userData.nextWiggleAt) {
    pod.userData.wiggleElapsed = 0
    pod.userData.wiggleAngle = (Math.random() * 2 - 1) * POD_WIGGLE_ANGLE * wiggleScale
  }

  if (pod.userData.wiggleElapsed !== null) {
    pod.userData.wiggleElapsed += deltaSeconds
    const wiggleT = Math.min(pod.userData.wiggleElapsed / POD_WIGGLE_DURATION, 1)
    const wobble = Math.sin(wiggleT * Math.PI) // 0 -> 1 -> 0, so it settles back to rest

    bodyGroup.rotation.z = pod.userData.wiggleAngle * wobble
    bodyGroup.scale.setScalar(1 + wobble * POD_WIGGLE_SCALE_PULSE * wiggleScale)

    if (wiggleT >= 1) {
      pod.userData.wiggleElapsed = null
      const minInterval = POD_WIGGLE_MIN_INTERVAL / wiggleSpeedup
      const maxInterval = POD_WIGGLE_MAX_INTERVAL / wiggleSpeedup
      pod.userData.nextWiggleAt = now + minInterval + Math.random() * (maxInterval - minInterval)
      bodyGroup.rotation.z = 0
      bodyGroup.scale.setScalar(1)
    }
  }

  return false
}

// Mutable state for the hiding interaction: which pod (if any) the
// player is currently inside and when they entered (for the hide-limit
// countdown). Create once with createHidingState() and pass the same
// object into updateHiding every frame.
export function createHidingState() {
  return { currentPod: null, enteredAt: null }
}

// Reads edge-triggered E to enter/exit hiding, and the POD_HIDE_LIMIT
// timer while hidden. Entering snaps the player into the nearest
// enterable pod (and starts its wiggle schedule) and records when.
// Leaving -- early with E (no penalty), or forced out once the hide
// limit elapses (the eject penalty) -- pops the player out to a point
// just outside that pod, preferring the side closest to the player's
// facing; either way the pod is single-use, so the caller despawns it
// (see `vacatedPod` below).
//
// Returns { showPrompt, nearestPod, vacatedPod, ejected }: `showPrompt`/
// `nearestPod` drive the "Press E to hide in pod" prompt and highlight,
// same as before; `vacatedPod` is the pod the player just left this
// frame (null most frames) so the caller can start its dematerialize;
// `ejected` is true the one frame that exit was the forced hide-limit
// eject rather than a voluntary E, so the caller can trigger the same
// shake/flash feedback a monster's hit does.
export function updateHiding(hidingState, player, pods, input, now, hideLimit = Infinity) {
  if (player.hidden) {
    const exitedEarly = input.wasPressed('KeyE')
    const ejected = !exitedEarly && shouldEject(hidingState.enteredAt, now, hideLimit)

    if (exitedEarly || ejected) {
      const pod = hidingState.currentPod
      const exitMargin = ejected ? POD_EJECT_EXIT_MARGIN : POD_EXIT_MARGIN
      const exitPos = pickExitPoint(
        { x: pod.position.x, z: pod.position.z },
        POD_OBSTACLE_RADIUS,
        player.facing,
        ARENA_RADIUS,
        exitMargin,
      )
      if (ejected) {
        player.ejectFromHiding(exitPos, now)
      } else {
        player.exitHiding(exitPos, now)
      }
      pod.userData.occupied = false
      hidingState.currentPod = null
      hidingState.enteredAt = null
      return { showPrompt: false, nearestPod: null, vacatedPod: pod, ejected }
    }

    return { showPrompt: false, nearestPod: null, vacatedPod: null, ejected: false }
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
    hidingState.enteredAt = now
    player.enterHiding(nearest.position)
  }

  return { showPrompt: canEnter, nearestPod: canEnter ? nearest.ref : null, vacatedPod: null, ejected: false }
}
