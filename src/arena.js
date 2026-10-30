import * as THREE from 'three'
import {
  ARENA_GRID_COLOR,
  ARENA_GRID_PULSE_SPEED,
  ARENA_GRID_RING_SPACING,
  ARENA_RADIUS,
  ARENA_RIM_COLOR,
  ARENA_RIM_THICKNESS,
  ARENA_THICKNESS,
  ARENA_THRUSTER_COLOR,
  ARENA_THRUSTER_COUNT,
  ARENA_THRUSTER_EMISSIVE_INTENSITY,
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
  KEY_LIGHT_OFFSET,
  KEY_LIGHT_SHADOW_EXTENT,
  PYLON_CAP_EMISSIVE_INTENSITY,
  PYLON_COLORS,
  PYLON_COUNT,
  PYLON_LIGHT_DISTANCE,
  PYLON_LIGHT_INTENSITY,
  PYLON_PULSE_AMOUNT,
  PYLON_PULSE_SPEED_A,
  PYLON_PULSE_SPEED_B,
  SHADOW_MAP_SIZE,
  SKY_RADIUS,
  STARFIELD_COLOR,
  STARFIELD_COUNT,
  STARFIELD_OPACITY,
  STARFIELD_RADIUS,
  MOTE_AREA,
  MOTE_COLOR,
  MOTE_COUNT,
  NEBULA_BLOB_COUNT,
  NEBULA_TEXTURE_HEIGHT,
  NEBULA_TEXTURE_WIDTH,
  ROCK_COUNT,
  ROCK_MAX_ORBIT,
  ROCK_MIN_ORBIT,
} from './config.js'
import { platformLayout } from './logic/arena.js'

