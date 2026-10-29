import * as THREE from 'three'
import {
  ARENA_DECK_BORDER_COLOR,
  ARENA_DECK_BORDER_WIDTH,
  ARENA_DECK_PINSTRIPE_COLOR,
  ARENA_DECK_PINSTRIPE_INSET,
  ARENA_DECK_PINSTRIPE_WIDTH,
  ARENA_DECK_PLANK_COLOR,
  ARENA_DECK_PLANK_LENGTH,
  ARENA_DECK_PLANK_WIDTH,
  ARENA_DECK_SEAM_COLOR,
  ARENA_HULL_COLOR,
  ARENA_RADIUS,
  ARENA_THICKNESS,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  GAS_GIANT_COLOR,
  GAS_GIANT_EMISSIVE_INTENSITY,
  GAS_GIANT_POSITION,
  GAS_GIANT_RADIUS,
  GAS_GIANT_RING_COLOR,
  GAS_GIANT_RING_INNER_RADIUS,
  GAS_GIANT_RING_OPACITY,
  GAS_GIANT_RING_OUTER_RADIUS,
  GAS_GIANT_RING_TILT,
  HEMI_LIGHT_GROUND_COLOR,
  HEMI_LIGHT_INTENSITY,
  HEMI_LIGHT_SKY_COLOR,
  KEY_LIGHT_COLOR,
  KEY_LIGHT_INTENSITY,
  KEY_LIGHT_OFFSET,
  KEY_LIGHT_SHADOW_EXTENT,
  LOUNGER_COLOR,
  LOUNGER_LENGTH,
  LOUNGER_WIDTH,
  POOL_RIM_COLOR,
  POOL_WATER_COLOR,
  RESORT_LAYOUT_SEED,
  SHADOW_MAP_SIZE,
  SIGN_PANEL_COLOR,
  SIGN_PANEL_HEIGHT,
  SIGN_PANEL_WIDTH,
  SIGN_POST_COLOR,
  SIGN_POST_HEIGHT,
  SKY_GROUND_COLOR,
  SKY_HORIZON_COLOR,
  SKY_RADIUS,
  SKY_TOP_COLOR,
  UMBRELLA_CANOPY_HEIGHT,
  UMBRELLA_POLE_COLOR,
  UMBRELLA_POLE_HEIGHT,
  UMBRELLA_POLE_RADIUS,
} from './config.js'
import { platformLayout } from './logic/arena.js'
import { resortLayout } from './logic/resortLayout.js'

// A tileable composite-deck plank texture: a few planks side by side
// (each a touch lighter/darker than the next) with thin seams between
// them and a staggered butt-joint seam partway down each one, so it
// reads as boards laid end to end rather than one flat color. It repeats
// across the platform's top (ARENA_DECK_PLANK_WIDTH/LENGTH keep each
// plank a sensible real-world size) rather than being drawn once at full
// resolution, which a single canvas can't hold crisply at ARENA_RADIUS's
// scale.
function createDeckPlankTexture() {
  const planksAcross = 6
  const tileSize = 512
  const plankPixels = tileSize / planksAcross
  const canvas = document.createElement('canvas')
  canvas.width = tileSize
  canvas.height = tileSize
  const ctx = canvas.getContext('2d')

  const base = new THREE.Color(ARENA_DECK_PLANK_COLOR)
  for (let i = 0; i < planksAcross; i++) {
    const shade = base.clone().multiplyScalar(0.94 + ((i * 37) % 11) / 100)
    ctx.fillStyle = `#${shade.getHexString()}`
    ctx.fillRect(i * plankPixels, 0, plankPixels, tileSize)

    // A butt-joint seam partway down this plank, staggered per column so
    // the repeating tile doesn't read as one continuous strip per plank.
    const jointY = (((i * 53) % 7) / 7) * tileSize
    ctx.strokeStyle = ARENA_DECK_SEAM_COLOR
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(i * plankPixels, jointY)
    ctx.lineTo((i + 1) * plankPixels, jointY)
    ctx.stroke()
  }

  ctx.strokeStyle = ARENA_DECK_SEAM_COLOR
  ctx.lineWidth = 3
  for (let i = 1; i < planksAcross; i++) {
    ctx.beginPath()
    ctx.moveTo(i * plankPixels, 0)
    ctx.lineTo(i * plankPixels, tileSize)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  // CylinderGeometry's cap UV is a flat x/z projection spanning the
  // platform's full bounding square (diameter x diameter), so the repeat
  // count needed to hold the texture's real-world size is just that
  // diameter divided by the tile's own world size.
  const diameter = ARENA_RADIUS * 2
  texture.repeat.set(diameter / (ARENA_DECK_PLANK_WIDTH * planksAcross), diameter / ARENA_DECK_PLANK_LENGTH)
  // The texture spans the whole platform and is viewed at a grazing
  // angle, so mipmaps + anisotropic filtering (clamped by three to what
  // the GPU supports) keep the planks crisp instead of smeared.
  texture.anisotropy = 16
  texture.needsUpdate = true
  return texture
}

// A vertical gradient (deep sky blue at the zenith -> a pale haze near
// the horizon -> warm sand further down) for the daylight sky dome,
// read top (y=+radius) to bottom (y=-radius).
function createSkyTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, SKY_TOP_COLOR)
  gradient.addColorStop(0.7, SKY_HORIZON_COLOR)
  gradient.addColorStop(1, SKY_GROUND_COLOR)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// A big inverted sphere wrapped in the daylight gradient, far outside
