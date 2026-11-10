import * as THREE from 'three'
import {
  FACE_SCALE_BY_TYPE,
  JELLY_CLEARCOAT,
  JELLY_CLEARCOAT_ROUGHNESS,
  JELLY_EMISSIVE_INTENSITY,
  JELLY_METALNESS,
  JELLY_ROUGHNESS,
  JELLY_SHEEN,
  JELLY_SHEEN_COLOR,
  MONSTER_TYPES,
  PLAYER_BODY_RADIUS,
  PLAYER_EDGE_COLOR,
  SWORD_BLADE_COLOR,
  SWORD_GLOW_SCALE,
  SWORD_HILT_COLOR,
} from './config.js'
import { createFace3D } from './face3d.js'
import { createJellyBody } from './jelly.js'
import { useCreatures } from './graphicsStyle.js'
import { beastGeometry, beastLook, createBeastAnimator, createBeastMaterial, hasBeast } from './beasts.js'
import { PLAYER_FACE, pickFaceOptions } from './logic/faceOptions.js'
import { WEAPONS, weaponBase } from './logic/items.js'
import { applyWeaponPose } from './weaponAnim.js'
import { buildFancyWeapon } from './weaponModels.js'
import {
  CONE_HEIGHT_FACTOR,
  CONE_RADIUS_FACTOR,
  CYLINDER_RADIUS_FACTOR,
  bodySurfaceDistance,
} from './logic/faceLayout.js'

const PLAYER_BODY_COLOR = 0xff7a5c

const BLADE_LENGTH = 0.8

// A glowing energy sword: a bright emissive blade core plus a slightly
// larger, additive "glow" twin of the same shape (the same trick the
// jelly bodies use for their neon edges) so it blooms, on a dark metal
// hilt (grip + crossguard). Grouped so later milestones can animate the
// whole swing as one object; a `tip` child marks the blade's far end in
// local space, for the swing trail to read as a world position each
// frame. Attached directly to the body group (not the face anchor), so
// it stays rigid and doesn't pulse with the jelly bulge/hit state.
function createSword() {
  const group = new THREE.Group()

  const bladeGeometry = new THREE.BoxGeometry(0.05, BLADE_LENGTH, 0.025)
  const blade = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshStandardMaterial({
      color: SWORD_BLADE_COLOR,
      emissive: new THREE.Color(SWORD_BLADE_COLOR),
      emissiveIntensity: 0.85,
      metalness: 0.2,
      roughness: 0.2,
    }),
  )
  blade.position.y = BLADE_LENGTH / 2
  group.add(blade)

  const glow = new THREE.Mesh(
    bladeGeometry,
    new THREE.MeshBasicMaterial({
      color: SWORD_BLADE_COLOR,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  glow.position.y = blade.position.y
  glow.scale.set(SWORD_GLOW_SCALE, 1, SWORD_GLOW_SCALE)
  group.add(glow)

  const hiltMaterial = new THREE.MeshStandardMaterial({ color: SWORD_HILT_COLOR, metalness: 0.7, roughness: 0.4 })

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), hiltMaterial)
  group.add(crossguard)

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.22, 8), hiltMaterial)
  grip.position.y = -0.14
  group.add(grip)

  const tip = new THREE.Object3D()
  tip.position.y = BLADE_LENGTH
  group.add(tip)

  group.userData.tip = tip
  return group
}

const WEAPON_TINTS = { trident: 0x4de0ff, cleaver: 0xff5a5a, mace: 0xffd23f, glaive: 0x8aa8ff }
const WEAPON_COLORS = {
  dagger: 0xffa94d, spear: 0x7cffb0, hammer: 0xff4fa3, scythe: 0xb48cff,
  katana: 0x4de0ff, axe: 0xff7a45, rapier: 0xf5f07a, flail: 0xff6fe0, chainsaw: 0xffd23f, boomstick: 0x8cff6f,
  staff: 0xb48cff, pistol: 0xffe14a, shotgun: 0xff8ad8, smg: 0x66f0ff, railgun: 0x7cffb0, launcher: 0xff8a3a,
  whip: 0xff5fa8, nunchucks: 0x5affc4, crossbow: 0xc9ff5a, flamer: 0xff6a2a, blaster: 0xd96bff,
}

function glowMaterial(color, intensity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    metalness: 0.2,
    roughness: 0.25,
  })
}

// A weapon-sized glowing part: an emissive box plus (optionally) an
// additive glow twin, the same trick the sword blade uses.
function glowBox(width, height, depth, color, y, { glow = true, x = 0, rotationZ = 0 } = {}) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const part = new THREE.Group()
  const core = new THREE.Mesh(geometry, glowMaterial(color))
  part.add(core)
  if (glow) {
    const twin = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    twin.scale.set(SWORD_GLOW_SCALE, 1.05, SWORD_GLOW_SCALE)
    part.add(twin)
  }
  part.position.set(x, y, 0)
  part.rotation.z = rotationZ
  return part
}

function darkPole(length, radius, y) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 8),
    new THREE.MeshStandardMaterial({ color: SWORD_HILT_COLOR, metalness: 0.7, roughness: 0.4 }),
  )
  mesh.position.y = y
  return mesh
}

// Builds the hotbar weapon `id` as a group whose origin is the grip and
// whose +y runs toward the business end, with a `tip` child at the far
// end for the swing trail -- the same contract the original sword had, so
// the swing animation (rotation.z) drives any of them.
// The same model, for the item icons (src/icons.js).
export function createWeaponModel(id) {
  return createWeaponMesh(id)
}

function createWeaponMesh(id) {
  const group = buildWeaponMesh(id)
  applyWeaponPose(group, id, null)
  return group
}

