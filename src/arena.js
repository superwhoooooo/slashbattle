import * as THREE from 'three'
import {
  ARENA_GRID_COLOR,
  ARENA_GRID_PULSE_SPEED,
  ARENA_RADIUS,
  ARENA_RIM_COLOR,
  ARENA_RIM_THICKNESS,
  ARENA_THICKNESS,
  ARENA_THRUSTER_COLOR,
  ARENA_THRUSTER_COUNT,
  ARENA_THRUSTER_LIGHT_DISTANCE,
  ARENA_THRUSTER_LIGHT_INTENSITY,
  ARENA_THRUSTER_PULSE_AMOUNT,
  ARENA_THRUSTER_PULSE_SPEED,
  ARENA_TOP_COLOR,
  ARENA_UNDERSIDE_COLOR,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  HEMI_LIGHT_GROUND_COLOR,
  HEMI_LIGHT_INTENSITY,
  HEMI_LIGHT_SKY_COLOR,
  KEY_LIGHT_COLOR,
  KEY_LIGHT_INTENSITY,
  PYLON_COLORS,
  PYLON_COUNT,
  PYLON_LIGHT_DISTANCE,
  PYLON_LIGHT_INTENSITY,
  PYLON_PULSE_AMOUNT,
  PYLON_PULSE_SPEED_A,
  PYLON_PULSE_SPEED_B,
  SHADOW_MAP_SIZE,
  SKY_RADIUS,
  STARFIELD_COUNT,
  STARFIELD_RADIUS,
} from './config.js'

// Draws a neon grid (concentric rings + radial spokes) for the platform's
// top surface, used as an emissive map so it glows against the dark
// metal base color. A CanvasTexture rather than a custom shader, per the
// "a CanvasTexture with emissive lines is fine" note.
function createGridTexture() {
  const size = 512
  const center = size / 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = ARENA_GRID_COLOR
  ctx.lineWidth = 2
  for (let r = size / 12; r < center; r += size / 12) {
    ctx.beginPath()
    ctx.arc(center, center, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  const spokes = 16
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.lineTo(center + Math.cos(angle) * center, center + Math.sin(angle) * center)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// A vertical gradient (deep indigo -> purple -> near-black) for the
// nebula sky dome, read top (y=+radius) to bottom (y=-radius).
function createSkyTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#140a2e')
  gradient.addColorStop(0.45, '#2a1458')
  gradient.addColorStop(1, '#050208')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// A big inverted sphere wrapped in the nebula gradient, far outside the
// starfield so nothing clips through it.
function createSkyDome() {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 16)
  const material = new THREE.MeshBasicMaterial({
    map: createSkyTexture(),
    side: THREE.BackSide,
    fog: false,
  })
  return new THREE.Mesh(geometry, material)
}

// A few thousand points scattered over a shell around the arena.
function createStarfield() {
  const positions = new Float32Array(STARFIELD_COUNT * 3)
  for (let i = 0; i < STARFIELD_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = STARFIELD_RADIUS * (0.85 + Math.random() * 0.15)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, fog: false })
  return new THREE.Points(geometry, material)
}

// Builds the platform itself: a thick disc (dark metallic sides/underside,
// glowing grid on top), a glowing rim ring at the top edge, a tapered
// underside, and a ring of pulsing thruster lights -- enough underside
// detail that it reads as floating. Returns the group plus the top
// material (for the grid pulse) and the thruster light/phase list (for
// their pulse).
function createPlatform() {
  const group = new THREE.Group()
  const topRadius = ARENA_RADIUS
  const bottomRadius = ARENA_RADIUS * 0.7

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: ARENA_UNDERSIDE_COLOR,
    metalness: 0.8,
    roughness: 0.4,
  })
  const topMaterial = new THREE.MeshStandardMaterial({
    color: ARENA_TOP_COLOR,
    metalness: 0.7,
    roughness: 0.35,
    emissive: new THREE.Color(ARENA_GRID_COLOR),
    emissiveMap: createGridTexture(),
    emissiveIntensity: 0.8,
  })
  const bottomMaterial = new THREE.MeshStandardMaterial({
    color: ARENA_UNDERSIDE_COLOR,
    metalness: 0.8,
    roughness: 0.5,
  })

  // CylinderGeometry groups its faces [side, top cap, bottom cap], in
  // that order, so an array of three materials gives each its own look.
  const discGeometry = new THREE.CylinderGeometry(topRadius, bottomRadius, ARENA_THICKNESS, 64)
  const disc = new THREE.Mesh(discGeometry, [sideMaterial, topMaterial, bottomMaterial])
  disc.receiveShadow = true
  group.add(disc)

  const rimGeometry = new THREE.TorusGeometry(topRadius, ARENA_RIM_THICKNESS / 2, 12, 64)
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: ARENA_RIM_COLOR,
    emissive: new THREE.Color(ARENA_RIM_COLOR),
    emissiveIntensity: 1.5,
    metalness: 0.3,
    roughness: 0.2,
  })
  const rim = new THREE.Mesh(rimGeometry, rimMaterial)
  rim.rotation.x = Math.PI / 2
  rim.position.y = ARENA_THICKNESS / 2
  group.add(rim)

  const taperGeometry = new THREE.CylinderGeometry(bottomRadius, bottomRadius * 0.15, ARENA_THICKNESS * 1.6, 48)
  const taper = new THREE.Mesh(taperGeometry, bottomMaterial)
  taper.position.y = -ARENA_THICKNESS * 1.3
  group.add(taper)

  const thrusters = []
  for (let i = 0; i < ARENA_THRUSTER_COUNT; i++) {
    const angle = (i / ARENA_THRUSTER_COUNT) * Math.PI * 2
    const radius = bottomRadius * 0.5
    const y = -ARENA_THICKNESS * 2.1

    const glowMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.6, 12),
      new THREE.MeshStandardMaterial({
        color: ARENA_THRUSTER_COLOR,
        emissive: new THREE.Color(ARENA_THRUSTER_COLOR),
        emissiveIntensity: 2,
      }),
    )
    glowMesh.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
    glowMesh.rotation.x = Math.PI // tip pointing down
    group.add(glowMesh)

    const light = new THREE.PointLight(
      ARENA_THRUSTER_COLOR,
      ARENA_THRUSTER_LIGHT_INTENSITY,
      ARENA_THRUSTER_LIGHT_DISTANCE,
    )
    light.position.copy(glowMesh.position)
    group.add(light)

    thrusters.push({ light, phase: i * 1.3 + Math.random() })
  }

  return { group, topMaterial, thrusters }
}