// Draws a neon grid (concentric rings + radial spokes) for the platform's
// top surface, used as an emissive map so it glows against the dark
// metal base color. A CanvasTexture rather than a custom shader, per the
// "a CanvasTexture with emissive lines is fine" note.
function createGridTexture() {
  const size = 2048
  const center = size / 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = ARENA_GRID_COLOR
  // Ring count scales with ARENA_RADIUS (rather than a fixed count) so
  // each ring stays ARENA_GRID_RING_SPACING world units apart however
  // big the platform is -- the texture always maps onto the platform's
  // full radius, so a fixed ring count would stretch the cells. Every
  // fourth ring is a brighter, thicker "major" line, and the rest are
  // dimmer, so the floor reads as a graduated grid instead of a flat mesh.
  const ringCount = Math.max(1, Math.round(ARENA_RADIUS / ARENA_GRID_RING_SPACING))
  for (let i = 1; i <= ringCount; i++) {
    const major = i % 4 === 0 || i === ringCount
    ctx.globalAlpha = major ? 1 : 0.5
    ctx.lineWidth = major ? 10 : 4
    ctx.beginPath()
    ctx.arc(center, center, (i / ringCount) * center, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 16 major spokes, with fainter minor ones between them in the outer
  // half (they'd bunch into a blur near the center).
  for (const [spokes, alpha, width, from] of [[16, 0.7, 6, 0], [64, 0.22, 3, 0.45]]) {
    ctx.globalAlpha = alpha
    ctx.lineWidth = width
    for (let i = 0; i < spokes; i++) {
      if (spokes === 64 && i % 4 === 0) continue
      const angle = (i / spokes) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(center + Math.cos(angle) * center * from, center + Math.sin(angle) * center * from)
      ctx.lineTo(center + Math.cos(angle) * center, center + Math.sin(angle) * center)
      ctx.stroke()
    }
  }

  // A bold emblem ring at the very center, where the player spawns.
  ctx.globalAlpha = 1
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(center, center, center * 0.05, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  // The texture spans the whole platform and is viewed at a grazing
  // angle, so mipmaps + anisotropic filtering (clamped by three to what
  // the GPU supports) keep the grid lines crisp instead of smeared.
  texture.anisotropy = 16
  texture.needsUpdate = true
  return texture
}

// The nebula sky dome's texture: a deep indigo-to-black vertical
// gradient with soft, additively blended clouds of magenta, cyan and
// violet painted over it (equirectangular, so it wraps around the dome:
// each cloud is also drawn one texture-width to either side so there's no
// seam). Clouds stay in a band away from the poles, where the sphere's UVs
// pinch them.
function createSkyTexture() {
  const width = NEBULA_TEXTURE_WIDTH
  const height = NEBULA_TEXTURE_HEIGHT
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#0d0720')
  gradient.addColorStop(0.45, '#1c0e3c')
  gradient.addColorStop(1, '#030104')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const palette = [
    [150, 60, 255],
    [255, 43, 214],
    [25, 231, 255],
    [70, 90, 255],
  ]
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < NEBULA_BLOB_COUNT; i++) {
    const [r, g, b] = palette[Math.floor(Math.random() * palette.length)]
    const x = Math.random() * width
    const y = height * (0.22 + Math.random() * 0.56)
    const radius = 40 + Math.random() * 150
    const alpha = 0.035 + Math.random() * 0.08
    for (const dx of [-width, 0, width]) {
      const cloud = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, radius)
      cloud.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`)
      cloud.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      ctx.fillStyle = cloud
      ctx.fillRect(x + dx - radius, y - radius, radius * 2, radius * 2)
    }
  }
  ctx.globalCompositeOperation = 'source-over'

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
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

// A few thousand points scattered over a shell around the arena, tinted
// white / cool blue / warm pink so the sky isn't a flat sheet of grey
// dots, plus a sparse second layer of larger, brighter stars.
function createStarLayer(count, size, opacity) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const tints = [new THREE.Color(0xffffff), new THREE.Color(0xa8c8ff), new THREE.Color(0xffc2e8)]
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = STARFIELD_RADIUS * (0.85 + Math.random() * 0.15)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.cos(phi)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    const tint = tints[Math.floor(Math.random() * tints.length)]
    const brightness = 0.55 + Math.random() * 0.45
    colors[i * 3] = tint.r * brightness
    colors[i * 3 + 1] = tint.g * brightness
    colors[i * 3 + 2] = tint.b * brightness
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({
    color: STARFIELD_COLOR,
    size,
    fog: false,
    transparent: true,
    opacity,
    vertexColors: true,
  })
  return new THREE.Points(geometry, material)
}

function createStarfield() {
  const group = new THREE.Group()
  group.add(createStarLayer(STARFIELD_COUNT, 1.2, STARFIELD_OPACITY))
  group.add(createStarLayer(Math.round(STARFIELD_COUNT / 14), 2.6, 0.95))
  return group
}

// Dark, faceted space rocks orbiting far out around the platform, slowly
// circling and tumbling -- cheap parallax that gives the void some depth.
// One InstancedMesh; updateRocks rewrites the (few) instance matrices.
function createRocks() {
  const geometry = new THREE.DodecahedronGeometry(1, 0)
  const material = new THREE.MeshStandardMaterial({
    color: 0x2b2342,
    emissive: 0x1a0f33,
    emissiveIntensity: 0.6,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.1,
  })
  const mesh = new THREE.InstancedMesh(geometry, material, ROCK_COUNT)
  mesh.frustumCulled = false
  const rocks = []
  for (let i = 0; i < ROCK_COUNT; i++) {
    rocks.push({
      orbit: ROCK_MIN_ORBIT + Math.random() * (ROCK_MAX_ORBIT - ROCK_MIN_ORBIT),
      angle: Math.random() * Math.PI * 2,
      speed: (0.006 + Math.random() * 0.02) * (Math.random() < 0.5 ? -1 : 1),
      y: -30 + Math.random() * 55,
      scale: 1.5 + Math.random() * Math.random() * 9,
      stretch: 0.6 + Math.random() * 0.8,
      spin: { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 },
      tilt: { x: Math.random() * 6, y: Math.random() * 6 },
    })
  }
  return { mesh, rocks }
}

const scratchMatrix = new THREE.Matrix4()
const scratchQuaternion = new THREE.Quaternion()
const scratchEuler = new THREE.Euler()
const scratchPosition = new THREE.Vector3()
const scratchScale = new THREE.Vector3()

function updateRocks(rockSystem, dt, elapsedSeconds) {
  rockSystem.rocks.forEach((rock, i) => {
    rock.angle += rock.speed * dt
    scratchPosition.set(Math.sin(rock.angle) * rock.orbit, rock.y + Math.sin(elapsedSeconds * 0.3 + i) * 0.8, Math.cos(rock.angle) * rock.orbit)
    scratchEuler.set(rock.tilt.x + elapsedSeconds * rock.spin.x, rock.tilt.y + elapsedSeconds * rock.spin.y, 0)
    scratchQuaternion.setFromEuler(scratchEuler)
    scratchScale.set(rock.scale, rock.scale * rock.stretch, rock.scale)
    scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)
    rockSystem.mesh.setMatrixAt(i, scratchMatrix)
  })
  rockSystem.mesh.instanceMatrix.needsUpdate = true
}

// Glowing motes hovering and drifting upward around the player, wrapping
// within a box centered on them so there are always some nearby (they
// catch the bloom and make the air feel alive).
function createMotes() {
  const local = new Float32Array(MOTE_COUNT * 3)
  for (let i = 0; i < MOTE_COUNT; i++) {
    local[i * 3] = (Math.random() - 0.5) * MOTE_AREA
    local[i * 3 + 1] = Math.random() * 14
    local[i * 3 + 2] = (Math.random() - 0.5) * MOTE_AREA
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTE_COUNT * 3), 3))
  const material = new THREE.PointsMaterial({
    color: MOTE_COLOR,
    size: 0.16,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, local }
}

function wrap(value, size) {
  return ((((value + size / 2) % size) + size) % size) - size / 2
}

function updateMotes(moteSystem, dt, elapsedSeconds, centerX, centerZ) {
  const { local, points } = moteSystem
  const positions = points.geometry.attributes.position.array
  for (let i = 0; i < MOTE_COUNT; i++) {
    local[i * 3 + 1] += (0.25 + (i % 5) * 0.08) * dt
    if (local[i * 3 + 1] > 14) local[i * 3 + 1] = 0
    const sway = Math.sin(elapsedSeconds * 0.6 + i) * 0.4
    // Wrapping relative to the player's position (not just the box)
    // keeps motes around them as they move.
    const x = wrap(local[i * 3] - centerX, MOTE_AREA) + centerX
    const z = wrap(local[i * 3 + 2] - centerZ, MOTE_AREA) + centerZ
    positions[i * 3] = x + sway
    positions[i * 3 + 1] = local[i * 3 + 1]
    positions[i * 3 + 2] = z + sway * 0.6
  }
  points.geometry.attributes.position.needsUpdate = true
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
  // Keeps the disc's top surface flush with y = 0, the ground plane
  // every character/pod/particle stands on, instead of the disc's own
  // vertical center sitting there (which used to bury everything
  // standing on y = 0 by half the disc's thickness).
  const { discCenterY } = platformLayout(ARENA_THICKNESS)

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
    emissiveIntensity: 0.35,
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
  disc.position.y = discCenterY
  disc.receiveShadow = true
  group.add(disc)

  const rimGeometry = new THREE.TorusGeometry(topRadius, ARENA_RIM_THICKNESS / 2, 12, 64)
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: ARENA_RIM_COLOR,
    emissive: new THREE.Color(ARENA_RIM_COLOR),
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.2,
  })
  const rim = new THREE.Mesh(rimGeometry, rimMaterial)
  rim.rotation.x = Math.PI / 2
  rim.position.y = discCenterY + ARENA_THICKNESS / 2
  group.add(rim)

  // A wider, faint additive twin of the rim so it blooms into a soft halo
  // (the same glow trick the jelly edges and sword use).
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(topRadius, ARENA_RIM_THICKNESS * 1.5, 8, 96),
    new THREE.MeshBasicMaterial({
      color: ARENA_RIM_COLOR,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  halo.rotation.x = Math.PI / 2
  halo.position.y = rim.position.y
  group.add(halo)

  const taperGeometry = new THREE.CylinderGeometry(bottomRadius, bottomRadius * 0.15, ARENA_THICKNESS * 1.6, 48)
  const taper = new THREE.Mesh(taperGeometry, bottomMaterial)
  taper.position.y = discCenterY - ARENA_THICKNESS * 1.3
  group.add(taper)

  const thrusters = []
  for (let i = 0; i < ARENA_THRUSTER_COUNT; i++) {
    const angle = (i / ARENA_THRUSTER_COUNT) * Math.PI * 2
    const radius = bottomRadius * 0.5
    const y = discCenterY - ARENA_THICKNESS * 2.1

    const glowMaterial = new THREE.MeshStandardMaterial({
      color: ARENA_THRUSTER_COLOR,
      emissive: new THREE.Color(ARENA_THRUSTER_COLOR),
      emissiveIntensity: ARENA_THRUSTER_EMISSIVE_INTENSITY,
    })
    const glowMesh = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, 12), glowMaterial)
    glowMesh.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
    glowMesh.rotation.x = Math.PI // tip pointing down
    group.add(glowMesh)

    // No PointLight here anymore -- just the dimmed glow mesh itself, as
    // part of the overall brightness cut (a ring of lights under the
    // platform added up fast).
    thrusters.push({ glowMaterial, phase: i * 1.3 + Math.random() })
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
  const { topY } = platformLayout(ARENA_THICKNESS)

  for (let i = 0; i < PYLON_COUNT; i++) {
    const angle = (i / PYLON_COUNT) * Math.PI * 2
    const color = PYLON_COLORS[i % PYLON_COLORS.length]
    const postX = Math.sin(angle) * radius
    const postZ = Math.cos(angle) * radius

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.6, roughness: 0.4 }),
    )
    post.position.set(postX, topY + 1.1, postZ)
    post.castShadow = true
    group.add(post)

    const capMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: PYLON_CAP_EMISSIVE_INTENSITY,
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
  // A small bias (and a normal offset) keeps the flat-shaded faceted bodies
  // from shadowing themselves in stripes ("shadow acne").
  keyLight.shadow.bias = -0.0004
  keyLight.shadow.normalBias = 0.03
  group.add(keyLight)
  group.add(keyLight.target) // needs to be in the graph for its moving position to take effect

  const { group: platformGroup, topMaterial, thrusters } = createPlatform()
  group.add(platformGroup)

  const { group: pylonGroup, pylons } = createPylons()
  group.add(pylonGroup)

  group.add(createStarfield())
  group.add(createSkyDome())

  const rockSystem = createRocks()
  group.add(rockSystem.mesh)
  const moteSystem = createMotes()
  group.add(moteSystem.points)

  const fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR)

  return { group, fog, backgroundColor: FOG_COLOR, topMaterial, pylons, thrusters, keyLight, rockSystem, moteSystem, lastElapsed: 0 }
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

// Gives each pylon's light/cap and each thruster's light a gentle neon
// pulse (a sum of two sines at different speeds, offset by a random
// per-light phase so they don't pulse in sync), slowly pulses the
// platform's grid glow, and -- given the player's current position --
// re-centers the key light and its shadow target on the player (snapped
// to the shadow map's texel grid, so the shadow doesn't shimmer), so
// its small fixed shadow frustum (KEY_LIGHT_SHADOW_EXTENT) stays over
// wherever play actually is on a big arena.
export function updateArena(arena, elapsedSeconds, playerPos) {
  const dt = Math.min(Math.max(elapsedSeconds - arena.lastElapsed, 0), 0.1)
  arena.lastElapsed = elapsedSeconds
  updateRocks(arena.rockSystem, dt, elapsedSeconds)
  updateMotes(arena.moteSystem, dt, elapsedSeconds, playerPos?.x ?? 0, playerPos?.z ?? 0)

  for (const pylon of arena.pylons) {
    const t = elapsedSeconds + pylon.phase
    const noise = Math.sin(t * PYLON_PULSE_SPEED_A) * 0.6 + Math.sin(t * PYLON_PULSE_SPEED_B) * 0.4
    pylon.light.intensity = PYLON_LIGHT_INTENSITY * (1 + noise * PYLON_PULSE_AMOUNT)
    pylon.capMaterial.emissiveIntensity = PYLON_CAP_EMISSIVE_INTENSITY * (1 + noise * PYLON_PULSE_AMOUNT)
  }

  for (const thruster of arena.thrusters) {
    const t = elapsedSeconds + thruster.phase
    const noise = Math.sin(t * ARENA_THRUSTER_PULSE_SPEED)
    thruster.glowMaterial.emissiveIntensity = ARENA_THRUSTER_EMISSIVE_INTENSITY * (1 + noise * ARENA_THRUSTER_PULSE_AMOUNT)
  }

  arena.topMaterial.emissiveIntensity = 0.35 + Math.sin(elapsedSeconds * ARENA_GRID_PULSE_SPEED) * 0.1

  if (playerPos) {
    const snappedX = snapToTexel(playerPos.x)
    const snappedZ = snapToTexel(playerPos.z)
    arena.keyLight.target.position.set(snappedX, 0, snappedZ)
    arena.keyLight.position.set(snappedX + KEY_LIGHT_OFFSET.x, KEY_LIGHT_OFFSET.y, snappedZ + KEY_LIGHT_OFFSET.z)
  }
}