// everything else so nothing clips through it.
function createSkyDome() {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 16)
  const material = new THREE.MeshBasicMaterial({
    map: createSkyTexture(),
    side: THREE.BackSide,
    fog: false,
  })
  return new THREE.Mesh(geometry, material)
}

// A big peachy gas giant with a translucent ring, standing in on the
// horizon -- see config.js's GAS_GIANT_* comment for where it's placed
// and why. A touch of emissive keeps its unlit side from reading as a
// flat black silhouette against the sky.
function createGasGiant() {
  const group = new THREE.Group()
  group.position.set(GAS_GIANT_POSITION.x, GAS_GIANT_POSITION.y, GAS_GIANT_POSITION.z)

  const planetMaterial = new THREE.MeshStandardMaterial({
    color: GAS_GIANT_COLOR,
    roughness: 0.9,
    metalness: 0,
    emissive: new THREE.Color(GAS_GIANT_COLOR),
    emissiveIntensity: GAS_GIANT_EMISSIVE_INTENSITY,
    fog: false,
  })
  const planet = new THREE.Mesh(new THREE.SphereGeometry(GAS_GIANT_RADIUS, 48, 32), planetMaterial)
  group.add(planet)

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: GAS_GIANT_RING_COLOR,
    transparent: true,
    opacity: GAS_GIANT_RING_OPACITY,
    side: THREE.DoubleSide,
    fog: false,
  })
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(GAS_GIANT_RING_INNER_RADIUS, GAS_GIANT_RING_OUTER_RADIUS, 64),
    ringMaterial,
  )
  ring.rotation.x = GAS_GIANT_RING_TILT
  group.add(ring)

  return group
}