function buildWeaponMesh(requestedId) {
  // New weapons reuse an older one's model, retinted with their own bullet / glow color.
  const id = weaponBase(requestedId)
  const tint = WEAPON_TINTS[requestedId] ?? (requestedId !== id ? WEAPONS[requestedId]?.bullet?.color : undefined)
  const fancy = buildFancyWeapon(id, id === 'sword' ? SWORD_BLADE_COLOR : tint ?? WEAPON_COLORS[id])
  if (fancy) return fancy
  if (id === 'sword') return createSword()
  const group = new THREE.Group()
  const color = tint ?? WEAPON_COLORS[id]
  let tipY
  let customTip = null // weapons with moving parts carry their own tip

  if (id === 'dagger') {
    group.add(glowBox(0.045, 0.45, 0.02, color, 0.22))
    group.add(glowBox(0.18, 0.05, 0.05, color, 0, { glow: false }))
    group.add(darkPole(0.16, 0.03, -0.1))
    tipY = 0.45
  } else if (id === 'spear') {
    group.add(darkPole(1.4, 0.025, 0.45))
    group.add(glowBox(0.1, 0.34, 0.03, color, 1.28))
    group.add(glowBox(0.05, 0.12, 0.03, color, 1.1, { glow: false, rotationZ: 0 }))
    tipY = 1.45
  } else if (id === 'hammer') {
    group.add(darkPole(0.95, 0.04, 0.4))
    group.add(glowBox(0.5, 0.32, 0.34, color, 0.95))
    tipY = 1.12
  } else if (id === 'staff') {
    // A wizard staff: a dark shaft topped with a glowing orb in a small cradle.
    group.add(darkPole(1.25, 0.03, 0.5))
    group.add(glowBox(0.2, 0.04, 0.2, color, 1.08, { glow: false }))
    const orbGeometry = new THREE.SphereGeometry(0.15, 16, 12)
    const orb = new THREE.Mesh(orbGeometry, glowMaterial(color, 1.4))
    const aura = new THREE.Mesh(
      orbGeometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    aura.scale.setScalar(1.7)
    orb.position.y = 1.25
    aura.position.y = 1.25
    group.add(orb, aura)
    tipY = 1.25
  } else if (id === 'katana') {
    group.add(glowBox(0.05, 0.95, 0.02, color, 0.55))
    group.add(glowBox(0.2, 0.05, 0.06, color, 0.05, { glow: false }))
    group.add(darkPole(0.2, 0.03, -0.1))
    tipY = 1.02
  } else if (id === 'axe') {
    group.add(darkPole(1.0, 0.04, 0.4))
    group.add(glowBox(0.45, 0.4, 0.05, color, 0.85, { x: 0.2 }))
    tipY = 1.0
  } else if (id === 'rapier') {
    group.add(glowBox(0.025, 1.3, 0.02, color, 0.7))
    group.add(glowBox(0.22, 0.04, 0.22, color, 0.08, { glow: false }))
    group.add(darkPole(0.16, 0.025, -0.08))
    tipY = 1.35
  } else if (id === 'flail') {
    // A handle with a chain and spiked ball that really swings on its pivot,
    // trailing behind as the flail whirls.
    group.add(darkPole(0.7, 0.035, 0.3))
    const pivot = new THREE.Group()
    pivot.position.y = 0.65
    pivot.add(glowBox(0.04, 0.5, 0.04, color, 0.27, { glow: false }))
    pivot.add(glowBox(0.34, 0.34, 0.34, color, 0.62))
    pivot.add(glowBox(0.2, 0.2, 0.2, color, 0.62, { glow: false, rotationZ: Math.PI / 4 }))
    customTip = new THREE.Object3D()
    customTip.position.y = 0.62
    pivot.add(customTip)
    group.add(pivot)
    group.userData.flex = (t) => {
      pivot.rotation.z = t === null ? 0.5 : 1.0 * Math.sin(Math.min(1, t / 0.2) * Math.PI / 2) * (1 - 0.6 * Math.max(0, (t - 0.8) / 0.2))
    }
  } else if (id === 'chainsaw') {
    group.add(darkPole(0.3, 0.07, 0.05))
    group.add(glowBox(0.12, 0.8, 0.04, color, 0.6))
    tipY = 1.0
  } else if (id === 'boomstick') {
    group.add(darkPole(0.7, 0.05, 0.3))
    group.add(glowBox(0.22, 0.5, 0.22, color, 0.85))
    tipY = 1.15
  } else if (id === 'whip') {
    // A handle and a chain of linked segments: a wave runs down them, so it
    // coils back and then snaps out straight with a crack.
    group.add(darkPole(0.3, 0.04, 0.05))
    const segments = []
    let parent = group
    const SEGMENT = 0.23
    for (let i = 0; i < 13; i++) {
      const segment = new THREE.Group()
      segment.position.y = i === 0 ? 0.2 : SEGMENT
      segment.add(glowBox(0.04 * (1 - i * 0.045), SEGMENT, 0.04 * (1 - i * 0.045), color, SEGMENT / 2, { glow: i % 2 === 0 }))
      parent.add(segment)
      segments.push(segment)
      parent = segment
    }
    customTip = new THREE.Object3D()
    customTip.position.y = SEGMENT
    parent.add(customTip)
    group.userData.flex = (t) => {
      segments.forEach((segment, i) => {
        if (t === null) segment.rotation.z = 0.04
        else {
          const amp = t < 0.5 ? 0.32 : 0.55 * (1 - Math.min(1, (t - 0.5) * 1.6))
          segment.rotation.z = amp * Math.sin(i * 0.7 - t * 18)
        }
      })
    }
  } else if (id === 'nunchucks') {
    // Two sticks on a chain: the second really whips around the joint.
    group.add(darkPole(0.5, 0.04, 0.1))
    group.add(glowBox(0.09, 0.14, 0.09, color, 0.34))
    group.add(glowBox(0.03, 0.06, 0.03, color, 0.42, { glow: false }))
    group.add(glowBox(0.03, 0.06, 0.03, color, 0.47, { glow: false, rotationZ: Math.PI / 2 }))
    const joint = new THREE.Group()
    joint.position.y = 0.5
    joint.add(darkPole(0.5, 0.04, 0.28))
    joint.add(glowBox(0.09, 0.14, 0.09, color, 0.18))
    customTip = new THREE.Object3D()
    customTip.position.y = 0.54
    joint.add(customTip)
    group.add(joint)
    group.userData.flex = (t) => {
      if (t === null) joint.rotation.set(0.15, 0, 0.35)
      else joint.rotation.set(1.3 * Math.sin(t * Math.PI * 5), 0, 1.2 * Math.cos(t * Math.PI * 5) + 0.3)
    }
  } else if (WEAPONS[id].gun) {
    // Firearms: a dark grip and body with a glowing barrel pointing along +y
    // (the player's forward once the sword's pose is applied).
    const long = id === 'railgun' || id === 'shotgun' || id === 'crossbow' || id === 'flamer'
    group.add(darkPole(0.3, 0.05, 0))
    group.add(glowBox(0.14, long ? 0.8 : 0.45, 0.14, color, long ? 0.5 : 0.35))
    if (id === 'launcher') group.add(glowBox(0.3, 0.3, 0.3, color, 0.75))
    if (id === 'smg') group.add(glowBox(0.08, 0.3, 0.08, color, 0.05, { glow: false, x: 0.12 }))
    tipY = long ? 0.95 : id === 'launcher' ? 0.95 : 0.6
  } else {
    // scythe: a long pole with a crescent blade swept off its top
    group.add(darkPole(1.3, 0.03, 0.45))
    group.add(glowBox(0.55, 0.07, 0.03, color, 1.15, { x: 0.25, rotationZ: -0.25 }))
    group.add(glowBox(0.3, 0.07, 0.03, color, 1.0, { x: 0.58, rotationZ: -0.95 }))
    tipY = 1.0
  }

  if (customTip) {
    group.userData.tip = customTip
    return group
  }

  const tip = new THREE.Object3D()
  tip.position.y = tipY
  if (id === 'scythe') tip.position.x = 0.7
  group.add(tip)
  group.userData.tip = tip
  return group
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => material.dispose())
    }
  })
}