// Builds a ring of neon light pylons standing on the platform near its
// rim: a dark post, a glowing cap, and a matching PointLight. Returns the
// group plus the pylon list (light/cap material/phase) for pulsing.
function createPylons() {
  const group = new THREE.Group()
  const pylons = []
  const radius = ARENA_RADIUS * 0.85

  for (let i = 0; i < PYLON_COUNT; i++) {
    const angle = (i / PYLON_COUNT) * Math.PI * 2
    const color = PYLON_COLORS[i % PYLON_COLORS.length]
    const postX = Math.sin(angle) * radius
    const postZ = Math.cos(angle) * radius

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.6, roughness: 0.4 }),
    )
    post.position.set(postX, ARENA_THICKNESS / 2 + 1.1, postZ)
    post.castShadow = true
    group.add(post)

    const capMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 2,
    })
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), capMaterial)
    cap.position.set(postX, post.position.y + 1.2, postZ)
    group.add(cap)

    const light = new THREE.PointLight(color, PYLON_LIGHT_INTENSITY, PYLON_LIGHT_DISTANCE)
    light.position.copy(cap.position)
    group.add(light)

    pylons.push({ light, capMaterial, phase: i * 1.1 + Math.random() })
  }

  return { group, pylons }
}

// Builds the arena: a Three.js group (platform + pylons + starfield + sky
// + lighting) ready to add to the scene, fog, and the animated bits
// (pylons, thrusters, the grid's pulsing material) that updateArena
// drives every frame.
export function createArena() {
  const group = new THREE.Group()

  const hemiLight = new THREE.HemisphereLight(HEMI_LIGHT_SKY_COLOR, HEMI_LIGHT_GROUND_COLOR, HEMI_LIGHT_INTENSITY)
  group.add(hemiLight)

  const keyLight = new THREE.DirectionalLight(KEY_LIGHT_COLOR, KEY_LIGHT_INTENSITY)
  keyLight.position.set(12, 22, 10)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
  keyLight.shadow.camera.left = -ARENA_RADIUS * 1.2
  keyLight.shadow.camera.right = ARENA_RADIUS * 1.2
  keyLight.shadow.camera.top = ARENA_RADIUS * 1.2
  keyLight.shadow.camera.bottom = -ARENA_RADIUS * 1.2
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 60
  group.add(keyLight)
  // keyLight.target stays at its default (0, 0, 0), which is the
  // platform's center, so it doesn't need to be added to the graph.

  const { group: platformGroup, topMaterial, thrusters } = createPlatform()
  group.add(platformGroup)

  const { group: pylonGroup, pylons } = createPylons()
  group.add(pylonGroup)

  group.add(createStarfield())
  group.add(createSkyDome())

  const fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR)

  return { group, fog, backgroundColor: FOG_COLOR, topMaterial, pylons, thrusters }
}

// Gives each pylon's light/cap and each thruster's light a gentle neon
// pulse (a sum of two sines at different speeds, offset by a random
// per-light phase so they don't pulse in sync), and slowly pulses the
// platform's grid glow.
export function updateArena(arena, elapsedSeconds) {
  for (const pylon of arena.pylons) {
    const t = elapsedSeconds + pylon.phase
    const noise = Math.sin(t * PYLON_PULSE_SPEED_A) * 0.6 + Math.sin(t * PYLON_PULSE_SPEED_B) * 0.4
    pylon.light.intensity = PYLON_LIGHT_INTENSITY * (1 + noise * PYLON_PULSE_AMOUNT)
    pylon.capMaterial.emissiveIntensity = 2 * (1 + noise * PYLON_PULSE_AMOUNT)
  }

  for (const thruster of arena.thrusters) {
    const t = elapsedSeconds + thruster.phase
    const noise = Math.sin(t * ARENA_THRUSTER_PULSE_SPEED)
    thruster.light.intensity = ARENA_THRUSTER_LIGHT_INTENSITY * (1 + noise * ARENA_THRUSTER_PULSE_AMOUNT)
  }

  arena.topMaterial.emissiveIntensity = 0.8 + Math.sin(elapsedSeconds * ARENA_GRID_PULSE_SPEED) * 0.3
}