// Builds the platform itself: a thick disc (a light, slightly metallic
// hull on the sides/underside; the composite-plank deck texture on top),
// a teal border band and a white pinstripe painted as flat rings just
// inside the top edge, and a tapered underside so it reads as a solid
// floating sundeck.
function createPlatform() {
  const group = new THREE.Group()
  const topRadius = ARENA_RADIUS
  const bottomRadius = ARENA_RADIUS * 0.7
  // Keeps the disc's top surface flush with y = 0, the ground plane
  // every character/pod/particle stands on, instead of the disc's own
  // vertical center sitting there (which used to bury everything
  // standing on y = 0 by half the disc's thickness).
  const { discCenterY, topY } = platformLayout(ARENA_THICKNESS)

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: ARENA_HULL_COLOR,
    metalness: 0.35,
    roughness: 0.45,
  })
  const deckMaterial = new THREE.MeshStandardMaterial({
    map: createDeckPlankTexture(),
    roughness: 0.7,
    metalness: 0,
  })

  // CylinderGeometry groups its faces [side, top cap, bottom cap], in
  // that order, so an array of three materials gives each its own look.
  const discGeometry = new THREE.CylinderGeometry(topRadius, bottomRadius, ARENA_THICKNESS, 64)
  const disc = new THREE.Mesh(discGeometry, [hullMaterial, deckMaterial, hullMaterial])
  disc.position.y = discCenterY
  disc.receiveShadow = true
  group.add(disc)

  // A small y offset above the deck's own top surface keeps these flat
  // rings from z-fighting with it.
  const bandY = topY + 0.01

  const borderGeometry = new THREE.RingGeometry(topRadius - ARENA_DECK_BORDER_WIDTH, topRadius, 64)
  const borderMaterial = new THREE.MeshStandardMaterial({ color: ARENA_DECK_BORDER_COLOR, roughness: 0.6 })
  const border = new THREE.Mesh(borderGeometry, borderMaterial)
  border.rotation.x = -Math.PI / 2
  border.position.y = bandY
  border.receiveShadow = true
  group.add(border)

  const pinstripeOuter = topRadius - ARENA_DECK_PINSTRIPE_INSET
  const pinstripeGeometry = new THREE.RingGeometry(pinstripeOuter - ARENA_DECK_PINSTRIPE_WIDTH, pinstripeOuter, 64)
  const pinstripeMaterial = new THREE.MeshStandardMaterial({ color: ARENA_DECK_PINSTRIPE_COLOR, roughness: 0.6 })
  const pinstripe = new THREE.Mesh(pinstripeGeometry, pinstripeMaterial)
  pinstripe.rotation.x = -Math.PI / 2
  pinstripe.position.y = bandY
  pinstripe.receiveShadow = true
  group.add(pinstripe)

  const taperGeometry = new THREE.CylinderGeometry(bottomRadius, bottomRadius * 0.15, ARENA_THICKNESS * 1.6, 48)
  const taper = new THREE.Mesh(taperGeometry, hullMaterial)
  taper.position.y = discCenterY - ARENA_THICKNESS * 1.3
  group.add(taper)

  return { group }
}

// Shallow recessed ellipses of glossy water with a white rim -- walkable
// (no obstacle), but logic/resortLayout.js's isInPool lets other game
// logic tell when the player or a falling monster lands in one.
function createPools(pools, topY) {
  const group = new THREE.Group()
  const waterMaterial = new THREE.MeshStandardMaterial({ color: POOL_WATER_COLOR, roughness: 0.05, metalness: 0.1 })
  const rimMaterial = new THREE.MeshStandardMaterial({ color: POOL_RIM_COLOR, roughness: 0.5 })

  for (const pool of pools) {
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 32), waterMaterial)
    water.scale.set(pool.rx, pool.rz, 1)
    water.rotation.x = -Math.PI / 2
    water.position.set(pool.x, topY - 0.08, pool.z)
    water.receiveShadow = true
    group.add(water)

    const rim = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 32), rimMaterial)
    rim.scale.set(pool.rx, pool.rz, 1)
    rim.rotation.x = -Math.PI / 2
    rim.position.set(pool.x, topY - 0.01, pool.z)
    rim.receiveShadow = true
    group.add(rim)
  }

  return group
}

// Beach umbrellas: a thin pole and an open (no base cap) cone canopy in
// whichever color logic/resortLayout.js rolled for that umbrella.
function createUmbrellas(umbrellas, topY) {
  const group = new THREE.Group()
  const poleMaterial = new THREE.MeshStandardMaterial({ color: UMBRELLA_POLE_COLOR, metalness: 0.4, roughness: 0.4 })

  for (const umbrella of umbrellas) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(UMBRELLA_POLE_RADIUS, UMBRELLA_POLE_RADIUS, UMBRELLA_POLE_HEIGHT, 8),
      poleMaterial,
    )
    pole.position.set(umbrella.x, topY + UMBRELLA_POLE_HEIGHT / 2, umbrella.z)
    pole.castShadow = true
    group.add(pole)

    const canopyMaterial = new THREE.MeshStandardMaterial({ color: umbrella.color, roughness: 0.5, side: THREE.DoubleSide })
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(umbrella.radius * 0.9, UMBRELLA_CANOPY_HEIGHT, 12, 1, true),
      canopyMaterial,
    )
    canopy.position.set(umbrella.x, topY + UMBRELLA_POLE_HEIGHT, umbrella.z)
    canopy.castShadow = true
    group.add(canopy)
  }

  return group
}