// Swaps the weapon the player is holding (hotbar selection) for weapon
// `id`, keeping it at the same spot on the body. The previous model is
// disposed.
export function setPlayerWeapon(playerMesh, id) {
  const old = playerMesh.userData.sword
  const next = createWeaponMesh(id)
  if (old) {
    playerMesh.remove(old)
    disposeObject(old)
  }
  playerMesh.add(next)
  playerMesh.userData.sword = next
}

const INDICATOR_SIZE = 0.4

// Draws a single bold glyph ("!" or "?") onto a small canvas for use as a
// sprite texture.
function createIndicatorTexture(glyph) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 64, 64)
  ctx.font = 'bold 48px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = '#000000'
  ctx.strokeText(glyph, 32, 34)
  ctx.fillStyle = '#fff200'
  ctx.fillText(glyph, 32, 34)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace // canvas colors are sRGB, not linear
  texture.needsUpdate = true
  return texture
}

function createIndicatorSprite(glyph) {
  const material = new THREE.SpriteMaterial({
    map: createIndicatorTexture(glyph),
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(INDICATOR_SIZE, INDICATOR_SIZE, 1)
  sprite.visible = false
  return sprite
}

// Flat-shaded, faceted jelly material: a saturated pastel base color, a
// little metalness/roughness, a glossy clearcoat layer (like a candy
// shell) with a soft sheen highlight at grazing angles, and no emissive
// tint, so the body reads as a glossy colored shape rather than glowing.
// Remembers its own baseline emissive color (material.userData.baseEmissive)
// so the hit-flash animation (player.js, combat.js) can fade back to it
// instead of to black.
function createJellyMaterial(color) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    flatShading: true,
    metalness: JELLY_METALNESS,
    roughness: JELLY_ROUGHNESS,
    clearcoat: JELLY_CLEARCOAT,
    clearcoatRoughness: JELLY_CLEARCOAT_ROUGHNESS,
    sheen: JELLY_SHEEN,
    sheenColor: new THREE.Color(JELLY_SHEEN_COLOR),
    emissive: new THREE.Color(color),
    emissiveIntensity: JELLY_EMISSIVE_INTENSITY,
  })
  material.userData.baseEmissive = material.emissive.clone()
  return material
}

function createPlayerGeometry() {
  return new THREE.IcosahedronGeometry(PLAYER_BODY_RADIUS, 1)
}

function createBlobboGeometry(size) {
  return new THREE.DodecahedronGeometry(size / 2)
}

function createZippyGeometry(size) {
  const geometry = new THREE.OctahedronGeometry(size / 2)
  geometry.scale(1, 1.3, 1) // small, slightly stretched tall
  return geometry
}

function createGrumpusGeometry(size) {
  // A few segments per side (not a bare 8-vertex box), so there are
  // interior vertices for the jelly deformation to actually jiggle.
  return new THREE.BoxGeometry(size * 0.7, size, size * 0.7, 3, 3, 3)
}

// The bosses' extra shapes (their proportions live in faceLayout.js so
// the face math matches). The sphere/cylinder/cone have enough segments
// for the jelly deformation to have vertices to jiggle; the tetrahedron
// is left at detail 0 (any subdivision would round it into a sphere), so
// only its four corners wobble.
function createSphereGeometry(size) {
  return new THREE.IcosahedronGeometry(size / 2, 1)
}

function createTetrahedronGeometry(size) {
  return new THREE.TetrahedronGeometry(size / 2)
}

function createCylinderGeometry(size) {
  return new THREE.CylinderGeometry(size * CYLINDER_RADIUS_FACTOR, size * CYLINDER_RADIUS_FACTOR, size, 14, 4)
}

function createConeGeometry(size) {
  return new THREE.ConeGeometry(size * CONE_RADIUS_FACTOR, size * CONE_HEIGHT_FACTOR, 14, 4)
}

const GEOMETRY_BUILDERS = {
  dodecahedron: createBlobboGeometry,
  octahedron: createZippyGeometry,
  box: createGrumpusGeometry,
  sphere: createSphereGeometry,
  tetrahedron: createTetrahedronGeometry,
  cylinder: createCylinderGeometry,
  cone: createConeGeometry,
}

