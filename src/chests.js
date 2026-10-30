// Treasure chests: a resort beach cooler standing on the platform with a
// crystal price floating over it in a frosted pill -- teal border and an
// "OPEN" hint when you can afford it, a muted sand pill with a coral price
// when you can't, a butter pill reading "FREE" for a boss's reward chest.
// Walk up and press F to pay and pop the lid open; what's inside is decided
// by logic/inventory.js's rollChestLoot. Single-use, like pods: once opened
// it vanishes.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const BODY_COLOR = 0xf7eedc // cream cooler shell
const LID_COLOR = 0x19b5a5 // teal lid
const LATCH_COLOR = 0xff6a4d // coral latch clasp
const STRIPE_COLOR = 0xffd15c // butter resort stripe around the base
const HANDLE_COLOR = 0xd8d0bd // sandy molded side grips
const GARNISH_COLOR = 0xcdf2ec // icy sparkle garnish bobbing above the lid

const PILL_BG_AFFORDABLE = 'rgba(255, 255, 255, 0.92)'
const PILL_BORDER_AFFORDABLE = '#19b5a5'
const PILL_BG_UNAFFORDABLE = 'rgba(214, 206, 193, 0.85)'
const PILL_BORDER_UNAFFORDABLE = 'rgba(150, 139, 121, 0.9)'
const PILL_BG_FREE = '#ffd15c'
const PILL_BORDER_FREE = '#e8ad2c'
const PILL_INK_COLOR = '#2c2416'
const PILL_CORAL_COLOR = '#ff6a4d'
const PILL_TEAL_COLOR = '#0e8c7f'
const PILL_MUTED_COLOR = '#6b6355'

const SPAWN_IN_TIME = 0.5
const LID_OPEN_TIME = 0.35
const VANISH_START = 0.9
const VANISH_TIME = 0.45

const MAIN_FONT = 'bold 42px Sora, system-ui, sans-serif'
const SUB_FONT = 'bold 22px Sora, system-ui, sans-serif'
// @fontsource/sora is imported in main.js but loads asynchronously; wait
// for it so a label drawn before it's ready doesn't bake the fallback font
// permanently into its cached canvas texture (drawLabel is re-run once
// this resolves).
const soraLoaded =
  typeof document !== 'undefined' && document.fonts
    ? Promise.all([MAIN_FONT, SUB_FONT].map((font) => document.fonts.load(font))).catch(() => [])
    : Promise.resolve([])

const labelTextures = new Map()

// Draws the floating price pill: a rounded card reading the crystal cost
// (or FREE) plus a short caption -- "OPEN" in teal when affordable, "NEED
// MORE" in muted ink when not -- so each state reads from its wording and
// border, not from red/green alone.
function drawLabel(cost, affordable) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 108
  const ctx = canvas.getContext('2d')
  const free = cost === 0

  ctx.fillStyle = free ? PILL_BG_FREE : affordable ? PILL_BG_AFFORDABLE : PILL_BG_UNAFFORDABLE
  ctx.beginPath()
  ctx.roundRect(8, 8, 240, 92, 26)
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = free ? PILL_BORDER_FREE : affordable ? PILL_BORDER_AFFORDABLE : PILL_BORDER_UNAFFORDABLE
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (free) {
    ctx.font = MAIN_FONT
    ctx.fillStyle = PILL_INK_COLOR
    ctx.fillText('FREE', 128, 54)
  } else {
    ctx.font = MAIN_FONT
    ctx.fillStyle = affordable ? PILL_INK_COLOR : PILL_CORAL_COLOR
    ctx.fillText(`\u{1F48E} ${cost}`, 128, 42)
    ctx.font = SUB_FONT
    ctx.fillStyle = affordable ? PILL_TEAL_COLOR : PILL_MUTED_COLOR
    ctx.fillText(affordable ? 'OPEN' : 'NEED MORE', 128, 80)
  }
  return canvas
}