// Loungers: a flat slatted seat plus a raised, reclined back.
function createLoungers(loungers, topY) {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: LOUNGER_COLOR, roughness: 0.6 })

  for (const lounger of loungers) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(LOUNGER_WIDTH, 0.08, LOUNGER_LENGTH), material)
    seat.position.set(lounger.x, topY + 0.14, lounger.z)
    seat.rotation.y = lounger.rotation
    seat.castShadow = true
    seat.receiveShadow = true
    group.add(seat)

    const backOffset = LOUNGER_LENGTH / 2 - 0.1
    const back = new THREE.Mesh(new THREE.BoxGeometry(LOUNGER_WIDTH, 0.5, 0.08), material)
    back.position.set(
      lounger.x - Math.sin(lounger.rotation) * backOffset,
      topY + 0.35,
      lounger.z - Math.cos(lounger.rotation) * backOffset,
    )
    back.rotation.y = lounger.rotation
    back.rotation.x = -0.3 // reclined, rather than standing bolt upright
    back.castShadow = true
    group.add(back)
  }

  return group
}

// Word-wraps `text` onto as few lines as fit within `maxWidth` (at the
// 2d context's current font), rather than letting a long sign overrun
// its panel.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

// A small resort sign panel: white lettering, word-wrapped, on the
// panel's own teal background.
function createSignTexture(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 220
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = new THREE.Color(SIGN_PANEL_COLOR).getStyle()
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lines = wrapLines(ctx, text, canvas.width - 48)
  const lineHeight = 56
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, startY + i * lineHeight))

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Small resort signs: a post with a lettered panel on top.
function createSigns(signs, topY) {
  const group = new THREE.Group()
  const postMaterial = new THREE.MeshStandardMaterial({ color: SIGN_POST_COLOR, metalness: 0.3, roughness: 0.4 })

  for (const sign of signs) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, SIGN_POST_HEIGHT, 8), postMaterial)
    post.position.set(sign.x, topY + SIGN_POST_HEIGHT / 2, sign.z)
    post.castShadow = true
    group.add(post)

    const panelMaterial = new THREE.MeshStandardMaterial({
      map: createSignTexture(sign.text),
      roughness: 0.6,
      side: THREE.DoubleSide,
    })
    const panel = new THREE.Mesh(new THREE.BoxGeometry(SIGN_PANEL_WIDTH, SIGN_PANEL_HEIGHT, 0.06), panelMaterial)
    panel.position.set(sign.x, topY + SIGN_POST_HEIGHT - SIGN_PANEL_HEIGHT / 2, sign.z)
    panel.castShadow = true
    group.add(panel)
  }

  return group
}

// Builds every prop (pools, umbrellas, loungers, signs) from `layout`
// (src/logic/resortLayout.js's pure data) into one group.
function createProps(layout, topY) {
  const group = new THREE.Group()
  group.add(createPools(layout.pools, topY))
  group.add(createUmbrellas(layout.umbrellas, topY))
  group.add(createLoungers(layout.loungers, topY))
  group.add(createSigns(layout.signs, topY))
  return group
}