// The body's resting center height so its lowest point touches the
// ground (y = 0, the platform's top surface per platformLayout).
// size/2 is correct for the dodecahedron/box (symmetric top-to-bottom),
// but zippy's octahedron is stretched 1.3x vertically (see
// createZippyGeometry), so centering it at size/2 used to leave its
// lower, stretched tip poking 0.15 * size below the ground; reusing
// faceLayout's own bodySurfaceDistance (straight down) gives the exact
// height instead (size * 0.65), so this stays correct if the stretch
// ever changes.
function monsterBodyCenterY(stats, geometry) {
  if (stats.shape === 'octahedron') return bodySurfaceDistance(stats.shape, stats.size, 0, -1, 0)
  // The bosses' extra shapes aren't symmetric top-to-bottom (a tetrahedron
  // or cone), so read the exact lowest point off the geometry itself.
  if (!['dodecahedron', 'box'].includes(stats.shape)) {
    geometry.computeBoundingBox()
    return -geometry.boundingBox.min.y
  }
  return stats.size / 2
}

// Builds the player's body: a faceted, flat-shaded icosahedron jelly body
// with glowing neon edges, the goofy preset face built from 3D geometry
// (googly eyes, buck teeth, rosy cheeks) attached so it rides the
// jelly's deformation, and a sword held at the side as a rigid child
// group.
export function createPlayerMesh() {
  const geometry = createPlayerGeometry()
  const material = createJellyMaterial(PLAYER_BODY_COLOR)
  // The player's candy shell is a touch darker and less glossy so it stops glaring.
  material.color.multiplyScalar(0.8)
  material.sheen = 0.1
  material.clearcoat = 0.5
  material.envMapIntensity = 0.55
  const group = createJellyBody(geometry, material, PLAYER_EDGE_COLOR, PLAYER_BODY_RADIUS)

  const { body } = group.userData.jelly
  body.castShadow = true

  const face = createFace3D({
    shape: 'icosahedron',
    size: PLAYER_BODY_RADIUS,
    bodyCenterY: PLAYER_BODY_RADIUS,
    bodyColor: PLAYER_BODY_COLOR,
    options: PLAYER_FACE,
  })
  group.add(face.group)
  group.userData.face3d = face

  const sword = createWeaponMesh('staff')
  group.add(sword)

  group.userData.body = body
  group.userData.sword = sword

  return group
}

// Builds one monster of `type` (a key of MONSTER_TYPES) as a faceted,
// flat-shaded jelly body in its own shape with glowing neon edges, a
// randomly generated goofy 3D face (googly eyes, a mouth shape, and
// maybe a unibrow/tongue/rosy cheeks/freckles) attached so it rides the
// jelly's deformation, and a pair of small "!"/"?" indicator sprites
// above its head that the AI milestone flashes briefly on entering chase
// or search. rng is injectable (default Math.random) so the face can be
// seeded deterministically in tests.
// A jelly-ish solid colour for the add-on bits (limbs, mirror frame).
function accessoryMaterial(color, roughness = 0.5, metalness = 0.1) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

// The hopper's arms and legs: stubby limbs poking out of the sides of its body. The arms
// are returned so main.js can raise them while it leaps.
function addLimbs(group, stats) {
  const s = stats.size
  const limbColor = new THREE.Color(stats.color).multiplyScalar(0.85)
  const mat = accessoryMaterial(limbColor)
  const handMat = accessoryMaterial(new THREE.Color(stats.color).lerp(new THREE.Color(0xffffff), 0.25))
  const limbs = new THREE.Group()
  const arms = []
  for (const side of [-1, 1]) {
    // Arm: a pivot at the shoulder, a capsule-ish cylinder angled outward and down, a round hand.
    const pivot = new THREE.Group()
    pivot.position.set(side * s * 0.5, s * 0.62, 0)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.07, s * 0.06, s * 0.5, 10), mat)
    arm.position.y = -s * 0.25
    const hand = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 12, 8), handMat)
    hand.position.y = -s * 0.52
    pivot.add(arm, hand)
    pivot.rotation.z = side * 0.55
    limbs.add(pivot)
    arms.push({ pivot, side })

    // Leg: from the lower side of the body down to a flat foot on the ground.
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.09, s * 0.075, s * 0.42, 10), mat)
    leg.position.set(side * s * 0.3, s * 0.2, s * 0.05)
    const foot = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.07, s * 0.3), handMat)
    foot.position.set(side * s * 0.3, s * 0.035, s * 0.12)
    limbs.add(leg, foot)
  }
  for (const m of limbs.children) m.castShadow = true
  group.add(limbs)
  group.userData.arms = arms
}