// Cached per cost+affordable state, redrawn once Sora is actually loaded.
function labelTexture(cost, affordable) {
  const key = `${cost}|${affordable}`
  const cached = labelTextures.get(key)
  if (cached) return cached
  const texture = new THREE.CanvasTexture(drawLabel(cost, affordable))
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  labelTextures.set(key, texture)
  soraLoaded.then(() => {
    texture.image = drawLabel(cost, affordable)
    texture.needsUpdate = true
  })
  return texture
}

function plastic(color, emissive = 0, intensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.05,
    roughness: 0.55,
    emissive: new THREE.Color(emissive),
    emissiveIntensity: intensity,
  })
}

// Builds a chest at `point` ({x, z}) that costs `cost` crystals (0 = free).
export function createChest(point, cost) {
  const group = new THREE.Group()
  group.position.set(point.x, 0, point.z)

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.6, 0.8, 4, 0.08), plastic(BODY_COLOR))
  body.position.y = 0.3
  body.castShadow = true
  group.add(body)

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.08, 0.84), plastic(STRIPE_COLOR))
  stripe.position.y = 0.14
  group.add(stripe)

  const handleGeometry = new RoundedBoxGeometry(0.05, 0.22, 0.3, 2, 0.02)
  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(handleGeometry, plastic(HANDLE_COLOR))
    handle.position.set(side * 0.63, 0.3, 0)
    group.add(handle)
  }

  // The lid hinges at the chest's back-top edge; opening swings it
  // backward and down, same as a cooler lid flipping open.
  const lid = new THREE.Group()
  lid.position.set(0, 0.6, -0.4)
  const lidMesh = new THREE.Mesh(new RoundedBoxGeometry(1.26, 0.26, 0.86, 4, 0.07), plastic(LID_COLOR))
  lidMesh.position.set(0, 0.13, 0.4)
  lidMesh.castShadow = true
  lid.add(lidMesh)
  group.add(lid)

  const latch = new THREE.Mesh(
    new RoundedBoxGeometry(0.22, 0.12, 0.08, 2, 0.03),
    plastic(LATCH_COLOR, LATCH_COLOR, 0.15),
  )
  latch.position.set(0, 0.3, 0.44)
  group.add(latch)

  const garnish = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.1, 0),
    new THREE.MeshStandardMaterial({ color: GARNISH_COLOR, transparent: true, opacity: 0.85, roughness: 0.2, flatShading: true }),
  )
  garnish.position.set(0, 0.95, 0)
  group.add(garnish)

  // A soft ring resting on the deck so chests can be spotted across the
  // big platform without a neon beam glaring into the daylight sky.
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.9, 32),
    new THREE.MeshBasicMaterial({ color: LID_COLOR, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }),
  )
  marker.rotation.x = -Math.PI / 2
  marker.position.y = 0.02
  group.add(marker)

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: labelTexture(cost, false), transparent: true, depthTest: false }),
  )
  label.scale.set(1.7, 0.72, 1)
  label.position.y = 1.5
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
    garnish,
    marker,
    label,
    latchMaterial: latch.material,
  }
  return group
}

export function openChest(chest) {
  chest.userData.opened = true
  chest.userData.openElapsed = 0
}

// Animates one chest by dt: grow-in, idle bob/glint, the price label's
// state, a brighter latch when it's the one you're about to open, and the
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

  data.garnish.rotation.y = elapsed * 2
  data.garnish.position.y = 0.95 + Math.sin(elapsed * 3) * 0.03
  data.label.position.y = 1.5 + Math.sin(elapsed * 2) * 0.08
  data.marker.material.opacity = (highlighted ? 0.35 : 0.22) + Math.sin(elapsed * 2) * 0.05
  data.marker.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.03)
  data.latchMaterial.emissiveIntensity = highlighted ? 0.8 : 0.15

  if (data.openElapsed !== null) {
    data.openElapsed += dt
    data.lid.rotation.x = -Math.min(1, data.openElapsed / LID_OPEN_TIME) * 1.9
    data.marker.material.opacity = 0.3 * Math.max(0, 1 - data.openElapsed)
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