// Builds the arena: a Three.js group (platform + sundeck props + sky +
// gas giant + lighting) ready to add to the scene, fog, the pool zones
// (walkable; exposed so other game logic can name kills that land in
// one), and the non-pool props as circular obstacles (umbrellas/
// loungers/signs; static for the whole game, so the caller folds them
// into its own obstacle list once).
export function createArena() {
  const group = new THREE.Group()

  const hemiLight = new THREE.HemisphereLight(HEMI_LIGHT_SKY_COLOR, HEMI_LIGHT_GROUND_COLOR, HEMI_LIGHT_INTENSITY)
  group.add(hemiLight)

  // The shadow frustum is a small, fixed size (KEY_LIGHT_SHADOW_EXTENT)
  // rather than scaled to ARENA_RADIUS, so it stays crisp on a big
  // arena; updateArena re-centers both the light and its target on the
  // player every frame (at the same KEY_LIGHT_OFFSET this sets them at
  // initially) so that fixed frustum still covers wherever play is
  // actually happening.
  const keyLight = new THREE.DirectionalLight(KEY_LIGHT_COLOR, KEY_LIGHT_INTENSITY)
  keyLight.position.set(KEY_LIGHT_OFFSET.x, KEY_LIGHT_OFFSET.y, KEY_LIGHT_OFFSET.z)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
  keyLight.shadow.camera.left = -KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.right = KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.top = KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.bottom = -KEY_LIGHT_SHADOW_EXTENT
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 60
  group.add(keyLight)
  group.add(keyLight.target) // needs to be in the graph for its moving position to take effect

  const { group: platformGroup } = createPlatform()
  group.add(platformGroup)

  const { topY } = platformLayout(ARENA_THICKNESS)
  const layout = resortLayout({ radius: ARENA_RADIUS, seed: RESORT_LAYOUT_SEED })
  group.add(createProps(layout, topY))
  const propObstacles = [...layout.umbrellas, ...layout.loungers, ...layout.signs]

  group.add(createSkyDome())
  group.add(createGasGiant())

  const fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR)

  return { group, fog, backgroundColor: FOG_COLOR, keyLight, pools: layout.pools, propObstacles }
}

// Builds scene.environment: a PMREM-baked reflection map from a small
// offscreen scene holding the sky gradient dome plus a bright warm "sun"
// panel, so physically lit materials (metalness/roughness) have
// something plausible to reflect instead of flat black. arena.js has no
// renderer of its own to build this with, so main.js calls it once at
// startup and hands over the renderer; the PMREMGenerator is disposed
// right after baking, per three's own fromScene usage.
export function createEnvironmentMap(renderer) {
  const envScene = new THREE.Scene()
  const dome = createSkyDome()
  envScene.add(dome)

  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff6e0 })
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), sunMaterial)
  sun.position.set(KEY_LIGHT_OFFSET.x * 8, KEY_LIGHT_OFFSET.y * 8, KEY_LIGHT_OFFSET.z * 8)
  sun.lookAt(0, 0, 0)
  envScene.add(sun)

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  // near/far wide enough to fit the sky dome (SKY_RADIUS) without
  // clipping it out of the bake.
  const renderTarget = pmremGenerator.fromScene(envScene, 0, 0.1, SKY_RADIUS + 50)
  pmremGenerator.dispose()

  dome.geometry.dispose()
  dome.material.map.dispose()
  dome.material.dispose()
  sun.geometry.dispose()
  sunMaterial.dispose()

  return renderTarget.texture
}

// The shadow map's world-space texel size (the frustum spans 2x the
// extent, over SHADOW_MAP_SIZE texels along that span) -- snapping the
// light/target's position to a multiple of this before moving them
// stops the shadow from shimmering as the light continuously follows
// the player (each texel samples the same world point every frame,
// instead of the sampled points sliding by a fraction of a texel).
const SHADOW_TEXEL_SIZE = (KEY_LIGHT_SHADOW_EXTENT * 2) / SHADOW_MAP_SIZE

function snapToTexel(value) {
  return Math.round(value / SHADOW_TEXEL_SIZE) * SHADOW_TEXEL_SIZE
}

// Given the player's current position, re-centers the key light and its
// shadow target on the player (snapped to the shadow map's texel grid,
// so the shadow doesn't shimmer), so its small fixed shadow frustum
// (KEY_LIGHT_SHADOW_EXTENT) stays over wherever play actually is on a
// big arena.
export function updateArena(arena, playerPos) {
  if (playerPos) {
    const snappedX = snapToTexel(playerPos.x)
    const snappedZ = snapToTexel(playerPos.z)
    arena.keyLight.target.position.set(snappedX, 0, snappedZ)
    arena.keyLight.position.set(snappedX + KEY_LIGHT_OFFSET.x, KEY_LIGHT_OFFSET.y, snappedZ + KEY_LIGHT_OFFSET.z)
  }
}