// The mirror enemy's mirror: a tall oval of polished glass in a metal frame, held out in
// front of its face (+z is forward). Anything that hits this side bounces.
function addMirror(group, stats, bodyCenterY) {
  const s = stats.size
  const mirror = new THREE.Group()
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 10, 36), accessoryMaterial(0xd9b24a, 0.3, 0.9))
  frame.scale.set(s * 0.46, s * 0.62, s * 0.46)
  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(1, 36),
    new THREE.MeshStandardMaterial({ color: 0xf2f9ff, roughness: 0.04, metalness: 1, emissive: 0x6c8fb4, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
  )
  glass.scale.set(s * 0.46, s * 0.62, 1)
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.05, s * 0.05, s * 0.5, 8), accessoryMaterial(0xd9b24a, 0.3, 0.9))
  handle.position.y = -s * 0.8
  // A glint streak across the glass.
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.1, s * 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }))
  glint.position.set(-s * 0.15, s * 0.05, 0.01)
  glint.rotation.z = 0.35
  // Cracks: one more spreads across the glass for every hit the shield takes (see setMirrorCracks).
  const hits = stats.reflect?.hits ?? 4
  const crackMat = new THREE.MeshBasicMaterial({ color: 0x1b2a3d, side: THREE.DoubleSide })
  const cracks = []
  for (let i = 0; i < hits; i++) {
    const angle = (i / hits) * Math.PI * 2 + 0.5
    const crack = new THREE.Group()
    const len = s * (0.3 + 0.08 * (i % 3))
    const main = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.025, len), crackMat)
    main.position.y = len / 2
    const branch = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.018, len * 0.5), crackMat)
    branch.position.set(s * 0.05, len * 0.65, 0)
    branch.rotation.z = -0.7
    crack.add(main, branch)
    crack.rotation.z = angle
    crack.position.set(Math.cos(angle + 1.1) * s * 0.06, Math.sin(angle + 1.1) * s * 0.08, 0.02)
    crack.visible = false
    mirror.add(crack)
    cracks.push(crack)
  }
  mirror.add(frame, glass, handle, glint)
  mirror.position.set(0, Math.max(s * 0.7, bodyCenterY + s * 0.25), s * 0.82)
  mirror.children.forEach((m) => { m.castShadow = true })
  group.add(mirror)
  group.userData.mirror = mirror
  // fraction 0..1 of the shield worn away; a broken shield loses its glass (and glint) entirely.
  group.userData.setMirrorCracks = (fraction, broken) => {
    cracks.forEach((c, i) => { c.visible = !broken && i < Math.round(fraction * hits) })
    glass.visible = !broken
    glint.visible = !broken
    glass.material.emissiveIntensity = 0.35 * (1 - 0.6 * fraction)
  }
}

// The angler's glowing lure: a curved stalk over its head ending in a bright bulb.
function addLure(group, stats) {
  const s = stats.size
  const stalk = new THREE.Mesh(new THREE.TorusGeometry(s * 0.35, s * 0.03, 6, 14, Math.PI * 0.9), accessoryMaterial(0x1a1f4a))
  stalk.position.set(0, s * 0.7, s * 0.05)
  stalk.rotation.y = Math.PI / 2
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(s * 0.14, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xfff1a8, emissive: 0xffe066, emissiveIntensity: 1.6 }),
  )
  bulb.position.set(0, s * 0.72, s * 0.42)
  const glow = new THREE.Mesh(new THREE.SphereGeometry(s * 0.34, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }))
  glow.position.copy(bulb.position)
  group.add(stalk, bulb, glow)
}

// The eel's long body: the jelly sphere is its head (face forward, +z) and a chain of tapering
// segments trails out behind it, each hung off the one before so main.js's swishEelTail can ripple
// an S-wave down the whole length. A frilly fin runs along the back and flares into a tail fin;
// a pale belly stripe and two side fins finish it off.
function addEelBody(group, stats, bodyCenterY) {
  const s = stats.size
  const bodyMat = accessoryMaterial(new THREE.Color(stats.color).multiplyScalar(0.8), 0.35, 0.15)
  const bellyMat = accessoryMaterial(new THREE.Color(stats.color).lerp(new THREE.Color(0xffffff), 0.55), 0.4)
  const finMat = new THREE.MeshStandardMaterial({ color: stats.edgeColor, roughness: 0.4, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  const SEGMENTS = 8
  const segLen = s * 0.42
  const segment = new THREE.SphereGeometry(1, 14, 10)
  const pivots = []
  let parent = new THREE.Group()
  parent.position.set(0, bodyCenterY - s * 0.05, -s * 0.3)
  group.add(parent)
  for (let i = 0; i < SEGMENTS; i++) {
    const pivot = new THREE.Group()
    if (i > 0) pivot.position.z = -segLen
    const taper = 1 - i / (SEGMENTS + 1)
    const r = s * 0.34 * taper
    const body = new THREE.Mesh(segment, bodyMat)
    body.scale.set(r, r * 0.95, segLen * 0.75)
    body.position.z = -segLen * 0.5
    const belly = new THREE.Mesh(segment, bellyMat)
    belly.scale.set(r * 0.8, r * 0.45, segLen * 0.7)
    belly.position.set(0, -r * 0.5, -segLen * 0.5)
    const fin = new THREE.Mesh(new THREE.PlaneGeometry(segLen * 1.05, s * 0.2 * taper + s * 0.04), finMat)
    fin.rotation.y = Math.PI / 2
    fin.position.set(0, r + s * 0.06 * taper, -segLen * 0.5)
    pivot.add(body, belly, fin)
    for (const m of [body, belly]) m.castShadow = true
    parent.add(pivot)
    pivots.push(pivot)
    parent = pivot
  }
  // Tail fin: a flat diamond at the very end.
  const tailFin = new THREE.Mesh(new THREE.CircleGeometry(s * 0.32, 4), finMat)
  tailFin.rotation.y = Math.PI / 2
  tailFin.scale.set(1.3, 0.8, 1)
  tailFin.position.z = -segLen * 1.1
  parent.add(tailFin)
  // Little side fins just behind the head.
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.CircleGeometry(s * 0.16, 3), finMat)
    pec.position.set(side * s * 0.36, bodyCenterY - s * 0.15, -s * 0.25)
    pec.rotation.set(-Math.PI / 2, 0, side * 0.6)
    group.add(pec)
  }
  group.userData.eelTail = pivots
}

// The urchin's spikes: cones poking out all round the body.
function addSpikes(group, stats, bodyCenterY) {
  const s = stats.size
  const mat = accessoryMaterial(0x2a1250, 0.4)
  for (let i = 0; i < 18; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 18)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))
    const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.07, s * 0.4, 6), mat)
    spike.position.copy(dir).multiplyScalar(s * 0.62).add(new THREE.Vector3(0, bodyCenterY, 0))
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    group.add(spike)
  }
}

// ---- the crazy enemies' add-ons (logic/crazyEnemies.js). Each returns nothing and may set
// group.userData.animateAcc(time), which main.js calls every frame. ----

