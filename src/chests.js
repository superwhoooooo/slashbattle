// Treasure chests: a glowing neon chest standing on the platform with a
// crystal price floating over it (green when you can afford it, red when
// not, "FREE" for a boss's reward chest). Walk up and press F to pay and
// pop it open; what's inside is decided by logic/inventory.js's
// rollChestLoot. Single-use, like pods: once opened it vanishes.
import * as THREE from 'three'

const BASE_COLOR = 0x1b1530
const TRIM_COLOR = 0xffc93d
const GEM_COLOR = 0xff4fd8
const AFFORDABLE_COLOR = '#7dffb0'
const UNAFFORDABLE_COLOR = '#ff6b86'

const SPAWN_IN_TIME = 0.5
const LID_OPEN_TIME = 0.35
const VANISH_START = 0.9
const VANISH_TIME = 0.45

const labelTextures = new Map()

// "💎 12" (or FREE) in Sora on a dark pill, cached per text+state.
function labelTexture(cost, affordable) {
  const key = `${cost}|${affordable}`
  const cached = labelTextures.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(10, 14, 28, 0.78)'
  ctx.beginPath()
  ctx.roundRect(8, 8, 240, 80, 24)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = affordable ? AFFORDABLE_COLOR : UNAFFORDABLE_COLOR
  ctx.stroke()
  ctx.font = 'bold 46px Sora, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = affordable ? AFFORDABLE_COLOR : UNAFFORDABLE_COLOR
  ctx.fillText(cost === 0 ? 'FREE' : `💎 ${cost}`, 128, 50)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  labelTextures.set(key, texture)
  return texture
}

function metal(color, emissive = 0, intensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.6,
    roughness: 0.4,
    emissive: new THREE.Color(emissive),
    emissiveIntensity: intensity,
  })
}

// Builds a chest at `point` ({x, z}) that costs `cost` crystals (0 = free).
export function createChest(point, cost) {
  const group = new THREE.Group()
  group.position.set(point.x, 0, point.z)

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.8), metal(BASE_COLOR))
  body.position.y = 0.3
  body.castShadow = true
  group.add(body)
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.12, 0.86), metal(TRIM_COLOR, TRIM_COLOR, 0.6))
  trim.position.y = 0.34
  group.add(trim)

  // The lid hinges at the chest's back-top edge.
  const lid = new THREE.Group()
  lid.position.set(0, 0.6, -0.4)
  const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.8), metal(BASE_COLOR))
  lidMesh.position.set(0, 0.15, 0.4)
  lidMesh.castShadow = true
  lid.add(lidMesh)
  const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.07, 0.86), metal(TRIM_COLOR, TRIM_COLOR, 0.6))
  lidTrim.position.set(0, 0.04, 0.4)
  lid.add(lidTrim)
  group.add(lid)

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial({ color: GEM_COLOR, emissive: GEM_COLOR, emissiveIntensity: 1.2, flatShading: true }),
  )
  gem.position.set(0, 0.58, 0.46)
  group.add(gem)

  // A faint tall beam so chests can be spotted across the big platform.
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 7, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: TRIM_COLOR, transparent: true, opacity: 0.12, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  beam.position.y = 3.5
  group.add(beam)

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: labelTexture(cost, false), transparent: true, depthTest: false }),
  )
  label.scale.set(1.7, 0.64, 1)
  label.position.y = 1.9
  label.renderOrder = 10
  group.add(label)

  group.scale.setScalar(0.01)
  group.userData = {
    cost,
    affordable: false,
    opened: false,
    openElapsed: null,
    spawnElapsed: 0,
    lid,
    gem,
    beam,
    label,
    trimMaterials: [trim.material, lidTrim.material],
  }
  return group
}

export function openChest(chest) {
  chest.userData.opened = true
  chest.userData.openElapsed = 0
}

// Animates one chest by dt: grow-in, idle glow/bob, the price label's
// color, a brighter trim when it's the one you're about to open, and the
// open-and-vanish. Returns true once it has finished vanishing (so the
// caller can dispose it).
export function updateChest(chest, dt, elapsed, { affordable, highlighted }) {
  const data = chest.userData
  data.spawnElapsed += dt

  if (affordable !== data.affordable) {
    data.affordable = affordable
    data.label.material.map = labelTexture(data.cost, affordable)
    data.label.material.needsUpdate = true
  }

  let scale = Math.min(1, data.spawnElapsed / SPAWN_IN_TIME)
  scale = 1 - (1 - scale) * (1 - scale)

  data.gem.rotation.y = elapsed * 2
  data.gem.position.y = 0.58 + Math.sin(elapsed * 3) * 0.03
  data.label.position.y = 1.9 + Math.sin(elapsed * 2) * 0.08
  data.beam.material.opacity = (highlighted ? 0.22 : 0.1) + Math.sin(elapsed * 2.5) * 0.03
  for (const material of data.trimMaterials) material.emissiveIntensity = highlighted ? 1.4 : 0.6

  if (data.openElapsed !== null) {
    data.openElapsed += dt
    data.lid.rotation.x = -Math.min(1, data.openElapsed / LID_OPEN_TIME) * 1.9
    data.beam.material.opacity = 0.35 * Math.max(0, 1 - data.openElapsed)
    data.label.visible = false
    if (data.openElapsed > VANISH_START) {
      scale *= Math.max(0, 1 - (data.openElapsed - VANISH_START) / VANISH_TIME)
    }
    chest.scale.setScalar(Math.max(scale, 0.001))
    return data.openElapsed >= VANISH_START + VANISH_TIME
  }

  chest.scale.setScalar(Math.max(scale, 0.01) * (highlighted ? 1.06 : 1))
  return false
}