// Bumblo: two buzzing wings on its back.
function addWings(group, stats, y) {
  const s = stats.size
  const mat = new THREE.MeshStandardMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.7, roughness: 0.2, side: THREE.DoubleSide })
  const wings = []
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(side * s * 0.25, y + s * 0.45, -s * 0.2)
    const wing = new THREE.Mesh(new THREE.SphereGeometry(s * 0.5, 14, 8).scale(1, 0.12, 0.5), mat)
    wing.position.x = side * s * 0.5
    pivot.add(wing)
    group.add(pivot)
    wings.push({ pivot, side })
  }
  // A black-and-gold stripe round the middle.
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(s * 0.56, s * 0.05, 6, 20), accessoryMaterial(0x2a1f10))
  stripe.rotation.x = Math.PI / 2
  stripe.position.y = y
  group.add(stripe)
  group.userData.animateAcc = (t) => {
    for (const { pivot, side } of wings) pivot.rotation.z = side * (0.35 + Math.sin(t * 38 + (side > 0 ? 0 : 0.4)) * 0.45)
  }
}

// Snapper: two big pincers out front that snap open and shut.
function addClaws(group, stats, y) {
  const s = stats.size
  const mat = accessoryMaterial(new THREE.Color(stats.color).multiplyScalar(0.9), 0.4)
  const claws = []
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * s * 0.55, y - s * 0.1, s * 0.4)
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.08, s * 0.08, s * 0.45, 8), mat)
    upper.rotation.x = Math.PI / 2
    upper.position.z = s * 0.2
    const jaws = []
    for (const j of [-1, 1]) {
      const jaw = new THREE.Mesh(new THREE.ConeGeometry(s * 0.14, s * 0.5, 6), mat)
      jaw.rotation.x = Math.PI / 2
      jaw.position.set(0, j * s * 0.05, s * 0.6)
      jaws.push({ jaw, j })
      arm.add(jaw)
    }
    arm.add(upper)
    group.add(arm)
    claws.push({ jaws, side })
  }
  group.userData.animateAcc = (t) => {
    for (const { jaws, side } of claws) for (const { jaw, j } of jaws) jaw.position.y = j * s * (0.05 + (Math.sin(t * 6 + side) * 0.5 + 0.5) * 0.07)
  }
}

// Sporeling: a big spotted mushroom cap perched on top.
function addCap(group, stats, y) {
  const s = stats.size
  const cap = new THREE.Mesh(new THREE.SphereGeometry(s * 0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.7, 1), accessoryMaterial(0xff4d6d, 0.45))
  cap.position.y = y + s * 0.55
  group.add(cap)
  const spotMat = accessoryMaterial(0xfff4e0, 0.6)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const spot = new THREE.Mesh(new THREE.SphereGeometry(s * 0.09, 8, 6), spotMat)
    spot.position.set(Math.cos(a) * s * 0.42, y + s * 0.55 + s * 0.3, Math.sin(a) * s * 0.42)
    spot.scale.y = 0.5
    group.add(spot)
  }
}

// Boogle: a glowing halo that bobs over its head.
function addHalo(group, stats, y) {
  const s = stats.size
  const halo = new THREE.Mesh(new THREE.TorusGeometry(s * 0.36, s * 0.04, 8, 24), glowMaterial(0xfff1a8, 1.8))
  halo.rotation.x = Math.PI / 2
  group.add(halo)
  group.userData.animateAcc = (t) => {
    halo.position.y = y + s * 0.85 + Math.sin(t * 2.5) * s * 0.06
    halo.rotation.z = t * 1.5
  }
}

// Kablooma: a lit fuse on top that sputters.
function addFuse(group, stats, y) {
  const s = stats.size
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.04, s * 0.05, s * 0.3, 6), accessoryMaterial(0x6a5236))
  wick.position.y = y + s * 0.62
  const spark = new THREE.Mesh(new THREE.IcosahedronGeometry(s * 0.12, 0), glowMaterial(0xffa23a, 2))
  spark.position.y = y + s * 0.85
  group.add(wick, spark)
  group.userData.animateAcc = (t) => {
    spark.scale.setScalar(0.8 + Math.abs(Math.sin(t * 18)) * 0.7)
    spark.position.x = Math.sin(t * 25) * s * 0.03
  }
}

// Icicle: sharp ice crystals all round the body.
function addIcicles(group, stats, y) {
  const s = stats.size
  const mat = new THREE.MeshStandardMaterial({ color: 0xdff8ff, roughness: 0.15, metalness: 0.1, emissive: 0x6fd0ff, emissiveIntensity: 0.35 })
  for (let i = 0; i < 12; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 12)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi) * 0.9 + 0.1, Math.sin(phi) * Math.sin(theta)).normalize()
    const shard = new THREE.Mesh(new THREE.ConeGeometry(s * 0.09, s * 0.55, 5), mat)
    shard.position.copy(dir).multiplyScalar(s * 0.62).add(new THREE.Vector3(0, y, 0))
    shard.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    group.add(shard)
  }
}

// Wispy: a tall, flickering flame on top, with a soft glow.
function addFlame(group, stats, y) {
  const s = stats.size
  const flame = new THREE.Mesh(new THREE.ConeGeometry(s * 0.28, s * 0.9, 8), glowMaterial(0xbdf8ff, 1.6))
  flame.position.y = y + s * 0.95
  const glow = new THREE.Mesh(new THREE.SphereGeometry(s * 0.75, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7af0ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }))
  glow.position.y = y
  group.add(flame, glow)
  group.userData.animateAcc = (t) => {
    flame.scale.set(1 + Math.sin(t * 13) * 0.12, 1 + Math.sin(t * 9 + 1) * 0.2, 1 + Math.cos(t * 11) * 0.12)
    glow.material.opacity = 0.14 + Math.sin(t * 7) * 0.05
  }
}

// Drillbit: a spiralling drill bit out front that spins.
function addHorn(group, stats, y) {
  const s = stats.size
  const bit = new THREE.Mesh(new THREE.ConeGeometry(s * 0.28, s * 0.95, 8), accessoryMaterial(0xdfe5f2, 0.25, 0.8))
  bit.rotation.x = Math.PI / 2
  bit.position.set(0, y - s * 0.05, s * 0.75)
  const ridges = []
  for (let i = 0; i < 3; i++) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(s * (0.24 - i * 0.06), s * 0.03, 5, 14), accessoryMaterial(0x8a93a8, 0.3, 0.8))
    ridge.position.set(0, y - s * 0.05, s * (0.55 + i * 0.22))
    group.add(ridge)
    ridges.push(ridge)
  }
  group.add(bit)
  group.userData.animateAcc = (t) => {
    bit.rotation.y = t * 30
    ridges.forEach((r, i) => (r.rotation.z = t * 20 + i))
  }
}

// Twister: three rings of wind whirling round its body.
function addRings(group, stats, y) {
  const s = stats.size
  const mat = new THREE.MeshBasicMaterial({ color: 0xe0e0ff, transparent: true, opacity: 0.5, depthWrite: false })
  const rings = []
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(s * (0.55 + i * 0.12), s * 0.035, 5, 28), mat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = y + (i - 1) * s * 0.42
    group.add(ring)
    rings.push(ring)
  }
  group.userData.animateAcc = (t) => {
    rings.forEach((r, i) => {
      r.rotation.z = t * (6 + i * 3) * (i % 2 ? -1 : 1)
      r.rotation.x = Math.PI / 2 + Math.sin(t * 3 + i) * 0.18
    })
  }
}

// ---- the shady guests' add-ons (logic/shadyGuests.js) ----

// The paparazzo's camera: a boxy body held up at one side of its face, a big lens with a glinting
// glass, a flash bulb on top and a PRESS card in its hat band.
function addCamera(group, stats, y) {
  const s = stats.size
  const dark = accessoryMaterial(0x1d1b26, 0.35, 0.5)
  const cam = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(s * 0.42, s * 0.28, s * 0.22), dark)
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.11, s * 0.13, s * 0.22, 16), dark)
  lens.rotation.x = Math.PI / 2
  lens.position.set(s * 0.06, 0, s * 0.2)
  const glass = new THREE.Mesh(new THREE.CircleGeometry(s * 0.085, 16), glowMaterial(0x9fd8ff, 0.9))
  glass.position.set(s * 0.06, 0, s * 0.311)
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(s * 0.16, s * 0.1, s * 0.08), glowMaterial(0xfffbe6, 0.4))
  bulb.position.set(-s * 0.1, s * 0.19, 0)
  cam.add(box, lens, glass, bulb)
  cam.position.set(s * 0.3, y + s * 0.12, s * 0.5)
  group.add(cam)
  // A little fedora with a PRESS card.
  const hat = new THREE.Group()
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.5, s * 0.5, s * 0.04, 20), accessoryMaterial(0x2b2838, 0.6))
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.34, s * 0.26, 16), accessoryMaterial(0x2b2838, 0.6))
  crown.position.y = s * 0.13
  const band = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.345, s * 0.345, s * 0.06, 16), accessoryMaterial(0xc9a64a, 0.4, 0.3))
  band.position.y = s * 0.05
  const card = new THREE.Mesh(new THREE.BoxGeometry(s * 0.16, s * 0.1, s * 0.02), accessoryMaterial(0xfff6d8, 0.7))
  card.position.set(s * 0.1, s * 0.12, s * 0.33)
  card.rotation.z = -0.25
  hat.add(brim, crown, band, card)
  hat.position.y = y + s * 0.5
  hat.rotation.z = 0.12
  group.add(hat)
  // The flash bulb pops white when it fires (monster.js leaves `snipe` on userData).
  group.userData.animateAcc = () => {
    const snipe = group.userData.snipe
    bulb.material.emissiveIntensity = snipe?.phase === 'lock' ? 2.4 : snipe?.phase === 'cool' && snipe.t > 2.3 ? 4 : 0.4
  }
}

// The paparazzo's aiming laser, both looks: a thin red line straight out of the lens along +z.
// Hidden until it aims (monster.js's setLaser).
function addCameraLaser(group, stats, y) {
  const s = stats.size
  const length = 34
  const laser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, length, 6),
    new THREE.MeshBasicMaterial({ color: 0xff2a4a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
  )
  laser.rotation.x = Math.PI / 2
  laser.position.set(s * 0.36, y + s * 0.12, s * 0.6 + length / 2)
  laser.visible = false
  group.add(laser)
  group.userData.laser = laser
}

// The gopher: buck teeth, round ears, and a golf flag stuck in its head that flutters.
function addGopher(group, stats, y) {
  const s = stats.size
  const toothMat = accessoryMaterial(0xfffbef, 0.3)
  for (const side of [-1, 1]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(s * 0.09, s * 0.14, s * 0.05), toothMat)
    tooth.position.set(side * s * 0.05, y - s * 0.2, s * 0.46)
    const ear = new THREE.Mesh(new THREE.SphereGeometry(s * 0.12, 12, 8), accessoryMaterial(new THREE.Color(stats.color).multiplyScalar(0.8)))
    ear.scale.set(1, 1, 0.45)
    ear.position.set(side * s * 0.32, y + s * 0.38, -s * 0.02)
    group.add(tooth, ear)
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.015, s * 0.015, s * 0.7, 6), accessoryMaterial(0xf2f2f2, 0.4))
  pole.position.set(-s * 0.1, y + s * 0.65, -s * 0.12)
  pole.rotation.z = 0.15
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(s * 0.26, s * 0.16), new THREE.MeshStandardMaterial({ color: 0xff4d5e, roughness: 0.6, side: THREE.DoubleSide }))
  flag.position.set(-s * 0.03 + s * 0.13, y + s * 0.88, -s * 0.12)
  group.add(pole, flag)
  group.userData.animateAcc = (t) => {
    flag.rotation.y = Math.sin(t * 7) * 0.35
  }
}

// The Bellhop Bandit: a bellhop's pillbox cap, a burglar's mask across its eyes and a loot sack
// on its back that swells with what it has stolen (userData.setSack, from main.js).
function addSack(group, stats, y) {
  const s = stats.size
  const capMat = accessoryMaterial(0xd2334a, 0.5)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.2, s * 0.22, s * 0.18, 16), capMat)
  cap.position.set(0, y + s * 0.7, 0)
  cap.rotation.z = -0.2
  const capBand = new THREE.Mesh(new THREE.TorusGeometry(s * 0.215, s * 0.02, 6, 20), accessoryMaterial(0xf2c14e, 0.3, 0.6))
  capBand.rotation.x = Math.PI / 2
  capBand.position.y = -s * 0.06
  cap.add(capBand)
  const mask = new THREE.Mesh(new THREE.TorusGeometry(s * 0.36, s * 0.06, 6, 24, Math.PI * 0.8), accessoryMaterial(0x16141c, 0.7))
  mask.position.set(0, y + s * 0.2, 0)
  mask.rotation.set(Math.PI / 2, 0, Math.PI * 0.1)
  const sack = new THREE.Group()
  const bag = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 14, 10), accessoryMaterial(0xc9a36a, 0.9))
  bag.scale.set(1, 1.1, 0.9)
  const knot = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.16, 8), accessoryMaterial(0xa8834c, 0.9))
  knot.position.y = s * 0.34
  const coin = new THREE.Mesh(new THREE.TorusGeometry(s * 0.07, s * 0.025, 6, 12), glowMaterial(0x7ff2ff, 0.8))
  coin.position.set(0, 0, s * -0.27)
  sack.add(bag, knot, coin)
  sack.position.set(0, y + s * 0.15, -s * 0.48)
  group.add(cap, mask, sack)
  const setSack = (stolen) => sack.scale.setScalar(0.55 + Math.min(1, stolen / 30) * 0.9)
  setSack(0)
  group.userData.setSack = setSack
  group.userData.animateAcc = (t) => {
    sack.rotation.z = Math.sin(t * 9) * 0.15
  }
}

// The Realist look: the type's own creature (src/beasts.js), one baked mesh on a rigid jelly
// (it squashes and stretches as a whole). Returns the group and its body centre height.
function createCreatureBody(type, stats) {
  const look = beastLook(type)
  const material = createBeastMaterial({ rim: look.rim, roughness: look.rough, metalness: look.metal, skin: look.skin, emissive: stats.boss ? new THREE.Color(stats.color).multiplyScalar(0.05) : 0 })
  const scale = (stats.size / 2) * 1.08
  const geometry = beastGeometry(type, stats.color)
  const group = createJellyBody(geometry, material, stats.edgeColor, 0, { rigid: true, baseScale: scale, bob: look.float })
  group.userData.creature = createBeastAnimator(material, geometry)
  return { group, bodyCenterY: scale }
}

export function createMonsterMesh(type, rng = Math.random) {
  const stats = MONSTER_TYPES[type]
  const creature = useCreatures() && hasBeast(type)
  let group
  let bodyCenterY
  if (creature) {
    ;({ group, bodyCenterY } = createCreatureBody(type, stats))
    group.userData.jelly.body.castShadow = true
  } else {
    const geometry = GEOMETRY_BUILDERS[stats.shape](stats.size)
    const material = createJellyMaterial(stats.color)
    bodyCenterY = monsterBodyCenterY(stats, geometry)
    group = createJellyBody(geometry, material, stats.edgeColor, bodyCenterY)
    group.userData.jelly.body.castShadow = true

    const face = createFace3D({
      shape: stats.shape,
      size: stats.size,
      bodyCenterY,
      bodyColor: stats.color,
      options: pickFaceOptions(rng),
      faceTypeScale: FACE_SCALE_BY_TYPE[type] ?? 1,
    })
    group.add(face.group)
    group.userData.face3d = face
  }
  const { body } = group.userData.jelly

  const chaseIndicator = createIndicatorSprite('!')
  const searchIndicator = createIndicatorSprite('?')
  chaseIndicator.position.set(0, stats.size + 0.3, 0)
  searchIndicator.position.set(0, stats.size + 0.3, 0)
  // Bigger bodies (the bosses) get proportionally bigger "!"/"?" so they still read.
  const indicatorScale = Math.max(1, stats.size / 1.5)
  chaseIndicator.scale.multiplyScalar(indicatorScale)
  searchIndicator.scale.multiplyScalar(indicatorScale)
  group.add(chaseIndicator)
  group.add(searchIndicator)

  if (stats.boss) {
    // A flat red ring on the ground that a boss's slam/spin wind-up
    // shows (scaled to the move's radius, see monster.js); hidden until then.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.93, 1, 56),
      new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.06
    ring.visible = false
    group.add(ring)
    group.userData.telegraph = ring
  }

  // The mirror is a gameplay shield (it cracks), so creatures carry it too; their other
  // add-ons (limbs, wings, claws, caps, fuses...) are part of the creature itself.
  if (stats.accessory === 'mirror') addMirror(group, stats, bodyCenterY)
  // The paparazzo's aiming laser is gameplay (it shows where the shot goes), so creatures carry it too.
  if (stats.behavior === 'snipe') addCameraLaser(group, stats, bodyCenterY)
  if (!creature) {
    if (stats.accessory === 'limbs') addLimbs(group, stats)
    if (stats.accessory === 'lure') addLure(group, stats)
    if (stats.accessory === 'spikes') addSpikes(group, stats, bodyCenterY)
    if (stats.accessory === 'eelBody') addEelBody(group, stats, bodyCenterY)
    const crazyAccessory = { wings: addWings, claws: addClaws, cap: addCap, halo: addHalo, fuse: addFuse, icicles: addIcicles, flame: addFlame, horn: addHorn, rings: addRings, camera: addCamera, gopher: addGopher, sack: addSack }[stats.accessory]
    if (crazyAccessory) crazyAccessory(group, stats, bodyCenterY)
  }

  group.userData.body = body
  group.userData.type = type
  group.userData.indicators = { chase: chaseIndicator, search: searchIndicator }
  group.userData.indicatorElapsed = null

  return group
}
